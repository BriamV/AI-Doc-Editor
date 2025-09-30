#!/bin/bash
# Task Navigator for Sub Tareas v2.md with Database Abstraction
# Usage: ./tools/task-navigator.sh [TASK_ID]

TASK_ID="$1"
FILE="docs/project-management/archive/task-breakdown-detailed-v1.md"

# Source abstraction layer (required for dual system support)
if [[ -f "tools/database-abstraction.sh" ]]; then
    source tools/database-abstraction.sh
    init_abstraction_layer >/dev/null 2>&1
else
    echo "❌ Database abstraction layer not found: tools/database-abstraction.sh"
    exit 1
fi

if [[ -z "$TASK_ID" ]]; then
    echo "📋 Available Tasks ($DATABASE_MODE mode):"
    echo "==================="

    case "$DATABASE_MODE" in
        "distributed")
            # List from distributed files
            if [[ -d "$DISTRIBUTED_DIR" ]]; then
                find "$DISTRIBUTED_DIR" -name "*-STATUS.md" | sort | while read -r file; do
                    task_id=$(basename "$file" | sed 's/-STATUS.md$//')
                    titulo=$(parse_yaml_value "$file" "titulo" 2>/dev/null || echo "No title")
                    estado=$(parse_yaml_value "$file" "estado" 2>/dev/null || echo "No status")
                    printf "%-6s %-50s %s\n" "$task_id" "$titulo" "$estado"
                done
            else
                echo "❌ Distributed directory not found: $DISTRIBUTED_DIR"
                echo "Falling back to monolith mode..."
                DATABASE_MODE="monolith"
            fi
            ;;
        "monolith"|*)
            # List from monolith file
            if [[ -f "$FILE" ]]; then
                grep -n "### \*\*Tarea" "$FILE" | while IFS=: read -r line_num task_line; do
                    # Extract task ID and title
                    task_id=$(echo "$task_line" | grep -o "T-[0-9]\+" | head -1)
                    task_title=$(echo "$task_line" | sed 's/### \*\*Tarea [^:]*: //' | sed 's/\*\*$//')

                    # Get status for this task
                    status=$(sed -n "${line_num},/### \*\*Tarea/p" "$FILE" | grep "Estado:" | head -1 | sed 's/- \*\*Estado:\*\* //')

                    printf "Line %4d: %-6s %-50s %s\n" "$line_num" "$task_id" "$task_title" "$status"
                done
            else
                echo "❌ Monolith file not found: $FILE"
                exit 1
            fi
            ;;
    esac

    echo ""
    echo "Usage: $0 <TASK_ID> to see detailed task info"
    echo "Current mode: $DATABASE_MODE (set DATABASE_MODE to change)"
    exit 0
fi

echo "🔍 Searching for Task: $TASK_ID ($DATABASE_MODE mode)"
echo "================================"

# Use database abstraction layer to get task data
task_data=$(get_task_data "$TASK_ID" "full" 2>/dev/null)

if [[ -z "$task_data" ]] || [[ $? -ne 0 ]]; then
    echo "❌ Task $TASK_ID not found in $DATABASE_MODE mode"
    if [[ "$DATABASE_MODE" == "distributed" ]]; then
        echo "💡 Trying monolith fallback..."
        export DATABASE_MODE="monolith"
        task_data=$(get_task_data "$TASK_ID" "full" 2>/dev/null)
        if [[ -n "$task_data" ]]; then
            echo "✅ Found in monolith system"
        else
            echo "❌ Task not found in either system"
            exit 1
        fi
    else
        exit 1
    fi
fi

echo "📍 Found in $DATABASE_MODE system"
echo ""

# Display task details
echo "$task_data" | head -20

echo ""
echo "🔧 Quick Actions:"
echo "  View metadata: get_task_data $TASK_ID metadata"
echo "  View subtasks: get_task_data $TASK_ID subtasks"
echo "  Update status:  ./tools/status-updater.sh $TASK_ID 'New Status'"
echo "  Extract subtasks: ./tools/extract-subtasks.sh $TASK_ID"