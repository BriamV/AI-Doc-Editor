#!/bin/bash
# Enhanced DoD (Definition of Done) Validator with Detailed Output
# Usage: ./tools/validate-dod-enhanced.sh T-02

TASK_ID="${1:-}"
FILE="docs/Sub Tareas v2.md"

if [[ -z "$TASK_ID" ]]; then
    echo "❌ Usage: $0 <TASK_ID>"
    echo "   Example: $0 T-02"
    exit 1
fi

if [[ ! -f "$FILE" ]]; then
    echo "❌ File not found: $FILE"
    exit 1
fi

echo "🔍 Validating DoD (Definition of Done) for Task $TASK_ID"
echo "=================================================="

# Extract DoD criteria from task
dod_section=$(sed -n "/### \*\*Tarea ${TASK_ID}:/,/### \*\*Tarea/p" "$FILE" | sed -n '/Definición de Hecho/,/#### \*\*Desglose/p' | head -n -1)

if [[ -z "$dod_section" ]]; then
    echo "❌ No DoD section found for task $TASK_ID"
    exit 1
fi

echo "📋 DoD Criteria Found:"
echo "$dod_section" | grep -E "^[ ]*-" | while read -r criterion; do
    echo "  $criterion"
done

echo ""
echo "🧪 Automated Validations:"
echo "========================="

# Initialize counters
total_checks=5
passed_checks=0
failed_checks=0

# Check 1: Task-Specific Validation
echo "1. 🔍 Task-Specific Validation ($TASK_ID):"
echo "   Command: yarn run cmd validate-task"
echo -n "   Status: "

# Capture both exit code and output
qa_output=$(yarn run cmd validate-task 2>&1)
qa_exit_code=$?

if [[ $qa_exit_code -eq 0 ]]; then
    echo "✅ PASSED"
    ((passed_checks++))
else
    echo "❌ FAILED"
    echo "   ⚠️  Error Details:"
    echo "$qa_output" | head -10 | sed 's/^/      /'
    if [[ $(echo "$qa_output" | wc -l) -gt 10 ]]; then
        echo "      ... (truncated, run 'yarn run cmd validate-task' for full output)"
    fi
    ((failed_checks++))
fi
echo ""

# Check 2: Staged Changes Validation
echo "2. 🧪 Staged Changes Validation:"
echo "   Command: yarn run cmd validate-staged"
echo -n "   Status: "

test_output=$(yarn run cmd validate-staged 2>&1)
test_exit_code=$?

if [[ $test_exit_code -eq 0 ]]; then
    echo "✅ PASSED"
    # Show test summary if available
    test_summary=$(echo "$test_output" | grep -E "(Tests:|passed|failed|skipped)" | tail -3)
    if [[ -n "$test_summary" ]]; then
        echo "   📊 Test Summary:"
        echo "$test_summary" | sed 's/^/      /'
    fi
    ((passed_checks++))
else
    echo "❌ FAILED"
    echo "   ⚠️  Error Details:"
    # Show failing tests
    failing_tests=$(echo "$test_output" | grep -E "(FAIL|Error:|✗|×)" | head -5)
    if [[ -n "$failing_tests" ]]; then
        echo "$failing_tests" | sed 's/^/      /'
    else
        echo "$test_output" | head -8 | sed 's/^/      /'
    fi
    echo "      💡 Run 'yarn run cmd validate-staged' for detailed validation results"
    ((failed_checks++))
fi
echo ""

# Check 3: Modified Files Validation
echo "3. 🔒 Modified Files Validation:"
echo "   Command: yarn run cmd validate-modified"
echo -n "   Status: "

security_output=$(yarn run cmd validate-modified 2>&1)
security_exit_code=$?

if [[ $security_exit_code -eq 0 ]]; then
    echo "✅ PASSED"
    # Show security summary if available
    security_summary=$(echo "$security_output" | grep -E "(vulnerabilities|found|HIGH|CRITICAL)" | head -2)
    if [[ -n "$security_summary" ]]; then
        echo "   🛡️  Security Summary:"
        echo "$security_summary" | sed 's/^/      /'
    fi
    ((passed_checks++))
else
    echo "❌ FAILED"
    echo "   ⚠️  Security Issues Found:"
    # Show security vulnerabilities
    security_issues=$(echo "$security_output" | grep -E "(HIGH|CRITICAL|MODERATE)" | head -5)
    if [[ -n "$security_issues" ]]; then
        echo "$security_issues" | sed 's/^/      /'
    else
        echo "$security_output" | head -6 | sed 's/^/      /'
    fi
    echo "      🔒 Run 'yarn run cmd validate-modified' for detailed validation report"
    ((failed_checks++))
fi
echo ""

# Check 4: Governance & Traceability
echo "4. 📋 Governance & Traceability:"
echo "   Command: yarn run cmd governance --format=md"
echo -n "   Status: "

build_output=$(yarn run cmd governance --format=md 2>&1)
build_exit_code=$?

if [[ $build_exit_code -eq 0 ]]; then
    echo "✅ PASSED"
    # Show build info if available
    governance_info=$(echo "$build_output" | grep -E "(Verificaciones|Trazabilidad|completada)" | tail -2)
    if [[ -n "$governance_info" ]]; then
        echo "   📋 Governance Info:"
        echo "$governance_info" | sed 's/^/      /'
    fi
    ((passed_checks++))
else
    echo "❌ FAILED"
    echo "   ⚠️  Governance Errors:"
    # Show governance errors
    governance_errors=$(echo "$build_output" | grep -E "(Error|error|ERROR|failed)" | head -5)
    if [[ -n "$governance_errors" ]]; then
        echo "$governance_errors" | sed 's/^/      /'
    else
        echo "$build_output" | head -8 | sed 's/^/      /'
    fi
    echo "      📋 Run 'yarn run cmd governance --format=md' for detailed governance output"
    ((failed_checks++))
fi
echo ""

# Check 5: Subtasks Completion
echo "5. ✅ Subtasks Completion:"
task_section=$(sed -n "/### \*\*Tarea ${TASK_ID}:/,/### \*\*Tarea/p" "$FILE")
total_subtasks=$(echo "$task_section" | grep -c "R[0-9]*\.WP[0-9]*-T${TASK_ID#T-}-ST[0-9]*")
completed_subtasks=$(echo "$task_section" | grep -c "✅.*T${TASK_ID#T-}-ST")

echo "   Checking subtask completion status..."
echo -n "   Status: "

if [[ $total_subtasks -eq 0 ]]; then
    echo "⚠️  NO SUBTASKS FOUND"
    echo "   📝 Task $TASK_ID has no defined subtasks"
    # Don't count this as pass or fail if no subtasks exist
elif [[ $total_subtasks -eq $completed_subtasks ]]; then
    echo "✅ PASSED ($completed_subtasks/$total_subtasks)"
    echo "   🎯 All subtasks completed successfully"
    ((passed_checks++))
else
    echo "❌ FAILED ($completed_subtasks/$total_subtasks)"
    echo "   📋 Pending subtasks:"
    # Show which subtasks are not completed
    pending_subtasks=$(echo "$task_section" | grep -E "R[0-9]*\.WP[0-9]*-T${TASK_ID#T-}-ST[0-9]*" | grep -v "✅")
    if [[ -n "$pending_subtasks" ]]; then
        echo "$pending_subtasks" | head -3 | sed 's/^/      /'
        if [[ $(echo "$pending_subtasks" | wc -l) -gt 3 ]]; then
            echo "      ... and $(($(echo "$pending_subtasks" | wc -l) - 3)) more"
        fi
    fi
    echo "      💡 Use './tools/mark-subtask-complete.sh $TASK_ID <SUBTASK_ID>' to mark subtasks"
    ((failed_checks++))
fi
echo ""

echo "=========================================="
echo "📊 DoD Validation Summary:"
echo "=========================================="

# Calculate percentages
pass_percentage=$(( (passed_checks * 100) / total_checks ))
fail_percentage=$(( (failed_checks * 100) / total_checks ))

echo "✅ Passed: $passed_checks/$total_checks ($pass_percentage%)"
echo "❌ Failed: $failed_checks/$total_checks ($fail_percentage%)"

# Overall status with visual indicator
if [[ $failed_checks -eq 0 ]]; then
    echo ""
    echo "🎉 ✅ ALL DoD CRITERIA SATISFIED"
    echo "🏆 Task $TASK_ID is ready to be marked as 'Completado 100%'"
    echo ""
    echo "💡 Next command:"
    echo "  ./tools/qa-workflow.sh $TASK_ID mark-complete"
    echo ""
    echo "🚀 Task completion workflow:"
    echo "  1. ./tools/qa-workflow.sh $TASK_ID qa-passed"
    echo "  2. ./tools/qa-workflow.sh $TASK_ID mark-complete"
    exit 0
else
    echo ""
    echo "❌ DoD VALIDATION FAILED"
    echo "🚨 $failed_checks critical issue(s) must be resolved before task completion"
    echo ""
    echo "🔧 Priority Actions Required:"
    
    # Give specific action items based on what failed
    if [[ $qa_exit_code -ne 0 ]]; then
        echo "  1. 🔍 Fix task-specific validation issues:"
        echo "     yarn run cmd validate-task"
        echo "     (Check task-specific linting, formatting, type errors)"
    fi
    
    if [[ $test_exit_code -ne 0 ]]; then
        echo "  2. 🧪 Fix staged changes validation:"
        echo "     yarn run cmd validate-staged"
        echo "     (Review staged changes validation failures)"
    fi
    
    if [[ $security_exit_code -ne 0 ]]; then
        echo "  3. 🔒 Fix modified files validation:"
        echo "     yarn run cmd validate-modified"
        echo "     (Fix validation issues in modified files)"
    fi
    
    if [[ $build_exit_code -ne 0 ]]; then
        echo "  4. 📋 Fix governance/traceability issues:"
        echo "     yarn run cmd governance --format=md"
        echo "     (Resolve traceability and governance issues)"
    fi
    
    if [[ $total_subtasks -gt $completed_subtasks && $total_subtasks -gt 0 ]]; then
        echo "  5. ✅ Complete pending subtasks:"
        echo "     ./tools/mark-subtask-complete.sh $TASK_ID <SUBTASK_ID>"
        echo "     (Complete remaining development tasks)"
        echo "     Example: ./tools/mark-subtask-complete.sh $TASK_ID R0.WP2-T${TASK_ID#T-}-ST1"
    fi
    
    echo ""
    echo "💡 After resolving issues, re-run validation:"
    echo "  ./tools/validate-dod.sh $TASK_ID"
    echo ""
    echo "📖 For help with specific commands, check:"
    echo "  tools/README.md (Development workflow documentation)"
    exit 1
fi