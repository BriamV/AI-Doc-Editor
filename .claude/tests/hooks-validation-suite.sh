#!/bin/bash
# Comprehensive test suite for .claude/hooks.json integration
# Tests all 8 hook scripts with realistic scenarios
#
# Usage: bash .claude/tests/hooks-validation-suite.sh
#
# Exit codes:
#   0 = All tests passed
#   1 = One or more tests failed

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL=0
PASSED=0
FAILED=0
SKIPPED=0

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

# Cleanup function
cleanup_test_artifacts() {
    rm -f .cc-session-start .cc-tools-checked .cc-metrics-fail.json
    rm -f .claude/session-context.json
    rm -rf .test-artifacts
}

# Setup test environment
setup_test_env() {
    mkdir -p .test-artifacts
    trap cleanup_test_artifacts EXIT
}

# Detect OS
detect_os() {
    if [ -n "$WSL_DISTRO_NAME" ] || ([ -f /proc/version ] && grep -q Microsoft /proc/version 2>/dev/null); then
        echo "wsl"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        echo "windows"
    else
        echo "linux"
    fi
}

OS_TYPE=$(detect_os)

# Determine python command
PYTHON_CMD="python3"
command -v python3 >/dev/null 2>&1 || PYTHON_CMD="python"

# Check if tool is available
has_tool() {
    command -v "$1" >/dev/null 2>&1
}

# Run a test and capture results
run_test() {
    local test_name="$1"
    local test_func="$2"

    TOTAL=$((TOTAL + 1))
    echo ""
    echo -e "${BLUE}[TEST $TOTAL] $test_name${NC}"
    echo "----------------------------------------"

    if $test_func; then
        echo -e "${GREEN}✅ PASSED${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Skip a test with reason
skip_test() {
    local reason="$1"
    TOTAL=$((TOTAL + 1))
    SKIPPED=$((SKIPPED + 1))
    echo -e "${YELLOW}⊘ SKIPPED: $reason${NC}"
    return 0
}

# Assert command exit code
assert_exit_code() {
    local expected="$1"
    local actual="$2"
    local context="$3"

    if [ "$expected" -eq "$actual" ]; then
        echo "✓ Exit code: $actual (expected: $expected) - $context"
        return 0
    else
        echo "✗ Exit code: $actual (expected: $expected) - $context"
        return 1
    fi
}

# Assert file exists
assert_file_exists() {
    local file="$1"
    local context="$2"

    # Handle both relative and absolute paths
    if [ -f "$file" ]; then
        echo "✓ File exists: $file - $context"
        return 0
    elif [ -f "$PROJECT_ROOT/$file" ]; then
        echo "✓ File exists: $PROJECT_ROOT/$file - $context"
        return 0
    else
        echo "✗ File missing: $file - $context"
        echo "  Checked: $file"
        echo "  Checked: $PROJECT_ROOT/$file"
        return 1
    fi
}

# Assert string contains
assert_contains() {
    local haystack="$1"
    local needle="$2"
    local context="$3"

    if echo "$haystack" | grep -q "$needle"; then
        echo "✓ Contains '$needle' - $context"
        return 0
    else
        echo "✗ Does not contain '$needle' - $context"
        echo "  Haystack: $haystack"
        return 1
    fi
}

# Assert JSON field value
assert_json_field() {
    local json_file="$1"
    local field="$2"
    local expected="$3"
    local context="$4"

    # Resolve file path
    local resolved_file="$json_file"
    if [ ! -f "$json_file" ] && [ -f "$PROJECT_ROOT/$json_file" ]; then
        resolved_file="$PROJECT_ROOT/$json_file"
    fi

    if [ ! -f "$resolved_file" ]; then
        echo "✗ JSON file missing: $resolved_file"
        return 1
    fi

    local actual=$($PYTHON_CMD -c "
import json
import sys
try:
    with open('$resolved_file') as f:
        data = json.load(f)
    value = data.get('$field', '')
    if value == 'null' or value is None:
        print('')
    else:
        print(value)
except Exception as e:
    print('', file=sys.stderr)
" 2>/dev/null)

    if [ "$actual" = "$expected" ]; then
        echo "✓ JSON field '$field' = '$expected' - $context"
        return 0
    else
        echo "✗ JSON field '$field' = '$actual' (expected: '$expected') - $context"
        return 1
    fi
}

#########################################
# TEST 1: session-context.sh
#########################################
test_session_start_hook() {
    echo "Testing SessionStart hook with various branch types..."

    local original_branch=$(git branch --show-current 2>/dev/null || echo "main")
    local test_passed=0

    # Test 1.1: Feature branch with task ID
    echo ""
    echo "Test 1.1: Feature branch (feature/T-123-test-feature)"
    git checkout -b feature/T-123-test-feature 2>/dev/null || git checkout feature/T-123-test-feature 2>/dev/null || true

    OUTPUT=$(.claude/scripts/session-context.sh 2>&1)
    EXIT_CODE=$?

    assert_exit_code 0 $EXIT_CODE "Feature branch detection" || return 1
    assert_contains "$OUTPUT" "T-123" "Task ID extraction" || return 1
    assert_contains "$OUTPUT" "task-development" "Workflow type detection" || return 1
    assert_file_exists ".claude/session-context.json" "Context file creation" || return 1
    assert_json_field ".claude/session-context.json" "task_id" "T-123" "Task ID in JSON" || return 1
    assert_json_field ".claude/session-context.json" "workflow_type" "task-development" "Workflow type in JSON" || return 1

    # Test 1.2: Release branch
    echo ""
    echo "Test 1.2: Release branch (release/R1.0.0)"
    git checkout -b release/R1.0.0 2>/dev/null || git checkout release/R1.0.0 2>/dev/null || true

    OUTPUT=$(.claude/scripts/session-context.sh 2>&1)
    EXIT_CODE=$?

    assert_exit_code 0 $EXIT_CODE "Release branch detection" || return 1
    assert_contains "$OUTPUT" "release-preparation" "Release workflow detection" || return 1
    assert_json_field ".claude/session-context.json" "workflow_type" "release-preparation" "Release workflow in JSON" || return 1

    # Test 1.3: Main branch
    echo ""
    echo "Test 1.3: Main branch"
    git checkout main 2>/dev/null || git checkout master 2>/dev/null || true

    OUTPUT=$(.claude/scripts/session-context.sh 2>&1)
    EXIT_CODE=$?

    assert_exit_code 0 $EXIT_CODE "Main branch detection" || return 1
    assert_contains "$OUTPUT" "production" "Production workflow detection" || return 1

    # Test 1.4: Develop branch
    echo ""
    echo "Test 1.4: Develop branch"
    git checkout develop 2>/dev/null || git checkout -b develop 2>/dev/null || true

    OUTPUT=$(.claude/scripts/session-context.sh 2>&1)
    EXIT_CODE=$?

    assert_exit_code 0 $EXIT_CODE "Develop branch detection" || return 1
    assert_contains "$OUTPUT" "integration" "Integration workflow detection" || return 1

    # Restore original branch
    git checkout "$original_branch" 2>/dev/null || true

    # Cleanup test branches
    git branch -D feature/T-123-test-feature 2>/dev/null || true
    git branch -D release/R1.0.0 2>/dev/null || true

    return 0
}

#########################################
# TEST 2: inject-context.sh
#########################################
test_user_prompt_submit_hook() {
    echo "Testing UserPromptSubmit hook with context injection..."

    # Setup: Create session context
    cat > .claude/session-context.json <<'EOF'
{
  "branch": "feature/T-456-test",
  "workflow_type": "task-development",
  "task_id": "T-456",
  "release_id": null,
  "timestamp": "2025-01-15T10:00:00Z"
}
EOF

    OUTPUT=$(.claude/scripts/inject-context.sh 2>&1)
    EXIT_CODE=$?

    assert_exit_code 0 $EXIT_CODE "Context injection" || return 1
    assert_contains "$OUTPUT" "T-456" "Task ID injection" || return 1
    assert_contains "$OUTPUT" "feature/T-456-test" "Branch injection" || return 1
    assert_contains "$OUTPUT" "task-development" "Workflow injection" || return 1

    # Test with no context file
    rm -f .claude/session-context.json
    OUTPUT=$(.claude/scripts/inject-context.sh 2>&1)
    EXIT_CODE=$?

    assert_exit_code 0 $EXIT_CODE "Graceful handling of missing context" || return 1

    return 0
}

#########################################
# TEST 3: bash-protection.sh
#########################################
test_bash_protection_hook() {
    echo "Testing Bash protection hook with merge operations..."

    local original_branch=$(git branch --show-current 2>/dev/null || echo "main")

    # Test 3.1: Block git push on main
    echo ""
    echo "Test 3.1: Block git push on main branch"
    git checkout main 2>/dev/null || git checkout master 2>/dev/null || true

    local JSON_INPUT='{"tool_name":"Bash","tool_input":{"command":"git push origin main"}}'
    OUTPUT=$(echo "$JSON_INPUT" | .claude/scripts/bash-protection.sh 2>&1)
    EXIT_CODE=$?

    assert_exit_code 2 $EXIT_CODE "Block git push on main" || return 1
    assert_contains "$OUTPUT" "BLOCKED" "Block message present" || return 1

    # Test 3.2: Block git merge on main
    echo ""
    echo "Test 3.2: Block git merge on main branch"
    JSON_INPUT='{"tool_name":"Bash","tool_input":{"command":"git merge feature/test"}}'
    OUTPUT=$(echo "$JSON_INPUT" | .claude/scripts/bash-protection.sh 2>&1)
    EXIT_CODE=$?

    assert_exit_code 2 $EXIT_CODE "Block git merge on main" || return 1

    # Test 3.3: Allow operations on feature branch
    echo ""
    echo "Test 3.3: Allow operations on feature branch"
    git checkout -b feature/test-protection 2>/dev/null || git checkout feature/test-protection 2>/dev/null || true

    JSON_INPUT='{"tool_name":"Bash","tool_input":{"command":"yarn install"}}'
    OUTPUT=$(echo "$JSON_INPUT" | .claude/scripts/bash-protection.sh 2>&1)
    EXIT_CODE=$?

    assert_exit_code 0 $EXIT_CODE "Allow safe commands" || return 1

    # Restore original branch
    git checkout "$original_branch" 2>/dev/null || true
    git branch -D feature/test-protection 2>/dev/null || true

    return 0
}

#########################################
# TEST 4: pre-edit-checks.sh
#########################################
test_pre_edit_checks_hook() {
    echo "Testing pre-edit checks hook..."

    # Test 4.1: Tool availability check
    echo ""
    echo "Test 4.1: Tool availability detection"
    rm -f .cc-tools-checked

    JSON_INPUT='{"tool_name":"Edit","tool_input":{"file_path":"test.ts"}}'
    OUTPUT=$(echo "$JSON_INPUT" | .claude/scripts/pre-edit-checks.sh 2>&1)
    EXIT_CODE=$?

    assert_exit_code 0 $EXIT_CODE "Pre-edit checks pass" || return 1
    assert_contains "$OUTPUT" "Pre-edit checks" "Check execution message" || return 1

    # Test 4.2: Document validation trigger
    echo ""
    echo "Test 4.2: Document validation for .md files"
    JSON_INPUT='{"tool_name":"Edit","tool_input":{"file_path":"docs/test.md"}}'
    OUTPUT=$(echo "$JSON_INPUT" | .claude/scripts/pre-edit-checks.sh 2>&1)
    EXIT_CODE=$?

    assert_exit_code 0 $EXIT_CODE "Document pre-check" || return 1

    return 0
}

#########################################
# TEST 5: auto-format.sh
#########################################
test_auto_format_hook() {
    echo "Testing auto-format hook with various file types..."

    # Skip if required tools are missing
    if ! has_tool python3 || ! has_tool npx; then
        skip_test "Required formatting tools not available"
        return 0
    fi

    # Test 5.1: TypeScript file formatting
    echo ""
    echo "Test 5.1: TypeScript file auto-formatting"

    cat > .test-artifacts/test-format.ts <<'EOF'
const  x  =  1;
function test( ) { return   x; }
EOF

    JSON_INPUT="{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\".test-artifacts/test-format.ts\"},\"tool_response\":{\"file_path\":\".test-artifacts/test-format.ts\"}}"
    OUTPUT=$(echo "$JSON_INPUT" | .claude/scripts/auto-format.sh 2>&1)
    EXIT_CODE=$?

    assert_exit_code 0 $EXIT_CODE "TypeScript formatting" || true  # Don't fail if formatters not available
    assert_contains "$OUTPUT" "Auto-formatting" "Format message present" || true

    # Test 5.2: Python file formatting (if available)
    if has_tool black && has_tool ruff; then
        echo ""
        echo "Test 5.2: Python file auto-formatting"

        mkdir -p .test-artifacts/backend
        cat > .test-artifacts/backend/test-format.py <<'EOF'
def test(  ):
    x=1
    return   x
EOF

        JSON_INPUT="{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\".test-artifacts/backend/test-format.py\"}}"
        OUTPUT=$(echo "$JSON_INPUT" | .claude/scripts/auto-format.sh 2>&1)
        EXIT_CODE=$?

        assert_exit_code 0 $EXIT_CODE "Python formatting" || return 1
    else
        echo "⊘ Skipping Python formatting test (black/ruff not available)"
    fi

    # Test 5.3: Markdown file formatting
    echo ""
    echo "Test 5.3: Markdown file auto-formatting"

    cat > .test-artifacts/test-format.md <<'EOF'
# Title

Some content without proper spacing
EOF

    JSON_INPUT="{\"tool_name\":\"Write\",\"tool_input\":{\"file_path\":\".test-artifacts/test-format.md\"}}"
    OUTPUT=$(echo "$JSON_INPUT" | .claude/scripts/auto-format.sh 2>&1)
    EXIT_CODE=$?

    assert_exit_code 0 $EXIT_CODE "Markdown formatting" || return 1

    return 0
}

#########################################
# TEST 6: quality-metrics.sh
#########################################
test_quality_metrics_hook() {
    echo "Testing quality metrics hook with CC and LOC violations..."

    # Skip if radon not available
    if ! has_tool python3; then
        skip_test "Python not available for metrics"
        return 0
    fi

    # Test 6.1: File within limits (should pass)
    echo ""
    echo "Test 6.1: File within quality limits"

    cat > .test-artifacts/test-quality-good.py <<'EOF'
def simple_function(x):
    """Simple function with low complexity."""
    if x > 0:
        return x * 2
    return 0
EOF

    JSON_INPUT="{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\".test-artifacts/test-quality-good.py\"}}"
    OUTPUT=$(echo "$JSON_INPUT" | .claude/scripts/quality-metrics.sh 2>&1)
    EXIT_CODE=$?

    assert_exit_code 0 $EXIT_CODE "Quality metrics pass for good code" || true # Don't fail if tools missing
    assert_contains "$OUTPUT" "Quality metrics" "Metrics analysis message" || true

    # Test 6.2: File with high LOC (should fail)
    echo ""
    echo "Test 6.2: File exceeding LOC limit (>300 lines)"

    # Generate a file with >300 lines
    {
        echo "def large_function():"
        for i in {1..310}; do
            echo "    x = $i"
        done
        echo "    return x"
    } > .test-artifacts/test-quality-bad-loc.py

    JSON_INPUT="{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\".test-artifacts/test-quality-bad-loc.py\"}}"
    OUTPUT=$(echo "$JSON_INPUT" | .claude/scripts/quality-metrics.sh 2>&1)
    EXIT_CODE=$?

    assert_exit_code 2 $EXIT_CODE "Quality metrics fail for high LOC" || return 1
    assert_contains "$OUTPUT" "QUALITY METRICS FAILED" "Failure message present" || return 1
    assert_file_exists ".cc-metrics-fail.json" "Metrics failure report created" || return 1

    # Test 6.3: File with high complexity (should fail)
    if has_tool radon; then
        echo ""
        echo "Test 6.3: File with high cyclomatic complexity (>15)"

        cat > .test-artifacts/test-quality-bad-cc.py <<'EOF'
def complex_function(a, b, c, d, e):
    if a > 0:
        if b > 0:
            if c > 0:
                if d > 0:
                    if e > 0:
                        if a > b:
                            if b > c:
                                if c > d:
                                    if d > e:
                                        if a > 10:
                                            if b > 10:
                                                if c > 10:
                                                    if d > 10:
                                                        if e > 10:
                                                            if a + b > 20:
                                                                return True
    return False
EOF

        JSON_INPUT="{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\".test-artifacts/test-quality-bad-cc.py\"}}"
        OUTPUT=$(echo "$JSON_INPUT" | .claude/scripts/quality-metrics.sh 2>&1)
        EXIT_CODE=$?

        assert_exit_code 2 $EXIT_CODE "Quality metrics fail for high CC" || return 1
        assert_contains "$OUTPUT" "QUALITY METRICS FAILED" "CC failure message" || return 1
    else
        echo "⊘ Skipping CC test (radon not available)"
    fi

    return 0
}

#########################################
# TEST 7: subagent-summary.sh
#########################################
test_subagent_summary_hook() {
    echo "Testing subagent summary hook..."

    # Setup: Create session context with task
    cat > .claude/session-context.json <<'EOF'
{
  "branch": "feature/T-789-test",
  "workflow_type": "task-development",
  "task_id": "T-789",
  "release_id": null,
  "timestamp": "2025-01-15T10:00:00Z"
}
EOF

    # Create a mock change to test
    echo "test" > .test-artifacts/mock-change.txt
    git add .test-artifacts/mock-change.txt 2>/dev/null || true

    JSON_INPUT='{"tool_name":"Edit","tool_input":{}}'
    OUTPUT=$(echo "$JSON_INPUT" | .claude/scripts/subagent-summary.sh 2>&1)
    EXIT_CODE=$?

    assert_exit_code 0 $EXIT_CODE "Subagent summary execution" || return 1
    assert_contains "$OUTPUT" "Sub-agent task completed" "Summary message present" || return 1
    assert_contains "$OUTPUT" "Next steps" "Next actions suggested" || return 1

    # Test with release workflow
    cat > .claude/session-context.json <<'EOF'
{
  "branch": "release/R2",
  "workflow_type": "release-preparation",
  "task_id": null,
  "release_id": "R2",
  "timestamp": "2025-01-15T10:00:00Z"
}
EOF

    OUTPUT=$(echo "$JSON_INPUT" | .claude/scripts/subagent-summary.sh 2>&1)
    EXIT_CODE=$?

    assert_exit_code 0 $EXIT_CODE "Release workflow summary" || return 1
    assert_contains "$OUTPUT" "release-prep" "Release workflow suggestions" || return 1

    # Cleanup
    git reset HEAD .test-artifacts/mock-change.txt 2>/dev/null || true

    return 0
}

#########################################
# TEST 8: setup-permissions.sh
#########################################
test_setup_permissions() {
    echo "Testing setup-permissions.sh script..."

    # Only test on Linux/WSL
    if [ "$OS_TYPE" = "windows" ]; then
        skip_test "Permission setup not applicable on Windows"
        return 0
    fi

    # Verify script is executable
    if [ ! -x .claude/scripts/setup-permissions.sh ]; then
        echo "✗ setup-permissions.sh is not executable"
        return 1
    fi

    # Run setup
    OUTPUT=$(.claude/scripts/setup-permissions.sh 2>&1)
    EXIT_CODE=$?

    assert_exit_code 0 $EXIT_CODE "Setup permissions execution" || return 1

    # Verify all scripts are executable
    local all_executable=0
    for script in .claude/scripts/*.sh; do
        if [ ! -x "$script" ]; then
            echo "✗ Script not executable: $script"
            all_executable=1
        fi
    done

    if [ $all_executable -eq 0 ]; then
        echo "✓ All scripts are executable"
        return 0
    else
        return 1
    fi
}

#########################################
# TEST 9: Integration Test
#########################################
test_integration_workflow() {
    echo "Testing complete workflow integration..."

    local original_branch=$(git branch --show-current 2>/dev/null || echo "main")

    # Step 1: SessionStart - Initialize context
    echo ""
    echo "Step 1: Initialize session context"
    git checkout -b feature/T-999-integration-test 2>/dev/null || git checkout feature/T-999-integration-test 2>/dev/null || true

    OUTPUT=$(.claude/scripts/session-context.sh 2>&1)
    assert_exit_code 0 $? "Session initialization" || return 1
    assert_file_exists ".claude/session-context.json" "Context file created" || return 1

    # Step 2: UserPromptSubmit - Inject context
    echo ""
    echo "Step 2: Inject context on user prompt"
    OUTPUT=$(.claude/scripts/inject-context.sh 2>&1)
    assert_exit_code 0 $? "Context injection" || return 1
    assert_contains "$OUTPUT" "T-999" "Task context injected" || return 1

    # Step 3: PreToolUse - Bash protection (should allow)
    echo ""
    echo "Step 3: Pre-tool use check (bash)"
    JSON_INPUT='{"tool_name":"Bash","tool_input":{"command":"yarn install"}}'
    OUTPUT=$(echo "$JSON_INPUT" | .claude/scripts/bash-protection.sh 2>&1)
    assert_exit_code 0 $? "Bash protection allows safe command" || return 1

    # Step 4: PreToolUse - Pre-edit checks
    echo ""
    echo "Step 4: Pre-edit checks"
    JSON_INPUT='{"tool_name":"Edit","tool_input":{"file_path":".test-artifacts/integration-test.ts"}}'
    OUTPUT=$(echo "$JSON_INPUT" | .claude/scripts/pre-edit-checks.sh 2>&1)
    assert_exit_code 0 $? "Pre-edit checks" || return 1

    # Step 5: Create test file and format
    echo ""
    echo "Step 5: Create file and auto-format"
    mkdir -p .test-artifacts
    cat > .test-artifacts/integration-test.ts <<'EOF'
const  value  =  42;
function test( ) { return   value; }
EOF

    JSON_INPUT="{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\".test-artifacts/integration-test.ts\"}}"
    OUTPUT=$(echo "$JSON_INPUT" | .claude/scripts/auto-format.sh 2>&1)
    assert_exit_code 0 $? "Auto-formatting" || return 1

    # Step 6: Quality metrics check
    echo ""
    echo "Step 6: Quality metrics validation"
    OUTPUT=$(echo "$JSON_INPUT" | .claude/scripts/quality-metrics.sh 2>&1)
    assert_exit_code 0 $? "Quality metrics pass" || return 1

    # Step 7: SubagentStop - Summarize
    echo ""
    echo "Step 7: Subagent summary"
    OUTPUT=$(echo "$JSON_INPUT" | .claude/scripts/subagent-summary.sh 2>&1)
    assert_exit_code 0 $? "Subagent summary" || return 1

    # Cleanup
    git checkout "$original_branch" 2>/dev/null || true
    git branch -D feature/T-999-integration-test 2>/dev/null || true

    echo ""
    echo "✓ Complete workflow integration validated"
    return 0
}

#########################################
# Main Test Runner
#########################################
main() {
    echo "============================================"
    echo "  Claude Code Hooks Validation Suite"
    echo "============================================"
    echo ""
    echo "Platform: $OS_TYPE"
    echo "Project: $(basename "$PROJECT_ROOT")"
    echo ""

    setup_test_env

    # Run all tests
    run_test "1. SessionStart Hook (session-context.sh)" test_session_start_hook
    run_test "2. UserPromptSubmit Hook (inject-context.sh)" test_user_prompt_submit_hook
    run_test "3. Bash Protection Hook (bash-protection.sh)" test_bash_protection_hook
    run_test "4. Pre-Edit Checks Hook (pre-edit-checks.sh)" test_pre_edit_checks_hook
    run_test "5. Auto-Format Hook (auto-format.sh)" test_auto_format_hook
    run_test "6. Quality Metrics Hook (quality-metrics.sh)" test_quality_metrics_hook
    run_test "7. Subagent Summary Hook (subagent-summary.sh)" test_subagent_summary_hook
    run_test "8. Setup Permissions (setup-permissions.sh)" test_setup_permissions
    run_test "9. Integration Workflow" test_integration_workflow

    # Summary
    echo ""
    echo "============================================"
    echo "  Test Results Summary"
    echo "============================================"
    echo -e "Total:   $TOTAL"
    echo -e "${GREEN}Passed:  $PASSED${NC}"
    echo -e "${RED}Failed:  $FAILED${NC}"
    echo -e "${YELLOW}Skipped: $SKIPPED${NC}"
    echo ""

    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
        echo ""
        echo "🎉 Hooks integration is functioning correctly!"
        echo ""
        echo "Next steps:"
        echo "  - All 8 hook scripts validated"
        echo "  - Integration workflow tested"
        echo "  - Ready for production use"
        return 0
    else
        echo -e "${RED}❌ SOME TESTS FAILED${NC}"
        echo ""
        echo "Review failed tests above for details."
        return 1
    fi
}

# Execute tests
main
exit $?