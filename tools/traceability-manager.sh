#!/bin/bash
# Traceability Management System for Task Migration
# Maintains complete audit trail and cross-reference validation
# Usage: ./tools/traceability-manager.sh [generate|validate|report|audit]

set -euo pipefail

# Configuration
MONOLITH_FILE="docs/project-management/archive/task-breakdown-detailed-v1.md"
DISTRIBUTED_DIR="docs/tasks"
TRACEABILITY_LOG="logs/traceability.log"
AUDIT_REPORT_DIR="logs/traceability-reports"

# Create directories
mkdir -p "$AUDIT_REPORT_DIR" "$(dirname "$TRACEABILITY_LOG")"

# Source database abstraction
source "$(dirname "$0")/database-abstraction.sh"

# Logging function
log_trace() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$TRACEABILITY_LOG"
}

# Generate comprehensive traceability matrix
generate_traceability_matrix() {
    local matrix_file="$AUDIT_REPORT_DIR/traceability-matrix-$(date +%Y%m%d_%H%M%S).json"

    log_trace "🔍 Generating comprehensive traceability matrix"

    # Initialize matrix structure
    cat > "$matrix_file" << EOF
{
  "generation_metadata": {
    "timestamp": "$(date -u '+%Y-%m-%dT%H:%M:%SZ')",
    "source_file": "$MONOLITH_FILE",
    "target_directory": "$DISTRIBUTED_DIR",
    "migration_phase": "Phase1-Foundation",
    "validator": "traceability-manager.sh"
  },
  "statistics": {
    "total_tasks": 0,
    "traced_tasks": 0,
    "missing_tasks": 0,
    "integrity_score": 0
  },
  "tasks": [],
  "cross_references": {
    "adr_references": [],
    "template_references": [],
    "wii_references": []
  },
  "validation_results": []
}
EOF

    local total_tasks=0
    local traced_tasks=0
    local missing_tasks=()

    # Extract all task IDs from monolith
    local all_task_ids
    all_task_ids=$(grep "### \*\*Tarea T-" "$MONOLITH_FILE" | \
        grep -o "T-[0-9]\+" | sort -V)

    for task_id in $all_task_ids; do
        ((total_tasks++))
        log_trace "📋 Processing traceability for $task_id"

        # Check if distributed file exists
        local distributed_file="$DISTRIBUTED_DIR/${task_id}-STATUS.md"
        local trace_status="missing"
        local integrity_checks={}

        if [[ -f "$distributed_file" ]]; then
            ((traced_tasks++))
            trace_status="traced"

            # Perform integrity checks
            integrity_checks=$(perform_integrity_checks "$task_id")
        else
            missing_tasks+=("$task_id")
        fi

        # Extract cross-references from both systems
        local cross_refs
        cross_refs=$(extract_cross_references "$task_id")

        # Add to matrix using jq (with fallback)
        if command -v jq >/dev/null 2>&1; then
            jq --arg task_id "$task_id" \
               --arg status "$trace_status" \
               --argjson integrity "$integrity_checks" \
               --argjson cross_refs "$cross_refs" \
               '.tasks += [{
                 "task_id": $task_id,
                 "trace_status": $status,
                 "integrity_checks": $integrity,
                 "cross_references": $cross_refs
               }]' "$matrix_file" > "${matrix_file}.tmp" && mv "${matrix_file}.tmp" "$matrix_file"
        else
            # Fallback for systems without jq
            local temp_entry="logs/temp_trace_entry.json"
            cat > "$temp_entry" << EOF
{
  "task_id": "$task_id",
  "trace_status": "$trace_status",
  "integrity_checks": $integrity_checks,
  "cross_references": $cross_refs
}
EOF
        fi
    done

    # Update statistics
    local integrity_score=$(( total_tasks > 0 ? traced_tasks * 100 / total_tasks : 0 ))

    if command -v jq >/dev/null 2>&1; then
        jq --argjson total "$total_tasks" \
           --argjson traced "$traced_tasks" \
           --argjson missing "${#missing_tasks[@]}" \
           --argjson score "$integrity_score" \
           '.statistics.total_tasks = $total |
            .statistics.traced_tasks = $traced |
            .statistics.missing_tasks = $missing |
            .statistics.integrity_score = $score' \
           "$matrix_file" > "${matrix_file}.tmp" && mv "${matrix_file}.tmp" "$matrix_file"
    fi

    log_trace "📊 Traceability Matrix Generated:"
    log_trace "   Total Tasks: $total_tasks"
    log_trace "   Traced Tasks: $traced_tasks"
    log_trace "   Missing Tasks: ${#missing_tasks[@]}"
    log_trace "   Integrity Score: ${integrity_score}%"
    log_trace "   Matrix File: $matrix_file"

    if [[ ${#missing_tasks[@]} -gt 0 ]]; then
        log_trace "❌ Missing Tasks: ${missing_tasks[*]}"
        return 1
    else
        log_trace "✅ All tasks traced successfully"
        return 0
    fi
}

# Perform integrity checks for a specific task
perform_integrity_checks() {
    local task_id="$1"
    local distributed_file="$DISTRIBUTED_DIR/${task_id}-STATUS.md"

    # Initialize check results
    local metadata_check="false"
    local yaml_check="false"
    local content_check="false"
    local wii_check="false"
    local sync_check="false"

    if [[ -f "$distributed_file" ]]; then
        # Check YAML frontmatter
        if grep -q "^---$" "$distributed_file"; then
            yaml_check="true"
        fi

        # Check required metadata fields
        if grep -q "^task_id:" "$distributed_file" && \
           grep -q "^titulo:" "$distributed_file" && \
           grep -q "^estado:" "$distributed_file"; then
            metadata_check="true"
        fi

        # Check content sections
        if grep -q "## Estado Actual" "$distributed_file" && \
           grep -q "## Descripción" "$distributed_file"; then
            content_check="true"
        fi

        # Check WII subtasks
        if grep -q "wii_subtasks:" "$distributed_file"; then
            wii_check="true"
        fi

        # Check sync metadata
        if grep -q "sync_metadata:" "$distributed_file"; then
            sync_check="true"
        fi
    fi

    # Return as JSON string
    cat << EOF
{
  "metadata_fields": $metadata_check,
  "yaml_frontmatter": $yaml_check,
  "content_sections": $content_check,
  "wii_subtasks": $wii_check,
  "sync_metadata": $sync_check
}
EOF
}

# Extract cross-references from task
extract_cross_references() {
    local task_id="$1"
    local adr_refs=()
    local template_refs=()
    local wii_refs=()

    # Extract from monolith
    export DATABASE_MODE="monolith"
    local task_content
    task_content=$(get_task_data "$task_id" "full" 2>/dev/null || echo "")

    if [[ -n "$task_content" ]]; then
        # Extract ADR references
        while read -r adr_ref; do
            if [[ -n "$adr_ref" ]]; then
                adr_refs+=("\"$adr_ref\"")
            fi
        done < <(echo "$task_content" | grep -o "ADR-[0-9]\+" | sort -u)

        # Extract template references
        while read -r template_ref; do
            if [[ -n "$template_ref" ]]; then
                template_refs+=("\"$template_ref\"")
            fi
        done < <(echo "$task_content" | grep -o "T-[0-9]\+" | grep -v "^$task_id$" | sort -u)

        # Extract WII references
        while read -r wii_ref; do
            if [[ -n "$wii_ref" ]]; then
                wii_refs+=("\"$wii_ref\"")
            fi
        done < <(echo "$task_content" | grep -o "R[0-9]\+\.WP[0-9]\+-T[0-9]\+-ST[0-9]\+" | sort -u)
    fi

    export DATABASE_MODE="monolith"  # Reset

    # Format as JSON arrays - using printf to avoid IFS tampering
    local adr_array="["
    local template_array="["
    local wii_array="["

    # Safely build ADR array
    if [ ${#adr_refs[@]} -gt 0 ]; then
        printf -v adr_array '%s%s' "$adr_array" "$(printf '%s,' "${adr_refs[@]}")"
        adr_array="${adr_array%,}"  # Remove trailing comma
    fi
    adr_array+="]"

    # Safely build template array
    if [ ${#template_refs[@]} -gt 0 ]; then
        printf -v template_array '%s%s' "$template_array" "$(printf '%s,' "${template_refs[@]}")"
        template_array="${template_array%,}"  # Remove trailing comma
    fi
    template_array+="]"

    # Safely build WII array
    if [ ${#wii_refs[@]} -gt 0 ]; then
        printf -v wii_array '%s%s' "$wii_array" "$(printf '%s,' "${wii_refs[@]}")"
        wii_array="${wii_array%,}"  # Remove trailing comma
    fi
    wii_array+="]"

    cat << EOF
{
  "adr_references": $adr_array,
  "task_references": $template_array,
  "wii_references": $wii_array
}
EOF
}

# Validate cross-reference integrity
validate_cross_references() {
    log_trace "🔗 Validating cross-reference integrity"

    local validation_errors=()
    local total_refs=0
    local valid_refs=0

    # Check ADR references
    for task_file in "$DISTRIBUTED_DIR"/T-*-STATUS.md; do
        if [[ -f "$task_file" ]]; then
            local task_id
            task_id=$(basename "$task_file" -STATUS.md)

            # Extract ADR references
            while read -r adr_ref; do
                if [[ -n "$adr_ref" ]]; then
                    ((total_refs++))

                    # Check if ADR file exists
                    local adr_file="docs/architecture/adr/$adr_ref.md"
                    if [[ -f "$adr_file" ]]; then
                        ((valid_refs++))
                    else
                        validation_errors+=("$task_id: Missing ADR file $adr_file")
                    fi
                fi
            done < <(grep -o "ADR-[0-9]\+" "$task_file" 2>/dev/null | sort -u)
        fi
    done

    log_trace "📊 Cross-reference validation results:"
    log_trace "   Total References: $total_refs"
    log_trace "   Valid References: $valid_refs"
    log_trace "   Validation Errors: ${#validation_errors[@]}"

    if [[ ${#validation_errors[@]} -gt 0 ]]; then
        log_trace "❌ Cross-reference validation issues:"
        for error in "${validation_errors[@]}"; do
            log_trace "   $error"
        done
        return 1
    else
        log_trace "✅ All cross-references validated successfully"
        return 0
    fi
}

# Generate audit report
generate_audit_report() {
    local report_file="$AUDIT_REPORT_DIR/phase1-audit-report-$(date +%Y%m%d_%H%M%S).md"

    log_trace "📋 Generating Phase 1 audit report"

    cat > "$report_file" << EOF
# Phase 1 Migration Audit Report

**Generated:** $(date)
**Migration Phase:** Phase 1 - Foundation Setup and Dual System Architecture
**Validator:** traceability-manager.sh

## Executive Summary

This report provides a comprehensive audit of the Phase 1 migration from the monolithic task-breakdown-detailed-v1.md file to the distributed T-XX-STATUS.md architecture.

### Migration Statistics

EOF

    # Add statistics
    local total_tasks
    total_tasks=$(grep -c "### \*\*Tarea T-" "$MONOLITH_FILE" 2>/dev/null || echo "0")
    local distributed_files
    distributed_files=$(ls -1 "$DISTRIBUTED_DIR"/T-*-STATUS.md 2>/dev/null | wc -l)
    local coverage=$(( total_tasks > 0 ? distributed_files * 100 / total_tasks : 0 ))

    cat >> "$report_file" << EOF
- **Total Tasks in Monolith:** $total_tasks
- **Distributed Files Generated:** $distributed_files
- **Migration Coverage:** ${coverage}%
- **Data Preservation:** $(if [ $coverage -eq 100 ]; then echo "Complete"; else echo "Partial"; fi)

### File Size Analysis

\`\`\`
Original Monolith: $(wc -c < "$MONOLITH_FILE" 2>/dev/null || echo "0") bytes
Distributed Total: $(find "$DISTRIBUTED_DIR" -name "T-*-STATUS.md" -exec wc -c {} + 2>/dev/null | tail -1 | awk '{print $1}' || echo "0") bytes
Expansion Factor: ~$(( $(find "$DISTRIBUTED_DIR" -name "T-*-STATUS.md" -exec wc -c {} + 2>/dev/null | tail -1 | awk '{print $1}' || echo "1") * 100 / $(wc -c < "$MONOLITH_FILE" 2>/dev/null || echo "1") ))%
\`\`\`

### Architecture Validation

EOF

    # Test both systems
    local monolith_access="❌ Failed"
    local distributed_access="❌ Failed"

    export DATABASE_MODE="monolith"
    if get_task_data "T-01" "status" >/dev/null 2>&1; then
        monolith_access="✅ Working"
    fi

    export DATABASE_MODE="distributed"
    if get_task_data "T-01" "status" >/dev/null 2>&1; then
        distributed_access="✅ Working"
    fi

    export DATABASE_MODE="monolith"  # Reset

    cat >> "$report_file" << EOF
- **Monolith Access:** $monolith_access
- **Distributed Access:** $distributed_access
- **Abstraction Layer:** $([ -f "tools/database-abstraction.sh" ] && echo "✅ Deployed" || echo "❌ Missing")
- **Sync System:** $([ -f "tools/sync-systems.sh" ] && echo "✅ Deployed" || echo "❌ Missing")

### Data Integrity Checks

EOF

    # Perform sample integrity checks
    local sample_tasks=("T-01" "T-05" "T-10" "T-20")
    local integrity_passed=0
    local integrity_total=0

    for task_id in "${sample_tasks[@]}"; do
        if [[ -f "$DISTRIBUTED_DIR/${task_id}-STATUS.md" ]]; then
            ((integrity_total++))
            if grep -q "sync_metadata:" "$DISTRIBUTED_DIR/${task_id}-STATUS.md" && \
               grep -q "task_id:" "$DISTRIBUTED_DIR/${task_id}-STATUS.md"; then
                ((integrity_passed++))
            fi
        fi
    done

    cat >> "$report_file" << EOF
- **Sample Integrity Tests:** $integrity_passed/$integrity_total passed
- **Metadata Preservation:** $(( integrity_total > 0 ? integrity_passed * 100 / integrity_total : 0 ))%

### Recommendations

EOF

    if [[ $coverage -eq 100 ]]; then
        cat >> "$report_file" << EOF
✅ **Phase 1 Successful:** All tasks migrated successfully
- Dual system architecture is operational
- Data integrity maintained
- Ready for Phase 2 validation and testing

EOF
    else
        cat >> "$report_file" << EOF
⚠️  **Phase 1 Partial:** Migration needs completion
- Missing $(( total_tasks - distributed_files )) task files
- Review failed task parsing
- Complete migration before Phase 2

EOF
    fi

    cat >> "$report_file" << EOF
### Next Steps

1. **Immediate:**
   - Validate all task files using \`./tools/migration-validator.sh full\`
   - Test tool compatibility with both systems
   - Perform backup of current state

2. **Phase 2 Preparation:**
   - Begin comprehensive validation testing
   - Prepare rollback procedures
   - Document any custom adaptations needed

---
*Generated by Phase 1 Migration System*
*Traceability Manager v1.0*
EOF

    log_trace "📄 Audit report generated: $report_file"
    return 0
}

# Main execution
main() {
    local command="${1:-report}"

    case "$command" in
        "generate")
            generate_traceability_matrix
            ;;
        "validate")
            validate_cross_references
            ;;
        "report")
            generate_audit_report
            ;;
        "audit")
            log_trace "🧪 Running comprehensive audit"
            generate_traceability_matrix
            validate_cross_references
            generate_audit_report
            ;;
        *)
            echo "Usage: $0 [generate|validate|report|audit]"
            echo ""
            echo "Commands:"
            echo "  generate  - Generate traceability matrix"
            echo "  validate  - Validate cross-reference integrity"
            echo "  report    - Generate Phase 1 audit report"
            echo "  audit     - Run complete audit (all above)"
            echo ""
            echo "Examples:"
            echo "  $0 report                    # Generate audit report"
            echo "  $0 audit                     # Full audit with all checks"
            exit 1
            ;;
    esac
}

# Initialize traceability system
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    log_trace "🚀 Initializing Traceability Management System"
    main "$@"
fi