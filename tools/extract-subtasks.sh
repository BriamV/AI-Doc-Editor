#!/bin/bash
# Subtask Extractor for Development Work with Database Abstraction
# Usage: ./tools/extract-subtasks.sh T-01

TASK_ID="$1"

if [[ -z "$TASK_ID" ]]; then
    echo "❌ Usage: $0 <TASK_ID>"
    echo "   Example: $0 T-01"
    exit 1
fi

# Source abstraction layer (required for dual system support)
if [[ -f "tools/database-abstraction.sh" ]]; then
    source tools/database-abstraction.sh
    # Initialize with error checking (allow output for debugging)
    if ! init_abstraction_layer 2>&1 | grep -q "ready"; then
        echo "❌ Failed to initialize database abstraction layer"
        exit 1
    fi
else
    echo "❌ Database abstraction layer not found: tools/database-abstraction.sh"
    exit 1
fi

echo "🔧 Extracting Subtasks for Development: $TASK_ID"
echo "=================================================="
echo "Using $DATABASE_MODE mode"
echo ""

# Get task data using database abstraction layer
task_content=$(get_task_data "$TASK_ID" "full")
return_code=$?

# Debug output (remove after fixing)
# echo "DEBUG: task_content length: ${#task_content}, return_code: $return_code"

if [[ -z "$task_content" ]] || [[ $return_code -ne 0 ]]; then
    echo "❌ Task $TASK_ID not found in $DATABASE_MODE mode"
    if [[ "$DATABASE_MODE" == "distributed" ]]; then
        echo "💡 Trying monolith fallback..."
        export DATABASE_MODE="monolith"
        task_content=$(get_task_data "$TASK_ID" "full")
        if [[ -n "$task_content" ]]; then
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

# Show task overview
case "$DATABASE_MODE" in
    "distributed")
        # For distributed mode, show YAML frontmatter info
        get_task_data "$TASK_ID" "metadata" 2>/dev/null | head -5
        ;;
    "monolith"|*)
        # For monolith mode, show traditional overview
        echo "$task_content" | head -10 | grep -E "(Tarea|Estado|Complejidad|Prioridad)"
        ;;
esac
echo ""

# Extract subtask table using database abstraction
echo "📋 DEVELOPMENT SUBTASKS:"
echo "========================"

# Get subtasks using abstraction layer
subtasks_data=$(get_task_data "$TASK_ID" "subtasks" 2>/dev/null)

if [[ -n "$subtasks_data" ]]; then
    echo "| Status | WII | Description | Complexity | Deliverable |"
    echo "|--------|-----|-------------|------------|-------------|"

    case "$DATABASE_MODE" in
        "distributed")
            # Parse distributed subtasks (CSV or pipe-separated format)
            echo "$subtasks_data" | while IFS='|' read -r wii desc complexity deliverable; do
                # Clean up whitespace
                wii=$(echo "$wii" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
                desc=$(echo "$desc" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
                complexity=$(echo "$complexity" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
                deliverable=$(echo "$deliverable" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

                if [[ -n "$wii" && "$wii" != "id" ]]; then
                    printf "| ⏳ | %s | %s | %s | %s |\n" "$wii" "$desc" "$complexity" "$deliverable"
                fi
            done
            ;;
        "monolith"|*)
            # Parse monolith subtasks (table format)
            echo "$subtasks_data" | while IFS= read -r line; do
                if [[ "$line" =~ ^\| ]] && [[ ! "$line" =~ ^\|[[:space:]]*-[[:space:]]*\| ]]; then
                    # Skip header separator lines and add pending status emoji
                    if [[ ! "$line" =~ ID\ del\ Elemento\ de\ Trabajo ]]; then
                        echo "$line" | sed 's/^|\([^|]*\)|/| ⏳ |\1|/'
                    fi
                fi
            done
            ;;
    esac
else
    echo "No subtasks found for $TASK_ID"
fi

echo ""
echo "🎯 DEVELOPMENT CHECKLIST:"
echo "========================="

# Create actionable checklist using abstraction layer
if [[ -n "$subtasks_data" ]]; then
    case "$DATABASE_MODE" in
        "distributed")
            # Parse distributed subtasks for checklist
            echo "$subtasks_data" | while IFS='|' read -r wii desc complexity deliverable; do
                # Clean up whitespace
                wii=$(echo "$wii" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
                desc=$(echo "$desc" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
                complexity=$(echo "$complexity" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
                deliverable=$(echo "$deliverable" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

                if [[ -n "$wii" && "$wii" != "id" ]]; then
                    printf "[ ] **%s** (%s pts): %s\n" "$wii" "$complexity" "$desc"
                    printf "    📦 Deliverable: %s\n\n" "$deliverable"
                fi
            done
            ;;
        "monolith"|*)
            # Parse monolith subtasks for checklist
            echo "$subtasks_data" | while IFS= read -r line; do
                if [[ "$line" =~ ^\| ]] && [[ ! "$line" =~ ^\|[[:space:]]*-[[:space:]]*\| ]]; then
                    # Extract fields from table row, skip headers and separators
                    IFS='|' read -ra fields <<< "$line"
                    if [[ ${#fields[@]} -ge 5 ]]; then
                        wii=$(echo "${fields[1]}" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
                        desc=$(echo "${fields[2]}" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
                        complexity=$(echo "${fields[3]}" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
                        deliverable=$(echo "${fields[4]}" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

                        # Skip header lines and lines with only dashes/colons
                        if [[ -n "$wii" && "$wii" != "ID del Elemento de Trabajo (WII)" && ! "$wii" =~ ^[[:space:]]*:?-+:?[[:space:]]*$ ]]; then
                            printf "[ ] **%s** (%s pts): %s\n" "$wii" "$complexity" "$desc"
                            printf "    📦 Deliverable: %s\n\n" "$deliverable"
                        fi
                    fi
                fi
            done
            ;;
    esac
else
    echo "No subtasks available to create checklist"
fi

echo "💡 QUICK COMMANDS:"
echo "=================="
echo "  Mark subtask complete: ./tools/mark-subtask-complete.sh $TASK_ID R0.WP1-${TASK_ID}-ST1"
echo "  Update main status:    ./tools/status-updater.sh $TASK_ID 'En progreso - ST1 completado'"
echo "  Show task details:     ./tools/task-navigator.sh $TASK_ID"