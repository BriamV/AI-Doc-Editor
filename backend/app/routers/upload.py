"""
Upload endpoints for document management
T-04-ST1: REST API for file uploads with validation
"""

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.db.session import get_db
from app.services.upload_service import UploadService
from app.services.auth import get_current_user, User
from app.models.upload_schemas import (
    UploadSuccessResponse,
    UploadValidationResponse,
    DocumentResponse,
    DocumentListResponse,
)

router = APIRouter()


@router.post(
    "/upload",
    response_model=UploadSuccessResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {"description": "File uploaded successfully", "model": UploadSuccessResponse},
        400: {"description": "Invalid file or validation error", "model": UploadValidationResponse},
        401: {"description": "Authentication required"},
        413: {"description": "File too large"},
        500: {"description": "Internal server error"},
    },
    summary="Upload a document",
    description="""
    Upload a document file (PDF, DOCX, or Markdown) for processing.

    **Supported file types:**
    - PDF (.pdf)
    - Microsoft Word (.docx)
    - Markdown (.md)

    **File size limit:** 10 MB

    **Authentication:** Requires valid JWT token from OAuth login.

    **Audit:** All upload operations are logged in the audit system.
    """,
)
async def upload_document(
    request: Request,
    file: UploadFile = File(..., description="Document file to upload"),
    title: Optional[str] = Form(None, description="Optional document title"),
    description: Optional[str] = Form(None, description="Optional document description"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a document with validation and metadata

    **Request:**
    - file: Document file (multipart/form-data)
    - title: Optional document title (form field)
    - description: Optional document description (form field)

    **Response:**
    - 201: Document uploaded successfully
    - 400: Validation error (invalid file type, size, or format)
    - 401: Authentication required
    - 500: Server error

    **Security:**
    - Requires OAuth authentication
    - Validates file type and size
    - Logs all operations to audit system
    """
    # Extract user information from token
    user_id = current_user.id
    user_email = current_user.email

    # Extract client IP for audit
    client_ip = request.client.host if request.client else None

    # Initialize upload service
    upload_service = UploadService()

    try:
        # Upload document (includes validation, storage, and database operations)
        document = await upload_service.upload_document(
            file=file,
            session=db,
            user_id=user_id,
            user_email=user_email,
            title=title,
            description=description,
            ip_address=client_ip,
        )

        # Convert to response model
        document_response = DocumentResponse(
            id=document.id,
            original_filename=document.original_filename,
            file_type=document.file_type,
            mime_type=document.mime_type,
            file_size_bytes=document.file_size_bytes,
            title=document.title,
            description=document.description,
            status=document.status,
            user_id=document.user_id,
            user_email=document.user_email,
            uploaded_at=document.uploaded_at,
        )

        return UploadSuccessResponse(
            success=True, message="File uploaded successfully", document=document_response
        )

    except HTTPException:
        # Re-raise HTTP exceptions (validation errors, etc.)
        raise
    except Exception as e:
        # Log unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload document: {str(e)}",
        )


@router.get(
    "/documents",
    response_model=DocumentListResponse,
    summary="List uploaded documents",
    description="Retrieve a list of documents uploaded by the authenticated user",
)
async def list_documents(
    file_type: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List documents with optional filters

    **Query Parameters:**
    - file_type: Filter by file type (pdf, docx, md)
    - status: Filter by status (uploaded, processing, indexed, failed)
    - page: Page number (default: 1)
    - page_size: Items per page (default: 20, max: 100)

    **Response:**
    - List of documents with pagination metadata
    """
    user_id = current_user.id

    # Calculate offset
    offset = (page - 1) * page_size

    # Limit page size
    if page_size > 100:
        page_size = 100

    upload_service = UploadService()

    try:
        documents, total = await upload_service.list_documents(
            session=db,
            user_id=user_id,
            file_type=file_type,
            status=status,
            limit=page_size,
            offset=offset,
        )

        # Convert to response models
        document_responses = [
            DocumentResponse(
                id=doc.id,
                original_filename=doc.original_filename,
                file_type=doc.file_type,
                mime_type=doc.mime_type,
                file_size_bytes=doc.file_size_bytes,
                title=doc.title,
                description=doc.description,
                status=doc.status,
                user_id=doc.user_id,
                user_email=doc.user_email,
                uploaded_at=doc.uploaded_at,
            )
            for doc in documents
        ]

        return DocumentListResponse(
            total=total, documents=document_responses, page=page, page_size=page_size
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve documents: {str(e)}",
        )


@router.get(
    "/documents/{document_id}",
    response_model=DocumentResponse,
    summary="Get document details",
    description="Retrieve details of a specific document by ID",
)
async def get_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get document by ID

    **Path Parameters:**
    - document_id: Unique document identifier

    **Response:**
    - 200: Document details
    - 404: Document not found
    """
    user_id = current_user.id

    upload_service = UploadService()

    try:
        document = await upload_service.get_document_by_id(
            document_id=document_id,
            session=db,
            user_id=user_id,  # Access control: users can only access their own documents
        )

        if not document:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

        return DocumentResponse(
            id=document.id,
            original_filename=document.original_filename,
            file_type=document.file_type,
            mime_type=document.mime_type,
            file_size_bytes=document.file_size_bytes,
            title=document.title,
            description=document.description,
            status=document.status,
            user_id=document.user_id,
            user_email=document.user_email,
            uploaded_at=document.uploaded_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve document: {str(e)}",
        )


@router.delete(
    "/documents/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a document",
    description="Delete a document (soft delete by default)",
)
async def delete_document(
    document_id: str,
    hard_delete: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete document

    **Path Parameters:**
    - document_id: Unique document identifier

    **Query Parameters:**
    - hard_delete: If true, permanently delete the file (default: false)

    **Response:**
    - 204: Document deleted successfully
    - 404: Document not found
    """
    user_id = current_user.id

    upload_service = UploadService()

    try:
        deleted = await upload_service.delete_document(
            document_id=document_id, session=db, user_id=user_id, hard_delete=hard_delete
        )

        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

        return None  # 204 No Content

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document: {str(e)}",
        )
