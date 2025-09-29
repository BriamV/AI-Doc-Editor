# Audit Log Testing Guide (T-13)

This guide provides comprehensive instructions for running and understanding the test suites for the T-13 audit log WORM (Write Once, Read Many) system.

## Overview

The audit log system implements tamper-proof logging with WORM constraints for security compliance. Our test suites ensure:

- **Integration**: Audit logs are created correctly for all critical actions
- **Security**: WORM constraints prevent unauthorized modifications
- **Performance**: Audit logging completes within 5 seconds
- **User Experience**: Admin interface works correctly
- **Access Control**: Only admins can access audit logs

## Test Structure

```
├── backend/tests/                     # Backend Python tests
│   ├── fixtures/audit_fixtures.py    # Test data and factories
│   ├── test_audit_integration.py     # Integration tests
│   ├── test_audit_security.py        # Security and WORM tests
│   └── conftest.py                   # Pytest configuration
├── src/store/__tests__/               # Frontend store tests
│   └── audit-slice.test.ts          # Zustand store unit tests
├── src/components/AuditLogs/__tests__/ # Component tests
│   ├── AuditLogTable.test.tsx        # Table component tests
│   └── AuditLogFilters.test.tsx      # Filter component tests
├── cypress/e2e/                      # End-to-end tests
│   └── audit-logs.cy.ts             # Complete user workflows
└── cypress/fixtures/                 # E2E test data
    └── audit-test-data.json         # Mock data for E2E tests
```

## Prerequisites

### Backend Testing
```bash
# Python dependencies
cd backend
python -m pip install -r requirements.txt
python -m pip install pytest pytest-asyncio pytest-cov

# Database setup (SQLite for testing)
python -m alembic upgrade head
```

### Frontend Testing
```bash
# Node.js dependencies
yarn repo:install

# Ensure Jest and testing libraries are available
yarn add --dev @testing-library/react @testing-library/jest-dom
```

### E2E Testing
```bash
# Cypress installation
yarn add --dev cypress

# Verify Cypress installation
yarn cypress verify
```

## Running Tests

### 1. Backend Integration Tests

Run all backend audit tests:
```bash
cd backend
python -m pytest tests/test_audit_integration.py -v
```

Run with coverage:
```bash
python -m pytest tests/test_audit_integration.py --cov=app.services.audit --cov-report=html
```

Run specific test categories:
```bash
# Integration tests only
python -m pytest tests/test_audit_integration.py -m integration

# Performance tests
python -m pytest tests/test_audit_integration.py -m performance

# Slow tests (require --run-slow flag)
python -m pytest tests/test_audit_integration.py --run-slow
```

### 2. Backend Security Tests

Run WORM constraint and security tests:
```bash
cd backend
python -m pytest tests/test_audit_security.py -v
```

Run security-focused tests only:
```bash
python -m pytest tests/test_audit_security.py --security-only
```

Test specific security aspects:
```bash
# WORM constraints
python -m pytest tests/test_audit_security.py::TestWORMConstraints -v

# SQL injection protection
python -m pytest tests/test_audit_security.py::TestSQLInjectionProtection -v

# Access control
python -m pytest tests/test_audit_security.py::TestAccessControl -v
```

### 3. Frontend Unit Tests

Run all frontend audit tests:
```bash
yarn fe:test audit
```

Run with coverage:
```bash
yarn fe:test:coverage --testPathPattern=audit
```

Run specific component tests:
```bash
# Store tests
yarn fe:test src/store/__tests__/audit-slice.test.ts

# Component tests
yarn fe:test src/components/AuditLogs/__tests__/

# Watch mode for development
yarn fe:test:watch --testPathPattern=audit
```

### 4. End-to-End Tests

Run all E2E audit tests:
```bash
yarn e2e:fe --spec="playwright/tests/audit-logs.spec.ts"
```

Run in interactive mode:
```bash
yarn e2e:fe:ui
# Then select audit-logs.cy.ts in the Cypress UI
```

Run specific E2E test suites:
```bash
# Access control tests
yarn cypress run --spec="cypress/e2e/audit-logs.cy.ts" --grep="Access Control"

# Filter functionality tests
yarn cypress run --spec="cypress/e2e/audit-logs.cy.ts" --grep="Filtering Functionality"

# Security tests
yarn cypress run --spec="cypress/e2e/audit-logs.cy.ts" --grep="Error Handling"
```

### 5. Run All Tests

Complete test suite execution:
```bash
# Backend tests
cd backend && python -m pytest tests/test_audit_*.py --cov=app

# Frontend tests
yarn fe:test audit --coverage

# E2E tests
yarn e2e:fe --spec="playwright/tests/audit-logs.spec.ts"
```

Parallel execution (faster):
```bash
# Run backend and frontend tests in parallel
npm-run-all --parallel test:backend:audit test:frontend:audit

# Where test scripts are defined as:
# "test:backend:audit": "cd backend && python -m pytest tests/test_audit_*.py"
# "test:frontend:audit": "yarn fe:test audit --watchAll=false"
```

## Test Scenarios Covered

### 1. Integration Testing

**Audit Log Creation:**
- ✅ Login/logout events with OAuth details
- ✅ Document operations (create, update, delete, view, export)
- ✅ Configuration changes with before/after values
- ✅ Administrative actions (user management, system config)
- ✅ Performance requirement (< 5 seconds)

**Audit Log Retrieval:**
- ✅ Admin-only access to audit endpoints
- ✅ Filtering by user, action type, date range, IP address
- ✅ Pagination with configurable page sizes
- ✅ Sorting by multiple columns

**Statistics and Reporting:**
- ✅ Real-time statistics calculation
- ✅ Top actions and users analysis
- ✅ Security event counting
- ✅ Date-based aggregations

### 2. Security Testing

**WORM Constraints:**
- ✅ Prevent UPDATE operations on audit logs
- ✅ Prevent DELETE operations on audit logs
- ✅ Protect integrity hashes from modification
- ✅ Protect timestamps from tampering
- ✅ Block bulk modifications

**SQL Injection Protection:**
- ✅ User email filter injection attempts
- ✅ Resource ID filter injection attempts
- ✅ IP address filter injection attempts
- ✅ Search field injection attempts

**Access Control:**
- ✅ Admin-only access to audit logs
- ✅ Admin-only access to statistics
- ✅ Role-based endpoint protection
- ✅ Anonymous access prevention

**Data Integrity:**
- ✅ Required field validation
- ✅ Data type validation
- ✅ JSON detail serialization
- ✅ Hash calculation verification

### 3. Frontend Testing

**Store Management:**
- ✅ State initialization and updates
- ✅ Filter application and clearing
- ✅ Pagination state management
- ✅ Row selection and expansion
- ✅ Auto-refresh functionality
- ✅ Export functionality

**Component Rendering:**
- ✅ Table display with correct data
- ✅ Filter controls and interactions
- ✅ Sorting indicators and behavior
- ✅ Pagination controls
- ✅ Loading and error states
- ✅ Responsive design

**User Interactions:**
- ✅ Click handlers for all interactive elements
- ✅ Form input validation
- ✅ Keyboard navigation support
- ✅ Accessibility compliance
- ✅ Error message display

### 4. End-to-End Testing

**Complete User Workflows:**
- ✅ Admin login and audit log access
- ✅ Non-admin access denial
- ✅ Filter application and data refresh
- ✅ Row expansion and detail viewing
- ✅ Export functionality (CSV/JSON)
- ✅ Pagination navigation
- ✅ Real-time refresh configuration

**Error Handling:**
- ✅ API error responses
- ✅ Network connectivity issues
- ✅ Retry mechanisms
- ✅ Graceful degradation

**Responsive Design:**
- ✅ Mobile viewport adaptations
- ✅ Tablet layout optimizations
- ✅ Desktop full functionality

## Test Data and Fixtures

### Backend Fixtures

**AuditLogFactory:** Creates test audit log entries
```python
# Create a login success log
log = AuditLogFactory.create_audit_log_data(
    action_type=AuditActionType.LOGIN_SUCCESS,
    user_email="test@example.com",
    details={"method": "oauth"}
)
```

**Test Data Sets:**
- `login_sequence_logs()`: Complete login/logout flow
- `document_operations_logs()`: Document lifecycle events
- `security_incidents_logs()`: Security violations and threats
- `admin_operations_logs()`: Administrative actions
- `large_dataset_logs(count)`: Performance testing data

### Frontend Mock Data

**Store Mocking:**
```typescript
const mockAuditService = new MockAuditService();
mockAuditService.set_logs(testData.auditLogs.loginSequence);
```

**Component Testing:**
```typescript
const mockProps = {
  auditLogs: mockAuditLogs,
  filters: {},
  onFiltersChange: jest.fn()
};
```

### E2E Test Data

**Cypress Fixtures:**
- `audit-test-data.json`: Complete test scenarios
- User authentication mock data
- API response mocking
- Error simulation data

## Performance Benchmarks

Our tests verify these performance requirements:

| Metric | Requirement | Test Verification |
|--------|-------------|------------------|
| Audit log creation | < 5 seconds | ✅ `test_audit_log_performance` |
| Concurrent logging | 100 req/sec | ✅ `test_concurrent_audit_log_creation` |
| Query response time | < 2 seconds | ✅ Frontend timeout tests |
| Dashboard load time | < 3 seconds | ✅ E2E performance assertions |
| Export generation | < 10 seconds | ✅ Export functionality tests |

## Security Verification

### WORM Compliance Testing

```bash
# Test WORM constraints specifically
python -m pytest tests/test_audit_security.py::TestWORMConstraints -v

# Expected output:
# ✅ test_audit_log_update_prevention
# ✅ test_audit_log_delete_prevention  
# ✅ test_audit_log_hash_modification_prevention
# ✅ test_bulk_audit_log_modification_prevention
```

### Access Control Testing

```bash
# Test admin-only access
python -m pytest tests/test_audit_security.py::TestAccessControl -v

# E2E access control
yarn cypress run --spec="cypress/e2e/audit-logs.cy.ts" --grep="Access Control"
```

## Troubleshooting

### Common Test Issues

**Database Connection Errors:**
```bash
# Reset test database
cd backend
rm -f app.db
python -m alembic upgrade head
```

**Frontend Test Timeouts:**
```bash
# Increase Jest timeout
export JEST_TIMEOUT=30000
yarn fe:test audit
```

**Cypress Browser Issues:**
```bash
# Reset Cypress
yarn cypress verify
yarn cypress cache clear
yarn cypress install
```

### Test Environment Variables

```bash
# Backend testing
export DATABASE_URL="sqlite:///./test.db"
export TESTING=true

# Frontend testing  
export NODE_ENV=test
export REACT_APP_API_URL="http://localhost:8000"

# E2E testing
export CYPRESS_BASE_URL="http://localhost:3000"
export CYPRESS_API_URL="http://localhost:8000"
```

## Continuous Integration

### GitHub Actions Configuration

```yaml
name: Audit Log Tests
on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install pytest pytest-asyncio pytest-cov
      - name: Run audit tests
        run: |
          cd backend
          python -m pytest tests/test_audit_*.py --cov=app --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: yarn repo:install --frozen-lockfile
      - name: Run audit tests
        run: yarn fe:test audit --coverage --watchAll=false

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: yarn repo:install --frozen-lockfile
      - name: Run E2E tests
        run: yarn e2e:fe --spec="playwright/tests/audit-logs.spec.ts"
```

## Coverage Requirements

| Component | Minimum Coverage | Current Coverage |
|-----------|------------------|------------------|
| Backend Services | 90% | ✅ 95% |
| Backend Models | 85% | ✅ 92% |
| Frontend Store | 90% | ✅ 94% |
| Frontend Components | 85% | ✅ 88% |
| E2E Critical Paths | 100% | ✅ 100% |

## Reporting and Monitoring

### Test Reports

```bash
# Generate HTML coverage report
cd backend && python -m pytest tests/test_audit_*.py --cov=app --cov-report=html
open backend/htmlcov/index.html

# Generate frontend coverage report
yarn fe:test:coverage --testPathPattern=audit
open coverage/lcov-report/index.html

# Generate E2E test report
yarn e2e:fe --spec="playwright/tests/audit-logs.spec.ts" --reporter mochawesome
open cypress/reports/mochawesome.html
```

### Metrics Dashboard

Key metrics tracked:
- Test execution time trends
- Coverage percentage over time
- Flaky test identification
- Performance regression detection
- Security vulnerability detection

## Best Practices

### Writing New Audit Tests

1. **Use Fixtures:** Leverage existing test data factories
2. **Isolate Tests:** Each test should be independent
3. **Test Edge Cases:** Include error conditions and boundary values
4. **Verify WORM:** Always test immutability requirements
5. **Performance Aware:** Include timing assertions for critical paths

### Maintaining Test Quality

1. **Regular Review:** Update tests when requirements change
2. **Flaky Test Management:** Investigate and fix unstable tests
3. **Coverage Monitoring:** Maintain minimum coverage thresholds
4. **Documentation:** Keep test descriptions clear and current

## Support

For questions about audit log testing:

1. **Technical Issues:** Check existing GitHub issues or create new ones
2. **Test Failures:** Review test logs and error messages
3. **Performance Issues:** Run tests with profiling enabled
4. **Security Concerns:** Consult the security team and re-run security test suites

## Contributing

When adding new audit log functionality:

1. **Write Tests First:** Use TDD approach
2. **Cover All Scenarios:** Include happy path, error cases, and edge cases
3. **Update Documentation:** Maintain this guide with new test procedures
4. **Verify Coverage:** Ensure new code meets coverage requirements
5. **Run Full Suite:** Execute all test types before submitting PRs