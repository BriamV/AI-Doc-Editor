# T-04-ST1: Upload Endpoint Architecture

**Status:** ✅ Completado
**Date:** 2025-10-01
**Author:** Backend Architecture Team
**Release:** R1.WP1

## Executive Summary

Implementation of REST API endpoint `/api/upload` with comprehensive file validation, secure storage, and audit logging. This is the foundation layer for the RAG document ingestion pipeline (T-04).

## Architecture Overview

```
┌─────────────┐
│   Client    │
│  (OAuth)    │
└──────┬──────┘
       │ POST /api/upload
       │ (multipart/form-data)
       ▼
┌─────────────────────────────────────┐
│    Upload Router                    │
│  - Authentication (OAuth JWT)       │
│  - Request validation               │
│  - Error handling                   │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│    Upload Service                   │
│  - Orchestration layer              │
│  - Database operations              │
│  - Audit logging                    │
└──────┬──────────────────────────────┘
       │
       ├──────────────┬──────────────┬──────────────┐
       ▼              ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│File      │  │Storage   │  │Database  │  │Audit     │
│Validator │  │Layer     │  │(SQLite)  │  │Service   │
│(MIME)    │  │(./uploads)│  │          │  │(WORM)    │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```

## Service Boundaries

### 1. **Upload Router** (`backend/app/routers/upload.py`)
**Responsibility:** HTTP layer, request/response handling

**API Endpoints:**
- `POST /api/upload` - Upload document with validation
- `GET /api/documents` - List user documents (paginated)
- `GET /api/documents/{id}` - Retrieve document metadata
- `DELETE /api/documents/{id}` - Soft/hard delete document

**Authentication:** OAuth 2.0 JWT (reuses T-02 implementation)

**Rate Limiting:** Inherits from global middleware

### 2. **Upload Service** (`backend/app/services/upload_service.py`)
**Responsibility:** Business logic orchestration

**Key Operations:**
- Coordinate validation → storage → database → audit pipeline
- Transaction management (rollback on failure)
- File cleanup on errors
- Document lifecycle management

**Error Handling:**
- Validation errors → 400 Bad Request
- Storage errors → 500 Internal Server Error (cleanup storage)
- Database errors → 500 Internal Server Error (cleanup storage + rollback)

### 3. **File Validator** (`backend/app/services/file_validator.py`)
**Responsibility:** File content validation

**Validation Rules:**
| Check | Limit | Error Message |
|-------|-------|---------------|
| File extension | .pdf, .docx, .md | "Invalid file extension" |
| File size (min) | 1 KB | "File too small" |
| File size (max) | 10 MB | "File too large" |
| MIME type | See table below | "File content does not match extension" |

**Allowed MIME Types:**
```python
{
    "application/pdf": ["pdf"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
    "text/markdown": ["md"],
    "text/plain": ["md"]  # Markdown often detected as plain text
}
```

**MIME Detection:** Uses `python-magic` library to detect actual file content type

## Database Schema

### Document Model (`backend/app/models/document.py`)

```sql
CREATE TABLE documents (
    id VARCHAR(36) PRIMARY KEY,              -- UUID
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(10) NOT NULL,          -- pdf, docx, md
    mime_type VARCHAR(100) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,      -- Relative path
    file_size_bytes INTEGER NOT NULL,

    -- Metadata
    title VARCHAR(500),
    description TEXT,

    -- Processing status
    status VARCHAR(20) NOT NULL DEFAULT 'uploaded',  -- uploaded, processing, indexed, failed
    processing_error TEXT,

    -- RAG integration (future: T-04-ST2, ST3, ST4)
    chunk_count INTEGER,
    embedding_model VARCHAR(100),
    vector_store_id VARCHAR(100),

    -- User context
    user_id VARCHAR(36),
    user_email VARCHAR(255),

    -- Temporal
    uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,
    last_accessed_at DATETIME,
    deleted_at DATETIME,  -- Soft delete support

    -- Indexes
    INDEX idx_user_status (user_id, status),
    INDEX idx_user_uploaded (user_id, uploaded_at),
    INDEX idx_file_type_status (file_type, status)
);
```

**Key Design Decisions:**
1. **UUID Primary Key:** Better distribution, security (no enumeration attacks)
2. **Soft Delete:** `deleted_at` allows recovery, maintains referential integrity
3. **Status Enum:** Tracks document lifecycle (uploaded → processing → indexed)
4. **Composite Indexes:** Optimized for common queries (user's documents by status)

## Storage Strategy

### File System Organization

```
./uploads/
├── {user_id}/
│   ├── 2025/
│   │   ├── 10/
│   │   │   ├── {document_id}.pdf
│   │   │   ├── {document_id}.docx
│   │   │   └── {document_id}.md
│   │   └── 11/
│   └── 2026/
└── anonymous/  # Fallback for missing user_id
```

**Rationale:**
- **User isolation:** Simplifies access control, cleanup on user deletion
- **Date partitioning:** Efficient backup/archival, easy to find recent files
- **UUID filename:** Prevents name collisions, secure (non-guessable)

**Storage Path Example:**
```
user-123/2025/10/a3f4b2c1-7d8e-4f5g-9h0i-1j2k3l4m5n6o.pdf
```

## Security Measures

### 1. Authentication & Authorization
- **Requirement:** Valid OAuth 2.0 JWT token (from T-02)
- **Access Control:** Users can only access their own documents
- **Token Validation:** Reuses `AuthService.verify_token()`

### 2. File Validation
- **MIME Type Detection:** Content-based (prevents extension spoofing)
- **Size Limits:** 1 KB - 10 MB (prevents DoS)
- **Allowed Types:** Whitelist only (PDF, DOCX, MD)

### 3. Audit Logging (WORM Compliance)
All operations logged to immutable audit system:
```python
{
    "action_type": "document_create",
    "user_id": "user-123",
    "user_email": "user@example.com",
    "resource_type": "document",
    "resource_id": "doc-456",
    "ip_address": "192.168.1.100",
    "status": "success",
    "details": {
        "filename": "document.pdf",
        "file_size_bytes": 1048576
    }
}
```

### 4. Error Handling
- **Storage Cleanup:** Failed uploads remove partial files
- **Transaction Rollback:** Database errors don't leave orphaned records
- **Safe Error Messages:** No sensitive information leaked to client

## API Contract

### POST /api/upload

**Request:**
```http
POST /api/upload HTTP/1.1
Authorization: Bearer {jwt_token}
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="document.pdf"
Content-Type: application/pdf

{binary_pdf_content}
------WebKitFormBoundary
Content-Disposition: form-data; name="title"

My Document Title
------WebKitFormBoundary
Content-Disposition: form-data; name="description"

Optional document description
------WebKitFormBoundary--
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "document": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "original_filename": "document.pdf",
    "file_type": "pdf",
    "mime_type": "application/pdf",
    "file_size_bytes": 1048576,
    "title": "My Document Title",
    "description": "Optional document description",
    "status": "uploaded",
    "user_id": "user-123",
    "user_email": "user@example.com",
    "uploaded_at": "2025-10-01T12:00:00Z"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "detail": "File too large. Maximum size: 10.00 MB"
}
```

## Technology Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Web Framework | FastAPI | Async support, auto OpenAPI docs |
| Validation | Pydantic v2 | Type safety, automatic validation |
| MIME Detection | python-magic | Content-based detection |
| Database | SQLAlchemy (async) | ORM with migration support |
| Authentication | OAuth 2.0 JWT | Existing T-02 integration |
| Audit | WORM System | Existing T-13 integration |

## Performance Considerations

### Current Implementation (ST1)
- **Upload Time:** O(1) - Direct file write, single DB insert
- **Validation:** O(1) - Reads first 8KB for MIME detection
- **Database:** Indexed queries for common operations
- **Storage:** Local filesystem (sufficient for MVP)

### Future Optimizations (ST2-ST6)
- **Chunked Upload:** For files > 10MB
- **Background Processing:** Async RAG pipeline (ST2-ST4)
- **Object Storage:** S3/MinIO for production scale
- **CDN:** For serving processed documents

## Integration Points

### Existing Systems
1. **OAuth Authentication (T-02):** Reuses `AuthService.verify_token()`
2. **Audit System (T-13):** Logs all document operations
3. **Rate Limiting:** Inherits global middleware
4. **Security Headers:** Inherits from main.py

### Future Integration (ST2-ST6)
1. **Text Extraction (ST2):** Will read from `storage_path`
2. **OpenAI Embeddings (ST3):** Will update `embedding_model`, `chunk_count`
3. **ChromaDB (ST4):** Will update `vector_store_id`, `status="indexed"`
4. **Performance Monitoring (ST5-ST6):** JMeter/Locust benchmarks

## Testing Strategy

### Integration Tests (`backend/tests/integration/test_upload.py`)

**Test Coverage:**
- ✅ Valid PDF upload (200 OK)
- ✅ Valid Markdown upload (200 OK)
- ✅ Invalid file extension (400 Bad Request)
- ✅ File too large (400 Bad Request)
- ✅ Empty file (400 Bad Request)
- ✅ Missing authentication (401 Unauthorized)
- ✅ MIME type mismatch (400 Bad Request)
- ✅ List documents with filters
- ✅ Retrieve document by ID
- ✅ Delete document (soft/hard)

**Test Execution:**
```bash
pytest backend/tests/integration/test_upload.py -v
```

## Deployment Considerations

### Environment Variables
```bash
# Required
DATABASE_URL=sqlite+aiosqlite:///./app.db
SECRET_KEY=<production-jwt-secret>

# Upload configuration
UPLOAD_STORAGE_PATH=./uploads
UPLOAD_MAX_FILE_SIZE=10485760  # 10MB in bytes
```

### File System Permissions
```bash
mkdir -p ./uploads
chmod 755 ./uploads
chown app-user:app-user ./uploads
```

### Database Migration
```bash
# Create migration (when ready)
alembic revision -m "Add documents table for T-04-ST1"
alembic upgrade head
```

## Potential Bottlenecks

### Identified Risks
1. **Storage Growth:** Local filesystem may exhaust disk space
   - **Mitigation:** Implement storage quotas per user (future)
   - **Mitigation:** Move to object storage (S3/MinIO) for production

2. **Concurrent Uploads:** High load may overwhelm filesystem
   - **Mitigation:** Rate limiting (already implemented)
   - **Mitigation:** Queue-based upload processing (future)

3. **Large Files:** 10MB limit may be insufficient for some PDFs
   - **Mitigation:** Chunked upload support (ST2)
   - **Mitigation:** Configurable limit via environment variable

## Future Enhancements (Out of Scope for ST1)

### ST2-ST4: RAG Pipeline
- Text extraction (pypdf, python-docx)
- Text chunking strategies
- OpenAI embeddings generation
- ChromaDB integration

### Production Features
- Resumable uploads (chunked transfer)
- Image/OCR support for scanned PDFs
- Document versioning
- Collaborative editing metadata
- Virus scanning integration

## Success Metrics

### Acceptance Criteria (ST1) ✅
- [x] Endpoint POST /api/upload accepts multipart/form-data
- [x] Validates file types (PDF, DOCX, MD)
- [x] Validates file size (1 KB - 10 MB)
- [x] Detects MIME type from content
- [x] Stores file in organized structure
- [x] Creates database record with metadata
- [x] Logs operations to audit system
- [x] Returns appropriate HTTP status codes
- [x] Integration tests cover valid/invalid cases

### OpenAPI Documentation
FastAPI auto-generates OpenAPI docs at `/docs`:
- Endpoint descriptions
- Request/response schemas
- Example payloads
- Authentication requirements

## References

- **Task Definition:** `docs/tasks/T-04-STATUS.md`
- **Subtask:** R1.WP1-T04-ST1
- **Related Tasks:**
  - T-02: OAuth 2.0 + JWT (authentication)
  - T-13: WORM Audit System (logging)
  - T-41: User API Key Management (user context)

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-10-01 | Backend Team | Initial architecture implementation (ST1 complete) |

---

**Status:** ✅ Implementation Complete
**Next:** ST2 - Text Extraction & Chunking
