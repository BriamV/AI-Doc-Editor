"""
Integration tests for document listing API endpoints.

Tests GET /api/documents and GET /api/documents/{id} endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime
from uuid import uuid4

from app.main import app
from app.models.document import Document, DocumentStatus
from app.db.session import get_db


# Test client
client = TestClient(app)


# Mock database session
@pytest.fixture
def db_session():
    """Mock database session for testing."""
    # In a real scenario, this would use a test database
    # For now, we'll mock the dependency
    yield None


# Mock authentication
@pytest.fixture
def mock_auth(monkeypatch):
    """Mock authentication to bypass JWT validation."""
    from app.models.auth import User

    mock_user = User(
        id=uuid4(),
        email="test@example.com",
        google_id="test_google_id",
        is_active=True,
        role="editor"
    )

    async def mock_get_current_user():
        return mock_user

    monkeypatch.setattr("app.routers.documents.get_current_user", lambda: mock_get_current_user())
    return mock_user


def test_list_documents_empty(mock_auth, monkeypatch):
    """Test listing documents when user has no documents."""

    def mock_get_db():
        from unittest.mock import MagicMock
        db = MagicMock()
        db.query.return_value.filter.return_value.count.return_value = 0
        db.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = []
        return db

    app.dependency_overrides[get_db] = mock_get_db

    response = client.get("/api/documents")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["documents"] == []
    assert data["limit"] == 20
    assert data["offset"] == 0


def test_list_documents_with_data(mock_auth, monkeypatch):
    """Test listing documents when user has documents."""

    mock_doc = Document(
        id=uuid4(),
        original_filename="test.pdf",
        file_type="pdf",
        mime_type="application/pdf",
        file_size_bytes=1024,
        title="Test Document",
        description="Test description",
        status=DocumentStatus.COMPLETED,
        user_id=mock_auth.id,
        user_email=mock_auth.email,
        uploaded_at=datetime.utcnow(),
        processed_at=datetime.utcnow(),
        deleted_at=None
    )

    def mock_get_db():
        from unittest.mock import MagicMock
        db = MagicMock()
        db.query.return_value.filter.return_value.count.return_value = 1
        db.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [mock_doc]
        return db

    app.dependency_overrides[get_db] = mock_get_db

    response = client.get("/api/documents")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert len(data["documents"]) == 1
    assert data["documents"][0]["original_filename"] == "test.pdf"
    assert data["documents"][0]["status"] == "completed"


def test_list_documents_with_filters(mock_auth, monkeypatch):
    """Test listing documents with file type filter."""

    def mock_get_db():
        from unittest.mock import MagicMock
        db = MagicMock()
        db.query.return_value.filter.return_value.filter.return_value.count.return_value = 0
        db.query.return_value.filter.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = []
        return db

    app.dependency_overrides[get_db] = mock_get_db

    response = client.get("/api/documents?file_type=pdf&limit=10")

    assert response.status_code == 200
    data = response.json()
    assert data["limit"] == 10


def test_list_documents_pagination(mock_auth, monkeypatch):
    """Test pagination parameters."""

    def mock_get_db():
        from unittest.mock import MagicMock
        db = MagicMock()
        db.query.return_value.filter.return_value.count.return_value = 50
        db.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = []
        return db

    app.dependency_overrides[get_db] = mock_get_db

    response = client.get("/api/documents?limit=10&offset=20")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 50
    assert data["limit"] == 10
    assert data["offset"] == 20


def test_get_document_by_id(mock_auth, monkeypatch):
    """Test getting a single document by ID."""

    doc_id = uuid4()
    mock_doc = Document(
        id=doc_id,
        original_filename="test.pdf",
        file_type="pdf",
        mime_type="application/pdf",
        file_size_bytes=1024,
        title="Test Document",
        status=DocumentStatus.COMPLETED,
        user_id=mock_auth.id,
        user_email=mock_auth.email,
        uploaded_at=datetime.utcnow(),
        deleted_at=None
    )

    def mock_get_db():
        from unittest.mock import MagicMock
        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = mock_doc
        return db

    app.dependency_overrides[get_db] = mock_get_db

    response = client.get(f"/api/documents/{doc_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["original_filename"] == "test.pdf"
    assert data["id"] == str(doc_id)


def test_get_document_not_found(mock_auth, monkeypatch):
    """Test 404 error when document doesn't exist."""

    def mock_get_db():
        from unittest.mock import MagicMock
        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = None
        return db

    app.dependency_overrides[get_db] = mock_get_db

    doc_id = uuid4()
    response = client.get(f"/api/documents/{doc_id}")

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_get_document_wrong_owner(mock_auth, monkeypatch):
    """Test 403 error when user doesn't own document."""

    doc_id = uuid4()
    wrong_user_id = uuid4()  # Different from mock_auth.id

    mock_doc = Document(
        id=doc_id,
        original_filename="test.pdf",
        file_type="pdf",
        mime_type="application/pdf",
        file_size_bytes=1024,
        status=DocumentStatus.COMPLETED,
        user_id=wrong_user_id,  # Different owner
        user_email="other@example.com",
        uploaded_at=datetime.utcnow(),
        deleted_at=None
    )

    def mock_get_db():
        from unittest.mock import MagicMock
        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = mock_doc
        return db

    app.dependency_overrides[get_db] = mock_get_db

    response = client.get(f"/api/documents/{doc_id}")

    assert response.status_code == 403
    assert "permission" in response.json()["detail"].lower()


def test_invalid_document_id_format(mock_auth, monkeypatch):
    """Test 400 error for invalid UUID format."""

    def mock_get_db():
        from unittest.mock import MagicMock
        return MagicMock()

    app.dependency_overrides[get_db] = mock_get_db

    response = client.get("/api/documents/invalid-uuid")

    assert response.status_code == 400
    assert "invalid" in response.json()["detail"].lower()
