#!/bin/bash
# Batch Task Generator for Phase 1 Migration
# Generates all T-XX-STATUS.md files in controlled batches
# Usage: ./tools/batch-task-generator.sh [start_task] [end_task]

set -euo pipefail

# Configuration
PARSER_SCRIPT="tools/task-data-parser.sh"
BATCH_LOG="logs/batch-generation.log"
DISTRIBUTED_DIR="docs/tasks"
BATCH_SIZE=10

# Create log directory
mkdir -p "$(dirname "$BATCH_LOG")"

# Logging function
log_batch() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$BATCH_LOG"
}

# Get all task IDs from the monolith
get_all_task_ids() {
    grep "### \*\*Tarea T-" "docs/project-management/Sub Tareas v2.md" | \
        grep -o "T-[0-9]\+" | sort -V
}

# Generate tasks in batch
generate_batch() {
    local start_num="$1"
    local end_num="$2"
    local batch_success=0
    local batch_total=0

    log_batch "🚀 Processing batch T-${start_num} to T-${end_num}"

    for task_num in $(seq -f "%02g" "$start_num" "$end_num"); do
        local task_id="T-$task_num"
        ((batch_total++))

        # Skip if already exists and valid
        if [[ -f "$DISTRIBUTED_DIR/${task_id}-STATUS.md" ]]; then
            if ./"$PARSER_SCRIPT" validate "$task_id" >/dev/null 2>&1; then
                log_batch "⏭️  Skipping $task_id (already exists and valid)"
                ((batch_success++))
                continue
            else
                log_batch "🔄 Regenerating $task_id (validation failed)"
            fi
        fi

        # Generate the task file
        if ./"$PARSER_SCRIPT" generate "$task_id" >/dev/null 2>&1; then
            log_batch "✅ Generated $task_id"
            ((batch_success++))
        else
            log_batch "❌ Failed to generate $task_id"
        fi

        # Small delay to prevent overwhelming the system
        sleep 0.5
    done

    log_batch "📊 Batch completed: $batch_success/$batch_total successful"
    return $((batch_total - batch_success))  # Return number of failures
}

# Main batch generation
generate_all_batches() {
    local start_task="${1:-1}"
    local end_task="${2:-47}"

    log_batch "🎯 Starting batch generation T-$start_task to T-$end_task"

    local total_failures=0
    local current_batch=1

    # Process in batches
    for ((i=start_task; i<=end_task; i+=BATCH_SIZE)); do
        local batch_end=$((i + BATCH_SIZE - 1))
        if [[ $batch_end -gt $end_task ]]; then
            batch_end=$end_task
        fi

        log_batch "📦 Batch $current_batch: T-$(printf "%02d" $i) to T-$(printf "%02d" $batch_end)"

        if ! generate_batch "$i" "$batch_end"; then
            local batch_failures=$?
            total_failures=$((total_failures + batch_failures))
        fi

        ((current_batch++))

        # Progress report
        local completed=$((batch_end < end_task ? batch_end : end_task))
        log_batch "📈 Progress: T-$completed/$end_task tasks processed"

        # Brief pause between batches
        if [[ $batch_end -lt $end_task ]]; then
            sleep 2
        fi
    done

    return $total_failures
}

# Validation summary
generate_validation_report() {
    log_batch "🧪 Generating validation report"

    local total_files=0
    local valid_files=0
    local invalid_files=()

    for task_file in "$DISTRIBUTED_DIR"/T-*-STATUS.md; do
        if [[ -f "$task_file" ]]; then
            ((total_files++))
            local task_id
            task_id=$(basename "$task_file" -STATUS.md)

            if ./"$PARSER_SCRIPT" validate "$task_id" >/dev/null 2>&1; then
                ((valid_files++))
            else
                invalid_files+=("$task_id")
            fi
        fi
    done

    # Generate report
    local report_file="logs/generation-report-$(date +%Y%m%d_%H%M%S).md"
    cat > "$report_file" << EOF
# Phase 1 Task Generation Report

**Date:** $(date)
**Total Tasks in Monolith:** 47
**Generated Files:** $total_files
**Valid Files:** $valid_files
**Success Rate:** $(( total_files > 0 ? valid_files * 100 / total_files : 0 ))%

## Status Summary
- ✅ **Generated and Valid:** $valid_files files
- ❌ **Generated but Invalid:** $((total_files - valid_files)) files
- 📊 **Overall Progress:** $((total_files * 100 / 47))% of total tasks

EOF

    if [[ ${#invalid_files[@]} -gt 0 ]]; then
        echo "## Invalid Files" >> "$report_file"
        for invalid_task in "${invalid_files[@]}"; do
            echo "- $invalid_task" >> "$report_file"
        done
        echo "" >> "$report_file"
    fi

    echo "## File Sizes" >> "$report_file"
    echo "\`\`\`" >> "$report_file"
    ls -lh "$DISTRIBUTED_DIR"/T-*-STATUS.md | awk '{print $9, $5}' >> "$report_file"
    echo "\`\`\`" >> "$report_file"

    log_batch "📋 Validation report generated: $report_file"

    # Display summary
    log_batch "🏁 FINAL SUMMARY:"
    log_batch "   Generated: $total_files/47 files"
    log_batch "   Valid: $valid_files/$total_files files"
    log_batch "   Success Rate: $(( total_files > 0 ? valid_files * 100 / total_files : 0 ))%"

    if [[ ${#invalid_files[@]} -gt 0 ]]; then
        log_batch "   Invalid Files: ${invalid_files[*]}"
        return 1
    else
        log_batch "   ✅ All generated files are valid!"
        return 0
    fi
}

# Main execution
main() {
    local start_task="${1:-1}"
    local end_task="${2:-47}"

    log_batch "🚀 Phase 1 Batch Task Generation Starting"
    log_batch "   Range: T-$start_task to T-$end_task"
    log_batch "   Target Directory: $DISTRIBUTED_DIR"

    # Check prerequisites
    if [[ ! -f "$PARSER_SCRIPT" ]]; then
        log_batch "❌ Parser script not found: $PARSER_SCRIPT"
        exit 1
    fi

    if [[ ! -f "docs/project-management/Sub Tareas v2.md" ]]; then
        log_batch "❌ Source monolith not found"
        exit 1
    fi

    # Generate all batches
    if generate_all_batches "$start_task" "$end_task"; then
        log_batch "✅ Batch generation completed successfully"
    else
        log_batch "⚠️  Batch generation completed with some failures"
    fi

    # Generate validation report
    generate_validation_report
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi