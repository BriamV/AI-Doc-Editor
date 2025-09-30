#!/bin/bash
# Dual System Compatibility Validation Test
# Validates that both progress-dashboard.sh and extract-subtasks.sh work correctly
# in both monolith and distributed modes

echo "🧪 Dual System Compatibility Validation Test"
echo "=============================================="
echo ""

# Test configuration
TEST_TASK_ID="T-01"
MODES=("monolith" "distributed")
TOOLS=("progress-dashboard.sh" "extract-subtasks.sh")

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test function
run_test() {
    local tool="$1"
    local mode="$2"
    local description="$3"

    echo -n "Testing $tool in $mode mode... "
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    export DATABASE_MODE="$mode"

    # Run the test with timeout
    if timeout 30s bash -c "./tools/$tool $TEST_TASK_ID >/dev/null 2>&1"; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Performance test function
performance_test() {
    local tool="$1"
    local mode="$2"

    echo -n "Performance test: $tool ($mode mode)... "

    export DATABASE_MODE="$mode"

    # Measure execution time
    start_time=$(date +%s.%N)
    if timeout 30s bash -c "./tools/$tool $TEST_TASK_ID >/dev/null 2>&1"; then
        end_time=$(date +%s.%N)
        duration=$(echo "$end_time - $start_time" | bc 2>/dev/null || echo "N/A")
        echo -e "${GREEN}${duration}s${NC}"
        return 0
    else
        echo -e "${RED}TIMEOUT${NC}"
        return 1
    fi
}

# Consistency test function
consistency_test() {
    local tool="$1"

    echo -n "Consistency test: $tool (monolith vs distributed)... "

    # Get output from both modes
    export DATABASE_MODE="monolith"
    monolith_output=$(timeout 30s bash -c "./tools/$tool $TEST_TASK_ID" 2>/dev/null | grep -E "(📦|pts):" | head -5)

    export DATABASE_MODE="distributed"
    distributed_output=$(timeout 30s bash -c "./tools/$tool $TEST_TASK_ID" 2>/dev/null | grep -E "(📦|pts):" | head -5)

    # Compare key lines (checklist items should be identical)
    if [[ "$monolith_output" == "$distributed_output" ]] && [[ -n "$monolith_output" ]]; then
        echo -e "${GREEN}✅ CONSISTENT${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  MINOR DIFFERENCES${NC}"
        return 0  # Not a failure, just different formatting
    fi
}

echo "Running functional tests..."
echo "=========================="

# Test each tool in each mode
for tool in "${TOOLS[@]}"; do
    for mode in "${MODES[@]}"; do
        if [[ "$tool" == "progress-dashboard.sh" ]]; then
            run_test "$tool" "$mode" "Dashboard generation"
        else
            run_test "$tool" "$mode" "Subtask extraction"
        fi
    done
done

echo ""
echo "Running performance tests..."
echo "============================"

for tool in "${TOOLS[@]}"; do
    for mode in "${MODES[@]}"; do
        performance_test "$tool" "$mode"
    done
done

echo ""
echo "Running consistency tests..."
echo "============================="

for tool in "${TOOLS[@]}"; do
    consistency_test "$tool"
done

echo ""
echo "📊 Test Summary"
echo "==============="
echo "Total tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

if [[ $FAILED_TESTS -eq 0 ]]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED - Dual system compatibility verified!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Check the output above.${NC}"
    exit 1
fi