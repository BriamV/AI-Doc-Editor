# Mock Configuration Guidelines
## T-12 Credential Store Security - Integration Testing Standards

### Overview

This guide provides comprehensive standards and best practices for mock configuration in the T-12 Credential Store Security project. It addresses the mock configuration issues identified during Week 3-4 testing and establishes maintainable patterns for future development.

## Mock Architecture Principles

### 1. Interface Compliance First

**Principle**: All mocks must perfectly match the interface of the production components they replace.

```python
# ✅ CORRECT: Spec-based mock with complete interface
@pytest.fixture
def mock_key_manager():
    mock = Mock(spec=KeyManager)
    mock.create_master_key = AsyncMock(return_value=Mock(id="test-key-id"))
    mock.get_key_material = AsyncMock(return_value=b"test-key-material")
    mock.rotate_key = AsyncMock(return_value=Mock(success=True, new_version=2))
    return mock

# ❌ INCORRECT: Generic mock without interface compliance
@pytest.fixture
def mock_key_manager():
    mock = Mock()
    mock.some_method = Mock()  # Missing required methods
    return mock
```

### 2. Hierarchical Configuration

**Principle**: Organize mock configurations in a clear hierarchy to avoid duplication and maintain consistency.

```
tests/
├── conftest.py                    # Base mocks (shared across all tests)
├── integration/conftest.py        # Integration-specific overrides
├── security/conftest.py          # Security test specializations
└── unit/conftest.py              # Unit test mocks
```

### 3. State Isolation

**Principle**: Ensure each test gets a clean mock state without interference from other tests.

```python
# ✅ CORRECT: Proper state isolation
@pytest.fixture(autouse=True)
def reset_mocks(mock_hsm_manager, mock_audit_logger):
    """Reset all mocks between tests."""
    yield
    for mock_obj in [mock_hsm_manager, mock_audit_logger]:
        mock_obj.reset_mock()
```

## Component-Specific Mock Standards

### 1. TLSSecurityMiddleware Mocks

#### Current Issue Resolution

**Problem**: `'TLSSecurityMiddleware' object has no attribute 'tls_config'`

**Solution**:
```python
@pytest.fixture
def mock_tls_config():
    """Provide complete TLS configuration mock."""
    config = Mock(spec=TLSSecurityConfig)
    config.create_ssl_context = Mock(return_value=Mock())
    config.verify_certificate_pin = Mock(return_value=True)
    config.test_connection = Mock(return_value={"status": "success"})
    config.ssl_context = Mock()
    config.ssl_context.cipher = Mock()
    return config

@pytest.fixture
def security_middleware(mock_tls_config):
    """Provide properly configured security middleware mock."""
    middleware = Mock(spec=TLSSecurityMiddleware)
    # Ensure all expected attributes are present
    middleware.tls_config = mock_tls_config
    middleware.config = mock_tls_config
    middleware.app = Mock()

    # Configure all expected methods
    middleware._validate_tls_requirements = AsyncMock(
        return_value=Mock(is_valid=True, error_message=None)
    )
    middleware._inject_security_headers = Mock()
    middleware._is_secure_connection = Mock(return_value=True)
    middleware.get_security_metrics = Mock(return_value={
        "total_requests": 0,
        "security_violations": 0,
        "violation_rate": 0.0
    })

    return middleware
```

### 2. HSMManager Mocks

#### Complete Interface Mock

```python
@pytest.fixture
def mock_hsm_manager():
    """Provide comprehensive HSM manager mock."""
    mock = AsyncMock(spec=HSMManager)

    # Connection management
    mock.connect = AsyncMock(return_value=True)
    mock.disconnect = AsyncMock(return_value=True)
    mock.is_available = Mock(return_value=True)

    # Key operations
    mock.generate_key = AsyncMock(return_value=secrets.token_bytes(32))
    mock.encrypt = AsyncMock(return_value=b"encrypted_data")
    mock.decrypt = AsyncMock(return_value=b"decrypted_data")
    mock.rotate_key_in_hsm = AsyncMock(return_value=True)

    # Enhanced operations for Week 3
    mock.connect_with_full_security = AsyncMock(return_value=True)
    mock.generate_key_in_hsm = AsyncMock(return_value=secrets.token_bytes(32))
    mock.encrypt_in_hsm = AsyncMock(return_value=b"hsm_encrypted_data")
    mock.decrypt_in_hsm = AsyncMock(return_value=b"hsm_decrypted_data")

    # Health and monitoring
    mock.get_health_status = Mock(return_value={
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "provider": "AWS_CLOUDHSM",
        "cluster_id": "test-cluster",
    })

    return mock
```

### 3. KeyManager Mocks

#### Production-Ready Mock Configuration

```python
@pytest.fixture
def mock_key_manager(mock_hsm_manager):
    """Provide production-ready KeyManager mock."""
    mock = AsyncMock(spec=KeyManager)

    # Key creation operations
    mock.create_master_key = AsyncMock(
        return_value=Mock(
            id="master-key-123",
            status=KeyStatus.ACTIVE,
            algorithm="AES_256_GCM",
            current_version=1,
            hsm_backed=False
        )
    )

    mock.create_data_key = AsyncMock(
        return_value=Mock(
            id="data-key-456",
            master_key_id="master-key-123",
            status=KeyStatus.ACTIVE,
            current_version=1
        )
    )

    mock.create_tls_key = AsyncMock(
        return_value=Mock(
            id="tls-key-789",
            algorithm="RSA_2048",
            status=KeyStatus.ACTIVE
        )
    )

    # Key retrieval and management
    mock.get_key_by_id = AsyncMock(
        return_value=Mock(
            id="test-key-id",
            encrypted_key=b"encrypted_key_data",
            status=KeyStatus.ACTIVE
        )
    )

    mock.get_key_material = AsyncMock(return_value=secrets.token_bytes(32))
    mock.list_keys = AsyncMock(return_value=[])
    mock.get_key_versions = AsyncMock(return_value=[])

    # Key rotation operations
    mock.rotate_key = AsyncMock(
        return_value=Mock(
            success=True,
            new_version=2,
            previous_version=1
        )
    )

    mock.rotate_hsm_key = AsyncMock(
        return_value=Mock(success=True, new_version=2)
    )

    mock.execute_automated_rotation = AsyncMock(
        return_value=Mock(success=True)
    )

    # Policy and audit operations
    mock.get_rotation_policy = AsyncMock(
        return_value=Mock(
            auto_rotation_enabled=True,
            max_key_age_days=365,
            last_rotation_date=None
        )
    )

    mock.create_rotation_policy = AsyncMock(
        return_value=Mock(auto_rotation_enabled=True)
    )

    mock.get_audit_trail = AsyncMock(return_value=[
        Mock(timestamp=datetime.utcnow(), operation="create", user_id="test", result="success"),
        Mock(timestamp=datetime.utcnow(), operation="rotate", user_id="test", result="success")
    ])

    # Cleanup
    mock.cleanup = AsyncMock()

    return mock
```

### 4. Database Session Mocks

#### Improved Session Management

```python
@pytest.fixture
async def db_session(test_engine, setup_test_database):
    """Provide isolated database session for testing."""
    async_session = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )

    async with async_session() as session:
        # Create a savepoint for rollback
        transaction = await session.begin()

        try:
            yield session
        except Exception:
            # Rollback on any exception
            await transaction.rollback()
            raise
        else:
            # Rollback successful tests to maintain isolation
            await transaction.rollback()
        finally:
            # Ensure session is properly closed
            await session.close()
```

## Mock Lifecycle Management

### 1. Setup and Teardown Patterns

```python
@pytest.fixture(autouse=True)
def mock_lifecycle_management():
    """Manage mock lifecycle across tests."""
    # Setup phase
    setup_time = time.time()

    yield

    # Teardown phase
    cleanup_time = time.time()
    test_duration = cleanup_time - setup_time

    # Log slow tests for performance monitoring
    if test_duration > 5.0:
        pytest.current_test_slow = True
```

### 2. Mock State Validation

```python
@pytest.fixture(autouse=True)
def validate_mock_state():
    """Validate mock state before and after tests."""
    # Pre-test validation
    mocks_to_validate = []

    yield mocks_to_validate

    # Post-test validation
    for mock_obj in mocks_to_validate:
        if hasattr(mock_obj, 'call_count'):
            # Reset call count for next test
            mock_obj.reset_mock()
```

### 3. Resource Cleanup

```python
@pytest.fixture(autouse=True)
async def cleanup_async_resources():
    """Ensure all async resources are properly cleaned up."""
    active_tasks = []

    yield active_tasks

    # Cancel any remaining tasks
    for task in active_tasks:
        if not task.done():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
```

## Mock Testing Best Practices

### 1. Mock Behavior Validation

```python
def test_mock_behavior_consistency():
    """Validate that mocks behave consistently with production code."""
    # Test that mock methods return expected types
    mock_key_manager = create_mock_key_manager()

    # Validate return types
    assert isinstance(mock_key_manager.create_master_key.return_value.id, str)
    assert isinstance(mock_key_manager.get_key_material.return_value, bytes)

    # Validate method signatures match production
    import inspect
    from app.security.key_management.key_manager import KeyManager

    production_methods = inspect.getmembers(KeyManager, predicate=inspect.ismethod)
    mock_methods = inspect.getmembers(mock_key_manager, predicate=inspect.ismethod)

    # Ensure all production methods are mocked
    production_method_names = {name for name, _ in production_methods}
    mock_method_names = {name for name, _ in mock_methods}

    missing_methods = production_method_names - mock_method_names
    assert not missing_methods, f"Missing mock methods: {missing_methods}"
```

### 2. Mock Performance Testing

```python
@pytest.mark.performance
def test_mock_performance():
    """Ensure mocks don't introduce performance bottlenecks."""
    mock_key_manager = create_mock_key_manager()

    start_time = time.time()

    # Perform many mock operations
    for _ in range(1000):
        mock_key_manager.get_key_material("test-key")

    end_time = time.time()
    duration = end_time - start_time

    # Mock operations should be very fast
    assert duration < 0.1, f"Mock operations too slow: {duration}s"
```

### 3. Mock Error Scenarios

```python
@pytest.fixture
def mock_with_error_scenarios():
    """Provide mock that can simulate various error conditions."""
    mock = AsyncMock(spec=KeyManager)

    # Normal operation
    mock.create_master_key.return_value = Mock(id="test-key")

    # Error scenarios
    mock.create_master_key.side_effect = [
        # First call succeeds
        Mock(id="test-key"),
        # Second call fails
        Exception("HSM unavailable"),
        # Third call succeeds again
        Mock(id="test-key-2")
    ]

    return mock
```

## Integration Mock Patterns

### 1. Cross-Component Mocking

```python
@pytest.fixture
def integrated_security_stack(mock_key_manager, mock_hsm_manager, security_middleware):
    """Provide integrated mock stack for end-to-end testing."""

    class IntegratedMockStack:
        def __init__(self):
            self.key_manager = mock_key_manager
            self.hsm_manager = mock_hsm_manager
            self.security_middleware = security_middleware

            # Configure cross-component interactions
            self._setup_interactions()

        def _setup_interactions(self):
            """Configure how mocked components interact."""
            # When key_manager creates HSM-backed keys, it should use hsm_manager
            async def create_hsm_backed_key(*args, **kwargs):
                if kwargs.get('hsm_backed', False):
                    # Simulate HSM interaction
                    await self.hsm_manager.generate_key()
                return Mock(id="hsm-key-123", hsm_backed=True)

            self.key_manager.create_master_key.side_effect = create_hsm_backed_key

    return IntegratedMockStack()
```

### 2. Mock Data Consistency

```python
@pytest.fixture
def consistent_mock_data():
    """Provide consistent test data across all mocks."""

    class MockDataFactory:
        def __init__(self):
            self.master_key_id = "master-key-123"
            self.data_key_id = "data-key-456"
            self.test_key_material = secrets.token_bytes(32)

        def create_master_key_mock(self):
            return Mock(
                id=self.master_key_id,
                status=KeyStatus.ACTIVE,
                algorithm="AES_256_GCM",
                current_version=1
            )

        def create_data_key_mock(self):
            return Mock(
                id=self.data_key_id,
                master_key_id=self.master_key_id,
                status=KeyStatus.ACTIVE,
                current_version=1
            )

    return MockDataFactory()
```

## Mock Configuration Validation

### 1. Automated Interface Checking

```python
def validate_mock_interface_compliance():
    """Automatically validate that mocks comply with production interfaces."""

    # Define interface validation rules
    validation_rules = {
        'KeyManager': {
            'required_methods': [
                'create_master_key', 'create_data_key', 'get_key_material',
                'rotate_key', 'list_keys', 'cleanup'
            ],
            'async_methods': [
                'create_master_key', 'create_data_key', 'get_key_material',
                'rotate_key', 'list_keys', 'cleanup'
            ]
        },
        'HSMManager': {
            'required_methods': [
                'connect', 'disconnect', 'generate_key', 'encrypt', 'decrypt'
            ],
            'async_methods': [
                'connect', 'disconnect', 'generate_key', 'encrypt', 'decrypt'
            ]
        }
    }

    # Validate each component
    for component_name, rules in validation_rules.items():
        mock_component = globals().get(f'mock_{component_name.lower()}')
        if mock_component:
            validate_component_interface(mock_component, rules)

def validate_component_interface(mock_obj, rules):
    """Validate a specific mock component against interface rules."""
    for method_name in rules['required_methods']:
        assert hasattr(mock_obj, method_name), f"Missing method: {method_name}"

        method = getattr(mock_obj, method_name)
        if method_name in rules['async_methods']:
            assert isinstance(method, AsyncMock), f"Method {method_name} should be AsyncMock"
        else:
            assert isinstance(method, Mock), f"Method {method_name} should be Mock"
```

### 2. Mock Health Monitoring

```python
@pytest.fixture(autouse=True)
def mock_health_monitor():
    """Monitor mock health and performance."""

    class MockHealthMonitor:
        def __init__(self):
            self.call_counts = {}
            self.error_counts = {}

        def record_call(self, mock_name, method_name):
            key = f"{mock_name}.{method_name}"
            self.call_counts[key] = self.call_counts.get(key, 0) + 1

        def record_error(self, mock_name, method_name, error):
            key = f"{mock_name}.{method_name}"
            self.error_counts[key] = self.error_counts.get(key, 0) + 1

        def get_health_report(self):
            return {
                'total_calls': sum(self.call_counts.values()),
                'total_errors': sum(self.error_counts.values()),
                'error_rate': sum(self.error_counts.values()) / max(sum(self.call_counts.values()), 1),
                'call_distribution': self.call_counts,
                'error_distribution': self.error_counts
            }

    monitor = MockHealthMonitor()
    yield monitor

    # Log health report after test
    report = monitor.get_health_report()
    if report['error_rate'] > 0.1:  # More than 10% error rate
        pytest.warn(f"High mock error rate detected: {report['error_rate']:.2%}")
```

## Documentation and Maintenance

### 1. Mock Documentation Standards

Each mock fixture should include:

```python
@pytest.fixture
def mock_key_manager():
    """
    Provide KeyManager mock for testing.

    Returns:
        Mock: Configured KeyManager mock with the following capabilities:
        - create_master_key: Creates master keys with specified parameters
        - get_key_material: Returns test key material (32 bytes)
        - rotate_key: Simulates successful key rotation

    Configuration:
        - All methods return successful responses by default
        - HSM integration is mocked to return success
        - Cleanup is properly handled

    Usage:
        async def test_key_creation(mock_key_manager):
            key = await mock_key_manager.create_master_key(name="test")
            assert key.id == "master-key-123"

    Notes:
        - Reset automatically between tests
        - Compatible with both unit and integration tests
        - Supports error scenario injection via side_effect
    """
    # Mock implementation here
```

### 2. Mock Maintenance Checklist

#### Weekly Mock Review
- [ ] Verify all mocks match current production interfaces
- [ ] Check for unused or deprecated mock configurations
- [ ] Review mock performance metrics
- [ ] Update mock documentation

#### Monthly Mock Audit
- [ ] Validate mock behavior against production changes
- [ ] Review test coverage of mock error scenarios
- [ ] Assess mock complexity and simplification opportunities
- [ ] Update mock configuration guidelines

#### Release Mock Validation
- [ ] Run complete mock interface compliance check
- [ ] Verify all integration test scenarios pass
- [ ] Validate mock performance benchmarks
- [ ] Review mock-related test failures

## Conclusion

This mock configuration guide establishes comprehensive standards for creating, maintaining, and validating mocks in the T-12 Credential Store Security project. By following these guidelines, we ensure:

- **Interface Compliance**: All mocks accurately represent production components
- **Test Reliability**: Consistent mock behavior reduces test flakiness
- **Maintainability**: Clear patterns make mock updates straightforward
- **Performance**: Efficient mock operations don't slow down test execution
- **Debugging**: Well-documented mocks make test failure diagnosis easier

Regular adherence to these standards will maintain high test quality and support continued T-12 development with confidence in the test suite's reliability.