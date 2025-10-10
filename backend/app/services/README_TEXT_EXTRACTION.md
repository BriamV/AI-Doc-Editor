# Text Extraction Service

## Overview

The `TextExtractionService` provides a unified interface for extracting text from various document formats (PDF, DOCX, Markdown) with support for intelligent text chunking for RAG (Retrieval-Augmented Generation) processing.

**Task Reference**: T-04 ST2 - Text Extraction and Chunking Service

## Features

- **Multi-Format Support**: Extract text from PDF, DOCX, and Markdown files
- **Async/Await Pattern**: Non-blocking I/O using asyncio and thread pools
- **Intelligent Chunking**: Split text at word boundaries with configurable overlap
- **Error Handling**: Comprehensive exception hierarchy for different error types
- **Type Safety**: Full type annotations with MyPy validation
- **Defensive Programming**: File existence checks, empty file detection, validation

## Supported File Types

| Format | Extension | Library Used | Features |
|--------|-----------|--------------|----------|
| PDF | `.pdf` | PyPDF2 | Multi-page extraction, page-level error handling |
| DOCX | `.docx` | python-docx | Paragraph and table text extraction |
| Markdown | `.md` | Native Python | UTF-8 encoding support |

## Architecture

### Class Design

```
TextExtractionService
├── extract_text()           # Main extraction router
├── extract_pdf()            # PDF-specific extraction
├── extract_docx()           # DOCX-specific extraction
├── extract_markdown()       # Markdown-specific extraction
├── chunk_text()             # Text chunking with overlap
└── extract_and_chunk()      # Combined operation
```

### Exception Hierarchy

```
TextExtractionError (base)
├── UnsupportedFileTypeError
├── FileNotFoundError
├── EmptyFileError
```

## Usage Examples

### Basic Text Extraction

```python
from pathlib import Path
from app.services.text_extraction_service import TextExtractionService

# Initialize service
service = TextExtractionService()

# Extract text from PDF
text = await service.extract_text(
    file_path=Path("document.pdf"),
    file_type="pdf"
)

print(f"Extracted {len(text)} characters")
```

### Text Chunking

```python
# Chunk text with default settings (1000 chars, 200 overlap)
chunks = service.chunk_text(text)

# Custom chunk size and overlap
chunks = service.chunk_text(
    text=text,
    chunk_size=500,
    overlap=100
)

print(f"Created {len(chunks)} chunks")
```

### Combined Extraction and Chunking

```python
# Extract and chunk in one operation
chunks = await service.extract_and_chunk(
    file_path=Path("document.docx"),
    file_type="docx",
    chunk_size=800,
    overlap=150
)
```

### Custom Configuration

```python
# Initialize with custom defaults
service = TextExtractionService(
    chunk_size=1500,  # Larger chunks for embeddings
    overlap=300       # More overlap for context
)
```

### Error Handling

```python
from app.services.text_extraction_service import (
    TextExtractionService,
    UnsupportedFileTypeError,
    FileNotFoundError,
    EmptyFileError
)

try:
    text = await service.extract_text(file_path, file_type)
except FileNotFoundError:
    print("File does not exist")
except UnsupportedFileTypeError:
    print("File type not supported")
except EmptyFileError:
    print("File contains no text")
except TextExtractionError as e:
    print(f"Extraction failed: {e}")
```

## API Reference

### TextExtractionService Class

#### Constructor

```python
def __init__(
    chunk_size: int = 1000,
    overlap: int = 200
) -> None
```

**Parameters**:
- `chunk_size`: Default chunk size in characters (must be > 0)
- `overlap`: Default overlap between chunks in characters (must be >= 0 and < chunk_size)

**Raises**:
- `ValueError`: If chunk_size or overlap parameters are invalid

#### extract_text()

```python
async def extract_text(
    file_path: Path,
    file_type: str
) -> str
```

Main extraction method that routes to format-specific extractors.

**Parameters**:
- `file_path`: Path to file to extract text from
- `file_type`: File type ('pdf', 'docx', 'md')

**Returns**: Extracted text as string

**Raises**:
- `FileNotFoundError`: If file does not exist
- `UnsupportedFileTypeError`: If file type is not supported
- `EmptyFileError`: If file contains no extractable text
- `TextExtractionError`: For other extraction errors

#### chunk_text()

```python
def chunk_text(
    text: str,
    chunk_size: Optional[int] = None,
    overlap: Optional[int] = None
) -> List[str]
```

Split text into overlapping chunks at word boundaries.

**Parameters**:
- `text`: Text to chunk
- `chunk_size`: Size of each chunk in characters (uses default if None)
- `overlap`: Overlap between chunks in characters (uses default if None)

**Returns**: List of text chunks

**Raises**:
- `ValueError`: If chunk_size or overlap parameters are invalid

**Chunking Algorithm**:
1. Splits at word boundaries (spaces) to avoid breaking words
2. Maintains at least 80% of chunk_size per chunk
3. Ensures overlap between consecutive chunks for context preservation
4. Handles edge cases (empty text, text shorter than chunk_size)

#### extract_and_chunk()

```python
async def extract_and_chunk(
    file_path: Path,
    file_type: str,
    chunk_size: Optional[int] = None,
    overlap: Optional[int] = None
) -> List[str]
```

Convenience method combining extraction and chunking.

**Parameters**: Same as extract_text() and chunk_text() combined

**Returns**: List of text chunks

**Raises**: Same as extract_text() and chunk_text()

## Implementation Details

### Async I/O Pattern

All file I/O operations run in thread pool executors to avoid blocking the event loop:

```python
loop = asyncio.get_event_loop()
text = await loop.run_in_executor(
    None,
    partial(self._extract_pdf_sync, file_path)
)
```

### PDF Extraction

- Uses PyPDF2's PdfReader
- Extracts text page-by-page
- Handles page-level errors gracefully (logs warning, continues)
- Joins pages with double newlines

### DOCX Extraction

- Uses python-docx library
- Extracts text from paragraphs
- Extracts text from table cells (formatted with pipe separators)
- Joins sections with double newlines

### Markdown Extraction

- Plain text reading with UTF-8 encoding
- Preserves markdown syntax (no parsing)
- Suitable for embedding markdown content as-is

### Chunking Strategy

The chunking algorithm optimizes for:
1. **Context Preservation**: Overlap ensures adjacent chunks share context
2. **Word Integrity**: Splits at word boundaries, not mid-word
3. **Consistent Size**: Maintains at least 80% of target chunk_size
4. **Efficiency**: Single-pass algorithm with minimal overhead

## Performance Considerations

### Memory Usage

- Text loaded entirely into memory (consider streaming for very large files)
- Chunking creates new string objects (Python copy-on-write optimization)

### I/O Performance

- Async I/O prevents blocking
- Thread pool executor for CPU-bound operations (PDF/DOCX parsing)
- Single file read per extraction

### Recommendations

- For files > 50MB: Consider streaming extraction (future enhancement)
- For batch processing: Use asyncio.gather() to process multiple files concurrently
- For embeddings: Choose chunk_size based on model's context window (typically 512-2048 tokens)

## Testing

### Unit Tests

Create comprehensive tests in `backend/tests/test_text_extraction_service.py`:

```python
import pytest
from pathlib import Path
from app.services.text_extraction_service import TextExtractionService

@pytest.mark.asyncio
async def test_extract_pdf():
    service = TextExtractionService()
    text = await service.extract_text(
        Path("test_files/sample.pdf"),
        "pdf"
    )
    assert len(text) > 0

@pytest.mark.asyncio
async def test_chunk_text():
    service = TextExtractionService(chunk_size=100, overlap=20)
    chunks = service.chunk_text("a " * 200)  # 400 chars
    assert len(chunks) > 1
    assert all(len(chunk) <= 120 for chunk in chunks)  # Allow some variance

@pytest.mark.asyncio
async def test_empty_file_error():
    service = TextExtractionService()
    # Create empty file for testing
    with pytest.raises(EmptyFileError):
        await service.extract_text(Path("empty.pdf"), "pdf")
```

### Integration Tests

Test with real document samples:
- PDF with multiple pages
- DOCX with tables and formatting
- Markdown with code blocks and headers

## Dependencies

Required packages (already in `requirements.txt`):
- `PyPDF2==3.0.1` - PDF text extraction
- `python-docx==1.1.0` - DOCX text extraction

## Security Considerations

- **Path Validation**: Service receives Path objects (caller responsible for sanitization)
- **File Size Limits**: Caller should validate file size before extraction
- **Resource Limits**: Large files load entirely into memory (consider limits)
- **Error Information**: Error messages avoid exposing sensitive file paths

## Future Enhancements

1. **Streaming Extraction**: For very large files (> 50MB)
2. **Additional Formats**: RTF, HTML, plain text
3. **OCR Integration**: Extract text from scanned PDFs
4. **Metadata Extraction**: Document properties, author, creation date
5. **Smart Chunking**: Semantic chunking based on sentence/paragraph boundaries
6. **Caching**: Cache extracted text for repeated access
7. **Progress Callbacks**: Report extraction progress for large files

## References

- **PyPDF2 Documentation**: https://pypdf2.readthedocs.io/
- **python-docx Documentation**: https://python-docx.readthedocs.io/
- **asyncio Documentation**: https://docs.python.org/3/library/asyncio.html
- **RAG Best Practices**: Chunking strategies for embeddings

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-10-09 | Initial implementation (T-04 ST2) |

---

**File**: `backend/app/services/text_extraction_service.py`
**Author**: Backend Architecture Team
**Last Updated**: 2025-10-09
