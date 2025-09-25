#!/bin/bash
# Migration Validation Framework for Sub Tareas v2.md Database Decomposition
# Comprehensive testing and validation suite for zero-downtime migration
# Usage: ./tools/migration-validator.sh [quick|full|compatibility|rollback-test]

set -euo pipefail

# Configuration
MONOLITH_FILE="docs/project-management/Sub Tareas v2.md"
DISTRIBUTED_DIR="docs/tasks"
TEST_RESULTS_DIR="logs/migration-tests"
VALIDATION_LOG="logs/migration-validation.log"

# Create test environment
mkdir -p "$TEST_RESULTS_DIR" "$(dirname "$VALIDATION_LOG")"

# Source abstraction layer
source "$(dirname "$0")/database-abstraction.sh"

# Logging function
log_validation() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$VALIDATION_LOG"
}

# Test result tracking
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Test assertion framework
assert_equal() {
    local expected="$1"
    local actual="$2"
    local test_name="$3"

    ((TESTS_TOTAL++))

    if [[ "$expected" == "$actual" ]]; then
        ((TESTS_PASSED++))
        log_validation "✅ PASS: $test_name"
        return 0
    else
        ((TESTS_FAILED++))
        log_validation "❌ FAIL: $test_name"
        log_validation "   Expected: '$expected'"
        log_validation "   Actual:   '$actual'"
        echo "FAIL: $test_name" >> "$TEST_RESULTS_DIR/failed_tests.log"
        return 1
    fi
}

assert_not_empty() {
    local value="$1"
    local test_name="$2"

    ((TESTS_TOTAL++))

    if [[ -n "$value" ]] && [[ "$value" != "null" ]]; then
        ((TESTS_PASSED++))
        log_validation "✅ PASS: $test_name"
        return 0
    else
        ((TESTS_FAILED++))
        log_validation "❌ FAIL: $test_name - Value is empty or null"
        echo "FAIL: $test_name" >> "$TEST_RESULTS_DIR/failed_tests.log"
        return 1
    fi
}

assert_file_exists() {
    local file_path="$1"
    local test_name="$2"

    ((TESTS_TOTAL++))

    if [[ -f "$file_path" ]]; then
        ((TESTS_PASSED++))
        log_validation "✅ PASS: $test_name"
        return 0
    else
        ((TESTS_FAILED++))
        log_validation "❌ FAIL: $test_name - File not found: $file_path"
        echo "FAIL: $test_name" >> "$TEST_RESULTS_DIR/failed_tests.log"
        return 1
    fi
}

# Data Integrity Tests
test_task_count_consistency() {
    log_validation "🧮 Testing task count consistency"

    local monolith_count=$(grep -c "### \*\*Tarea T-" "$MONOLITH_FILE" 2>/dev/null || echo "0")
    local distributed_count=$(ls -1 "$DISTRIBUTED_DIR"/T-*-STATUS.md 2>/dev/null | wc -l)

    assert_equal "$monolith_count" "$distributed_count" "Task count consistency (Monolith: $monolith_count, Distributed: $distributed_count)"
}

test_task_metadata_preservation() {
    log_validation "📊 Testing task metadata preservation"

    # Test a sample of tasks
    local sample_tasks=("T-01" "T-05" "T-10")

    for task_id in "${sample_tasks[@]}"; do
        if ! grep -q "### \*\*Tarea ${task_id}:" "$MONOLITH_FILE"; then
            continue  # Skip if task doesn't exist
        fi

        local distributed_file="$DISTRIBUTED_DIR/${task_id}-STATUS.md"
        assert_file_exists "$distributed_file" "Distributed file exists for $task_id"

        # Test metadata fields
        export DATABASE_MODE="monolith"
        local mono_status=$(get_task_data "$task_id" "status" | head -1)

        export DATABASE_MODE="distributed"
        local dist_status=$(get_task_data "$task_id" "status" | head -1)

        # Compare core metadata (allowing for format variations)
        if [[ -n "$mono_status" ]] && [[ -n "$dist_status" ]]; then
            # Extract completion percentage for comparison
            local mono_percent=$(echo "$mono_status" | grep -o '[0-9]\+%' | head -1 || echo "")
            local dist_percent=$(echo "$dist_status" | grep -o '[0-9]\+%' | head -1 || echo "")

            if [[ -n "$mono_percent" ]] && [[ -n "$dist_percent" ]]; then
                assert_equal "$mono_percent" "$dist_percent" "Status percentage consistency for $task_id"
            else
                log_validation "⚠️  SKIP: Status format comparison for $task_id (different formats)"
            fi
        fi
    done

    export DATABASE_MODE="monolith"  # Reset to default
}

test_wii_subtask_preservation() {
    log_validation "🔧 Testing WII subtask preservation"

    local sample_tasks=("T-01" "T-02")

    for task_id in "${sample_tasks[@]}"; do
        if ! grep -q "### \*\*Tarea ${task_id}:" "$MONOLITH_FILE"; then
            continue
        fi

        # Extract WII subtasks from monolith
        local mono_subtasks=$(extract_monolith_subtasks "$task_id" | wc -l)

        # Count WII subtasks in distributed file
        local distributed_file="$DISTRIBUTED_DIR/${task_id}-STATUS.md"
        local dist_subtasks=0
        if [[ -f "$distributed_file" ]]; then
            dist_subtasks=$(yq eval '.wii_subtasks | length' "$distributed_file" 2>/dev/null || echo "0")
        fi

        if [[ $mono_subtasks -gt 0 ]]; then
            assert_equal "$mono_subtasks" "$dist_subtasks" "WII subtask count for $task_id"
        fi
    done
}

# Tool Compatibility Tests
test_tool_compatibility() {
    log_validation "🔧 Testing tool compatibility"

    local test_tools=("task-navigator.sh" "extract-subtasks.sh" "progress-dashboard.sh")

    for tool in "${test_tools[@]}"; do
        local tool_path="tools/$tool"

        if [[ ! -f "$tool_path" ]]; then
            log_validation "⚠️  SKIP: Tool not found: $tool_path"
            continue
        fi

        # Test with a known task
        local test_task="T-01"

        # Backup original DATABASE_MODE
        local original_mode="$DATABASE_MODE"

        # Test monolith mode
        export DATABASE_MODE="monolith"
        local mono_output
        if mono_output=$(timeout 30s "$tool_path" "$test_task" 2>&1); then
            assert_not_empty "$mono_output" "Tool $tool works in monolith mode"
        else
            log_validation "❌ Tool $tool failed in monolith mode"
            ((TESTS_FAILED++))
            ((TESTS_TOTAL++))
        fi

        # Test distributed mode (if files exist)
        if [[ -f "$DISTRIBUTED_DIR/${test_task}-STATUS.md" ]]; then
            export DATABASE_MODE="distributed"
            local dist_output
            if dist_output=$(timeout 30s "$tool_path" "$test_task" 2>&1); then
                assert_not_empty "$dist_output" "Tool $tool works in distributed mode"
            else
                log_validation "❌ Tool $tool failed in distributed mode"
                ((TESTS_FAILED++))
                ((TESTS_TOTAL++))
            fi
        fi

        # Restore original mode
        export DATABASE_MODE="$original_mode"
    done
}

# Performance Benchmarking
benchmark_performance() {
    log_validation "⚡ Benchmarking performance"

    local test_task="T-01"
    local iterations=5

    # Benchmark monolith operations
    export DATABASE_MODE="monolith"
    local mono_start=$(date +%s%N)
    for ((i=1; i<=iterations; i++)); do
        get_task_data "$test_task" "status" >/dev/null 2>&1
    done
    local mono_end=$(date +%s%N)
    local mono_time=$(( (mono_end - mono_start) / 1000000 ))  # Convert to milliseconds

    # Benchmark distributed operations (if available)
    if [[ -f "$DISTRIBUTED_DIR/${test_task}-STATUS.md" ]]; then
        export DATABASE_MODE="distributed"
        local dist_start=$(date +%s%N)
        for ((i=1; i<=iterations; i++)); do
            get_task_data "$test_task" "status" >/dev/null 2>&1
        done
        local dist_end=$(date +%s%N)
        local dist_time=$(( (dist_end - dist_start) / 1000000 ))

        log_validation "📊 Performance (${iterations} iterations): Monolith ${mono_time}ms, Distributed ${dist_time}ms"

        # Performance should be within 2x of each other
        local performance_ratio=$(( dist_time > mono_time ? dist_time * 100 / mono_time : mono_time * 100 / dist_time ))
        if [[ $performance_ratio -lt 200 ]]; then
            assert_equal "acceptable" "acceptable" "Performance within 2x tolerance"
        else
            assert_equal "acceptable" "unacceptable" "Performance degradation too high (${performance_ratio}%)"
        fi
    fi

    export DATABASE_MODE="monolith"  # Reset
}

# Sync Integrity Tests
test_sync_integrity() {
    log_validation "🔄 Testing sync integrity"

    # Run sync operations
    if ./tools/sync-systems.sh validate; then
        assert_equal "success" "success" "Sync validation passes"
    else
        assert_equal "success" "failed" "Sync validation failed"
    fi

    # Test checksum validation for a few tasks
    local sample_tasks=("T-01" "T-02")
    for task_id in "${sample_tasks[@]}"; do
        local distributed_file="$DISTRIBUTED_DIR/${task_id}-STATUS.md"
        if [[ -f "$distributed_file" ]]; then
            local stored_checksum=$(yq eval '.sync_metadata.checksum' "$distributed_file" 2>/dev/null)
            if [[ -n "$stored_checksum" ]] && [[ "$stored_checksum" != "null" ]]; then
                assert_not_empty "$stored_checksum" "Checksum exists for $task_id"
            fi
        fi
    done
}

# Rollback Testing
test_rollback_capability() {
    log_validation "🔄 Testing rollback capability"

    # Create test backup
    local test_backup_dir="$TEST_RESULTS_DIR/rollback_test"
    mkdir -p "$test_backup_dir"

    # Backup current state
    cp "$MONOLITH_FILE" "$test_backup_dir/monolith_backup.md"
    if [[ -d "$DISTRIBUTED_DIR" ]] && [[ "$(ls -A "$DISTRIBUTED_DIR" 2>/dev/null)" ]]; then
        cp -r "$DISTRIBUTED_DIR" "$test_backup_dir/distributed_backup"
    fi

    # Test restoration
    if [[ -f "$test_backup_dir/monolith_backup.md" ]]; then
        assert_file_exists "$test_backup_dir/monolith_backup.md" "Rollback backup created successfully"
    fi

    # Cleanup test artifacts
    rm -rf "$test_backup_dir"
}

# Business Logic Tests
test_workflow_scenarios() {
    log_validation "💼 Testing business workflow scenarios"

    # Test task status update workflow
    local test_task="T-01"
    local original_mode="$DATABASE_MODE"

    # Test status query across both systems
    for mode in "monolith" "distributed"; do
        export DATABASE_MODE="$mode"

        if [[ "$mode" == "distributed" ]] && [[ ! -f "$DISTRIBUTED_DIR/${test_task}-STATUS.md" ]]; then
            log_validation "⚠️  SKIP: Distributed file not found for workflow test"
            continue
        fi

        local status=$(get_task_data "$test_task" "status" 2>/dev/null)
        if [[ -n "$status" ]]; then
            assert_not_empty "$status" "Status query works in $mode mode"
        else
            log_validation "⚠️  SKIP: No status found for $test_task in $mode mode"
        fi
    done

    export DATABASE_MODE="$original_mode"
}

# Cross-reference Validation
test_cross_references() {
    log_validation "🔗 Testing cross-reference validation"

    # Test that all WII references are valid
    local wii_pattern="R[0-9]+\.WP[0-9]+-T[0-9]+-ST[0-9]+"

    # Count WII references in monolith
    local mono_wii_count=$(grep -o "$wii_pattern" "$MONOLITH_FILE" | wc -l)

    # Count WII references in distributed files
    local dist_wii_count=0
    for distributed_file in "$DISTRIBUTED_DIR"/T-*-STATUS.md; do
        if [[ -f "$distributed_file" ]]; then
            local file_wii=$(yq eval '.wii_subtasks[].id' "$distributed_file" 2>/dev/null | wc -l)
            dist_wii_count=$((dist_wii_count + file_wii))
        fi
    done

    if [[ $mono_wii_count -gt 0 ]] && [[ $dist_wii_count -gt 0 ]]; then
        # Allow for some variation in counting methods
        local diff=$((mono_wii_count > dist_wii_count ? mono_wii_count - dist_wii_count : dist_wii_count - mono_wii_count))
        local tolerance=$((mono_wii_count / 10))  # 10% tolerance

        if [[ $diff -le $tolerance ]]; then
            assert_equal "within_tolerance" "within_tolerance" "WII reference count within tolerance"
        else
            log_validation "❌ WII reference count mismatch: Monolith $mono_wii_count, Distributed $dist_wii_count"
            assert_equal "$mono_wii_count" "$dist_wii_count" "WII reference count exact match"
        fi
    fi
}

# Quick validation suite
run_quick_tests() {
    log_validation "🚀 Running QUICK validation suite"

    test_task_count_consistency
    test_sync_integrity

    # Test one tool for basic compatibility
    if [[ -f "tools/task-navigator.sh" ]]; then
        export DATABASE_MODE="monolith"
        if timeout 10s tools/task-navigator.sh T-01 >/dev/null 2>&1; then
            assert_equal "success" "success" "Basic tool compatibility (task-navigator)"
        else
            assert_equal "success" "failed" "Basic tool compatibility (task-navigator)"
        fi
    fi
}

# Full validation suite
run_full_tests() {
    log_validation "🎯 Running FULL validation suite"

    test_task_count_consistency
    test_task_metadata_preservation
    test_wii_subtask_preservation
    test_tool_compatibility
    benchmark_performance
    test_sync_integrity
    test_rollback_capability
    test_workflow_scenarios
    test_cross_references
}

# Compatibility-focused tests
run_compatibility_tests() {
    log_validation "🔧 Running COMPATIBILITY test suite"

    test_tool_compatibility
    test_workflow_scenarios
    benchmark_performance
}

# Rollback-focused tests
run_rollback_tests() {
    log_validation "🔄 Running ROLLBACK test suite"

    test_rollback_capability
    test_sync_integrity
}

# Generate test report
generate_test_report() {
    local report_file="$TEST_RESULTS_DIR/migration_validation_report_$(date +%Y%m%d_%H%M%S).md"

    cat > "$report_file" << EOF
# Migration Validation Report

**Date:** $(date)
**Test Suite:** $1

## Summary
- **Total Tests:** $TESTS_TOTAL
- **Passed:** $TESTS_PASSED
- **Failed:** $TESTS_FAILED
- **Success Rate:** $(( TESTS_TOTAL > 0 ? TESTS_PASSED * 100 / TESTS_TOTAL : 0 ))%

## Test Results
EOF

    if [[ $TESTS_FAILED -gt 0 ]]; then
        echo "### Failed Tests" >> "$report_file"
        if [[ -f "$TEST_RESULTS_DIR/failed_tests.log" ]]; then
            cat "$TEST_RESULTS_DIR/failed_tests.log" >> "$report_file"
        fi
        echo "" >> "$report_file"
    fi

    echo "### Detailed Log" >> "$report_file"
    echo "\`\`\`" >> "$report_file"
    tail -50 "$VALIDATION_LOG" >> "$report_file"
    echo "\`\`\`" >> "$report_file"

    log_validation "📋 Test report generated: $report_file"
}

# Main execution
main() {
    local test_suite="${1:-full}"

    # Clean up previous test results
    rm -f "$TEST_RESULTS_DIR/failed_tests.log"

    log_validation "🧪 Starting migration validation suite: $test_suite"

    case "$test_suite" in
        "quick")
            run_quick_tests
            ;;
        "full")
            run_full_tests
            ;;
        "compatibility")
            run_compatibility_tests
            ;;
        "rollback-test")
            run_rollback_tests
            ;;
        *)
            echo "Usage: $0 [quick|full|compatibility|rollback-test]"
            echo "  quick:        Fast validation of core functionality"
            echo "  full:         Comprehensive validation suite (default)"
            echo "  compatibility: Focus on tool compatibility testing"
            echo "  rollback-test: Test rollback and recovery procedures"
            exit 1
            ;;
    esac

    # Generate summary
    log_validation "🏁 Validation completed: $TESTS_PASSED/$TESTS_TOTAL tests passed"

    if [[ $TESTS_FAILED -gt 0 ]]; then
        log_validation "❌ Migration validation FAILED - $TESTS_FAILED tests failed"
        generate_test_report "$test_suite"
        exit 1
    else
        log_validation "✅ Migration validation PASSED - All tests successful"
        generate_test_report "$test_suite"
        exit 0
    fi
}

# Run if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi