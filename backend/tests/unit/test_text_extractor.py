"""
Unit tests for TextExtractor service
T-04-ST2: Test text extraction from PDF, DOCX, and Markdown files
"""

import pytest
from pathlib import Path
from unittest.mock import Mock, patch
import tempfile
import os

from app.services.text_extractor import TextExtractor, TextExtractionError


@pytest.fixture
def text_extractor():
    """Provide TextExtractor instance"""
    return TextExtractor()


@pytest.fixture
def fixtures_dir():
    """Path to test fixtures directory"""
    return Path(__file__).parent.parent / "fixtures" / "documents"


@pytest.fixture
def sample_markdown_file(fixtures_dir):
    """Path to sample markdown file"""
    return str(fixtures_dir / "sample.md")


@pytest.fixture
def temp_pdf_file():
    """Create a temporary PDF-like file for testing"""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".pdf", delete=False) as f:
        f.write("Sample PDF content")
        temp_path = f.name

    yield temp_path

    # Cleanup
    try:
        os.unlink(temp_path)
    except Exception:
        pass


@pytest.fixture
def temp_docx_file():
    """Create a temporary DOCX-like file for testing"""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".docx", delete=False) as f:
        f.write("Sample DOCX content")
        temp_path = f.name

    yield temp_path

    # Cleanup
    try:
        os.unlink(temp_path)
    except Exception:
        pass


class TestTextExtractorInitialization:
    """Test TextExtractor initialization and dependency validation"""

    def test_initialization(self, text_extractor):
        """Test that TextExtractor initializes correctly"""
        assert text_extractor is not None
        assert hasattr(text_extractor, "extract_text")
        assert hasattr(text_extractor, "extract_from_pdf")
        assert hasattr(text_extractor, "extract_from_docx")
        assert hasattr(text_extractor, "extract_from_markdown")

    def test_dependency_validation(self, text_extractor):
        """Test that dependency validation runs on initialization"""
        # Should not raise any errors if dependencies are installed
        text_extractor._validate_dependencies()


class TestMarkdownExtraction:
    """Test markdown file extraction"""

    def test_extract_from_markdown_success(self, text_extractor, sample_markdown_file):
        """Test successful markdown extraction"""
        text = text_extractor.extract_from_markdown(sample_markdown_file)

        assert text is not None
        assert len(text) > 0
        assert "Sample Markdown Document" in text
        assert "Section 1" in text
        assert "Lorem ipsum" in text

    def test_extract_from_markdown_file_not_found(self, text_extractor):
        """Test markdown extraction with missing file"""
        with pytest.raises(TextExtractionError, match="File not found"):
            text_extractor.extract_from_markdown("/nonexistent/file.md")

    def test_extract_from_markdown_empty_file(self, text_extractor):
        """Test markdown extraction with empty file"""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
            temp_path = f.name

        try:
            with pytest.raises(TextExtractionError, match="empty"):
                text_extractor.extract_from_markdown(temp_path)
        finally:
            os.unlink(temp_path)

    def test_extract_from_markdown_encoding_error(self, text_extractor):
        """Test markdown extraction with encoding issues"""
        # Create file with invalid UTF-8
        with tempfile.NamedTemporaryFile(mode="wb", suffix=".md", delete=False) as f:
            f.write(b"\xff\xfe Invalid UTF-8")
            temp_path = f.name

        try:
            with pytest.raises(TextExtractionError, match="encoding issue"):
                text_extractor.extract_from_markdown(temp_path)
        finally:
            os.unlink(temp_path)


class TestPDFExtraction:
    """Test PDF file extraction"""

    @patch("app.services.text_extractor.PdfReader")
    def test_extract_from_pdf_success(self, mock_pdf_reader, text_extractor, temp_pdf_file):
        """Test successful PDF extraction"""
        # Mock PDF reader
        mock_page = Mock()
        mock_page.extract_text.return_value = "This is page 1 content"

        mock_reader_instance = Mock()
        mock_reader_instance.pages = [mock_page]
        mock_pdf_reader.return_value = mock_reader_instance

        text = text_extractor.extract_from_pdf(temp_pdf_file)

        assert text is not None
        assert "This is page 1 content" in text
        mock_pdf_reader.assert_called_once_with(temp_pdf_file)

    @patch("app.services.text_extractor.PdfReader")
    def test_extract_from_pdf_multiple_pages(self, mock_pdf_reader, text_extractor, temp_pdf_file):
        """Test PDF extraction with multiple pages"""
        # Mock multiple pages
        mock_page1 = Mock()
        mock_page1.extract_text.return_value = "Page 1 content"

        mock_page2 = Mock()
        mock_page2.extract_text.return_value = "Page 2 content"

        mock_reader_instance = Mock()
        mock_reader_instance.pages = [mock_page1, mock_page2]
        mock_pdf_reader.return_value = mock_reader_instance

        text = text_extractor.extract_from_pdf(temp_pdf_file)

        assert "Page 1 content" in text
        assert "Page 2 content" in text

    def test_extract_from_pdf_file_not_found(self, text_extractor):
        """Test PDF extraction with missing file"""
        with pytest.raises(TextExtractionError, match="File not found"):
            text_extractor.extract_from_pdf("/nonexistent/file.pdf")

    @patch("app.services.text_extractor.PdfReader", None)
    def test_extract_from_pdf_library_not_installed(self, text_extractor):
        """Test PDF extraction when pypdf is not installed"""
        with pytest.raises(TextExtractionError, match="pypdf library not installed"):
            text_extractor.extract_from_pdf("dummy.pdf")

    @patch("app.services.text_extractor.PdfReader")
    def test_extract_from_pdf_empty_content(self, mock_pdf_reader, text_extractor, temp_pdf_file):
        """Test PDF extraction with no extractable text"""
        # Mock empty pages
        mock_page = Mock()
        mock_page.extract_text.return_value = ""

        mock_reader_instance = Mock()
        mock_reader_instance.pages = [mock_page]
        mock_pdf_reader.return_value = mock_reader_instance

        with pytest.raises(TextExtractionError, match="No text could be extracted"):
            text_extractor.extract_from_pdf(temp_pdf_file)

    @patch("app.services.text_extractor.PdfReader")
    def test_extract_from_pdf_page_error_handling(
        self, mock_pdf_reader, text_extractor, temp_pdf_file
    ):
        """Test PDF extraction with some pages failing"""
        # Mock pages with one failing
        mock_page1 = Mock()
        mock_page1.extract_text.return_value = "Page 1 content"

        mock_page2 = Mock()
        mock_page2.extract_text.side_effect = Exception("Page extraction failed")

        mock_page3 = Mock()
        mock_page3.extract_text.return_value = "Page 3 content"

        mock_reader_instance = Mock()
        mock_reader_instance.pages = [mock_page1, mock_page2, mock_page3]
        mock_pdf_reader.return_value = mock_reader_instance

        text = text_extractor.extract_from_pdf(temp_pdf_file)

        # Should still extract from successful pages
        assert "Page 1 content" in text
        assert "Page 3 content" in text


class TestDOCXExtraction:
    """Test DOCX file extraction"""

    @patch("app.services.text_extractor.DocxDocument")
    def test_extract_from_docx_success(self, mock_docx_doc, text_extractor, temp_docx_file):
        """Test successful DOCX extraction"""
        # Mock DOCX document
        mock_paragraph1 = Mock()
        mock_paragraph1.text = "First paragraph"

        mock_paragraph2 = Mock()
        mock_paragraph2.text = "Second paragraph"

        mock_doc_instance = Mock()
        mock_doc_instance.paragraphs = [mock_paragraph1, mock_paragraph2]
        mock_docx_doc.return_value = mock_doc_instance

        text = text_extractor.extract_from_docx(temp_docx_file)

        assert text is not None
        assert "First paragraph" in text
        assert "Second paragraph" in text
        mock_docx_doc.assert_called_once_with(temp_docx_file)

    def test_extract_from_docx_file_not_found(self, text_extractor):
        """Test DOCX extraction with missing file"""
        with pytest.raises(TextExtractionError, match="File not found"):
            text_extractor.extract_from_docx("/nonexistent/file.docx")

    @patch("app.services.text_extractor.DocxDocument", None)
    def test_extract_from_docx_library_not_installed(self, text_extractor):
        """Test DOCX extraction when python-docx is not installed"""
        with pytest.raises(TextExtractionError, match="python-docx library not installed"):
            text_extractor.extract_from_docx("dummy.docx")

    @patch("app.services.text_extractor.DocxDocument")
    def test_extract_from_docx_empty_content(self, mock_docx_doc, text_extractor, temp_docx_file):
        """Test DOCX extraction with no text"""
        # Mock empty document
        mock_doc_instance = Mock()
        mock_doc_instance.paragraphs = []
        mock_docx_doc.return_value = mock_doc_instance

        with pytest.raises(TextExtractionError, match="No text could be extracted"):
            text_extractor.extract_from_docx(temp_docx_file)

    @patch("app.services.text_extractor.DocxDocument")
    def test_extract_from_docx_whitespace_only(self, mock_docx_doc, text_extractor, temp_docx_file):
        """Test DOCX extraction with whitespace-only paragraphs"""
        # Mock document with whitespace paragraphs
        mock_paragraph1 = Mock()
        mock_paragraph1.text = "   "

        mock_paragraph2 = Mock()
        mock_paragraph2.text = "Actual content"

        mock_doc_instance = Mock()
        mock_doc_instance.paragraphs = [mock_paragraph1, mock_paragraph2]
        mock_docx_doc.return_value = mock_doc_instance

        text = text_extractor.extract_from_docx(temp_docx_file)

        # Should skip whitespace-only paragraphs
        assert "Actual content" in text
        assert "   " not in text


class TestMainExtractMethod:
    """Test main extract_text dispatcher method"""

    @patch("app.services.text_extractor.TextExtractor.extract_from_pdf")
    def test_extract_text_pdf(self, mock_extract_pdf, text_extractor):
        """Test extract_text dispatches to PDF extractor"""
        mock_extract_pdf.return_value = "PDF content"

        result = text_extractor.extract_text("/path/to/file.pdf", "pdf")

        assert result == "PDF content"
        mock_extract_pdf.assert_called_once_with("/path/to/file.pdf")

    @patch("app.services.text_extractor.TextExtractor.extract_from_docx")
    def test_extract_text_docx(self, mock_extract_docx, text_extractor):
        """Test extract_text dispatches to DOCX extractor"""
        mock_extract_docx.return_value = "DOCX content"

        result = text_extractor.extract_text("/path/to/file.docx", "docx")

        assert result == "DOCX content"
        mock_extract_docx.assert_called_once_with("/path/to/file.docx")

    @patch("app.services.text_extractor.TextExtractor.extract_from_markdown")
    def test_extract_text_markdown(self, mock_extract_md, text_extractor):
        """Test extract_text dispatches to Markdown extractor"""
        mock_extract_md.return_value = "Markdown content"

        result = text_extractor.extract_text("/path/to/file.md", "md")

        assert result == "Markdown content"
        mock_extract_md.assert_called_once_with("/path/to/file.md")

    @patch("app.services.text_extractor.TextExtractor.extract_from_markdown")
    def test_extract_text_markdown_alternate(self, mock_extract_md, text_extractor):
        """Test extract_text handles 'markdown' type"""
        mock_extract_md.return_value = "Markdown content"

        result = text_extractor.extract_text("/path/to/file.md", "markdown")

        assert result == "Markdown content"
        mock_extract_md.assert_called_once_with("/path/to/file.md")

    def test_extract_text_unsupported_type(self, text_extractor):
        """Test extract_text with unsupported file type"""
        with pytest.raises(TextExtractionError, match="Unsupported file type"):
            text_extractor.extract_text("/path/to/file.txt", "txt")

    def test_extract_text_case_insensitive(self, text_extractor):
        """Test extract_text handles uppercase file types"""
        with patch.object(text_extractor, "extract_from_pdf") as mock_extract:
            mock_extract.return_value = "Content"
            text_extractor.extract_text("/path/to/file.pdf", "PDF")
            mock_extract.assert_called_once()


class TestTextQualityValidation:
    """Test text quality validation"""

    def test_validate_text_quality_valid(self, text_extractor):
        """Test validation with valid text"""
        assert text_extractor.validate_text_quality("This is valid text content")

    def test_validate_text_quality_empty(self, text_extractor):
        """Test validation with empty text"""
        assert not text_extractor.validate_text_quality("")
        assert not text_extractor.validate_text_quality("   ")

    def test_validate_text_quality_too_short(self, text_extractor):
        """Test validation with text too short"""
        assert not text_extractor.validate_text_quality("Short", min_length=10)

    def test_validate_text_quality_custom_min_length(self, text_extractor):
        """Test validation with custom minimum length"""
        text = "Test"
        assert text_extractor.validate_text_quality(text, min_length=3)
        assert not text_extractor.validate_text_quality(text, min_length=10)
