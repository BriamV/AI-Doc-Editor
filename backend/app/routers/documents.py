"""
Document listing API endpoints.

Provides endpoints for listing and managing user documents in the RAG knowledge base.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import get_db
from app.models.document import Document, DocumentStatus
from app.models.document_schemas import DocumentListResponse, DocumentResponse
from app.services.auth import AuthService


router = APIRouter(prefix="/api", tags=["documents"])
security = HTTPBearer()


def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    Extract user ID from JWT token.

    Returns user_id from token payload.
    Raises HTTPException 401 if token is invalid.
    """
    try:
        auth_service = AuthService()
        user_data = auth_service.verify_token(credentials.credentials)
        return user_data["user_id"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.get("/documents", response_model=DocumentListResponse)
async def list_documents(
    file_type: Optional[str] = Query(None, description="Filter by file type (pdf, docx, md)"),
    status: Optional[str] = Query(
        None, description="Filter by status (processing, completed, failed)"
    ),
    limit: int = Query(20, ge=1, le=100, description="Number of items per page"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> DocumentListResponse:
    """
    List user's uploaded documents with optional filtering and pagination.

    **Query Parameters**:
    - `file_type`: Filter by file extension (pdf, docx, md)
    - `status`: Filter by processing status (processing, completed, failed)
    - `limit`: Number of documents per page (1-100, default 20)
    - `offset`: Pagination offset (default 0)

    **Returns**:
    - List of documents with metadata
    - Total count for pagination
    - Current limit and offset values

    **Authorization**: Requires valid JWT token (user must be authenticated)
    """
    # Convert user_id string to UUID
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid user ID in token")

    # Build query for user's documents (exclude soft-deleted)
    query = db.query(Document).filter(Document.user_id == user_uuid, Document.deleted_at.is_(None))

    # Apply filters
    if file_type:
        query = query.filter(Document.file_type == file_type.lower())

    if status:
        try:
            status_enum = DocumentStatus(status.lower())
            query = query.filter(Document.status == status_enum)
        except ValueError:
            # Invalid status, ignore filter
            pass

    # Get total count before pagination
    total = query.count()

    # Apply pagination and order by upload date (newest first)
    documents = query.order_by(Document.uploaded_at.desc()).offset(offset).limit(limit).all()

    # Convert to response models
    document_responses = [DocumentResponse.from_orm(doc) for doc in documents]

    return DocumentListResponse(
        documents=document_responses, total=total, limit=limit, offset=offset
    )


@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> DocumentResponse:
    """
    Get a single document by ID.

    **Path Parameters**:
    - `document_id`: UUID of the document

    **Returns**:
    - Document metadata

    **Authorization**: Requires valid JWT token
    **Ownership**: User must own the document (403 if not)

    **Errors**:
    - 404: Document not found or soft-deleted
    - 403: User does not own this document
    """
    # Convert user_id to UUID
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid user ID in token")

    # Convert document_id to UUID
    try:
        doc_uuid = UUID(document_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid document ID format")

    # Query document
    document = (
        db.query(Document)
        .filter(
            Document.id == doc_uuid,
            Document.deleted_at.is_(None),
        )
        .first()
    )

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Check ownership
    if document.user_id != user_uuid:
        raise HTTPException(
            status_code=403, detail="You do not have permission to access this document"
        )

    return DocumentResponse.from_orm(document)
