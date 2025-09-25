#!/bin/bash
# Database Abstraction Layer for Sub Tareas v2.md Migration
# Provides unified interface during monolith → distributed migration
# Usage: source tools/database-abstraction.sh

# Migration mode control
DATABASE_MODE="${DATABASE_MODE:-monolith}"  # monolith|distributed|hybrid
MONOLITH_FILE="docs/project-management/Sub Tareas v2.md"
DISTRIBUTED_DIR="docs/tasks"
MIGRATION_LOG="logs/migration.log"

# Logging function
log_migration() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$MIGRATION_LOG"
}

# Core abstraction functions
get_task_data() {
    local task_id="$1"
    local data_type="${2:-full}"  # full|status|metadata|subtasks

    case "$DATABASE_MODE" in
        "monolith")
            query_monolith "$task_id" "$data_type"
            ;;
        "distributed")
            query_distributed "$task_id" "$data_type"
            ;;
        "hybrid")
            # Try distributed first, fallback to monolith
            if query_distributed "$task_id" "$data_type" 2>/dev/null; then
                return 0
            else
                log_migration "FALLBACK: $task_id query failed in distributed, using monolith"
                query_monolith "$task_id" "$data_type"
            fi
            ;;
        *)
            echo "❌ Unknown database mode: $DATABASE_MODE" >&2
            exit 1
            ;;
    esac
}

# Monolith query functions (existing logic)
query_monolith() {
    local task_id="$1"
    local data_type="$2"

    if [[ ! -f "$MONOLITH_FILE" ]]; then
        echo "❌ Monolith file not found: $MONOLITH_FILE" >&2
        return 1
    fi

    local task_start=$(grep -n "### \*\*Tarea ${task_id}:" "$MONOLITH_FILE" | cut -d: -f1)

    if [[ -z "$task_start" ]]; then
        echo "❌ Task $task_id not found in monolith" >&2
        return 1
    fi

    case "$data_type" in
        "status")
            sed -n "${task_start},/### \*\*Tarea/p" "$MONOLITH_FILE" | \
                grep "Estado:" | head -1 | sed 's/- \*\*Estado:\*\* //'
            ;;
        "metadata")
            sed -n "${task_start},/### \*\*Tarea/p" "$MONOLITH_FILE" | \
                head -15 | grep -E "(Estado|Complejidad|Prioridad|Release Target|Release):"
            ;;
        "subtasks")
            extract_monolith_subtasks "$task_id"
            ;;
        "full"|*)
            local next_task=$(sed -n "${task_start},\$p" "$MONOLITH_FILE" | \
                grep -n "### \*\*Tarea" | sed -n '2p' | cut -d: -f1)
            if [[ -n "$next_task" ]]; then
                local task_end=$((task_start + next_task - 2))
                sed -n "${task_start},${task_end}p" "$MONOLITH_FILE"
            else
                sed -n "${task_start},\$p" "$MONOLITH_FILE"
            fi
            ;;
    esac
}

# Distributed query functions (new system)
query_distributed() {
    local task_id="$1"
    local data_type="$2"
    local task_file="$DISTRIBUTED_DIR/${task_id}-STATUS.md"

    if [[ ! -f "$task_file" ]]; then
        echo "❌ Distributed file not found: $task_file" >&2
        return 1
    fi

    case "$data_type" in
        "status")
            if command -v yq >/dev/null 2>&1; then
                yq eval '.estado' "$task_file" 2>/dev/null
            else
                parse_yaml_value "$task_file" "estado"
            fi
            ;;
        "metadata")
            if command -v yq >/dev/null 2>&1; then
                yq eval '.task_id, .release_target, .estado, .complejidad, .prioridad' "$task_file" 2>/dev/null
            else
                for field in task_id release_target estado complejidad prioridad; do
                    # Map release_target to release for consistency
                    if [[ "$field" == "release_target" ]]; then
                        echo "release: $(parse_yaml_value "$task_file" "$field")"
                    else
                        echo "$field: $(parse_yaml_value "$task_file" "$field")"
                    fi
                done
            fi
            ;;
        "subtasks")
            extract_distributed_subtasks "$task_id"
            ;;
        "full"|*)
            cat "$task_file"
            ;;
    esac
}

# Helper function for monolith subtask extraction
extract_monolith_subtasks() {
    local task_id="$1"
    local task_start=$(grep -n "### \*\*Tarea ${task_id}:" "$MONOLITH_FILE" | cut -d: -f1)

    if [[ -z "$task_start" ]]; then
        return 1
    fi

    local next_task=$(sed -n "${task_start},\$p" "$MONOLITH_FILE" | \
        grep -n "### \*\*Tarea" | sed -n '2p' | cut -d: -f1)
    local task_end
    if [[ -n "$next_task" ]]; then
        task_end=$((task_start + next_task - 2))
    else
        task_end=$(wc -l < "$MONOLITH_FILE")
    fi

    # Extract subtask table
    sed -n "${task_start},${task_end}p" "$MONOLITH_FILE" | \
        awk '/\| ID del Elemento de Trabajo \(WII\)/ { in_table=1; next }
             in_table && /^\|/ && !/ID del Elemento de Trabajo/ && !/^[ ]*\|[ ]*-/ { print }
             in_table && (/^$/ || /^---/ || /^###/) { in_table=0 }'
}

# YAML/JSON fallback parsing functions
parse_yaml_value() {
    local file="$1"
    local key="$2"

    # Extract value from YAML frontmatter between --- markers
    sed -n '/^---$/,/^---$/p' "$file" | \
    awk -F': *' -v key="$key" '
        $1 == key {
            # Remove quotes and print value
            gsub(/^"/, "", $2)
            gsub(/"$/, "", $2)
            print $2
        }' | head -1
}

parse_yaml_array() {
    local file="$1"
    local array_key="$2"

    # Extract array items from YAML frontmatter
    sed -n '/^---$/,/^---$/p' "$file" | \
    awk -v array_key="$array_key" '
        $0 ~ "^" array_key ":" { in_array=1; next }
        in_array && /^  - / {
            gsub(/^  - /, "")
            print
        }
        in_array && /^[^ ]/ && !/^  / { in_array=0 }
    '
}

# Helper function for distributed subtask extraction
extract_distributed_subtasks() {
    local task_id="$1"
    local task_file="$DISTRIBUTED_DIR/${task_id}-STATUS.md"

    if [[ ! -f "$task_file" ]]; then
        return 1
    fi

    # Try YAML frontmatter first, fallback to markdown parsing
    if command -v yq >/dev/null 2>&1; then
        yq eval '.wii_subtasks[] | [.id, .description, .complejidad, .entregable] | @csv' "$task_file" 2>/dev/null
    else
        # Fallback: Parse YAML frontmatter manually
        sed -n '/^---$/,/^---$/p' "$task_file" | \
        awk '
            /wii_subtasks:/ { in_subtasks=1; next }
            in_subtasks && /^  - id:/ {
                id = $0
                gsub(/^  - id: *"?/, "", id)
                gsub(/"? *$/, "", id)
                getline; desc = $0
                gsub(/^ *description: *"?/, "", desc)
                gsub(/"? *$/, "", desc)
                getline; comp = $0
                gsub(/^ *complejidad: */, "", comp)
                getline; entregable = $0
                gsub(/^ *entregable: *"?/, "", entregable)
                gsub(/"? *$/, "", entregable)
                printf "%s|%s|%s|%s\n", id, desc, comp, entregable
            }
            in_subtasks && /^[^ ]/ && !/^  / { in_subtasks=0 }
        '
    fi
}

# Status update abstraction
update_task_status() {
    local task_id="$1"
    local new_status="$2"

    case "$DATABASE_MODE" in
        "monolith")
            update_monolith_status "$task_id" "$new_status"
            ;;
        "distributed")
            update_distributed_status "$task_id" "$new_status"
            ;;
        "hybrid")
            # Update both systems
            update_monolith_status "$task_id" "$new_status"
            update_distributed_status "$task_id" "$new_status"
            log_migration "HYBRID: Updated status for $task_id in both systems"
            ;;
    esac
}

# Migration utility functions
check_migration_prerequisites() {
    echo "🔧 Checking migration prerequisites..."

    # Check essential tools only (yq/jq are optional with fallbacks)
    local missing_tools=()
    for tool in awk sed grep; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            missing_tools+=("$tool")
        fi
    done

    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        echo "❌ Missing required tools: ${missing_tools[*]}"
        return 1
    fi

    # Check for yq/jq but don't fail if missing
    if ! command -v yq >/dev/null 2>&1; then
        echo "⚠️  yq not found - using fallback YAML parsing"
    fi

    if ! command -v jq >/dev/null 2>&1; then
        echo "⚠️  jq not found - using fallback JSON parsing"
    fi

    # Check file structure
    if [[ ! -f "$MONOLITH_FILE" ]]; then
        echo "❌ Monolith file not found: $MONOLITH_FILE"
        return 1
    fi

    if [[ ! -d "$DISTRIBUTED_DIR" ]]; then
        echo "📁 Creating distributed directory: $DISTRIBUTED_DIR"
        mkdir -p "$DISTRIBUTED_DIR"
    fi

    # Check log directory
    mkdir -p "$(dirname "$MIGRATION_LOG")"

    echo "✅ Migration prerequisites satisfied"
    return 0
}

# Initialize abstraction layer
init_abstraction_layer() {
    echo "🚀 Initializing Database Abstraction Layer"
    echo "Mode: $DATABASE_MODE"

    check_migration_prerequisites || exit 1

    log_migration "Abstraction layer initialized in $DATABASE_MODE mode"
    echo "✅ Abstraction layer ready"
}

# Export functions for use by other scripts
export -f get_task_data query_monolith query_distributed update_task_status
export -f extract_monolith_subtasks extract_distributed_subtasks
export DATABASE_MODE MONOLITH_FILE DISTRIBUTED_DIR MIGRATION_LOG

# Initialize if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    init_abstraction_layer
fi