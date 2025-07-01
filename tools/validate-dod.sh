#!/bin/bash
# DoD (Definition of Done) Validator
# Usage: ./tools/validate-dod.sh T-02

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

# Check 1: Code Quality (qa-gate)
echo -n "1. 🔍 Code Quality (qa-gate): "
if yarn run cmd qa-gate --silent 2>/dev/null >/dev/null; then
    echo "✅ PASSED"
    quality_status="PASSED"
else
    echo "❌ FAILED"
    quality_status="FAILED"
fi

# Check 2: Tests Status
echo -n "2. 🧪 Tests Status: "
if yarn run cmd test --silent 2>/dev/null >/dev/null; then
    echo "✅ PASSED"
    test_status="PASSED"
else
    echo "❌ FAILED"
    test_status="FAILED"
fi

# Check 3: Security Scan
echo -n "3. 🔒 Security Scan: "
if yarn run cmd security-scan --silent 2>/dev/null >/dev/null; then
    echo "✅ PASSED"
    security_status="PASSED"
else
    echo "❌ FAILED"
    security_status="FAILED"
fi

# Check 4: Build Status
echo -n "4. 🏗️ Build Status: "
if yarn run cmd build --silent 2>/dev/null >/dev/null; then
    echo "✅ PASSED"
    build_status="PASSED"
else
    echo "❌ FAILED"
    build_status="FAILED"
fi

# Check 5: Subtasks Completion
echo -n "5. ✅ Subtasks Completion: "
task_section=$(sed -n "/### \*\*Tarea ${TASK_ID}:/,/### \*\*Tarea/p" "$FILE")
total_subtasks=$(echo "$task_section" | grep -c "R[0-9]*\.WP[0-9]*-${TASK_ID}-ST[0-9]*")
completed_subtasks=$(echo "$task_section" | grep -c "✅.*${TASK_ID}-ST")

if [[ $total_subtasks -eq $completed_subtasks ]]; then
    echo "✅ PASSED ($completed_subtasks/$total_subtasks)"
    subtasks_status="PASSED"
else
    echo "❌ FAILED ($completed_subtasks/$total_subtasks)"
    subtasks_status="FAILED"
fi

echo ""
echo "📊 DoD Validation Summary:"
echo "=========================="

# Calculate overall status
failed_checks=0
[[ "$quality_status" == "FAILED" ]] && ((failed_checks++))
[[ "$test_status" == "FAILED" ]] && ((failed_checks++))
[[ "$security_status" == "FAILED" ]] && ((failed_checks++))
[[ "$build_status" == "FAILED" ]] && ((failed_checks++))
[[ "$subtasks_status" == "FAILED" ]] && ((failed_checks++))

if [[ $failed_checks -eq 0 ]]; then
    echo "🎉 ✅ ALL DoD CRITERIA SATISFIED"
    echo "📋 Task $TASK_ID is ready to be marked as 'Completado 100%'"
    echo ""
    echo "💡 Next command:"
    echo "  ./tools/qa-workflow.sh $TASK_ID mark-complete"
    exit 0
else
    echo "❌ DoD VALIDATION FAILED ($failed_checks/5 checks failed)"
    echo ""
    echo "🔧 Required Actions:"
    [[ "$quality_status" == "FAILED" ]] && echo "  - Fix code quality issues: yarn run cmd qa-gate"
    [[ "$test_status" == "FAILED" ]] && echo "  - Fix failing tests: yarn run cmd test"
    [[ "$security_status" == "FAILED" ]] && echo "  - Fix security issues: yarn run cmd security-scan"
    [[ "$build_status" == "FAILED" ]] && echo "  - Fix build errors: yarn run cmd build"
    [[ "$subtasks_status" == "FAILED" ]] && echo "  - Complete remaining subtasks: $((total_subtasks - completed_subtasks)) pending"
    
    echo ""
    echo "💡 After fixes, re-run validation:"
    echo "  ./tools/validate-dod.sh $TASK_ID"
    exit 1
fi