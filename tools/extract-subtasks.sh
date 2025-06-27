#!/bin/bash
# Subtask Extractor for Development Work
# Usage: ./tools/extract-subtasks.sh T-01

TASK_ID="$1"
FILE="docs/Sub Tareas v2.md"

if [[ -z "$TASK_ID" ]]; then
    echo "❌ Usage: $0 <TASK_ID>"
    echo "   Example: $0 T-01"
    exit 1
fi

if [[ ! -f "$FILE" ]]; then
    echo "❌ File not found: $FILE"
    exit 1
fi

echo "🔧 Extracting Subtasks for Development: $TASK_ID"
echo "=================================================="

# Find task section
task_start=$(grep -n "### \*\*Tarea ${TASK_ID}:" "$FILE" | cut -d: -f1)

if [[ -z "$task_start" ]]; then
    echo "❌ Task $TASK_ID not found"
    exit 1
fi

# Find next task or end of file
next_task=$(sed -n "${task_start},\$p" "$FILE" | grep -n "### \*\*Tarea" | sed -n '2p' | cut -d: -f1)
if [[ -n "$next_task" ]]; then
    task_end=$((task_start + next_task - 2))
else
    task_end=$(wc -l < "$FILE")
fi

# Extract task section
task_content=$(sed -n "${task_start},${task_end}p" "$FILE")

# Show task overview
echo "$task_content" | head -10 | grep -E "(Tarea|Estado|Complejidad|Prioridad)"
echo ""

# Extract subtask table
echo "📋 DEVELOPMENT SUBTASKS:"
echo "========================"

# Find subtask table (between "| WII |" header and next empty line or section)
echo "$task_content" | awk '
    /\| WII \|/ { in_table=1; print "| # | WII | Description | Complexity | Deliverable |"; print "|---|-----|-------------|------------|-------------|"; next }
    in_table && /^\|/ && !/WII/ { 
        gsub(/^\| */, "| ⏳ | ")  # Add pending status emoji
        print 
    }
    in_table && !/^\|/ && !/^$/ { in_table=0 }
'

echo ""
echo "🎯 DEVELOPMENT CHECKLIST:"
echo "========================="

# Create actionable checklist
counter=1
echo "$task_content" | awk -v counter=1 '
    /\| WII \|/ { in_table=1; next }
    in_table && /^\|/ && !/WII/ {
        # Extract fields
        split($0, fields, "|")
        wii = fields[2]
        desc = fields[3] 
        complexity = fields[4]
        deliverable = fields[5]
        
        # Clean up whitespace
        gsub(/^ *| *$/, "", wii)
        gsub(/^ *| *$/, "", desc)
        gsub(/^ *| *$/, "", complexity)
        gsub(/^ *| *$/, "", deliverable)
        
        if (wii != "") {
            printf "[ ] **%s** (%s pts): %s\n", wii, complexity, desc
            printf "    📦 Deliverable: %s\n\n", deliverable
            counter++
        }
    }
    in_table && !/^\|/ && !/^$/ { in_table=0 }
'

echo "💡 QUICK COMMANDS:"
echo "=================="
echo "  Mark subtask complete: ./tools/mark-subtask-complete.sh $TASK_ID R0.WP1-${TASK_ID}-ST1"
echo "  Update main status:    ./tools/status-updater.sh $TASK_ID 'En progreso - ST1 completado'"
echo "  Show task details:     ./tools/task-navigator.sh $TASK_ID"