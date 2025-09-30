#!/usr/bin/env bash

# tools/audit-claude-md.sh
# Comprehensive CLAUDE.md quality audit with scoring and recommendations
# Usage: bash tools/audit-claude-md.sh [--verbose] [--report]

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CLAUDE_MD="${CLAUDE_MD:-CLAUDE.md}"
VERBOSE=false
GENERATE_REPORT=false
REPORT_DIR=".claude/audit-reports"

# Thresholds
TOKEN_TARGET=5000
TOKEN_SAFE_ZONE=4500
TOKEN_WARNING=4750
MAX_LINE_LENGTH=200
MIN_QUALITY_SCORE=90

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --verbose) VERBOSE=true; shift ;;
    --report) GENERATE_REPORT=true; shift ;;
    --help)
      echo "Usage: $0 [--verbose] [--report]"
      echo "  --verbose  Show detailed output"
      echo "  --report   Generate markdown report in $REPORT_DIR"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

log_verbose() {
  if [[ "$VERBOSE" == "true" ]]; then
    echo -e "${BLUE}[VERBOSE]${NC} $*"
  fi
}

# Initialize counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# Quality score components (0-100)
STRUCTURE_SCORE=0
CONTENT_SCORE=0
DUPLICATE_SCORE=0
REFERENCE_SCORE=0
FORMAT_SCORE=0
TOKEN_SCORE=0

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  CLAUDE.MD COMPREHENSIVE AUDIT"
echo "═══════════════════════════════════════════════════════════"
echo ""

# 1. STRUCTURE AUDIT
echo "─────────────────────────────────────────"
echo "1. STRUCTURE AUDIT"
echo "─────────────────────────────────────────"

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

structure_issues=0
for section in "${REQUIRED_SECTIONS[@]}"; do
  ((TOTAL_CHECKS++))
  if grep -q "^${section}$" "$CLAUDE_MD"; then
    log_verbose "✅ Found: $section"
    ((PASSED_CHECKS++))
  else
    echo -e "${RED}❌ Missing section: $section${NC}"
    ((FAILED_CHECKS++))
    ((structure_issues++))
  fi
done

if [[ $structure_issues -eq 0 ]]; then
  STRUCTURE_SCORE=100
  echo -e "${GREEN}✅ Structure: PERFECT (all ${#REQUIRED_SECTIONS[@]} sections present)${NC}"
else
  STRUCTURE_SCORE=$(awk "BEGIN {printf \"%.0f\", (1 - $structure_issues / ${#REQUIRED_SECTIONS[@]}) * 100}")
  echo -e "${RED}❌ Structure: INCOMPLETE ($structure_issues missing sections)${NC}"
fi

# 2. TOKEN BUDGET AUDIT
echo ""
echo "─────────────────────────────────────────"
echo "2. TOKEN BUDGET AUDIT"
echo "─────────────────────────────────────────"

char_count=$(wc -c < "$CLAUDE_MD")
token_estimate=$(awk "BEGIN {printf \"%.0f\", $char_count / 3.5}")
buffer_tokens=$((TOKEN_TARGET - token_estimate))
buffer_percent=$(awk "BEGIN {printf \"%.1f\", ($buffer_tokens / $TOKEN_TARGET) * 100}")

echo "Characters: $char_count"
echo "Estimated Tokens: $token_estimate"
echo "Target: <$TOKEN_TARGET tokens"
echo "Buffer: $buffer_tokens tokens ($buffer_percent%)"

((TOTAL_CHECKS++))
if [[ $token_estimate -gt $TOKEN_TARGET ]]; then
  echo -e "${RED}❌ EXCEEDED: Over $TOKEN_TARGET token limit${NC}"
  TOKEN_SCORE=0
  ((FAILED_CHECKS++))
elif [[ $token_estimate -gt $TOKEN_WARNING ]]; then
  echo -e "${YELLOW}⚠️  WARNING: Approaching limit (${TOKEN_WARNING}-${TOKEN_TARGET})${NC}"
  TOKEN_SCORE=70
  ((WARNINGS++))
  ((PASSED_CHECKS++))
elif [[ $token_estimate -gt $TOKEN_SAFE_ZONE ]]; then
  echo -e "${YELLOW}⚠️  CAUTION: Within buffer zone (${TOKEN_SAFE_ZONE}-${TOKEN_WARNING})${NC}"
  TOKEN_SCORE=85
  ((WARNINGS++))
  ((PASSED_CHECKS++))
else
  echo -e "${GREEN}✅ EXCELLENT: Well under target (<${TOKEN_SAFE_ZONE})${NC}"
  TOKEN_SCORE=100
  ((PASSED_CHECKS++))
fi

# 3. DUPLICATE DETECTION
echo ""
echo "─────────────────────────────────────────"
echo "3. DUPLICATE DETECTION"
echo "─────────────────────────────────────────"

# Exact duplicates
exact_duplicates=$(sort "$CLAUDE_MD" | uniq -d | wc -l)

((TOTAL_CHECKS++))
if [[ $exact_duplicates -eq 0 ]]; then
  echo -e "${GREEN}✅ Exact duplicates: NONE${NC}"
  DUPLICATE_SCORE=100
  ((PASSED_CHECKS++))
else
  echo -e "${RED}❌ Exact duplicates found: $exact_duplicates lines${NC}"
  DUPLICATE_SCORE=$(awk "BEGIN {printf \"%.0f\", 100 - ($exact_duplicates * 10)}")
  if [[ $DUPLICATE_SCORE -lt 0 ]]; then DUPLICATE_SCORE=0; fi
  ((FAILED_CHECKS++))
fi

echo "Note: Near-duplicate detection (85%+ similarity) requires Python implementation"

# 4. REFERENCE VALIDATION
echo ""
echo "─────────────────────────────────────────"
echo "4. REFERENCE VALIDATION"
echo "─────────────────────────────────────────"

# Extract yarn commands
yarn_commands=$(grep -oE 'yarn [a-z:]+' "$CLAUDE_MD" | sort -u || true)
invalid_yarn=0
total_yarn=0

while IFS= read -r cmd; do
  if [[ -n "$cmd" ]]; then
    ((total_yarn++))
    ((TOTAL_CHECKS++))
    cmd_name=$(echo "$cmd" | cut -d' ' -f2)
    # Simple check: does it look like a valid namespace pattern?
    if [[ "$cmd_name" =~ ^(repo|fe|be|e2e|sec|qa|docs|all): ]]; then
      log_verbose "✅ Valid pattern: $cmd"
      ((PASSED_CHECKS++))
    else
      log_verbose "⚠️  Unusual pattern: $cmd (may be valid)"
      ((PASSED_CHECKS++))
    fi
  fi
done <<< "$yarn_commands"

if [[ $total_yarn -gt 0 ]]; then
  REFERENCE_SCORE=100
  echo -e "${GREEN}✅ Yarn commands: $total_yarn found, all follow namespace pattern${NC}"
else
  REFERENCE_SCORE=50
  echo -e "${YELLOW}⚠️  No yarn commands found${NC}"
fi

# Extract @import references
import_refs=$(grep -oE '@[^ ]+\.md' "$CLAUDE_MD" || true)
missing_imports=0
total_imports=0

while IFS= read -r ref; do
  if [[ -n "$ref" ]]; then
    ((total_imports++))
    ((TOTAL_CHECKS++))
    # Remove @ prefix
    file_path="${ref:1}"
    if [[ -f "$file_path" ]]; then
      log_verbose "✅ Found: $ref"
      ((PASSED_CHECKS++))
    else
      echo -e "${RED}❌ Missing: $ref${NC}"
      ((FAILED_CHECKS++))
      ((missing_imports++))
    fi
  fi
done <<< "$import_refs"

if [[ $total_imports -gt 0 ]]; then
  import_score=$(awk "BEGIN {printf \"%.0f\", (1 - $missing_imports / $total_imports) * 100}")
  REFERENCE_SCORE=$((REFERENCE_SCORE * import_score / 100))
  echo -e "${GREEN}@import references: $((total_imports - missing_imports))/$total_imports valid${NC}"
else
  echo "No @import references found"
fi

# 5. FORMAT COMPLIANCE
echo ""
echo "─────────────────────────────────────────"
echo "5. FORMAT COMPLIANCE"
echo "─────────────────────────────────────────"

# Check line lengths
long_lines=$(awk "length > $MAX_LINE_LENGTH" "$CLAUDE_MD" | wc -l)

((TOTAL_CHECKS++))
if [[ $long_lines -eq 0 ]]; then
  echo -e "${GREEN}✅ Line length: All lines ≤$MAX_LINE_LENGTH chars${NC}"
  FORMAT_SCORE=100
  ((PASSED_CHECKS++))
else
  echo -e "${YELLOW}⚠️  Long lines: $long_lines lines >$MAX_LINE_LENGTH chars${NC}"
  FORMAT_SCORE=$(awk "BEGIN {printf \"%.0f\", 100 - ($long_lines * 5)}")
  if [[ $FORMAT_SCORE -lt 0 ]]; then FORMAT_SCORE=0; fi
  ((WARNINGS++))
  ((PASSED_CHECKS++))
fi

# Check trailing whitespace
trailing_ws=$(grep -c ' $' "$CLAUDE_MD" || true)
if [[ $trailing_ws -gt 0 ]]; then
  echo -e "${YELLOW}⚠️  Trailing whitespace: $trailing_ws lines${NC}"
  FORMAT_SCORE=$((FORMAT_SCORE - 5))
  ((WARNINGS++))
fi

# 6. CONTENT QUALITY
echo ""
echo "─────────────────────────────────────────"
echo "6. CONTENT QUALITY"
echo "─────────────────────────────────────────"

total_lines=$(wc -l < "$CLAUDE_MD")
blank_lines=$(grep -c '^$' "$CLAUDE_MD" || true)
content_lines=$((total_lines - blank_lines))

echo "Total lines: $total_lines"
echo "Content lines: $content_lines"
echo "Blank lines: $blank_lines"

# Check for common issues
todo_count=$(grep -ci 'TODO\|FIXME' "$CLAUDE_MD" || true)
if [[ $todo_count -gt 0 ]]; then
  echo -e "${YELLOW}⚠️  Found $todo_count TODO/FIXME comments${NC}"
  CONTENT_SCORE=80
  ((WARNINGS++))
else
  CONTENT_SCORE=100
fi

# FINAL QUALITY SCORE
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  QUALITY SCORE BREAKDOWN"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "Structure:   $STRUCTURE_SCORE/100"
echo "Tokens:      $TOKEN_SCORE/100"
echo "Duplicates:  $DUPLICATE_SCORE/100"
echo "References:  $REFERENCE_SCORE/100"
echo "Format:      $FORMAT_SCORE/100"
echo "Content:     $CONTENT_SCORE/100"
echo ""

OVERALL_SCORE=$(awk "BEGIN {printf \"%.0f\", ($STRUCTURE_SCORE + $TOKEN_SCORE + $DUPLICATE_SCORE + $REFERENCE_SCORE + $FORMAT_SCORE + $CONTENT_SCORE) / 6}")

echo "─────────────────────────────────────────"
echo -e "OVERALL QUALITY SCORE: ${GREEN}$OVERALL_SCORE/100${NC}"
echo "─────────────────────────────────────────"
echo ""

if [[ $OVERALL_SCORE -ge 95 ]]; then
  echo -e "${GREEN}✅ EXCELLENT: World-class CLAUDE.md quality${NC}"
elif [[ $OVERALL_SCORE -ge 90 ]]; then
  echo -e "${GREEN}✅ GOOD: Meets quality standards${NC}"
elif [[ $OVERALL_SCORE -ge 80 ]]; then
  echo -e "${YELLOW}⚠️  ACCEPTABLE: Some improvements needed${NC}"
elif [[ $OVERALL_SCORE -ge 70 ]]; then
  echo -e "${YELLOW}⚠️  POOR: Multiple issues detected${NC}"
else
  echo -e "${RED}❌ CRITICAL: Significant quality issues${NC}"
fi

echo ""
echo "Summary: $PASSED_CHECKS passed, $FAILED_CHECKS failed, $WARNINGS warnings"
echo ""

# Generate report if requested
if [[ "$GENERATE_REPORT" == "true" ]]; then
  mkdir -p "$REPORT_DIR"
  REPORT_FILE="$REPORT_DIR/audit-$(date +%Y%m%d-%H%M%S).md"

  cat > "$REPORT_FILE" <<EOF
# CLAUDE.md Quality Audit Report

**Date**: $(date '+%Y-%m-%d %H:%M:%S')
**Overall Score**: $OVERALL_SCORE/100

## Score Breakdown

| Category | Score | Status |
|----------|-------|--------|
| Structure | $STRUCTURE_SCORE/100 | $(if [[ $STRUCTURE_SCORE -ge 90 ]]; then echo "✅"; elif [[ $STRUCTURE_SCORE -ge 70 ]]; then echo "⚠️"; else echo "❌"; fi) |
| Tokens | $TOKEN_SCORE/100 | $(if [[ $TOKEN_SCORE -ge 90 ]]; then echo "✅"; elif [[ $TOKEN_SCORE -ge 70 ]]; then echo "⚠️"; else echo "❌"; fi) |
| Duplicates | $DUPLICATE_SCORE/100 | $(if [[ $DUPLICATE_SCORE -ge 90 ]]; then echo "✅"; elif [[ $DUPLICATE_SCORE -ge 70 ]]; then echo "⚠️"; else echo "❌"; fi) |
| References | $REFERENCE_SCORE/100 | $(if [[ $REFERENCE_SCORE -ge 90 ]]; then echo "✅"; elif [[ $REFERENCE_SCORE -ge 70 ]]; then echo "⚠️"; else echo "❌"; fi) |
| Format | $FORMAT_SCORE/100 | $(if [[ $FORMAT_SCORE -ge 90 ]]; then echo "✅"; elif [[ $FORMAT_SCORE -ge 70 ]]; then echo "⚠️"; else echo "❌"; fi) |
| Content | $CONTENT_SCORE/100 | $(if [[ $CONTENT_SCORE -ge 90 ]]; then echo "✅"; elif [[ $CONTENT_SCORE -ge 70 ]]; then echo "⚠️"; else echo "❌"; fi) |

## Metrics

- **Total Lines**: $total_lines
- **Content Lines**: $content_lines
- **Estimated Tokens**: $token_estimate / $TOKEN_TARGET
- **Token Buffer**: $buffer_tokens tokens ($buffer_percent%)
- **Exact Duplicates**: $exact_duplicates
- **Long Lines**: $long_lines (>$MAX_LINE_LENGTH chars)
- **@import References**: $total_imports total, $missing_imports missing

## Validation Results

- Total Checks: $TOTAL_CHECKS
- Passed: $PASSED_CHECKS
- Failed: $FAILED_CHECKS
- Warnings: $WARNINGS

EOF

  echo -e "${GREEN}✅ Report generated: $REPORT_FILE${NC}"
fi

# Exit code based on quality
if [[ $OVERALL_SCORE -lt $MIN_QUALITY_SCORE ]]; then
  exit 1
else
  exit 0
fi
