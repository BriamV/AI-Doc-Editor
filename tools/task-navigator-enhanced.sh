#!/bin/bash
# Task Navigator - Enhanced with Unified Error Handling
# Context-aware task discovery and navigation system
# Example of migrated shell script using new error handling patterns.
#
# Usage: ./tools/task-navigator-enhanced.sh <TASK_ID>

# Source unified error handling library
source "$(dirname "$0")/lib/error-codes.sh"

# Script configuration
readonly SCRIPT_NAME="task-navigator-enhanced"
readonly TASK_PATTERN="^T-[0-9]+$"
readonly DOCS_BASE_DIR="docs"
readonly TASKS_DIR="$DOCS_BASE_DIR/tasks"
readonly PROJECT_MGMT_DIR="$DOCS_BASE_DIR/project-management"

# Enhanced logging with context
log_info() {
    local message="$1"
    local context="${2:-}"

    handle_error $ERROR_QUALITY_FORMAT_VIOLATIONS "$message" "$context" "0"
}

log_debug() {
    local message="$1"
    local context="${2:-}"

    if [[ "$ERROR_HANDLER_VERBOSE" == "1" ]]; then
        echo "[DEBUG] $message" >&2
        if [[ -n "$context" ]]; then
            echo "[DEBUG] Context: $context" >&2
        fi
    fi
}

# Enhanced argument validation
validate_arguments() {
    local task_id="$1"

    if [[ -z "$task_id" ]]; then
        error_exit $ERROR_USER_MISSING_REQUIRED_PARAM \
            "Task ID is required for navigation" \
            "usage=$0 <TASK_ID>,example=$0 T-01"
    fi

    if [[ ! "$task_id" =~ $TASK_PATTERN ]]; then
        error_exit $ERROR_USER_INVALID_ARGUMENTS \
            "Invalid task ID format: $task_id" \
            "expected_pattern=$TASK_PATTERN,provided=$task_id,example=T-01"
    fi

    log_debug "Task ID validation passed" "task_id=$task_id"
}

# Environment validation with detailed error reporting
validate_environment() {
    local validation_errors=0

    # Check base documentation directory
    if [[ ! -d "$DOCS_BASE_DIR" ]]; then
        handle_error $ERROR_ENVIRONMENT_FILE_SYSTEM_ERROR \
            "Documentation base directory not found" \
            "expected_dir=$DOCS_BASE_DIR,current_dir=$(pwd)" "0"
        ((validation_errors++))
    fi

    # Check tasks directory
    if [[ ! -d "$TASKS_DIR" ]]; then
        handle_error $ERROR_ENVIRONMENT_FILE_SYSTEM_ERROR \
            "Tasks directory not found" \
            "expected_dir=$TASKS_DIR,docs_dir=$DOCS_BASE_DIR" "0"
        ((validation_errors++))
    fi

    # Check project management directory
    if [[ ! -d "$PROJECT_MGMT_DIR" ]]; then
        error_warn $ERROR_WORKFLOW_DEVELOPMENT_STATUS_INCONSISTENT \
            "Project management directory not found" \
            "expected_dir=$PROJECT_MGMT_DIR,impact=reduced_context"
    fi

    # Check for required tools
    local required_tools=("grep" "find" "sed")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            handle_error $ERROR_ENVIRONMENT_TOOL_NOT_AVAILABLE \
                "Required tool not available: $tool" \
                "tool=$tool,PATH=$PATH" "0"
            ((validation_errors++))
        fi
    done

    if [[ $validation_errors -gt 0 ]]; then
        error_exit $ERROR_ENVIRONMENT_PLATFORM_NOT_SUPPORTED \
            "Environment validation failed with $validation_errors errors" \
            "errors=$validation_errors,script=$SCRIPT_NAME"
    fi

    log_debug "Environment validation completed" "errors=0,tools_checked=${#required_tools[@]}"
}

# Enhanced task discovery with multiple fallback strategies
discover_task_files() {
    local task_id="$1"
    local discovered_files=()

    log_debug "Starting task discovery" "task_id=$task_id"

    # Strategy 1: Direct task file in tasks directory
    local direct_task_file="$TASKS_DIR/${task_id}-STATUS.md"
    if [[ -f "$direct_task_file" ]]; then
        discovered_files+=("$direct_task_file")
        log_debug "Found direct task file" "file=$direct_task_file"
    fi

    # Strategy 2: Search in project management archives
    local archive_files
    if archive_files=$(find "$PROJECT_MGMT_DIR" -name "*task*.md" -type f 2>/dev/null); then
        while IFS= read -r file; do
            if [[ -n "$file" ]] && grep -q "### \*\*Tarea ${task_id}:" "$file" 2>/dev/null; then
                discovered_files+=("$file")
                log_debug "Found task in archive" "file=$file"
            fi
        done <<< "$archive_files"
    fi

    # Strategy 3: Global search across documentation
    if [[ ${#discovered_files[@]} -eq 0 ]]; then
        log_debug "Performing global search" "pattern=### \*\*Tarea ${task_id}:"

        local global_files
        if global_files=$(find "$DOCS_BASE_DIR" -name "*.md" -type f 2>/dev/null); then
            while IFS= read -r file; do
                if [[ -n "$file" ]] && grep -q "### \*\*Tarea ${task_id}:" "$file" 2>/dev/null; then
                    discovered_files+=("$file")
                    log_debug "Found task in global search" "file=$file"
                fi
            done <<< "$global_files"
        fi
    fi

    if [[ ${#discovered_files[@]} -eq 0 ]]; then
        error_exit $ERROR_WORKFLOW_BRANCH_NOT_FOUND \
            "Task $task_id not found in any documentation" \
            "task_id=$task_id,searched_dirs=$TASKS_DIR:$PROJECT_MGMT_DIR:$DOCS_BASE_DIR,strategies=3"
    fi

    log_debug "Task discovery completed" "files_found=${#discovered_files[@]}"

    # Return discovered files (use first file as primary)
    echo "${discovered_files[0]}"
}

# Extract task metadata with comprehensive error handling
extract_task_metadata() {
    local file="$1"
    local task_id="$2"

    log_debug "Extracting task metadata" "file=$file,task_id=$task_id"

    # Validate file accessibility
    if [[ ! -r "$file" ]]; then
        error_exit $ERROR_ENVIRONMENT_FILE_SYSTEM_ERROR \
            "Cannot read task file: $file" \
            "file=$file,permissions=$(ls -l "$file" 2>/dev/null || echo 'unknown')"
    fi

    # Extract task section
    local task_section
    if ! task_section=$(sed -n "/### \*\*Tarea ${task_id}:/,/### \*\*Tarea /p" "$file" | head -n -1); then
        error_exit $ERROR_INTEGRATION_DATA_SYNC_FAILURE \
            "Failed to extract task section from file" \
            "file=$file,task_id=$task_id,sed_error=$?"
    fi

    if [[ -z "$task_section" ]]; then
        error_exit $ERROR_WORKFLOW_DEVELOPMENT_STATUS_INCONSISTENT \
            "Task section not found in file" \
            "file=$file,task_id=$task_id,pattern=### \*\*Tarea ${task_id}:"
    fi

    # Parse metadata fields
    local title=""
    local status=""
    local release=""
    local complexity=""

    # Extract title
    title=$(echo "$task_section" | head -1 | sed "s/### \*\*Tarea ${task_id}: //" | sed 's/\*\*$//')

    # Extract status
    status=$(echo "$task_section" | grep -o "Estado:.*" | head -1 | sed 's/.*Estado: *//' | sed 's/ .*//')

    # Extract release
    release=$(echo "$task_section" | grep -E "(Release:|Release Target:)" | head -1 | sed 's/.*Release[^:]*: *//' | sed 's/ .*//')

    # Extract complexity
    complexity=$(echo "$task_section" | grep -o "Complejidad:.*" | head -1 | sed 's/.*Complejidad: *//' | sed 's/ .*//')

    # Validate extracted metadata
    if [[ -z "$title" ]]; then
        error_warn $ERROR_WORKFLOW_DEVELOPMENT_STATUS_INCONSISTENT \
            "Task title not found" \
            "task_id=$task_id,file=$file"
        title="No title available"
    fi

    if [[ -z "$status" ]]; then
        error_warn $ERROR_WORKFLOW_DEVELOPMENT_STATUS_INCONSISTENT \
            "Task status not found" \
            "task_id=$task_id,file=$file"
        status="Unknown"
    fi

    # Create metadata structure
    cat <<EOF
{
  "task_id": "$task_id",
  "title": "$title",
  "status": "$status",
  "release": "$release",
  "complexity": "$complexity",
  "file": "$file",
  "section_length": $(echo "$task_section" | wc -l)
}
EOF

    log_debug "Metadata extraction completed" "title_length=${#title},status=$status,release=$release"
}

# Generate comprehensive task context
generate_task_context() {
    local metadata="$1"
    local task_id="$2"

    log_debug "Generating task context" "task_id=$task_id"

    # Parse metadata JSON (basic parsing for shell)
    local title=$(echo "$metadata" | grep '"title"' | cut -d'"' -f4)
    local status=$(echo "$metadata" | grep '"status"' | cut -d'"' -f4)
    local release=$(echo "$metadata" | grep '"release"' | cut -d'"' -f4)
    local complexity=$(echo "$metadata" | grep '"complexity"' | cut -d'"' -f4)
    local file=$(echo "$metadata" | grep '"file"' | cut -d'"' -f4)

    # Generate context report
    cat <<EOF

📋 Task Navigation Report
========================

🔍 Task Information:
   ID: $task_id
   Title: $title
   Status: $status
   Release: ${release:-"Not specified"}
   Complexity: ${complexity:-"Not specified"}

📁 File Location:
   Primary File: $file
   Base Directory: $(dirname "$file")
   File Size: $(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "unknown") bytes

🔗 Related Context:
   Task Pattern: $TASK_PATTERN
   Discovery Method: $(basename "$file" .md | grep -q "STATUS" && echo "Direct task file" || echo "Archive search")

💡 Quick Actions:
   View task details: cat "$file"
   Edit task: \$EDITOR "$file"
   Extract subtasks: ./tools/extract-subtasks.sh $task_id
   Validate DoD: ./tools/validate-dod.sh $task_id

EOF

    # Cross-tier integration information
    if [[ -f "/tmp/scripts_error.env" ]]; then
        echo "⚠️  Cross-tier Error Information Available:"
        echo "   Run: source /tmp/scripts_error.env && echo \$ERROR_MESSAGE"
        echo ""
    fi

    log_debug "Context generation completed" "report_sections=4"
}

# Write error information for scripts/ integration
write_error_for_scripts() {
    local error_code="$1"
    local message="$2"
    local context="$3"

    write_error_file_for_scripts "$error_code" "$message" "$context"

    if [[ "$ERROR_HANDLER_VERBOSE" == "1" ]]; then
        echo "[DEBUG] Error information written for scripts/ integration" >&2
        echo "[DEBUG] Error code: $error_code, Message: $message" >&2
    fi
}

# Performance monitoring
track_performance() {
    local operation="$1"
    local start_time="$2"
    local end_time="$3"

    local duration=$((end_time - start_time))

    # Performance thresholds (in seconds)
    local threshold_warning=5
    local threshold_error=10

    if [[ $duration -gt $threshold_error ]]; then
        error_warn $ERROR_INTEGRATION_TIMEOUT \
            "Task navigation performance degraded" \
            "operation=$operation,duration=${duration}s,threshold=${threshold_error}s"
    elif [[ $duration -gt $threshold_warning ]]; then
        error_warn $ERROR_INTEGRATION_TIMEOUT \
            "Task navigation slower than expected" \
            "operation=$operation,duration=${duration}s,threshold=${threshold_warning}s"
    fi

    if [[ "$ERROR_HANDLER_VERBOSE" == "1" ]]; then
        echo "[DEBUG] Performance: $operation completed in ${duration}s" >&2
    fi
}

# Self-test functionality
run_self_test() {
    echo "🧪 Running Task Navigator self-test..."

    # Test error handling system
    local original_exit_setting="$ERROR_HANDLER_EXIT_ON_ERROR"
    ERROR_HANDLER_EXIT_ON_ERROR=0

    # Test basic error handling
    handle_error $ERROR_QUALITY_FORMAT_VIOLATIONS "Self-test message" "test=true"
    if [[ $? -eq 0 ]]; then
        echo "✅ Error handling: PASS"
    else
        echo "❌ Error handling: FAIL"
        return 1
    fi

    # Test validation functions
    if validate_error_code $ERROR_WORKFLOW_BRANCH_NOT_FOUND 2>/dev/null; then
        echo "✅ Error code validation: PASS"
    else
        echo "❌ Error code validation: FAIL"
        return 1
    fi

    # Test utility functions
    if [[ "$TASK_PATTERN" =~ ^\^T-\[0-9\]\+\$ ]]; then
        echo "✅ Task pattern validation: PASS"
    else
        echo "❌ Task pattern validation: FAIL"
        return 1
    fi

    # Restore original setting
    ERROR_HANDLER_EXIT_ON_ERROR="$original_exit_setting"

    echo "🎉 All self-tests passed!"
    return 0
}

# Main function with comprehensive error handling
main() {
    local task_id="$1"
    local start_time=$(date +%s)

    # Setup session context for cross-tier correlation
    setup_correlation_context "task_navigation" "${CORRELATION_ID:-}"

    # Handle special commands
    case "${task_id:-}" in
        "--self-test")
            run_self_test
            exit $?
            ;;
        "--help"|"-h"|"")
            cat <<EOF
Task Navigator - Enhanced Error Handling Version

Usage: $0 <TASK_ID>
       $0 --self-test
       $0 --help

Examples:
  $0 T-01          # Navigate to task T-01
  $0 T-12          # Navigate to task T-12
  $0 --self-test   # Run self-test

Environment Variables:
  ERROR_HANDLER_VERBOSE=1    # Enable verbose output
  CORRELATION_ID=xxx         # Cross-tier correlation ID

EOF
            exit 0
            ;;
    esac

    # Validate arguments
    validate_arguments "$task_id"

    # Validate environment
    validate_environment

    # Discover task files
    local primary_file
    if ! primary_file=$(discover_task_files "$task_id"); then
        error_exit $ERROR_WORKFLOW_BRANCH_NOT_FOUND \
            "Task discovery failed for $task_id" \
            "task_id=$task_id,discovery_strategies=3"
    fi

    # Extract metadata
    local metadata
    if ! metadata=$(extract_task_metadata "$primary_file" "$task_id"); then
        error_exit $ERROR_INTEGRATION_DATA_SYNC_FAILURE \
            "Failed to extract task metadata" \
            "file=$primary_file,task_id=$task_id"
    fi

    # Generate and display context
    if ! generate_task_context "$metadata" "$task_id"; then
        error_exit $ERROR_INTEGRATION_INTERFACE_CONTRACT_VIOLATION \
            "Failed to generate task context" \
            "metadata_length=${#metadata},task_id=$task_id"
    fi

    # Performance tracking
    local end_time=$(date +%s)
    track_performance "task_navigation" "$start_time" "$end_time"

    # Success - write success context for scripts/
    export ERROR_CODE=0
    export ERROR_SEVERITY="info"
    export ERROR_TIER="workflow"
    export ERROR_MESSAGE="Task navigation completed successfully"
    export ERROR_CONTEXT="task_id=$task_id,file=$primary_file,duration=$((end_time - start_time))s"

    log_info "Task navigation completed successfully" \
        "task_id=$task_id,duration=$((end_time - start_time))s,file=$primary_file"

    return 0
}

# Error handling wrapper
execute_with_error_handling() {
    local exit_code=0

    if ! main "$@"; then
        exit_code=$?
        write_error_for_scripts $ERROR_WORKFLOW_BRANCH_NOT_FOUND \
            "Task navigation failed" \
            "args=$*,exit_code=$exit_code"
    fi

    return $exit_code
}

# Execute main function with error handling if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    execute_with_error_handling "$@"
fi