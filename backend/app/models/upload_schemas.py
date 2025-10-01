"""
Pydantic schemas for upload endpoints
T-04-ST1: Request/response models for file upload
"""

from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from enum import Enum


class DocumentTypeEnum(str, Enum):
    """Supported document types"""
    PDF = "pdf"
    DOCX = "docx"
    MARKDOWN = "md"


class DocumentStatusEnum(str, Enum):
    """Document processing status"""
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    INDEXED = "indexed"
    FAILED = "failed"


class UploadMetadataRequest(BaseModel):
    """
    Optional metadata that can be provided during upload
    Sent as form fields alongside the file
    """
    title: Optional[str] = Field(None, max_length=500, description="Document title")
    description: Optional[str] = Field(None, max_length=2000, description="Document description")

    @validator("title", "description")
    def sanitize_strings(cls, v):
        """Basic sanitization of string inputs"""
        if v:
            # Remove leading/trailing whitespace
            v = v.strip()
            # Remove null bytes
            v = v.replace("\x00", "")
        return v if v else None


class UploadValidationResponse(BaseModel):
    """Response model for validation errors"""
    success: bool = False
    error: str = Field(..., description="Error message")
    details: Optional[dict] = Field(None, description="Additional error details")


class DocumentResponse(BaseModel):
    """
    Response model for successfully uploaded document
    """
    id: str = Field(..., description="Unique document identifier")
    original_filename: str = Field(..., description="Original filename")
    file_type: str = Field(..., description="File type (pdf, docx, md)")
    mime_type: str = Field(..., description="MIME type")
    file_size_bytes: int = Field(..., description="File size in bytes")
    title: Optional[str] = Field(None, description="Document title")
    description: Optional[str] = Field(None, description="Document description")
    status: str = Field(..., description="Processing status")
    user_id: Optional[str] = Field(None, description="User ID who uploaded")
    user_email: Optional[str] = Field(None, description="User email who uploaded")
    uploaded_at: datetime = Field(..., description="Upload timestamp")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "original_filename": "document.pdf",
                "file_type": "pdf",
                "mime_type": "application/pdf",
                "file_size_bytes": 1048576,
                "title": "My Document",
                "description": "Important document",
                "status": "uploaded",
                "user_id": "user-123",
                "user_email": "user@example.com",
                "uploaded_at": "2025-10-01T12:00:00Z"
            }
        }


class UploadSuccessResponse(BaseModel):
    """
    Success response wrapper for upload operations
    """
    success: bool = True
    message: str = "File uploaded successfully"
    document: DocumentResponse

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "File uploaded successfully",
                "document": {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "original_filename": "document.pdf",
                    "file_type": "pdf",
                    "mime_type": "application/pdf",
                    "file_size_bytes": 1048576,
                    "title": "My Document",
                    "status": "uploaded",
                    "uploaded_at": "2025-10-01T12:00:00Z"
                }
            }
        }


class DocumentListResponse(BaseModel):
    """
    Response model for listing documents
    """
    total: int = Field(..., description="Total number of documents")
    documents: list[DocumentResponse] = Field(..., description="List of documents")
    page: int = Field(1, description="Current page number")
    page_size: int = Field(20, description="Items per page")


class DocumentQueryFilters(BaseModel):
    """
    Filters for querying documents
    """
    user_id: Optional[str] = None
    file_type: Optional[DocumentTypeEnum] = None
    status: Optional[DocumentStatusEnum] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    page: int = Field(1, ge=1, description="Page number (starts at 1)")
    page_size: int = Field(20, ge=1, le=100, description="Items per page (max 100)")
