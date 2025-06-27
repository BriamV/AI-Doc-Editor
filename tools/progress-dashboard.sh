#!/bin/bash
# Progress Dashboard Generator
# Usage: ./tools/progress-dashboard.sh [release]

RELEASE_FILTER="$1"
FILE="docs/Sub Tareas v2.md"

if [[ ! -f "$FILE" ]]; then
    echo "❌ File not found: $FILE"
    exit 1
fi

echo "📊 AI-Doc-Editor Development Progress Dashboard"
echo "=============================================="
echo "Generated: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Extract all tasks with status
declare -A release_stats
declare -A task_details

while IFS=: read -r line_num task_line; do
    # Extract task ID and title  
    task_id=$(echo "$task_line" | grep -o "T-[0-9]\+" | head -1)
    task_title=$(echo "$task_line" | sed 's/### \*\*Tarea [^:]*: //' | sed 's/\*\*$//')
    
    # Extract release from task details
    task_section=$(sed -n "${line_num},/### \*\*Tarea/p" "$FILE" | head -15)
    release=$(echo "$task_section" | grep "Release:" | sed 's/.*Release: *//' | sed 's/ .*//')
    
    # Get status
    status=$(echo "$task_section" | grep "Estado:" | head -1 | sed 's/- \*\*Estado:\*\* //')
    
    # Determine completion
    if [[ "$status" =~ "Completado" ]]; then
        completion="✅"
        ((release_stats["${release}_completed"]++))
    else
        completion="⏳"
    fi
    
    ((release_stats["${release}_total"]++))
    
    # Store task details
    task_details["$task_id"]="$release|$task_title|$status|$completion"
    
done < <(grep -n "### \*\*Tarea" "$FILE")

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