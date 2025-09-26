#!/bin/bash
# DoD (Definition of Done) Assistant Guide
# Usage: ./tools/validate-dod.sh T-02
# Purpose: Extract DoD criteria from task and guide developer on what to validate

TASK_ID="${1:-}"
FILE="docs/project-management/Sub Tareas v2.md"

if [[ -z "$TASK_ID" ]]; then
    echo "❌ Usage: $0 <TASK_ID>"
    echo "   Example: $0 T-02"
    exit 1
fi

if [[ ! -f "$FILE" ]]; then
    echo "❌ File not found: $FILE"
    exit 1
fi

echo "🔍 DoD Assistant Guide for Task $TASK_ID"
echo "=============================================="

# Extract DoD criteria from task
task_section=$(sed -n "/### \*\*Tarea ${TASK_ID}:/,/### \*\*Tarea/p" "$FILE")

if [[ -z "$task_section" ]]; then
    echo "❌ Task $TASK_ID not found in $FILE"
    exit 1
fi

# Extract DoD section
dod_section=$(echo "$task_section" | sed -n '/Definición de Hecho/,/#### \*\*Desglose/p' | head -n -1)

if [[ -z "$dod_section" ]]; then
    echo "❌ No DoD section found for task $TASK_ID"
    exit 1
fi

echo "📋 DoD Criteria for Task $TASK_ID:"
echo "=================================="

# Extract and display DoD criteria
echo "$dod_section" | grep -E "^[ ]*-" | while IFS= read -r criterion; do
    clean_criterion=$(echo "$criterion" | sed 's/^[ ]*-[ ]*//')
    echo "  • $clean_criterion"
done

echo ""
echo "🎯 Validation Guidance:"
echo "======================="

# Analyze each criterion and suggest validation commands
criterion_count=0
dod_criteria=$(echo "$dod_section" | grep -E "^[ ]*-" | sed 's/^[ ]*-[ ]*//')

while IFS= read -r criterion; do
    if [[ -n "$criterion" ]]; then
        ((criterion_count++))
        echo ""
        echo "[$criterion_count] 📝 Criterion: $criterion"
        echo "    Suggested validations:"
        
        # Pattern matching for validation suggestions
        case $(echo "$criterion" | tr '[:upper:]' '[:lower:]') in
            *"código revisado"*|*"code review"*|*"aprobado"*)
                echo "    ✓ Run: npx eslint . && npx prettier --check . (linting, formatting)"
                echo "    ✓ Check: Git commits follow conventional format"
                echo "    ✓ Verify: No TODO/FIXME comments in production code"
                ;;
            *"test"*|*"prueba"*)
                echo "    ✓ Run task-specific tests based on implementation:"
                if [[ "$TASK_ID" == "T-02" ]]; then
                    echo "      - python backend/test_backend.py (OAuth/JWT tests)"
                    echo "      - pytest backend/tests/test_config_api.py (API tests)"
                else
                    echo "      - yarn run cmd test (general tests)"
                    echo "      - Check: tests/ directory for task-specific tests"
                fi
                echo "    ✓ Verify: Test coverage for new functionality"
                ;;
            *"documentaci"*|*"documentation"*|*"api"*)
                echo "    ✓ Run: npx redocly lint docs/api-spec/openapi.yml"
                echo "    ✓ Check: API endpoints documented in OpenAPI spec"
                echo "    ✓ Verify: README.md updated if needed"
                if [[ "$TASK_ID" == "T-02" ]]; then
                    echo "    ✓ Confirm: /auth/* endpoints are documented"
                fi
                ;;
            *"integración"*|*"integration"*|*"usuario"*|*"user"*)
                echo "    ✓ Verify: Database migrations exist and run successfully"
                echo "    ✓ Check: Models/schemas are properly defined"
                echo "    ✓ Test: Integration with external services (if applicable)"
                if [[ "$TASK_ID" == "T-02" ]]; then
                    echo "    ✓ Confirm: OAuth providers integration works"
                    echo "    ✓ Check: User management endpoints function correctly"
                fi
                ;;
            *"seguridad"*|*"security"*)
                echo "    ✓ Run: npm audit && npx semgrep --config=auto ."
                echo "    ✓ Check: No secrets in code or logs"
                echo "    ✓ Verify: Authentication/authorization works correctly"
                if [[ "$TASK_ID" == "T-02" ]]; then
                    echo "    ✓ Test: JWT token validation and expiration"
                    echo "    ✓ Verify: OAuth state parameter CSRF protection"
                fi
                ;;
            *"subtarea"*|*"subtask"*)
                echo "    ✓ Use: ./tools/mark-subtask-complete.sh $TASK_ID <SUBTASK_ID>"
                echo "    ✓ Verify: All subtasks show ✅ in task table"
                ;;
            *)
                echo "    ✓ Manual verification required for this criterion"
                echo "    ✓ Review task implementation against this requirement"
                ;;
        esac
    fi
done <<< "$dod_criteria"

echo ""
echo "📊 Subtasks Status Check:"
echo "========================="

# Check subtasks completion
total_subtasks=$(echo "$task_section" | grep -c "R[0-9]*\.WP[0-9]*-T${TASK_ID#T-}-ST[0-9]*")
completed_subtasks=$(echo "$task_section" | grep -c "✅.*T${TASK_ID#T-}-ST")

echo "Subtasks: $completed_subtasks/$total_subtasks completed"

if [[ $total_subtasks -eq 0 ]]; then
    echo "⚠️  No subtasks found for task $TASK_ID"
elif [[ $total_subtasks -eq $completed_subtasks ]]; then
    echo "✅ All subtasks completed"
else
    echo "📋 Pending subtasks:"
    pending_subtasks=$(echo "$task_section" | grep -E "R[0-9]*\.WP[0-9]*-T${TASK_ID#T-}-ST[0-9]*" | grep -v "✅")
    if [[ -n "$pending_subtasks" ]]; then
        echo "$pending_subtasks" | head -3 | sed 's/^/  /'
        if [[ $(echo "$pending_subtasks" | wc -l) -gt 3 ]]; then
            echo "  ... and $(($(echo "$pending_subtasks" | wc -l) - 3)) more"
        fi
    fi
    echo ""
    echo "💡 To mark subtasks complete:"
    echo "  ./tools/mark-subtask-complete.sh $TASK_ID R0.WP2-T${TASK_ID#T-}-ST1"
fi

echo ""
echo "🚀 Next Steps:"
echo "=============="
echo "1. Execute the suggested validation commands above"
echo "2. Mark subtasks as complete when finished"
echo "3. Re-run this guide to check progress: ./tools/validate-dod.sh $TASK_ID"
echo "4. When all criteria are satisfied, use:"
echo "   ./tools/qa-workflow.sh $TASK_ID qa-passed"
echo "   ./tools/qa-workflow.sh $TASK_ID mark-complete"

echo ""
echo "📖 Additional Resources:"
echo "   tools/README.md - Development workflow documentation"
echo "   docs/CONTRIBUTING.md - Contribution guidelines"
echo "   CLAUDE.md - Development commands reference"