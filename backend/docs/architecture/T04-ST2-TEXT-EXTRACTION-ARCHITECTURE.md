# T-04-ST2: Text Extraction and Chunking Architecture

**Date**: 2025-10-01
**Author**: Backend Architect
**Status**: Implemented
**Complexity**: 5 points

## Overview

This document describes the architecture and implementation of the text extraction and chunking services for the RAG (Retrieval-Augmented Generation) pipeline. These services process uploaded documents (PDF, DOCX, Markdown) to extract text content and split it into overlapping chunks for efficient embedding generation and retrieval.

## Components

### 1. TextExtractor Service

**Location**: `backend/app/services/text_extractor.py`

**Purpose**: Extract raw text content from different document formats.

**Supported Formats**:
- **PDF**: Using `pypdf` library (replaces deprecated PyPDF2)
- **DOCX**: Using `python-docx` library
- **Markdown**: Direct UTF-8 file reading

**Key Features**:
- Format-specific extraction strategies
- Quality validation (minimum 10 characters)
- Comprehensive error handling
- Detailed logging for debugging
- Graceful fallback for missing dependencies

**API**:
```python
class TextExtractor:
    def extract_text(file_path: str, file_type: str) -> str
    def extract_from_pdf(file_path: str) -> str
    def extract_from_docx(file_path: str) -> str
    def extract_from_markdown(file_path: str) -> str
```

### 2. TextChunker Service

**Location**: `backend/app/services/text_chunker.py`

**Purpose**: Split text into overlapping chunks optimized for embedding generation.

**Configuration**:
- **Default Chunk Size**: 1000 characters
- **Default Overlap**: 200 characters (20%)
- Both values are configurable

**Key Features**:
- Text normalization (whitespace, line breaks)
- Sentence boundary preservation
- Overlap management for context continuity
- Chunk metadata generation
- Performance validation (prevents infinite loops)

**API**:
```python
class TextChunker:
    def chunk_text(
        text: str,
        chunk_size: int = 1000,
        overlap: int = 200
    ) -> List[str]

    def chunk_text_with_metadata(
        text: str,
        chunk_size: int = 1000,
        overlap: int = 200,
        source_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]
```

## Design Decisions

### 1. Library Selection

**PDF: pypdf vs PyPDF2**
- **Decision**: Use `pypdf` (4.0.1)
- **Rationale**:
  - PyPDF2 is deprecated and unmaintained
  - pypdf is the official successor with active development
  - Better Unicode support and bug fixes
  - More reliable text extraction

**DOCX: python-docx**
- **Decision**: Use `python-docx` (1.1.0)
- **Rationale**:
  - Industry standard for DOCX manipulation
  - Mature library with good documentation
  - Supports complex document structures
  - Actively maintained

### 2. Chunking Strategy

**Overlapping Chunks**
- **Decision**: 20% overlap (200 chars on 1000 char chunks)
- **Rationale**:
  - Prevents context loss at chunk boundaries
  - Improves retrieval accuracy for queries spanning chunks
  - Standard practice in RAG systems
  - Balances redundancy vs coverage

**Sentence Boundary Preservation**
- **Decision**: Attempt to break at sentence boundaries
- **Rationale**:
  - Maintains semantic coherence
  - Better embedding quality
  - More natural retrieval results
  - Fallback to character-based chunking when needed

**Configurable Chunk Size**
- **Decision**: Default 1000 characters, configurable
- **Rationale**:
  - 1000 chars ≈ 200-250 tokens (within embedding model limits)
  - Allows tuning for specific use cases
  - Balances granularity vs context
  - Standard size for text-embedding-3-small

### 3. Text Normalization

**Whitespace Handling**
- Normalize line breaks to \n
- Collapse multiple spaces to single space
- Preserve paragraph structure

**Why Normalize**:
- Consistent chunk sizes
- Better embedding quality
- Easier debugging and testing
- Reduces token waste

## Integration with Upload Pipeline

### Current State (ST2)
Services are **standalone** - ready for integration but not yet connected to UploadService.

### Future Integration (ST3+)
```python
# Planned integration in UploadService
async def process_document(self, document_id: str):
    # 1. Load document from database
    document = await self.get_document_by_id(document_id)

    # 2. Update status to "processing"
    document.status = DocumentStatus.PROCESSING
    await session.commit()

    # 3. Extract text
    extractor = TextExtractor()
    text = extractor.extract_text(document.storage_path, document.file_type)

    # 4. Chunk text
    chunker = TextChunker()
    chunks = chunker.chunk_text(text)

    # 5. Update document with chunk count
    document.chunk_count = len(chunks)
    document.status = DocumentStatus.PROCESSED
    await session.commit()

    # 6. Return chunks for embedding generation (ST3)
    return chunks
```

## Error Handling

### File Access Errors
- Missing files → FileNotFoundError
- Permission issues → PermissionError
- Corrupted files → ValueError with detailed message

### Format-Specific Errors
- Invalid PDF structure → Logged warning, return empty string
- Corrupted DOCX → Logged error, raise ValueError
- Encoding issues → UTF-8 decode with error handling

### Quality Validation
- Minimum 10 characters extracted
- Raises ValueError if extraction yields no usable text
- Logs warnings for suspiciously short extractions

## Testing Strategy

### Unit Tests
- **Coverage**: 86.73% (TextExtractor), 98.70% (TextChunker)
- **Test Files**: 65 tests across 2 test files
- **Fixtures**: Sample documents in `tests/fixtures/documents/`

### Test Scenarios
1. **Format-Specific Extraction**:
   - Valid PDF extraction
   - Valid DOCX extraction
   - Valid Markdown extraction

2. **Error Handling**:
   - Missing files
   - Corrupted files
   - Invalid file types
   - Encoding issues

3. **Chunking Logic**:
   - Various text sizes (short, medium, long)
   - Overlap validation
   - Sentence boundary preservation
   - Edge cases (empty text, single character)

4. **Performance**:
   - Large document handling
   - Unicode and special characters
   - Memory efficiency

### Test Execution
```bash
# Run unit tests
pytest backend/tests/unit/test_text_extractor.py -v
pytest backend/tests/unit/test_text_chunker.py -v

# With coverage
pytest backend/tests/unit/ --cov=app.services.text_extractor --cov=app.services.text_chunker
```

## Performance Considerations

### Memory Usage
- Stream large PDFs page-by-page (not yet implemented, planned for optimization)
- Efficient string operations (join over concatenation)
- Minimal temporary objects

### Processing Speed
- Average extraction time:
  - PDF: ~100ms per page
  - DOCX: ~50ms per document
  - Markdown: <10ms (direct read)

### Scalability
- Services are stateless (can be parallelized)
- No database operations in extraction/chunking
- Ready for async/background processing

## Dependencies

```txt
pypdf==4.0.1                # PDF text extraction
python-docx==1.1.0          # DOCX text extraction
```

**Dev Dependencies**:
```txt
pytest-cov                  # Test coverage reporting
pytest-timeout              # Test timeout protection
```

## Security Considerations

1. **File Size Limits**: Enforced at upload layer (ST1)
2. **Path Validation**: All file paths validated in UploadService
3. **Encoding Safety**: UTF-8 decoding with error handling
4. **Resource Limits**: No recursive parsing, bounded memory usage

## Future Enhancements

### ST3: Embedding Generation
- Integrate with OpenAI API
- Batch processing for chunks
- Embedding caching strategy

### ST4: Vector Storage
- Store chunks with embeddings in ChromaDB
- Implement upsert logic for document updates
- Metadata association

### Performance Optimizations
- Streaming for large PDFs
- Async extraction for parallel processing
- Caching for frequently accessed documents
- OCR support for scanned PDFs

## References

- **T-04 Task**: `docs/tasks/T-04-STATUS.md`
- **ST1 Architecture**: `backend/docs/architecture/T04-ST1-UPLOAD-ARCHITECTURE.md`
- **pypdf Documentation**: https://pypdf.readthedocs.io/
- **python-docx Documentation**: https://python-docx.readthedocs.io/
- **RAG Best Practices**: OpenAI Embeddings Guide

---

**Change Log**:
- 2025-10-01: Initial implementation (ST2 complete)
