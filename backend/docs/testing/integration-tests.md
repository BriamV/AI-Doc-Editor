# T-12 Credential Store Security Integration Tests

This directory contains comprehensive integration tests for the T-12 Credential Store Security implementation, covering all three weeks of development:

- **Week 1**: AES-256-GCM Encryption Core
- **Week 2**: TLS 1.3 Transport Security
- **Week 3**: Key Management System

## Test Structure

### Test Files

1. **`conftest.py`** - Test configuration, fixtures, and shared utilities
2. **`test_week1_week3_integration.py`** - Week 1 + Week 3 integration tests
3. **`test_week2_week3_integration.py`** - Week 2 + Week 3 integration tests
4. **`test_complete_t12_integration.py`** - Complete end-to-end integration tests
5. **`test_key_management_api_integration.py`** - API endpoint integration tests
6. **`test_runner.py`** - Comprehensive test runner with reporting

### Test Coverage

#### Week 1-3 Integration Tests
- KeyManager using AES-256-GCM encryption for key storage
- Key derivation integration with Argon2
- Encrypted key storage and retrieval workflows
- Performance testing for encryption operations
- Memory safety and secure cleanup

#### Week 2-3 Integration Tests
- Key management endpoints with TLS security middleware
- Certificate-based HSM authentication
- Secure key transport over TLS 1.3
- Integration with security headers and HSTS
- TLS certificate management for key operations

#### Complete T-12 Integration Tests
- End-to-end key lifecycle (create → encrypt → store → rotate → decrypt)
- HSM integration with AES-GCM and TLS 1.3
- Database migrations with encrypted key storage
- Router endpoints with full security stack
- Compliance validation (FIPS, NIST, SOX)

#### API Integration Tests
- All key management endpoints (CRUD operations)
- Authentication and authorization testing
- Rate limiting and security validation
- Error handling and edge cases
- Performance benchmarking

## Running the Tests

### Prerequisites

1. **Python Environment**:
   ```bash
   python >= 3.11
   pip install -r requirements.txt
   ```

2. **Test Dependencies**:
   ```bash
   pip install pytest pytest-asyncio pytest-mock
   ```

3. **Environment Variables**:
   ```bash
   export TESTING=true
   export LOG_LEVEL=DEBUG
   export ENCRYPTION_KEY=test_encryption_key_for_testing_only
   export HSM_SIMULATION_MODE=true
   ```

### Running All Tests

```bash
# Using the test runner (recommended)
python backend/tests/integration/test_runner.py

# Using pytest directly
cd backend
pytest tests/integration/ -v
```

### Running Specific Test Suites

```bash
# Week 1-3 integration only
python test_runner.py --filter week1_week3

# Week 2-3 integration only
python test_runner.py --filter week2_week3

# Complete integration tests only
python test_runner.py --filter complete_t12

# API integration tests only
python test_runner.py --filter api_integration

# Performance tests only
python test_runner.py --performance-only
```

### Running Individual Test Files

```bash
# Week 1-3 integration
pytest tests/integration/test_week1_week3_integration.py -v

# Week 2-3 integration
pytest tests/integration/test_week2_week3_integration.py -v

# Complete integration
pytest tests/integration/test_complete_t12_integration.py -v

# API integration
pytest tests/integration/test_key_management_api_integration.py -v
```

### Validation Only

```bash
# Validate environment and requirements without running tests
python test_runner.py --validate-only
```

## Test Configuration

### Performance Thresholds

The tests include performance validation with the following thresholds:

```python
PERFORMANCE_THRESHOLDS = {
    "key_creation_ms": 1000,      # 1 second max for key creation
    "encryption_ms": 100,         # 100ms max for encryption operations
    "decryption_ms": 100,         # 100ms max for decryption operations
    "key_rotation_ms": 5000,      # 5 seconds max for key rotation
    "hsm_operation_ms": 2000,     # 2 seconds max for HSM operations
    "api_response_ms": 500,       # 500ms max for API responses
}
```

### Test Data Sizes

Performance tests use multiple data sizes:

```python
TEST_DATA_SIZES = [
    1024,      # 1KB
    10240,     # 10KB
    102400,    # 100KB
    1048576,   # 1MB
]
```

### Security Test Vectors

Security tests include validation against:

- Malicious inputs (SQL injection, XSS)
- Invalid key formats and sizes
- Authentication bypass attempts
- Authorization escalation attempts
- Rate limiting validation

## Test Reports

### Automatic Reporting

The test runner generates comprehensive reports including:

- **Test Results**: Pass/fail status for each test
- **Performance Metrics**: Timing data for all operations
- **Component Analysis**: Results grouped by T-12 component
- **Environment Information**: System and configuration details
- **Compliance Validation**: FIPS, NIST, SOX compliance checks

### Report Formats

1. **Console Output**: Real-time progress and summary
2. **JSON Report**: Detailed machine-readable results
3. **JUnit XML**: CI/CD integration format

Example report location:
```
t12_integration_test_report_20240115_143022.json
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run T-12 Integration Tests
  run: |
    cd backend
    python tests/integration/test_runner.py --verbose
```

### Test Exit Codes

- `0`: All tests passed
- `1`: One or more tests failed
- `2`: Test runner error

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Ensure test database is configured
   - Check database permissions
   - Verify SQLAlchemy configuration

2. **HSM Simulation Issues**:
   - Set `HSM_SIMULATION_MODE=true`
   - Check mock HSM configuration
   - Verify HSM integration imports

3. **Performance Test Failures**:
   - Tests may fail on slow systems
   - Adjust performance thresholds if needed
   - Check system load during testing

4. **Authentication Errors**:
   - Verify mock user configuration
   - Check JWT token generation
   - Validate authentication middleware

### Debug Mode

Run tests with verbose logging:

```bash
python test_runner.py --verbose
export LOG_LEVEL=DEBUG
pytest tests/integration/ -v -s
```

### Test Isolation

Each test uses isolated:
- In-memory database
- Fresh mock objects
- Clean environment variables
- Separate async event loops

## Security Considerations

### Test Safety

- Tests use in-memory databases only
- No real HSM connections in test mode
- Mock credentials and tokens
- Temporary key material (auto-cleanup)
- No network connections to external services

### Test Data

All test data is:
- Generated programmatically
- Non-sensitive dummy data
- Automatically cleaned up
- Isolated between test runs

## Maintenance

### Adding New Tests

1. Follow existing test patterns
2. Use provided fixtures and utilities
3. Include performance validation
4. Add security validation
5. Update this documentation

### Test Dependencies

Keep test dependencies minimal and aligned with production:
- Use same versions as production
- Avoid test-only dependencies when possible
- Document any test-specific requirements

### Performance Monitoring

Regularly review performance thresholds:
- Monitor CI/CD execution times
- Adjust thresholds based on infrastructure
- Track performance trends over time

## Support

For questions or issues with the integration tests:

1. Check this documentation
2. Review test logs and error messages
3. Validate environment setup
4. Check component-specific test files
5. Run validation-only mode first

## Development Guidelines

### Test Development Best Practices

1. **Test Isolation**: Each test should be independent
2. **Clear Naming**: Test names should describe the scenario
3. **Comprehensive Coverage**: Test both happy path and error cases
4. **Performance Aware**: Include timing validation
5. **Security Focused**: Validate security properties
6. **Documentation**: Include docstrings explaining test purpose

### Mock Usage

- Use provided fixtures when possible
- Mock external dependencies (HSM, external APIs)
- Preserve component interfaces in mocks
- Include realistic error scenarios in mocks

### Test Data Management

- Use factory patterns for test data generation
- Parameterize tests for multiple scenarios
- Clean up test data automatically
- Use realistic but non-sensitive data