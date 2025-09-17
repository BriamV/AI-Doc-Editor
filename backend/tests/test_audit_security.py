"""
Security tests for T-13 audit log WORM (Write Once, Read Many) constraints
Tests WORM enforcement, SQL injection protection, and access control
"""

import pytest
import asyncio
import json
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, OperationalError

import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.main import app
from app.db.session import AsyncSessionLocal
from app.services.audit import AuditService
from app.models.audit import AuditLog, AuditActionType
from app.models.audit_schemas import AuditLogQueryFilters

client = TestClient(app)


@pytest.fixture
def audit_service():
    """Fixture to provide AuditService instance"""
    return AuditService()


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
async def sample_audit_log(audit_service, clean_audit_logs):
    """Fixture to create a sample audit log for testing"""
    # Since audit_service.log_event is async, we need to await it
    audit_id = await audit_service.log_event(
        action_type=AuditActionType.LOGIN_SUCCESS,
        description="Sample audit log for testing",
        user_id="test-user-123",
        user_email="test@example.com",
        user_role="user",
        ip_address="192.168.1.100",
        status="success",
    )
    return audit_id


class TestWORMConstraints:
    """Test Write Once, Read Many constraints on audit logs"""

    @pytest.mark.asyncio
    async def test_audit_log_update_prevention(self, sample_audit_log):
        """Test that audit log records cannot be updated"""
        # Given - An existing audit log
        audit_id = sample_audit_log

        # When & Then - Attempt to update the record should fail
        async with AsyncSessionLocal() as session:
            try:
                # Attempt to update the audit log description
                await session.execute(
                    text("UPDATE audit_logs SET description = :desc WHERE id = :id"),
                    {"desc": "Modified description", "id": audit_id},
                )
                await session.commit()

                # If we reach here, the WORM constraint failed
                pytest.fail("Audit log update should have been prevented by WORM constraints")

            except (IntegrityError, OperationalError) as e:
                # Expected behavior - update should be blocked
                assert "update" in str(e).lower() or "constraint" in str(e).lower()

    @pytest.mark.asyncio
    async def test_audit_log_delete_prevention(self, sample_audit_log):
        """Test that audit log records cannot be deleted"""
        # Given - An existing audit log
        audit_id = sample_audit_log

        # When & Then - Attempt to delete the record should fail
        async with AsyncSessionLocal() as session:
            try:
                # Attempt to delete the audit log
                await session.execute(
                    text("DELETE FROM audit_logs WHERE id = :id"), {"id": audit_id}
                )
                await session.commit()

                # If we reach here, the WORM constraint failed
                pytest.fail("Audit log deletion should have been prevented by WORM constraints")

            except (IntegrityError, OperationalError) as e:
                # Expected behavior - deletion should be blocked
                assert "delete" in str(e).lower() or "constraint" in str(e).lower()

    @pytest.mark.asyncio
    async def test_audit_log_hash_modification_prevention(self, sample_audit_log):
        """Test that audit log integrity hash cannot be modified"""
        # Given - An existing audit log
        audit_id = sample_audit_log

        # When & Then - Attempt to modify the hash should fail
        async with AsyncSessionLocal() as session:
            try:
                # Attempt to update the record hash
                await session.execute(
                    text("UPDATE audit_logs SET record_hash = :hash WHERE id = :id"),
                    {"hash": "fake_hash_12345", "id": audit_id},
                )
                await session.commit()

                # If we reach here, the WORM constraint failed
                pytest.fail("Audit log hash modification should have been prevented")

            except (IntegrityError, OperationalError) as e:
                # Expected behavior - hash modification should be blocked
                assert "update" in str(e).lower() or "constraint" in str(e).lower()

    @pytest.mark.asyncio
    async def test_audit_log_timestamp_modification_prevention(self, sample_audit_log):
        """Test that audit log timestamps cannot be modified"""
        # Given - An existing audit log
        audit_id = sample_audit_log

        # When & Then - Attempt to modify timestamp should fail
        async with AsyncSessionLocal() as session:
            try:
                # Attempt to update the timestamp
                new_timestamp = datetime.utcnow().isoformat()
                await session.execute(
                    text("UPDATE audit_logs SET timestamp = :ts WHERE id = :id"),
                    {"ts": new_timestamp, "id": audit_id},
                )
                await session.commit()

                # If we reach here, the WORM constraint failed
                pytest.fail("Audit log timestamp modification should have been prevented")

            except (IntegrityError, OperationalError) as e:
                # Expected behavior - timestamp modification should be blocked
                assert "update" in str(e).lower() or "constraint" in str(e).lower()

    @pytest.mark.asyncio
    async def test_bulk_audit_log_modification_prevention(self, audit_service, clean_audit_logs):
        """Test that bulk modifications of audit logs are prevented"""
        # Given - Multiple audit logs
        audit_ids = []
        for i in range(5):
            audit_id = await audit_service.log_event(
                action_type=AuditActionType.DOCUMENT_VIEW,
                description=f"Bulk test document {i}",
                user_id=f"user-{i}",
                user_email=f"user{i}@example.com",
            )
            audit_ids.append(audit_id)

        # When & Then - Attempt bulk update should fail
        async with AsyncSessionLocal() as session:
            try:
                # Attempt to update all records
                await session.execute(
                    text("UPDATE audit_logs SET status = 'modified' WHERE action_type = :action"),
                    {"action": AuditActionType.DOCUMENT_VIEW.value},
                )
                await session.commit()

                # If we reach here, the WORM constraint failed
                pytest.fail("Bulk audit log modification should have been prevented")

            except (IntegrityError, OperationalError) as e:
                # Expected behavior - bulk modification should be blocked
                assert "update" in str(e).lower() or "constraint" in str(e).lower()


class TestSQLInjectionProtection:
    """Test SQL injection protection in audit log queries"""

    @pytest.mark.asyncio
    async def test_audit_log_query_sql_injection_user_email(self, audit_service, clean_audit_logs):
        """Test SQL injection protection in user email filters"""
        # Given - Create a test audit log
        await audit_service.log_event(
            action_type=AuditActionType.LOGIN_SUCCESS,
            description="SQL injection test",
            user_id="test-user",
            user_email="test@example.com",
        )

        # When - Attempt SQL injection via user email filter
        malicious_email = "'; DROP TABLE audit_logs; --"
        filters = AuditLogQueryFilters(page=1, page_size=10, user_email=malicious_email)

        # Then - Should not raise exception and should return empty results
        try:
            response = await audit_service.get_audit_logs(filters, "admin")
            # SQL injection should be prevented, query should return safely
            assert response.total_count == 0  # No matches for malicious input
        except Exception as e:
            # If there's an exception, it should be a normal query error, not SQL injection
            assert "syntax error" not in str(e).lower()
            assert "drop table" not in str(e).lower()

    @pytest.mark.asyncio
    async def test_audit_log_query_sql_injection_action_type(self, audit_service, clean_audit_logs):
        """Test SQL injection protection in action type filters"""
        # Given - Create a test audit log
        await audit_service.log_event(
            action_type=AuditActionType.LOGIN_SUCCESS,
            description="SQL injection test",
            user_id="test-user",
        )

        # When - Attempt SQL injection via action type (using enum should prevent this)
        try:
            # This should fail at the Pydantic validation level
            filters = AuditLogQueryFilters(page=1, page_size=10)
            # Manually set invalid action type to test
            filters.action_type = "'; DELETE FROM audit_logs WHERE 1=1; --"

            response = await audit_service.get_audit_logs(filters, "admin")
            # Should return safely without executing malicious SQL
            assert response is not None

        except (ValueError, TypeError) as e:
            # Expected - Pydantic should validate enum values
            assert "action_type" in str(e).lower() or "enum" in str(e).lower()

    @pytest.mark.asyncio
    async def test_audit_log_query_sql_injection_resource_id(self, audit_service, clean_audit_logs):
        """Test SQL injection protection in resource ID filters"""
        # Given - Create a test audit log
        await audit_service.log_event(
            action_type=AuditActionType.DOCUMENT_CREATE,
            description="SQL injection test",
            resource_type="document",
            resource_id="doc-123",
        )

        # When - Attempt SQL injection via resource ID
        malicious_resource_id = "doc-123' UNION SELECT * FROM audit_logs WHERE '1'='1"
        filters = AuditLogQueryFilters(page=1, page_size=10, resource_id=malicious_resource_id)

        # Then - Should handle malicious input safely
        response = await audit_service.get_audit_logs(filters, "admin")
        assert response.total_count == 0  # No matches for malicious input

    @pytest.mark.asyncio
    async def test_audit_log_query_sql_injection_ip_address(self, audit_service, clean_audit_logs):
        """Test SQL injection protection in IP address filters"""
        # Given - Create a test audit log
        await audit_service.log_event(
            action_type=AuditActionType.LOGIN_SUCCESS,
            description="SQL injection test",
            ip_address="192.168.1.100",
        )

        # When - Attempt SQL injection via IP address
        malicious_ip = "192.168.1.100'; UPDATE audit_logs SET status='compromised'; --"
        filters = AuditLogQueryFilters(page=1, page_size=10, ip_address=malicious_ip)

        # Then - Should handle malicious input safely
        response = await audit_service.get_audit_logs(filters, "admin")
        assert response.total_count == 0  # No matches for malicious input


class TestAccessControl:
    """Test access control for audit log operations"""

    @pytest.mark.asyncio
    async def test_audit_log_read_admin_only(self, audit_service, clean_audit_logs):
        """Test that only admins can read audit logs"""
        # Given
        await audit_service.log_event(
            action_type=AuditActionType.LOGIN_SUCCESS,
            description="Access control test",
            user_id="test-user",
        )

        filters = AuditLogQueryFilters(page=1, page_size=10)

        # When & Then - Admin access should work
        response = await audit_service.get_audit_logs(filters, "admin")
        assert response is not None
        assert len(response.logs) > 0

        # When & Then - User access should fail
        with pytest.raises(PermissionError, match="restricted to administrators"):
            await audit_service.get_audit_logs(filters, "user")

        # When & Then - Moderator access should fail
        with pytest.raises(PermissionError, match="restricted to administrators"):
            await audit_service.get_audit_logs(filters, "moderator")

        # When & Then - Anonymous access should fail
        with pytest.raises(PermissionError, match="restricted to administrators"):
            await audit_service.get_audit_logs(filters, "")

    @pytest.mark.asyncio
    async def test_audit_stats_admin_only(self, audit_service, clean_audit_logs):
        """Test that only admins can access audit statistics"""
        # Given
        await audit_service.log_event(
            action_type=AuditActionType.LOGIN_SUCCESS,
            description="Stats access test",
            user_id="test-user",
        )

        # When & Then - Admin access should work
        stats = await audit_service.get_audit_stats("admin")
        assert stats is not None
        assert stats.total_events > 0

        # When & Then - Non-admin access should fail
        roles_to_test = ["user", "moderator", "guest", "", None]
        for role in roles_to_test:
            with pytest.raises(PermissionError, match="restricted to administrators"):
                await audit_service.get_audit_stats(role)

    @pytest.mark.asyncio
    async def test_audit_log_write_no_restrictions(self, audit_service, clean_audit_logs):
        """Test that audit log writing has no role restrictions (system operation)"""
        # Given & When - Any role should be able to create audit logs
        # (This is a system operation, not user-initiated)

        audit_id = await audit_service.log_event(
            action_type=AuditActionType.LOGIN_SUCCESS,
            description="Write access test",
            user_id="any-user",
            user_role="user",  # Non-admin role
        )

        # Then
        assert audit_id is not None

        # Verify log was created
        async with AsyncSessionLocal() as session:
            log = await session.get(AuditLog, audit_id)
            assert log is not None
            assert log.user_role == "user"


class TestDataIntegrity:
    """Test data integrity protections"""

    @pytest.mark.asyncio
    async def test_audit_log_required_fields(self, audit_service, clean_audit_logs):
        """Test that required fields are enforced"""
        # When & Then - Missing action_type should fail
        with pytest.raises((TypeError, ValueError)):
            await audit_service.log_event(
                action_type=None, description="Missing action type test"  # Required field
            )

        # When & Then - Missing description should fail
        with pytest.raises((TypeError, ValueError)):
            await audit_service.log_event(
                action_type=AuditActionType.LOGIN_SUCCESS, description=None  # Required field
            )

    @pytest.mark.asyncio
    async def test_audit_log_data_validation(self, audit_service, clean_audit_logs):
        """Test data validation for audit log fields"""
        # When - Valid data should succeed
        audit_id = await audit_service.log_event(
            action_type=AuditActionType.LOGIN_SUCCESS,
            description="Valid data test",
            user_email="valid@example.com",
            ip_address="192.168.1.100",
        )

        # Then
        assert audit_id is not None

        # Verify data integrity
        async with AsyncSessionLocal() as session:
            log = await session.get(AuditLog, audit_id)
            assert log is not None
            assert log.user_email == "valid@example.com"
            assert log.ip_address == "192.168.1.100"

    @pytest.mark.asyncio
    async def test_audit_log_json_details_validation(self, audit_service, clean_audit_logs):
        """Test that JSON details are properly serialized and validated"""
        # Given
        test_details = {
            "complex_data": {"nested": True, "array": [1, 2, 3], "null_value": None},
            "timestamp": datetime.utcnow(),  # Should be serialized
            "unicode": "Testing üñíçøde",
            "number": 42.5,
        }

        # When
        audit_id = await audit_service.log_event(
            action_type=AuditActionType.CONFIG_UPDATE,
            description="JSON validation test",
            details=test_details,
        )

        # Then
        assert audit_id is not None

        # Verify JSON serialization
        async with AsyncSessionLocal() as session:
            log = await session.get(AuditLog, audit_id)
            assert log is not None
            assert log.details is not None

            # Parse back and verify
            parsed_details = json.loads(log.details)
            assert parsed_details["complex_data"]["nested"] is True
            assert parsed_details["complex_data"]["array"] == [1, 2, 3]
            assert parsed_details["unicode"] == "Testing üñíçøde"
            assert parsed_details["number"] == 42.5


class TestConcurrentSecurity:
    """Test security under concurrent access patterns"""

    @pytest.mark.asyncio
    async def test_concurrent_worm_constraint_enforcement(self, audit_service, clean_audit_logs):
        """Test WORM constraints under concurrent access"""
        # Given - Create a test audit log
        audit_id = await audit_service.log_event(
            action_type=AuditActionType.LOGIN_SUCCESS,
            description="Concurrent WORM test",
            user_id="concurrent-user",
        )

        # When - Attempt concurrent modifications
        async def try_modify():
            async with AsyncSessionLocal() as session:
                try:
                    await session.execute(
                        text("UPDATE audit_logs SET description = :desc WHERE id = :id"),
                        {"desc": "Modified by task", "id": audit_id},
                    )
                    await session.commit()
                    return "success"
                except (IntegrityError, OperationalError):
                    return "blocked"

        # Execute multiple concurrent modification attempts
        tasks = [try_modify() for _ in range(5)]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Then - All modifications should be blocked
        for result in results:
            if isinstance(result, str):
                assert result == "blocked"
            else:
                # Exception is also acceptable
                assert isinstance(result, (IntegrityError, OperationalError))

    @pytest.mark.asyncio
    async def test_concurrent_audit_log_creation(self, audit_service, clean_audit_logs):
        """Test that concurrent audit log creation maintains integrity"""

        # When - Create multiple audit logs concurrently
        async def create_log(index):
            return await audit_service.log_event(
                action_type=AuditActionType.DOCUMENT_VIEW,
                description=f"Concurrent creation test {index}",
                user_id=f"user-{index}",
                user_email=f"user{index}@example.com",
            )

        tasks = [create_log(i) for i in range(10)]
        audit_ids = await asyncio.gather(*tasks)

        # Then - All logs should be created successfully
        assert len(audit_ids) == 10
        assert all(audit_id is not None for audit_id in audit_ids)
        assert len(set(audit_ids)) == 10  # All should be unique

        # Verify all logs exist in database
        async with AsyncSessionLocal() as session:
            for audit_id in audit_ids:
                log = await session.get(AuditLog, audit_id)
                assert log is not None
                assert log.record_hash is not None
