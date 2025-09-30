#!/usr/bin/env bash
# validate-claude-md.sh - CLAUDE.md structural and content validation
# Exit codes: 0=valid, 1=structure error, 2=content error, 3=reference error
# Usage: tools/validate-claude-md.sh [--verbose] [--fix]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CLAUDE_MD="${CLAUDE_MD:-CLAUDE.md}"
VERBOSE="${VERBOSE:-false}"
AUTO_FIX="${AUTO_FIX:-false}"
EXIT_CODE=0

# Required sections in order
REQUIRED_SECTIONS=(
  "# CLAUDE.md"
  "## Project Overview"
  "## Tech Stack"
  "## Development Setup"
  "## Essential Commands"
  "## Project Structure"
  "## Quality Assurance"
  "## Task Management Workflow"
  "## Current Context"
  "## Sub-Agent Architecture"
  "## Security & Compliance"
  "## Do Not Touch"
  "## Integration Policy"
  "## CLAUDE.md Maintenance"
)

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --verbose) VERBOSE=true; shift ;;
    --fix) AUTO_FIX=true; shift ;;
    --help)
      echo "Usage: $0 [--verbose] [--fix]"
      echo "  --verbose  Show detailed validation output"
      echo "  --fix      Auto-fix format violations"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

log_info() {
  if [[ "$VERBOSE" == "true" ]]; then
    echo -e "${BLUE}[INFO]${NC} $*"
  fi
}

log_success() {
  echo -e "${GREEN}[✓]${NC} $*"
}

log_warning() {
  echo -e "${YELLOW}[⚠]${NC} $*"
}

log_error() {
  echo -e "${RED}[✗]${NC} $*"
}

# Validate file exists
validate_file_exists() {
  if [[ ! -f "$CLAUDE_MD" ]]; then
    log_error "CLAUDE.md not found at: $CLAUDE_MD"
    exit 1
  fi
  log_info "Found CLAUDE.md at: $CLAUDE_MD"
}

# Validate structure: required sections exist in order
validate_structure() {
  log_info "Validating structural integrity..."
  local current_line=1
  local errors=0

  for section in "${REQUIRED_SECTIONS[@]}"; do
    if ! grep -qF "$section" "$CLAUDE_MD"; then
      log_error "Missing required section: $section"
      ((errors++))
    else
      local section_line
      section_line=$(grep -nF "$section" "$CLAUDE_MD" | head -1 | cut -d: -f1)
      if [[ $section_line -lt $current_line ]]; then
        log_error "Section out of order: $section (line $section_line, expected after $current_line)"
        ((errors++))
      fi
      current_line=$section_line
      log_info "✓ Section found: $section (line $section_line)"
    fi
  done

  if [[ $errors -eq 0 ]]; then
    log_success "Structural integrity: PASS (all 14 required sections present and ordered)"
    return 0
  else
    log_error "Structural integrity: FAIL ($errors issues found)"
    EXIT_CODE=1
    return 1
  fi
}

# Validate content: prohibited patterns
validate_content() {
  log_info "Validating content quality..."
  local errors=0

  # Check for prohibited keywords
  local prohibited_patterns=("TODO" "FIXME" "XXX" "HACK" "TEMP")
  for pattern in "${prohibited_patterns[@]}"; do
    if grep -n "$pattern" "$CLAUDE_MD" > /dev/null 2>&1; then
      log_error "Prohibited pattern '$pattern' found:"
      grep -n "$pattern" "$CLAUDE_MD" | head -3
      ((errors++))
    fi
  done

  # Check line length (max 200 characters)
  local long_lines
  long_lines=$(awk 'length > 200 {print NR ": " substr($0, 1, 50) "..."}' "$CLAUDE_MD")
  if [[ -n "$long_lines" ]]; then
    log_error "Lines exceeding 200 characters found:"
    echo "$long_lines" | head -5
    ((errors++))

    if [[ "$AUTO_FIX" == "true" ]]; then
      log_warning "Auto-fix for line length not implemented (manual review required)"
    fi
  fi

  # Check trailing whitespace
  local trailing_ws
  trailing_ws=$(grep -n '\s$' "$CLAUDE_MD" || true)
  if [[ -n "$trailing_ws" ]]; then
    log_warning "Trailing whitespace found on $(echo "$trailing_ws" | wc -l) lines"

    if [[ "$AUTO_FIX" == "true" ]]; then
      sed -i 's/\s\+$//' "$CLAUDE_MD"
      log_success "Auto-fixed trailing whitespace"
    else
      echo "$trailing_ws" | head -3
    fi
  fi

  # Check code blocks have language tags
  local untagged_blocks=0
  while IFS= read -r line_num; do
    local next_line=$((line_num + 1))
    if sed -n "${next_line}p" "$CLAUDE_MD" | grep -qE '^[^`]'; then
      log_warning "Code block at line $line_num missing language tag"
      ((untagged_blocks++))
    fi
  done < <(grep -n '^```$' "$CLAUDE_MD" | cut -d: -f1 || true)

  if [[ $untagged_blocks -gt 0 ]]; then
    log_warning "Found $untagged_blocks code blocks without language tags"
  fi

  if [[ $errors -eq 0 ]]; then
    log_success "Content quality: PASS (no critical issues)"
    return 0
  else
    log_error "Content quality: FAIL ($errors critical issues)"
    EXIT_CODE=2
    return 1
  fi
}

# Validate references: commands, files, tools exist
validate_references() {
  log_info "Validating command and file references..."
  local errors=0

  # Extract yarn commands and validate against package.json
  if [[ -f "package.json" ]]; then
    local yarn_commands
    yarn_commands=$(grep -oE 'yarn [a-z:]+' "$CLAUDE_MD" | sort -u || true)

    while IFS= read -r cmd; do
      local script_name="${cmd#yarn }"
      if ! jq -e ".scripts.\"$script_name\"" package.json > /dev/null 2>&1; then
        log_error "Invalid yarn command: $cmd (not found in package.json)"
        ((errors++))
      else
        log_info "✓ Validated command: $cmd"
      fi
    done <<< "$yarn_commands"
  else
    log_warning "package.json not found, skipping yarn command validation"
  fi

  # Extract slash commands and validate they exist
  local slash_commands
  slash_commands=$(grep -oE '/[a-z-]+' "$CLAUDE_MD" | sort -u || true)

  while IFS= read -r cmd; do
    local cmd_file=".claude/commands${cmd}.md"
    if [[ ! -f "$cmd_file" ]]; then
      log_error "Invalid slash command: $cmd (file not found: $cmd_file)"
      ((errors++))
    else
      log_info "✓ Validated slash command: $cmd"
    fi
  done <<< "$slash_commands"

  # Extract file references and validate they exist
  local file_refs
  file_refs=$(grep -oE '`[^`]+\.(sh|cjs|js|md|yaml|yml|json)`' "$CLAUDE_MD" | \
              tr -d '`' | sort -u || true)

  while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    if [[ ! -f "$file" ]]; then
      log_warning "Referenced file not found: $file"
      # Not critical, could be example or future file
    else
      log_info "✓ Validated file: $file"
    fi
  done <<< "$file_refs"

  if [[ $errors -eq 0 ]]; then
    log_success "Reference validation: PASS (all critical references valid)"
    return 0
  else
    log_error "Reference validation: FAIL ($errors broken references)"
    EXIT_CODE=3
    return 1
  fi
}

# Generate validation report
generate_report() {
  local total_lines
  local content_lines
  local blank_lines

  total_lines=$(wc -l < "$CLAUDE_MD")
  blank_lines=$(grep -c '^$' "$CLAUDE_MD" || true)
  content_lines=$((total_lines - blank_lines))

  echo ""
  echo "═══════════════════════════════════════════════════════════"
  echo "  CLAUDE.MD VALIDATION REPORT"
  echo "═══════════════════════════════════════════════════════════"
  echo ""
  echo "File: $CLAUDE_MD"
  echo "Total Lines: $total_lines"
  echo "Content Lines: $content_lines"
  echo "Blank Lines: $blank_lines"
  echo ""

  if [[ $EXIT_CODE -eq 0 ]]; then
    echo -e "${GREEN}✅ OVERALL STATUS: PASS${NC}"
    echo ""
    echo "All validation checks passed successfully."
  else
    echo -e "${RED}❌ OVERALL STATUS: FAIL${NC}"
    echo ""
    echo "Exit code: $EXIT_CODE"
    echo "  1 = Structure errors"
    echo "  2 = Content errors"
    echo "  3 = Reference errors"
    echo ""
    echo "Run with --verbose for detailed output"
    echo "Run with --fix to auto-fix format violations"
  fi
  echo ""
  echo "═══════════════════════════════════════════════════════════"
}

# Main execution
main() {
  echo "CLAUDE.md Validation Script"
  echo "─────────────────────────────────────────"
  echo ""

  validate_file_exists
  validate_structure
  validate_content
  validate_references
  generate_report

  exit $EXIT_CODE
}

main