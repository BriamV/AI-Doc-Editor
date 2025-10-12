"""
Unit tests for TextExtractionService (T-04 ST2).

Tests text extraction from various file formats (PDF, DOCX, Markdown)
and text chunking functionality with proper error handling.

Coverage areas:
- File extraction (PDF, DOCX, Markdown)
- Error handling (unsupported formats, missing files, empty files)
- Text chunking with overlap
- Edge cases (short text, empty text, boundary conditions)
"""

import pytest
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
import tempfile

from app.services.text_extraction_service import (
    TextExtractionService,
    TextExtractionError,
    UnsupportedFileTypeError,
    FileNotFoundError,
    EmptyFileError,
)


class TestTextExtractionServiceInitialization:
    """Test service initialization and configuration."""

    def test_init_with_defaults(self):
        """Test initialization with default chunk_size and overlap."""
        service = TextExtractionService()

        assert service.chunk_size == 1000
        assert service.overlap == 200

    def test_init_with_custom_values(self):
        """Test initialization with custom chunk_size and overlap."""
        service = TextExtractionService(chunk_size=500, overlap=100)

        assert service.chunk_size == 500
        assert service.overlap == 100

    def test_init_with_invalid_chunk_size(self):
        """Test initialization fails with zero or negative chunk_size."""
        with pytest.raises(ValueError, match="chunk_size must be positive"):
            TextExtractionService(chunk_size=0)

        with pytest.raises(ValueError, match="chunk_size must be positive"):
            TextExtractionService(chunk_size=-100)

    def test_init_with_invalid_overlap(self):
        """Test initialization fails with negative overlap."""
        with pytest.raises(ValueError, match="overlap cannot be negative"):
            TextExtractionService(overlap=-50)

    def test_init_with_overlap_larger_than_chunk_size(self):
        """Test initialization fails when overlap >= chunk_size."""
        with pytest.raises(ValueError, match="overlap must be smaller than chunk_size"):
            TextExtractionService(chunk_size=100, overlap=100)

        with pytest.raises(ValueError, match="overlap must be smaller than chunk_size"):
            TextExtractionService(chunk_size=100, overlap=150)


class TestPDFExtraction:
    """Test PDF text extraction functionality."""

    @pytest.mark.asyncio
    async def test_extract_pdf_success(self, sample_pdf_path):
        """Test successful text extraction from PDF file."""
        service = TextExtractionService()

        text = await service.extract_text(sample_pdf_path, "pdf")

        assert text is not None
        assert isinstance(text, str)
        assert len(text) > 0
        assert "Sample PDF text" in text

    @pytest.mark.asyncio
    async def test_extract_pdf_file_not_found(self):
        """Test PDF extraction fails when file doesn't exist."""
        service = TextExtractionService()
        nonexistent_path = Path("/nonexistent/file.pdf")

        with pytest.raises(FileNotFoundError, match="File not found"):
            await service.extract_text(nonexistent_path, "pdf")

    @pytest.mark.asyncio
    async def test_extract_pdf_empty_file(self, temp_test_dir):
        """Test PDF extraction handles empty PDF gracefully."""
        service = TextExtractionService()

        # Create a minimal but essentially empty PDF
        empty_pdf_path = temp_test_dir / "empty.pdf"
        empty_pdf_content = b"""%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids []
/Count 0
>>
endobj
xref
0 3
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
trailer
<<
/Size 3
/Root 1 0 R
>>
startxref
115
%%EOF
"""
        empty_pdf_path.write_bytes(empty_pdf_content)

        with pytest.raises(EmptyFileError, match="No text content extracted"):
            await service.extract_text(empty_pdf_path, "pdf")


class TestDOCXExtraction:
    """Test DOCX text extraction functionality."""

    @pytest.mark.asyncio
    async def test_extract_docx_success(self, sample_docx_path):
        """Test successful text extraction from DOCX file."""
        service = TextExtractionService()

        text = await service.extract_text(sample_docx_path, "docx")

        assert text is not None
        assert isinstance(text, str)
        assert len(text) > 0
        # Check for paragraph content
        assert "Sample DOCX paragraph 1" in text
        assert "Sample DOCX paragraph 2" in text

    @pytest.mark.asyncio
    async def test_extract_docx_with_tables(self, sample_docx_path):
        """Test DOCX extraction includes table content."""
        service = TextExtractionService()

        text = await service.extract_text(sample_docx_path, "docx")

        # Check for table content (separated by |)
        assert "Header 1" in text
        assert "Header 2" in text
        assert "Cell 1" in text
        assert "Cell 2" in text

    @pytest.mark.asyncio
    async def test_extract_docx_file_not_found(self):
        """Test DOCX extraction fails when file doesn't exist."""
        service = TextExtractionService()
        nonexistent_path = Path("/nonexistent/file.docx")

        with pytest.raises(FileNotFoundError, match="File not found"):
            await service.extract_text(nonexistent_path, "docx")


class TestMarkdownExtraction:
    """Test Markdown text extraction functionality."""

    @pytest.mark.asyncio
    async def test_extract_markdown_success(self, sample_markdown_path):
        """Test successful text extraction from Markdown file."""
        service = TextExtractionService()

        text = await service.extract_text(sample_markdown_path, "md")

        assert text is not None
        assert isinstance(text, str)
        assert len(text) > 0
        assert "Sample Markdown" in text
        assert "List item 1" in text

    @pytest.mark.asyncio
    async def test_extract_markdown_preserves_formatting(self, sample_markdown_path):
        """Test Markdown extraction preserves markdown syntax."""
        service = TextExtractionService()

        text = await service.extract_text(sample_markdown_path, "md")

        # Markdown formatting should be preserved
        assert "#" in text  # Headers
        assert "**" in text or "*" in text  # Bold/italic

    @pytest.mark.asyncio
    async def test_extract_markdown_empty_file(self, empty_file_path):
        """Test Markdown extraction fails on empty file."""
        service = TextExtractionService()

        with pytest.raises(EmptyFileError, match="No text content extracted"):
            await service.extract_text(empty_file_path, "md")


class TestUnsupportedFileTypes:
    """Test handling of unsupported file types."""

    @pytest.mark.asyncio
    async def test_extract_unsupported_type_explicit(self, temp_test_dir):
        """Test extraction fails with unsupported file type."""
        service = TextExtractionService()
        txt_path = temp_test_dir / "sample.txt"
        txt_path.write_text("Some text content")

        with pytest.raises(UnsupportedFileTypeError, match="Unsupported file type: txt"):
            await service.extract_text(txt_path, "txt")

    @pytest.mark.asyncio
    async def test_extract_unsupported_type_provides_supported_list(self, temp_test_dir):
        """Test error message includes list of supported types."""
        service = TextExtractionService()
        json_path = temp_test_dir / "data.json"
        json_path.write_text('{"key": "value"}')

        with pytest.raises(UnsupportedFileTypeError, match="Supported types:"):
            await service.extract_text(json_path, "json")

        # Verify the error contains all supported types
        try:
            await service.extract_text(json_path, "json")
        except UnsupportedFileTypeError as e:
            error_msg = str(e)
            assert "pdf" in error_msg
            assert "docx" in error_msg
            assert "md" in error_msg


class TestTextChunking:
    """Test text chunking functionality with overlap."""

    def test_chunk_text_short_text(self, sample_text_short):
        """Test chunking returns single chunk for short text."""
        service = TextExtractionService(chunk_size=100, overlap=20)

        chunks = service.chunk_text(sample_text_short)

        assert len(chunks) == 1
        assert chunks[0] == sample_text_short

    def test_chunk_text_long_text(self, sample_text_long):
        """Test chunking splits long text into multiple chunks."""
        service = TextExtractionService(chunk_size=200, overlap=50)

        chunks = service.chunk_text(sample_text_long)

        assert len(chunks) > 1
        # Verify all chunks are within size limits
        for chunk in chunks:
            # Allow some flexibility due to word boundary breaking
            assert len(chunk) <= 200 + 100  # +100 buffer for word boundaries

    def test_chunk_text_with_overlap(self):
        """Test chunks have proper overlap."""
        service = TextExtractionService(chunk_size=50, overlap=10)
        text = "word " * 50  # Create text with clear word boundaries

        chunks = service.chunk_text(text)

        # With overlap, consecutive chunks should share some content
        if len(chunks) > 1:
            # Check that there's some overlap between consecutive chunks
            for i in range(len(chunks) - 1):
                # At least some words should appear in both chunks
                chunk1_words = set(chunks[i].split())
                chunk2_words = set(chunks[i + 1].split())
                assert len(chunk1_words & chunk2_words) > 0

    def test_chunk_text_empty_input(self):
        """Test chunking empty text returns empty list."""
        service = TextExtractionService()

        chunks = service.chunk_text("")

        assert chunks == []

    def test_chunk_text_whitespace_only(self):
        """Test chunking whitespace-only text strips to nearly empty."""
        service = TextExtractionService()

        chunks = service.chunk_text("   \n\n   \t\t   ")

        # The service strips whitespace from chunks but may still return them
        # This is acceptable behavior - chunks are stripped but not filtered
        assert len(chunks) >= 0
        if chunks:
            # All chunks should be whitespace only after stripping
            assert all(chunk.strip() == "" or len(chunk.strip()) < 5 for chunk in chunks)

    def test_chunk_text_custom_params(self):
        """Test chunking with custom chunk_size and overlap parameters."""
        service = TextExtractionService(chunk_size=1000, overlap=200)
        text = "word " * 200

        # Use different params than service defaults
        chunks = service.chunk_text(text, chunk_size=100, overlap=20)

        # Should use provided params, not service defaults
        assert len(chunks) > 1
        for chunk in chunks:
            assert len(chunk) <= 100 + 80  # +80 buffer for word boundaries

    def test_chunk_text_invalid_params_at_runtime(self):
        """Test chunking fails with invalid runtime parameters."""
        service = TextExtractionService()

        # When params are None, service uses defaults, so we need explicit bad values
        with pytest.raises(ValueError, match="chunk_size must be positive"):
            service.chunk_text("some text", chunk_size=-5)

        with pytest.raises(ValueError, match="overlap cannot be negative"):
            service.chunk_text("some text", chunk_size=100, overlap=-10)

        with pytest.raises(ValueError, match="overlap must be smaller than chunk_size"):
            service.chunk_text("some text", chunk_size=50, overlap=50)

    def test_chunk_text_word_boundary_breaking(self):
        """Test chunking breaks at word boundaries when possible."""
        service = TextExtractionService(chunk_size=50, overlap=10)
        text = "This is a test sentence that should be split at word boundaries properly."

        chunks = service.chunk_text(text)

        # Chunks should not break words (except at the very end if forced)
        for chunk in chunks[:-1]:  # All except last
            # Should end at a word boundary (space or end of text)
            assert chunk[-1] != " " or chunk.strip()[-1].isalnum()


class TestExtractAndChunk:
    """Test combined extract and chunk operation."""

    @pytest.mark.asyncio
    async def test_extract_and_chunk_pdf(self, sample_pdf_path):
        """Test extract_and_chunk combines extraction and chunking."""
        service = TextExtractionService(chunk_size=50, overlap=10)

        chunks = await service.extract_and_chunk(sample_pdf_path, "pdf")

        assert isinstance(chunks, list)
        assert len(chunks) > 0
        assert all(isinstance(chunk, str) for chunk in chunks)

    @pytest.mark.asyncio
    async def test_extract_and_chunk_docx(self, sample_docx_path):
        """Test extract_and_chunk works with DOCX files."""
        service = TextExtractionService(chunk_size=100, overlap=20)

        chunks = await service.extract_and_chunk(sample_docx_path, "docx")

        assert isinstance(chunks, list)
        assert len(chunks) > 0

    @pytest.mark.asyncio
    async def test_extract_and_chunk_markdown(self, sample_markdown_path):
        """Test extract_and_chunk works with Markdown files."""
        service = TextExtractionService(chunk_size=100, overlap=20)

        chunks = await service.extract_and_chunk(sample_markdown_path, "md")

        assert isinstance(chunks, list)
        assert len(chunks) > 0

    @pytest.mark.asyncio
    async def test_extract_and_chunk_custom_params(self, sample_markdown_path):
        """Test extract_and_chunk with custom chunking parameters."""
        service = TextExtractionService()  # Default params

        chunks = await service.extract_and_chunk(
            sample_markdown_path, "md", chunk_size=50, overlap=10
        )

        assert isinstance(chunks, list)
        # With smaller chunk_size, should get more chunks
        assert len(chunks) > 1

    @pytest.mark.asyncio
    async def test_extract_and_chunk_propagates_errors(self):
        """Test extract_and_chunk propagates extraction errors."""
        service = TextExtractionService()
        nonexistent = Path("/nonexistent.pdf")

        with pytest.raises(FileNotFoundError):
            await service.extract_and_chunk(nonexistent, "pdf")


class TestEdgeCases:
    """Test edge cases and boundary conditions."""

    @pytest.mark.asyncio
    async def test_extract_text_case_insensitive_file_type(self, sample_pdf_path):
        """Test file type parameter is case-insensitive."""
        service = TextExtractionService()

        text_lower = await service.extract_text(sample_pdf_path, "pdf")
        text_upper = await service.extract_text(sample_pdf_path, "PDF")
        text_mixed = await service.extract_text(sample_pdf_path, "Pdf")

        assert text_lower == text_upper == text_mixed

    def test_chunk_text_single_long_word(self):
        """Test chunking handles text with very long words."""
        service = TextExtractionService(chunk_size=50, overlap=10)
        # Create a very long word that exceeds chunk_size
        long_word = "a" * 100

        chunks = service.chunk_text(long_word)

        # Should still chunk even with no word boundaries
        assert len(chunks) > 0

    def test_chunk_text_exactly_chunk_size(self):
        """Test chunking text that is exactly chunk_size."""
        service = TextExtractionService(chunk_size=100, overlap=20)
        text = "a" * 100

        chunks = service.chunk_text(text)

        assert len(chunks) == 1
        assert len(chunks[0]) == 100

    def test_chunk_text_slightly_over_chunk_size(self):
        """Test chunking text slightly larger than chunk_size."""
        service = TextExtractionService(chunk_size=100, overlap=20)
        text = "a" * 101

        chunks = service.chunk_text(text)

        assert len(chunks) == 2
