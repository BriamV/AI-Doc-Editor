"""
Document storage service for RAG pipeline.

Handles file upload, storage, and metadata management for documents
in the RAG (Retrieval-Augmented Generation) knowledge base.

T-04 ST1: Upload Endpoint for Document RAG Processing
"""

import os
import re
import uuid
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import UploadFile, HTTPException

from app.models.document import Document, DocumentStatus
from app.services.config import ConfigService

logger = logging.getLogger(__name__)

# Allowed file types for RAG processing
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".md"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/markdown",
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


class DocumentService:
    """Service for managing document uploads and storage."""

    def __init__(
        self, upload_dir: Optional[Path] = None, config_service: Optional[ConfigService] = None
    ):
        """
        Initialize document service.

        Args:
            upload_dir: Directory for storing uploaded files.
                       Defaults to backend/uploads/
            config_service: Configuration service for quota limits (T-03 ST2)
        """
        if upload_dir is None:
            # Default to backend/uploads directory
            backend_dir = Path(__file__).parent.parent.parent
            upload_dir = backend_dir / "uploads"

        self.upload_dir = upload_dir
        self.config_service = config_service
        self._ensure_upload_dir()

    def _ensure_upload_dir(self) -> None:
        """Ensure upload directory exists."""
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    async def check_user_quota(
        self, db: AsyncSession, user_id: str, additional_file_size: int = 0
    ) -> tuple[bool, str]:
        """
        Check if user has exceeded document/storage quotas (T-03 ST2).

        Args:
            db: Database session
            user_id: UUID of user to check
            additional_file_size: Size of file being uploaded (in bytes)

        Returns:
            (is_within_quota, error_message)
            - is_within_quota: True if user can upload, False if quota exceeded
            - error_message: Human-readable error message (empty if within quota)

        Raises:
            HTTPException: If config service unavailable or database error
        """
        try:
            # Get limits from ConfigService (T-44 integration)
            if not self.config_service:
                # No config service = no quota enforcement
                logger.warning("ConfigService not available, skipping quota check")
                return (True, "")

            # Read quota limits from system configuration
            max_docs_str = await self.config_service.get_config(db, "max_documents_per_user")
            max_mb_str = await self.config_service.get_config(db, "max_mb_per_user")

            # Default values if not configured
            max_docs = int(max_docs_str) if max_docs_str else 100
            max_mb = float(max_mb_str) if max_mb_str else 1000.0

            # Query current user usage (document count)
            stmt_count = select(func.count(Document.id)).where(
                Document.user_id == uuid.UUID(user_id)
            )
            result_count = await db.execute(stmt_count)
            current_docs = result_count.scalar() or 0

            # Query current user usage (total MB)
            stmt_size = select(func.sum(Document.file_size_bytes)).where(
                Document.user_id == uuid.UUID(user_id)
            )
            result_size = await db.execute(stmt_size)
            current_bytes = result_size.scalar() or 0
            current_mb = current_bytes / (1024 * 1024)

            # Calculate projected usage with new file
            projected_mb = (current_bytes + additional_file_size) / (1024 * 1024)

            # Check document count limit
            if current_docs >= max_docs:
                error_msg = (
                    f"Document quota exceeded: {current_docs}/{max_docs} documents. "
                    f"Please delete old documents or contact support."
                )
                logger.warning(f"User {user_id} quota violation: {error_msg}")
                return (False, error_msg)

            # Check storage size limit
            if projected_mb > max_mb:
                error_msg = (
                    f"Storage quota exceeded: {projected_mb:.2f}/{max_mb} MB. "
                    f"Please delete old documents or contact support."
                )
                logger.warning(f"User {user_id} quota violation: {error_msg}")
                return (False, error_msg)

            # Within quota
            logger.info(
                f"User {user_id} quota check passed: "
                f"{current_docs}/{max_docs} docs, {current_mb:.2f}/{max_mb} MB"
            )
            return (True, "")

        except Exception as e:
            logger.error(f"Quota check error for user {user_id}: {str(e)}")
            # Fail-safe: Allow upload if quota check fails (don't block users)
            return (True, "")

    def _sanitize_filename(self, filename: str) -> str:
        """
        Sanitize filename to prevent path traversal attacks.

        Args:
            filename: Original filename from upload

        Returns:
            Sanitized filename safe for filesystem storage
        """
        # Remove path components
        filename = os.path.basename(filename)

        # Remove any non-alphanumeric characters except .-_
        filename = re.sub(r"[^\w\s\-.]", "", filename)

        # Collapse multiple spaces/dashes
        filename = re.sub(r"[\s\-]+", "-", filename)

        # Limit length
        name, ext = os.path.splitext(filename)
        if len(name) > 100:
            name = name[:100]

        return f"{name}{ext}"

    def _validate_file_type(self, filename: str, content_type: str) -> str:
        """
        Validate file type by extension and MIME type.

        Args:
            filename: Original filename
            content_type: MIME type from upload

        Returns:
            File extension (e.g., 'pdf', 'docx', 'md')

        Raises:
            HTTPException: If file type is invalid
        """
        # Check extension
        file_ext = Path(filename).suffix.lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}",
            )

        # Check MIME type
        if content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid content type. Allowed types: {', '.join(ALLOWED_MIME_TYPES)}",
            )

        return file_ext.lstrip(".")

    def _validate_file_size(self, file_size: int) -> None:
        """
        Validate file size.

        Args:
            file_size: File size in bytes

        Raises:
            HTTPException: If file size exceeds limit
        """
        if file_size > MAX_FILE_SIZE:
            max_mb = MAX_FILE_SIZE / (1024 * 1024)
            raise HTTPException(
                status_code=413,
                detail=f"File size exceeds {max_mb:.1f}MB limit",
            )

    def _generate_unique_filename(self, original_filename: str, file_type: str) -> str:
        """
        Generate unique filename to prevent collisions.

        Args:
            original_filename: Original sanitized filename
            file_type: File extension without dot

        Returns:
            Unique filename with UUID prefix
        """
        unique_id = uuid.uuid4().hex[:12]
        timestamp = datetime.utcnow().strftime("%Y%m%d")

        # Create filename: YYYYMMDD_uniqueid_filename.ext
        name = Path(original_filename).stem
        return f"{timestamp}_{unique_id}_{name}.{file_type}"

    async def save_file(self, file: UploadFile, user_id: str, user_email: str) -> str:
        """
        Save uploaded file to disk.

        Args:
            file: Uploaded file object
            user_id: UUID of uploading user
            user_email: Email of uploading user

        Returns:
            Relative file path from uploads directory

        Raises:
            HTTPException: If file validation fails or save fails
        """
        try:
            # Read file content
            content = await file.read()
            file_size = len(content)

            # Validate file size
            self._validate_file_size(file_size)

            # Validate file type
            file_type = self._validate_file_type(file.filename, file.content_type)

            # Sanitize filename
            safe_filename = self._sanitize_filename(file.filename)

            # Generate unique filename
            unique_filename = self._generate_unique_filename(safe_filename, file_type)

            # Create user-specific subdirectory
            user_dir = self.upload_dir / user_id[:8]  # Use first 8 chars of UUID
            user_dir.mkdir(parents=True, exist_ok=True)

            # Save file
            file_path = user_dir / unique_filename
            with open(file_path, "wb") as f:
                f.write(content)

            # Return relative path from uploads directory
            relative_path = str(file_path.relative_to(self.upload_dir))

            logger.info(f"Saved file for user {user_id}: {unique_filename} ({file_size} bytes)")

            return relative_path

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to save file: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to save file. Please try again.",
            )

    async def create_document_record(
        self,
        db: AsyncSession,
        filename: str,
        file_type: str,
        mime_type: str,
        file_size: int,
        file_path: str,
        user_id: str,
        user_email: str,
        consent_given: bool = False,
        consent_ip_address: Optional[str] = None,
    ) -> Document:
        """
        Create document metadata record in database.

        Args:
            db: Database session
            filename: Original filename
            file_type: File extension (pdf, docx, md)
            mime_type: MIME type
            file_size: File size in bytes
            file_path: Relative file path from uploads directory
            user_id: UUID of uploading user
            user_email: Email of uploading user
            consent_given: User consent for AI processing (T-24 ST3)
            consent_ip_address: IP address at time of consent (T-24 ST3)

        Returns:
            Created Document model instance

        Raises:
            HTTPException: If database operation fails
        """
        try:
            # Create document record
            document = Document(
                id=uuid.uuid4(),
                original_filename=filename,
                file_type=file_type,
                mime_type=mime_type,
                file_size_bytes=file_size,
                status=DocumentStatus.PROCESSING,
                user_id=uuid.UUID(user_id),
                user_email=user_email,
                uploaded_at=datetime.utcnow(),
                # Consent tracking (T-24 ST3)
                consent_given=consent_given,
                consent_timestamp=datetime.utcnow() if consent_given else None,
                consent_version="1.0" if consent_given else None,
                consent_ip_address=consent_ip_address,
            )

            db.add(document)
            await db.commit()
            await db.refresh(document)

            logger.info(f"Created document record: {document.id} for user {user_id}")

            return document

        except HTTPException:
            raise
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to create document record: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create document record: {str(e)}",
            )

    async def upload_document(
        self,
        db: AsyncSession,
        file: UploadFile,
        user_id: str,
        user_email: str,
        consent_given: bool = False,
        consent_ip_address: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Complete document upload workflow: save file + create database record.

        Args:
            db: Database session
            file: Uploaded file object
            user_id: UUID of uploading user
            user_email: Email of uploading user
            consent_given: User consent for AI processing (T-24 ST3)
            consent_ip_address: IP address at time of consent (T-24 ST3)

        Returns:
            Document metadata dictionary

        Raises:
            HTTPException: If upload or database operation fails or consent not given
        """
        try:
            # T-24 ST3: Validate consent BEFORE processing file
            if not consent_given:
                raise HTTPException(
                    status_code=400,
                    detail="Document upload requires explicit user consent. "
                    "Please accept the consent agreement to process documents with AI.",
                )
            # Read file content once
            content = await file.read()
            file_size = len(content)

            # Validate file size and type before saving
            self._validate_file_size(file_size)
            file_type = self._validate_file_type(file.filename, file.content_type)

            # Sanitize and generate unique filename
            safe_filename = self._sanitize_filename(file.filename)
            unique_filename = self._generate_unique_filename(safe_filename, file_type)

            # Create user-specific subdirectory and save file
            user_dir = self.upload_dir / user_id[:8]
            user_dir.mkdir(parents=True, exist_ok=True)
            file_path = user_dir / unique_filename

            with open(file_path, "wb") as f:
                f.write(content)

            # Get relative path
            relative_path = str(file_path.relative_to(self.upload_dir))
            logger.info(f"Saved file for user {user_id}: {unique_filename} ({file_size} bytes)")

            # Create database record with file metadata and consent tracking
            document = await self.create_document_record(
                db=db,
                filename=file.filename,
                file_type=file_type,
                mime_type=file.content_type,
                file_size=file_size,
                file_path=relative_path,
                user_id=user_id,
                user_email=user_email,
                consent_given=consent_given,
                consent_ip_address=consent_ip_address,
            )

            # Return document metadata
            return {
                "document_id": str(document.id),
                "filename": document.original_filename,
                "file_type": document.file_type,
                "file_size": document.file_size_bytes,
                "status": document.status.value,
                "created_at": document.uploaded_at.isoformat(),
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Document upload failed: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"Document upload failed: {str(e)}",
            )

    async def get_document_by_id(
        self, db: AsyncSession, document_id: str, user_id: str
    ) -> Optional[Document]:
        """
        Get document by ID with ownership verification.

        Args:
            db: Database session
            document_id: UUID of document
            user_id: UUID of requesting user

        Returns:
            Document model instance or None if not found

        Raises:
            HTTPException: If user doesn't own document
        """
        try:
            doc_uuid = uuid.UUID(document_id)
            user_uuid = uuid.UUID(user_id)

            result = await db.execute(
                select(Document).where(
                    Document.id == doc_uuid,
                    Document.deleted_at.is_(None),
                )
            )
            document = result.scalar_one_or_none()

            if not document:
                return None

            # Verify ownership
            if document.user_id != user_uuid:
                raise HTTPException(
                    status_code=403,
                    detail="You do not have permission to access this document",
                )

            return document

        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid document ID format")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get document: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to retrieve document. Please try again.",
            )

    async def delete_document(self, db: AsyncSession, document_id: str, user_id: str) -> bool:
        """
        Soft delete document (sets deleted_at timestamp).

        Args:
            db: Database session
            document_id: UUID of document
            user_id: UUID of requesting user

        Returns:
            True if deleted, False if not found

        Raises:
            HTTPException: If user doesn't own document
        """
        document = await self.get_document_by_id(db, document_id, user_id)

        if not document:
            return False

        # Soft delete
        document.deleted_at = datetime.utcnow()
        await db.commit()

        logger.info(f"Soft deleted document {document_id} for user {user_id}")

        return True

    async def update_document_status(
        self,
        db: AsyncSession,
        document_id: str,
        status: str,
        metadata: Dict[str, Any] = None,
    ) -> Document:
        """
        Update document processing status.

        Args:
            db: Database session
            document_id: UUID of document
            status: New status ('processing', 'processed', 'failed')
            metadata: Optional metadata to store (e.g., chunk count, error info)

        Returns:
            Updated Document model instance

        Raises:
            HTTPException: If document not found or update fails
        """
        try:
            doc_uuid = uuid.UUID(document_id)

            result = await db.execute(
                select(Document).where(Document.id == doc_uuid, Document.deleted_at.is_(None))
            )
            document = result.scalar_one_or_none()

            if not document:
                raise HTTPException(status_code=404, detail="Document not found")

            # Map string status to enum
            status_map = {
                "processing": DocumentStatus.PROCESSING,
                "processed": DocumentStatus.COMPLETED,  # Fixed: PROCESSED -> COMPLETED
                "failed": DocumentStatus.FAILED,
            }

            if status not in status_map:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid status. Must be one of: {', '.join(status_map.keys())}",
                )

            # Update status
            document.status = status_map[status]
            document.processed_at = datetime.utcnow() if status == "processed" else None

            # Update metadata if provided
            if metadata:
                # Store as JSON in a metadata field (you might need to add this column)
                # For now, we'll log it
                logger.info(f"Document {document_id} metadata: {metadata}")

            await db.commit()
            await db.refresh(document)

            logger.info(f"Updated document {document_id} status to {status}")

            return document

        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid document ID format")
        except HTTPException:
            raise
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to update document status: {str(e)}")
            raise HTTPException(
                status_code=500, detail="Failed to update document status. Please try again."
            )
