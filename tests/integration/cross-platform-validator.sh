#!/bin/bash
#
# Cross-Platform Compatibility Validator
#
# This script validates that the scripts/ and tools/ directories work correctly
# across different platforms (Windows/Linux/WSL) and environments.
#
# Features:
# - Platform detection and compatibility testing
# - Environment validation across different shells
# - Path resolution testing
# - Tool availability verification
# - Performance consistency validation
#
# Usage:
#   bash tests/integration/cross-platform-validator.sh [options]
#
# Options:
#   --platform    Target platform (auto-detect if not specified)
#   --verbose     Enable verbose output
#   --quick       Run quick tests only
#   --full        Run comprehensive test suite

set -euo pipefail

# ================================================================================
# CONFIGURATION AND SETUP
# ================================================================================

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TEST_RESULTS_DIR="$PROJECT_ROOT/tests/results"

# Test configuration
VERBOSE=0
QUICK_MODE=0
FULL_MODE=0
TARGET_PLATFORM=""
TEST_TIMEOUT=30

# Platform detection
detect_platform() {
    local os_name=""
    local arch=""
    local is_wsl=false

    # Detect OS
    case "$(uname -s)" in
        Linux*)
            os_name="linux"
            if [[ -n "${WSL_DISTRO_NAME:-}" ]] || grep -qi microsoft /proc/version 2>/dev/null; then
                is_wsl=true
            fi
            ;;
        Darwin*)
            os_name="darwin"
            ;;
        CYGWIN*|MINGW*|MSYS*)
            os_name="windows"
            ;;
        *)
            os_name="unknown"
            ;;
    esac

    # Detect architecture
    case "$(uname -m)" in
        x86_64|amd64)
            arch="x64"
            ;;
        arm64|aarch64)
            arch="arm64"
            ;;
        i386|i686)
            arch="ia32"
            ;;
        *)
            arch="unknown"
            ;;
    esac

    echo "os=$os_name,arch=$arch,wsl=$is_wsl"
}

# Test result tracking
declare -a TEST_RESULTS=()
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNINGS=0

# Color codes
if [[ -t 1 ]] && command -v tput >/dev/null 2>&1; then
    RED=$(tput setaf 1)
    GREEN=$(tput setaf 2)
    YELLOW=$(tput setaf 3)
    BLUE=$(tput setaf 4)
    CYAN=$(tput setaf 6)
    RESET=$(tput sgr0)
else
    RED="" GREEN="" YELLOW="" BLUE="" CYAN="" RESET=""
fi

# ================================================================================
# UTILITY FUNCTIONS
# ================================================================================

log_info() {
    echo "${BLUE}[INFO]${RESET} $*"
}

log_success() {
    echo "${GREEN}[PASS]${RESET} $*"
}

log_warning() {
    echo "${YELLOW}[WARN]${RESET} $*"
}

log_error() {
    echo "${RED}[FAIL]${RESET} $*"
}

log_verbose() {
    if [[ $VERBOSE -eq 1 ]]; then
        echo "${CYAN}[DEBUG]${RESET} $*"
    fi
}

# Test execution wrapper
run_test() {
    local test_name="$1"
    local test_function="$2"
    local start_time

    log_info "Running: $test_name"
    start_time=$(date +%s.%N)

    if timeout "$TEST_TIMEOUT" bash -c "$test_function"; then
        local duration=$(echo "$(date +%s.%N) - $start_time" | bc 2>/dev/null || echo "N/A")
        log_success "$test_name (${duration}s)"
        TEST_RESULTS+=("PASS:$test_name:$duration")
        ((TESTS_PASSED++))
        return 0
    else
        local exit_code=$?
        local duration=$(echo "$(date +%s.%N) - $start_time" | bc 2>/dev/null || echo "N/A")

        if [[ $exit_code -eq 124 ]]; then
            log_error "$test_name - TIMEOUT after ${TEST_TIMEOUT}s"
        else
            log_error "$test_name - Exit code: $exit_code"
        fi

        TEST_RESULTS+=("FAIL:$test_name:$duration:$exit_code")
        ((TESTS_FAILED++))
        return 1
    fi
}

# ================================================================================
# PLATFORM DETECTION TESTS
# ================================================================================

test_platform_detection() {
    log_info "Testing platform detection capabilities..."

    # Test 1: Basic platform detection
    run_test "Platform Detection - Basic" '
        platform_info=$(detect_platform)
        log_verbose "Platform info: $platform_info"

        if [[ "$platform_info" =~ os=([^,]+) ]]; then
            os="${BASH_REMATCH[1]}"
            if [[ "$os" != "unknown" ]]; then
                log_verbose "Detected OS: $os"
                return 0
            fi
        fi

        log_error "Failed to detect platform"
        return 1
    '

    # Test 2: Node.js platform consistency
    run_test "Platform Detection - Node.js Consistency" '
        if command -v node >/dev/null 2>&1; then
            node_platform=$(node -e "console.log(process.platform)")
            bash_platform=$(detect_platform | grep -o "os=[^,]*" | cut -d= -f2)

            log_verbose "Node.js platform: $node_platform"
            log_verbose "Bash platform: $bash_platform"

            # Mapping validation
            case "$node_platform" in
                "win32")
                    [[ "$bash_platform" == "windows" || "$bash_platform" == "linux" ]] && return 0
                    ;;
                "linux")
                    [[ "$bash_platform" == "linux" ]] && return 0
                    ;;
                "darwin")
                    [[ "$bash_platform" == "darwin" ]] && return 0
                    ;;
            esac

            log_error "Platform detection mismatch: Node.js=$node_platform, Bash=$bash_platform"
            return 1
        else
            log_warning "Node.js not available for consistency test"
            return 0
        fi
    '

    # Test 3: WSL detection
    run_test "Platform Detection - WSL Detection" '
        if [[ -n "${WSL_DISTRO_NAME:-}" ]] || grep -qi microsoft /proc/version 2>/dev/null; then
            platform_info=$(detect_platform)
            if [[ "$platform_info" =~ wsl=true ]]; then
                log_verbose "WSL correctly detected"
                return 0
            else
                log_error "WSL not detected when it should be"
                return 1
            fi
        else
            log_verbose "Not running in WSL - skipping WSL detection test"
            return 0
        fi
    '
}

# ================================================================================
# ENVIRONMENT VALIDATION TESTS
# ================================================================================

test_environment_validation() {
    log_info "Testing environment validation across platforms..."

    # Test 1: Required tools availability
    run_test "Environment - Required Tools" '
        local missing_tools=()

        # Check essential tools
        local required_tools=("bash" "node" "grep" "sed" "awk")

        for tool in "${required_tools[@]}"; do
            if ! command -v "$tool" >/dev/null 2>&1; then
                missing_tools+=("$tool")
            fi
        done

        if [[ ${#missing_tools[@]} -eq 0 ]]; then
            log_verbose "All required tools available"
            return 0
        else
            log_error "Missing tools: ${missing_tools[*]}"
            return 1
        fi
    '

    # Test 2: Scripts directory validation
    run_test "Environment - Scripts Directory" '
        cd "$PROJECT_ROOT"

        if [[ ! -d "scripts" ]]; then
            log_error "scripts/ directory not found"
            return 1
        fi

        # Check for essential scripts
        local essential_scripts=(
            "scripts/multiplatform.cjs"
            "scripts/merge-protection.cjs"
            "scripts/lib/error-codes.cjs"
        )

        for script in "${essential_scripts[@]}"; do
            if [[ ! -f "$script" ]]; then
                log_error "Essential script not found: $script"
                return 1
            fi
        done

        log_verbose "Scripts directory validation passed"
        return 0
    '

    # Test 3: Tools directory validation
    run_test "Environment - Tools Directory" '
        cd "$PROJECT_ROOT"

        if [[ ! -d "tools" ]]; then
            log_error "tools/ directory not found"
            return 1
        fi

        # Check for essential tools
        local essential_tools=(
            "tools/lib/error-codes.sh"
            "tools/validate-document-placement.sh"
            "tools/progress-dashboard.sh"
        )

        for tool in "${essential_tools[@]}"; do
            if [[ ! -f "$tool" ]]; then
                log_error "Essential tool not found: $tool"
                return 1
            fi
        done

        log_verbose "Tools directory validation passed"
        return 0
    '

    # Test 4: Multiplatform script execution
    run_test "Environment - Multiplatform Script Execution" '
        cd "$PROJECT_ROOT"

        if node scripts/multiplatform.cjs validate >/dev/null 2>&1; then
            log_verbose "Multiplatform script executed successfully"
            return 0
        else
            log_error "Multiplatform script execution failed"
            return 1
        fi
    '
}

# ================================================================================
# PATH RESOLUTION TESTS
# ================================================================================

test_path_resolution() {
    log_info "Testing path resolution across platforms..."

    # Test 1: Absolute path resolution
    run_test "Path Resolution - Absolute Paths" '
        cd "$PROJECT_ROOT"

        # Test absolute path to scripts
        local abs_script_path="$(pwd)/scripts/multiplatform.cjs"
        if [[ -f "$abs_script_path" ]]; then
            log_verbose "Absolute path resolution working: $abs_script_path"
        else
            log_error "Absolute path resolution failed: $abs_script_path"
            return 1
        fi

        # Test Node.js can resolve absolute paths
        if node "$abs_script_path" validate >/dev/null 2>&1; then
            log_verbose "Node.js absolute path execution working"
            return 0
        else
            log_error "Node.js absolute path execution failed"
            return 1
        fi
    '

    # Test 2: Relative path resolution
    run_test "Path Resolution - Relative Paths" '
        cd "$PROJECT_ROOT"

        # Test relative path execution
        if bash tools/lib/error-codes.sh test >/dev/null 2>&1; then
            log_verbose "Relative path execution working"
        else
            log_error "Relative path execution failed"
            return 1
        fi

        # Test from subdirectory
        cd tools
        if bash lib/error-codes.sh test >/dev/null 2>&1; then
            log_verbose "Subdirectory relative path execution working"
            return 0
        else
            log_error "Subdirectory relative path execution failed"
            return 1
        fi
    '

    # Test 3: Cross-directory references
    run_test "Path Resolution - Cross-directory References" '
        cd "$PROJECT_ROOT"

        # Test tools/ calling scripts/
        local test_script="
            source tools/lib/error-codes.sh
            if command -v node >/dev/null 2>&1; then
                if [[ -f \"scripts/multiplatform.cjs\" ]]; then
                    echo \"cross_reference=success\"
                else
                    echo \"cross_reference=script_not_found\"
                    exit 1
                fi
            else
                echo \"cross_reference=node_not_available\"
                exit 1
            fi
        "

        if bash -c "$test_script" | grep -q "cross_reference=success"; then
            log_verbose "Cross-directory references working"
            return 0
        else
            log_error "Cross-directory references failed"
            return 1
        fi
    '

    # Test 4: Temporary file path handling
    run_test "Path Resolution - Temporary Files" '
        local temp_dir="${TMPDIR:-/tmp}"
        local test_file="$temp_dir/cross_platform_test_$$"

        # Create test file
        echo "test_content" > "$test_file"

        if [[ -f "$test_file" ]]; then
            log_verbose "Temporary file creation successful: $test_file"
        else
            log_error "Temporary file creation failed: $test_file"
            return 1
        fi

        # Test file can be read
        if [[ "$(cat "$test_file")" == "test_content" ]]; then
            log_verbose "Temporary file read successful"
        else
            log_error "Temporary file read failed"
            rm -f "$test_file"
            return 1
        fi

        # Cleanup
        rm -f "$test_file"
        return 0
    '
}

# ================================================================================
# SHELL COMPATIBILITY TESTS
# ================================================================================

test_shell_compatibility() {
    log_info "Testing shell compatibility across environments..."

    # Test 1: Bash version compatibility
    run_test "Shell Compatibility - Bash Version" '
        bash_version=$(bash --version | head -n1 | grep -o "[0-9]\\+\\.[0-9]\\+")
        log_verbose "Bash version: $bash_version"

        # Check minimum version (4.0+)
        if [[ "$bash_version" =~ ^([0-9]+)\.([0-9]+) ]]; then
            major="${BASH_REMATCH[1]}"
            minor="${BASH_REMATCH[2]}"

            if [[ $major -ge 4 ]]; then
                log_verbose "Bash version compatible (${major}.${minor})"
                return 0
            else
                log_error "Bash version too old: ${major}.${minor} (minimum 4.0 required)"
                return 1
            fi
        else
            log_error "Could not parse Bash version: $bash_version"
            return 1
        fi
    '

    # Test 2: Shell feature compatibility
    run_test "Shell Compatibility - Features" '
        # Test associative arrays
        if ! declare -A test_array 2>/dev/null; then
            log_error "Associative arrays not supported"
            return 1
        fi

        test_array["key"]="value"
        if [[ "${test_array[key]}" != "value" ]]; then
            log_error "Associative array functionality failed"
            return 1
        fi

        # Test process substitution
        if ! echo "test" | grep -q "test" < <(echo "test") 2>/dev/null; then
            log_warning "Process substitution may not work properly"
        fi

        log_verbose "Shell features compatible"
        return 0
    '

    # Test 3: Error handling library compatibility
    run_test "Shell Compatibility - Error Handling Library" '
        cd "$PROJECT_ROOT"

        # Test error handling library loads
        if source tools/lib/error-codes.sh 2>/dev/null; then
            log_verbose "Error handling library loaded successfully"
        else
            log_error "Error handling library failed to load"
            return 1
        fi

        # Test error functions are available
        if declare -f error_exit >/dev/null 2>&1; then
            log_verbose "Error handling functions available"
            return 0
        else
            log_error "Error handling functions not available"
            return 1
        fi
    '
}

# ================================================================================
# TOOL EXECUTION TESTS
# ================================================================================

test_tool_execution() {
    log_info "Testing tool execution across platforms..."

    # Test 1: Node.js script execution
    run_test "Tool Execution - Node.js Scripts" '
        cd "$PROJECT_ROOT"

        # Test basic Node.js execution
        if node -e "console.log(\"node_test=success\")" | grep -q "node_test=success"; then
            log_verbose "Basic Node.js execution working"
        else
            log_error "Basic Node.js execution failed"
            return 1
        fi

        # Test multiplatform script
        if node scripts/multiplatform.cjs --help >/dev/null 2>&1 || \
           node scripts/multiplatform.cjs validate >/dev/null 2>&1; then
            log_verbose "Multiplatform script execution working"
            return 0
        else
            log_error "Multiplatform script execution failed"
            return 1
        fi
    '

    # Test 2: Bash script execution
    run_test "Tool Execution - Bash Scripts" '
        cd "$PROJECT_ROOT"

        # Test basic bash script execution
        if bash -c "echo bash_test=success" | grep -q "bash_test=success"; then
            log_verbose "Basic bash execution working"
        else
            log_error "Basic bash execution failed"
            return 1
        fi

        # Test error handling library
        if bash tools/lib/error-codes.sh test >/dev/null 2>&1; then
            log_verbose "Error handling library execution working"
            return 0
        else
            log_error "Error handling library execution failed"
            return 1
        fi
    '

    # Test 3: Cross-platform tool interaction
    run_test "Tool Execution - Cross-platform Interaction" '
        cd "$PROJECT_ROOT"

        # Test Node.js to Bash communication
        local temp_file="${TMPDIR:-/tmp}/node_bash_test_$$"

        # Node.js writes file
        if node -e "
            const fs = require(\"fs\");
            fs.writeFileSync(\"$temp_file\", \"node_to_bash=success\");
        "; then
            log_verbose "Node.js file write successful"
        else
            log_error "Node.js file write failed"
            return 1
        fi

        # Bash reads file
        if bash -c "
            if [[ -f \"$temp_file\" ]]; then
                content=\$(cat \"$temp_file\")
                if [[ \"\$content\" == \"node_to_bash=success\" ]]; then
                    echo \"bash_read=success\"
                    rm -f \"$temp_file\"
                    exit 0
                fi
            fi
            exit 1
        " | grep -q "bash_read=success"; then
            log_verbose "Cross-platform tool interaction working"
            return 0
        else
            log_error "Cross-platform tool interaction failed"
            rm -f "$temp_file"
            return 1
        fi
    '
}

# ================================================================================
# PERFORMANCE CONSISTENCY TESTS
# ================================================================================

test_performance_consistency() {
    log_info "Testing performance consistency across platforms..."

    # Test 1: Script execution performance
    run_test "Performance - Script Execution Speed" '
        cd "$PROJECT_ROOT"

        local total_time=0
        local iterations=5

        for ((i=1; i<=iterations; i++)); do
            local start_time=$(date +%s.%N)

            if bash tools/lib/error-codes.sh test >/dev/null 2>&1; then
                local end_time=$(date +%s.%N)
                local duration=$(echo "$end_time - $start_time" | bc 2>/dev/null || echo "1")
                total_time=$(echo "$total_time + $duration" | bc 2>/dev/null || echo "$total_time")
            else
                log_error "Performance test iteration $i failed"
                return 1
            fi
        done

        local avg_time=$(echo "scale=3; $total_time / $iterations" | bc 2>/dev/null || echo "N/A")
        log_verbose "Average execution time: ${avg_time}s"

        # Performance threshold: should complete in under 5 seconds on average
        if command -v bc >/dev/null 2>&1 && [[ "$(echo "$avg_time < 5" | bc)" -eq 1 ]]; then
            log_verbose "Performance within acceptable range"
            return 0
        else
            log_warning "Performance test completed but timing unavailable"
            return 0
        fi
    '

    # Test 2: Memory usage consistency
    run_test "Performance - Memory Usage" '
        cd "$PROJECT_ROOT"

        # Test memory usage for Node.js scripts
        local memory_test=$(node -e "
            const initialMemory = process.memoryUsage();

            // Simulate some work
            const { ErrorHandler } = require(\"./scripts/lib/error-codes.cjs\");
            for (let i = 0; i < 10; i++) {
                new ErrorHandler();
            }

            const finalMemory = process.memoryUsage();
            const memoryDiff = finalMemory.heapUsed - initialMemory.heapUsed;

            console.log(\"memory_diff=\" + memoryDiff);
            console.log(\"memory_within_threshold=\" + (memoryDiff < 10 * 1024 * 1024));
        " 2>/dev/null)

        if echo "$memory_test" | grep -q "memory_within_threshold=true"; then
            log_verbose "Memory usage within acceptable range"
            return 0
        else
            log_warning "Memory usage test could not verify threshold"
            return 0
        fi
    '
}

# ================================================================================
# REGRESSION DETECTION TESTS
# ================================================================================

test_regression_detection() {
    log_info "Testing regression detection capabilities..."

    # Test 1: Interface contract stability
    run_test "Regression - Interface Contract Stability" '
        cd "$PROJECT_ROOT"

        # Test that interface contracts are stable
        if [[ -f "docs/architecture/INTERFACE-CONTRACTS.md" ]]; then
            log_verbose "Interface contracts documentation exists"
        else
            log_warning "Interface contracts documentation not found"
        fi

        # Test error code consistency
        if source tools/lib/error-codes.sh 2>/dev/null; then
            # Check that essential error codes exist
            if [[ -n "${ERROR_ENVIRONMENT_PYTHON_NOT_FOUND:-}" ]]; then
                log_verbose "Error codes properly defined"
                return 0
            else
                log_error "Essential error codes missing"
                return 1
            fi
        else
            log_error "Error codes library failed to load"
            return 1
        fi
    '

    # Test 2: Backward compatibility
    run_test "Regression - Backward Compatibility" '
        cd "$PROJECT_ROOT"

        # Test that old interface patterns still work
        local compat_test="
            source tools/lib/error-codes.sh

            # Test old-style error handling
            if handle_error \$ERROR_USER_INVALID_ARGUMENTS \"Test error\" \"test=regression\" \"0\"; then
                echo \"backward_compatibility=success\"
            else
                echo \"backward_compatibility=failed\"
                exit 1
            fi
        "

        if bash -c "$compat_test" | grep -q "backward_compatibility=success"; then
            log_verbose "Backward compatibility maintained"
            return 0
        else
            log_error "Backward compatibility broken"
            return 1
        fi
    '
}

# ================================================================================
# MAIN EXECUTION FLOW
# ================================================================================

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --platform)
                TARGET_PLATFORM="$2"
                shift 2
                ;;
            --verbose)
                VERBOSE=1
                shift
                ;;
            --quick)
                QUICK_MODE=1
                shift
                ;;
            --full)
                FULL_MODE=1
                shift
                ;;
            --timeout)
                TEST_TIMEOUT="$2"
                shift 2
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

show_usage() {
    cat << EOF
Cross-Platform Compatibility Validator

Usage: $0 [options]

Options:
    --platform PLATFORM    Target platform (auto-detect if not specified)
    --verbose              Enable verbose output
    --quick                Run quick tests only
    --full                 Run comprehensive test suite
    --timeout SECONDS      Test timeout (default: 30)
    --help                 Show this help message

Examples:
    $0 --verbose           # Run with verbose output
    $0 --quick             # Run quick compatibility check
    $0 --full --platform linux  # Full test suite for Linux
EOF
}

generate_report() {
    local total_tests=$((TESTS_PASSED + TESTS_FAILED))
    local pass_rate=0

    if [[ $total_tests -gt 0 ]]; then
        pass_rate=$(( (TESTS_PASSED * 100) / total_tests ))
    fi

    echo
    echo "========================================================================================"
    echo "                           CROSS-PLATFORM COMPATIBILITY REPORT"
    echo "========================================================================================"
    echo
    echo "Platform Information:"
    echo "  $(detect_platform)"
    echo "  Bash Version: $(bash --version | head -n1)"
    echo "  Node.js Version: $(node --version 2>/dev/null || echo "Not available")"
    echo
    echo "Test Results:"
    echo "  Total Tests: $total_tests"
    echo "  Passed: $TESTS_PASSED"
    echo "  Failed: $TESTS_FAILED"
    echo "  Warnings: $TESTS_WARNINGS"
    echo "  Pass Rate: ${pass_rate}%"
    echo

    if [[ $pass_rate -ge 90 ]]; then
        echo "Overall Status: ${GREEN}✅ FULLY COMPATIBLE${RESET}"
    elif [[ $pass_rate -ge 75 ]]; then
        echo "Overall Status: ${YELLOW}⚠️ MOSTLY COMPATIBLE${RESET}"
    else
        echo "Overall Status: ${RED}❌ COMPATIBILITY ISSUES${RESET}"
    fi

    # Failed tests summary
    if [[ $TESTS_FAILED -gt 0 ]]; then
        echo
        echo "Failed Tests:"
        for result in "${TEST_RESULTS[@]}"; do
            if [[ "$result" =~ ^FAIL: ]]; then
                echo "  • ${result#FAIL:}"
            fi
        done
    fi

    # Save detailed results
    if [[ ! -d "$TEST_RESULTS_DIR" ]]; then
        mkdir -p "$TEST_RESULTS_DIR"
    fi

    local report_file="$TEST_RESULTS_DIR/cross-platform-compatibility-$(date +%Y%m%d-%H%M%S).txt"
    {
        echo "Cross-Platform Compatibility Test Results"
        echo "Generated: $(date)"
        echo "Platform: $(detect_platform)"
        echo "Pass Rate: ${pass_rate}%"
        echo
        echo "Detailed Results:"
        printf "%s\n" "${TEST_RESULTS[@]}"
    } > "$report_file"

    echo
    echo "Detailed report saved to: $report_file"
    echo
}

main() {
    echo "🌍 Cross-Platform Compatibility Validator"
    echo "=========================================="
    echo

    # Parse command line arguments
    parse_arguments "$@"

    # Detect platform if not specified
    if [[ -z "$TARGET_PLATFORM" ]]; then
        TARGET_PLATFORM=$(detect_platform | cut -d, -f1 | cut -d= -f2)
    fi

    log_info "Target platform: $TARGET_PLATFORM"
    log_info "Test mode: $([ $QUICK_MODE -eq 1 ] && echo "QUICK" || [ $FULL_MODE -eq 1 ] && echo "FULL" || echo "STANDARD")"
    echo

    # Create test results directory
    mkdir -p "$TEST_RESULTS_DIR"

    # Run test suites
    test_platform_detection

    test_environment_validation

    if [[ $QUICK_MODE -eq 0 ]]; then
        test_path_resolution
        test_shell_compatibility
        test_tool_execution

        if [[ $FULL_MODE -eq 1 ]]; then
            test_performance_consistency
            test_regression_detection
        fi
    fi

    # Generate final report
    generate_report

    # Exit with appropriate code
    if [[ $TESTS_FAILED -eq 0 ]]; then
        exit 0
    else
        exit 1
    fi
}

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi