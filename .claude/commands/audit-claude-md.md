# /audit-claude-md

⚠️ **CRITICAL WARNING: SPECIFICATION ONLY - NOT IMPLEMENTED**

This command is currently a **specification document** describing desired functionality. The described automation **does not exist yet**.

**Current Status**: Only `tools/validate-claude-md.sh` is partially functional

**Implementation Status**: 15% (basic validation only, no quality scoring or duplicate detection)

**Risk**: Relying on this command may result in undetected CLAUDE.md degradation

---

Comprehensive CLAUDE.md quality audit with detailed analysis and consolidation recommendations.

## Usage

```bash
/audit-claude-md [--scope <type>] [--auto-fix]
```

## Description

Performs deep quality analysis of CLAUDE.md structure, content, and coherence. Generates detailed reports with:

- Structural integrity assessment
- Duplicate content detection (exact & near-duplicates)
- Reference validation (commands, files, URLs)
- Format compliance checking
- Coherence & organization analysis
- Obsolescence detection
- Consolidation recommendations
- Quality score (0-100)

## Arguments

- `--scope <type>` - Focus audit on specific area:
  - `full` (default) - Complete audit all categories
  - `structure` - Section organization & hierarchy
  - `duplicates` - Exact & near-duplicate detection
  - `references` - Command/file/URL validation
  - `format` - Line length, whitespace, syntax
  - `coherence` - Organization & terminology
  - `obsolescence` - Deprecated commands & outdated refs

- `--section <name>` - Audit specific section only
- `--auto-fix` - Apply automatic fixes (format violations, duplicates)
- `--report-path <path>` - Custom output location (default: `.claude/audit-reports/`)

## Audit Categories

### 1. Structural Integrity (Target: 95/100)

```bash
# Validates:
✓ All 14 required sections present and ordered correctly
✓ Section hierarchy consistent (##, ###, ####)
✓ No orphaned headers (missing parent section)
✓ Consistent separator usage (---, ==, ~~)
✓ Code block language tags present

# Deducts 5 points per violation
```

### 2. Content Duplication (Target: 85/100)

```bash
# Detects:
🔍 Exact duplicates (same content, different sections)
🔍 Near-duplicates (85%+ similarity)
🔍 Redundant commands (yarn vs slash, same function)
🔍 Overlapping workflows (same process, multiple sections)

# Algorithm: Fuzzy matching with 85% threshold
# Output: Line numbers, similarity %, consolidation recommendations
```

### 3. Reference Validation (Target: 95/100)

```bash
# Validates:
🔗 Yarn commands exist in package.json
🔗 Slash commands exist in .claude/commands/
🔗 File paths exist in repository
🔗 URLs accessible (HTTP 200 check)
🔗 Tool binaries available in PATH

# Reports broken references with fix suggestions
```

### 4. Format Compliance (Target: 90/100)

```bash
# Checks:
📏 Line length ≤ 200 characters
📏 Code block fencing (``` present)
📏 Consistent indentation (2 spaces)
📏 No trailing whitespace
📏 Emoji usage consistent (✅/❌/🔍/📋)
📏 Placeholder format (<ARGUMENT>, <FILE>)

# Deducts 2 points per violation
```

### 5. Coherence & Organization (Target: 80/100)

```bash
# Analyzes:
🧩 Commands grouped logically by namespace
🧩 Related rules colocated
🧩 No redundant explanations
🧩 Consistent terminology (sub-agent vs agent)
🧩 Alphabetical ordering (where applicable)

# Suggests reorganization for better flow
```

### 6. Obsolescence Detection (Target: 85/100)

```bash
# Identifies:
🗑️ References to removed scripts (cli.cjs, qa-gate.cjs)
🗑️ Deprecated commands (legacy:* namespace)
🗑️ Outdated version numbers
🗑️ Superseded workflows
🗑️ Archived file references (validate if intentional)

# Recommends updates or removals
```

## Output Format

### Summary Report

```
═══════════════════════════════════════════════════════════
  CLAUDE.MD QUALITY AUDIT REPORT
  Generated: 2025-01-29 23:15:00
═══════════════════════════════════════════════════════════

OVERALL SCORE: 87/100 (Target: 95+)

Category Breakdown:
  ✅ Structural Integrity:  95/100 (Excellent)
  ⚠️ Content Duplication:   75/100 (Needs Improvement)
  ✅ Reference Validation:  95/100 (Excellent)
  ✅ Format Compliance:     92/100 (Good)
  ⚠️ Coherence:             78/100 (Needs Improvement)
  ⚠️ Obsolescence:          80/100 (Good)

METRICS:
  Total Lines: 557
  Content Lines: 420 (75% density)
  Estimated Tokens: 1,800-2,000
  Sections: 14 required + 8 additional

ISSUES SUMMARY:
  ❌ CRITICAL: 2 issues (blocks effectiveness)
  ⚠️ MEDIUM:  5 issues (reduces efficiency)
  💡 LOW:     8 issues (quality improvements)
```

### Detailed Issues

```
═══════════════════════════════════════════════════════════
  TOP ISSUES TO ADDRESS
═══════════════════════════════════════════════════════════

[CRITICAL] C1: Exact duplicates found
  Location: Lines 142, 289
  Content: "yarn fe:lint|fe:format|fe:typecheck"
  Impact: Wastes tokens, confuses priorities
  Fix: /update-claude-md --action consolidate --section "Essential Commands"

[CRITICAL] C2: Missing meta-instructions
  Location: No "Self-Management" section
  Impact: Format will degrade over time
  Fix: Add self-update rules to CLAUDE.md

[MEDIUM] M1: Excessive redundancy (29.4%)
  Impact: ~360 tokens wasted
  Locations: Throughout (see duplicate report)
  Fix: Run consolidation on all sections

[MEDIUM] M2: Oversized sections
  Locations: Lines 99-165 (65 lines), 186-226 (40 lines)
  Impact: Cognitive overload
  Fix: Split into subsections or externalize via @import

[LOW] L1: Terminology inconsistencies
  Variants: "sub-agent" (12x) vs "agent" (8x)
  Impact: Minor confusion
  Fix: Standardize to "sub-agent" throughout
```

### Duplicate Detection Report

```
═══════════════════════════════════════════════════════════
  DUPLICATE CONTENT ANALYSIS
═══════════════════════════════════════════════════════════

EXACT DUPLICATES (3 found):
  1. Lines 142, 289: "yarn fe:lint|fe:format|fe:typecheck"
     → CONSOLIDATE: Keep in Essential Commands, remove from line 289

  2. Lines 156, 352, 542: "yarn sec:all - Complete security pipeline"
     → CONSOLIDATE: Keep in Security & Compliance, remove others

  3. Lines 39, 453: "Performance: 54% faster execution (152s → 70s)"
     → CONSOLIDATE: Keep in Development Setup, remove from POST-BUILD

NEAR DUPLICATES (5 found, 85%+ similarity):
  1. Lines 49-58 vs 160-164: Namespace architecture description
     Similarity: 92%
     → CONSOLIDATE: Keep detailed version in line 49, summarize line 160

  2. Lines 69-97 vs 533-548: Command listings overlap
     Similarity: 87%
     → CONSOLIDATE: Merge into single "Essential Commands" section
```

### Consolidation Recommendations

```
═══════════════════════════════════════════════════════════
  CONSOLIDATION OPPORTUNITIES
═══════════════════════════════════════════════════════════

HIGH PRIORITY (15+ lines reduction):
  1. Security Commands Consolidation
     Current: Scattered across lines 156, 289, 350-379
     Target: Single "Security & Compliance" section
     Savings: 18 lines
     Command: /update-claude-md --action consolidate --section "Security & Compliance"

  2. Quality Gate Commands
     Current: Essential Commands, Quality Assurance, Task Management
     Target: Quality Assurance section
     Savings: 12 lines

MEDIUM PRIORITY (5-14 lines reduction):
  3. Namespace Quick Commands vs Essential Commands
     Overlap: 8 commands duplicated
     Savings: 8 lines
```

## Auto-Fix Capabilities

When `--auto-fix` is enabled:

```bash
# Automatic fixes applied:
✅ Remove exact duplicate lines (keep first occurrence)
✅ Standardize near-duplicate formatting
✅ Fix broken file references (update to current paths)
✅ Remove obsolete command references
✅ Standardize terminology (use dominant variant)
✅ Fix format violations (trim whitespace, line length)
✅ Sort commands alphabetically (within logical groups)

# Manual review required for:
⚠️ Consolidation recommendations (semantic understanding needed)
⚠️ Section reorganization (structural changes)
⚠️ Content updates (domain knowledge required)
```

## Examples

```bash
# Quick duplicate check (weekly)
/audit-claude-md --scope duplicates

# Full audit (monthly)
/audit-claude-md

# Audit specific section
/audit-claude-md --section "Essential Commands"

# Validate all references
/audit-claude-md --scope references

# Auto-fix format violations
/audit-claude-md --scope format --auto-fix

# Complete audit with auto-fix
/audit-claude-md --auto-fix
```

## Output Files

```bash
# Generated reports:
.claude/audit-reports/
├── claude-md-audit-<timestamp>.md          # Full audit report
├── claude-md-duplicates-<timestamp>.txt    # Duplicate listings
├── claude-md-fixes-<timestamp>.diff        # Auto-fix changes
└── claude-md-quality-trend.csv             # Historical scores
```

## Success Metrics

```yaml
Target Quality Thresholds:
  Overall Score: ≥ 95/100
  Structural Integrity: ≥ 95
  Content Duplication: ≥ 85 (< 10% redundancy)
  Reference Validation: ≥ 95 (95%+ working refs)
  Format Compliance: ≥ 90
  Coherence: ≥ 80
  Obsolescence: ≥ 85

Line Limits:
  Total File: < 800 lines (warning at 750)
  Per Section: < 100 lines
  Per Concept: 3-5 lines

Duplication Limits:
  Exact Duplicates: 0
  Near Duplicates: < 3
```

## Recommended Schedule

```bash
# Weekly (during active development)
/audit-claude-md --scope duplicates

# Monthly (stable phases)
/audit-claude-md --scope full

# Before major releases
/audit-claude-md --auto-fix

# After command ecosystem changes
/audit-claude-md --scope references
```

## Integration Workflow

```bash
# Typical workflow:
/audit-claude-md                          # Identify issues
/update-claude-md --action consolidate    # Fix consolidations
/audit-claude-md --auto-fix               # Apply automatic fixes
/audit-claude-md                          # Verify improvements
```

## See Also

- `/update-claude-md` - Systematic update command
- `CLAUDE.md` Section: "CLAUDE.md Self-Management"
- `tools/validate-claude-md.sh` - Validation script