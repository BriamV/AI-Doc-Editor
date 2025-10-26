"""
Document upload API endpoint.

Handles file uploads for RAG (Retrieval-Augmented Generation) pipeline.
Supports .pdf, .docx, and .md files with JWT authentication.

T-04 ST1: Upload Endpoint for Document RAG Processing
"""

from typing import Dict, Any
from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    HTTPException,
    status,
    BackgroundTasks,
    Form,
    Request,
)
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
import logging
from datetime import datetime

from app.db.session import get_db
from app.services.auth import AuthService
from app.services.document_service import DocumentService
from app.services.rag_processing_service import RAGProcessingService
from app.services.config import ConfigService
from app.services.audit import AuditService
from app.models.audit import AuditActionType
from app.routers.credentials import get_user_openai_key

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["upload"])
security = HTTPBearer()


async def process_document_in_background(
    document_id: str, file_path: str, user_id: str, api_key: str = None
):
    """
    Background task to process document through RAG pipeline.

    Args:
        document_id: Document UUID
        file_path: Full path to uploaded file
        user_id: User UUID
        api_key: Optional OpenAI API key (user-specific or None for global)
    """
    from app.db.session import get_async_session

    logger.info(f"[Background] Starting RAG processing for document: {document_id}")

    try:
        # Create RAG processing service with user API key (or global fallback)
        rag_service = RAGProcessingService(api_key=api_key)

        # Check if embedding service is available (has valid API key)
        if not rag_service.embedding_service.is_available():
            error_msg = (
                "No OpenAI API key available. "
                "Please configure your API key in user settings or contact administrator."
            )
            logger.error(f"[Background] {error_msg} (document: {document_id})")

            # Update document status to failed with clear error message
            async for db in get_async_session():
                document_service = DocumentService()
                await document_service.update_document_status(
                    db=db,
                    document_id=document_id,
                    status="failed",
                    metadata={"error": error_msg, "reason": "missing_api_key"},
                )
                break

            return  # Exit gracefully without crashing

        # Get database session
        async for db in get_async_session():
            # Process document through RAG pipeline
            result = await rag_service.process_document(
                db=db,
                document_id=document_id,
                file_path=file_path,
                user_id=user_id,
                collection_name="documents",
            )

            logger.info(
                f"[Background] RAG processing completed for {document_id}: "
                f"{result['chunks_created']} chunks, "
                f"{result['embeddings_generated']} embeddings"
            )

            break  # Exit after processing

    except ValueError as e:
        # Handle validation errors (empty text, invalid input, etc.)
        error_msg = f"Validation error: {str(e)}"
        logger.error(f"[Background] {error_msg} (document: {document_id})")

        async for db in get_async_session():
            document_service = DocumentService()
            await document_service.update_document_status(
                db=db,
                document_id=document_id,
                status="failed",
                metadata={"error": error_msg, "reason": "validation_error"},
            )
            break

    except Exception as e:
        # Handle unexpected errors
        error_msg = f"Processing error: {str(e)}"
        logger.error(f"[Background] RAG processing failed for {document_id}: {error_msg}")

        async for db in get_async_session():
            document_service = DocumentService()
            await document_service.update_document_status(
                db=db,
                document_id=document_id,
                status="failed",
                metadata={"error": error_msg, "reason": "processing_error"},
            )
            break


def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    Extract user ID from JWT token.

    Returns:
        user_id from token payload

    Raises:
        HTTPException 401 if token is invalid
    """
    try:
        auth_service = AuthService()
        user_data = auth_service.verify_token(credentials.credentials)
        return user_data["user_id"]
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user_email(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """
    Extract user email from JWT token.

    Returns:
        user email from token payload

    Raises:
        HTTPException 401 if token is invalid
    """
    try:
        auth_service = AuthService()
        user_data = auth_service.verify_token(credentials.credentials)
        return user_data.get("email", "unknown@example.com")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    request: Request,
    file: UploadFile = File(..., description="Document file to upload (.pdf, .docx, .md)"),
    consent_given: str = Form(..., description="User consent for AI processing (true/false)"),
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
    user_email: str = Depends(get_current_user_email),
) -> Dict[str, Any]:
    """
    Upload a document for RAG processing.

    **Request:**
    - `file`: Multipart form-data file upload
    - `consent_given`: User consent for AI processing (string "true" or "false")
    - Supported formats: PDF (.pdf), Word (.docx), Markdown (.md)
    - Maximum file size: 10MB

    **Response:**
    ```json
    {
      "document_id": "uuid-here",
      "filename": "example.pdf",
      "file_type": "pdf",
      "file_size": 1024000,
      "status": "processing",
      "created_at": "2025-10-09T04:00:00Z"
    }
    ```

    **Authorization:** Requires valid JWT token (Bearer token in Authorization header)

    **Errors:**
    - 400: Invalid file type, format, or consent not given
    - 401: Unauthorized (missing or invalid JWT token)
    - 413: File too large (exceeds 10MB)
    - 500: Server error during upload

    **Security:**
    - Files are validated by extension AND MIME type
    - Filenames are sanitized to prevent path traversal
    - Files are stored in user-specific subdirectories
    - JWT token required for authentication
    """
    try:
        # Log upload attempt
        logger.info(f"Upload attempt by user {user_id}: {file.filename} ({file.content_type})")

        # T-24 ST3: Convert consent string to boolean
        consent_bool = consent_given.lower() == "true"

        # Get IP address from request
        ip_address = request.client.host if request.client else None

        # Create services (T-03 ST2: Quota validation integration)
        config_service = ConfigService()
        document_service = DocumentService(config_service=config_service)
        audit_service = AuditService()

        # T-03 ST2: Check user quota BEFORE processing file
        file_content = await file.read()
        file_size = len(file_content)
        await file.seek(0)  # Reset file pointer for later reading

        is_within_quota, quota_error = await document_service.check_user_quota(
            db=db, user_id=user_id, additional_file_size=file_size
        )

        if not is_within_quota:
            logger.warning(f"Quota violation for user {user_id}: {quota_error}")
            raise HTTPException(status_code=400, detail=quota_error)

        # T-24 ST3: Upload document with consent tracking
        document_metadata = await document_service.upload_document(
            db=db,
            file=file,
            user_id=user_id,
            user_email=user_email,
            consent_given=consent_bool,
            consent_ip_address=ip_address,
        )

        logger.info(
            f"Upload successful: {document_metadata['document_id']} by user {user_id} "
            f"(consent: {consent_bool})"
        )

        # T-24 ST3: Log consent event to audit system (WORM)
        consent_action = (
            AuditActionType.DOCUMENT_CONSENT_GIVEN
            if consent_bool
            else AuditActionType.DOCUMENT_CONSENT_REJECTED
        )

        await audit_service.log_event(
            action_type=consent_action,
            resource_type="document",
            resource_id=document_metadata["document_id"],
            user_id=user_id,
            user_email=user_email,
            ip_address=ip_address,
            user_agent=request.headers.get("user-agent"),
            description=f"User {'consented to' if consent_bool else 'rejected'} AI processing for document: {file.filename}",
            details={
                "document_id": document_metadata["document_id"],
                "filename": file.filename,
                "file_type": document_metadata["file_type"],
                "consent_version": "1.0",
                "consent_timestamp": datetime.utcnow().isoformat(),
                "consent_given": consent_bool,
            },
            status="success",
        )

        logger.info(
            f"Consent audit logged: {consent_action.value} for document {document_metadata['document_id']}"
        )

        # Retrieve user's OpenAI API key (prioritize user key, fallback to global)
        user_api_key = None
        try:
            user_api_key = get_user_openai_key(user_id)
            logger.info(
                f"Using user-specific API key for document {document_metadata['document_id']}"
            )
        except HTTPException as e:
            # User hasn't configured their own API key - will use global key
            if e.status_code == status.HTTP_402_PAYMENT_REQUIRED:
                logger.info(
                    f"No user API key found for {user_id}, will use global key if available"
                )
            else:
                # Re-raise unexpected HTTP exceptions
                raise

        # Schedule RAG processing in background
        # Get full file path from relative path
        upload_dir = document_service.upload_dir
        file_path = str(upload_dir / file.filename.split("/")[-1])

        # Find the actual file path from the uploads directory
        # The file is stored in user_id[:8]/timestamp_uniqueid_filename.ext
        user_subdirs = list(upload_dir.glob(f"{user_id[:8]}/*"))
        if user_subdirs:
            # Get the most recently modified file
            latest_file = max(user_subdirs, key=lambda p: p.stat().st_mtime)
            file_path = str(latest_file)

            logger.info(f"Scheduling RAG processing for: {file_path}")

            background_tasks.add_task(
                process_document_in_background,
                document_id=document_metadata["document_id"],
                file_path=file_path,
                user_id=user_id,
                api_key=user_api_key,
            )

        return document_metadata

    except HTTPException:
        # Re-raise HTTP exceptions (validation errors, etc.)
        raise
    except Exception as e:
        logger.error(f"Upload failed for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload document. Please try again.",
        )


@router.get("/upload/health")
async def upload_health_check() -> Dict[str, str]:
    """
    Health check endpoint for upload service.

    Returns:
        Service status information
    """
    return {
        "service": "upload",
        "status": "operational",
        "supported_formats": "pdf, docx, md",
        "max_file_size": "10MB",
    }
