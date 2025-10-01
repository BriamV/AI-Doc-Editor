"""
Document models for file upload and RAG system
T-04: File ingesta RAG pipeline
"""

from sqlalchemy import Column, String, DateTime, Text, Integer, Index, text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from enum import Enum
import uuid

Base = declarative_base()


class DocumentType(str, Enum):
    """Enumeration of supported document types"""

    PDF = "pdf"
    DOCX = "docx"
    MARKDOWN = "md"


class DocumentStatus(str, Enum):
    """Document processing status"""

    UPLOADED = "uploaded"
    PROCESSING = "processing"
    EMBEDDING_GENERATED = "embedding_generated"  # T-04-ST3: Embeddings created
    INDEXED = "indexed"
    FAILED = "failed"


class Document(Base):
    """
    Document metadata model for uploaded files
    Tracks document lifecycle from upload through RAG processing
    """

    __tablename__ = "documents"

    # Primary key - using UUID for better distribution
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Document identification
    original_filename = Column(String(255), nullable=False)
    file_type = Column(String(10), nullable=False, index=True)  # pdf, docx, md
    mime_type = Column(String(100), nullable=False)

    # File storage
    storage_path = Column(String(500), nullable=False)  # Path to stored file
    file_size_bytes = Column(Integer, nullable=False)  # File size in bytes

    # Document metadata
    title = Column(String(500), nullable=True)  # Extracted or user-provided title
    description = Column(Text, nullable=True)  # Optional description

    # Processing status
    status = Column(String(20), nullable=False, default=DocumentStatus.UPLOADED.value, index=True)
    processing_error = Column(Text, nullable=True)  # Error message if processing failed

    # RAG integration
    chunk_count = Column(Integer, nullable=True)  # Number of text chunks generated
    embedding_model = Column(String(100), nullable=True)  # OpenAI model used for embeddings
    embedding_dimensions = Column(Integer, nullable=True)  # Dimensions of embedding vectors (T-04-ST3)
    vector_store_id = Column(String(100), nullable=True)  # ChromaDB collection ID

    # User context (from OAuth authentication)
    user_id = Column(String(36), nullable=True, index=True)
    user_email = Column(String(255), nullable=True, index=True)

    # Temporal data
    uploaded_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=text("CURRENT_TIMESTAMP"),
        index=True,
    )

    processed_at = Column(DateTime, nullable=True)  # When RAG processing completed
    last_accessed_at = Column(DateTime, nullable=True)  # Last time document was queried

    # Soft delete support (documents can be marked as deleted)
    deleted_at = Column(DateTime, nullable=True, index=True)

    # Indexes for common queries
    __table_args__ = (
        Index("idx_user_status", "user_id", "status"),
        Index("idx_user_uploaded", "user_id", "uploaded_at"),
        Index("idx_file_type_status", "file_type", "status"),
    )

    def __repr__(self):
        return f"<Document(id={self.id}, filename={self.original_filename}, status={self.status})>"

    def to_dict(self):
        """Convert document to dictionary for JSON serialization"""
        return {
            "id": self.id,
            "original_filename": self.original_filename,
            "file_type": self.file_type,
            "mime_type": self.mime_type,
            "file_size_bytes": self.file_size_bytes,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "processing_error": self.processing_error,
            "chunk_count": self.chunk_count,
            "embedding_model": self.embedding_model,
            "embedding_dimensions": self.embedding_dimensions,
            "user_id": self.user_id,
            "user_email": self.user_email,
            "uploaded_at": self.uploaded_at.isoformat() if self.uploaded_at else None,
            "processed_at": self.processed_at.isoformat() if self.processed_at else None,
            "last_accessed_at": (
                self.last_accessed_at.isoformat() if self.last_accessed_at else None
            ),
            "deleted_at": self.deleted_at.isoformat() if self.deleted_at else None,
        }
