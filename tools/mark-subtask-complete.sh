#!/bin/bash
# Subtask Completion Marker
# Usage: ./tools/mark-subtask-complete.sh T-01 R0.WP1-T01-ST1

TASK_ID="$1"
SUBTASK_ID="$2"
FILE="docs/project-management/Sub Tareas v2.md"

if [[ -z "$TASK_ID" || -z "$SUBTASK_ID" ]]; then
    echo "❌ Usage: $0 <TASK_ID> <SUBTASK_ID>"
    echo "   Example: $0 T-01 R0.WP1-T01-ST1"
    exit 1
fi

if [[ ! -f "$FILE" ]]; then
    echo "❌ File not found: $FILE"
    exit 1
fi

echo "✅ Marking Subtask $SUBTASK_ID as complete for Task $TASK_ID"

# Create backup
cp "$FILE" "${FILE}.backup.$(date +%Y%m%d_%H%M%S)"

# Find and mark the subtask as complete by replacing the line
sed -i "/### \*\*Tarea ${TASK_ID}:/,/### \*\*Tarea/ {
    s/| ${SUBTASK_ID}[ ]*|/| ✅ ${SUBTASK_ID} |/
}" "$FILE"

# Verify the change was made
if grep -q "✅ ${SUBTASK_ID}" "$FILE"; then
    echo "✅ Successfully marked $SUBTASK_ID as complete"
    echo "📋 Updated subtask line:"
    grep "✅ ${SUBTASK_ID}" "$FILE"
    
    # Calculate progress
    task_section=$(sed -n "/### \*\*Tarea ${TASK_ID}:/,/### \*\*Tarea/p" "$FILE")
    total_subtasks=$(echo "$task_section" | grep -c "R[0-9]*\.WP[0-9]*-${TASK_ID}-ST[0-9]*")
    completed_subtasks=$(echo "$task_section" | grep -c "✅.*${TASK_ID}-ST")
    
    if [[ $total_subtasks -gt 0 ]]; then
        percentage=$(( (completed_subtasks * 100) / total_subtasks ))
        echo "📊 Task progress: $completed_subtasks/$total_subtasks subtasks completed ($percentage%)"
        
        # Suggest status update
        if [[ $percentage -eq 100 ]]; then
            echo "🎉 All subtasks completed! Consider updating main task status:"
            echo "   ./tools/status-updater.sh $TASK_ID 'Completado 100%'"
        else
            echo "💡 Update main task progress:"
            echo "   ./tools/status-updater.sh $TASK_ID 'En progreso - $completed_subtasks/$total_subtasks subtareas ($percentage%)'"
        fi
    fi
else
    echo "❌ Failed to mark subtask as complete. Check if subtask ID exists: $SUBTASK_ID"
    echo "📋 Available subtasks for $TASK_ID:"
    grep -A 50 "### \*\*Tarea ${TASK_ID}:" "$FILE" | grep -E "R[0-9]*\.WP[0-9]*-${TASK_ID}-ST[0-9]*" | head -5
    echo "   ... (showing first 5 subtasks)"
fi