# CLAUDE.md Self-Management & Governance

**Usage**: This file is imported by CLAUDE.md via @import
**Purpose**: Systematic update mechanism to prevent format degradation and maintain structural integrity through systematic updates

## Update Protocol

```bash
# ✅ MANDATORY: Use systematic update workflow
/update-claude-md "new content"         # Guided update with validation
/audit-claude-md                        # Quality audit + consolidation
tools/validate-claude-md.sh             # Structural validation

# ❌ NEVER: Direct manual edits without validation
```

## Decision Tree for Content Classification

```bash
Command Reference?
├─ Contains "yarn" → Essential Commands
├─ Contains "/" (slash cmd) → Essential Commands
├─ Contains "tools/" → Task Management Workflow
└─ Contains "scripts/" → Integration Policy

Rule/Policy?
├─ About editing CLAUDE.md → CLAUDE.md Editing Rules
├─ About security → Security & Compliance
├─ About quality → Quality Assurance
└─ About workflow → Integration Policy

Structure Info?
├─ Directory/file → Project Structure
├─ Archive reference → Do Not Touch
└─ Architecture → Integration Policy

Context/Status?
├─ Current branch/phase → Current Context
└─ Task pattern → Task Management Workflow
```

## Quality Thresholds

```bash
# Maintained via automated validation:
✓ Zero exact duplicates (was 8)
✓ <3 near-duplicates (85%+ similarity)
✓ All commands ≤5 lines
✓ All lines ≤200 characters
✓ 100% reference validity (yarn/slash/files)
✓ All 14 required sections present
✓ Quality score: 95+/100
```

## Rollback Conditions

```bash
# Automatic rollback if:
❌ Structure validation fails
❌ Duplicate introduced (>85% similarity)
❌ Broken reference (command/file doesn't exist)
❌ Format violation (line >200 chars)
❌ Quality score drops below 90
```

## Maintenance Commands

```bash
# Weekly: Audit for duplicates
/audit-claude-md --scope duplicates

# Monthly: Full quality assessment
/audit-claude-md

# After major changes: Validate structure
tools/validate-claude-md.sh --verbose

# Emergency: Rollback to last good version
git checkout HEAD~1 -- CLAUDE.md
```