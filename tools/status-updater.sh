#!/bin/bash
# Status Updater for Sub Tareas v2.md
# Usage: ./tools/status-updater.sh T-01 "Completado 100%"

TASK_ID="$1"
NEW_STATUS="$2"
FILE="docs/Sub Tareas v2.md"

if [[ -z "$TASK_ID" || -z "$NEW_STATUS" ]]; then
    echo "❌ Usage: $0 <TASK_ID> <NEW_STATUS>"
    echo "   Example: $0 T-01 'Completado 100%'"
    exit 1
fi

if [[ ! -f "$FILE" ]]; then
    echo "❌ File not found: $FILE"
    exit 1
fi

echo "🔄 Updating Task $TASK_ID status to: $NEW_STATUS"

# Create backup
cp "$FILE" "${FILE}.backup.$(date +%Y%m%d_%H%M%S)"

# Update status using sed - find the task and update its status line
sed -i "/### \*\*Tarea ${TASK_ID}:/,/### \*\*Tarea/ {
    s/- \*\*Estado:\*\* .*/- **Estado:** ${NEW_STATUS}/
}" "$FILE"

# Verify the change was made
if grep -q "- \*\*Estado:\*\* ${NEW_STATUS}" "$FILE"; then
    echo "✅ Successfully updated $TASK_ID status"
    echo "📋 Current status for $TASK_ID:"
    grep -A 10 "### \*\*Tarea ${TASK_ID}:" "$FILE" | grep "Estado:" || echo "❌ Status line not found"
else
    echo "❌ Failed to update status. Check if task ID exists: $TASK_ID"
    echo "📋 Available tasks:"
    grep "### \*\*Tarea" "$FILE" | head -5
    echo "   ... (showing first 5 tasks)"
fi