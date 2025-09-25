#!/bin/bash
# Progress Dashboard Generator with Database Abstraction
# Usage: ./tools/progress-dashboard.sh [release]

RELEASE_FILTER="$1"

# Source abstraction layer (required for dual system support)
if [[ -f "tools/database-abstraction.sh" ]]; then
    source tools/database-abstraction.sh
    # Initialize with error checking (suppress normal output but show errors)
    if ! init_abstraction_layer 2>/dev/null | grep -q "ready"; then
        echo "❌ Failed to initialize database abstraction layer"
        exit 1
    fi
else
    echo "❌ Database abstraction layer not found: tools/database-abstraction.sh"
    exit 1
fi

echo "📊 AI-Doc-Editor Development Progress Dashboard"
echo "=============================================="
echo "Generated: $(date '+%Y-%m-%d %H:%M:%S') ($DATABASE_MODE mode)"
echo ""

# Extract all tasks with status using database abstraction
declare -A release_stats
declare -A task_details

get_all_tasks() {
    case "$DATABASE_MODE" in
        "distributed")
            # List tasks from distributed files
            if [[ -d "$DISTRIBUTED_DIR" ]]; then
                find "$DISTRIBUTED_DIR" -name "*-STATUS.md" 2>/dev/null | sort | while read -r file; do
                    if [[ -f "$file" ]]; then
                        task_id=$(basename "$file" | sed 's/-STATUS.md$//')
                        echo "$task_id"
                    fi
                done
            else
                # Fallback to monolith if distributed directory doesn't exist
                echo "⚠️ Distributed directory not found, falling back to monolith" >&2
                if [[ -f "$MONOLITH_FILE" ]]; then
                    grep -o "T-[0-9]\+" "$MONOLITH_FILE" | sort -u
                fi
            fi
            ;;
        "monolith"|*)
            # List tasks from monolith file
            if [[ -f "$MONOLITH_FILE" ]]; then
                grep -o "T-[0-9]\+" "$MONOLITH_FILE" | sort -u
            fi
            ;;
    esac
}

# Process each task using abstraction layer
while IFS= read -r task_id; do
    if [[ -z "$task_id" ]]; then
        continue
    fi

    # Get task metadata using abstraction layer
    task_metadata=$(get_task_data "$task_id" "metadata" 2>/dev/null)
    if [[ $? -ne 0 ]]; then
        continue
    fi

    # Extract details from metadata using abstraction layer
    case "$DATABASE_MODE" in
        "distributed")
            # For distributed mode, parse YAML-style output
            release=$(echo "$task_metadata" | grep "^release:" | cut -d: -f2- | sed 's/^ *//' | sed 's/"//g')
            status=$(echo "$task_metadata" | grep "^estado:" | cut -d: -f2- | sed 's/^ *//' | sed 's/"//g')

            # Get title from distributed file
            if [[ -f "$DISTRIBUTED_DIR/${task_id}-STATUS.md" ]]; then
                title=$(parse_yaml_value "$DISTRIBUTED_DIR/${task_id}-STATUS.md" "titulo" 2>/dev/null || echo "No title")
            else
                title="No title"
            fi
            ;;
        "monolith"|*)
            # For monolith mode, parse markdown-style output
            # Try both "Release:" and "Release Target:" patterns
            release=$(echo "$task_metadata" | grep -E "(Release:|Release Target:)" | sed 's/.*Release[^:]*: *//' | sed 's/ .*//')
            status=$(echo "$task_metadata" | grep "Estado:" | head -1 | sed 's/- \*\*Estado:\*\* //')

            # Get title from full task data
            task_full=$(get_task_data "$task_id" "full" 2>/dev/null)
            if [[ -n "$task_full" ]]; then
                title=$(echo "$task_full" | head -1 | sed 's/### \*\*Tarea [^:]*: //' | sed 's/\*\*$//')
            else
                title="No title"
            fi

            # If no release found in metadata, extract from full data
            if [[ -z "$release" && -n "$task_full" ]]; then
                release=$(echo "$task_full" | grep -E "(Release:|Release Target:)" | head -1 | sed 's/.*Release[^:]*: *//' | sed 's/ .*//')
            fi
            ;;
    esac

    # Clean up values
    release=$(echo "$release" | sed 's/[[:space:]]*$//' | sed 's/^[[:space:]]*//')
    status=$(echo "$status" | sed 's/[[:space:]]*$//' | sed 's/^[[:space:]]*//')
    title=$(echo "$title" | sed 's/[[:space:]]*$//' | sed 's/^[[:space:]]*//')

    # Skip if essential data is missing
    if [[ -z "$release" || -z "$status" ]]; then
        continue
    fi

    # Determine completion
    if [[ "$status" =~ "Completado" ]]; then
        completion="✅"
        ((release_stats["${release}_completed"]++))
    else
        completion="⏳"
    fi

    ((release_stats["${release}_total"]++))

    # Store task details
    task_details["$task_id"]="$release|$title|$status|$completion"

done < <(get_all_tasks)

# Display by release
for release in $(printf '%s\n' "${!release_stats[@]}" | grep "_total$" | sed 's/_total$//' | sort -V); do
    if [[ -n "$RELEASE_FILTER" && "$release" != "$RELEASE_FILTER" ]]; then
        continue
    fi
    
    completed=${release_stats["${release}_completed"]:-0}
    total=${release_stats["${release}_total"]:-0}
    
    if [[ $total -eq 0 ]]; then
        continue
    fi
    
    percentage=$(( (completed * 100) / total ))
    
    echo "## 🚀 Release $release"
    echo "**Progress: $completed/$total tasks ($percentage%)**"
    
    # Progress bar
    bar_length=20
    filled_length=$(( (completed * bar_length) / total ))
    bar=$(printf "%0.s█" $(seq 1 $filled_length))$(printf "%0.s░" $(seq 1 $((bar_length - filled_length))))
    echo "[$bar] $percentage%"
    echo ""
    
    # List tasks for this release
    for task_id in $(printf '%s\n' "${!task_details[@]}" | sort -V); do
        IFS='|' read -r task_release task_title task_status task_completion <<< "${task_details[$task_id]}"
        
        if [[ "$task_release" == "$release" ]]; then
            printf "  %s **%s**: %s\n" "$task_completion" "$task_id" "$task_title"
            printf "      📋 %s\n" "$task_status"
        fi
    done
    echo ""
done

# Overall summary
total_completed=0
total_tasks=0

for key in "${!release_stats[@]}"; do
    if [[ "$key" =~ _completed$ ]]; then
        total_completed=$((total_completed + ${release_stats[$key]}))
    elif [[ "$key" =~ _total$ ]]; then
        total_tasks=$((total_tasks + ${release_stats[$key]}))
    fi
done

if [[ $total_tasks -gt 0 ]]; then
    overall_percentage=$(( (total_completed * 100) / total_tasks ))
    echo "## 🎯 Overall Project Progress"
    echo "**$total_completed/$total_tasks tasks completed ($overall_percentage%)**"
    
    # Overall progress bar
    bar_length=30
    filled_length=$(( (total_completed * bar_length) / total_tasks ))
    overall_bar=$(printf "%0.s█" $(seq 1 $filled_length))$(printf "%0.s░" $(seq 1 $((bar_length - filled_length))))
    echo "[$overall_bar] $overall_percentage%"
fi

echo ""
echo "💡 **Quick Commands:**"
echo "  Show specific release: $0 <release_number>"
echo "  Navigate to task:      ./tools/task-navigator.sh <TASK_ID>"
echo "  Update task status:    ./tools/status-updater.sh <TASK_ID> '<NEW_STATUS>'"
echo "  Extract subtasks:      ./tools/extract-subtasks.sh <TASK_ID>"