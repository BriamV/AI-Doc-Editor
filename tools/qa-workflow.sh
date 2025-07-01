#!/bin/bash
# QA Workflow Manager - Extended Task Status Management
# Usage: ./tools/qa-workflow.sh <TASK_ID> <ACTION> [REASON]

TASK_ID="${1:-}"
ACTION="${2:-}"
REASON="${3:-}"
FILE="docs/Sub Tareas v2.md"

# Estado mapping with emojis
declare -A STATES=(
    ["pending"]="⏳ Pendiente"
    ["in-progress"]="🔄 En progreso"
    ["dev-complete"]="🚧 Desarrollo Completado - Listo para QA"
    ["qa-testing"]="🧪 En QA/Testing"
    ["qa-failed"]="❌ QA Failed - Requiere correcciones"
    ["qa-passed"]="✅ QA Passed - Listo para Review"
    ["review"]="📋 En Review"
    ["review-failed"]="❌ Review Failed - Requiere cambios"
    ["completed"]="✅ Completado 100% - DoD Satisfied"
)

if [[ -z "$TASK_ID" || -z "$ACTION" ]]; then
    echo "❌ Usage: $0 <TASK_ID> <ACTION> [REASON]"
    echo ""
    echo "📋 Available Actions:"
    echo "  dev-complete     - Mark development as complete, ready for QA"
    echo "  start-qa         - Start QA/Testing phase"
    echo "  qa-passed        - QA validation passed"
    echo "  qa-failed        - QA validation failed (requires reason)"
    echo "  start-review     - Start code review phase"
    echo "  review-passed    - Review approved"
    echo "  review-failed    - Review failed (requires reason)"
    echo "  mark-complete    - Mark as fully complete (DoD satisfied)"
    echo ""
    echo "📊 Current States Available:"
    for key in "${!STATES[@]}"; do
        echo "  $key: ${STATES[$key]}"
    done
    exit 1
fi

if [[ ! -f "$FILE" ]]; then
    echo "❌ File not found: $FILE"
    exit 1
fi

# Validate task exists
if ! grep -q "### \*\*Tarea ${TASK_ID}:" "$FILE"; then
    echo "❌ Task $TASK_ID not found"
    exit 1
fi

# Create backup
cp "$FILE" "${FILE}.backup.$(date +%Y%m%d_%H%M%S)"

case "$ACTION" in
    "dev-complete")
        NEW_STATUS="${STATES[dev-complete]}"
        echo "🚧 Marking $TASK_ID as development complete - ready for QA"
        ;;
    "start-qa")
        NEW_STATUS="${STATES[qa-testing]}"
        echo "🧪 Starting QA phase for $TASK_ID"
        ;;
    "qa-passed")
        NEW_STATUS="${STATES[qa-passed]}"
        echo "✅ QA passed for $TASK_ID - ready for review"
        ;;
    "qa-failed")
        if [[ -z "$REASON" ]]; then
            echo "❌ QA failed action requires a reason"
            exit 1
        fi
        NEW_STATUS="${STATES[qa-failed]} - ${REASON}"
        echo "❌ QA failed for $TASK_ID: $REASON"
        ;;
    "start-review")
        NEW_STATUS="${STATES[review]}"
        echo "📋 Starting review phase for $TASK_ID"
        ;;
    "review-passed")
        NEW_STATUS="${STATES[qa-passed]}"
        echo "✅ Review passed for $TASK_ID"
        ;;
    "review-failed")
        if [[ -z "$REASON" ]]; then
            echo "❌ Review failed action requires a reason"
            exit 1
        fi
        NEW_STATUS="${STATES[review-failed]} - ${REASON}"
        echo "❌ Review failed for $TASK_ID: $REASON"
        ;;
    "mark-complete")
        NEW_STATUS="${STATES[completed]}"
        echo "🎉 Marking $TASK_ID as fully complete (DoD satisfied)"
        ;;
    *)
        echo "❌ Unknown action: $ACTION"
        exit 1
        ;;
esac

# Update status
sed -i "/### \*\*Tarea ${TASK_ID}:/,/### \*\*Tarea/ {
    s/^- \*\*Estado:\*\* .*/- **Estado:** ${NEW_STATUS}/
}" "$FILE"

# Verify the change
if grep -A 20 "### \*\*Tarea ${TASK_ID}:" "$FILE" | grep -q "Estado:.*${NEW_STATUS}"; then
    echo "✅ Successfully updated $TASK_ID status"
    echo "📋 Current status:"
    grep -A 20 "### \*\*Tarea ${TASK_ID}:" "$FILE" | grep "Estado:" | head -1
    
    # Show next actions based on current state
    case "$ACTION" in
        "dev-complete")
            echo ""
            echo "💡 Next actions:"
            echo "  ./tools/qa-workflow.sh $TASK_ID start-qa"
            echo "  yarn run cmd qa-gate  # Run quality checks"
            ;;
        "qa-passed")
            echo ""
            echo "💡 Next actions:"
            echo "  ./tools/qa-workflow.sh $TASK_ID start-review"
            ;;
        "review-passed")
            echo ""
            echo "💡 Next actions:"
            echo "  ./tools/qa-workflow.sh $TASK_ID mark-complete"
            ;;
    esac
else
    echo "❌ Update may have failed. Please check manually."
fi