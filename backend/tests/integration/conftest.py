"""
Integration Test Configuration and Fixtures

Provides shared fixtures and configuration for T-12 integration tests,
including database setup, mock HSM providers, test data factories,
and performance measurement utilities.
"""

import pytest
import asyncio
import os
import sys
import secrets
from typing import AsyncGenerator, Dict, Any
from unittest.mock import Mock, AsyncMock
from datetime import datetime
import time

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from fastapi.testclient import TestClient
from fastapi import FastAPI

from app.db.session import get_db
from app.models.key_management import Base as KeyManagementBase
from app.models.audit import Base as AuditBase
from app.security.encryption.aes_gcm_engine import AESGCMEngine
from app.security.encryption.key_derivation import Argon2KeyDerivation
from app.security.encryption.memory_utils import SecureMemoryManager
from app.security.key_management.key_manager import KeyManager
from app.security.key_management.hsm_integration import HSMManager
from app.security.key_management.monitoring import KeyManagementMonitor
from app.security.transport.security_middleware import TLSSecurityMiddleware
from app.routers.key_management import router as key_management_router


# Test database configuration
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_engine():
    """Create test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        future=True,
        pool_pre_ping=True,
    )
    yield engine
    await engine.dispose()


@pytest.fixture(scope="session")
async def setup_test_database(test_engine):
    """Setup test database with all required tables."""
    async with test_engine.begin() as conn:
        # Create all tables for key management and audit
        await conn.run_sync(KeyManagementBase.metadata.create_all)
        await conn.run_sync(AuditBase.metadata.create_all)

    yield

    # Cleanup after all tests
    async with test_engine.begin() as conn:
        await conn.run_sync(KeyManagementBase.metadata.drop_all)
        await conn.run_sync(AuditBase.metadata.drop_all)


@pytest.fixture
async def db_session(test_engine, setup_test_database) -> AsyncGenerator[AsyncSession, None]:
    """Provide a clean database session for each test."""
    async_session = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Start a transaction
        transaction = await session.begin()

        try:
            yield session
        finally:
            # Rollback transaction after test
            await transaction.rollback()


@pytest.fixture
async def aes_gcm_engine():
    """Provide AES-GCM encryption engine for testing."""
    memory_manager = SecureMemoryManager()
    key_derivation = Argon2KeyDerivation()

    engine = AESGCMEngine(memory_manager=memory_manager, key_derivation=key_derivation)

    yield engine

    # Cleanup
    await engine.cleanup()


@pytest.fixture
async def mock_hsm_manager():
    """Provide mock HSM manager for testing."""
    mock_hsm = AsyncMock(spec=HSMManager)

    # Mock HSM configuration - not used directly in fixture

    # Mock HSM operations
    mock_hsm.connect.return_value = True
    mock_hsm.disconnect.return_value = True
    mock_hsm.generate_key.return_value = secrets.token_bytes(32)
    mock_hsm.encrypt.return_value = b"encrypted_data"
    mock_hsm.decrypt.return_value = b"decrypted_data"
    mock_hsm.is_available.return_value = True
    mock_hsm.get_health_status.return_value = {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "provider": "AWS_CLOUDHSM",
        "cluster_id": "test-cluster",
    }

    yield mock_hsm


@pytest.fixture
async def key_manager(db_session, aes_gcm_engine, mock_hsm_manager):
    """Provide KeyManager instance for testing."""
    monitor = KeyManagementMonitor()

    key_manager = KeyManager(
        db_session=db_session,
        encryption_engine=aes_gcm_engine,
        hsm_manager=mock_hsm_manager,
        monitor=monitor,
    )

    yield key_manager

    # Cleanup
    await key_manager.cleanup()


@pytest.fixture
def mock_tls_config():
    """Provide mock TLS configuration for testing."""
    mock_config = Mock()
    mock_config.create_ssl_context.return_value = Mock()
    mock_config.verify_certificate_pin.return_value = True
    mock_config.test_connection.return_value = {"status": "success"}
    mock_ssl_context = Mock()
    mock_ssl_context.cipher = Mock()
    mock_config.ssl_context = mock_ssl_context

    return mock_config


@pytest.fixture
def security_middleware(mock_tls_config):
    """Provide security middleware for testing."""
    middleware = TLSSecurityMiddleware(app=Mock(), config=mock_tls_config)
    middleware.tls_config = mock_tls_config
    return middleware


@pytest.fixture
def test_app(db_session, security_middleware):
    """Provide FastAPI test application with security middleware."""
    app = FastAPI(title="T-12 Integration Test API")

    # Add security middleware
    app.add_middleware(TLSSecurityMiddleware, tls_config=security_middleware.tls_config)

    # Include key management router
    app.include_router(key_management_router, prefix="/api/v1")

    # Override database dependency
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    return app


@pytest.fixture
def test_client(test_app):
    """Provide test client for API testing."""
    return TestClient(test_app)


@pytest.fixture
def performance_timer():
    """Provide performance timing utility."""

    class PerformanceTimer:
        def __init__(self):
            self.start_time = None
            self.end_time = None

        def start(self):
            self.start_time = time.perf_counter()

        def stop(self):
            self.end_time = time.perf_counter()

        @property
        def elapsed(self) -> float:
            if self.start_time is None or self.end_time is None:
                return 0.0
            return self.end_time - self.start_time

        @property
        def elapsed_ms(self) -> float:
            return self.elapsed * 1000

    return PerformanceTimer()


@pytest.fixture
def test_key_data():
    """Provide test key data factory."""

    class TestKeyData:
        @staticmethod
        def create_master_key_data() -> Dict[str, Any]:
            return {
                "name": f"test_master_key_{secrets.token_hex(8)}",
                "key_type": "KEK",
                "algorithm": "AES_256_GCM",
                "description": "Test master key for integration testing",
                "metadata": {"purpose": "integration_test", "created_by": "test_system"},
            }

        @staticmethod
        def create_data_key_data() -> Dict[str, Any]:
            return {
                "name": f"test_data_key_{secrets.token_hex(8)}",
                "key_type": "DEK",
                "algorithm": "AES_256_GCM",
                "description": "Test data key for integration testing",
                "metadata": {"purpose": "integration_test", "created_by": "test_system"},
            }

        @staticmethod
        def create_rotation_policy_data() -> Dict[str, Any]:
            return {
                "rotation_interval_days": 30,
                "max_key_age_days": 90,
                "auto_rotation_enabled": True,
                "notification_threshold_days": 7,
                "backup_retention_days": 365,
            }

        @staticmethod
        def create_test_plaintext(size: int = 1024) -> bytes:
            """Create test plaintext data of specified size."""
            return secrets.token_bytes(size)

    return TestKeyData()


@pytest.fixture
async def test_encryption_key():
    """Provide test encryption key for testing."""
    # Generate a test key using Argon2 derivation
    key_derivation = Argon2KeyDerivation()
    password = "test_password_for_integration_testing"
    salt = secrets.token_bytes(32)

    key = await key_derivation.derive_key(
        password=password.encode(),
        salt=salt,
        key_length=32,
        iterations=100,  # Reduced for testing performance
    )

    return {"key": key, "password": password, "salt": salt}


@pytest.fixture
def mock_audit_logger():
    """Provide mock audit logger for testing."""
    logger = AsyncMock()
    logger.log_key_operation = AsyncMock()
    logger.log_rotation_event = AsyncMock()
    logger.log_hsm_operation = AsyncMock()
    logger.log_security_event = AsyncMock()

    return logger


@pytest.fixture
async def integration_test_context(
    db_session,
    aes_gcm_engine,
    key_manager,
    mock_hsm_manager,
    test_client,
    performance_timer,
    test_key_data,
    mock_audit_logger,
):
    """Provide comprehensive integration test context."""

    class IntegrationTestContext:
        def __init__(self):
            self.db_session = db_session
            self.aes_gcm_engine = aes_gcm_engine
            self.key_manager = key_manager
            self.hsm_manager = mock_hsm_manager
            self.test_client = test_client
            self.performance_timer = performance_timer
            self.test_key_data = test_key_data
            self.audit_logger = mock_audit_logger

        async def create_test_master_key(self):
            """Create a test master key."""
            key_data = self.test_key_data.create_master_key_data()
            return await self.key_manager.create_master_key(
                name=key_data["name"],
                key_type=key_data["key_type"],
                algorithm=key_data["algorithm"],
                description=key_data["description"],
                metadata=key_data["metadata"],
            )

        async def create_test_data_key(self, master_key_id: str):
            """Create a test data key."""
            key_data = self.test_key_data.create_data_key_data()
            return await self.key_manager.create_data_key(
                master_key_id=master_key_id,
                name=key_data["name"],
                algorithm=key_data["algorithm"],
                description=key_data["description"],
                metadata=key_data["metadata"],
            )

        def measure_performance(self, operation_name: str):
            """Context manager for measuring operation performance."""

            class PerformanceMeasurement:
                def __init__(self, timer, name):
                    self.timer = timer
                    self.name = name

                def __enter__(self):
                    self.timer.start()
                    return self

                def __exit__(self, exc_type, exc_val, exc_tb):
                    self.timer.stop()
                    print(f"{self.name}: {self.timer.elapsed_ms:.2f}ms")

            return PerformanceMeasurement(self.performance_timer, operation_name)

    return IntegrationTestContext()


# Performance test constants
PERFORMANCE_THRESHOLDS = {
    "key_creation_ms": 1000,  # 1 second max for key creation
    "encryption_ms": 100,  # 100ms max for encryption operations
    "decryption_ms": 100,  # 100ms max for decryption operations
    "key_rotation_ms": 5000,  # 5 seconds max for key rotation
    "hsm_operation_ms": 2000,  # 2 seconds max for HSM operations
    "api_response_ms": 500,  # 500ms max for API responses
}


# Test data constants
TEST_DATA_SIZES = [
    1024,  # 1KB
    10240,  # 10KB
    102400,  # 100KB
    1048576,  # 1MB
]

STRESS_TEST_ITERATIONS = 100
CONCURRENT_OPERATIONS = 10
