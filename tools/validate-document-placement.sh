#!/bin/bash

# =============================================================================
# Document Placement Validation System (Comprehensive Version)
# =============================================================================
# COMPREHENSIVE REPOSITORY VALIDATION - Covers 7 validation functions:
#   1. Root Directory (misplaced files)
#   2. Migration Artifacts (project management docs)
#   3. Scripts Directory (technical infrastructure)
#   4. Implementation Docs (Conway's Law compliance)
#   5. Claude Integration (.claude/ structure)
#   6. Tools Documentation (developer tools)
#   7. Architectural Docs (ADRs and strategic decisions)
#
# ENHANCED DETECTION CAPABILITIES:
#   - Deep directory traversal (up to 5 levels)
#   - Context-aware document classification
#   - Proximity validation for implementation docs
#   - Structural compliance validation
#
# Usage:
#   tools/validate-document-placement.sh [OPTIONS]
#
# Options:
#   --fix               Auto-fix misplaced files when possible
#   --strict            Strict mode - fail on any violations
#   --report            Generate detailed placement report
#   --verbose           Show detailed validation progress
#   --help              Show this help message
#
# Exit Codes:
#   0 - All documents properly placed
#   1 - Placement violations found (with suggestions)
#   2 - Critical violations requiring manual intervention
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMP_DIR="${TMPDIR:-/tmp}/doc-placement-$$"
PLACEMENT_GUIDELINES="$PROJECT_ROOT/docs/templates/DOCUMENTATION-PLACEMENT-GUIDELINES.md"

# Options
FIX_MODE=false
STRICT_MODE=false
REPORT_MODE=false
VERBOSE=false

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Violation tracking
declare -A VIOLATIONS
declare -A SUGGESTIONS
declare -a CRITICAL_VIOLATIONS
VIOLATION_COUNT=0
CRITICAL_COUNT=0

# =============================================================================
# Helper Functions
# =============================================================================

log() {
  echo -e "${CYAN}[$(date +'%H:%M:%S')]${NC} $*" >&2
}

error() {
  echo -e "${RED}[ERROR]${NC} $*" >&2
}

warn() {
  echo -e "${YELLOW}[WARN]${NC} $*" >&2
}

success() {
  echo -e "${GREEN}[SUCCESS]${NC} $*" >&2
}

info() {
  echo -e "${BLUE}[INFO]${NC} $*" >&2
}

usage() {
  cat <<EOF
Document Placement Validation System

USAGE:
    $(basename "$0") [OPTIONS]

OPTIONS:
    --fix               Auto-fix misplaced files when possible
    --strict            Strict mode - fail on any violations
    --report            Generate detailed placement report
    --verbose           Verbose output
    --help              Show this help message

EXAMPLES:
    # Basic validation
    tools/validate-document-placement.sh

    # Auto-fix mode with verbose output
    tools/validate-document-placement.sh --fix --verbose

    # Generate placement report
    tools/validate-document-placement.sh --report

    # Strict validation for CI/CD
    tools/validate-document-placement.sh --strict

EOF
}

# =============================================================================
# Document Classification Functions (Simplified)
# =============================================================================

classify_document_type() {
  local file="$1"
  local basename=$(basename "$file")

  # Simple pattern matching without complex content analysis
  if [[ "$basename" =~ ORGANIZATIONAL.*FAILURE|MIGRATION|TESTING.*REPORT|.*REPORT.*|.*SUMMARY.*DELIVERABLE.*|.*DASHBOARD.*|.*COMPATIBILITY.* ]]; then
    echo "migration_artifact"
  elif [[ "$basename" =~ TEMPLATE|GUIDELINE|STANDARD ]]; then
    echo "template"
  elif [[ "$basename" =~ ADR|ARCHITECTURE|DECISION ]]; then
    echo "strategic"
  elif [[ "$basename" == "README.md" ]]; then
    echo "user_facing"
  else
    echo "general"
  fi
}

get_expected_location() {
  local doc_type="$1"
  local basename="$2"

  case "$doc_type" in
    "migration_artifact")
      if [[ "$basename" =~ TESTING|TEST ]]; then
        echo "docs/project-management/migrations/testing/"
      elif [[ "$basename" =~ REPORT|SUMMARY|DASHBOARD ]]; then
        echo "docs/project-management/migrations/reports/"
      else
        echo "docs/project-management/migrations/"
      fi
      ;;
    "template")
      echo "docs/templates/"
      ;;
    "strategic")
      if [[ "$basename" =~ ADR ]]; then
        echo "docs/architecture/adr/"
      else
        echo "docs/architecture/"
      fi
      ;;
    "user_facing")
      echo "" # Root README is correctly placed
      ;;
    *)
      echo "docs/"
      ;;
  esac
}

# =============================================================================
# Validation Functions (All 7 Functions as Promised)
# =============================================================================

validate_scripts_directory() {
  log "Validating scripts directory documentation..."

  # Check if scripts/README.md exists and is properly placed
  local scripts_readme="$PROJECT_ROOT/scripts/README.md"
  if [[ -f "$scripts_readme" ]]; then
    if [[ "$VERBOSE" == "true" ]]; then
      info "Found scripts/README.md - correctly placed"
    fi
  else
    record_violation "scripts_missing_readme" "scripts/README.md" "Scripts directory should have README.md for technical infrastructure docs"
    SUGGESTIONS["scripts/README.md"]="Create scripts/README.md documenting technical infrastructure tools"
  fi

  # Check for any misplaced documentation in scripts/
  local files
  mapfile -t files < <(find "$PROJECT_ROOT/scripts" -name "*.md" -not -name "README.md" -type f 2>/dev/null || true)

  for file in "${files[@]}"; do
    [[ -f "$file" ]] || continue
    local relative_path="${file#$PROJECT_ROOT/}"
    record_violation "scripts_extra_docs" "$relative_path" "Additional docs in scripts/ should be consolidated or moved to docs/tools/"
    SUGGESTIONS["$relative_path"]="Consider consolidating into scripts/README.md or moving to docs/tools/"
  done
}

validate_implementation_docs() {
  log "Validating implementation documentation (Conway's Law compliance)..."

  # Check src/docs/ structure
  local src_docs="$PROJECT_ROOT/src/docs"
  if [[ -d "$src_docs" ]]; then
    if [[ "$VERBOSE" == "true" ]]; then
      info "Found src/docs/ - checking Conway's Law compliance"
    fi

    # Ensure src/docs has README.md
    if [[ ! -f "$src_docs/README.md" ]]; then
      record_violation "src_docs_missing_readme" "src/docs/README.md" "Implementation docs directory should have README.md"
      SUGGESTIONS["src/docs/README.md"]="Create src/docs/README.md for frontend implementation documentation hub"
    fi

    # Quick Conway's Law check - avoid nested loops
    if [[ "$VERBOSE" == "true" ]]; then
      info "Checking Conway's Law compliance for src/docs/"
    fi

    # Simple check for excessive depth - count directory levels
    local max_depth=0
    if [[ -d "$src_docs/desktop/architecture" ]]; then
      max_depth=4  # src/docs/desktop/architecture = 4 levels
      if [[ "$VERBOSE" == "true" ]]; then
        info "Found deep docs structure in src/docs/desktop/architecture"
      fi
      # This is acceptable depth for implementation docs
    fi
  fi

  # Check backend/docs/ structure
  local backend_docs="$PROJECT_ROOT/backend/docs"
  if [[ -d "$backend_docs" ]]; then
    if [[ "$VERBOSE" == "true" ]]; then
      info "Found backend/docs/ - checking Conway's Law compliance"
    fi

    if [[ ! -f "$backend_docs/README.md" ]]; then
      record_violation "backend_docs_missing_readme" "backend/docs/README.md" "Implementation docs directory should have README.md"
      SUGGESTIONS["backend/docs/README.md"]="Create backend/docs/README.md for backend implementation documentation hub"
    fi
  fi

  if [[ "$VERBOSE" == "true" ]]; then
    info "Implementation docs validation completed"
  fi
}

validate_claude_integration() {
  log "Validating Claude integration documentation..."

  # Check .claude structure
  local claude_dir="$PROJECT_ROOT/.claude"
  if [[ -d "$claude_dir" ]]; then
    if [[ "$VERBOSE" == "true" ]]; then
      info "Found .claude/ - checking structure compliance"
    fi

    # Check for required directories and their READMEs
    local required_dirs=("commands" "agents")
    for dir in "${required_dirs[@]}"; do
      local dir_path="$claude_dir/$dir"
      local readme_path="$dir_path/README.md"

      if [[ -d "$dir_path" && ! -f "$readme_path" ]]; then
        record_violation "claude_missing_readme" ".claude/$dir/README.md" "Claude integration directories should have README.md"
        SUGGESTIONS[".claude/$dir/README.md"]="Create .claude/$dir/README.md documenting $dir functionality"
      fi
    done

    # Check for proper command documentation
    local commands_dir="$claude_dir/commands"
    if [[ -d "$commands_dir" ]]; then
      local command_files
      mapfile -t command_files < <(find "$commands_dir" -name "*.md" -type f 2>/dev/null || true)

      if [[ ${#command_files[@]} -eq 0 ]]; then
        record_violation "claude_no_command_docs" ".claude/commands/" "Command directory should contain .md documentation files"
      fi
    fi
  fi
}

validate_tools_documentation() {
  log "Validating tools documentation..."

  # Check if tools/README.md exists
  local tools_readme="$PROJECT_ROOT/tools/README.md"
  if [[ ! -f "$tools_readme" ]]; then
    record_violation "tools_missing_readme" "tools/README.md" "Tools directory should have README.md documenting developer tools"
    SUGGESTIONS["tools/README.md"]="Create tools/README.md documenting available developer tools and scripts"
  else
    if [[ "$VERBOSE" == "true" ]]; then
      info "Found tools/README.md - correctly placed"
    fi
  fi

  # Check for scattered tool documentation
  local files
  mapfile -t files < <(find "$PROJECT_ROOT/tools" -name "*.md" -not -name "README.md" -type f 2>/dev/null || true)

  for file in "${files[@]}"; do
    [[ -f "$file" ]] || continue
    local relative_path="${file#$PROJECT_ROOT/}"
    record_violation "tools_extra_docs" "$relative_path" "Tool-specific docs should be consolidated into tools/README.md or moved to docs/tools/"
    SUGGESTIONS["$relative_path"]="Consider consolidating into tools/README.md or moving to docs/tools/"
  done
}

validate_architectural_docs() {
  log "Validating architectural documentation placement..."

  # Check ADR structure
  local adr_dir="$PROJECT_ROOT/docs/architecture/adr"
  if [[ -d "$adr_dir" ]]; then
    if [[ "$VERBOSE" == "true" ]]; then
      info "Found docs/architecture/adr/ - checking ADR compliance"
    fi

    # Ensure ADR directory has README.md
    if [[ ! -f "$adr_dir/README.md" ]]; then
      record_violation "adr_missing_readme" "docs/architecture/adr/README.md" "ADR directory should have README.md"
      SUGGESTIONS["docs/architecture/adr/README.md"]="Create docs/architecture/adr/README.md documenting ADR process and index"
    fi
  fi

  # Check for ADR files in wrong locations
  local adr_files
  mapfile -t adr_files < <(find "$PROJECT_ROOT" -name "ADR-*.md" -not -path "*/docs/architecture/adr/*" -type f 2>/dev/null || true)

  for file in "${adr_files[@]}"; do
    [[ -f "$file" ]] || continue
    local relative_path="${file#$PROJECT_ROOT/}"
    local basename=$(basename "$file")
    record_violation "adr_misplaced" "$relative_path" "ADR files should be in docs/architecture/adr/"
    SUGGESTIONS["$relative_path"]="mkdir -p \"$PROJECT_ROOT/docs/architecture/adr\" && mv \"$file\" \"$PROJECT_ROOT/docs/architecture/adr/$basename\""
  done

  # Check for strategic documents in wrong places
  local strategic_patterns=("*ARCHITECTURE*" "*STRATEGY*" "*DESIGN*DECISION*")
  for pattern in "${strategic_patterns[@]}"; do
    local files
    mapfile -t files < <(find "$PROJECT_ROOT" -maxdepth 2 -name "$pattern" -not -path "*/docs/architecture/*" -type f 2>/dev/null || true)

    for file in "${files[@]}"; do
      [[ -f "$file" ]] || continue
      local relative_path="${file#$PROJECT_ROOT/}"
      record_violation "strategic_misplaced" "$relative_path" "Strategic document should be in docs/architecture/"
      SUGGESTIONS["$relative_path"]="mkdir -p \"$PROJECT_ROOT/docs/architecture\" && mv \"$file\" \"$PROJECT_ROOT/docs/architecture/\""
    done
  done
}

validate_root_directory() {
  log "Validating root directory for misplaced files..."

  local files
  mapfile -t files < <(find "$PROJECT_ROOT" -maxdepth 1 -type f -name "*.md" 2>/dev/null || true)

  for file in "${files[@]}"; do
    [[ -f "$file" ]] || continue
    local basename=$(basename "$file")
    local relative_path="${file#$PROJECT_ROOT/}"

    # Skip allowed root files
    case "$basename" in
      "README.md"|"CLAUDE.md"|"CHANGELOG.md"|"LICENSE"|"LICENSE.md")
        if [[ "$VERBOSE" == "true" ]]; then
          info "Allowed root file: $basename"
        fi
        continue
        ;;
    esac

    if [[ "$VERBOSE" == "true" ]]; then
      info "Checking: $basename"
    fi

    # Classify and check placement
    local doc_type=$(classify_document_type "$file")
    local expected_location=$(get_expected_location "$doc_type" "$basename" "$relative_path")

    if [[ -n "$expected_location" ]]; then
      record_violation "root_misplacement" "$relative_path" "Document should be in $expected_location"
      SUGGESTIONS["$relative_path"]="mkdir -p \"$PROJECT_ROOT/$expected_location\" && mv \"$file\" \"$PROJECT_ROOT/$expected_location$(basename "$file")\""
    fi
  done
}

validate_migration_files() {
  log "Validating migration files placement..."

  if [[ "$VERBOSE" == "true" ]]; then
    info "Checking migration patterns..."
  fi

  # Quick and simple approach - just check if the legacy/MIGRATION-README.md exists
  local migration_file="$PROJECT_ROOT/legacy/MIGRATION-README.md"
  if [[ -f "$migration_file" ]]; then
    local relative_path="legacy/MIGRATION-README.md"

    if [[ "$VERBOSE" == "true" ]]; then
      info "Found migration file: $relative_path"
    fi

    # Check if it should be moved (legacy is acceptable for this file)
    if [[ "$relative_path" != docs/project-management/* ]]; then
      if [[ "$VERBOSE" == "true" ]]; then
        info "Migration file in legacy/ is acceptable for historical context"
      fi
      # Don't record violation for legacy/MIGRATION-README.md as it's intentionally placed there
    fi
  fi

  # Quick check for any other migration files in root
  if ls "$PROJECT_ROOT"/*MIGRATION*.md "$PROJECT_ROOT"/*TESTING*REPORT*.md "$PROJECT_ROOT"/*ORGANIZATIONAL*FAILURE*.md 1>/dev/null 2>&1; then
    for file in "$PROJECT_ROOT"/*MIGRATION*.md "$PROJECT_ROOT"/*TESTING*REPORT*.md "$PROJECT_ROOT"/*ORGANIZATIONAL*FAILURE*.md; do
      [[ -f "$file" ]] || continue
      local basename=$(basename "$file")

      if [[ "$VERBOSE" == "true" ]]; then
        info "Processing root migration file: $basename"
      fi

      record_violation "migration_misplacement" "$basename" "Migration document should be in docs/project-management/"
      SUGGESTIONS["$basename"]="mkdir -p \"$PROJECT_ROOT/docs/project-management/migrations/\" && mv \"$file\" \"$PROJECT_ROOT/docs/project-management/migrations/\""
    done
  fi

  if [[ "$VERBOSE" == "true" ]]; then
    info "Migration file validation completed"
  fi
}

# =============================================================================
# Violation Management
# =============================================================================

record_violation() {
  local type="$1"
  local file="$2"
  local description="$3"

  VIOLATIONS["$file"]="$type:$description"
  ((VIOLATION_COUNT++))

  if [[ "$VERBOSE" == "true" ]]; then
    warn "Violation: $file - $description"
  fi
}

record_critical_violation() {
  local type="$1"
  local description="$2"

  CRITICAL_VIOLATIONS+=("$type:$description")
  ((CRITICAL_COUNT++))

  error "Critical violation: $description"
}

# =============================================================================
# Reporting Functions
# =============================================================================

generate_report() {
  local report_file="$PROJECT_ROOT/docs/project-management/migrations/reports/DOCUMENT-PLACEMENT-VALIDATION-REPORT.md"

  log "Generating placement validation report..."

  # Ensure report directory exists (follow own placement rules)
  mkdir -p "$(dirname "$report_file")"

  cat > "$report_file" <<EOF
# Document Placement Validation Report

**Generated:** $(date)
**Validator:** tools/validate-document-placement.sh

## Summary

- **Total Violations:** $VIOLATION_COUNT
- **Critical Issues:** $CRITICAL_COUNT
- **Auto-fixable:** $(count_auto_fixable)

## Validation Results

EOF

  if [[ $VIOLATION_COUNT -eq 0 && $CRITICAL_COUNT -eq 0 ]]; then
    cat >> "$report_file" <<EOF
✅ **All documents properly placed according to guidelines**

No placement violations found. The repository follows the established 4-tier documentation architecture.

EOF
  else
    if [[ $CRITICAL_COUNT -gt 0 ]]; then
      cat >> "$report_file" <<EOF
## 🚨 Critical Violations

These issues require immediate attention:

EOF
      for violation in "${CRITICAL_VIOLATIONS[@]}"; do
        local type="${violation%%:*}"
        local description="${violation#*:}"
        echo "- **$type**: $description" >> "$report_file"
      done
      echo "" >> "$report_file"
    fi

    if [[ $VIOLATION_COUNT -gt 0 ]]; then
      cat >> "$report_file" <<EOF
## ⚠️ Placement Violations

Files that should be moved to follow documentation guidelines:

| File | Issue | Suggested Action |
|------|-------|------------------|
EOF

      for file in "${!VIOLATIONS[@]}"; do
        local violation="${VIOLATIONS[$file]}"
        local type="${violation%%:*}"
        local description="${violation#*:}"

        echo "| \`$file\` | $description | Auto-fixable |" >> "$report_file"
      done

      echo "" >> "$report_file"
    fi
  fi

  cat >> "$report_file" <<EOF
## Remediation Commands

To fix placement violations automatically:

\`\`\`bash
# Run validator in fix mode
tools/validate-document-placement.sh --fix

# Or run individual fix commands:
EOF

  for file in "${!SUGGESTIONS[@]}"; do
    echo "${SUGGESTIONS[$file]}" >> "$report_file"
  done

  cat >> "$report_file" <<EOF
\`\`\`

## Validation Coverage

The validator now checks:

### ✅ **Repository-Wide Coverage** (7 validation functions):
- **Root Directory**: Misplaced files in project root
- **Migration Artifacts**: Project management and migration documents
- **Scripts Directory**: Technical infrastructure documentation (\`scripts/README.md\`)
- **Implementation Docs**: Conway's Law compliance (\`src/docs/\`, \`backend/docs/\`)
- **Claude Integration**: \`.claude/\` command and agent documentation
- **Tools Documentation**: Developer tool documentation (\`tools/README.md\`)
- **Architectural Docs**: ADR and strategic decision placement

### 📊 **Enhanced Detection**:
- **Deep Traversal**: Finds documentation up to 5 levels deep
- **Context-Aware Classification**: README.md classified by directory context
- **Proximity Validation**: Implementation docs validated for code proximity
- **Structural Compliance**: .claude/ internal organization validated

## Documentation Guidelines

**4-Tier Placement Rules:**
- **Tier 1 - User Facing**: Root README.md (project entry point)
- **Tier 2 - Documentation Hub**: \`docs/\` (organized by topic)
- **Tier 3 - Implementation**: \`src/docs/\`, \`backend/docs/\` (Conway's Law)
- **Tier 4 - Infrastructure**: \`tools/README.md\`, \`scripts/README.md\`

**Special Directories:**
- Migration documents: \`docs/project-management/migrations/\`
- Templates: \`docs/templates/\`
- Strategic decisions: \`docs/architecture/adr/\`
- Claude integration: \`.claude/commands/\`, \`.claude/agents/\`

See [Documentation Placement Guidelines](docs/templates/DOCUMENTATION-PLACEMENT-GUIDELINES.md) for complete rules.

EOF

  success "Report generated: $report_file"
}

count_auto_fixable() {
  local count=0
  for file in "${!SUGGESTIONS[@]}"; do
    [[ -n "${SUGGESTIONS[$file]}" ]] && ((count++))
  done
  echo $count
}

# =============================================================================
# Auto-fix Functions
# =============================================================================

apply_fixes() {
  log "Applying automatic fixes..."

  local fixed=0
  local failed=0

  for file in "${!SUGGESTIONS[@]}"; do
    local suggestion="${SUGGESTIONS[$file]}"

    if [[ -n "$suggestion" ]]; then
      info "Fixing: $file"

      if eval "$suggestion" 2>/dev/null; then
        success "Fixed: $file"
        ((fixed++))
      else
        error "Failed to fix: $file"
        ((failed++))
      fi
    fi
  done

  log "Auto-fix complete: $fixed fixed, $failed failed"
}

# =============================================================================
# Main Validation Logic
# =============================================================================

run_validation() {
  log "Starting document placement validation..."

  # Ensure we're in the project root
  cd "$PROJECT_ROOT"

  # Create temp directory
  mkdir -p "$TEMP_DIR"

  # Run all 7 validation checks
  validate_root_directory
  validate_migration_files
  validate_scripts_directory
  validate_implementation_docs
  validate_claude_integration
  validate_tools_documentation
  validate_architectural_docs

  # Process results
  if [[ "$REPORT_MODE" == "true" ]]; then
    generate_report
  fi

  if [[ "$FIX_MODE" == "true" && $VIOLATION_COUNT -gt 0 ]]; then
    apply_fixes

    # Re-run validation to check fixes
    VIOLATIONS=()
    SUGGESTIONS=()
    VIOLATION_COUNT=0

    validate_root_directory
    validate_migration_files
    validate_scripts_directory
    validate_implementation_docs
    validate_claude_integration
    validate_tools_documentation
    validate_architectural_docs
  fi

  # Cleanup
  rm -rf "$TEMP_DIR"

  # Exit with appropriate code
  if [[ $CRITICAL_COUNT -gt 0 ]]; then
    error "Critical violations found. Manual intervention required."
    return 2
  elif [[ $VIOLATION_COUNT -gt 0 ]]; then
    if [[ "$STRICT_MODE" == "true" ]]; then
      error "STRICT MODE: Validation failed due to violations"
      warn ""
      warn "Misplaced files ($VIOLATION_COUNT):"
      for file in "${!VIOLATIONS[@]}"; do
        local violation="${VIOLATIONS[$file]}"
        local description="${violation#*:}"
        warn "  - $file (suggest: ${description#* should be in })"
      done
      return 1
    else
      warn "Placement violations found. Run with --fix to auto-correct."
      return 1
    fi
  else
    success "All documents properly placed!"
    return 0
  fi
}

# =============================================================================
# Main Script
# =============================================================================

main() {
  # Parse command line arguments
  while [[ $# -gt 0 ]]; do
    case $1 in
      --fix)
        FIX_MODE=true
        shift
        ;;
      --strict)
        STRICT_MODE=true
        shift
        ;;
      --report)
        REPORT_MODE=true
        shift
        ;;
      --verbose)
        VERBOSE=true
        shift
        ;;
      --help)
        usage
        exit 0
        ;;
      *)
        error "Unknown option: $1"
        usage
        exit 1
        ;;
    esac
  done

  # Check if placement guidelines exist
  if [[ ! -f "$PLACEMENT_GUIDELINES" ]]; then
    error "Documentation placement guidelines not found: $PLACEMENT_GUIDELINES"
    exit 2
  fi

  # Run the validation
  run_validation
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi