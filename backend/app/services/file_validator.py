"""
File validation service for upload endpoint
T-04-ST1: Validates file types, sizes, and content
"""

import magic
from typing import Dict, Tuple, Optional
from fastapi import UploadFile
import os


class FileValidator:
    """
    Service for validating uploaded files
    Validates MIME types, file sizes, and file content
    """

    # Allowed MIME types with their corresponding extensions
    ALLOWED_MIME_TYPES = {
        "application/pdf": ["pdf"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
        "text/markdown": ["md"],
        "text/plain": ["md", "txt"],  # Markdown files might be detected as plain text
    }

    # Maximum file size: 10MB (configurable via settings)
    DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB in bytes

    # Minimum file size: 1KB (to avoid empty files)
    MIN_FILE_SIZE = 1024  # 1KB

    def __init__(self, max_file_size: Optional[int] = None):
        """
        Initialize file validator

        Args:
            max_file_size: Maximum allowed file size in bytes (defaults to 10MB)
        """
        self.max_file_size = max_file_size or self.DEFAULT_MAX_FILE_SIZE
        self.magic_detector = magic.Magic(mime=True)

    def validate_file_extension(self, filename: str) -> Tuple[bool, str]:
        """
        Validate file extension

        Args:
            filename: Original filename

        Returns:
            Tuple of (is_valid, file_extension)
        """
        if not filename or "." not in filename:
            return False, ""

        extension = filename.rsplit(".", 1)[-1].lower()
        allowed_extensions = set()
        for extensions_list in self.ALLOWED_MIME_TYPES.values():
            allowed_extensions.update(extensions_list)

        if extension not in allowed_extensions:
            return False, extension

        return True, extension

    def validate_file_size(self, file_size: int) -> Tuple[bool, str]:
        """
        Validate file size

        Args:
            file_size: File size in bytes

        Returns:
            Tuple of (is_valid, error_message)
        """
        if file_size < self.MIN_FILE_SIZE:
            return False, f"File too small. Minimum size: {self.MIN_FILE_SIZE} bytes"

        if file_size > self.max_file_size:
            max_mb = self.max_file_size / (1024 * 1024)
            return False, f"File too large. Maximum size: {max_mb:.2f} MB"

        return True, ""

    def detect_mime_type(self, file_content: bytes) -> str:
        """
        Detect MIME type from file content

        Args:
            file_content: First few bytes of the file

        Returns:
            Detected MIME type
        """
        try:
            mime_type = self.magic_detector.from_buffer(file_content)
            return mime_type
        except Exception:
            return "application/octet-stream"

    def validate_mime_type(self, detected_mime: str, file_extension: str) -> Tuple[bool, str]:
        """
        Validate MIME type matches expected type for file extension

        Args:
            detected_mime: Detected MIME type from file content
            file_extension: File extension from filename

        Returns:
            Tuple of (is_valid, normalized_mime_type)
        """
        # Check if detected MIME type is in allowed list
        if detected_mime in self.ALLOWED_MIME_TYPES:
            expected_extensions = self.ALLOWED_MIME_TYPES[detected_mime]
            if file_extension in expected_extensions:
                return True, detected_mime

        # Special handling for markdown files (often detected as text/plain)
        if file_extension == "md" and detected_mime in ["text/plain", "text/markdown"]:
            return True, "text/markdown"

        return False, detected_mime

    async def validate_upload_file(
        self, file: UploadFile
    ) -> Tuple[bool, Optional[str], Dict[str, any]]:
        """
        Comprehensive validation of uploaded file

        Args:
            file: FastAPI UploadFile object

        Returns:
            Tuple of (is_valid, error_message, metadata)

        Raises:
            HTTPException: If file validation fails with appropriate status code
        """
        metadata = {
            "original_filename": file.filename,
            "content_type": file.content_type,
        }

        # 1. Validate filename exists
        if not file.filename:
            return False, "Filename is required", metadata

        # 2. Validate file extension
        is_valid_ext, extension = self.validate_file_extension(file.filename)
        if not is_valid_ext:
            return False, f"Invalid file extension: .{extension}. Allowed: PDF, DOCX, MD", metadata

        metadata["file_extension"] = extension

        # 3. Read file content (first 8KB for MIME detection)
        try:
            file_content = await file.read(8192)
            if not file_content:
                return False, "Empty file uploaded", metadata

            # Reset file pointer for later processing
            await file.seek(0)
        except Exception as e:
            return False, f"Failed to read file: {str(e)}", metadata

        # 4. Detect actual MIME type from content
        detected_mime = self.detect_mime_type(file_content)
        metadata["detected_mime"] = detected_mime

        # 5. Validate MIME type matches extension
        is_valid_mime, normalized_mime = self.validate_mime_type(detected_mime, extension)
        if not is_valid_mime:
            return (
                False,
                f"File content does not match extension. Detected: {detected_mime}",
                metadata,
            )

        metadata["mime_type"] = normalized_mime

        # 6. Get full file size
        try:
            # Seek to end to get file size
            await file.seek(0, os.SEEK_END)
            file_size = await file.tell()
            # Reset to beginning
            await file.seek(0)

            metadata["file_size_bytes"] = file_size

        except Exception as e:
            return False, f"Failed to determine file size: {str(e)}", metadata

        # 7. Validate file size
        is_valid_size, size_error = self.validate_file_size(file_size)
        if not is_valid_size:
            return False, size_error, metadata

        # All validations passed
        return True, None, metadata

    def get_file_type_from_mime(self, mime_type: str) -> str:
        """
        Convert MIME type to simplified file type

        Args:
            mime_type: MIME type string

        Returns:
            Simplified file type (pdf, docx, md)
        """
        mime_to_type = {
            "application/pdf": "pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
            "text/markdown": "md",
            "text/plain": "md",  # Assume plain text is markdown
        }

        return mime_to_type.get(mime_type, "unknown")
