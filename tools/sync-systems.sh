#!/bin/bash
# Bidirectional Sync System for Sub Tareas v2.md Migration
# Maintains data consistency between monolith and distributed systems
# Usage: ./tools/sync-systems.sh [monolith-to-distributed|distributed-to-monolith|bidirectional]

set -euo pipefail

# Configuration
MONOLITH_FILE="docs/project-management/archive/task-breakdown-detailed-v1.md"
DISTRIBUTED_DIR="docs/tasks"
BACKUP_DIR="backups/migration"
MIGRATION_LOG="logs/sync.log"

# Create necessary directories
mkdir -p "$DISTRIBUTED_DIR" "$BACKUP_DIR" "$(dirname "$MIGRATION_LOG")"

# Logging function
log_sync() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$MIGRATION_LOG"
}

# Backup functions
backup_monolith() {
    local backup_file="$BACKUP_DIR/Sub_Tareas_v2_$(date +%Y%m%d_%H%M%S).md"
    cp "$MONOLITH_FILE" "$backup_file"
    log_sync "Backed up monolith to: $backup_file"
}

backup_distributed() {
    local backup_dir="$BACKUP_DIR/distributed_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    if [[ -d "$DISTRIBUTED_DIR" ]] && [[ "$(ls -A "$DISTRIBUTED_DIR" 2>/dev/null | wc -l)" -gt 0 ]]; then
        cp -r "$DISTRIBUTED_DIR"/* "$backup_dir/"
        log_sync "Backed up distributed system to: $backup_dir"
    fi
}

# Checksum generation for integrity verification
generate_task_checksum() {
    local task_content="$1"
    echo "$task_content" | sha256sum | cut -d' ' -f1
}

# Extract task metadata from monolith
extract_task_metadata() {
    local task_id="$1"
    local task_start=$(grep -n "### \*\*Tarea ${task_id}:" "$MONOLITH_FILE" | cut -d: -f1)

    if [[ -z "$task_start" ]]; then
        log_sync "WARNING: Task $task_id not found in monolith"
        return 1
    fi

    local next_task=$(sed -n "${task_start},\$p" "$MONOLITH_FILE" | grep -n "### \*\*Tarea" | sed -n '2p' | cut -d: -f1)
    local task_end
    if [[ -n "$next_task" ]]; then
        task_end=$((task_start + next_task - 2))
    else
        task_end=$(wc -l < "$MONOLITH_FILE")
    fi

    # Extract task section
    local task_content=$(sed -n "${task_start},${task_end}p" "$MONOLITH_FILE")

    # Parse metadata
    local title=$(echo "$task_content" | head -1 | sed 's/### \*\*Tarea [^:]*: //' | sed 's/\*\*$//')
    local estado=$(echo "$task_content" | grep "Estado:" | head -1 | sed 's/- \*\*Estado:\*\* //')
    local complejidad=$(echo "$task_content" | grep "Complejidad:" | head -1 | sed 's/- \*\*Complejidad:\*\* //' | sed 's/ puntos.*//')
    local prioridad=$(echo "$task_content" | grep "Prioridad:" | head -1 | sed 's/- \*\*Prioridad:\*\* //')
    local release=$(echo "$task_content" | grep "Release:" | head -1 | sed 's/- \*\*Release:\*\* //' | cut -d' ' -f1)

    # Extract DoD checklist
    local dod_section=$(echo "$task_content" | awk '/Criterios de Definición de Hecho/,/^$/ {print}' | grep "^- \[" | sed 's/^- \[ \] //' | sed 's/^- \[x\] //')

    # Extract acceptance criteria
    local acceptance_section=$(echo "$task_content" | awk '/Criterios de Aceptación/,/^$/ {print}' | grep "^- " | sed 's/^- //')

    echo "$task_id|$title|$estado|$complejidad|$prioridad|$release|$dod_section|$acceptance_section|$task_content"
}

# Extract WII subtasks from monolith
extract_wii_subtasks() {
    local task_id="$1"
    local task_start=$(grep -n "### \*\*Tarea ${task_id}:" "$MONOLITH_FILE" | cut -d: -f1)

    if [[ -z "$task_start" ]]; then
        return 1
    fi

    local next_task=$(sed -n "${task_start},\$p" "$MONOLITH_FILE" | grep -n "### \*\*Tarea" | sed -n '2p' | cut -d: -f1)
    local task_end
    if [[ -n "$next_task" ]]; then
        task_end=$((task_start + next_task - 2))
    else
        task_end=$(wc -l < "$MONOLITH_FILE")
    fi

    # Extract subtask table with proper parsing
    sed -n "${task_start},${task_end}p" "$MONOLITH_FILE" | \
        awk '/\| ID del Elemento de Trabajo \(WII\)/ { in_table=1; next }
             in_table && /^\|/ && !/ID del Elemento de Trabajo/ && !/^[ ]*\|[ ]*-/ {
                 if ($0 !~ /^[ ]*\|[ ]*-/) {
                     # Clean up the line and split fields
                     gsub(/^\| */, "", $0)
                     gsub(/ *\| */, "|", $0)
                     gsub(/ *\|$/, "", $0)
                     if (NF > 0 && $1 != "") print $0
                 }
             }
             in_table && (/^$/ || /^---/ || /^###/) { in_table=0 }'
}

# Sync from monolith to distributed system
sync_monolith_to_distributed() {
    log_sync "Starting monolith → distributed sync"

    if [[ ! -f "$MONOLITH_FILE" ]]; then
        log_sync "ERROR: Monolith file not found: $MONOLITH_FILE"
        return 1
    fi

    backup_distributed

    local synced_count=0
    local error_count=0

    # Extract all tasks
    while IFS=: read -r line_num task_line; do
        local task_id=$(echo "$task_line" | grep -o "T-[0-9]\+" | head -1)

        if [[ -z "$task_id" ]]; then
            continue
        fi

        log_sync "Processing task: $task_id"

        # Extract metadata
        local metadata=$(extract_task_metadata "$task_id")
        if [[ $? -ne 0 ]]; then
            log_sync "ERROR: Failed to extract metadata for $task_id"
            ((error_count++))
            continue
        fi

        IFS='|' read -r task_id title estado complejidad prioridad release dod_section acceptance_section task_content <<< "$metadata"

        # Extract WII subtasks
        local subtasks=$(extract_wii_subtasks "$task_id")

        # Generate distributed file
        local distributed_file="$DISTRIBUTED_DIR/${task_id}-STATUS.md"

        # Create YAML frontmatter + Markdown content
        cat > "$distributed_file" << EOF
---
task_id: "$task_id"
title: "$title"
release: "${release:-unknown}"
estado: "$estado"
complejidad: ${complejidad:-0}
prioridad: "${prioridad:-Media}"
wii_subtasks: []
# WII subtasks will be populated below
dod_checklist: []
# DoD checklist will be populated below
acceptance_criteria: []
# Acceptance criteria will be populated below
sync_metadata:
  last_sync: "$(date -Iseconds)"
  source: "monolith"
  checksum: "$(generate_task_checksum "$task_content")"
---

# Tarea $task_id: $title

## Información General
**Estado:** $estado
**Release:** ${release:-No especificado}
**Complejidad:** ${complejidad:-0} puntos de historia
**Prioridad:** ${prioridad:-Media}

## Subtareas WII

EOF

        # Add WII subtasks to YAML frontmatter
        if [[ -n "$subtasks" ]]; then
            echo "$subtasks" | while IFS='|' read -r wii description complexity deliverable; do
                if [[ -n "$wii" ]] && [[ "$wii" != "-" ]]; then
                    # Escape YAML special characters
                    description=$(echo "$description" | sed 's/"/\\"/g')
                    deliverable=$(echo "$deliverable" | sed 's/"/\\"/g')

                    # Add to both YAML and Markdown sections
                    yq eval -i ".wii_subtasks += [{\"id\": \"$wii\", \"description\": \"$description\", \"complejidad\": ${complexity:-1}, \"estado\": \"Pendiente\", \"entregable\": \"$deliverable\"}]" "$distributed_file" 2>/dev/null || {
                        # Fallback: manually append to YAML section (if yq not available)
                        sed -i "/wii_subtasks: \[\]/a\\  - id: \"$wii\"\\n    description: \"$description\"\\n    complejidad: ${complexity:-1}\\n    estado: \"Pendiente\"\\n    entregable: \"$deliverable\"" "$distributed_file"
                    }

                    # Add to markdown section
                    echo "- **$wii** (${complexity:-1} pts): $description" >> "$distributed_file"
                    echo "  📦 *Entregable: $deliverable*" >> "$distributed_file"
                    echo "" >> "$distributed_file"
                fi
            done
        fi

        # Add DoD and acceptance criteria sections
        cat >> "$distributed_file" << EOF

## Criterios de Definición de Hecho (DoD)
$dod_section

## Criterios de Aceptación
$acceptance_section

## Contenido Original del Monolito
\`\`\`
$(echo "$task_content" | head -20)
[... contenido truncado para legibilidad ...]
\`\`\`

---
*Archivo generado automáticamente desde task-breakdown-detailed-v1.md*
*Última sincronización: $(date)*
EOF

        ((synced_count++))
        log_sync "✅ Created distributed file: $distributed_file"

    done < <(grep -n "### \*\*Tarea" "$MONOLITH_FILE")

    log_sync "Monolith → Distributed sync completed: $synced_count tasks synced, $error_count errors"
    return $error_count
}

# Sync from distributed to monolith system
sync_distributed_to_monolith() {
    log_sync "Starting distributed → monolith sync"

    if [[ ! -d "$DISTRIBUTED_DIR" ]]; then
        log_sync "ERROR: Distributed directory not found: $DISTRIBUTED_DIR"
        return 1
    fi

    backup_monolith

    local synced_count=0
    local error_count=0

    # Process each distributed file
    for distributed_file in "$DISTRIBUTED_DIR"/T-*-STATUS.md; do
        if [[ ! -f "$distributed_file" ]]; then
            continue
        fi

        local task_id=$(basename "$distributed_file" | sed 's/-STATUS\.md$//')
        log_sync "Processing distributed file: $task_id"

        # Extract metadata from distributed file
        local estado=$(yq eval '.estado' "$distributed_file" 2>/dev/null || grep "^estado:" "$distributed_file" | cut -d: -f2- | sed 's/^ *"//' | sed 's/"$//')

        if [[ -n "$estado" ]]; then
            # Update status in monolith
            if update_monolith_status "$task_id" "$estado"; then
                ((synced_count++))
                log_sync "✅ Updated status for $task_id in monolith: $estado"
            else
                ((error_count++))
                log_sync "❌ Failed to update status for $task_id in monolith"
            fi
        fi
    done

    log_sync "Distributed → Monolith sync completed: $synced_count tasks synced, $error_count errors"
    return $error_count
}

# Update status in monolith file
update_monolith_status() {
    local task_id="$1"
    local new_status="$2"

    local task_line=$(grep -n "### \*\*Tarea ${task_id}:" "$MONOLITH_FILE" | cut -d: -f1)

    if [[ -z "$task_line" ]]; then
        log_sync "ERROR: Task $task_id not found in monolith for status update"
        return 1
    fi

    # Find the Estado line within this task's section
    local status_line=$(sed -n "${task_line},/### \*\*Tarea/p" "$MONOLITH_FILE" | grep -n "Estado:" | head -1 | cut -d: -f1)

    if [[ -n "$status_line" ]]; then
        local actual_line=$((task_line + status_line - 1))
        sed -i "${actual_line}s/Estado:\*\* .*/Estado:** $new_status/" "$MONOLITH_FILE"
        return 0
    else
        log_sync "ERROR: Estado line not found for task $task_id"
        return 1
    fi
}

# Bidirectional sync with conflict detection
sync_bidirectional() {
    log_sync "Starting bidirectional sync"

    # Check for conflicts first
    local conflicts=$(detect_sync_conflicts)

    if [[ -n "$conflicts" ]]; then
        log_sync "WARNING: Sync conflicts detected:"
        echo "$conflicts" | tee -a "$MIGRATION_LOG"
        read -p "Continue with sync anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_sync "Bidirectional sync aborted due to conflicts"
            return 1
        fi
    fi

    # Perform both syncs
    sync_monolith_to_distributed
    local m2d_result=$?

    sleep 2  # Small delay to avoid race conditions

    sync_distributed_to_monolith
    local d2m_result=$?

    if [[ $m2d_result -eq 0 ]] && [[ $d2m_result -eq 0 ]]; then
        log_sync "✅ Bidirectional sync completed successfully"
        return 0
    else
        log_sync "❌ Bidirectional sync completed with errors (m2d: $m2d_result, d2m: $d2m_result)"
        return 1
    fi
}

# Detect sync conflicts
detect_sync_conflicts() {
    local conflicts=""

    # Check file modification times
    if [[ -f "$MONOLITH_FILE" ]] && [[ -d "$DISTRIBUTED_DIR" ]]; then
        local monolith_mtime=$(stat -f %m "$MONOLITH_FILE" 2>/dev/null || stat -c %Y "$MONOLITH_FILE" 2>/dev/null)

        for distributed_file in "$DISTRIBUTED_DIR"/T-*-STATUS.md; do
            if [[ -f "$distributed_file" ]]; then
                local dist_mtime=$(stat -f %m "$distributed_file" 2>/dev/null || stat -c %Y "$distributed_file" 2>/dev/null)
                local time_diff=$((dist_mtime - monolith_mtime))

                if [[ $time_diff -gt 300 ]]; then  # 5 minute threshold
                    local task_id=$(basename "$distributed_file" | sed 's/-STATUS\.md$//')
                    conflicts="${conflicts}Task $task_id: Distributed file newer than monolith by $time_diff seconds\n"
                fi
            fi
        done
    fi

    echo -e "$conflicts"
}

# Validation functions
validate_sync_integrity() {
    log_sync "Validating sync integrity"

    local monolith_tasks=$(grep "### \*\*Tarea" "$MONOLITH_FILE" | wc -l)
    local distributed_tasks=$(ls -1 "$DISTRIBUTED_DIR"/T-*-STATUS.md 2>/dev/null | wc -l)

    log_sync "Task count - Monolith: $monolith_tasks, Distributed: $distributed_tasks"

    if [[ $monolith_tasks -ne $distributed_tasks ]]; then
        log_sync "WARNING: Task count mismatch between systems"
        return 1
    fi

    # Validate checksums for random sample
    local sample_count=3
    local validated=0

    for distributed_file in $(ls "$DISTRIBUTED_DIR"/T-*-STATUS.md | shuf | head -$sample_count); do
        local task_id=$(basename "$distributed_file" | sed 's/-STATUS\.md$//')
        local stored_checksum=$(yq eval '.sync_metadata.checksum' "$distributed_file" 2>/dev/null)

        if [[ -n "$stored_checksum" ]]; then
            local metadata=$(extract_task_metadata "$task_id")
            local current_checksum=$(echo "$metadata" | cut -d'|' -f9- | generate_task_checksum)

            if [[ "$stored_checksum" == "$current_checksum" ]]; then
                ((validated++))
                log_sync "✅ Checksum validation passed for $task_id"
            else
                log_sync "❌ Checksum validation failed for $task_id"
            fi
        fi
    done

    log_sync "Checksum validation: $validated/$sample_count tasks validated"
    return 0
}

# Main execution
main() {
    local sync_direction="${1:-bidirectional}"

    case "$sync_direction" in
        "monolith-to-distributed"|"m2d")
            sync_monolith_to_distributed
            ;;
        "distributed-to-monolith"|"d2m")
            sync_distributed_to_monolith
            ;;
        "bidirectional"|"both"|"")
            sync_bidirectional
            ;;
        "validate")
            validate_sync_integrity
            ;;
        *)
            echo "Usage: $0 [monolith-to-distributed|distributed-to-monolith|bidirectional|validate]"
            echo "  monolith-to-distributed (m2d): Sync from task-breakdown-detailed-v1.md to T-XX-STATUS.md files"
            echo "  distributed-to-monolith (d2m): Sync from T-XX-STATUS.md files to task-breakdown-detailed-v1.md"
            echo "  bidirectional (default):        Perform both syncs with conflict detection"
            echo "  validate:                       Validate sync integrity and checksums"
            exit 1
            ;;
    esac
}

# Run if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi