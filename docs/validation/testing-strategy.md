# Document Placement Validation - Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for the document placement validation system to ensure it prevents future organizational failures and maintains repository structure integrity.

## Testing Pyramid

### 1. Unit Tests (Base Layer)

**Purpose**: Test individual validation functions in isolation

**Test Framework**: Bash unit testing with assertions

**Coverage Areas**:
- Document classification logic
- Expected location calculation
- Violation detection algorithms
- File pattern matching
- Conway's Law compliance checks

**Example Unit Tests**:
```bash
#!/bin/bash
# tests/unit/test-validation-functions.sh

source tools/validate-document-placement.sh

test_classify_migration_document() {
  local result=$(classify_document "MIGRATION-SUCCESS-REPORT.md")
  assertEquals "migration_artifact:project_management" "$result"
  echo "✅ Migration document classification test passed"
}

test_classify_template_document() {
  local result=$(classify_document "TEMPLATE-EXAMPLE.md")
  assertEquals "template:developers" "$result"
  echo "✅ Template document classification test passed"
}

test_get_expected_location_migration() {
  local result=$(get_expected_location "TESTING-REPORT.md" "migration_artifact:project_management")
  assertEquals "docs/project-management/migrations/testing/" "$result"
  echo "✅ Expected location calculation test passed"
}

test_get_expected_location_implementation() {
  local result=$(get_expected_location "API-GUIDE.md" "implementation:backend_developers")
  assertEquals "backend/docs/" "$result"
  echo "✅ Implementation doc location test passed"
}

test_validate_conways_law() {
  # Create test structure
  mkdir -p temp_test/src/components
  echo "# Component Guide" > temp_test/src/components/COMPONENT-GUIDE.md

  # Test proximity validation
  local result=$(validate_file_proximity "temp_test/src/components/COMPONENT-GUIDE.md")
  assertTrue "Conway's Law compliance check" "$result"

  # Cleanup
  rm -rf temp_test
  echo "✅ Conway's Law validation test passed"
}

run_unit_tests() {
  echo "Running unit tests..."
  test_classify_migration_document
  test_classify_template_document
  test_get_expected_location_migration
  test_get_expected_location_implementation
  test_validate_conways_law
  echo "All unit tests completed ✅"
}
```

### 2. Integration Tests (Middle Layer)

**Purpose**: Test validation script integration with file system and git

**Test Framework**: Bash integration testing with temporary repositories

**Coverage Areas**:
- Full validation workflow execution
- Git integration and file detection
- Auto-fix functionality
- Report generation
- Performance under different file structures

**Example Integration Tests**:
```bash
#!/bin/bash
# tests/integration/test-validation-integration.sh

setup_test_repo() {
  local test_dir="$1"
  mkdir -p "$test_dir"
  cd "$test_dir"
  git init --quiet

  # Create proper directory structure
  mkdir -p docs/project-management/migrations
  mkdir -p docs/templates
  mkdir -p src/docs
  mkdir -p backend/docs

  # Create test files in wrong locations
  echo "# Migration Report" > MIGRATION-SUCCESS-REPORT.md
  echo "# Testing Summary" > TESTING-SUMMARY-DELIVERABLES.md
  echo "# Template Guide" > TEMPLATE-EXAMPLE.md

  git add . && git commit -m "Initial test setup" --quiet
}

test_full_validation_workflow() {
  local test_dir="/tmp/validation-test-$$"
  setup_test_repo "$test_dir"

  # Run validation - should detect violations
  if bash tools/validate-document-placement.sh --strict; then
    fail "Validation should have detected misplaced files"
  fi

  # Run auto-fix
  bash tools/validate-document-placement.sh --fix

  # Run validation again - should pass
  if ! bash tools/validate-document-placement.sh --strict; then
    fail "Validation should pass after auto-fix"
  fi

  # Verify files moved to correct locations
  test -f docs/project-management/migrations/reports/MIGRATION-SUCCESS-REPORT.md || fail "Migration report not moved correctly"
  test -f docs/templates/TEMPLATE-EXAMPLE.md || fail "Template not moved correctly"

  # Cleanup
  cd / && rm -rf "$test_dir"
  echo "✅ Full validation workflow test passed"
}

test_git_integration() {
  local test_dir="/tmp/git-integration-test-$$"
  setup_test_repo "$test_dir"

  # Create new misplaced file
  echo "# New Migration" > NEW-MIGRATION.md

  # Test that validation detects new files
  local violations=$(bash tools/validate-document-placement.sh 2>&1 | grep -c "violation")
  test "$violations" -gt 0 || fail "Should detect new misplaced files"

  # Cleanup
  cd / && rm -rf "$test_dir"
  echo "✅ Git integration test passed"
}

test_performance_with_large_repo() {
  local test_dir="/tmp/performance-test-$$"
  setup_test_repo "$test_dir"

  # Create many files
  for i in {1..100}; do
    echo "# Doc $i" > "DOC-$i.md"
  done

  # Test performance (should complete within 10 seconds)
  local start_time=$(date +%s)
  bash tools/validate-document-placement.sh --report >/dev/null
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))

  test "$duration" -lt 10 || fail "Validation took too long: ${duration}s"

  # Cleanup
  cd / && rm -rf "$test_dir"
  echo "✅ Performance test passed"
}

run_integration_tests() {
  echo "Running integration tests..."
  test_full_validation_workflow
  test_git_integration
  test_performance_with_large_repo
  echo "All integration tests completed ✅"
}
```

### 3. End-to-End Tests (Top Layer)

**Purpose**: Test complete developer workflows including validation

**Test Framework**: Bash E2E testing with real repository simulation

**Coverage Areas**:
- Pre-commit hook integration
- Quality gate integration
- CI/CD pipeline integration
- Developer command workflows
- Error handling and recovery

**Example E2E Tests**:
```bash
#!/bin/bash
# tests/e2e/test-validation-e2e.sh

test_developer_workflow() {
  local test_dir="/tmp/e2e-dev-workflow-$$"
  setup_test_repo "$test_dir"

  echo "Testing complete developer workflow..."

  # 1. Developer creates misplaced document
  echo "# New Feature Doc" > FEATURE-GUIDE.md

  # 2. Developer runs validation check
  local validation_output=$(bash tools/validate-document-placement.sh 2>&1)
  echo "$validation_output" | grep -q "violation" || fail "Should detect violation"

  # 3. Developer uses auto-fix
  bash tools/validate-document-placement.sh --fix

  # 4. Developer verifies fix
  bash tools/validate-document-placement.sh --strict || fail "Should pass after fix"

  # 5. Developer generates report
  bash tools/validate-document-placement.sh --report
  test -f "DOCUMENT-PLACEMENT-VALIDATION-REPORT.md" || fail "Report not generated"

  # Cleanup
  cd / && rm -rf "$test_dir"
  echo "✅ Developer workflow E2E test passed"
}

test_ci_cd_integration() {
  local test_dir="/tmp/e2e-ci-cd-$$"
  setup_test_repo "$test_dir"

  echo "Testing CI/CD integration..."

  # Simulate CI/CD environment
  export CI=true

  # Create misplaced files
  echo "# Release Notes" > RELEASE-NOTES.md

  # Test strict validation (should fail in CI)
  if bash tools/validate-document-placement.sh --strict; then
    fail "CI validation should fail with misplaced files"
  fi

  # Fix issues
  bash tools/validate-document-placement.sh --fix

  # Test validation passes
  bash tools/validate-document-placement.sh --strict || fail "CI validation should pass after fix"

  unset CI
  # Cleanup
  cd / && rm -rf "$test_dir"
  echo "✅ CI/CD integration E2E test passed"
}

test_error_recovery() {
  local test_dir="/tmp/e2e-error-recovery-$$"
  setup_test_repo "$test_dir"

  echo "Testing error recovery scenarios..."

  # Test missing validation script
  mv tools/validate-document-placement.sh tools/validate-document-placement.sh.backup

  # Should handle missing script gracefully
  local output=$(bash -c "bash tools/validate-document-placement.sh 2>&1 || echo 'HANDLED'" | tail -1)
  test "$output" = "HANDLED" || fail "Should handle missing script"

  # Restore script
  mv tools/validate-document-placement.sh.backup tools/validate-document-placement.sh

  # Test permission issues
  chmod 000 tools/validate-document-placement.sh
  local output=$(bash -c "bash tools/validate-document-placement.sh 2>&1 || echo 'PERMISSION_ERROR'" | tail -1)
  echo "$output" | grep -q "Permission\|PERMISSION_ERROR" || fail "Should handle permission errors"

  # Restore permissions
  chmod 755 tools/validate-document-placement.sh

  # Cleanup
  cd / && rm -rf "$test_dir"
  echo "✅ Error recovery E2E test passed"
}

run_e2e_tests() {
  echo "Running E2E tests..."
  test_developer_workflow
  test_ci_cd_integration
  test_error_recovery
  echo "All E2E tests completed ✅"
}
```

## Test Data Management

### Test File Creation
```bash
create_test_migration_files() {
  local base_dir="$1"
  cat > "$base_dir/COMPREHENSIVE-MIGRATION-SUCCESS-REPORT.md" <<EOF
# Comprehensive Migration Success Report

This document contains migration results and should be in docs/project-management/migrations/reports/
EOF

  cat > "$base_dir/DUAL-SYSTEM-TESTING-REPORT.md" <<EOF
# Dual System Testing Report

This document contains testing results and should be in docs/project-management/migrations/testing/
EOF

  cat > "$base_dir/MIGRATION-SUCCESS-DASHBOARD.md" <<EOF
# Migration Success Dashboard

This document contains dashboard information and should be in docs/project-management/migrations/reports/
EOF
}

create_test_template_files() {
  local base_dir="$1"
  cat > "$base_dir/PROJECT-STATUS-TEMPLATE.md" <<EOF
# Project Status Template

This template should be in docs/templates/
EOF
}

create_test_implementation_files() {
  local base_dir="$1"
  mkdir -p "$base_dir/src/misplaced"
  cat > "$base_dir/src/misplaced/COMPONENT-GUIDE.md" <<EOF
# Component Implementation Guide

This implementation doc should be in src/docs/ (closer to code)
EOF
}
```

### Test Scenarios

**Scenario 1: Migration Files Misplacement (Historical)**
- Recreate the original issue with 5 files in root
- Test detection and auto-fix
- Verify correct placement in docs/project-management/migrations/

**Scenario 2: Conway's Law Violations**
- Place implementation docs away from code
- Test proximity detection
- Verify relocation suggestions

**Scenario 3: Template Misplacement**
- Place templates in wrong directories
- Test template detection
- Verify movement to docs/templates/

**Scenario 4: Mixed Violations**
- Multiple violation types simultaneously
- Test comprehensive detection
- Verify all violations addressed

## Automated Test Execution

### Test Runner Script
```bash
#!/bin/bash
# tests/run-all-tests.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Test utilities
fail() {
  echo "❌ FAIL: $1" >&2
  exit 1
}

assertTrue() {
  local message="$1"
  local condition="$2"
  if [[ "$condition" != "true" ]]; then
    fail "$message"
  fi
}

assertEquals() {
  local expected="$1"
  local actual="$2"
  if [[ "$expected" != "$actual" ]]; then
    fail "Expected '$expected', got '$actual'"
  fi
}

# Run all test suites
echo "🧪 Starting Document Placement Validation Tests"
echo "================================================"

# Unit tests
echo "📋 Running Unit Tests..."
source tests/unit/test-validation-functions.sh
run_unit_tests

echo ""

# Integration tests
echo "🔧 Running Integration Tests..."
source tests/integration/test-validation-integration.sh
run_integration_tests

echo ""

# E2E tests
echo "🚀 Running E2E Tests..."
source tests/e2e/test-validation-e2e.sh
run_e2e_tests

echo ""
echo "🎉 All tests passed! Document validation system is working correctly."
```

### Continuous Integration Integration
```yaml
# .github/workflows/document-validation-tests.yml
name: Document Validation Tests

on:
  push:
    paths:
      - 'tools/validate-document-placement.sh'
      - 'docs/validation/**'
      - 'tests/**'
  pull_request:
    paths:
      - 'tools/validate-document-placement.sh'
      - 'docs/validation/**'
      - 'tests/**'

jobs:
  test-validation-system:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Test Environment
        run: |
          chmod +x tools/validate-document-placement.sh
          chmod +x tests/run-all-tests.sh

      - name: Run Validation System Tests
        run: |
          bash tests/run-all-tests.sh

      - name: Test Real Repository Validation
        run: |
          bash tools/validate-document-placement.sh --report

      - name: Upload Test Results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: validation-test-results
          path: |
            DOCUMENT-PLACEMENT-VALIDATION-REPORT.md
            tests/logs/
```

## Performance Testing

### Load Testing
```bash
test_validation_performance() {
  local test_dir="/tmp/performance-load-test-$$"
  mkdir -p "$test_dir"
  cd "$test_dir"

  # Create large number of files
  for i in {1..1000}; do
    mkdir -p "dir$i"
    echo "# Document $i" > "dir$i/DOC-$i.md"
  done

  # Test performance
  local start_time=$(date +%s)
  timeout 30s bash "$PROJECT_ROOT/tools/validate-document-placement.sh" --report
  local exit_code=$?
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))

  # Should complete within timeout
  test $exit_code -eq 0 || fail "Validation timed out with 1000 files"

  # Should be reasonably fast
  test $duration -lt 25 || fail "Performance test took too long: ${duration}s"

  cd / && rm -rf "$test_dir"
  echo "✅ Performance load test passed (${duration}s for 1000 files)"
}
```

### Memory Usage Testing
```bash
test_memory_usage() {
  local test_dir="/tmp/memory-test-$$"
  setup_large_test_repo "$test_dir" 500

  # Monitor memory usage during validation
  local pid
  bash "$PROJECT_ROOT/tools/validate-document-placement.sh" --report &
  pid=$!

  local max_memory=0
  while kill -0 $pid 2>/dev/null; do
    local current_memory=$(ps -o vsz= -p $pid 2>/dev/null | tr -d ' ')
    if [[ $current_memory -gt $max_memory ]]; then
      max_memory=$current_memory
    fi
    sleep 0.1
  done

  wait $pid

  # Should use less than 50MB
  local max_mb=$((max_memory / 1024))
  test $max_mb -lt 50 || fail "Memory usage too high: ${max_mb}MB"

  cd / && rm -rf "$test_dir"
  echo "✅ Memory usage test passed (${max_mb}MB max)"
}
```

## Quality Metrics

### Test Coverage Requirements
- **Unit Tests**: 90%+ function coverage
- **Integration Tests**: 85%+ workflow coverage
- **E2E Tests**: 80%+ user scenario coverage

### Performance Benchmarks
- **Small repos** (<50 files): <2 seconds
- **Medium repos** (50-500 files): <8 seconds
- **Large repos** (500+ files): <30 seconds
- **Memory usage**: <50MB peak

### Reliability Targets
- **Test success rate**: 99%+ in CI/CD
- **False positive rate**: <1%
- **False negative rate**: <0.1%
- **Recovery rate**: 95%+ auto-fixable violations

This comprehensive testing strategy ensures the document placement validation system is robust, performant, and reliable in preventing future organizational failures.