# Consent Management API Endpoints

**Task:** T-24 - Consent Management
**Status:** ✅ Completed (2025-10-24)
**Purpose:** API specification for consent tracking in document upload workflow

---

## Overview

This document describes the API endpoints and integration patterns for consent management in the document upload workflow. All consent operations are integrated into the existing `/api/upload` endpoint with additional validation and audit logging.

### Key Features

- ✅ **Consent Required**: Upload fails with 400 error if consent not provided
- ✅ **Audit Logging**: All consent events logged to WORM audit system (T-13)
- ✅ **Metadata Tracking**: IP address, timestamp, version recorded in database
- ✅ **JWT Authentication**: All operations require valid JWT token
- ✅ **Multi-tenancy**: Consent tracked per user with UUID isolation

---

## Endpoints

### POST /api/upload

Upload a document with explicit user consent for AI processing.

**Authentication:** Required (JWT Bearer token)

**Content-Type:** `multipart/form-data`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | File | Yes | Document file (.pdf, .docx, .md) |
| `consent_given` | String | Yes | User consent ("true" or "false") |

**Request Example:**

```http
POST /api/upload HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="report.pdf"
Content-Type: application/pdf

<binary file content>
------WebKitFormBoundary
Content-Disposition: form-data; name="consent_given"

true
------WebKitFormBoundary--
```

**cURL Example:**

```bash
curl -X POST "https://api.example.com/api/upload" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/document.pdf" \
  -F "consent_given=true"
```

**Python Example:**

```python
import requests

url = "https://api.example.com/api/upload"
headers = {"Authorization": f"Bearer {jwt_token}"}
files = {"file": open("document.pdf", "rb")}
data = {"consent_given": "true"}

response = requests.post(url, headers=headers, files=files, data=data)
print(response.json())
```

**JavaScript/Fetch Example:**

```javascript
const formData = new FormData();
formData.append("file", fileObject);
formData.append("consent_given", "true");

const response = await fetch("https://api.example.com/api/upload", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${jwtToken}`,
  },
  body: formData,
});

const data = await response.json();
console.log(data);
```

---

## Responses

### Success Response (201 Created)

Document uploaded successfully with consent recorded.

**Response Body:**

```json
{
  "document_id": "a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6",
  "filename": "report.pdf",
  "file_type": "pdf",
  "file_size": 1024000,
  "status": "processing",
  "created_at": "2025-10-24T15:30:45.123Z"
}
```

**Database State:**

```sql
-- documents table
SELECT
  id, original_filename, consent_given, consent_timestamp,
  consent_version, consent_ip_address, status
FROM documents
WHERE id = 'a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6';
```

| Field | Value |
|-------|-------|
| `id` | `a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6` |
| `original_filename` | `report.pdf` |
| `consent_given` | `TRUE` |
| `consent_timestamp` | `2025-10-24 15:30:45.123000` |
| `consent_version` | `1.0` |
| `consent_ip_address` | `203.0.113.42` |
| `status` | `processing` |

**Audit Log Entry:**

```sql
-- audit_logs table (WORM - immutable)
SELECT action_type, resource_id, user_email, ip_address, description, details
FROM audit_logs
WHERE resource_id = 'a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6'
  AND action_type = 'document_consent_given';
```

| Field | Value |
|-------|-------|
| `action_type` | `document_consent_given` |
| `resource_id` | `a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6` |
| `user_email` | `user@example.com` |
| `ip_address` | `203.0.113.42` |
| `description` | `User consented to AI processing for document: report.pdf` |
| `details` | `{"document_id": "...", "filename": "report.pdf", "consent_version": "1.0"}` |

---

### Error Responses

#### 400 Bad Request - Consent Not Given

User did not provide consent for AI processing.

**Response Body:**

```json
{
  "detail": "Document upload requires explicit user consent. Please accept the consent agreement to process documents with AI."
}
```

**Trigger Condition:**

```python
# Backend validation
if not consent_given:
    raise HTTPException(
        status_code=400,
        detail="Document upload requires explicit user consent. "
               "Please accept the consent agreement to process documents with AI."
    )
```

**Frontend Handling:**

```typescript
try {
  const response = await uploadWithRetry({ file, token, consentGiven });
} catch (error) {
  if (error.response?.status === 400) {
    setError("You must provide consent to upload documents for AI processing.");
  }
}
```

---

#### 400 Bad Request - Invalid File Type

File type not supported (.pdf, .docx, .md only).

**Response Body:**

```json
{
  "detail": "Invalid file type. Allowed types: .pdf, .docx, .md"
}
```

---

#### 401 Unauthorized - Missing/Invalid JWT Token

Authentication required but token is missing or expired.

**Response Body:**

```json
{
  "detail": "Invalid or expired token"
}
```

**Headers:**

```
WWW-Authenticate: Bearer
```

---

#### 413 Payload Too Large - File Size Limit

File exceeds 10MB maximum size.

**Response Body:**

```json
{
  "detail": "File size exceeds 10.0MB limit"
}
```

---

#### 500 Internal Server Error - Server Failure

Unexpected server error during upload or database operation.

**Response Body:**

```json
{
  "detail": "Failed to upload document. Please try again."
}
```

---

## Consent Validation Flow

### Backend Validation Sequence

```python
# backend/app/routers/upload.py
@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    consent_given: str = Form(...),  # String "true" or "false"
    request: Request,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
    user_email: str = Depends(get_current_user_email),
):
    # Step 1: Parse consent string to boolean
    consent_bool = consent_given.lower() == "true"

    # Step 2: Extract IP address from request
    ip_address = request.client.host if request.client else None

    # Step 3: Validate and upload document with consent
    document_metadata = await document_service.upload_document(
        db=db,
        file=file,
        user_id=user_id,
        user_email=user_email,
        consent_given=consent_bool,      # ← Consent validation
        consent_ip_address=ip_address,   # ← IP tracking
    )

    # Step 4: Log consent event to audit system (WORM)
    consent_action = (
        AuditActionType.DOCUMENT_CONSENT_GIVEN
        if consent_bool
        else AuditActionType.DOCUMENT_CONSENT_REJECTED
    )

    await audit_service.log_event(
        action_type=consent_action,
        resource_type="document",
        resource_id=document_metadata["document_id"],
        user_id=user_id,
        user_email=user_email,
        ip_address=ip_address,
        description=f"User {'consented to' if consent_bool else 'rejected'} "
                    f"AI processing for document: {file.filename}",
        details={
            "document_id": document_metadata["document_id"],
            "filename": file.filename,
            "file_type": document_metadata["file_type"],
            "consent_version": "1.0",
            "consent_timestamp": datetime.utcnow().isoformat(),
            "consent_given": consent_bool,
        },
        status="success",
    )

    return document_metadata
```

### Service Layer Validation

```python
# backend/app/services/document_service.py
async def upload_document(
    self,
    db: AsyncSession,
    file: UploadFile,
    user_id: str,
    user_email: str,
    consent_given: bool = False,
    consent_ip_address: Optional[str] = None,
) -> Dict[str, Any]:
    """Upload document with consent validation."""

    # CRITICAL: Validate consent BEFORE processing file
    if not consent_given:
        raise HTTPException(
            status_code=400,
            detail="Document upload requires explicit user consent. "
                   "Please accept the consent agreement to process documents with AI."
        )

    # Save file to disk (only if consent given)
    # ...

    # Create database record with consent metadata
    document = await self.create_document_record(
        db=db,
        filename=file.filename,
        file_type=file_type,
        mime_type=file.content_type,
        file_size=file_size,
        file_path=relative_path,
        user_id=user_id,
        user_email=user_email,
        consent_given=consent_given,         # ← Stored in DB
        consent_ip_address=consent_ip_address,
    )

    return {
        "document_id": str(document.id),
        "filename": document.original_filename,
        "file_type": document.file_type,
        "file_size": document.file_size_bytes,
        "status": document.status.value,
        "created_at": document.uploaded_at.isoformat(),
    }
```

### Database Model

```python
# backend/app/models/document.py
class Document(Base):
    """Document model with consent tracking (T-24)."""

    __tablename__ = "documents"

    # Consent tracking fields (Migration 010)
    consent_given = Column(Boolean, nullable=False, default=False, index=True)
    consent_timestamp = Column(DateTime, nullable=True)
    consent_version = Column(String(20), nullable=True, default="1.0")
    consent_ip_address = Column(String(45), nullable=True)  # IPv6 support
```

---

## Audit Logging Integration

### Audit Event Types

```python
# backend/app/models/audit.py
class AuditActionType(str, Enum):
    """Audit action types for consent events."""

    DOCUMENT_CONSENT_GIVEN = "document_consent_given"
    DOCUMENT_CONSENT_REJECTED = "document_consent_rejected"
```

### Audit Log Creation

```python
# backend/app/services/audit.py
async def log_event(
    self,
    action_type: AuditActionType,
    resource_type: str,
    resource_id: str,
    user_id: str,
    user_email: str,
    ip_address: Optional[str],
    user_agent: Optional[str],
    description: str,
    details: Dict[str, Any],
    status: str = "success",
) -> None:
    """
    Log consent event to WORM audit system.

    Creates immutable audit record that cannot be updated or deleted.
    """
    audit_log = AuditLog(
        id=str(uuid.uuid4()),
        action_type=action_type.value,
        resource_type=resource_type,
        resource_id=resource_id,
        user_id=user_id,
        user_email=user_email,
        ip_address=ip_address,
        user_agent=user_agent,
        description=description,
        details=json.dumps(details),
        status=status,
        timestamp=datetime.utcnow(),
    )

    # WORM: Insert only, no UPDATE/DELETE allowed
    db.add(audit_log)
    await db.commit()
```

### Audit Log Query Examples

**Get all consent events for a user:**

```sql
SELECT
    action_type,
    resource_id,
    ip_address,
    timestamp,
    description,
    details
FROM audit_logs
WHERE
    user_id = 'e5f6g7h8-9i0j-1k2l-3m4n-5o6p7q8r9s0t'
    AND action_type IN ('document_consent_given', 'document_consent_rejected')
ORDER BY timestamp DESC;
```

**Get consent history for a document:**

```sql
SELECT
    action_type,
    user_email,
    ip_address,
    timestamp,
    details
FROM audit_logs
WHERE
    resource_type = 'document'
    AND resource_id = 'a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6'
    AND action_type LIKE 'document_consent_%'
ORDER BY timestamp ASC;
```

**Compliance report (last 90 days):**

```sql
SELECT
    DATE(timestamp) as date,
    COUNT(CASE WHEN action_type = 'document_consent_given' THEN 1 END) as consents_given,
    COUNT(CASE WHEN action_type = 'document_consent_rejected' THEN 1 END) as consents_rejected,
    COUNT(*) as total_events
FROM audit_logs
WHERE
    action_type LIKE 'document_consent_%'
    AND timestamp >= DATE('now', '-90 days')
GROUP BY DATE(timestamp)
ORDER BY date DESC;
```

---

## Testing

### Unit Tests

```python
# backend/tests/test_consent_validation.py

@pytest.mark.asyncio
async def test_upload_without_consent_fails():
    """Test that upload without consent is rejected."""
    document_service = DocumentService()
    mock_db = AsyncMock()
    mock_file = Mock()
    mock_file.filename = "test.pdf"
    mock_file.content_type = "application/pdf"
    mock_file.read = AsyncMock(return_value=b"fake pdf content")

    with pytest.raises(HTTPException) as exc_info:
        await document_service.upload_document(
            db=mock_db,
            file=mock_file,
            user_id="test-user-id",
            user_email="test@example.com",
            consent_given=False,  # ← Should fail
        )

    assert exc_info.value.status_code == 400
    assert "consent" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_upload_with_consent_succeeds():
    """Test that upload with consent proceeds successfully."""
    document_service = DocumentService()
    mock_db = AsyncMock()
    mock_file = Mock()
    # ... mock setup ...

    result = await document_service.upload_document(
        db=mock_db,
        file=mock_file,
        user_id="test-user-id",
        user_email="test@example.com",
        consent_given=True,  # ← Should succeed
    )

    assert result is not None
    assert "document_id" in result
```

### Integration Tests

```bash
# Run backend tests
cd backend
pytest tests/test_consent_validation.py -v

# Expected output:
# test_upload_without_consent_fails PASSED
# test_upload_with_consent_succeeds PASSED
# test_consent_fields_stored_in_database PASSED
# test_audit_log_includes_consent_metadata PASSED
```

### E2E Tests

```bash
# Run Playwright E2E tests
yarn e2e:fe --grep "Consent Management"

# Expected output:
# ✓ Should show consent checkbox when file selected
# ✓ Should disable upload button when consent not given
# ✓ Should enable upload button when consent given
# ✓ Should upload document successfully with consent
```

---

## Security Considerations

### 1. Consent Cannot Be Bypassed

Both frontend and backend validate consent:

- **Frontend**: Button disabled if `consentGiven = false`
- **Backend**: HTTP 400 error if `consent_given = "false"`

**Tamper-proof:** Even if user manipulates frontend, backend validation catches it.

### 2. Audit Trail Immutability

Consent events logged to WORM audit system (T-13):

- Records can only be **INSERT**ed
- **UPDATE** and **DELETE** blocked by database triggers
- SHA-256 hash ensures tamper detection

### 3. IP Address Tracking

IP address recorded for audit purposes:

- IPv4/IPv6 support (45 character field)
- Obtained from `request.client.host` (not user-provided)
- Used only for audit trail, not for user identification

### 4. JWT Authentication

All consent operations require valid JWT:

- Token contains: `user_id`, `email`, `exp` (expiration)
- Verified on every request
- Expired tokens → 401 Unauthorized

### 5. Multi-tenancy Isolation

Consent tracked per user:

- `user_id` from JWT (not request body)
- Database queries filtered by `user_id`
- Users cannot access other users' consent records

---

## Migration Reference

### Migration 010: Add Consent Fields

```python
# backend/migrations/versions/010_add_consent_fields.py

def upgrade() -> None:
    """Add consent tracking columns to documents table."""

    # Add consent_given column (required, default False)
    op.add_column(
        "documents",
        sa.Column("consent_given", sa.Boolean(), nullable=False, server_default=sa.false()),
    )

    # Add consent_timestamp column (nullable)
    op.add_column(
        "documents",
        sa.Column("consent_timestamp", sa.DateTime(), nullable=True),
    )

    # Add consent_version column (nullable, default "1.0")
    op.add_column(
        "documents",
        sa.Column("consent_version", sa.String(20), nullable=True, server_default="1.0"),
    )

    # Add consent_ip_address column (nullable, IPv6 support)
    op.add_column(
        "documents",
        sa.Column("consent_ip_address", sa.String(45), nullable=True),
    )

    # Create index for filtering by consent status
    op.create_index("ix_documents_consent_given", "documents", ["consent_given"])


def downgrade() -> None:
    """Remove consent tracking columns."""
    op.drop_index("ix_documents_consent_given", "documents")
    op.drop_column("documents", "consent_ip_address")
    op.drop_column("documents", "consent_version")
    op.drop_column("documents", "consent_timestamp")
    op.drop_column("documents", "consent_given")
```

**Run Migration:**

```bash
cd backend
alembic upgrade head
```

---

## Cross-References

### Related Documentation

- **[User-Facing: Consent Management Overview](../../docs/features/consent-management.md)** - Spanish documentation for users
- **[Frontend: Consent Checkbox Component](../../src/docs/components/consent-checkbox.md)** - React implementation details
- **[T-13: WORM Audit System](../security/worm-audit-system.md)** - Immutable audit logging architecture
- **[T-04: RAG Pipeline](../features/rag-pipeline.md)** - Document processing workflow

### Source Files

- **Router**: `backend/app/routers/upload.py` (POST /api/upload)
- **Service**: `backend/app/services/document_service.py` (upload_document)
- **Model**: `backend/app/models/document.py` (Document.consent_*)
- **Audit Model**: `backend/app/models/audit.py` (AuditActionType)
- **Migration**: `backend/migrations/versions/010_add_consent_fields.py`
- **Tests**: `backend/tests/test_consent_validation.py` (10 unit tests)

---

**Last Updated:** 2025-10-24
**Maintained By:** Backend Team
**API Version:** 1.0
**Status:** ✅ Production Ready (100% tests passing)
