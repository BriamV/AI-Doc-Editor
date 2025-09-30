# CLAUDE.md Management Guide

**Complete workflow documentation for maintaining CLAUDE.md quality and preventing format degradation.**

Generated: 2025-01-29
Version: 1.0.0

## Table of Contents

- [Overview](#overview)
- [Update Workflow](#update-workflow)
- [Quality Audit System](#quality-audit-system)
- [Validation & Testing](#validation--testing)
- [Common Scenarios](#common-scenarios)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

### What is the CLAUDE.md Management System?

A systematic approach to maintaining CLAUDE.md quality through:

1. **Automated validation** - Structural integrity and format compliance checks
2. **Guided updates** - Decision trees and templates for consistent additions
3. **Quality audits** - Regular duplicate detection and consolidation
4. **Rollback protection** - Automatic reversion on validation failures

### Key Components

```bash
.claude/
├── commands/
│   ├── update-claude-md.md        # Systematic update command
│   └── audit-claude-md.md         # Quality audit command
└── docs/
    └── claude-md-management-guide.md  # This guide

tools/
└── validate-claude-md.sh          # Validation script

CLAUDE.md                          # Main configuration file
CLAUDE.md.backup-*                 # Timestamped backups (gitignored)
```

### Benefits

- **Prevents degradation** - Meta-instructions enforce consistency
- **Eliminates duplicates** - Automatic detection and consolidation
- **Validates references** - All commands/files verified before commit
- **Maintains quality** - 95/100 quality score target enforced
- **Enables rollback** - Automatic reversion on failures

## Update Workflow

### Quick Start

```bash
# For simple updates (recommended):
/update-claude-md "new content to add"

# For comprehensive audits:
/audit-claude-md

# For manual validation:
tools/validate-claude-md.sh
```

### Detailed Workflow

#### Step 1: Pre-Update Validation

```bash
# Automatic checks before updates:
1. Backup created: CLAUDE.md.backup-$(date +%Y%m%d-%H%M%S)
2. Structure validated: All 14 required sections present
3. Git status checked: Clean or only CLAUDE.md modified
4. Existing content verified: No syntax errors
```

#### Step 2: Content Classification

Use the decision tree to identify target section:

```
Content Type Detection:
├─ Command? (yarn/slash) → Essential Commands
├─ Rule? (✅/❌) → CLAUDE.md Editing Rules or policy section
├─ Structure? (path) → Project Structure or Do Not Touch
└─ Context? (branch/phase) → Current Context

Action Detection:
├─ Exists (85%+ match)? → CONSOLIDATE (remove duplicate)
├─ Outdated? → UPDATE (replace content)
└─ New? → ADD (append to target section)
```

#### Step 3: Format Enforcement

Automatic application of format rules:

```bash
✓ Max 5 lines per entry
✓ Max 200 characters per line
✓ Command-first style: command # description
✓ Namespace prefix: yarn namespace:command
✓ Timing info: (~70s) for long commands
✓ Placeholders: <ARGUMENT>, <FILE>, <NUMBER>
✓ Prefix rules: ✅ MANDATORY, ❌ NEVER
```

#### Step 4: Validation & Testing

```bash
# Before applying changes:
- Verify yarn commands exist in package.json
- Check slash commands exist in .claude/commands/
- Validate file references exist in filesystem
- Test no new duplicates introduced
- Confirm format compliance
```

#### Step 5: User Review & Commit

```bash
# Show diff with context
diff -u CLAUDE.md.backup-<timestamp> CLAUDE.md

# Request approval
Proceed with changes? (y/n)

# Commit with standard format
docs(claude): <action> <type> - <brief-description>

- Section: <target-section>
- Action: <add|update|consolidate>
- Validation: passed
- Backup: CLAUDE.md.backup-<timestamp>
- Lines changed: +X/-Y
```

### Using /update-claude-md Command

#### Basic Usage

```bash
# Add new command
/update-claude-md "yarn qa:gate:monitored - Monitored validation with timeouts (~70s)"

# Add new rule
/update-claude-md "✅ MANDATORY: Validate CLAUDE.md before all updates"

# Update existing entry (auto-detected)
/update-claude-md "yarn sec:all - Complete security pipeline: 0 vulnerabilities"
```

#### Advanced Usage

```bash
# Force specific section
/update-claude-md --section "Security & Compliance" "Zero findings achieved"

# Consolidate duplicates in section
/update-claude-md --action consolidate --section "Essential Commands"

# Preview without applying
/update-claude-md --dry-run "Test content to preview"
```

#### Arguments

- `<content>` - The content to add/update (multiline supported)
- `--section <name>` - Force target section
- `--action <add|update|consolidate>` - Override action detection
- `--dry-run` - Preview changes without applying

## Quality Audit System

### Using /audit-claude-md Command

#### Quick Checks

```bash
# Weekly: Check for duplicates (5 seconds)
/audit-claude-md --scope duplicates

# Monthly: Full audit (30 seconds)
/audit-claude-md

# Before release: Complete validation (60 seconds)
/audit-claude-md --scope full
```

#### Audit Scopes

```bash
--scope full          # Complete audit (all categories)
--scope structure     # Section organization & hierarchy
--scope duplicates    # Exact & near-duplicate detection
--scope references    # Command/file/URL validation
--scope format        # Line length, whitespace, syntax
--scope coherence     # Organization & terminology
--scope obsolescence  # Deprecated commands & outdated refs
```

#### Auto-Fix Mode

```bash
# Apply automatic fixes
/audit-claude-md --auto-fix

# Auto-fix specific scope
/audit-claude-md --scope format --auto-fix

# What gets auto-fixed:
✅ Remove exact duplicate lines
✅ Standardize near-duplicate formatting
✅ Fix broken file references
✅ Remove obsolete command references
✅ Standardize terminology
✅ Fix format violations
✅ Sort commands alphabetically

# Manual review required for:
⚠️ Consolidation recommendations
⚠️ Section reorganization
⚠️ Content updates
```

### Audit Categories

#### 1. Structural Integrity (Target: 95/100)

```bash
Validates:
✓ All 14 required sections present and ordered correctly
✓ Section hierarchy consistent (##, ###, ####)
✓ No orphaned headers (missing parent section)
✓ Consistent separator usage
✓ Code block language tags present

Scoring: Deduct 5 points per violation
```

#### 2. Content Duplication (Target: 85/100)

```bash
Detects:
🔍 Exact duplicates (same content, different sections)
🔍 Near-duplicates (85%+ similarity)
🔍 Redundant commands (yarn vs slash, same function)
🔍 Overlapping workflows (same process, multiple sections)

Algorithm: Fuzzy matching with 85% threshold
Output: Line numbers, similarity %, consolidation recommendations
```

#### 3. Reference Validation (Target: 95/100)

```bash
Validates:
🔗 Yarn commands exist in package.json
🔗 Slash commands exist in .claude/commands/
🔗 File paths exist in repository
🔗 URLs accessible (HTTP 200 check)
🔗 Tool binaries available in PATH

Reports: Broken references with fix suggestions
```

#### 4. Format Compliance (Target: 90/100)

```bash
Checks:
📏 Line length ≤ 200 characters
📏 Code block fencing (``` present)
📏 Consistent indentation (2 spaces)
📏 No trailing whitespace
📏 Emoji usage consistent (✅/❌/🔍/📋)
📏 Placeholder format (<ARGUMENT>, <FILE>)

Scoring: Deduct 2 points per violation
```

#### 5. Coherence & Organization (Target: 80/100)

```bash
Analyzes:
🧩 Commands grouped logically by namespace
🧩 Related rules colocated
🧩 No redundant explanations
🧩 Consistent terminology
🧩 Alphabetical ordering (where applicable)

Suggests: Reorganization for better flow
```

#### 6. Obsolescence Detection (Target: 85/100)

```bash
Identifies:
🗑️ References to removed scripts
🗑️ Deprecated commands (legacy:* namespace)
🗑️ Outdated version numbers
🗑️ Superseded workflows
🗑️ Archived file references (validate if intentional)

Recommends: Updates or removals
```

### Output Files

```bash
.claude/audit-reports/
├── claude-md-audit-<timestamp>.md          # Full audit report
├── claude-md-duplicates-<timestamp>.txt    # Duplicate listings
├── claude-md-fixes-<timestamp>.diff        # Auto-fix changes
└── claude-md-quality-trend.csv             # Historical scores
```

## Validation & Testing

### Using tools/validate-claude-md.sh

#### Basic Usage

```bash
# Standard validation
tools/validate-claude-md.sh

# Verbose mode (detailed output)
tools/validate-claude-md.sh --verbose

# Auto-fix format violations
tools/validate-claude-md.sh --fix
```

#### What Gets Validated

```bash
Structural Integrity:
✓ All 14 required sections present
✓ Sections in correct order
✓ Header hierarchy valid

Format Compliance:
✓ No lines exceed 200 characters
✓ No trailing whitespace
✓ All code blocks properly fenced
✓ Consistent indentation

Reference Validation:
✓ Yarn commands valid (package.json)
✓ Slash commands exist (.claude/commands/)
✓ File references exist (filesystem)
```

#### Exit Codes

```bash
0 = Valid (all checks passed)
1 = Structure error (missing/misordered sections)
2 = Content error (prohibited patterns, format violations)
3 = Reference error (broken commands/files)
```

#### Sample Output

```
═══════════════════════════════════════════════════════════
  CLAUDE.MD VALIDATION REPORT
═══════════════════════════════════════════════════════════

✅ STRUCTURAL INTEGRITY: PASS
  • All 14 required sections present
  • Section order correct
  • Header hierarchy valid

✅ FORMAT COMPLIANCE: PASS
  • 0 lines exceed 200 characters
  • 0 trailing whitespace issues
  • All code blocks properly fenced

✅ REFERENCE VALIDATION: PASS
  • 127/127 yarn commands valid
  • 19/19 slash commands exist
  • 45/45 file references exist

OVERALL: PASS (Score: 95/100)
```

## Common Scenarios

### Scenario 1: Adding a New Command

```bash
# Step 1: Identify command details
Command: yarn qa:gate:monitored
Description: Monitored validation with timeouts
Timing: ~70s
Namespace: qa:

# Step 2: Use update command
/update-claude-md "yarn qa:gate:monitored - Monitored validation with timeouts (~70s)"

# Step 3: Verify addition
grep "qa:gate:monitored" CLAUDE.md

# Step 4: Validate structure
tools/validate-claude-md.sh
```

### Scenario 2: Removing a Duplicate

```bash
# Step 1: Find duplicates
/audit-claude-md --scope duplicates

# Step 2: Review duplicate report
cat .claude/audit-reports/claude-md-duplicates-<timestamp>.txt

# Step 3: Consolidate
/update-claude-md --action consolidate --section "Essential Commands"

# Step 4: Verify removal
/audit-claude-md --scope duplicates
```

### Scenario 3: Updating an Existing Rule

```bash
# Step 1: Locate existing rule
grep "MANDATORY" CLAUDE.md | grep -n "validation"

# Step 2: Update with new content
/update-claude-md "✅ MANDATORY: Run tools/validate-claude-md.sh before all commits"

# Step 3: Verify update (auto-detected as update, not add)
/audit-claude-md --scope format
```

### Scenario 4: Monthly Quality Audit

```bash
# Step 1: Run full audit
/audit-claude-md > .claude/audit-reports/monthly-audit-$(date +%Y%m).md

# Step 2: Review quality score
head -20 .claude/audit-reports/monthly-audit-*.md

# Step 3: Address top issues
/audit-claude-md --auto-fix

# Step 4: Manual consolidation (if needed)
/update-claude-md --action consolidate

# Step 5: Verify improvements
/audit-claude-md
```

### Scenario 5: Emergency Rollback

```bash
# Scenario: Update introduced errors

# Step 1: Check available backups
ls -lt CLAUDE.md.backup-* | head -5

# Step 2: Restore last good version
cp CLAUDE.md.backup-20250129-230204 CLAUDE.md

# Step 3: Validate restored version
tools/validate-claude-md.sh

# Step 4: Commit rollback
git add CLAUDE.md
git commit -m "revert(claude): rollback to last validated version"
```

## Troubleshooting

### Issue: Validation Fails After Update

```bash
Problem: tools/validate-claude-md.sh returns exit code 1

Diagnosis:
$ tools/validate-claude-md.sh --verbose
[✗] Missing required section: ## Project Overview

Solution:
1. Restore backup: cp CLAUDE.md.backup-<timestamp> CLAUDE.md
2. Review what was removed
3. Retry update without removing required sections
4. Use /update-claude-md instead of manual edits
```

### Issue: Duplicate Content Detected

```bash
Problem: /audit-claude-md reports duplicates

Diagnosis:
$ /audit-claude-md --scope duplicates
EXACT DUPLICATES (2 found):
  Line 142, 289: "yarn fe:lint|fe:format|fe:typecheck"

Solution:
$ /update-claude-md --action consolidate --section "Essential Commands"
# Reviews duplicates, keeps best version, removes others
```

### Issue: Broken Command References

```bash
Problem: Validation reports invalid command

Diagnosis:
$ tools/validate-claude-md.sh
[✗] Invalid yarn command: yarn legacy:test:cypress

Solution:
1. Check if command was renamed/removed
2. Update reference to new command:
   /update-claude-md "yarn e2e:fe - E2E tests (Playwright)"
3. Or remove obsolete reference:
   /update-claude-md --action remove --line 167
```

### Issue: Quality Score Below Target

```bash
Problem: Overall score 87/100 (target: 95+)

Diagnosis:
$ /audit-claude-md
Category Breakdown:
  ⚠️ Content Duplication: 75/100 (Needs Improvement)
  ⚠️ Coherence: 78/100 (Needs Improvement)

Solution:
1. Address duplicates:
   $ /audit-claude-md --scope duplicates --auto-fix

2. Improve coherence:
   $ /audit-claude-md --scope coherence
   # Review recommendations, reorganize sections

3. Verify improvement:
   $ /audit-claude-md
```

### Issue: Format Violations

```bash
Problem: Lines exceed 200 characters

Diagnosis:
$ tools/validate-claude-md.sh
[✗] Line 245 exceeds 200 characters

Solution:
1. Locate long line:
   $ awk 'length > 200 {print NR ": " $0}' CLAUDE.md

2. Break into multiple lines:
   Before:
   yarn docs:validate - Document placement validation for ensuring consistency across PowerShell, WSL, and Linux environments

   After:
   yarn docs:validate             # Document placement validation
   # Multi-platform: PowerShell/WSL/Linux support

3. Auto-fix all violations:
   $ tools/validate-claude-md.sh --fix
```

## Best Practices

### Do's ✅

```bash
✅ ALWAYS use /update-claude-md for additions
✅ ALWAYS run tools/validate-claude-md.sh before commit
✅ ALWAYS create backups before major changes
✅ WEEKLY run /audit-claude-md --scope duplicates
✅ MONTHLY run /audit-claude-md full assessment
✅ USE placeholders: <ARGUMENT>, <FILE>, <NUMBER>
✅ KEEP concepts to 3-5 lines maximum
✅ INCLUDE timing for long commands: (~70s)
✅ MAINTAIN namespace prefixes: yarn qa:gate
✅ TEST referenced commands actually work
```

### Don'ts ❌

```bash
❌ NEVER edit CLAUDE.md manually without validation
❌ NEVER add content without checking for duplicates
❌ NEVER exceed 200 characters per line
❌ NEVER remove required sections
❌ NEVER skip backup creation
❌ NEVER ignore validation warnings
❌ NEVER bypass rollback conditions
❌ NEVER commit without running validation
❌ NEVER use vague language ("might", "should")
❌ NEVER add TODO/FIXME markers
```

### Quality Targets

```yaml
Metrics to Maintain:
  Overall Quality Score: ≥ 95/100
  Structural Integrity: ≥ 95/100
  Content Duplication: ≥ 85/100 (< 10% redundancy)
  Reference Validity: ≥ 95/100 (95%+ working)
  Format Compliance: ≥ 90/100
  Coherence: ≥ 80/100
  Obsolescence: ≥ 85/100

Line Limits:
  Total File: < 800 lines (warning at 750)
  Per Section: < 100 lines
  Per Concept: 3-5 lines

Duplication Limits:
  Exact Duplicates: 0
  Near Duplicates: < 3
```

### Maintenance Schedule

```bash
# Daily (during active development)
- Before commit: tools/validate-claude-md.sh
- On update: /update-claude-md with validation

# Weekly
- Audit duplicates: /audit-claude-md --scope duplicates
- Review quality score trend
- Address any warnings

# Monthly
- Full audit: /audit-claude-md
- Consolidation review: /update-claude-md --action consolidate
- Update workflow documentation if needed
- Archive old backups (keep last 5)

# Quarterly
- System review: Assess metrics, adjust thresholds
- Template updates: Refine format templates
- Integration testing: Verify all commands work
- Team feedback: Gather improvement suggestions
```

### Git Workflow

```bash
# Standard commit message format
docs(claude): <action> <content-type> - <brief-description>

- Section: <target-section>
- Action: <add|update|consolidate|remove>
- Validation: passed
- Backup: CLAUDE.md.backup-<timestamp>
- Lines changed: +X/-Y

# Examples:
docs(claude): add command - integrate qa:gate:monitored
docs(claude): consolidate security commands across sections
docs(claude): remove obsolete command - deprecated cli.cjs
docs(claude): update command - enhance sec:all description
```

### Integration with Hooks

```json
// .claude/hooks.json additions
{
  "tools": [
    {
      "name": "validate-claude-md",
      "type": "hook",
      "path": "tools/validate-claude-md.sh",
      "trigger": "before-edit",
      "file_patterns": ["CLAUDE.md"],
      "timeout": 5000
    }
  ]
}
```

## Additional Resources

### Related Documentation

- **CLAUDE.md**: Main configuration file with self-management section
- **.claude/commands/update-claude-md.md**: Update command documentation
- **.claude/commands/audit-claude-md.md**: Audit command documentation
- **.claude/docs/question-answers-about-claude.md**: Best practices reference
- **.claude/docs/claude-md-upgrade-qa-report.md**: Upgrade QA report

### Command Reference

```bash
# Update & Maintenance
/update-claude-md "<content>"              # Systematic update
/audit-claude-md [--scope <type>]          # Quality audit
tools/validate-claude-md.sh                # Validation script

# Analysis & Reporting
/audit-claude-md --scope duplicates        # Duplicate check
/audit-claude-md --scope references        # Reference validation
/audit-claude-md --scope format            # Format check

# Emergency Operations
cp CLAUDE.md.backup-<timestamp> CLAUDE.md  # Restore backup
git checkout HEAD~1 -- CLAUDE.md           # Git rollback
/update-claude-md --action consolidate     # Fix duplicates
```

### Support & Feedback

For issues or suggestions:

1. Check this guide and troubleshooting section
2. Review audit reports in `.claude/audit-reports/`
3. Validate with `tools/validate-claude-md.sh --verbose`
4. Document issue in project tracking system
5. Propose improvements via pull request

---

**Maintenance Note**: This guide should be updated whenever:
- New validation rules are added
- New audit categories are introduced
- Quality thresholds are adjusted
- New troubleshooting scenarios are identified
- Integration patterns change

Last Updated: 2025-01-29
Version: 1.0.0