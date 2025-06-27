#!/bin/bash
# Task Navigator for Sub Tareas v2.md
# Usage: ./tools/task-navigator.sh [TASK_ID]

TASK_ID="$1"
FILE="docs/Sub Tareas v2.md"

if [[ ! -f "$FILE" ]]; then
    echo "❌ File not found: $FILE"
    exit 1
fi

if [[ -z "$TASK_ID" ]]; then
    echo "📋 Available Tasks:"
    echo "==================="
    grep -n "### \*\*Tarea" "$FILE" | while IFS=: read -r line_num task_line; do
        # Extract task ID and title
        task_id=$(echo "$task_line" | grep -o "T-[0-9]\+" | head -1)
        task_title=$(echo "$task_line" | sed 's/### \*\*Tarea [^:]*: //' | sed 's/\*\*$//')
        
        # Get status for this task
        status=$(sed -n "${line_num},/### \*\*Tarea/p" "$FILE" | grep "Estado:" | head -1 | sed 's/- \*\*Estado:\*\* //')
        
        printf "Line %4d: %-6s %-50s %s\n" "$line_num" "$task_id" "$task_title" "$status"
    done
    echo ""
    echo "Usage: $0 <TASK_ID> to see detailed task info"
    exit 0
fi

echo "🔍 Searching for Task: $TASK_ID"
echo "================================"

# Find the task and show its details
task_line=$(grep -n "### \*\*Tarea ${TASK_ID}:" "$FILE")

if [[ -z "$task_line" ]]; then
    echo "❌ Task $TASK_ID not found"
    echo "📋 Available tasks starting with T-${TASK_ID#T-}:"
    grep "### \*\*Tarea T-${TASK_ID#T-}" "$FILE" | head -3
    exit 1
fi

line_num=$(echo "$task_line" | cut -d: -f1)
echo "📍 Found at line: $line_num"
echo ""

# Extract task details (from current task to next task or end of file)
sed -n "${line_num},/### \*\*Tarea/p" "$FILE" | sed '$d' | head -20

echo ""
echo "🔧 Quick Actions:"
echo "  View full task: sed -n '${line_num},/### \*\*Tarea/p' '$FILE'"
echo "  Update status:  ./tools/status-updater.sh $TASK_ID 'New Status'"
echo "  Extract subtasks: ./tools/extract-subtasks.sh $TASK_ID"