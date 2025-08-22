"""
Test fixtures for audit log testing
Provides reusable test data and setup functions
"""

import pytest
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from unittest.mock import Mock
import uuid
import json

from app.models.audit import AuditLog, AuditActionType
from app.models.audit_schemas import AuditLogQueryFilters
from app.services.audit import AuditService


class AuditLogFactory:
    """Factory for creating test audit log entries"""

    @staticmethod
    def create_audit_log_data(
        action_type: AuditActionType = AuditActionType.LOGIN_SUCCESS,
        user_id: Optional[str] = None,
        user_email: Optional[str] = None,
        user_role: str = "user",
        ip_address: str = "192.168.1.100",
        status: str = "success",
        description: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Create audit log data dictionary"""

        base_data = {
            "id": str(uuid.uuid4()),
            "action_type": action_type.value,
            "user_id": user_id or f"user-{uuid.uuid4().hex[:8]}",
            "user_email": user_email or "test@example.com",
            "user_role": user_role,
            "ip_address": ip_address,
            "status": status,
            "description": description or f"Test {action_type.value} event",
            "details": json.dumps(details) if details else None,
            "timestamp": timestamp or datetime.utcnow(),
            "created_at": timestamp or datetime.utcnow(),
            "record_hash": "test_hash_" + uuid.uuid4().hex[:16],
        }

        # Merge any additional kwargs
        base_data.update(kwargs)
        return base_data

    @staticmethod
    def create_audit_log_model(
        action_type: AuditActionType = AuditActionType.LOGIN_SUCCESS, **kwargs
    ) -> AuditLog:
        """Create AuditLog model instance"""
        data = AuditLogFactory.create_audit_log_data(action_type=action_type, **kwargs)

        audit_log = AuditLog()
        for key, value in data.items():
            if hasattr(audit_log, key):
                setattr(audit_log, key, value)

        return audit_log


class AuditTestDataSets:
    """Predefined test data sets for common scenarios"""

    @staticmethod
    def login_sequence_logs() -> List[Dict[str, Any]]:
        """Create a sequence of login-related audit logs"""
        base_time = datetime.utcnow() - timedelta(hours=2)

        return [
            # Successful login
            AuditLogFactory.create_audit_log_data(
                action_type=AuditActionType.LOGIN_SUCCESS,
                user_email="user@example.com",
                ip_address="192.168.1.100",
                timestamp=base_time,
                details={"method": "oauth", "provider": "google"},
            ),
            # Failed login attempt
            AuditLogFactory.create_audit_log_data(
                action_type=AuditActionType.LOGIN_FAILURE,
                user_email="hacker@malicious.com",
                ip_address="10.0.0.1",
                status="failure",
                timestamp=base_time + timedelta(minutes=5),
                details={"reason": "invalid_credentials", "attempts": 3},
            ),
            # Token refresh
            AuditLogFactory.create_audit_log_data(
                action_type=AuditActionType.TOKEN_REFRESH,
                user_email="user@example.com",
                ip_address="192.168.1.100",
                timestamp=base_time + timedelta(minutes=30),
                details={"token_type": "access_token"},
            ),
            # Logout
            AuditLogFactory.create_audit_log_data(
                action_type=AuditActionType.LOGOUT,
                user_email="user@example.com",
                ip_address="192.168.1.100",
                timestamp=base_time + timedelta(hours=1),
                details={"session_duration": 3600},
            ),
        ]

    @staticmethod
    def document_operations_logs() -> List[Dict[str, Any]]:
        """Create document operation audit logs"""
        base_time = datetime.utcnow() - timedelta(hours=1)
        user_id = "user-doc-test"
        document_id = "doc-12345"

        return [
            # Document creation
            AuditLogFactory.create_audit_log_data(
                action_type=AuditActionType.DOCUMENT_CREATE,
                user_id=user_id,
                user_email="author@example.com",
                resource_type="document",
                resource_id=document_id,
                timestamp=base_time,
                details={"title": "Test Document", "size": 1024, "format": "markdown"},
            ),
            # Document updates
            AuditLogFactory.create_audit_log_data(
                action_type=AuditActionType.DOCUMENT_UPDATE,
                user_id=user_id,
                user_email="author@example.com",
                resource_type="document",
                resource_id=document_id,
                timestamp=base_time + timedelta(minutes=15),
                details={"changes": ["content", "title"], "size_before": 1024, "size_after": 1536},
            ),
            # Document view by another user
            AuditLogFactory.create_audit_log_data(
                action_type=AuditActionType.DOCUMENT_VIEW,
                user_id="user-viewer",
                user_email="viewer@example.com",
                resource_type="document",
                resource_id=document_id,
                timestamp=base_time + timedelta(minutes=45),
                details={"access_type": "read_only"},
            ),
            # Document export
            AuditLogFactory.create_audit_log_data(
                action_type=AuditActionType.DOCUMENT_EXPORT,
                user_id=user_id,
                user_email="author@example.com",
                resource_type="document",
                resource_id=document_id,
                timestamp=base_time + timedelta(hours=1),
                details={"format": "pdf", "file_size": 2048},
            ),
        ]

    @staticmethod
    def security_incidents_logs() -> List[Dict[str, Any]]:
        """Create security incident audit logs"""
        base_time = datetime.utcnow() - timedelta(hours=3)

        return [
            # Unauthorized access attempt
            AuditLogFactory.create_audit_log_data(
                action_type=AuditActionType.UNAUTHORIZED_ACCESS,
                user_email=None,
                ip_address="10.0.0.1",
                status="error",
                timestamp=base_time,
                details={
                    "attempted_resource": "/admin/users",
                    "user_agent": "Malicious Bot 1.0",
                    "blocked": True,
                },
            ),
            # Permission denied
            AuditLogFactory.create_audit_log_data(
                action_type=AuditActionType.PERMISSION_DENIED,
                user_email="user@example.com",
                user_role="user",
                ip_address="192.168.1.200",
                status="failure",
                timestamp=base_time + timedelta(minutes=30),
                details={"attempted_action": "delete_user", "required_role": "admin"},
            ),
            # Suspicious activity
            AuditLogFactory.create_audit_log_data(
                action_type=AuditActionType.SUSPICIOUS_ACTIVITY,
                user_email="suspicious@example.com",
                ip_address="10.0.0.2",
                status="error",
                timestamp=base_time + timedelta(hours=1),
                details={
                    "activity_type": "rapid_requests",
                    "request_count": 1000,
                    "time_window": 60,
                },
            ),
        ]

    @staticmethod
    def admin_operations_logs() -> List[Dict[str, Any]]:
        """Create administrative operation audit logs"""
        base_time = datetime.utcnow() - timedelta(days=1)
        admin_user_id = "admin-12345"

        return [
            # Configuration update
            AuditLogFactory.create_audit_log_data(
                action_type=AuditActionType.CONFIG_UPDATE,
                user_id=admin_user_id,
                user_email="admin@example.com",
                user_role="admin",
                resource_type="config",
                resource_id="api_settings",
                timestamp=base_time,
                details={
                    "setting": "max_requests_per_hour",
                    "old_value": "1000",
                    "new_value": "1500",
                },
            ),
            # User role change
            AuditLogFactory.create_audit_log_data(
                action_type=AuditActionType.USER_ROLE_CHANGE,
                user_id=admin_user_id,
                user_email="admin@example.com",
                user_role="admin",
                resource_type="user",
                resource_id="user-67890",
                timestamp=base_time + timedelta(hours=2),
                details={
                    "target_user": "moderator@example.com",
                    "old_role": "user",
                    "new_role": "moderator",
                },
            ),
            # System configuration change
            AuditLogFactory.create_audit_log_data(
                action_type=AuditActionType.SYSTEM_CONFIG_CHANGE,
                user_id=admin_user_id,
                user_email="admin@example.com",
                user_role="admin",
                timestamp=base_time + timedelta(hours=4),
                details={
                    "component": "audit_system",
                    "setting": "retention_days",
                    "old_value": "90",
                    "new_value": "365",
                },
            ),
        ]

    @staticmethod
    def mixed_status_logs() -> List[Dict[str, Any]]:
        """Create logs with mixed success/failure/error statuses"""
        base_time = datetime.utcnow() - timedelta(hours=2)

        return [
            # Success
            AuditLogFactory.create_audit_log_data(
                action_type=AuditActionType.DOCUMENT_CREATE, status="success", timestamp=base_time
            ),
            # Failure
            AuditLogFactory.create_audit_log_data(
                action_type=AuditActionType.LOGIN_FAILURE,
                status="failure",
                timestamp=base_time + timedelta(minutes=10),
            ),
            # Error
            AuditLogFactory.create_audit_log_data(
                action_type=AuditActionType.SYSTEM_CONFIG_CHANGE,
                status="error",
                timestamp=base_time + timedelta(minutes=20),
                details={"error": "database_connection_failed"},
            ),
        ]

    @staticmethod
    def large_dataset_logs(count: int = 100) -> List[Dict[str, Any]]:
        """Create a large dataset for performance testing"""
        logs = []
        base_time = datetime.utcnow() - timedelta(days=30)

        actions = list(AuditActionType)
        statuses = ["success", "failure", "error"]
        users = [
            "user1@example.com",
            "user2@example.com",
            "admin@example.com",
            "moderator@example.com",
        ]

        for i in range(count):
            action = actions[i % len(actions)]
            status = statuses[i % len(statuses)]
            user_email = users[i % len(users)]

            logs.append(
                AuditLogFactory.create_audit_log_data(
                    action_type=action,
                    user_email=user_email,
                    status=status,
                    timestamp=base_time + timedelta(hours=i),
                    details={"batch_id": f"batch_{i // 10}", "sequence": i},
                )
            )

        return logs


class MockAuditService:
    """Mock audit service for testing frontend components"""

    def __init__(self):
        self.logs = []
        self.stats = {
            "total_events": 0,
            "events_today": 0,
            "events_this_week": 0,
            "events_this_month": 0,
            "top_actions": [],
            "top_users": [],
            "security_events": 0,
            "failed_logins": 0,
        }
        self.action_types = [action.value for action in AuditActionType]

    def set_logs(self, logs: List[Dict[str, Any]]):
        """Set mock audit logs"""
        self.logs = logs
        self._update_stats()

    def set_stats(self, stats: Dict[str, Any]):
        """Set mock audit statistics"""
        self.stats.update(stats)

    def _update_stats(self):
        """Update statistics based on current logs"""
        if not self.logs:
            return

        self.stats["total_events"] = len(self.logs)

        # Count by action type
        action_counts = {}
        for log in self.logs:
            action = log["action_type"]
            action_counts[action] = action_counts.get(action, 0) + 1

        self.stats["top_actions"] = [
            {"action_type": action, "count": count}
            for action, count in sorted(action_counts.items(), key=lambda x: x[1], reverse=True)
        ]

    async def get_audit_logs(self, filters: AuditLogQueryFilters) -> Dict[str, Any]:
        """Mock get audit logs"""
        filtered_logs = self._apply_filters(self.logs, filters)

        # Apply pagination
        start = (filters.page - 1) * filters.page_size
        end = start + filters.page_size
        page_logs = filtered_logs[start:end]

        return {
            "logs": page_logs,
            "total_count": len(filtered_logs),
            "page": filters.page,
            "page_size": filters.page_size,
            "total_pages": (len(filtered_logs) + filters.page_size - 1) // filters.page_size,
            "has_next": end < len(filtered_logs),
            "has_previous": start > 0,
        }

    def _apply_filters(
        self, logs: List[Dict[str, Any]], filters: AuditLogQueryFilters
    ) -> List[Dict[str, Any]]:
        """Apply filters to logs"""
        filtered = logs.copy()

        if filters.user_email:
            filtered = [log for log in filtered if log.get("user_email") == filters.user_email]

        if filters.action_type:
            filtered = [
                log for log in filtered if log.get("action_type") == filters.action_type.value
            ]

        if filters.status:
            filtered = [log for log in filtered if log.get("status") == filters.status]

        if filters.ip_address:
            filtered = [log for log in filtered if log.get("ip_address") == filters.ip_address]

        return filtered


@pytest.fixture
def audit_log_factory():
    """Fixture providing audit log factory"""
    return AuditLogFactory()


@pytest.fixture
def audit_test_data():
    """Fixture providing test data sets"""
    return AuditTestDataSets()


@pytest.fixture
def mock_audit_service():
    """Fixture providing mock audit service"""
    return MockAuditService()


@pytest.fixture
async def audit_service_with_data(audit_test_data, clean_audit_logs):
    """Fixture providing audit service with sample data"""
    service = AuditService()

    # Add sample logs
    login_logs = audit_test_data.login_sequence_logs()
    for log_data in login_logs:
        await service.log_event(
            action_type=AuditActionType(log_data["action_type"]),
            description=log_data["description"],
            user_id=log_data.get("user_id"),
            user_email=log_data.get("user_email"),
            user_role=log_data.get("user_role"),
            ip_address=log_data.get("ip_address"),
            details=json.loads(log_data["details"]) if log_data.get("details") else None,
            status=log_data.get("status", "success"),
        )

    return service


@pytest.fixture
def mock_request_factory():
    """Factory for creating mock FastAPI requests"""

    def create_mock_request(
        ip: str = "192.168.1.100",
        user_agent: str = "Mozilla/5.0 (Test Browser)",
        session_id: str = "test-session-123",
        headers: Optional[Dict[str, str]] = None,
    ) -> Mock:
        request = Mock()
        request.client.host = ip

        default_headers = {"user-agent": user_agent, "x-session-id": session_id}
        if headers:
            default_headers.update(headers)

        request.headers = default_headers
        return request

    return create_mock_request


@pytest.fixture
def performance_test_data():
    """Fixture for performance testing with large datasets"""
    return AuditTestDataSets.large_dataset_logs(1000)


# Helper functions for test assertions
def assert_audit_log_structure(log_data: Dict[str, Any]):
    """Assert that a log entry has the correct structure"""
    required_fields = ["id", "action_type", "description", "timestamp", "status"]

    for field in required_fields:
        assert field in log_data, f"Missing required field: {field}"

    # Validate action type
    assert log_data["action_type"] in [action.value for action in AuditActionType]

    # Validate status
    assert log_data["status"] in ["success", "failure", "error"]

    # Validate timestamp format
    assert isinstance(log_data["timestamp"], (str, datetime))


def assert_worm_compliance(original_log: Dict[str, Any], attempted_modification: Dict[str, Any]):
    """Assert that WORM constraints are properly enforced"""
    # Core fields should remain unchanged
    immutable_fields = ["id", "timestamp", "created_at", "record_hash"]

    for field in immutable_fields:
        if field in original_log:
            assert original_log[field] == attempted_modification.get(
                field
            ), f"WORM violation: {field} was modified"


def create_filter_combinations() -> List[AuditLogQueryFilters]:
    """Create various filter combinations for testing"""
    return [
        # Basic filters
        AuditLogQueryFilters(page=1, page_size=10),
        AuditLogQueryFilters(page=1, page_size=10, user_email="test@example.com"),
        AuditLogQueryFilters(page=1, page_size=10, action_type=AuditActionType.LOGIN_SUCCESS),
        AuditLogQueryFilters(page=1, page_size=10, status="failure"),
        # Combined filters
        AuditLogQueryFilters(
            page=1,
            page_size=25,
            user_email="admin@example.com",
            action_type=AuditActionType.CONFIG_UPDATE,
        ),
        # Date range filters
        AuditLogQueryFilters(
            page=1,
            page_size=50,
            date_from=datetime.utcnow() - timedelta(days=7),
            date_to=datetime.utcnow(),
        ),
        # Pagination variations
        AuditLogQueryFilters(page=2, page_size=5),
        AuditLogQueryFilters(page=3, page_size=100),
    ]
