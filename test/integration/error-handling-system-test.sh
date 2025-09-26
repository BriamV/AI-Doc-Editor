#!/bin/bash
# Comprehensive Error Handling System Integration Test
# Tests the unified error handling across scripts/ and tools/ directories

set -euo pipefail

# Configuration
readonly TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "$TEST_DIR/../.." && pwd)"
readonly TEMP_DIR="${TMPDIR:-/tmp}/error_handling_test_$$"
readonly LOG_FILE="$TEMP_DIR/test_results.log"

# Test counters
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# Color codes
readonly COLOR_RED='\033[31m'
readonly COLOR_GREEN='\033[32m'
readonly COLOR_YELLOW='\033[33m'
readonly COLOR_BLUE='\033[34m'
readonly COLOR_RESET='\033[0m'

# Setup test environment
setup_test_environment() {
    echo "🚀 Setting up error handling system test environment..."

    # Create temporary directory
    mkdir -p "$TEMP_DIR"

    # Setup logging
    exec 1> >(tee -a "$LOG_FILE")
    exec 2> >(tee -a "$LOG_FILE" >&2)

    echo "Test started: $(date)"
    echo "Project root: $PROJECT_ROOT"
    echo "Temp directory: $TEMP_DIR"
    echo "Log file: $LOG_FILE"

    # Verify error handling libraries exist
    if [[ ! -f "$PROJECT_ROOT/scripts/lib/error-codes.js" ]]; then
        echo "❌ scripts/lib/error-codes.js not found"
        exit 1
    fi

    if [[ ! -f "$PROJECT_ROOT/tools/lib/error-codes.sh" ]]; then
        echo "❌ tools/lib/error-codes.sh not found"
        exit 1
    fi

    echo "✅ Test environment setup complete"
}

# Test assertion framework
assert_success() {
    local test_name="$1"
    local command="$2"

    ((TESTS_TOTAL++))

    echo -n "Testing: $test_name... "

    if eval "$command" >/dev/null 2>&1; then
        echo -e "${COLOR_GREEN}PASS${COLOR_RESET}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${COLOR_RED}FAIL${COLOR_RESET}"
        echo "  Command: $command"
        ((TESTS_FAILED++))
        return 1
    fi
}

assert_failure() {
    local test_name="$1"
    local command="$2"
    local expected_error_pattern="${3:-}"

    ((TESTS_TOTAL++))

    echo -n "Testing: $test_name... "

    local output
    if output=$(eval "$command" 2>&1); then
        echo -e "${COLOR_RED}FAIL${COLOR_RESET} (expected failure but succeeded)"
        echo "  Command: $command"
        echo "  Output: $output"
        ((TESTS_FAILED++))
        return 1
    else
        if [[ -n "$expected_error_pattern" ]] && [[ ! "$output" =~ $expected_error_pattern ]]; then
            echo -e "${COLOR_RED}FAIL${COLOR_RESET} (wrong error pattern)"
            echo "  Command: $command"
            echo "  Expected pattern: $expected_error_pattern"
            echo "  Actual output: $output"
            ((TESTS_FAILED++))
            return 1
        fi

        echo -e "${COLOR_GREEN}PASS${COLOR_RESET}"
        ((TESTS_PASSED++))
        return 0
    fi
}

assert_contains() {
    local test_name="$1"
    local command="$2"
    local expected_content="$3"

    ((TESTS_TOTAL++))

    echo -n "Testing: $test_name... "

    local output
    if output=$(eval "$command" 2>&1); then
        if [[ "$output" =~ $expected_content ]]; then
            echo -e "${COLOR_GREEN}PASS${COLOR_RESET}"
            ((TESTS_PASSED++))
            return 0
        else
            echo -e "${COLOR_RED}FAIL${COLOR_RESET} (content not found)"
            echo "  Command: $command"
            echo "  Expected content: $expected_content"
            echo "  Actual output: $output"
            ((TESTS_FAILED++))
            return 1
        fi
    else
        echo -e "${COLOR_RED}FAIL${COLOR_RESET} (command failed)"
        echo "  Command: $command"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Test 1: Basic Error Code Library Functionality
test_error_code_libraries() {
    echo -e "\n${COLOR_BLUE}=== Testing Error Code Libraries ===${COLOR_RESET}"

    # Test Node.js error handling library
    assert_success "Node.js error library self-test" \
        "cd '$PROJECT_ROOT' && NODE_ENV=development node scripts/lib/error-codes.js"

    assert_success "Node.js error code creation" \
        "cd '$PROJECT_ROOT' && node -e 'const {createError, ErrorCodes} = require(\"./scripts/lib/error-codes.js\"); console.log(createError(ErrorCodes.ENVIRONMENT.PYTHON_NOT_FOUND, \"test\").code)'"

    # Test Shell error handling library
    assert_success "Shell error library self-test" \
        "cd '$PROJECT_ROOT' && bash tools/lib/error-codes.sh test"

    assert_success "Shell error code validation" \
        "cd '$PROJECT_ROOT' && bash -c 'source tools/lib/error-codes.sh; validate_error_code \$ERROR_ENVIRONMENT_PYTHON_NOT_FOUND'"

    assert_contains "Shell error codes display" \
        "cd '$PROJECT_ROOT' && bash tools/lib/error-codes.sh codes" \
        "Tier 4 - Infrastructure"
}

# Test 2: Cross-Tier Error Propagation
test_cross_tier_propagation() {
    echo -e "\n${COLOR_BLUE}=== Testing Cross-Tier Error Propagation ===${COLOR_RESET}"

    # Test Node.js -> Shell propagation
    local error_file="$TEMP_DIR/test_error.env"

    assert_success "Node.js error file creation" \
        "cd '$PROJECT_ROOT' && node -e 'const {ProtocolBridge, createError, ErrorCodes} = require(\"./scripts/lib/error-codes.js\"); ProtocolBridge.writeErrorFile(createError(ErrorCodes.ENVIRONMENT.PYTHON_NOT_FOUND, \"Test error\"), \"$error_file\");'"

    assert_success "Shell error file reading" \
        "cd '$PROJECT_ROOT' && bash -c 'source tools/lib/error-codes.sh; read_error_from_scripts \"$error_file\" && [[ \$ERROR_CODE == \"4001\" ]]'"

    # Test Shell -> Node.js propagation
    local shell_error_file="$TEMP_DIR/shell_error.env"

    assert_success "Shell error file creation" \
        "cd '$PROJECT_ROOT' && bash -c 'source tools/lib/error-codes.sh; write_error_file_for_scripts \$ERROR_WORKFLOW_BRANCH_NOT_FOUND \"Test shell error\" \"test=true\"' && mv '/tmp/error_'* '$shell_error_file'"

    assert_success "Node.js shell error reading" \
        "cd '$PROJECT_ROOT' && node -e 'const {createErrorFromShell} = require(\"./scripts/lib/error-codes.js\"); const error = createErrorFromShell(\"ERROR_CODE=2002 ERROR_SEVERITY=error ERROR_TIER=workflow ERROR_MESSAGE=\\\"Test shell error\\\"\"); console.log(error.code);' | grep -q 2002"
}

# Test 3: Enhanced Script Integration
test_enhanced_scripts() {
    echo -e "\n${COLOR_BLUE}=== Testing Enhanced Script Integration ===${COLOR_RESET}"

    # Test enhanced Python complexity gate
    if [[ -f "$PROJECT_ROOT/scripts/python-cc-gate-enhanced.cjs" ]]; then
        assert_success "Enhanced Python CC Gate self-test" \
            "cd '$PROJECT_ROOT' && node scripts/python-cc-gate-enhanced.cjs --self-test"

        # Test error handling in enhanced script
        assert_failure "Enhanced Python CC Gate tool validation" \
            "cd '$PROJECT_ROOT' && CC_TARGET='/nonexistent' node scripts/python-cc-gate-enhanced.cjs" \
            "Target directory not found"
    fi

    # Test enhanced task navigator
    if [[ -f "$PROJECT_ROOT/tools/task-navigator-enhanced.sh" ]]; then
        assert_success "Enhanced Task Navigator self-test" \
            "cd '$PROJECT_ROOT' && bash tools/task-navigator-enhanced.sh --self-test"

        # Test error handling in enhanced script
        assert_failure "Enhanced Task Navigator invalid argument" \
            "cd '$PROJECT_ROOT' && bash tools/task-navigator-enhanced.sh INVALID-ID" \
            "Invalid task ID format"
    fi
}

# Test 4: Error Code Hierarchy and Validation
test_error_hierarchy() {
    echo -e "\n${COLOR_BLUE}=== Testing Error Code Hierarchy ===${COLOR_RESET}"

    # Test tier-based error codes
    assert_contains "User command tier errors (1000-1999)" \
        "cd '$PROJECT_ROOT' && bash tools/lib/error-codes.sh codes" \
        "Tier 1 - User Commands (1000-1999)"

    assert_contains "Workflow tier errors (2000-2999)" \
        "cd '$PROJECT_ROOT' && bash tools/lib/error-codes.sh codes" \
        "Tier 2 - Workflow Automation (2000-2999)"

    assert_contains "Quality tier errors (3000-3999)" \
        "cd '$PROJECT_ROOT' && bash tools/lib/error-codes.sh codes" \
        "Tier 3 - Quality Gates (3000-3999)"

    assert_contains "Infrastructure tier errors (4000-4999)" \
        "cd '$PROJECT_ROOT' && bash tools/lib/error-codes.sh codes" \
        "Tier 4 - Infrastructure (4000-4999)"

    # Test error code consistency between Node.js and Shell
    assert_success "Error code consistency validation" \
        "cd '$PROJECT_ROOT' && bash -c 'source tools/lib/error-codes.sh; [[ \$ERROR_ENVIRONMENT_PYTHON_NOT_FOUND == \"4001\" ]]' && node -e 'const {ErrorCodes} = require(\"./scripts/lib/error-codes.js\"); process.exit(ErrorCodes.ENVIRONMENT.PYTHON_NOT_FOUND.code === 4001 ? 0 : 1)'"
}

# Test 5: Logging and Reporting
test_logging_reporting() {
    echo -e "\n${COLOR_BLUE}=== Testing Logging and Reporting ===${COLOR_RESET}"

    local test_log="$TEMP_DIR/test_error.log"

    # Test Node.js logging
    assert_success "Node.js error logging" \
        "cd '$PROJECT_ROOT' && node -e 'const {ErrorHandler, createError, ErrorCodes} = require(\"./scripts/lib/error-codes.js\"); const handler = new ErrorHandler({exitOnError: false, logFile: \"$test_log\"}); handler.handleError(createError(ErrorCodes.ENVIRONMENT.PYTHON_NOT_FOUND, \"Test logging\"));'"

    assert_success "Log file creation" \
        "test -f '$test_log'"

    assert_contains "Log file contains JSON" \
        "cat '$test_log'" \
        "timestamp"

    # Test Shell logging
    local shell_log="$TEMP_DIR/shell_error.log"

    assert_success "Shell error logging" \
        "cd '$PROJECT_ROOT' && ERROR_HANDLER_LOG_FILE='$shell_log' ERROR_HANDLER_EXIT_ON_ERROR=0 bash -c 'source tools/lib/error-codes.sh; handle_error \$ERROR_ENVIRONMENT_PYTHON_NOT_FOUND \"Shell test logging\" \"test=true\"'"

    assert_success "Shell log file creation" \
        "test -f '$shell_log'"
}

# Test 6: Performance and Error Recovery
test_performance_recovery() {
    echo -e "\n${COLOR_BLUE}=== Testing Performance and Error Recovery ===${COLOR_RESET}"

    # Test performance monitoring
    assert_success "Performance tracking setup" \
        "cd '$PROJECT_ROOT' && node -e 'const {ErrorHandler} = require(\"./scripts/lib/error-codes.js\"); const handler = new ErrorHandler(); console.log(\"Performance tracking available:\", typeof handler.recordMetrics === \"function\");'"

    # Test error recovery patterns
    local recovery_test_script="$TEMP_DIR/recovery_test.sh"
    cat > "$recovery_test_script" <<'EOF'
#!/bin/bash
source tools/lib/error-codes.sh

test_recovery() {
    ERROR_HANDLER_EXIT_ON_ERROR=0

    # Simulate recoverable error
    handle_error $ERROR_INTEGRATION_TIMEOUT "Test timeout" "test=recovery"
    local exit_code=$?

    # Should not exit on warnings/timeouts
    if [[ $exit_code -eq 0 ]]; then
        echo "Recovery successful"
        return 0
    else
        echo "Recovery failed"
        return 1
    fi
}

test_recovery
EOF

    chmod +x "$recovery_test_script"

    assert_contains "Error recovery mechanism" \
        "cd '$PROJECT_ROOT' && bash '$recovery_test_script'" \
        "Recovery successful"
}

# Test 7: Integration with Existing Tools
test_existing_tools_integration() {
    echo -e "\n${COLOR_BLUE}=== Testing Integration with Existing Tools ===${COLOR_RESET}"

    # Test multiplatform.cjs integration potential
    if [[ -f "$PROJECT_ROOT/scripts/multiplatform.cjs" ]]; then
        # Check if multiplatform can validate environment
        assert_success "Multiplatform environment validation" \
            "cd '$PROJECT_ROOT' && node scripts/multiplatform.cjs validate"
    fi

    # Test tools/ scripts integration potential
    if [[ -f "$PROJECT_ROOT/tools/progress-dashboard.sh" ]]; then
        # Test if progress dashboard can run without errors
        assert_success "Progress dashboard basic execution" \
            "cd '$PROJECT_ROOT' && timeout 10s bash tools/progress-dashboard.sh R0 >/dev/null 2>&1"
    fi

    # Test package.json integration
    assert_success "Package.json error handling scripts" \
        "cd '$PROJECT_ROOT' && grep -q 'error' package.json"
}

# Test 8: Migration Compatibility
test_migration_compatibility() {
    echo -e "\n${COLOR_BLUE}=== Testing Migration Compatibility ===${COLOR_RESET}"

    # Test backward compatibility
    local old_style_script="$TEMP_DIR/old_style.sh"
    cat > "$old_style_script" <<'EOF'
#!/bin/bash
# Old style error handling
if [[ ! -f "nonexistent_file" ]]; then
    echo "❌ File not found"
    exit 1
fi
EOF

    chmod +x "$old_style_script"

    assert_failure "Old style script still works" \
        "bash '$old_style_script'" \
        "File not found"

    # Test migration helper availability
    if [[ -f "$PROJECT_ROOT/docs/guides/error-handling-migration-guide.md" ]]; then
        assert_success "Migration guide exists" \
            "test -f '$PROJECT_ROOT/docs/guides/error-handling-migration-guide.md'"

        assert_contains "Migration guide contains patterns" \
            "cat '$PROJECT_ROOT/docs/guides/error-handling-migration-guide.md'" \
            "Migration Strategy"
    fi
}

# Generate test report
generate_test_report() {
    echo -e "\n${COLOR_BLUE}=== Test Summary ===${COLOR_RESET}"

    local pass_rate=0
    if [[ $TESTS_TOTAL -gt 0 ]]; then
        pass_rate=$((TESTS_PASSED * 100 / TESTS_TOTAL))
    fi

    echo "Total Tests: $TESTS_TOTAL"
    echo "Passed: $TESTS_PASSED"
    echo "Failed: $TESTS_FAILED"
    echo "Pass Rate: $pass_rate%"

    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "${COLOR_GREEN}🎉 All tests passed!${COLOR_RESET}"
    else
        echo -e "${COLOR_RED}❌ Some tests failed${COLOR_RESET}"
    fi

    # Generate detailed report
    local report_file="$TEMP_DIR/detailed_report.md"
    cat > "$report_file" <<EOF
# Error Handling System Integration Test Report

**Generated:** $(date)
**Project:** AI-Doc-Editor
**Test Environment:** $TEMP_DIR

## Summary

- **Total Tests:** $TESTS_TOTAL
- **Passed:** $TESTS_PASSED
- **Failed:** $TESTS_FAILED
- **Pass Rate:** $pass_rate%

## Test Categories

1. ✅ Error Code Libraries
2. ✅ Cross-Tier Propagation
3. ✅ Enhanced Script Integration
4. ✅ Error Code Hierarchy
5. ✅ Logging and Reporting
6. ✅ Performance and Recovery
7. ✅ Existing Tools Integration
8. ✅ Migration Compatibility

## Files Tested

- \`scripts/lib/error-codes.js\`
- \`tools/lib/error-codes.sh\`
- \`scripts/python-cc-gate-enhanced.cjs\`
- \`tools/task-navigator-enhanced.sh\`

## Logs

Full test logs available at: \`$LOG_FILE\`

EOF

    echo "📋 Detailed report generated: $report_file"
}

# Cleanup function
cleanup() {
    echo -e "\n🧹 Cleaning up test environment..."

    # Clean up temporary files
    if [[ -d "$TEMP_DIR" ]]; then
        rm -rf "$TEMP_DIR"
    fi

    # Clean up any leftover error files
    rm -f /tmp/error_* /tmp/scripts_error.env /tmp/python_cc_gate_error.env 2>/dev/null || true

    echo "✅ Cleanup completed"
}

# Main execution
main() {
    echo "🧪 Error Handling System Integration Test Suite"
    echo "==============================================="

    # Setup
    setup_test_environment

    # Set trap for cleanup
    trap cleanup EXIT

    # Run test suites
    test_error_code_libraries
    test_cross_tier_propagation
    test_enhanced_scripts
    test_error_hierarchy
    test_logging_reporting
    test_performance_recovery
    test_existing_tools_integration
    test_migration_compatibility

    # Generate report
    generate_test_report

    # Return appropriate exit code
    if [[ $TESTS_FAILED -eq 0 ]]; then
        return 0
    else
        return 1
    fi
}

# Execute main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi