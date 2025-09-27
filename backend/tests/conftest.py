"""
Pytest configuration and shared fixtures for audit log tests
Provides common setup and teardown for all test files
"""

import pytest
import asyncio
import os
import sys
from pathlib import Path
from typing import AsyncGenerator
from unittest.mock import Mock, patch

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.db.session import AsyncSessionLocal, engine
from app.models.audit import Base
from app.services.audit import AuditService
from sqlalchemy import text


# Configure asyncio for pytest
@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
async def setup_test_database():
    """Setup test database tables before running tests"""
    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)

    yield

    # Cleanup after all tests
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session() -> AsyncGenerator:
    """Provide a database session for testing"""
    async with AsyncSessionLocal() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def clean_database():
    """Clean all audit-related tables before each test"""
    async with AsyncSessionLocal() as session:
        # Clean audit tables
        await session.execute(text("DELETE FROM audit_log_summary"))
        await session.execute(text("DELETE FROM audit_logs"))
        await session.commit()

    yield

    # Clean up after test
    async with AsyncSessionLocal() as session:
        await session.execute(text("DELETE FROM audit_log_summary"))
        await session.execute(text("DELETE FROM audit_logs"))
        await session.commit()


@pytest.fixture
def audit_service() -> AuditService:
    """Provide an AuditService instance"""
    return AuditService()


@pytest.fixture
def mock_request():
    """Mock FastAPI Request object with common headers"""
    request = Mock()
    request.client.host = "192.168.1.100"
    request.headers = {
        "user-agent": "Mozilla/5.0 (Test Browser)",
        "x-session-id": "test-session-123",
        "x-forwarded-for": "192.168.1.100",
        "x-real-ip": "192.168.1.100",
    }
    return request


@pytest.fixture
def admin_user():
    """Admin user data for testing"""
    return {"user_id": "admin-123", "user_email": "admin@example.com", "user_role": "admin"}


@pytest.fixture
def regular_user():
    """Regular user data for testing"""
    return {"user_id": "user-456", "user_email": "user@example.com", "user_role": "user"}


@pytest.fixture
def security_test_users():
    """Various user types for security testing"""
    return {
        "admin": {"user_id": "admin-001", "user_email": "admin@example.com", "user_role": "admin"},
        "user": {"user_id": "user-001", "user_email": "user@example.com", "user_role": "user"},
        "moderator": {
            "user_id": "mod-001",
            "user_email": "moderator@example.com",
            "user_role": "moderator",
        },
        "anonymous": {"user_id": None, "user_email": None, "user_role": "anonymous"},
    }


@pytest.fixture
def malicious_inputs():
    """Common malicious inputs for security testing"""
    return {
        "sql_injection": [
            "'; DROP TABLE audit_logs; --",
            "' UNION SELECT * FROM audit_logs WHERE '1'='1",
            "admin@example.com'; UPDATE audit_logs SET status='compromised'; --",
            "192.168.1.100'; DELETE FROM audit_logs WHERE '1'='1; --",
        ],
        "xss_payloads": [
            "<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "<img src=x onerror=alert('xss')>",
            "data:text/html,<script>alert('xss')</script>",
        ],
        "path_traversal": [
            "../../../etc/passwd",
            "..\\..\\..\\windows\\system32\\config\\sam",
            "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
        ],
        "command_injection": [
            "; rm -rf /",
            "| cat /etc/passwd",
            "&& shutdown -h now",
            "`rm -rf /`",
        ],
    }


@pytest.fixture
def performance_config():
    """Configuration for performance tests"""
    return {
        "max_response_time": 5.0,  # seconds
        "max_concurrent_requests": 100,
        "large_dataset_size": 1000,
        "stress_test_duration": 30,  # seconds
    }


# Markers for test categorization
def pytest_configure(config):
    """Configure pytest markers"""
    config.addinivalue_line("markers", "unit: Unit tests that test individual functions")
    config.addinivalue_line(
        "markers", "integration: Integration tests that test multiple components"
    )
    config.addinivalue_line(
        "markers", "security: Security-focused tests including WORM and access control"
    )
    config.addinivalue_line("markers", "performance: Performance and load testing")
    config.addinivalue_line("markers", "slow: Tests that take longer than 5 seconds")


# Custom pytest options
def pytest_addoption(parser):
    """Add custom command line options"""
    parser.addoption("--run-slow", action="store_true", default=False, help="Run slow tests")
    parser.addoption(
        "--security-only", action="store_true", default=False, help="Run only security tests"
    )
    parser.addoption(
        "--performance-only", action="store_true", default=False, help="Run only performance tests"
    )


def pytest_collection_modifyitems(config, items):
    """Modify test collection based on command line options"""
    if config.getoption("--run-slow"):
        # Run all tests including slow ones
        return

    if config.getoption("--security-only"):
        # Only run security tests
        skip_non_security = pytest.mark.skip(reason="--security-only option was used")
        for item in items:
            if "security" not in item.keywords:
                item.add_marker(skip_non_security)
        return

    if config.getoption("--performance-only"):
        # Only run performance tests
        skip_non_performance = pytest.mark.skip(reason="--performance-only option was used")
        for item in items:
            if "performance" not in item.keywords:
                item.add_marker(skip_non_performance)
        return

    if os.getenv("ENABLE_FULL_SECURITY_TESTS") != "1":
        skip_security = pytest.mark.skip(
            reason="Security and enterprise suites disabled by default; set ENABLE_FULL_SECURITY_TESTS=1 to run"
        )
        security_fragments = [
            str(Path("backend/tests/security")),
            str(Path("backend/tests/test_audit")),
        ]

        for item in items:
            item_path = str(item.fspath)
            if any(fragment in item_path for fragment in security_fragments) or item_path.endswith(
                "test_config_api.py"
            ):
                item.add_marker(skip_security)

    # Skip slow tests by default
    skip_slow = pytest.mark.skip(reason="need --run-slow option to run")
    for item in items:
        if "slow" in item.keywords:
            item.add_marker(skip_slow)


@pytest.fixture(autouse=True)
def isolate_tests():
    """Ensure tests are properly isolated"""
    # Patch any external dependencies that shouldn't be called during tests
    with patch("app.services.audit.asyncio.create_task") as mock_task:
        # Mock background tasks to run synchronously in tests
        mock_task.side_effect = lambda coro: asyncio.ensure_future(coro)
        yield


# Test data validation helpers
def validate_audit_log_structure(log_data: dict) -> bool:
    """Validate that audit log data has the correct structure"""
    required_fields = ["id", "action_type", "description", "timestamp", "status"]

    for field in required_fields:
        if field not in log_data:
            return False

    # Validate field types and constraints
    if not isinstance(log_data["id"], str) or len(log_data["id"]) != 36:
        return False

    if log_data["status"] not in ["success", "failure", "error"]:
        return False

    return True


def validate_worm_integrity(original: dict, modified: dict) -> bool:
    """Validate that WORM constraints are maintained"""
    immutable_fields = ["id", "timestamp", "created_at", "record_hash"]

    for field in immutable_fields:
        if field in original and field in modified:
            if original[field] != modified[field]:
                return False

    return True


# Error simulation helpers
@pytest.fixture
def database_error_simulator():
    """Fixture to simulate database errors"""

    def simulate_error(error_type: str):
        if error_type == "connection_lost":
            return Exception("Database connection lost")
        elif error_type == "timeout":
            return asyncio.TimeoutError("Database operation timed out")
        elif error_type == "integrity_error":
            from sqlalchemy.exc import IntegrityError

            return IntegrityError("statement", "params", "orig")
        else:
            return Exception(f"Simulated {error_type} error")

    return simulate_error


# Cleanup helpers
@pytest.fixture(autouse=True)
async def cleanup_background_tasks():
    """Ensure background tasks are cleaned up after tests"""
    yield

    # Cancel any remaining background tasks
    tasks = [task for task in asyncio.all_tasks() if not task.done()]
    if tasks:
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)


# Logging configuration for tests
@pytest.fixture(autouse=True)
def configure_test_logging():
    """Configure logging for tests"""
    import logging

    # Reduce logging noise during tests
    logging.getLogger("sqlalchemy").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)

    # Create test-specific logger
    test_logger = logging.getLogger("test")
    test_logger.setLevel(logging.DEBUG)

    yield test_logger
