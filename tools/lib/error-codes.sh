#!/bin/bash
# Unified Error Handling Library for tools/ (.sh) Shell Environment
#
# Provides standardized error codes, handling, and reporting mechanisms
# that integrate with the 4-tier architecture and interface contracts.
#
# Usage:
#   source tools/lib/error-codes.sh
#
#   # Basic usage
#   error_exit $ERROR_ENVIRONMENT_PYTHON_NOT_FOUND "Python executable not found in venv"
#
#   # With error handler
#   handle_error $ERROR_WORKFLOW_MERGE_VALIDATION_FAILED "Merge validation failed" "task_id=T-01"

# ================================================================================
# ERROR CODE DEFINITIONS - 4-Tier Architecture Aligned
# ================================================================================

# Hierarchical error codes following 4-tier architecture:
# Tier 1: User Commands (1000-1999)
# Tier 2: Workflow Automation (2000-2999)
# Tier 3: Quality Gates (3000-3999)
# Tier 4: Infrastructure (4000-4999)

# ============================================================================
# TIER 1: USER COMMANDS (1000-1999)
# ============================================================================
readonly ERROR_USER_INVALID_ARGUMENTS=1001
readonly ERROR_USER_MISSING_REQUIRED_PARAM=1002
readonly ERROR_USER_INVALID_COMMAND=1003
readonly ERROR_USER_PERMISSION_DENIED=1004
readonly ERROR_USER_CONFIGURATION_ERROR=1005

# ============================================================================
# TIER 2: WORKFLOW AUTOMATION (2000-2999)
# ============================================================================
readonly ERROR_WORKFLOW_MERGE_VALIDATION_FAILED=2001
readonly ERROR_WORKFLOW_BRANCH_NOT_FOUND=2002
readonly ERROR_WORKFLOW_FILE_COUNT_MISMATCH=2003
readonly ERROR_WORKFLOW_CRITICAL_FILES_MISSING=2004
readonly ERROR_WORKFLOW_CONFIG_INTEGRITY_FAILURE=2005
readonly ERROR_WORKFLOW_WORKING_TREE_DIRTY=2006
readonly ERROR_WORKFLOW_DEVELOPMENT_STATUS_INCONSISTENT=2007

# ============================================================================
# TIER 3: QUALITY GATES (3000-3999)
# ============================================================================
readonly ERROR_QUALITY_COMPLEXITY_THRESHOLD_EXCEEDED=3001
readonly ERROR_QUALITY_LINT_VIOLATIONS=3002
readonly ERROR_QUALITY_FORMAT_VIOLATIONS=3003
readonly ERROR_QUALITY_SECURITY_VULNERABILITY=3004
readonly ERROR_QUALITY_TEST_FAILURES=3005
readonly ERROR_QUALITY_COVERAGE_INSUFFICIENT=3006
readonly ERROR_QUALITY_DEPENDENCY_OUTDATED=3007

# ============================================================================
# TIER 4: INFRASTRUCTURE (4000-4999)
# ============================================================================
readonly ERROR_ENVIRONMENT_PYTHON_NOT_FOUND=4001
readonly ERROR_ENVIRONMENT_VENV_NOT_FOUND=4002
readonly ERROR_ENVIRONMENT_TOOL_NOT_AVAILABLE=4003
readonly ERROR_ENVIRONMENT_PLATFORM_NOT_SUPPORTED=4004
readonly ERROR_ENVIRONMENT_PATH_RESOLUTION_FAILED=4005
readonly ERROR_ENVIRONMENT_COMMAND_EXECUTION_FAILED=4006
readonly ERROR_ENVIRONMENT_FILE_SYSTEM_ERROR=4007
readonly ERROR_ENVIRONMENT_NETWORK_ERROR=4008

# ============================================================================
# CROSS-TIER INTEGRATION (5000-5999)
# ============================================================================
readonly ERROR_INTEGRATION_INTERFACE_CONTRACT_VIOLATION=5001
readonly ERROR_INTEGRATION_DATA_SYNC_FAILURE=5002
readonly ERROR_INTEGRATION_PROTOCOL_MISMATCH=5003
readonly ERROR_INTEGRATION_TIMEOUT=5004
readonly ERROR_INTEGRATION_RESOURCE_EXHAUSTED=5005

# ================================================================================
# ERROR SEVERITY AND TIER MAPPINGS
# ================================================================================

# Error severity mapping
declare -A ERROR_SEVERITY_MAP=(
    # Tier 1 - User Commands
    [$ERROR_USER_INVALID_ARGUMENTS]="error"
    [$ERROR_USER_MISSING_REQUIRED_PARAM]="error"
    [$ERROR_USER_INVALID_COMMAND]="error"
    [$ERROR_USER_PERMISSION_DENIED]="error"
    [$ERROR_USER_CONFIGURATION_ERROR]="error"

    # Tier 2 - Workflow Automation
    [$ERROR_WORKFLOW_MERGE_VALIDATION_FAILED]="error"
    [$ERROR_WORKFLOW_BRANCH_NOT_FOUND]="error"
    [$ERROR_WORKFLOW_FILE_COUNT_MISMATCH]="warning"
    [$ERROR_WORKFLOW_CRITICAL_FILES_MISSING]="error"
    [$ERROR_WORKFLOW_CONFIG_INTEGRITY_FAILURE]="error"
    [$ERROR_WORKFLOW_WORKING_TREE_DIRTY]="warning"
    [$ERROR_WORKFLOW_DEVELOPMENT_STATUS_INCONSISTENT]="warning"

    # Tier 3 - Quality Gates
    [$ERROR_QUALITY_COMPLEXITY_THRESHOLD_EXCEEDED]="error"
    [$ERROR_QUALITY_LINT_VIOLATIONS]="warning"
    [$ERROR_QUALITY_FORMAT_VIOLATIONS]="info"
    [$ERROR_QUALITY_SECURITY_VULNERABILITY]="error"
    [$ERROR_QUALITY_TEST_FAILURES]="error"
    [$ERROR_QUALITY_COVERAGE_INSUFFICIENT]="warning"
    [$ERROR_QUALITY_DEPENDENCY_OUTDATED]="info"

    # Tier 4 - Infrastructure
    [$ERROR_ENVIRONMENT_PYTHON_NOT_FOUND]="error"
    [$ERROR_ENVIRONMENT_VENV_NOT_FOUND]="error"
    [$ERROR_ENVIRONMENT_TOOL_NOT_AVAILABLE]="error"
    [$ERROR_ENVIRONMENT_PLATFORM_NOT_SUPPORTED]="error"
    [$ERROR_ENVIRONMENT_PATH_RESOLUTION_FAILED]="error"
    [$ERROR_ENVIRONMENT_COMMAND_EXECUTION_FAILED]="error"
    [$ERROR_ENVIRONMENT_FILE_SYSTEM_ERROR]="error"
    [$ERROR_ENVIRONMENT_NETWORK_ERROR]="error"

    # Cross-tier Integration
    [$ERROR_INTEGRATION_INTERFACE_CONTRACT_VIOLATION]="error"
    [$ERROR_INTEGRATION_DATA_SYNC_FAILURE]="error"
    [$ERROR_INTEGRATION_PROTOCOL_MISMATCH]="error"
    [$ERROR_INTEGRATION_TIMEOUT]="warning"
    [$ERROR_INTEGRATION_RESOURCE_EXHAUSTED]="error"
)

# Error tier mapping
declare -A ERROR_TIER_MAP=(
    # Tier 1 - User Commands
    [$ERROR_USER_INVALID_ARGUMENTS]="user"
    [$ERROR_USER_MISSING_REQUIRED_PARAM]="user"
    [$ERROR_USER_INVALID_COMMAND]="user"
    [$ERROR_USER_PERMISSION_DENIED]="user"
    [$ERROR_USER_CONFIGURATION_ERROR]="user"

    # Tier 2 - Workflow Automation
    [$ERROR_WORKFLOW_MERGE_VALIDATION_FAILED]="workflow"
    [$ERROR_WORKFLOW_BRANCH_NOT_FOUND]="workflow"
    [$ERROR_WORKFLOW_FILE_COUNT_MISMATCH]="workflow"
    [$ERROR_WORKFLOW_CRITICAL_FILES_MISSING]="workflow"
    [$ERROR_WORKFLOW_CONFIG_INTEGRITY_FAILURE]="workflow"
    [$ERROR_WORKFLOW_WORKING_TREE_DIRTY]="workflow"
    [$ERROR_WORKFLOW_DEVELOPMENT_STATUS_INCONSISTENT]="workflow"

    # Tier 3 - Quality Gates
    [$ERROR_QUALITY_COMPLEXITY_THRESHOLD_EXCEEDED]="quality"
    [$ERROR_QUALITY_LINT_VIOLATIONS]="quality"
    [$ERROR_QUALITY_FORMAT_VIOLATIONS]="quality"
    [$ERROR_QUALITY_SECURITY_VULNERABILITY]="quality"
    [$ERROR_QUALITY_TEST_FAILURES]="quality"
    [$ERROR_QUALITY_COVERAGE_INSUFFICIENT]="quality"
    [$ERROR_QUALITY_DEPENDENCY_OUTDATED]="quality"

    # Tier 4 - Infrastructure
    [$ERROR_ENVIRONMENT_PYTHON_NOT_FOUND]="infrastructure"
    [$ERROR_ENVIRONMENT_VENV_NOT_FOUND]="infrastructure"
    [$ERROR_ENVIRONMENT_TOOL_NOT_AVAILABLE]="infrastructure"
    [$ERROR_ENVIRONMENT_PLATFORM_NOT_SUPPORTED]="infrastructure"
    [$ERROR_ENVIRONMENT_PATH_RESOLUTION_FAILED]="infrastructure"
    [$ERROR_ENVIRONMENT_COMMAND_EXECUTION_FAILED]="infrastructure"
    [$ERROR_ENVIRONMENT_FILE_SYSTEM_ERROR]="infrastructure"
    [$ERROR_ENVIRONMENT_NETWORK_ERROR]="infrastructure"

    # Cross-tier Integration
    [$ERROR_INTEGRATION_INTERFACE_CONTRACT_VIOLATION]="integration"
    [$ERROR_INTEGRATION_DATA_SYNC_FAILURE]="integration"
    [$ERROR_INTEGRATION_PROTOCOL_MISMATCH]="integration"
    [$ERROR_INTEGRATION_TIMEOUT]="integration"
    [$ERROR_INTEGRATION_RESOURCE_EXHAUSTED]="integration"
)

# ================================================================================
# GLOBAL ERROR HANDLING CONFIGURATION
# ================================================================================

# Error handling configuration
ERROR_HANDLER_VERBOSE="${ERROR_HANDLER_VERBOSE:-${VERBOSE:-0}}"
ERROR_HANDLER_LOG_FILE="${ERROR_HANDLER_LOG_FILE:-}"
ERROR_HANDLER_COLOR_OUTPUT="${ERROR_HANDLER_COLOR_OUTPUT:-1}"
ERROR_HANDLER_EXIT_ON_ERROR="${ERROR_HANDLER_EXIT_ON_ERROR:-1}"

# Color codes for console output
if [[ "$ERROR_HANDLER_COLOR_OUTPUT" == "1" ]]; then
    readonly COLOR_ERROR='\033[31m'    # Red
    readonly COLOR_WARNING='\033[33m'  # Yellow
    readonly COLOR_INFO='\033[36m'     # Cyan
    readonly COLOR_SUCCESS='\033[32m'  # Green
    readonly COLOR_RESET='\033[0m'     # Reset
else
    readonly COLOR_ERROR=''
    readonly COLOR_WARNING=''
    readonly COLOR_INFO=''
    readonly COLOR_SUCCESS=''
    readonly COLOR_RESET=''
fi

# ================================================================================
# CORE ERROR HANDLING FUNCTIONS
# ================================================================================

# Log error with standardized format
log_error() {
    local error_code="$1"
    local message="$2"
    local context="${3:-}"

    local severity="${ERROR_SEVERITY_MAP[$error_code]:-error}"
    local tier="${ERROR_TIER_MAP[$error_code]:-unknown}"
    local timestamp=$(date '+%H:%M:%S')

    # Determine color based on severity
    local color_code
    case "$severity" in
        "error")   color_code="$COLOR_ERROR" ;;
        "warning") color_code="$COLOR_WARNING" ;;
        "info")    color_code="$COLOR_INFO" ;;
        *)         color_code="$COLOR_ERROR" ;;
    esac

    local prefix="${color_code}[${timestamp}] [${severity^^}] [${error_code}]${COLOR_RESET}"
    local log_message="$prefix $message"

    # Output to appropriate stream
    if [[ "$severity" == "error" ]]; then
        echo -e "$log_message" >&2
    else
        echo -e "$log_message"
    fi

    # Verbose context output
    if [[ "$ERROR_HANDLER_VERBOSE" == "1" ]] && [[ -n "$context" ]]; then
        echo -e "$prefix Context: $context" >&2
    fi

    # Log to file if configured
    if [[ -n "$ERROR_HANDLER_LOG_FILE" ]]; then
        log_to_file "$error_code" "$severity" "$tier" "$message" "$context"
    fi

    # Export error information for protocol bridge
    export ERROR_CODE="$error_code"
    export ERROR_SEVERITY="$severity"
    export ERROR_TIER="$tier"
    export ERROR_MESSAGE="$message"
    export ERROR_TIMESTAMP="$(date -Iseconds)"
    export ERROR_CONTEXT="$context"
}

# Log to file in JSON format
log_to_file() {
    local error_code="$1"
    local severity="$2"
    local tier="$3"
    local message="$4"
    local context="$5"

    local timestamp=$(date -Iseconds)
    local script_name=$(basename "$0")

    # Create JSON log entry
    local json_entry=$(cat <<EOF
{"timestamp":"$timestamp","script":"$script_name","error":{"code":$error_code,"severity":"$severity","tier":"$tier","message":"$message","context":"$context"}}
EOF
    )

    echo "$json_entry" >> "$ERROR_HANDLER_LOG_FILE"
}

# Handle error with full processing
handle_error() {
    local error_code="$1"
    local message="$2"
    local context="${3:-}"
    local exit_on_error="${4:-$ERROR_HANDLER_EXIT_ON_ERROR}"

    # Log the error
    log_error "$error_code" "$message" "$context"

    # Write error file for scripts/ integration
    write_error_file_for_scripts "$error_code" "$message" "$context"

    # Determine exit code and action
    local severity="${ERROR_SEVERITY_MAP[$error_code]:-error}"
    local exit_code

    case "$severity" in
        "error")
            if [[ "${ERROR_TIER_MAP[$error_code]}" == "infrastructure" ]]; then
                exit_code=2
            else
                exit_code=1
            fi
            ;;
        "warning"|"info")
            exit_code=0
            ;;
        *)
            exit_code=1
            ;;
    esac

    # Exit if configured to do so and severity warrants it
    if [[ "$exit_on_error" == "1" ]] && [[ "$severity" == "error" ]]; then
        exit $exit_code
    fi

    return $exit_code
}

# Simplified error exit function
error_exit() {
    local error_code="$1"
    local message="$2"
    local context="${3:-}"

    handle_error "$error_code" "$message" "$context" "1"
}

# Warning function (doesn't exit)
error_warn() {
    local error_code="$1"
    local message="$2"
    local context="${3:-}"

    # Only process if it's actually a warning-level error
    local severity="${ERROR_SEVERITY_MAP[$error_code]:-warning}"
    if [[ "$severity" != "warning" && "$severity" != "info" ]]; then
        # Convert error-level codes to warnings for this function
        log_error "$error_code" "$message" "$context"
        return 0
    fi

    handle_error "$error_code" "$message" "$context" "0"
}

# ================================================================================
# PROTOCOL BRIDGE FOR SCRIPTS/ INTEGRATION
# ================================================================================

# Write error information for scripts/ consumption
write_error_file_for_scripts() {
    local error_code="$1"
    local message="$2"
    local context="$3"

    local error_file="${TMPDIR:-/tmp}/error_$$.env"

    cat > "$error_file" <<EOF
export ERROR_CODE=$error_code
export ERROR_SEVERITY=${ERROR_SEVERITY_MAP[$error_code]:-error}
export ERROR_TIER=${ERROR_TIER_MAP[$error_code]:-unknown}
export ERROR_MESSAGE="$message"
export ERROR_TIMESTAMP="$(date -Iseconds)"
export ERROR_CONTEXT="$context"
EOF

    if [[ "$ERROR_HANDLER_VERBOSE" == "1" ]]; then
        echo "[DEBUG] Error file written to: $error_file" >&2
    fi
}

# Read error from scripts/ (Node.js) environment
read_error_from_scripts() {
    local error_file="${1:-${TMPDIR:-/tmp}/scripts_error.env}"

    if [[ -f "$error_file" ]]; then
        source "$error_file"
        rm -f "$error_file"  # Clean up

        # Re-export for current shell
        export ERROR_CODE ERROR_SEVERITY ERROR_TIER ERROR_MESSAGE ERROR_TIMESTAMP ERROR_CONTEXT

        if [[ "$ERROR_HANDLER_VERBOSE" == "1" ]]; then
            echo "[DEBUG] Loaded error from scripts: $ERROR_CODE - $ERROR_MESSAGE" >&2
        fi

        return 0
    fi

    return 1
}

# Convert Node.js/scripts error format to shell format
convert_nodejs_error() {
    local nodejs_error="$1"

    # Parse format: ERROR_CODE=1001 ERROR_SEVERITY=error ERROR_TIER=user ERROR_MESSAGE="message"
    local code=$(echo "$nodejs_error" | grep -o 'ERROR_CODE=[0-9]*' | cut -d= -f2)
    local severity=$(echo "$nodejs_error" | grep -o 'ERROR_SEVERITY=[a-z]*' | cut -d= -f2)
    local tier=$(echo "$nodejs_error" | grep -o 'ERROR_TIER=[a-z]*' | cut -d= -f2)
    local message=$(echo "$nodejs_error" | grep -o 'ERROR_MESSAGE="[^"]*"' | cut -d= -f2 | sed 's/"//g')

    if [[ -n "$code" ]] && [[ -n "$message" ]]; then
        export ERROR_CODE="$code"
        export ERROR_SEVERITY="$severity"
        export ERROR_TIER="$tier"
        export ERROR_MESSAGE="$message"
        export ERROR_TIMESTAMP="$(date -Iseconds)"
        return 0
    fi

    return 1
}

# ================================================================================
# VALIDATION AND TESTING UTILITIES
# ================================================================================

# Validate error code exists
validate_error_code() {
    local error_code="$1"

    if [[ -z "${ERROR_SEVERITY_MAP[$error_code]:-}" ]]; then
        error_exit $ERROR_INTEGRATION_INTERFACE_CONTRACT_VIOLATION "Invalid error code: $error_code"
    fi

    return 0
}

# Get error information
get_error_info() {
    local error_code="$1"
    local info_type="${2:-all}"

    validate_error_code "$error_code"

    case "$info_type" in
        "severity")
            echo "${ERROR_SEVERITY_MAP[$error_code]}"
            ;;
        "tier")
            echo "${ERROR_TIER_MAP[$error_code]}"
            ;;
        "all")
            echo "Code: $error_code, Severity: ${ERROR_SEVERITY_MAP[$error_code]}, Tier: ${ERROR_TIER_MAP[$error_code]}"
            ;;
        *)
            error_exit $ERROR_USER_INVALID_ARGUMENTS "Invalid info type: $info_type"
            ;;
    esac
}

# Test error handling system
run_self_test() {
    echo "🧪 Running error handling self-test..."

    # Test basic error handling (without exit)
    local original_exit_setting="$ERROR_HANDLER_EXIT_ON_ERROR"
    ERROR_HANDLER_EXIT_ON_ERROR=0

    # Test error logging
    handle_error $ERROR_ENVIRONMENT_PYTHON_NOT_FOUND "Test error message" "test_context=self_test"
    if [[ $? -eq 0 ]]; then
        echo "✅ Error handling: PASS"
    else
        echo "❌ Error handling: FAIL"
        return 1
    fi

    # Test validation
    validate_error_code $ERROR_WORKFLOW_MERGE_VALIDATION_FAILED
    if [[ $? -eq 0 ]]; then
        echo "✅ Error validation: PASS"
    else
        echo "❌ Error validation: FAIL"
        return 1
    fi

    # Test info retrieval
    local severity=$(get_error_info $ERROR_QUALITY_LINT_VIOLATIONS "severity")
    if [[ "$severity" == "warning" ]]; then
        echo "✅ Error info retrieval: PASS"
    else
        echo "❌ Error info retrieval: FAIL (expected 'warning', got '$severity')"
        return 1
    fi

    # Test protocol bridge
    write_error_file_for_scripts $ERROR_INTEGRATION_TIMEOUT "Test timeout" "test=1"
    if [[ -f "${TMPDIR:-/tmp}/error_$$.env" ]]; then
        echo "✅ Protocol bridge: PASS"
        rm -f "${TMPDIR:-/tmp}/error_$$.env"
    else
        echo "❌ Protocol bridge: FAIL"
        return 1
    fi

    # Restore original setting
    ERROR_HANDLER_EXIT_ON_ERROR="$original_exit_setting"

    echo "🎉 All error handling tests passed!"
    return 0
}

# ================================================================================
# UTILITY FUNCTIONS
# ================================================================================

# Show all available error codes
show_error_codes() {
    echo "📋 Available Error Codes by Tier:"
    echo

    echo "🔧 Tier 1 - User Commands (1000-1999):"
    echo "  $ERROR_USER_INVALID_ARGUMENTS - Invalid Arguments"
    echo "  $ERROR_USER_MISSING_REQUIRED_PARAM - Missing Required Parameter"
    echo "  $ERROR_USER_INVALID_COMMAND - Invalid Command"
    echo "  $ERROR_USER_PERMISSION_DENIED - Permission Denied"
    echo "  $ERROR_USER_CONFIGURATION_ERROR - Configuration Error"
    echo

    echo "🔄 Tier 2 - Workflow Automation (2000-2999):"
    echo "  $ERROR_WORKFLOW_MERGE_VALIDATION_FAILED - Merge Validation Failed"
    echo "  $ERROR_WORKFLOW_BRANCH_NOT_FOUND - Branch Not Found"
    echo "  $ERROR_WORKFLOW_FILE_COUNT_MISMATCH - File Count Mismatch"
    echo "  $ERROR_WORKFLOW_CRITICAL_FILES_MISSING - Critical Files Missing"
    echo "  $ERROR_WORKFLOW_CONFIG_INTEGRITY_FAILURE - Config Integrity Failure"
    echo "  $ERROR_WORKFLOW_WORKING_TREE_DIRTY - Working Tree Dirty"
    echo "  $ERROR_WORKFLOW_DEVELOPMENT_STATUS_INCONSISTENT - Development Status Inconsistent"
    echo

    echo "🛡️ Tier 3 - Quality Gates (3000-3999):"
    echo "  $ERROR_QUALITY_COMPLEXITY_THRESHOLD_EXCEEDED - Complexity Threshold Exceeded"
    echo "  $ERROR_QUALITY_LINT_VIOLATIONS - Lint Violations"
    echo "  $ERROR_QUALITY_FORMAT_VIOLATIONS - Format Violations"
    echo "  $ERROR_QUALITY_SECURITY_VULNERABILITY - Security Vulnerability"
    echo "  $ERROR_QUALITY_TEST_FAILURES - Test Failures"
    echo "  $ERROR_QUALITY_COVERAGE_INSUFFICIENT - Coverage Insufficient"
    echo "  $ERROR_QUALITY_DEPENDENCY_OUTDATED - Dependency Outdated"
    echo

    echo "⚡ Tier 4 - Infrastructure (4000-4999):"
    echo "  $ERROR_ENVIRONMENT_PYTHON_NOT_FOUND - Python Not Found"
    echo "  $ERROR_ENVIRONMENT_VENV_NOT_FOUND - Virtual Environment Not Found"
    echo "  $ERROR_ENVIRONMENT_TOOL_NOT_AVAILABLE - Tool Not Available"
    echo "  $ERROR_ENVIRONMENT_PLATFORM_NOT_SUPPORTED - Platform Not Supported"
    echo "  $ERROR_ENVIRONMENT_PATH_RESOLUTION_FAILED - Path Resolution Failed"
    echo "  $ERROR_ENVIRONMENT_COMMAND_EXECUTION_FAILED - Command Execution Failed"
    echo "  $ERROR_ENVIRONMENT_FILE_SYSTEM_ERROR - File System Error"
    echo "  $ERROR_ENVIRONMENT_NETWORK_ERROR - Network Error"
    echo

    echo "🔗 Cross-Tier Integration (5000-5999):"
    echo "  $ERROR_INTEGRATION_INTERFACE_CONTRACT_VIOLATION - Interface Contract Violation"
    echo "  $ERROR_INTEGRATION_DATA_SYNC_FAILURE - Data Sync Failure"
    echo "  $ERROR_INTEGRATION_PROTOCOL_MISMATCH - Protocol Mismatch"
    echo "  $ERROR_INTEGRATION_TIMEOUT - Timeout"
    echo "  $ERROR_INTEGRATION_RESOURCE_EXHAUSTED - Resource Exhausted"
}

# ================================================================================
# INITIALIZATION AND SELF-TEST
# ================================================================================

# Run self-test if this script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    case "${1:-}" in
        "test")
            run_self_test
            ;;
        "codes")
            show_error_codes
            ;;
        *)
            echo "Usage: $0 [test|codes]"
            echo "  test  - Run self-test"
            echo "  codes - Show all error codes"
            echo
            echo "To use in scripts:"
            echo "  source $0"
            exit 1
            ;;
    esac
fi

# Export functions for use in other scripts
export -f log_error handle_error error_exit error_warn
export -f validate_error_code get_error_info
export -f write_error_file_for_scripts read_error_from_scripts convert_nodejs_error
export -f run_self_test show_error_codes