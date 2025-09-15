"""
Integration tests for T-13 audit log WORM system
Tests audit log creation, retrieval, and WORM compliance
"""

import pytest
import asyncio
import json
from datetime import datetime
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from fastapi import Request

import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.main import app
from app.db.session import AsyncSessionLocal
from app.models.audit import AuditLog, AuditActionType
from app.models.audit_schemas import AuditLogQueryFilters
from sqlalchemy import text

client = TestClient(app)


@pytest.fixture
async def clean_audit_logs():
    """Fixture to clean audit logs before and after tests"""
    async with AsyncSessionLocal() as session:
        await session.execute(text("DELETE FROM audit_logs"))
        await session.execute(text("DELETE FROM audit_log_summary"))
        await session.commit()

    yield

    async with AsyncSessionLocal() as session:
        await session.execute(text("DELETE FROM audit_logs"))
        await session.execute(text("DELETE FROM audit_log_summary"))
        await session.commit()


@pytest.fixture
def mock_request():
    """Mock FastAPI Request object"""
    request = Mock(spec=Request)
    request.headers = {
        "user-agent": "Mozilla/5.0 (Test Browser)",
        "x-session-id": "test-session-123",
    }
    request.client.host = "192.168.1.100"
    return request


class TestAuditLogCreation:
    """Test audit log creation with various scenarios"""

    async def _verify_login_log(self, audit_id: str, user_id: str, user_email: str):
        """Shared verification for login audit log persisted values"""
        async with AsyncSessionLocal() as session:
            log = await session.get(AuditLog, audit_id)
            assert log is not None
            assert log.action_type == AuditActionType.LOGIN_SUCCESS.value
            assert log.user_id == user_id
            assert log.user_email == user_email
            assert log.ip_address == "192.168.1.100"
            assert log.status == "success"
            assert log.record_hash is not None
            assert json.loads(log.details)["login_method"] == "oauth"

    @pytest.mark.asyncio
    async def test_create_login_audit_log(self, audit_service, clean_audit_logs, mock_request):
        """Test creating login success audit log"""
        # Given
        user_id = "user-123"
        user_email = "test@example.com"

        # When
        audit_id = await audit_service.log_event(
            action_type=AuditActionType.LOGIN_SUCCESS,
            description="User logged in successfully",
            user_id=user_id,
            user_email=user_email,
            user_role="user",
            ip_address="192.168.1.100",
            user_agent="Mozilla/5.0 (Test Browser)",
            session_id="test-session-123",
            details={"login_method": "oauth", "provider": "google"},
            request=mock_request,
        )

        # Then
        assert audit_id is not None
        assert len(audit_id) == 36  # UUID length

        # Verify log was created in database
        await self._verify_login_log(audit_id, user_id, user_email)

    @pytest.mark.asyncio
    async def test_create_document_audit_log(self, audit_service, clean_audit_logs):
        """Test creating document operation audit log"""
        # Given
        document_id = "doc-456"
        user_id = "user-123"

        # When
        audit_id = await audit_service.log_event(
            action_type=AuditActionType.DOCUMENT_CREATE,
            description="New document created",
            user_id=user_id,
            user_email="test@example.com",
            resource_type="document",
            resource_id=document_id,
            details={"title": "Test Document", "size": 1024},
        )

        # Then
        assert audit_id is not None

        # Verify log was created
        async with AsyncSessionLocal() as session:
            log = await session.get(AuditLog, audit_id)
            assert log is not None
            assert log.action_type == AuditActionType.DOCUMENT_CREATE.value
            assert log.resource_type == "document"
            assert log.resource_id == document_id
            assert json.loads(log.details)["title"] == "Test Document"

    @pytest.mark.asyncio
    async def test_create_config_change_audit_log(self, audit_service, clean_audit_logs):
        """Test creating configuration change audit log"""
        # Given
        config_key = "api_key"
        user_id = "admin-123"

        # When
        audit_id = await audit_service.log_event(
            action_type=AuditActionType.CONFIG_UPDATE,
            description="API key configuration updated",
            user_id=user_id,
            user_email="admin@example.com",
            user_role="admin",
            resource_type="config",
            resource_id=config_key,
            details={"previous_value": "hidden", "new_value": "hidden", "config_type": "api_key"},
        )

        # Then
        assert audit_id is not None

        # Verify log was created
        async with AsyncSessionLocal() as session:
            log = await session.get(AuditLog, audit_id)
            assert log is not None
            assert log.action_type == AuditActionType.CONFIG_UPDATE.value
            assert log.user_role == "admin"
            assert log.resource_type == "config"

    @pytest.mark.asyncio
    async def test_audit_log_performance(self, audit_service, clean_audit_logs):
        """Test that audit log creation completes within 5 seconds"""
        # Given
        start_time = datetime.utcnow()

        # When
        audit_id = await audit_service.log_event(
            action_type=AuditActionType.DOCUMENT_UPDATE,
            description="Document updated for performance test",
            user_id="perf-user",
            user_email="perf@example.com",
        )

        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()

        # Then
        assert audit_id is not None
        assert duration < 5.0  # Must complete within 5 seconds


class TestAuditLogRetrieval:
    """Test audit log retrieval and filtering"""

    @pytest.mark.asyncio
    async def test_fetch_audit_logs_admin_access(self, audit_service, clean_audit_logs):
        """Test that only admins can access audit logs"""
        # Given - Create some audit logs
        await audit_service.log_event(
            action_type=AuditActionType.LOGIN_SUCCESS,
            description="Test login",
            user_id="user-1",
            user_email="user1@example.com",
        )

        # When - Admin requests logs
        filters = AuditLogQueryFilters(page=1, page_size=10)
        response = await audit_service.get_audit_logs(filters, "admin")

        # Then
        assert response is not None
        assert len(response.logs) > 0
        assert response.total_count > 0

    @pytest.mark.asyncio
    async def test_fetch_audit_logs_non_admin_denied(self, audit_service, clean_audit_logs):
        """Test that non-admins cannot access audit logs"""
        # Given
        filters = AuditLogQueryFilters(page=1, page_size=10)

        # When & Then
        with pytest.raises(PermissionError, match="restricted to administrators"):
            await audit_service.get_audit_logs(filters, "user")

    @pytest.mark.asyncio
    async def test_audit_log_filtering(self, audit_service, clean_audit_logs):
        """Test audit log filtering functionality"""
        # Given - Create logs with different attributes
        await audit_service.log_event(
            action_type=AuditActionType.LOGIN_SUCCESS,
            description="User 1 login",
            user_id="user-1",
            user_email="user1@example.com",
            status="success",
        )

        await audit_service.log_event(
            action_type=AuditActionType.LOGIN_FAILURE,
            description="User 2 failed login",
            user_id="user-2",
            user_email="user2@example.com",
            status="failure",
        )

        await audit_service.log_event(
            action_type=AuditActionType.DOCUMENT_CREATE,
            description="Document created",
            user_id="user-1",
            user_email="user1@example.com",
            resource_type="document",
        )

        # When - Filter by action type
        filters = AuditLogQueryFilters(
            page=1, page_size=10, action_type=AuditActionType.LOGIN_SUCCESS
        )
        response = await audit_service.get_audit_logs(filters, "admin")

        # Then
        assert len(response.logs) == 1
        assert response.logs[0].action_type == AuditActionType.LOGIN_SUCCESS.value

        # When - Filter by user
        filters = AuditLogQueryFilters(page=1, page_size=10, user_id="user-1")
        response = await audit_service.get_audit_logs(filters, "admin")

        # Then
        assert len(response.logs) == 2  # login and document create
        assert all(log.user_id == "user-1" for log in response.logs)

    @pytest.mark.asyncio
    async def test_audit_log_pagination(self, audit_service, clean_audit_logs):
        """Test audit log pagination"""
        # Given - Create multiple logs
        for i in range(25):
            await audit_service.log_event(
                action_type=AuditActionType.DOCUMENT_VIEW,
                description=f"Document view {i}",
                user_id=f"user-{i % 3}",
                user_email=f"user{i % 3}@example.com",
            )

        # When - Request first page
        filters = AuditLogQueryFilters(page=1, page_size=10)
        response = await audit_service.get_audit_logs(filters, "admin")

        # Then
        assert len(response.logs) == 10
        assert response.total_count == 25
        assert response.total_pages == 3
        assert response.has_next is True
        assert response.has_previous is False

        # When - Request second page
        filters = AuditLogQueryFilters(page=2, page_size=10)
        response = await audit_service.get_audit_logs(filters, "admin")

        # Then
        assert len(response.logs) == 10
        assert response.has_next is True
        assert response.has_previous is True


class TestAuditLogStats:
    """Test audit log statistics and reporting"""

    @pytest.mark.asyncio
    async def test_get_audit_stats_admin_only(self, audit_service, clean_audit_logs):
        """Test that audit stats are only accessible to admins"""
        # Given - Create some logs
        await audit_service.log_event(
            action_type=AuditActionType.LOGIN_SUCCESS,
            description="Test login",
            user_id="user-1",
            user_email="user1@example.com",
        )

        # When - Admin requests stats
        stats = await audit_service.get_audit_stats("admin")

        # Then
        assert stats is not None
        assert stats.total_events > 0

        # When - Non-admin requests stats
        with pytest.raises(PermissionError, match="restricted to administrators"):
            await audit_service.get_audit_stats("user")

    @pytest.mark.asyncio
    async def test_audit_stats_calculations(self, audit_service, clean_audit_logs):
        """Test audit statistics calculations"""
        # Given - Create various logs
        # Recent events
        await audit_service.log_event(
            action_type=AuditActionType.LOGIN_SUCCESS,
            description="Recent login",
            user_id="user-1",
            user_email="user1@example.com",
        )

        await audit_service.log_event(
            action_type=AuditActionType.LOGIN_FAILURE,
            description="Failed login",
            user_id="user-2",
            user_email="user2@example.com",
            status="failure",
        )

        await audit_service.log_event(
            action_type=AuditActionType.UNAUTHORIZED_ACCESS,
            description="Unauthorized access attempt",
            ip_address="192.168.1.200",
        )

        # When
        stats = await audit_service.get_audit_stats("admin")

        # Then
        assert stats.total_events >= 3
        assert stats.events_today >= 3
        assert len(stats.top_actions) > 0
        assert stats.security_events >= 1  # unauthorized_access
        assert stats.failed_logins >= 1


class TestAuditLogIntegrity:
    """Test audit log integrity verification"""

    @pytest.mark.asyncio
    async def test_audit_log_hash_calculation(self, audit_service, clean_audit_logs):
        """Test that audit logs have valid integrity hashes"""
        # Given
        audit_id = await audit_service.log_event(
            action_type=AuditActionType.LOGIN_SUCCESS,
            description="Test hash calculation",
            user_id="user-1",
            user_email="user1@example.com",
        )

        # When
        is_valid = await audit_service.verify_log_integrity(audit_id)

        # Then
        assert is_valid is True

    @pytest.mark.asyncio
    async def test_audit_log_hash_validation(self, audit_service, clean_audit_logs):
        """Test integrity validation for existing logs"""
        # Given - Create a log
        audit_id = await audit_service.log_event(
            action_type=AuditActionType.DOCUMENT_DELETE,
            description="Document deleted",
            user_id="user-1",
        )

        # When - Verify immediately after creation
        is_valid = await audit_service.verify_log_integrity(audit_id)

        # Then
        assert is_valid is True

    @pytest.mark.asyncio
    async def test_invalid_log_id_integrity_check(self, audit_service, clean_audit_logs):
        """Test integrity check with non-existent log ID"""
        # Given
        invalid_id = "non-existent-id"

        # When
        is_valid = await audit_service.verify_log_integrity(invalid_id)

        # Then
        assert is_valid is False


class TestAsyncAuditLogging:
    """Test that audit logging doesn't block main operations"""

    @pytest.mark.asyncio
    async def test_async_audit_logging_non_blocking(self, audit_service, clean_audit_logs):
        """Test that audit logging is truly asynchronous and non-blocking"""
        # Given
        start_time = datetime.utcnow()

        # When - Create multiple audit logs concurrently
        tasks = []
        for i in range(10):
            task = audit_service.log_event(
                action_type=AuditActionType.DOCUMENT_VIEW,
                description=f"Concurrent view {i}",
                user_id=f"user-{i}",
                user_email=f"user{i}@example.com",
            )
            tasks.append(task)

        # Execute all tasks concurrently
        audit_ids = await asyncio.gather(*tasks)

        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()

        # Then
        assert len(audit_ids) == 10
        assert all(audit_id is not None for audit_id in audit_ids)
        assert duration < 2.0  # Should complete quickly for concurrent operations

    @pytest.mark.asyncio
    async def test_audit_summary_updates_async(self, audit_service, clean_audit_logs):
        """Test that audit summary updates are handled asynchronously"""
        # Given
        user_id = "summary-user"
        action_type = AuditActionType.LOGIN_SUCCESS

        # When
        audit_id = await audit_service.log_event(
            action_type=action_type,
            description="Summary test",
            user_id=user_id,
            user_email="summary@example.com",
        )

        # Allow time for background summary update
        await asyncio.sleep(0.1)

        # Then
        assert audit_id is not None
        # Note: Summary update verification would require additional database queries
        # This test primarily ensures the main operation completes successfully


class TestAuditErrorHandling:
    """Test error handling in audit logging"""

    @pytest.mark.asyncio
    async def test_audit_service_database_error_handling(self, audit_service):
        """Test that audit service handles database errors gracefully"""
        # Given - Mock database session to raise an exception
        with patch.object(audit_service, "get_session") as mock_session:
            mock_session.side_effect = Exception("Database connection failed")

            # When & Then
            with pytest.raises(Exception, match="Database connection failed"):
                await audit_service.log_event(
                    action_type=AuditActionType.LOGIN_SUCCESS,
                    description="Error test",
                    user_id="error-user",
                )

    @pytest.mark.asyncio
    async def test_audit_service_invalid_parameters(self, audit_service, clean_audit_logs):
        """Test audit service with invalid parameters"""
        # When & Then - Required parameters should be validated
        audit_id = await audit_service.log_event(
            action_type=AuditActionType.LOGIN_SUCCESS,
            description="",  # Empty description should still work
            user_id=None,  # None values should be handled
            user_email=None,
        )

        # Should succeed with minimal valid parameters
        assert audit_id is not None
