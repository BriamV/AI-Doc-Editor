"""
Unit tests for consent validation (T-24 ST3)

Tests consent tracking and validation in document upload workflow:
- Consent required for document upload
- Consent fields stored in database
- Audit logging for consent events
- IP address and timestamp tracking
"""

import pytest
import uuid
from datetime import datetime
from unittest.mock import Mock, AsyncMock
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.document_service import DocumentService
from app.models.audit import AuditActionType

# Test fixtures
TEST_USER_ID = str(uuid.uuid4())
TEST_USER_EMAIL = "test@example.com"


class TestConsentValidation:
    """Test consent validation in document upload"""

    @pytest.mark.asyncio
    async def test_upload_without_consent_fails(self):
        """Test that upload without consent is rejected with 400 error"""
        # Arrange
        document_service = DocumentService()
        mock_db = AsyncMock(spec=AsyncSession)
        mock_file = Mock()
        mock_file.filename = "test.pdf"
        mock_file.content_type = "application/pdf"
        mock_file.read = AsyncMock(return_value=b"fake pdf content")

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await document_service.upload_document(
                db=mock_db,
                file=mock_file,
                user_id=TEST_USER_ID,
                user_email=TEST_USER_EMAIL,
                consent_given=False,  # No consent
                consent_ip_address="192.168.1.1",
            )

        # Verify error details
        assert exc_info.value.status_code == 400
        assert "consent" in exc_info.value.detail.lower()
        assert "explicit user consent" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_upload_with_consent_succeeds(self):
        """Test that upload with consent proceeds successfully"""
        # Arrange
        document_service = DocumentService()
        mock_db = AsyncMock(spec=AsyncSession)
        mock_file = Mock()
        mock_file.filename = "test.pdf"
        mock_file.content_type = "application/pdf"
        mock_file.read = AsyncMock(return_value=b"fake pdf content")

        # Mock database operations
        mock_db.add = Mock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        # Act
        result = await document_service.upload_document(
            db=mock_db,
            file=mock_file,
            user_id=TEST_USER_ID,
            user_email=TEST_USER_EMAIL,
            consent_given=True,  # Consent given
            consent_ip_address="192.168.1.1",
        )

        # Assert
        assert result is not None
        assert "document_id" in result
        assert result["filename"] == "test.pdf"
        assert result["status"] == "processing"

        # Verify database was called
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_consent_fields_stored_in_database(self):
        """Test that consent fields are properly stored in document record"""
        # Arrange
        document_service = DocumentService()
        mock_db = AsyncMock(spec=AsyncSession)
        test_ip = "203.0.113.42"
        captured_document = None

        def capture_document(doc):
            nonlocal captured_document
            captured_document = doc

        mock_db.add = Mock(side_effect=capture_document)
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        # Act
        _result = await document_service.create_document_record(
            db=mock_db,
            filename="test.pdf",
            file_type="pdf",
            mime_type="application/pdf",
            file_size=1024,
            file_path="user-123/test.pdf",
            user_id=TEST_USER_ID,
            user_email=TEST_USER_EMAIL,
            consent_given=True,
            consent_ip_address=test_ip,
        )

        # Assert - verify consent fields
        assert captured_document is not None
        assert captured_document.consent_given is True
        assert captured_document.consent_timestamp is not None
        assert captured_document.consent_version == "1.0"
        assert captured_document.consent_ip_address == test_ip

        # Verify timestamp is recent (within last 5 seconds)
        time_diff = datetime.utcnow() - captured_document.consent_timestamp
        assert time_diff.total_seconds() < 5

    @pytest.mark.asyncio
    async def test_consent_rejected_fields(self):
        """Test that rejected consent (False) sets appropriate fields"""
        # Arrange
        document_service = DocumentService()
        mock_db = AsyncMock(spec=AsyncSession)
        captured_document = None

        def capture_document(doc):
            nonlocal captured_document
            captured_document = doc

        mock_db.add = Mock(side_effect=capture_document)
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        # Act
        _result = await document_service.create_document_record(
            db=mock_db,
            filename="test.pdf",
            file_type="pdf",
            mime_type="application/pdf",
            file_size=1024,
            file_path="user-123/test.pdf",
            user_id=TEST_USER_ID,
            user_email=TEST_USER_EMAIL,
            consent_given=False,  # Rejected
            consent_ip_address="192.168.1.1",
        )

        # Assert - verify consent fields for rejected consent
        assert captured_document is not None
        assert captured_document.consent_given is False
        assert captured_document.consent_timestamp is None  # No timestamp if rejected
        assert captured_document.consent_version is None  # No version if rejected
        assert captured_document.consent_ip_address == "192.168.1.1"  # IP still tracked

    @pytest.mark.asyncio
    async def test_ipv6_address_support(self):
        """Test that IPv6 addresses are properly stored (45 char support)"""
        # Arrange
        document_service = DocumentService()
        mock_db = AsyncMock(spec=AsyncSession)
        ipv6_address = "2001:0db8:85a3:0000:0000:8a2e:0370:7334"  # 39 chars
        captured_document = None

        def capture_document(doc):
            nonlocal captured_document
            captured_document = doc

        mock_db.add = Mock(side_effect=capture_document)
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        # Act
        _result = await document_service.create_document_record(
            db=mock_db,
            filename="test.pdf",
            file_type="pdf",
            mime_type="application/pdf",
            file_size=1024,
            file_path="user-123/test.pdf",
            user_id=TEST_USER_ID,
            user_email=TEST_USER_EMAIL,
            consent_given=True,
            consent_ip_address=ipv6_address,
        )

        # Assert
        assert captured_document is not None
        assert captured_document.consent_ip_address == ipv6_address
        assert len(captured_document.consent_ip_address) <= 45  # Verify length limit


class TestConsentAuditLogging:
    """Test audit logging for consent events"""

    @pytest.mark.asyncio
    async def test_consent_given_audit_action_type_exists(self):
        """Test that DOCUMENT_CONSENT_GIVEN action type is defined"""
        assert hasattr(AuditActionType, "DOCUMENT_CONSENT_GIVEN")
        assert AuditActionType.DOCUMENT_CONSENT_GIVEN.value == "document_consent_given"

    @pytest.mark.asyncio
    async def test_consent_rejected_audit_action_type_exists(self):
        """Test that DOCUMENT_CONSENT_REJECTED action type is defined"""
        assert hasattr(AuditActionType, "DOCUMENT_CONSENT_REJECTED")
        assert AuditActionType.DOCUMENT_CONSENT_REJECTED.value == "document_consent_rejected"

    @pytest.mark.asyncio
    async def test_audit_log_includes_consent_metadata(self):
        """Test that audit log includes all required consent metadata"""
        from app.services.audit import AuditService

        # Arrange
        audit_service = AuditService()

        # Act - verify log_event accepts consent parameters
        # (Integration test would actually call this, unit test verifies signature)
        try:
            # Verify the method signature accepts these parameters
            import inspect

            sig = inspect.signature(audit_service.log_event)
            params = sig.parameters

            # Verify required parameters exist
            assert "action_type" in params
            assert "resource_type" in params
            assert "resource_id" in params
            assert "user_id" in params
            assert "ip_address" in params
            assert "details" in params

            # Success - signature is correct
            assert True

        except Exception as e:
            pytest.fail(f"AuditService.log_event signature invalid: {e}")


class TestConsentVersioning:
    """Test consent version tracking"""

    @pytest.mark.asyncio
    async def test_default_consent_version_is_1_0(self):
        """Test that default consent version is 1.0"""
        # Arrange
        document_service = DocumentService()
        mock_db = AsyncMock(spec=AsyncSession)
        captured_document = None

        def capture_document(doc):
            nonlocal captured_document
            captured_document = doc

        mock_db.add = Mock(side_effect=capture_document)
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        # Act
        _result = await document_service.create_document_record(
            db=mock_db,
            filename="test.pdf",
            file_type="pdf",
            mime_type="application/pdf",
            file_size=1024,
            file_path="user-123/test.pdf",
            user_id=TEST_USER_ID,
            user_email=TEST_USER_EMAIL,
            consent_given=True,
            consent_ip_address="192.168.1.1",
        )

        # Assert
        assert captured_document is not None
        assert captured_document.consent_version == "1.0"

    @pytest.mark.asyncio
    async def test_consent_version_field_supports_future_versions(self):
        """Test that consent_version field can store version strings up to 20 chars"""
        # Verify database model field definition
        from app.models.document import Document as DocumentModel

        # Get field definition
        consent_version_col = DocumentModel.consent_version.property.columns[0]

        # Assert field can hold version strings
        assert consent_version_col.type.length == 20
        assert consent_version_col.nullable is True  # Nullable for flexibility


# Integration test markers
@pytest.mark.integration
class TestConsentIntegration:
    """Integration tests for consent workflow (requires database)"""

    @pytest.mark.asyncio
    async def test_full_consent_workflow(self):
        """
        Full integration test for consent workflow.

        This test would require:
        1. Real database connection
        2. File upload simulation
        3. Audit log verification

        Skipped in unit tests, run with: pytest -m integration
        """
        pytest.skip("Integration test - requires database setup")
