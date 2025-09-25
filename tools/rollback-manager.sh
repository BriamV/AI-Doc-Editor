#!/bin/bash
# Rollback Manager for Sub Tareas v2.md Migration
# Provides comprehensive rollback and recovery capabilities
# Usage: ./tools/rollback-manager.sh [create-checkpoint|list-checkpoints|rollback|emergency-restore]

set -euo pipefail

# Configuration
MONOLITH_FILE="docs/project-management/Sub Tareas v2.md"
DISTRIBUTED_DIR="docs/tasks"
CHECKPOINT_DIR="backups/migration-checkpoints"
EMERGENCY_BACKUP_DIR="backups/emergency"
ROLLBACK_LOG="logs/rollback.log"

# Create necessary directories
mkdir -p "$CHECKPOINT_DIR" "$EMERGENCY_BACKUP_DIR" "$(dirname "$ROLLBACK_LOG")"

# Logging function
log_rollback() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$ROLLBACK_LOG"
}

# Generate checkpoint metadata
generate_checkpoint_metadata() {
    local checkpoint_id="$1"
    local description="$2"

    cat > "$CHECKPOINT_DIR/$checkpoint_id.meta" << EOF
{
  "checkpoint_id": "$checkpoint_id",
  "timestamp": "$(date -Iseconds)",
  "description": "$description",
  "monolith_file": "$MONOLITH_FILE",
  "monolith_exists": $([ -f "$MONOLITH_FILE" ] && echo "true" || echo "false"),
  "monolith_size": $([ -f "$MONOLITH_FILE" ] && wc -c < "$MONOLITH_FILE" || echo "0"),
  "monolith_checksum": "$([ -f "$MONOLITH_FILE" ] && sha256sum "$MONOLITH_FILE" | cut -d' ' -f1 || echo 'null')",
  "distributed_dir": "$DISTRIBUTED_DIR",
  "distributed_exists": $([ -d "$DISTRIBUTED_DIR" ] && echo "true" || echo "false"),
  "distributed_file_count": $([ -d "$DISTRIBUTED_DIR" ] && ls -1 "$DISTRIBUTED_DIR"/T-*-STATUS.md 2>/dev/null | wc -l || echo "0"),
  "database_mode": "${DATABASE_MODE:-monolith}",
  "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')"
}
EOF
}

# Create migration checkpoint
create_checkpoint() {
    local description="${1:-Manual checkpoint}"
    local checkpoint_id="checkpoint_$(date +%Y%m%d_%H%M%S)"

    log_rollback "Creating migration checkpoint: $checkpoint_id"

    # Create checkpoint directory
    local checkpoint_path="$CHECKPOINT_DIR/$checkpoint_id"
    mkdir -p "$checkpoint_path"

    # Backup monolith file
    if [[ -f "$MONOLITH_FILE" ]]; then
        cp "$MONOLITH_FILE" "$checkpoint_path/Sub_Tareas_v2.md"
        log_rollback "✅ Backed up monolith file"
    else
        log_rollback "⚠️  Monolith file not found: $MONOLITH_FILE"
    fi

    # Backup distributed files
    if [[ -d "$DISTRIBUTED_DIR" ]] && [[ "$(ls -A "$DISTRIBUTED_DIR" 2>/dev/null | wc -l)" -gt 0 ]]; then
        mkdir -p "$checkpoint_path/distributed"
        cp "$DISTRIBUTED_DIR"/*.md "$checkpoint_path/distributed/" 2>/dev/null || true
        log_rollback "✅ Backed up distributed files ($(ls -1 "$checkpoint_path/distributed" | wc -l) files)"
    else
        log_rollback "⚠️  Distributed directory empty or not found"
    fi

    # Backup tools configuration
    if [[ -f "tools/database-abstraction.sh" ]]; then
        cp "tools/database-abstraction.sh" "$checkpoint_path/"
        log_rollback "✅ Backed up abstraction layer"
    fi

    # Backup sync configuration
    for tool in sync-systems.sh migration-validator.sh; do
        if [[ -f "tools/$tool" ]]; then
            cp "tools/$tool" "$checkpoint_path/"
            log_rollback "✅ Backed up $tool"
        fi
    done

    # Generate metadata
    generate_checkpoint_metadata "$checkpoint_id" "$description"

    log_rollback "🎯 Checkpoint created successfully: $checkpoint_id"
    echo "$checkpoint_id"
}

# List available checkpoints
list_checkpoints() {
    log_rollback "📋 Available migration checkpoints:"

    if [[ ! -d "$CHECKPOINT_DIR" ]] || [[ -z "$(ls -A "$CHECKPOINT_DIR" 2>/dev/null)" ]]; then
        log_rollback "No checkpoints found"
        return 0
    fi

    echo ""
    printf "%-25s %-20s %-50s %s\n" "CHECKPOINT ID" "TIMESTAMP" "DESCRIPTION" "STATUS"
    printf "%-25s %-20s %-50s %s\n" "$(printf '%.25s' "$(printf '%*s' 25 '' | tr ' ' '-')")" "$(printf '%.20s' "$(printf '%*s' 20 '' | tr ' ' '-')")" "$(printf '%.50s' "$(printf '%*s' 50 '' | tr ' ' '-')")" "$(printf '%.10s' "$(printf '%*s' 10 '' | tr ' ' '-')")"

    for checkpoint_dir in "$CHECKPOINT_DIR"/checkpoint_*; do
        if [[ -d "$checkpoint_dir" ]]; then
            local checkpoint_id=$(basename "$checkpoint_dir")
            local meta_file="$CHECKPOINT_DIR/$checkpoint_id.meta"

            if [[ -f "$meta_file" ]]; then
                local timestamp=$(jq -r '.timestamp' "$meta_file" 2>/dev/null | cut -d'T' -f1 || echo "unknown")
                local description=$(jq -r '.description' "$meta_file" 2>/dev/null || echo "No description")
                local monolith_exists=$(jq -r '.monolith_exists' "$meta_file" 2>/dev/null || echo "unknown")
                local distributed_count=$(jq -r '.distributed_file_count' "$meta_file" 2>/dev/null || echo "0")

                local status="✅"
                if [[ "$monolith_exists" != "true" ]] && [[ "$distributed_count" == "0" ]]; then
                    status="⚠️  Empty"
                elif [[ "$monolith_exists" == "true" ]] && [[ "$distributed_count" -gt 0 ]]; then
                    status="🔄 Hybrid"
                elif [[ "$monolith_exists" == "true" ]]; then
                    status="📄 Monolith"
                elif [[ "$distributed_count" -gt 0 ]]; then
                    status="📂 Distributed"
                fi

                printf "%-25s %-20s %-50s %s\n" "$checkpoint_id" "$timestamp" "$description" "$status"
            else
                printf "%-25s %-20s %-50s %s\n" "$checkpoint_id" "unknown" "Metadata missing" "❌ Invalid"
            fi
        fi
    done

    echo ""
    log_rollback "Use 'rollback <checkpoint_id>' to restore a specific checkpoint"
}

# Validate checkpoint integrity
validate_checkpoint() {
    local checkpoint_id="$1"
    local checkpoint_path="$CHECKPOINT_DIR/$checkpoint_id"
    local meta_file="$CHECKPOINT_DIR/$checkpoint_id.meta"

    if [[ ! -d "$checkpoint_path" ]]; then
        log_rollback "❌ Checkpoint directory not found: $checkpoint_path"
        return 1
    fi

    if [[ ! -f "$meta_file" ]]; then
        log_rollback "❌ Checkpoint metadata not found: $meta_file"
        return 1
    fi

    # Validate metadata structure
    if ! jq empty "$meta_file" 2>/dev/null; then
        log_rollback "❌ Invalid checkpoint metadata format"
        return 1
    fi

    # Check expected files
    local expected_monolith=$(jq -r '.monolith_exists' "$meta_file" 2>/dev/null)
    local expected_distributed=$(jq -r '.distributed_file_count' "$meta_file" 2>/dev/null)

    if [[ "$expected_monolith" == "true" ]] && [[ ! -f "$checkpoint_path/Sub_Tareas_v2.md" ]]; then
        log_rollback "❌ Expected monolith file missing from checkpoint"
        return 1
    fi

    if [[ "$expected_distributed" -gt 0 ]] && [[ ! -d "$checkpoint_path/distributed" ]]; then
        log_rollback "❌ Expected distributed files missing from checkpoint"
        return 1
    fi

    # Validate checksums if available
    local expected_checksum=$(jq -r '.monolith_checksum' "$meta_file" 2>/dev/null)
    if [[ "$expected_checksum" != "null" ]] && [[ -f "$checkpoint_path/Sub_Tareas_v2.md" ]]; then
        local actual_checksum=$(sha256sum "$checkpoint_path/Sub_Tareas_v2.md" | cut -d' ' -f1)
        if [[ "$expected_checksum" != "$actual_checksum" ]]; then
            log_rollback "❌ Checkpoint integrity check failed - checksum mismatch"
            return 1
        fi
    fi

    log_rollback "✅ Checkpoint validation passed: $checkpoint_id"
    return 0
}

# Perform rollback to specific checkpoint
rollback_to_checkpoint() {
    local checkpoint_id="$1"
    local force="${2:-false}"

    log_rollback "🔄 Starting rollback to checkpoint: $checkpoint_id"

    # Validate checkpoint first
    if ! validate_checkpoint "$checkpoint_id"; then
        log_rollback "❌ Checkpoint validation failed, aborting rollback"
        return 1
    fi

    local checkpoint_path="$CHECKPOINT_DIR/$checkpoint_id"
    local meta_file="$CHECKPOINT_DIR/$checkpoint_id.meta"

    # Create emergency backup before rollback
    local emergency_id="emergency_before_rollback_$(date +%Y%m%d_%H%M%S)"
    log_rollback "🚨 Creating emergency backup: $emergency_id"

    local emergency_path="$EMERGENCY_BACKUP_DIR/$emergency_id"
    mkdir -p "$emergency_path"

    if [[ -f "$MONOLITH_FILE" ]]; then
        cp "$MONOLITH_FILE" "$emergency_path/"
        log_rollback "✅ Emergency backup of monolith created"
    fi

    if [[ -d "$DISTRIBUTED_DIR" ]] && [[ "$(ls -A "$DISTRIBUTED_DIR" 2>/dev/null | wc -l)" -gt 0 ]]; then
        mkdir -p "$emergency_path/distributed"
        cp "$DISTRIBUTED_DIR"/*.md "$emergency_path/distributed/" 2>/dev/null || true
        log_rollback "✅ Emergency backup of distributed files created"
    fi

    # Confirm rollback unless forced
    if [[ "$force" != "true" ]]; then
        echo ""
        log_rollback "⚠️  WARNING: This will overwrite the current database state"
        log_rollback "Emergency backup created at: $emergency_path"
        read -p "Continue with rollback? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_rollback "Rollback cancelled by user"
            return 1
        fi
    fi

    # Restore monolith file
    if [[ -f "$checkpoint_path/Sub_Tareas_v2.md" ]]; then
        cp "$checkpoint_path/Sub_Tareas_v2.md" "$MONOLITH_FILE"
        log_rollback "✅ Restored monolith file"
    else
        if [[ -f "$MONOLITH_FILE" ]]; then
            rm "$MONOLITH_FILE"
            log_rollback "🗑️  Removed monolith file (not in checkpoint)"
        fi
    fi

    # Restore distributed files
    if [[ -d "$checkpoint_path/distributed" ]]; then
        # Clean existing distributed files
        if [[ -d "$DISTRIBUTED_DIR" ]]; then
            rm -f "$DISTRIBUTED_DIR"/T-*-STATUS.md 2>/dev/null || true
        else
            mkdir -p "$DISTRIBUTED_DIR"
        fi

        # Restore checkpoint files
        cp "$checkpoint_path/distributed"/*.md "$DISTRIBUTED_DIR/" 2>/dev/null || true
        local restored_count=$(ls -1 "$DISTRIBUTED_DIR"/T-*-STATUS.md 2>/dev/null | wc -l)
        log_rollback "✅ Restored $restored_count distributed files"
    else
        # Remove distributed files if not in checkpoint
        if [[ -d "$DISTRIBUTED_DIR" ]]; then
            rm -f "$DISTRIBUTED_DIR"/T-*-STATUS.md 2>/dev/null || true
            log_rollback "🗑️  Removed distributed files (not in checkpoint)"
        fi
    fi

    # Restore tools if they were backed up
    for tool in database-abstraction.sh sync-systems.sh migration-validator.sh; do
        if [[ -f "$checkpoint_path/$tool" ]]; then
            cp "$checkpoint_path/$tool" "tools/"
            log_rollback "✅ Restored $tool"
        fi
    done

    # Update database mode based on checkpoint
    local checkpoint_mode=$(jq -r '.database_mode' "$meta_file" 2>/dev/null || echo "monolith")
    export DATABASE_MODE="$checkpoint_mode"
    log_rollback "🔧 Set database mode to: $checkpoint_mode"

    log_rollback "🎯 Rollback completed successfully"
    log_rollback "Emergency backup location: $emergency_path"

    # Validate rollback
    log_rollback "🧪 Running post-rollback validation..."
    if ./tools/migration-validator.sh quick; then
        log_rollback "✅ Post-rollback validation passed"
    else
        log_rollback "❌ Post-rollback validation failed - check system integrity"
        return 1
    fi

    return 0
}

# Emergency restore (fastest possible recovery)
emergency_restore() {
    log_rollback "🚨 EMERGENCY RESTORE INITIATED"

    # Find most recent checkpoint
    local latest_checkpoint=""
    local latest_time=0

    for checkpoint_dir in "$CHECKPOINT_DIR"/checkpoint_*; do
        if [[ -d "$checkpoint_dir" ]]; then
            local checkpoint_id=$(basename "$checkpoint_dir")
            local meta_file="$CHECKPOINT_DIR/$checkpoint_id.meta"

            if [[ -f "$meta_file" ]]; then
                local timestamp=$(jq -r '.timestamp' "$meta_file" 2>/dev/null | date -d "$(cat)" +%s 2>/dev/null || echo "0")
                if [[ $timestamp -gt $latest_time ]]; then
                    latest_time=$timestamp
                    latest_checkpoint="$checkpoint_id"
                fi
            fi
        fi
    done

    if [[ -z "$latest_checkpoint" ]]; then
        log_rollback "❌ No valid checkpoints found for emergency restore"

        # Try to find emergency backups
        if [[ -d "$EMERGENCY_BACKUP_DIR" ]]; then
            local latest_emergency=$(ls -1t "$EMERGENCY_BACKUP_DIR" | head -1)
            if [[ -n "$latest_emergency" ]]; then
                log_rollback "🆘 Found emergency backup: $latest_emergency"
                local emergency_path="$EMERGENCY_BACKUP_DIR/$latest_emergency"

                if [[ -f "$emergency_path/Sub_Tareas_v2.md" ]]; then
                    cp "$emergency_path/Sub_Tareas_v2.md" "$MONOLITH_FILE"
                    log_rollback "✅ Restored from emergency backup"
                    return 0
                fi
            fi
        fi

        log_rollback "❌ No recovery options available"
        return 1
    fi

    log_rollback "🎯 Emergency restore using latest checkpoint: $latest_checkpoint"

    # Force rollback without confirmation
    rollback_to_checkpoint "$latest_checkpoint" "true"
}

# Clean old checkpoints
cleanup_checkpoints() {
    local keep_count="${1:-10}"

    log_rollback "🧹 Cleaning up old checkpoints (keeping $keep_count most recent)"

    local checkpoints=($(ls -1t "$CHECKPOINT_DIR"/checkpoint_* 2>/dev/null | tail -n +$((keep_count + 1))))

    if [[ ${#checkpoints[@]} -eq 0 ]]; then
        log_rollback "No old checkpoints to clean up"
        return 0
    fi

    local cleaned_count=0
    for checkpoint_path in "${checkpoints[@]}"; do
        if [[ -d "$checkpoint_path" ]]; then
            local checkpoint_id=$(basename "$checkpoint_path")
            rm -rf "$checkpoint_path"
            rm -f "$CHECKPOINT_DIR/$checkpoint_id.meta"
            ((cleaned_count++))
            log_rollback "🗑️  Removed old checkpoint: $checkpoint_id"
        fi
    done

    log_rollback "✅ Cleaned up $cleaned_count old checkpoints"
}

# Main execution
main() {
    local action="${1:-list-checkpoints}"

    case "$action" in
        "create-checkpoint"|"create")
            local description="${2:-Manual checkpoint created via rollback-manager.sh}"
            create_checkpoint "$description"
            ;;
        "list-checkpoints"|"list")
            list_checkpoints
            ;;
        "rollback")
            local checkpoint_id="${2:-}"
            if [[ -z "$checkpoint_id" ]]; then
                echo "❌ Checkpoint ID required for rollback"
                echo "Usage: $0 rollback <checkpoint_id>"
                echo ""
                list_checkpoints
                exit 1
            fi
            rollback_to_checkpoint "$checkpoint_id"
            ;;
        "emergency-restore"|"emergency")
            emergency_restore
            ;;
        "validate")
            local checkpoint_id="${2:-}"
            if [[ -z "$checkpoint_id" ]]; then
                echo "❌ Checkpoint ID required for validation"
                exit 1
            fi
            validate_checkpoint "$checkpoint_id"
            ;;
        "cleanup")
            local keep_count="${2:-10}"
            cleanup_checkpoints "$keep_count"
            ;;
        *)
            echo "Usage: $0 <action> [options]"
            echo ""
            echo "Actions:"
            echo "  create-checkpoint [description]  Create a new migration checkpoint"
            echo "  list-checkpoints                 List all available checkpoints"
            echo "  rollback <checkpoint_id>         Rollback to specific checkpoint"
            echo "  emergency-restore                Emergency restore using latest checkpoint"
            echo "  validate <checkpoint_id>         Validate checkpoint integrity"
            echo "  cleanup [keep_count]             Clean up old checkpoints (default: keep 10)"
            echo ""
            echo "Examples:"
            echo "  $0 create-checkpoint 'Before distributed migration'"
            echo "  $0 list-checkpoints"
            echo "  $0 rollback checkpoint_20250124_143022"
            echo "  $0 emergency-restore"
            exit 1
            ;;
    esac
}

# Run if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi