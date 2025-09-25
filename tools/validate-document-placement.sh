#!/bin/bash

# =============================================================================
# Document Placement Validation System (Working Version)
# =============================================================================
# Validates documentation placement according to project guidelines
# Prevents organizational chaos and maintains professional repository structure
#
# Usage:
#   tools/validate-document-placement.sh [OPTIONS]
#
# Options:
#   --fix               Auto-fix misplaced files when possible
#   --strict            Strict mode - fail on any violations
#   --report            Generate detailed placement report
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
# Validation Functions
# =============================================================================

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
    local expected_location=$(get_expected_location "$doc_type" "$basename")

    if [[ -n "$expected_location" ]]; then
      record_violation "root_misplacement" "$relative_path" "Document should be in $expected_location"
      SUGGESTIONS["$relative_path"]="mkdir -p \"$PROJECT_ROOT/$expected_location\" && mv \"$file\" \"$PROJECT_ROOT/$expected_location$(basename "$file")\""
    fi
  done
}

validate_migration_files() {
  log "Validating migration files placement..."

  # Common migration file patterns
  local migration_patterns=(
    "*MIGRATION*"
    "*TESTING*REPORT*"
    "*SUCCESS*REPORT*"
    "*DASHBOARD*"
    "*COMPATIBILITY*"
    "*VALIDATION*REPORT*"
    "*SUMMARY*DELIVERABLE*"
    "*ORGANIZATIONAL*FAILURE*"
    "*TESTING*SUMMARY*"
  )

  for pattern in "${migration_patterns[@]}"; do
    local files
    mapfile -t files < <(find "$PROJECT_ROOT" -maxdepth 2 -name "$pattern" -type f 2>/dev/null || true)

    for file in "${files[@]}"; do
      [[ -f "$file" ]] || continue
      local relative_path="${file#$PROJECT_ROOT/}"

      # Check if it's in the root or wrong location
      if [[ "$relative_path" != docs/project-management/* ]]; then
        record_violation "migration_misplacement" "$relative_path" "Migration document should be in docs/project-management/"

        # Determine specific subdirectory
        local subdir="migrations/reports/"
        if [[ "$pattern" =~ TESTING|TEST ]]; then
          subdir="migrations/testing/"
        fi

        SUGGESTIONS["$relative_path"]="mkdir -p \"$PROJECT_ROOT/docs/project-management/$subdir\" && mv \"$file\" \"$PROJECT_ROOT/docs/project-management/$subdir\""
      fi
    done
  done
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
  local report_file="$PROJECT_ROOT/DOCUMENT-PLACEMENT-VALIDATION-REPORT.md"

  log "Generating placement validation report..."

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

## Documentation Guidelines

For future reference:
- Migration documents: \`docs/project-management/migrations/\`
- Templates: \`docs/templates/\`
- Strategic decisions: \`docs/architecture/\`
- Implementation docs: Near code (\`src/docs/\`, \`backend/docs/\`)
- Tool documentation: With tools (\`tools/README.md\`)

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

  # Run validation checks
  validate_root_directory
  validate_migration_files

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
  fi

  # Cleanup
  rm -rf "$TEMP_DIR"

  # Exit with appropriate code
  if [[ $CRITICAL_COUNT -gt 0 ]]; then
    error "Critical violations found. Manual intervention required."
    return 2
  elif [[ $VIOLATION_COUNT -gt 0 ]]; then
    if [[ "$STRICT_MODE" == "true" ]]; then
      error "Violations found in strict mode."
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