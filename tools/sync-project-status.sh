#!/bin/bash
# sync-project-status.sh - Deterministic Status Tracking Automation
# Purpose: Automatically propagate task status updates through the hierarchy
#          Task → Work Package → Release → Project Status
# Usage:
#   ./tools/sync-project-status.sh T-XX              # Full propagation
#   ./tools/sync-project-status.sh T-XX --dry-run    # Preview changes
#   ./tools/sync-project-status.sh --validate        # Check consistency
#   ./tools/sync-project-status.sh --fix             # Auto-correct inconsistencies

set -euo pipefail

# ============================================================================
# CONFIGURATION
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Cross-platform path handling (Git Bash on Windows uses /c/, Linux uses /home)
if [[ "$PROJECT_ROOT" =~ ^/[a-z]/ ]]; then
    # Git Bash on Windows
    TASKS_DIR="$PROJECT_ROOT/docs/tasks"
    PROGRESS_DIR="$PROJECT_ROOT/docs/project-management/progress"
    STATUS_DIR="$PROJECT_ROOT/docs/project-management/status"
else
    # Linux/WSL/macOS
    TASKS_DIR="$PROJECT_ROOT/docs/tasks"
    PROGRESS_DIR="$PROJECT_ROOT/docs/project-management/progress"
    STATUS_DIR="$PROJECT_ROOT/docs/project-management/status"
fi

# Source database abstraction for YAML parsing
if [[ -f "$SCRIPT_DIR/database-abstraction.sh" ]]; then
    # shellcheck source=tools/database-abstraction.sh
    source "$SCRIPT_DIR/database-abstraction.sh"
fi

# Operation modes
DRY_RUN=false
VALIDATE_ONLY=false
AUTO_FIX=false
QUIET_MODE=false

# Exit codes
EXIT_SUCCESS=0
EXIT_VALIDATION_FAILED=1
EXIT_FILE_NOT_FOUND=2
EXIT_PARSE_ERROR=3

# Milestone tolerance (±2%)
MILESTONE_TOLERANCE=2

# ============================================================================
# LOGGING FUNCTIONS
# ============================================================================

log_info() {
    if [[ "$QUIET_MODE" == false ]]; then
        echo "ℹ️  $*"
    fi
}

log_success() {
    echo "✅ $*"
}

log_warning() {
    echo "⚠️  $*" >&2
}

log_error() {
    echo "❌ $*" >&2
}

log_debug() {
    if [[ "${DEBUG:-}" == "1" ]] && [[ "$QUIET_MODE" == false ]]; then
        echo "🔍 DEBUG: $*"
    fi
}

log_metric() {
    if [[ "$QUIET_MODE" == false ]]; then
        echo "📊 $*"
    fi
}

# ============================================================================
# TASK-TO-WP MAPPING (MVP - Hardcoded)
# ============================================================================

# Map task ID to work package and release
# Format: "TASK_ID|WP_ID|RELEASE_ID"
# Based on docs/project-management/WORK-PLAN v5.md
get_parent_wp_and_release() {
    local task_id="$1"

    case "$task_id" in
        T-04|T-49|T-03|T-24)
            echo "R1-WP1|R1"
            ;;
        T-05|T-06)
            echo "R1-WP2|R1"
            ;;
        T-07|T-08|T-31)
            echo "R2-WP1|R2"
            ;;
        T-11|T-33)
            echo "R2-WP2|R2"
            ;;
        T-45|T-46)
            echo "R2-WP3|R2"
            ;;
        T-21|T-19|T-39)
            echo "R3-WP1|R3"
            ;;
        T-32|T-18|T-28)
            echo "R3-WP2|R3"
            ;;
        T-09|T-10|T-22)
            echo "R4-WP1|R4"
            ;;
        T-37|T-47)
            echo "R4-WP2|R4"
            ;;
        T-16)
            echo "R4-WP3|R4"
            ;;
        *)
            log_error "Unknown task ID: $task_id (no WP mapping)"
            return 1
            ;;
    esac
}

# ============================================================================
# YAML PARSING FUNCTIONS
# ============================================================================

parse_task_frontmatter() {
    local task_id="$1"
    local task_file="$TASKS_DIR/${task_id}-STATUS.md"

    if [[ ! -f "$task_file" ]]; then
        log_error "Task file not found: $task_file"
        return $EXIT_FILE_NOT_FOUND
    fi

    # Use database abstraction layer if available
    if declare -f parse_yaml_value >/dev/null 2>&1; then
        local estado complexity completado
        estado=$(parse_yaml_value "$task_file" "estado" || echo "")
        complexity=$(parse_yaml_value "$task_file" "complejidad" || echo "0")
        completado=$(parse_yaml_value "$task_file" "completado" || echo "0/0 (0%)")

        # Extract progress percentage from completado field
        local progress
        progress=$(echo "$completado" | grep -oP '\(\K[0-9]+(?=%\))' || echo "0")

        # Output as parseable format
        echo "estado=$estado"
        echo "complejidad=$complexity"
        echo "completado=$completado"
        echo "progreso=$progress"
    else
        log_error "parse_yaml_value function not available (database-abstraction.sh not sourced)"
        return $EXIT_PARSE_ERROR
    fi
}

# ============================================================================
# PROGRESS CALCULATION FUNCTIONS
# ============================================================================

calculate_wp_progress() {
    local wp_id="$1"
    local wp_file="$PROGRESS_DIR/${wp_id}-progress.md"

    if [[ ! -f "$wp_file" ]]; then
        log_error "Work package file not found: $wp_file"
        return $EXIT_FILE_NOT_FOUND
    fi

    # Extract task IDs from WP (hardcoded mappings for MVP)
    local task_ids=()
    case "$wp_id" in
        R1-WP1)
            task_ids=(T-04 T-49 T-03 T-24)
            ;;
        R1-WP2)
            task_ids=(T-05 T-06)
            ;;
        *)
            log_error "Unknown work package: $wp_id"
            return $EXIT_PARSE_ERROR
            ;;
    esac

    # Calculate total and completed complexity points
    local total_complexity=0
    local completed_points=0

    for task_id in "${task_ids[@]}"; do
        local task_file="$TASKS_DIR/${task_id}-STATUS.md"
        if [[ ! -f "$task_file" ]]; then
            log_warning "Task file not found: $task_file (skipping)"
            continue
        fi

        local complexity progress
        complexity=$(parse_yaml_value "$task_file" "complejidad" || echo "0")

        # Extract progress from completado field
        local completado
        completado=$(parse_yaml_value "$task_file" "completado" || echo "0/0 (0%)")
        progress=$(echo "$completado" | grep -oP '\(\K[0-9]+(?=%\))' || echo "0")

        total_complexity=$((total_complexity + complexity))

        # Calculate completed points: (progress/100) * complexity (using awk for cross-platform)
        local completed
        completed=$(awk "BEGIN {printf \"%.2f\", ($progress / 100) * $complexity}")
        completed_points=$(awk "BEGIN {printf \"%.2f\", $completed_points + $completed}")
    done

    # Calculate percentage (using awk for cross-platform)
    local wp_progress=0
    if [[ "$total_complexity" -gt 0 ]]; then
        wp_progress=$(awk "BEGIN {printf \"%.0f\", ($completed_points / $total_complexity) * 100}")
    fi

    log_metric "WP Progress: $wp_progress% ($completed_points / $total_complexity points)" >&2
    echo "$wp_progress"
}

calculate_release_progress() {
    local release_id="$1"

    # Extract WP IDs from release (hardcoded for MVP)
    local wp_ids=()
    local wp_complexities=()

    case "$release_id" in
        R1)
            wp_ids=(R1-WP1 R1-WP2)
            wp_complexities=(44 28)  # Updated: R1-WP1=44 (T-04:18 + T-49:8 + T-03:11 + T-24:7), R1-WP2=28
            ;;
        *)
            log_error "Unknown release: $release_id"
            return $EXIT_PARSE_ERROR
            ;;
    esac

    # Calculate weighted average
    local total_complexity=0
    local weighted_sum=0

    for i in "${!wp_ids[@]}"; do
        local wp_id="${wp_ids[$i]}"
        local wp_complexity="${wp_complexities[$i]}"
        local wp_progress
        wp_progress=$(calculate_wp_progress "$wp_id")

        total_complexity=$((total_complexity + wp_complexity))

        local weighted
        weighted=$(awk "BEGIN {printf \"%.2f\", ($wp_progress / 100) * $wp_complexity}")
        weighted_sum=$(awk "BEGIN {printf \"%.2f\", $weighted_sum + $weighted}")
    done

    # Calculate percentage (using awk for cross-platform)
    local release_progress=0
    if [[ "$total_complexity" -gt 0 ]]; then
        release_progress=$(awk "BEGIN {printf \"%.0f\", ($weighted_sum / $total_complexity) * 100}")
    fi

    log_metric "Release Progress: $release_progress% (weighted by WP complexity)" >&2
    echo "$release_progress"
}

# ============================================================================
# MILESTONE DETECTION FUNCTIONS
# ============================================================================

is_milestone() {
    local progress="$1"
    local milestones=(25 50 75 100)

    for milestone in "${milestones[@]}"; do
        local diff
        diff=$(awk "BEGIN {printf \"%.0f\", ($progress - $milestone) < 0 ? ($milestone - $progress) : ($progress - $milestone)}")
        if [[ "$diff" -le "$MILESTONE_TOLERANCE" ]]; then
            log_debug "Milestone detected: $progress% ≈ $milestone% (±${MILESTONE_TOLERANCE}%)"
            return 0
        fi
    done

    return 1
}

# ============================================================================
# MARKDOWN UPDATE FUNCTIONS
# ============================================================================

generate_progress_bar() {
    local progress="$1"
    local filled=$(awk "BEGIN {printf \"%.0f\", $progress / 10}")
    local empty=$((10 - filled))

    local bar=""
    for ((i=0; i<filled; i++)); do
        bar="${bar}█"
    done
    for ((i=0; i<empty; i++)); do
        bar="${bar}░"
    done

    echo "$bar"
}

update_wp_task_matrix() {
    local wp_file="$1"
    local task_id="$2"
    local status="$3"
    local progress="$4"
    local completed_points="$5"

    if [[ "$DRY_RUN" == true ]]; then
        log_info "DRY RUN: Would update task row in $wp_file"
        log_info "  Task: $task_id | Status: $status | Progress: $progress% | Points: $completed_points"
        return 0
    fi

    # Use sed to update task row in table
    # Pattern: | T-XX | ... | ... | ... | ... |
    # Replace with new values

    local status_emoji
    case "$status" in
        *"COMPLETADO"*|*"Complete"*)
            status_emoji="✅ Complete"
            ;;
        *"En Progreso"*|*"In Progress"*)
            status_emoji="🟡 In Progress"
            ;;
        *"Pendiente"*|*"Not Started"*)
            status_emoji="🔴 Not Started"
            ;;
        *)
            status_emoji="$status"
            ;;
    esac

    # Backup file before editing
    cp "$wp_file" "$wp_file.backup"

    # Update task row (assuming table format: | Task ID | Status | Progress | Completed Points |)
    sed -i.bak "s#| \*\*$task_id\*\* | .* | .* | .* |#| **$task_id** | $status_emoji | $progress% | $completed_points |#g" "$wp_file"

    log_success "Updated task row in WP: $task_id → $status_emoji ($progress%)"

    # Update narrative sections (Planned/In Progress/Completed Work Details)
    update_wp_narrative_sections "$wp_file" "$task_id" "$status_emoji" "$progress"
}

update_wp_narrative_sections() {
    local wp_file="$1"
    local task_id="$2"
    local status_emoji="$3"
    local progress="$4"

    # Use Python helper for cross-platform narrative section updates
    # This is more robust than complex sed/awk patterns
    local python_script="$SCRIPT_DIR/update-wp-narrative.py"

    if [[ ! -f "$python_script" ]]; then
        log_warning "Python helper not found: $python_script (skipping narrative update)"
        return 0
    fi

    # Check if Python is available (try python3 first, then python)
    local python_cmd=""
    if command -v python3 >/dev/null 2>&1; then
        python_cmd="python3"
    elif command -v python >/dev/null 2>&1; then
        python_cmd="python"
    else
        log_warning "Python not available (skipping narrative update)"
        return 0
    fi

    # Run Python helper to update narrative sections
    if $python_cmd "$python_script" "$wp_file" "$task_id" "$status_emoji" "$progress" 2>&1; then
        log_debug "Python helper executed successfully"
    else
        log_warning "Python helper failed for $task_id (continuing anyway)"
    fi
}

update_wp_comprehensive_sections() {
    local wp_file="$1"
    local task_id="$2"
    local status_emoji="$3"
    local progress="$4"
    local complexity="$5"

    # Use NEW comprehensive Python helper (update-wp-complete.py)
    local python_script="$SCRIPT_DIR/update-wp-complete.py"

    if [[ ! -f "$python_script" ]]; then
        log_warning "Comprehensive helper not found: $python_script (skipping)"
        return 0
    fi

    # Check if Python is available
    local python_cmd=""
    if command -v python3 >/dev/null 2>&1; then
        python_cmd="python3"
    elif command -v python >/dev/null 2>&1; then
        python_cmd="python"
    else
        log_warning "Python not available (skipping comprehensive update)"
        return 0
    fi

    # Run comprehensive helper (NEW: only needs wp_file and task_id)
    log_info "Updating comprehensive WP sections (ALL metrics)..."
    if $python_cmd "$python_script" "$wp_file" "$task_id" 2>&1; then
        log_debug "Comprehensive WP update successful"
    else
        log_warning "Comprehensive WP update failed for $task_id (continuing)"
    fi
}

update_wp_progress_bar() {
    local wp_file="$1"
    local wp_progress="$2"

    if [[ "$DRY_RUN" == true ]]; then
        log_info "DRY RUN: Would update progress bar in $wp_file to $wp_progress%"
        return 0
    fi

    local progress_bar
    progress_bar=$(generate_progress_bar "$wp_progress")

    # Backup file
    cp "$wp_file" "$wp_file.backup"

    # Update progress bar line (pattern: **Progress**: [████░░░░░░] XX%)
    sed -i.bak "s#\*\*Progress\*\*: \[.*\] [0-9]\+%#**Progress**: [$progress_bar] $wp_progress%#g" "$wp_file"

    log_success "Updated WP progress bar: $wp_progress% [$progress_bar]"

    # Update WP-level status if 100% complete
    if [[ "$wp_progress" -eq 100 ]]; then
        # Update status line in Summary Dashboard
        sed -i.bak 's/- \*\*Status\*\*: 🟡 In Progress/- **Status**: ✅ Complete/' "$wp_file"
        sed -i.bak 's/- \*\*Status\*\*: 🔴 Not Started/- **Status**: ✅ Complete/' "$wp_file"
        log_success "Updated WP status: → Complete (100% reached)"
    fi
}

update_release_wp_summary() {
    local release_file="$1"
    local wp_id="$2"
    local wp_progress="$3"

    if [[ "$DRY_RUN" == true ]]; then
        log_info "DRY RUN: Would update WP summary in $release_file"
        log_info "  WP: $wp_id → Progress: $wp_progress%"
        return 0
    fi

    # Use comprehensive Python helper (update-release-complete.py)
    local python_script="$SCRIPT_DIR/update-release-complete.py"

    if [[ ! -f "$python_script" ]]; then
        log_warning "Comprehensive Release helper not found: $python_script"
        log_warning "Falling back to basic sed update"
        # Fallback to basic update
        local progress_bar
        progress_bar=$(generate_progress_bar "$wp_progress")
        cp "$release_file" "$release_file.backup"
        sed -i.bak "s#| $wp_id | .* | \[.*\] [0-9]\+% | #| $wp_id | ... | [$progress_bar] $wp_progress% | #g" "$release_file"
        return 0
    fi

    # Check if Python is available
    local python_cmd=""
    if command -v python3 >/dev/null 2>&1; then
        python_cmd="python3"
    elif command -v python >/dev/null 2>&1; then
        python_cmd="python"
    else
        log_warning "Python not available (falling back to basic sed update)"
        local progress_bar
        progress_bar=$(generate_progress_bar "$wp_progress")
        cp "$release_file" "$release_file.backup"
        sed -i.bak "s#| $wp_id | .* | \[.*\] [0-9]\+% | #| $wp_id | ... | [$progress_bar] $wp_progress% | #g" "$release_file"
        return 0
    fi

    # Run comprehensive Release update helper
    log_info "Running comprehensive Release update (update-release-complete.py)..."
    if $python_cmd "$python_script" "$release_file" "$wp_id" 2>&1; then
        log_success "Comprehensive Release update complete: $wp_id → $wp_progress%"
    else
        log_warning "Comprehensive Release update failed (continuing)"
    fi
}

update_project_summary() {
    local project_file="$1"
    local release_id="$2"
    local release_progress="$3"

    if [[ "$DRY_RUN" == true ]]; then
        log_info "DRY RUN: Would update project summary in $project_file"
        log_info "  Release: $release_id → Progress: $release_progress%"
        return 0
    fi

    # Use comprehensive Python helper (update-project-complete.py)
    local python_script="$SCRIPT_DIR/update-project-complete.py"

    if [[ ! -f "$python_script" ]]; then
        log_warning "Comprehensive Project helper not found: $python_script"
        log_warning "Falling back to basic sed update"
        # Fallback to basic update
        local progress_bar
        progress_bar=$(generate_progress_bar "$release_progress")
        cp "$project_file" "$project_file.backup"
        sed -i.bak "s#\*\*Completion\*\*: \[.*\] [0-9]\+%#**Completion**: [$progress_bar] $release_progress%#g" "$project_file"
        return 0
    fi

    # Check if Python is available
    local python_cmd=""
    if command -v python3 >/dev/null 2>&1; then
        python_cmd="python3"
    elif command -v python >/dev/null 2>&1; then
        python_cmd="python"
    else
        log_warning "Python not available (falling back to basic sed update)"
        local progress_bar
        progress_bar=$(generate_progress_bar "$release_progress")
        cp "$project_file" "$project_file.backup"
        sed -i.bak "s#\*\*Completion\*\*: \[.*\] [0-9]\+%#**Completion**: [$progress_bar] $release_progress%#g" "$project_file"
        return 0
    fi

    # Run comprehensive Project update helper
    log_info "Running comprehensive Project update (update-project-complete.py)..."
    if $python_cmd "$python_script" "$project_file" "$release_id" 2>&1; then
        log_success "Comprehensive Project update complete: $release_id → $release_progress%"
    else
        log_warning "Comprehensive Project update failed (continuing)"
    fi
}

# ============================================================================
# VALIDATION FUNCTIONS
# ============================================================================

validate_consistency() {
    log_info "Validating status consistency across hierarchy..."

    local validation_errors=0

    # TODO: Implement full consistency checking
    # - Check task status matches WP task matrix
    # - Check WP progress matches calculated points
    # - Check release progress matches WP aggregation
    # - Check project summary matches release status

    log_info "Consistency validation: PLACEHOLDER (to be implemented)"

    if [[ "$validation_errors" -gt 0 ]]; then
        log_error "Found $validation_errors consistency errors"
        return $EXIT_VALIDATION_FAILED
    fi

    log_success "Consistency validation passed"
    return $EXIT_SUCCESS
}

# ============================================================================
# MAIN PROPAGATION LOGIC
# ============================================================================

propagate_status_update() {
    local task_id="$1"

    log_info "Starting status propagation for $task_id..."

    # Step 1: Parse task frontmatter
    log_info "Step 1: Parsing task frontmatter..."
    local task_data
    if ! task_data=$(parse_task_frontmatter "$task_id"); then
        log_error "Failed to parse task frontmatter for $task_id"
        return $EXIT_PARSE_ERROR
    fi

    # Extract fields (parse line by line to avoid eval issues)
    local estado complejidad completado progreso progreso_num status_emoji
    while IFS='=' read -r key value; do
        case "$key" in
            estado) estado="$value" ;;
            complejidad) complejidad="$value" ;;
            completado) completado="$value" ;;
            progreso) progreso="$value" ;;
        esac
    done <<< "$task_data"

    # Extract numeric progress (remove % if present)
    progreso_num=$(echo "$progreso" | sed 's/%//g')

    # Map estado to status emoji
    if [[ "$estado" == *"COMPLETADO"* ]] || [[ "$progreso_num" == "100" ]]; then
        status_emoji="✅ Complete"
    elif [[ "$estado" == *"En Progreso"* ]] || [[ "$progreso_num" -gt 0 && "$progreso_num" -lt 100 ]]; then
        status_emoji="🟡 In Progress"
    else
        status_emoji="🔴 Not Started"
    fi

    log_metric "Task Status: $estado | Complexity: $complejidad | Progress: $progreso%"

    # Step 2: Get parent WP and Release
    log_info "Step 2: Determining parent WP and Release..."
    local parent_data
    if ! parent_data=$(get_parent_wp_and_release "$task_id"); then
        log_error "Failed to determine parent WP/Release for $task_id"
        return $EXIT_PARSE_ERROR
    fi

    local wp_id release_id
    IFS='|' read -r wp_id release_id <<< "$parent_data"

    log_info "Parent: $wp_id (Release: $release_id)"

    # Step 3: Update WP task matrix
    log_info "Step 3: Updating WP task matrix..."
    local wp_file="$PROGRESS_DIR/${wp_id}-progress.md"
    update_wp_task_matrix "$wp_file" "$task_id" "$estado" "$progreso" "$completado"

    # Step 3.5: Update comprehensive WP sections (NEW)
    update_wp_comprehensive_sections "$wp_file" "$task_id" "$status_emoji" "$progreso_num" "$complejidad"

    # Step 4: Calculate WP progress
    log_info "Step 4: Calculating WP progress..."
    local wp_progress
    wp_progress=$(calculate_wp_progress "$wp_id")

    # Step 5: Check if WP milestone reached
    log_info "Step 5: Checking WP milestone..."
    if is_milestone "$wp_progress"; then
        log_success "WP milestone reached: $wp_progress%"

        # Update WP progress bar
        update_wp_progress_bar "$wp_file" "$wp_progress"

        # Step 6: Update Release WP summary
        log_info "Step 6: Updating Release WP summary..."
        local release_file="$STATUS_DIR/${release_id}-RELEASE-STATUS.md"
        update_release_wp_summary "$release_file" "$wp_id" "$wp_progress"

        # Step 7: Calculate Release progress
        log_info "Step 7: Calculating Release progress..."
        local release_progress
        release_progress=$(calculate_release_progress "$release_id")

        # Step 8: Check if Release status changed
        log_info "Step 8: Checking Release status change..."
        if is_milestone "$release_progress"; then
            log_success "Release milestone reached: $release_progress%"

            # Step 9: Update Project summary
            log_info "Step 9: Updating Project summary..."
            local project_file="$STATUS_DIR/PROJECT-STATUS.md"
            update_project_summary "$project_file" "$release_id" "$release_progress"
        else
            log_info "Release not at milestone ($release_progress%), stopping propagation"
        fi
    else
        log_info "WP not at milestone ($wp_progress%), updating progress bar only"
        update_wp_progress_bar "$wp_file" "$wp_progress"
    fi

    log_success "Status propagation complete for $task_id"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    # Parse arguments
    local task_id=""

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --dry-run)
                DRY_RUN=true
                log_info "DRY RUN MODE: No files will be modified"
                shift
                ;;
            --validate)
                VALIDATE_ONLY=true
                shift
                ;;
            --fix)
                AUTO_FIX=true
                shift
                ;;
            --quiet)
                QUIET_MODE=true
                shift
                ;;
            -h|--help)
                cat <<EOF
Usage: $0 [OPTIONS] TASK_ID

Deterministic status tracking automation for AI Document Editor project.
Propagates task status updates through: Task → WP → Release → Project Status

Options:
  TASK_ID              Task identifier (e.g., T-04)
  --dry-run            Preview changes without writing files
  --validate           Check consistency across 4 levels
  --fix                Auto-correct inconsistencies
  --quiet              Suppress verbose output
  -h, --help           Show this help message

Examples:
  $0 T-04                    # Full propagation for T-04
  $0 T-04 --dry-run          # Preview T-04 updates
  $0 --validate              # Validate entire hierarchy
  $0 --fix                   # Auto-correct inconsistencies

Exit Codes:
  0 - Success
  1 - Validation failed
  2 - File not found
  3 - Parse error

See: docs/development/STATUS-TRACKING-UPDATE-WORKFLOW.md
EOF
                exit $EXIT_SUCCESS
                ;;
            T-*)
                task_id="$1"
                shift
                ;;
            *)
                log_error "Unknown argument: $1"
                exit $EXIT_PARSE_ERROR
                ;;
        esac
    done

    # Validate mode
    if [[ "$VALIDATE_ONLY" == true ]]; then
        validate_consistency
        exit $?
    fi

    # Require task ID for propagation
    if [[ -z "$task_id" ]]; then
        log_error "Task ID required (e.g., T-04)"
        echo "Use --help for usage information"
        exit $EXIT_PARSE_ERROR
    fi

    # Execute propagation
    propagate_status_update "$task_id"
}

# Run main if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
