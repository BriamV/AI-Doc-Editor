#!/bin/bash
# Status Updater for Sub Tareas v2.md - Simplified & Robust
# Usage: ./tools/status-updater.sh T-01 "Completado 100%"

TASK_ID="${1:-}"
NEW_STATUS="${2:-}"
FILE="docs/project-management/archive/task-breakdown-detailed-v1.md"

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

# Check if task exists
TASK_LINE=$(grep -n "### \*\*Tarea ${TASK_ID}:" "$FILE" || true)
if [[ -z "$TASK_LINE" ]]; then
    echo "❌ Task $TASK_ID not found"
    echo "📋 Available tasks:"
    grep -o "T-[0-9]\+" "$FILE" | sort -u | head -5
    exit 1
fi

# Create backup
cp "$FILE" "${FILE}.backup.$(date +%Y%m%d_%H%M%S)"

# Update using simple sed replacement
sed -i "/### \*\*Tarea ${TASK_ID}:/,/### \*\*Tarea/ {
    s/^- \*\*Estado:\*\* .*/- **Estado:** ${NEW_STATUS}/
}" "$FILE"

# Verify the change
if grep -A 20 "### \*\*Tarea ${TASK_ID}:" "$FILE" | grep -q "Estado:.*${NEW_STATUS}"; then
    echo "✅ Successfully updated $TASK_ID status"
    echo "📋 Current status:"
    grep -A 20 "### \*\*Tarea ${TASK_ID}:" "$FILE" | grep "Estado:" | head -1
else
    echo "❌ Update may have failed. Please check manually."
fi