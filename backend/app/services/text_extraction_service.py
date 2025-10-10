"""
Text extraction service for RAG pipeline.

Handles extraction of text from various file formats (PDF, DOCX, Markdown)
with support for chunking and overlap for efficient embedding processing.

T-04 ST2: Text Extraction and Chunking Service
"""

import logging
from pathlib import Path
from typing import List, Optional
import asyncio
from functools import partial

from PyPDF2 import PdfReader
from docx import Document as DocxDocument

logger = logging.getLogger(__name__)


class TextExtractionError(Exception):
    """Base exception for text extraction errors."""

    pass


class UnsupportedFileTypeError(TextExtractionError):
    """Raised when file type is not supported for extraction."""

    pass


class FileNotFoundError(TextExtractionError):
    """Raised when file does not exist."""

    pass


class EmptyFileError(TextExtractionError):
    """Raised when file contains no extractable text."""

    pass


class TextExtractionService:
    """Service for extracting text from various document formats."""

    SUPPORTED_TYPES = {"pdf", "docx", "md"}
    DEFAULT_CHUNK_SIZE = 1000
    DEFAULT_OVERLAP = 200

    def __init__(self, chunk_size: int = DEFAULT_CHUNK_SIZE, overlap: int = DEFAULT_OVERLAP):
        """
        Initialize text extraction service.

        Args:
            chunk_size: Default size of text chunks in characters
            overlap: Default overlap between chunks in characters
        """
        self.chunk_size = chunk_size
        self.overlap = overlap

        # Validate chunk configuration
        if chunk_size <= 0:
            raise ValueError("chunk_size must be positive")
        if overlap < 0:
            raise ValueError("overlap cannot be negative")
        if overlap >= chunk_size:
            raise ValueError("overlap must be smaller than chunk_size")

        logger.info(
            f"Initialized TextExtractionService " f"(chunk_size={chunk_size}, overlap={overlap})"
        )

    async def extract_text(self, file_path: Path, file_type: str) -> str:
        """
        Extract text from a file based on its type.

        Args:
            file_path: Path to the file to extract text from
            file_type: Type of file ('pdf', 'docx', 'md')

        Returns:
            Extracted text content as string

        Raises:
            FileNotFoundError: If file does not exist
            UnsupportedFileTypeError: If file type is not supported
            EmptyFileError: If file contains no extractable text
            TextExtractionError: For other extraction errors
        """
        # Validate file exists
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        # Validate file type
        file_type = file_type.lower()
        if file_type not in self.SUPPORTED_TYPES:
            raise UnsupportedFileTypeError(
                f"Unsupported file type: {file_type}. "
                f"Supported types: {', '.join(self.SUPPORTED_TYPES)}"
            )

        # Route to appropriate extraction method
        try:
            if file_type == "pdf":
                text = await self.extract_pdf(file_path)
            elif file_type == "docx":
                text = await self.extract_docx(file_path)
            elif file_type == "md":
                text = await self.extract_markdown(file_path)
            else:
                # Should never reach here due to validation above
                raise UnsupportedFileTypeError(f"No handler for type: {file_type}")

            # Validate extracted text is not empty
            if not text or not text.strip():
                raise EmptyFileError(f"No text content extracted from: {file_path}")

            logger.info(f"Extracted {len(text)} characters from {file_path.name} ({file_type})")

            return text

        except (FileNotFoundError, UnsupportedFileTypeError, EmptyFileError):
            raise
        except Exception as e:
            logger.error(f"Failed to extract text from {file_path}: {str(e)}")
            raise TextExtractionError(
                f"Text extraction failed for {file_path.name}: {str(e)}"
            ) from e

    async def extract_pdf(self, file_path: Path) -> str:
        """
        Extract text from PDF file using PyPDF2.

        Args:
            file_path: Path to PDF file

        Returns:
            Extracted text content

        Raises:
            TextExtractionError: If PDF extraction fails
        """
        try:
            # Run PDF extraction in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            text = await loop.run_in_executor(None, partial(self._extract_pdf_sync, file_path))

            return text

        except Exception as e:
            logger.error(f"PDF extraction failed for {file_path}: {str(e)}")
            raise TextExtractionError(f"Failed to extract PDF text: {str(e)}") from e

    def _extract_pdf_sync(self, file_path: Path) -> str:
        """
        Synchronous PDF text extraction (runs in thread pool).

        Args:
            file_path: Path to PDF file

        Returns:
            Extracted text content
        """
        with open(file_path, "rb") as file:
            reader = PdfReader(file)
            text_parts = []

            # Extract text from each page
            for page_num, page in enumerate(reader.pages, start=1):
                try:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)
                except Exception as e:
                    logger.warning(
                        f"Failed to extract text from page {page_num} "
                        f"in {file_path.name}: {str(e)}"
                    )
                    # Continue with other pages

            return "\n\n".join(text_parts)

    async def extract_docx(self, file_path: Path) -> str:
        """
        Extract text from DOCX file using python-docx.

        Args:
            file_path: Path to DOCX file

        Returns:
            Extracted text content

        Raises:
            TextExtractionError: If DOCX extraction fails
        """
        try:
            # Run DOCX extraction in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            text = await loop.run_in_executor(None, partial(self._extract_docx_sync, file_path))

            return text

        except Exception as e:
            logger.error(f"DOCX extraction failed for {file_path}: {str(e)}")
            raise TextExtractionError(f"Failed to extract DOCX text: {str(e)}") from e

    def _extract_docx_sync(self, file_path: Path) -> str:
        """
        Synchronous DOCX text extraction (runs in thread pool).

        Args:
            file_path: Path to DOCX file

        Returns:
            Extracted text content
        """
        doc = DocxDocument(str(file_path))
        text_parts = []

        # Extract text from all paragraphs
        for paragraph in doc.paragraphs:
            text = paragraph.text.strip()
            if text:
                text_parts.append(text)

        # Extract text from tables
        for table in doc.tables:
            for row in table.rows:
                row_text = []
                for cell in row.cells:
                    cell_text = cell.text.strip()
                    if cell_text:
                        row_text.append(cell_text)
                if row_text:
                    text_parts.append(" | ".join(row_text))

        return "\n\n".join(text_parts)

    async def extract_markdown(self, file_path: Path) -> str:
        """
        Extract text from Markdown file (plain text reading).

        Args:
            file_path: Path to Markdown file

        Returns:
            Extracted text content

        Raises:
            TextExtractionError: If file reading fails
        """
        try:
            # Use async file reading
            loop = asyncio.get_event_loop()
            text = await loop.run_in_executor(None, partial(self._read_file_sync, file_path))

            return text

        except Exception as e:
            logger.error(f"Markdown extraction failed for {file_path}: {str(e)}")
            raise TextExtractionError(f"Failed to read Markdown file: {str(e)}") from e

    def _read_file_sync(self, file_path: Path) -> str:
        """
        Synchronous file reading (runs in thread pool).

        Args:
            file_path: Path to file

        Returns:
            File content as string
        """
        with open(file_path, "r", encoding="utf-8") as file:
            return file.read()

    def chunk_text(
        self, text: str, chunk_size: Optional[int] = None, overlap: Optional[int] = None
    ) -> List[str]:
        """
        Split text into overlapping chunks for efficient embedding.

        This method splits text at word boundaries to avoid breaking words,
        and maintains overlap between chunks to preserve context.

        Args:
            text: Text to chunk
            chunk_size: Size of each chunk in characters (uses default if None)
            overlap: Overlap between chunks in characters (uses default if None)

        Returns:
            List of text chunks with overlap

        Raises:
            ValueError: If chunk_size or overlap parameters are invalid
        """
        # Use instance defaults if not specified
        chunk_size = chunk_size or self.chunk_size
        overlap = overlap or self.overlap

        # Validate parameters
        if chunk_size <= 0:
            raise ValueError("chunk_size must be positive")
        if overlap < 0:
            raise ValueError("overlap cannot be negative")
        if overlap >= chunk_size:
            raise ValueError("overlap must be smaller than chunk_size")

        # Handle empty text
        if not text:
            return []

        # Handle text shorter than chunk size
        if len(text) <= chunk_size:
            return [text]

        chunks = []
        start = 0

        while start < len(text):
            # Calculate end position for this chunk
            end = start + chunk_size

            # If this is not the last chunk, try to break at word boundary
            if end < len(text):
                # Find the last space before the end position
                last_space = text.rfind(" ", start, end)

                # Only break at space if it's not too far back
                # (don't want chunks to be too small)
                min_chunk_size = int(chunk_size * 0.8)  # At least 80% of chunk_size
                if last_space > start + min_chunk_size:
                    end = last_space

            # Extract chunk
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)

            # Move to next chunk position with overlap
            # For the last chunk, we're done
            if end >= len(text):
                break

            # Calculate next start position (current end - overlap)
            start = end - overlap

            # Ensure we make progress (avoid infinite loop)
            if start <= chunks[-1].find(chunk[:10]) if chunks else 0:
                start = end

        logger.debug(
            f"Chunked {len(text)} characters into {len(chunks)} chunks "
            f"(size={chunk_size}, overlap={overlap})"
        )

        return chunks

    async def extract_and_chunk(
        self,
        file_path: Path,
        file_type: str,
        chunk_size: Optional[int] = None,
        overlap: Optional[int] = None,
    ) -> List[str]:
        """
        Extract text from file and split into chunks in one operation.

        Convenience method that combines extract_text() and chunk_text().

        Args:
            file_path: Path to file
            file_type: Type of file ('pdf', 'docx', 'md')
            chunk_size: Size of each chunk in characters (uses default if None)
            overlap: Overlap between chunks in characters (uses default if None)

        Returns:
            List of text chunks

        Raises:
            Same exceptions as extract_text() and chunk_text()
        """
        # Extract text
        text = await self.extract_text(file_path, file_type)

        # Chunk text
        chunks = self.chunk_text(text, chunk_size, overlap)

        logger.info(
            f"Extracted and chunked {file_path.name}: " f"{len(text)} chars → {len(chunks)} chunks"
        )

        return chunks
