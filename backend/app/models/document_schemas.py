"""
Pydantic schemas for Document API endpoints.

Defines request/response models for document listing and management.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field


class DocumentResponse(BaseModel):
    """Document response model (matches upload response)."""

    id: UUID
    original_filename: str
    file_type: str
    mime_type: str
    file_size_bytes: int
    title: Optional[str] = None
    description: Optional[str] = None
    status: str
    user_id: UUID
    user_email: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    """Response model for document listing endpoint."""

    documents: List[DocumentResponse]
    total: int
    limit: int
    offset: int


class DocumentFilters(BaseModel):
    """Query parameters for filtering documents."""

    file_type: Optional[str] = Field(None, description="Filter by file type (pdf, docx, md)")
    status: Optional[str] = Field(
        None, description="Filter by status (processing, completed, failed)"
    )
    limit: int = Field(20, ge=1, le=100, description="Number of items per page")
    offset: int = Field(0, ge=0, description="Pagination offset")
