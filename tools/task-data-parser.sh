#!/bin/bash
# Task Data Parser for Sub Tareas v2.md → T-XX-STATUS.md Migration
# Extracts complete task data preserving all metadata fields
# Usage: ./tools/task-data-parser.sh [extract|generate|validate] [task_id]

set -euo pipefail

# Configuration
MONOLITH_FILE="docs/project-management/archive/task-breakdown-detailed-v1.md"
DISTRIBUTED_DIR="docs/tasks"
PARSER_LOG="logs/task-parser.log"
TEMP_DIR="logs/parser-temp"

# Create required directories
mkdir -p "$DISTRIBUTED_DIR" "$(dirname "$PARSER_LOG")" "$TEMP_DIR"

# Logging function
log_parser() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$PARSER_LOG"
}

# Metadata field extraction functions
extract_task_header() {
    local task_id="$1"
    local task_section="$2"

    echo "$task_section" | awk '
        /^- \*\*Título:\*\*/ {
            gsub(/^- \*\*Título:\*\* /, "")
            print "titulo=\"" $0 "\""
        }
        /^- \*\*Estado:\*\*/ {
            gsub(/^- \*\*Estado:\*\* /, "")
            print "estado=\"" $0 "\""
        }
        /^- \*\*Dependencias:\*\*/ {
            gsub(/^- \*\*Dependencias:\*\* /, "")
            print "dependencias=\"" $0 "\""
        }
        /^- \*\*Prioridad:\*\*/ {
            gsub(/^- \*\*Prioridad:\*\* /, "")
            print "prioridad=\"" $0 "\""
        }
        /^- \*\*Release Target:\*\*/ {
            gsub(/^- \*\*Release Target:\*\* /, "")
            print "release_target=\"" $0 "\""
        }
        /^- \*\*Descripción:\*\*/ {
            gsub(/^- \*\*Descripción:\*\* /, "")
            print "descripcion=\"" $0 "\""
        }
    '
}

extract_technical_details() {
    local task_section="$1"

    echo "$task_section" | awk '
        /^- \*\*Detalles Técnicos:\*\*/ { in_section=1; next }
        in_section && /^- \*\*[^:]*:\*\*/ && !/^- \*\*Detalles Técnicos:\*\*/ { in_section=0 }
        in_section && /^#### / { in_section=0 }
        in_section && /^  - / {
            gsub(/^  - /, "")
            print
        }
    '
}

extract_test_strategy() {
    local task_section="$1"

    echo "$task_section" | awk '
        /^- \*\*Estrategia de Test:\*\*/ { in_section=1; next }
        in_section && /^- \*\*[^:]*:\*\*/ && !/^- \*\*Estrategia de Test:\*\*/ { in_section=0 }
        in_section && /^#### / { in_section=0 }
        in_section && /^  - / {
            gsub(/^  - /, "")
            print
        }
    '
}

extract_documentation() {
    local task_section="$1"

    echo "$task_section" | awk '
        /^- \*\*Documentación:\*\*/ { in_section=1; next }
        in_section && /^- \*\*[^:]*:\*\*/ && !/^- \*\*Documentación:\*\*/ { in_section=0 }
        in_section && /^#### / { in_section=0 }
        in_section && /^  - / {
            gsub(/^  - /, "")
            print
        }
    '
}

extract_acceptance_criteria() {
    local task_section="$1"

    echo "$task_section" | awk '
        /^- \*\*Criterios de Aceptación:\*\*/ { in_section=1; next }
        in_section && /^- \*\*[^:]*:\*\*/ && !/^- \*\*Criterios de Aceptación:\*\*/ { in_section=0 }
        in_section && /^#### / { in_section=0 }
        in_section && /^  - / {
            gsub(/^  - /, "")
            print
        }
    '
}

extract_definition_of_done() {
    local task_section="$1"

    echo "$task_section" | awk '
        /^- \*\*Definición de Hecho \(DoD\):\*\*/ { in_section=1; next }
        in_section && /^- \*\*[^:]*:\*\*/ && !/^- \*\*Definición de Hecho \(DoD\):\*\*/ { in_section=0 }
        in_section && /^#### / { in_section=0 }
        in_section && /^  - / {
            gsub(/^  - /, "")
            print
        }
    '
}

extract_wii_subtasks() {
    local task_section="$1"
    local task_id="$2"

    # Extract subtask table with WII format
    echo "$task_section" | awk -v task_id="$task_id" '
        BEGIN { in_table=0; header_found=0 }
        /\| ID del Elemento de Trabajo \(WII\)/ {
            in_table=1
            header_found=1
            next
        }
        in_table && /^[ ]*\|[ ]*:?-/ { next }  # Skip table separator
        in_table && /^\|/ && header_found {
            # Parse table row
            gsub(/^\| */, "")
            gsub(/ *\|$/, "")
            split($0, fields, " *\\| *")

            if (fields[1] != "" && fields[1] !~ /ID del Elemento/) {
                # Clean WII ID
                wii_id = fields[1]
                gsub(/^✅ */, "", wii_id)  # Remove checkmark
                gsub(/ *$/, "", wii_id)   # Remove trailing spaces

                # Extract complexity (handle different formats)
                complejidad = fields[3]
                gsub(/ */, "", complejidad)

                printf "  - id: \"%s\"\n", wii_id
                printf "    description: \"%s\"\n", fields[2]
                printf "    complejidad: %s\n", complejidad
                printf "    entregable: \"%s\"\n", fields[4]

                # Check if completed (has checkmark)
                if (fields[1] ~ /^✅/) {
                    printf "    status: \"completado\"\n"
                } else {
                    printf "    status: \"pendiente\"\n"
                }
            }
        }
        in_table && (/^$/ || /^---/ || /^###/ || /^\*\*/) {
            in_table=0
            header_found=0
        }
    '
}

extract_task_complexity() {
    local task_section="$1"

    # Look for complexity in the subtitle or desglose section
    echo "$task_section" | awk '
        /Complejidad Total:/ {
            gsub(/.*Complejidad Total: */, "")
            gsub(/\).*/, "")
            print
            exit
        }
        /^\*\*Complejidad:\*\*/ {
            gsub(/^- \*\*Complejidad:\*\* */, "")
            print
            exit
        }
    ' | head -1
}

# Calculate sync metadata
calculate_sync_metadata() {
    local task_id="$1"
    local source_checksum content_hash

    # Calculate checksum of original task section
    source_checksum=$(extract_task_section "$task_id" | sha256sum | cut -d' ' -f1)
    content_hash=$(date +%s)  # Simple timestamp for version

    cat << EOF
sync_metadata:
  source_file: "$MONOLITH_FILE"
  extraction_date: "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  checksum: "$source_checksum"
  version: "$content_hash"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
EOF
}

# Extract complete task section from monolith
extract_task_section() {
    local task_id="$1"

    if [[ ! -f "$MONOLITH_FILE" ]]; then
        echo "❌ Monolith file not found: $MONOLITH_FILE" >&2
        return 1
    fi

    local task_start
    task_start=$(grep -n "### \*\*Tarea ${task_id}:" "$MONOLITH_FILE" | cut -d: -f1)

    if [[ -z "$task_start" ]]; then
        echo "❌ Task $task_id not found in monolith" >&2
        return 1
    fi

    # Find next task or end of file
    local next_task_line
    next_task_line=$(sed -n "${task_start},\$p" "$MONOLITH_FILE" | \
        grep -n "### \*\*Tarea" | sed -n '2p' | cut -d: -f1)

    if [[ -n "$next_task_line" ]]; then
        local task_end=$((task_start + next_task_line - 2))
        sed -n "${task_start},${task_end}p" "$MONOLITH_FILE"
    else
        sed -n "${task_start},\$p" "$MONOLITH_FILE"
    fi
}

# Generate complete T-XX-STATUS.md file
generate_task_status_file() {
    local task_id="$1"
    local output_file="$DISTRIBUTED_DIR/${task_id}-STATUS.md"
    local temp_file="$TEMP_DIR/${task_id}-temp.md"

    log_parser "🔄 Generating $task_id status file"

    # Extract complete task section
    local task_section
    task_section=$(extract_task_section "$task_id")

    if [[ -z "$task_section" ]]; then
        log_parser "❌ Failed to extract section for $task_id"
        return 1
    fi

    # Parse all metadata fields
    local titulo estado dependencias prioridad release_target descripcion complejidad

    # Extract header metadata using more robust parsing with escaping
    local header_data
    header_data=$(extract_task_header "$task_id" "$task_section")

    # Parse each field separately to avoid eval issues
    titulo=$(echo "$header_data" | grep "^titulo=" | cut -d'"' -f2 | sed 's/"/\\"/g')
    estado=$(echo "$header_data" | grep "^estado=" | cut -d'"' -f2 | sed 's/"/\\"/g')
    dependencias=$(echo "$header_data" | grep "^dependencias=" | cut -d'"' -f2 | sed 's/"/\\"/g')
    prioridad=$(echo "$header_data" | grep "^prioridad=" | cut -d'"' -f2 | sed 's/"/\\"/g')
    release_target=$(echo "$header_data" | grep "^release_target=" | cut -d'"' -f2 | sed 's/"/\\"/g')
    descripcion=$(echo "$header_data" | grep "^descripcion=" | cut -d'"' -f2 | sed 's/"/\\"/g')

    complejidad=$(extract_task_complexity "$task_section")

    # Handle missing fields with defaults
    titulo="${titulo:-${task_id#T-}}"
    estado="${estado:-Pendiente}"
    dependencias="${dependencias:-Ninguna}"
    prioridad="${prioridad:-Media}"
    release_target="${release_target:-TBD}"
    descripcion="${descripcion:-No disponible}"
    complejidad="${complejidad:-0}"

    # Generate the complete status file
    cat > "$temp_file" << EOF
---
task_id: "$task_id"
titulo: "$titulo"
estado: "$estado"
dependencias: "$dependencias"
prioridad: "$prioridad"
release_target: "$release_target"
complejidad: $complejidad
descripcion: "$descripcion"

# Technical Details
detalles_tecnicos: |
$(extract_technical_details "$task_section" | sed 's/^/  /')

# Test Strategy
estrategia_test: |
$(extract_test_strategy "$task_section" | sed 's/^/  /')

# Documentation
documentacion: |
$(extract_documentation "$task_section" | sed 's/^/  /')

# Acceptance Criteria
criterios_aceptacion: |
$(extract_acceptance_criteria "$task_section" | sed 's/^/  /')

# Definition of Done
definicion_hecho: |
$(extract_definition_of_done "$task_section" | sed 's/^/  /')

# WII Subtasks
wii_subtasks:
$(extract_wii_subtasks "$task_section" "$task_id")

# Sync Metadata
$(calculate_sync_metadata "$task_id")
---

# Task $task_id: $titulo

## Estado Actual
**Estado:** $estado
**Prioridad:** $prioridad
**Release Target:** $release_target
**Complejidad Total:** $complejidad

## Descripción
$descripcion

## Detalles Técnicos
$(extract_technical_details "$task_section")

## Estrategia de Test
$(extract_test_strategy "$task_section")

## Documentación Requerida
$(extract_documentation "$task_section")

## Criterios de Aceptación
$(extract_acceptance_criteria "$task_section")

## Definición de Hecho (DoD)
$(extract_definition_of_done "$task_section")

## Subtareas WII
$(extract_wii_subtasks "$task_section" "$task_id" | sed 's/^  - /### /' | sed 's/^    /- /')

---
*Generado automáticamente desde $MONOLITH_FILE*
*Fecha de extracción: $(date -u '+%Y-%m-%d %H:%M:%S UTC')*
*Validador: task-data-parser.sh v1.0*
EOF

    # Validate and move to final location
    if [[ -s "$temp_file" ]]; then
        mv "$temp_file" "$output_file"
        log_parser "✅ Generated: $output_file"
        return 0
    else
        log_parser "❌ Failed to generate $output_file"
        return 1
    fi
}

# Extract data for specific task
extract_task_data() {
    local task_id="$1"

    if [[ ! "$task_id" =~ ^T-[0-9]+$ ]]; then
        echo "❌ Invalid task ID format: $task_id (expected T-XX)" >&2
        return 1
    fi

    log_parser "🔍 Extracting data for $task_id"

    local task_section
    task_section=$(extract_task_section "$task_id")

    if [[ -z "$task_section" ]]; then
        log_parser "❌ Task $task_id not found"
        return 1
    fi

    # Output structured data
    echo "=== TASK $task_id DATA ==="
    echo "HEADER METADATA:"
    extract_task_header "$task_id" "$task_section"

    echo ""
    echo "COMPLEXITY:"
    extract_task_complexity "$task_section"

    echo ""
    echo "WII SUBTASKS:"
    extract_wii_subtasks "$task_section" "$task_id"

    echo ""
    echo "TECHNICAL DETAILS:"
    extract_technical_details "$task_section"

    return 0
}

# Generate all task files
generate_all_tasks() {
    log_parser "🚀 Starting bulk generation of all task status files"

    local task_count=0
    local success_count=0
    local failed_tasks=()

    # Extract all task IDs from monolith
    local task_ids
    task_ids=$(grep "### \*\*Tarea T-" "$MONOLITH_FILE" | \
        grep -o "T-[0-9]\+" | sort -V)

    for task_id in $task_ids; do
        ((task_count++))
        log_parser "📝 Processing $task_id ($task_count/47)"

        if generate_task_status_file "$task_id"; then
            ((success_count++))
        else
            failed_tasks+=("$task_id")
        fi

        # Progress indicator
        if (( task_count % 10 == 0 )); then
            log_parser "📊 Progress: $success_count/$task_count tasks completed"
        fi
    done

    # Final report
    log_parser "🏁 Bulk generation completed"
    log_parser "📊 Results: $success_count/$task_count tasks successful"

    if [[ ${#failed_tasks[@]} -gt 0 ]]; then
        log_parser "❌ Failed tasks: ${failed_tasks[*]}"
        return 1
    else
        log_parser "✅ All tasks generated successfully"
        return 0
    fi
}

# Validation function
validate_extracted_data() {
    local task_id="$1"
    local output_file="$DISTRIBUTED_DIR/${task_id}-STATUS.md"

    if [[ ! -f "$output_file" ]]; then
        echo "❌ Output file not found: $output_file"
        return 1
    fi

    # Check for required YAML frontmatter
    if ! grep -q "^---$" "$output_file"; then
        echo "❌ Missing YAML frontmatter in $output_file"
        return 1
    fi

    # Check for required fields
    local required_fields=("task_id" "titulo" "estado" "sync_metadata")
    for field in "${required_fields[@]}"; do
        if ! grep -q "^$field:" "$output_file"; then
            echo "❌ Missing required field '$field' in $output_file"
            return 1
        fi
    done

    echo "✅ Validation passed for $task_id"
    return 0
}

# Main execution function
main() {
    local action="${1:-generate}"
    local task_id="${2:-}"

    case "$action" in
        "extract")
            if [[ -z "$task_id" ]]; then
                echo "Usage: $0 extract T-XX"
                exit 1
            fi
            extract_task_data "$task_id"
            ;;
        "generate")
            if [[ -n "$task_id" ]]; then
                generate_task_status_file "$task_id"
                validate_extracted_data "$task_id"
            else
                generate_all_tasks
            fi
            ;;
        "validate")
            if [[ -z "$task_id" ]]; then
                echo "Usage: $0 validate T-XX"
                exit 1
            fi
            validate_extracted_data "$task_id"
            ;;
        *)
            echo "Usage: $0 [extract|generate|validate] [T-XX]"
            echo "  extract T-XX:    Extract and display task data"
            echo "  generate [T-XX]: Generate T-XX-STATUS.md file(s)"
            echo "  validate T-XX:   Validate generated file"
            exit 1
            ;;
    esac
}

# Run if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi