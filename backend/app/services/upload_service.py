"""
Upload service for handling file uploads and storage
T-04-ST1: Business logic for document upload operations
"""

import os
import uuid
from typing import Optional, Tuple
from datetime import datetime
from pathlib import Path
from fastapi import UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.document import Document, DocumentStatus
from app.services.file_validator import FileValidator
from app.services.audit import AuditService
from app.models.audit import AuditActionType
from app.core.config import settings


class UploadService:
    """
    Service for handling document uploads
    Manages file validation, storage, and database operations
    """

    def __init__(
        self, storage_base_path: Optional[str] = None, max_file_size: Optional[int] = None
    ):
        """
        Initialize upload service

        Args:
            storage_base_path: Base directory for file storage
            max_file_size: Maximum allowed file size in bytes
        """
        self.storage_base_path = storage_base_path or getattr(
            settings, "UPLOAD_STORAGE_PATH", "./uploads"
        )
        self.file_validator = FileValidator(max_file_size=max_file_size)
        self.audit_service = AuditService()

        # Ensure storage directory exists
        Path(self.storage_base_path).mkdir(parents=True, exist_ok=True)

    def _generate_storage_path(self, user_id: str, file_id: str, extension: str) -> str:
        """
        Generate organized storage path for uploaded file

        Args:
            user_id: User ID who uploaded the file
            file_id: Unique file identifier
            extension: File extension

        Returns:
            Relative storage path
        """
        # Organize files by user_id/year/month/file_id.ext
        now = datetime.utcnow()
        year = now.strftime("%Y")
        month = now.strftime("%m")

        # Create subdirectory structure
        subdir = os.path.join(user_id, year, month)
        full_dir = os.path.join(self.storage_base_path, subdir)
        Path(full_dir).mkdir(parents=True, exist_ok=True)

        # Generate filename
        filename = f"{file_id}.{extension}"
        relative_path = os.path.join(subdir, filename)

        return relative_path

    async def _save_file(self, file: UploadFile, storage_path: str) -> bool:
        """
        Save uploaded file to disk

        Args:
            file: FastAPI UploadFile object
            storage_path: Relative path where file should be saved

        Returns:
            True if successful, False otherwise
        """
        try:
            full_path = os.path.join(self.storage_base_path, storage_path)

            # Save file in chunks to handle large files efficiently
            with open(full_path, "wb") as buffer:
                while chunk := await file.read(8192):  # 8KB chunks
                    buffer.write(chunk)

            return True
        except Exception as e:
            # Clean up partial file if save failed
            try:
                if os.path.exists(full_path):
                    os.remove(full_path)
            except Exception:
                pass
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    async def upload_document(
        self,
        file: UploadFile,
        session: AsyncSession,
        user_id: Optional[str] = None,
        user_email: Optional[str] = None,
        title: Optional[str] = None,
        description: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> Document:
        """
        Handle complete document upload process

        Args:
            file: Uploaded file
            session: Database session
            user_id: ID of user uploading the file
            user_email: Email of user uploading the file
            title: Optional document title
            description: Optional document description
            ip_address: Client IP address for audit

        Returns:
            Created Document object

        Raises:
            HTTPException: If validation or storage fails
        """
        # 1. Validate file
        is_valid, error_msg, metadata = await self.file_validator.validate_upload_file(file)

        if not is_valid:
            # Log failed upload attempt
            await self.audit_service.log_event(
                action_type=AuditActionType.DOCUMENT_CREATE,
                description=f"Failed document upload: {error_msg}",
                user_id=user_id,
                user_email=user_email,
                resource_type="document",
                ip_address=ip_address,
                status="failure",
                details={"error": error_msg, "metadata": metadata},
            )

            raise HTTPException(status_code=400, detail=error_msg)

        # 2. Generate unique document ID
        document_id = str(uuid.uuid4())

        # 3. Generate storage path
        storage_path = self._generate_storage_path(
            user_id=user_id or "anonymous",
            file_id=document_id,
            extension=metadata["file_extension"],
        )

        # 4. Save file to disk
        try:
            await self._save_file(file, storage_path)
        except Exception as e:
            await self.audit_service.log_event(
                action_type=AuditActionType.DOCUMENT_CREATE,
                description=f"Failed to save file: {str(e)}",
                user_id=user_id,
                user_email=user_email,
                resource_type="document",
                ip_address=ip_address,
                status="error",
                details={"error": str(e), "metadata": metadata},
            )
            raise

        # 5. Create database record
        document = Document(
            id=document_id,
            original_filename=metadata["original_filename"],
            file_type=self.file_validator.get_file_type_from_mime(metadata["mime_type"]),
            mime_type=metadata["mime_type"],
            storage_path=storage_path,
            file_size_bytes=metadata["file_size_bytes"],
            title=title,
            description=description,
            status=DocumentStatus.UPLOADED.value,
            user_id=user_id,
            user_email=user_email,
            uploaded_at=datetime.utcnow(),
        )

        try:
            session.add(document)
            await session.commit()
            await session.refresh(document)

            # Log successful upload
            await self.audit_service.log_event(
                action_type=AuditActionType.DOCUMENT_CREATE,
                description=f"Document uploaded successfully: {metadata['original_filename']}",
                user_id=user_id,
                user_email=user_email,
                resource_type="document",
                resource_id=document_id,
                ip_address=ip_address,
                status="success",
                details={
                    "filename": metadata["original_filename"],
                    "file_type": document.file_type,
                    "file_size_bytes": metadata["file_size_bytes"],
                },
            )

            return document

        except Exception as e:
            await session.rollback()

            # Clean up uploaded file if database insert fails
            try:
                full_path = os.path.join(self.storage_base_path, storage_path)
                if os.path.exists(full_path):
                    os.remove(full_path)
            except Exception:
                pass

            await self.audit_service.log_event(
                action_type=AuditActionType.DOCUMENT_CREATE,
                description=f"Failed to create document record: {str(e)}",
                user_id=user_id,
                user_email=user_email,
                resource_type="document",
                ip_address=ip_address,
                status="error",
                details={"error": str(e), "metadata": metadata},
            )

            raise HTTPException(
                status_code=500, detail=f"Failed to create document record: {str(e)}"
            )

    async def get_document_by_id(
        self, document_id: str, session: AsyncSession, user_id: Optional[str] = None
    ) -> Optional[Document]:
        """
        Retrieve document by ID

        Args:
            document_id: Document identifier
            session: Database session
            user_id: Optional user ID for access control

        Returns:
            Document object if found, None otherwise
        """
        query = select(Document).where(Document.id == document_id)

        # Optional: Filter by user_id for access control
        if user_id:
            query = query.where(Document.user_id == user_id)

        result = await session.execute(query)
        return result.scalar_one_or_none()

    async def list_documents(
        self,
        session: AsyncSession,
        user_id: Optional[str] = None,
        file_type: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> Tuple[list[Document], int]:
        """
        List documents with optional filters

        Args:
            session: Database session
            user_id: Filter by user ID
            file_type: Filter by file type
            status: Filter by status
            limit: Maximum number of results
            offset: Result offset for pagination

        Returns:
            Tuple of (documents list, total count)
        """
        # Build query with filters
        query = select(Document).where(Document.deleted_at.is_(None))

        if user_id:
            query = query.where(Document.user_id == user_id)
        if file_type:
            query = query.where(Document.file_type == file_type)
        if status:
            query = query.where(Document.status == status)

        # Order by upload date (newest first)
        query = query.order_by(Document.uploaded_at.desc())

        # Get total count
        count_query = select(Document.id).where(Document.deleted_at.is_(None))
        if user_id:
            count_query = count_query.where(Document.user_id == user_id)
        if file_type:
            count_query = count_query.where(Document.file_type == file_type)
        if status:
            count_query = count_query.where(Document.status == status)

        count_result = await session.execute(count_query)
        total = len(count_result.all())

        # Apply pagination
        query = query.limit(limit).offset(offset)

        # Execute query
        result = await session.execute(query)
        documents = result.scalars().all()

        return list(documents), total

    async def delete_document(
        self,
        document_id: str,
        session: AsyncSession,
        user_id: Optional[str] = None,
        hard_delete: bool = False,
    ) -> bool:
        """
        Delete document (soft delete by default)

        Args:
            document_id: Document identifier
            session: Database session
            user_id: User ID for access control
            hard_delete: If True, permanently delete file and record

        Returns:
            True if successful, False if document not found
        """
        document = await self.get_document_by_id(document_id, session, user_id)

        if not document:
            return False

        if hard_delete:
            # Remove file from storage
            try:
                full_path = os.path.join(self.storage_base_path, document.storage_path)
                if os.path.exists(full_path):
                    os.remove(full_path)
            except Exception:
                # Log but don't fail on file deletion error
                pass

            # Delete database record
            await session.delete(document)
        else:
            # Soft delete
            document.deleted_at = datetime.utcnow()

        await session.commit()

        # Log deletion
        await self.audit_service.log_event(
            action_type=AuditActionType.DOCUMENT_DELETE,
            description=f"Document {'permanently ' if hard_delete else ''}deleted: {document.original_filename}",
            user_id=user_id,
            resource_type="document",
            resource_id=document_id,
            status="success",
        )

        return True
