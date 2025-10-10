"""
Document upload API endpoint.

Handles file uploads for RAG (Retrieval-Augmented Generation) pipeline.
Supports .pdf, .docx, and .md files with JWT authentication.

T-04 ST1: Upload Endpoint for Document RAG Processing
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.db.session import get_db
from app.services.auth import AuthService
from app.services.document_service import DocumentService
from app.services.rag_processing_service import RAGProcessingService

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
        api_key: Optional OpenAI API key
    """
    from app.db.session import get_async_session

    logger.info(f"[Background] Starting RAG processing for document: {document_id}")

    try:
        # Create RAG processing service
        rag_service = RAGProcessingService(api_key=api_key)

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

    except Exception as e:
        logger.error(f"[Background] RAG processing failed for {document_id}: {str(e)}")


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
    file: UploadFile = File(..., description="Document file to upload (.pdf, .docx, .md)"),
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
    user_email: str = Depends(get_current_user_email),
) -> Dict[str, Any]:
    """
    Upload a document for RAG processing.

    **Request:**
    - `file`: Multipart form-data file upload
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
    - 400: Invalid file type or format
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

        # Create document service
        document_service = DocumentService()

        # Upload document (save file + create DB record)
        document_metadata = await document_service.upload_document(
            db=db,
            file=file,
            user_id=user_id,
            user_email=user_email,
        )

        logger.info(f"Upload successful: {document_metadata['document_id']} by user {user_id}")

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
