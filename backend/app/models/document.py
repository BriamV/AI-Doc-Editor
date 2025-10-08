"""
Document database model for RAG pipeline.

This module defines the SQLAlchemy ORM model for documents uploaded
to the RAG (Retrieval-Augmented Generation) pipeline.
"""

from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum

from app.db.session import Base


class DocumentStatus(str, enum.Enum):
    """Document processing status enumeration."""

    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Document(Base):
    """
    Document model for RAG pipeline uploads.

    Stores metadata and status for documents uploaded to the knowledge base.
    Actual document content is stored in ChromaDB vector database.
    """

    __tablename__ = "documents"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # File metadata
    original_filename = Column(String(255), nullable=False)
    file_type = Column(String(10), nullable=False)  # "pdf", "docx", "md"
    mime_type = Column(String(100), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)

    # Document metadata
    title = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)

    # Processing status
    status = Column(
        Enum(DocumentStatus, name="document_status"),
        nullable=False,
        default=DocumentStatus.PROCESSING,
        index=True,
    )

    # Ownership
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    user_email = Column(String(255), nullable=False)

    # Timestamps
    uploaded_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    processed_at = Column(DateTime, nullable=True)

    # Soft delete
    deleted_at = Column(DateTime, nullable=True, index=True)

    def __repr__(self):
        return f"<Document(id={self.id}, filename={self.original_filename}, status={self.status})>"
