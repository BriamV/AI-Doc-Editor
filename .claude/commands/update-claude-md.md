# /update-claude-md

Systematically update CLAUDE.md with new instructions while maintaining structural integrity.

## Usage

```bash
/update-claude-md <content>
```

## Description

This command provides a guided, validated approach to updating CLAUDE.md that prevents format degradation and maintains consistency. It automatically:

- Creates timestamped backup before changes
- Validates structural integrity
- Detects target section via content analysis
- Checks for duplicates and conflicts
- Enforces format compliance (3-5 lines, ≤200 chars)
- Tests command/file references
- Generates diff for review
- Commits with standard message format

## Arguments

- `<content>` - The content to add/update (can be multiline)
- `--section <name>` - (Optional) Force target section
- `--action <add|update|consolidate>` - (Optional) Override action detection
- `--dry-run` - Preview changes without applying

## Workflow

### 1. Pre-Update Validation

```bash
# Automatic checks before any changes:
✓ Read current CLAUDE.md state
✓ Create backup: CLAUDE.md.backup-<timestamp>
✓ Validate structure (all required sections present)
✓ Check git status (must be clean or only CLAUDE.md)
✓ Verify no uncommitted syntax errors
```

### 2. Content Classification & Target Detection

```bash
# Decision tree for section detection:
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

### 3. Duplicate Detection

```bash
# Automatic checks:
- Exact match: grep -F "<content>" CLAUDE.md
- Near-duplicate: fuzzy match (85%+ similarity)
- Semantic duplicate: same command, different description
- Action: CONSOLIDATE if found, ADD if new
```

### 4. Format Enforcement

```bash
# Applied automatically:
✓ Max 5 lines per entry (externalize if longer)
✓ Max 200 characters per line
✓ Command-first style: command # description
✓ Namespace prefix: yarn namespace:command
✓ Timing info for long commands: (~70s)
✓ Placeholders: <ARGUMENT>, <FILE>, <NUMBER>
✓ Prefix rules: ✅ MANDATORY, ❌ NEVER
```

### 5. Validation & Testing

```bash
# Before applying changes:
- Verify yarn commands exist in package.json
- Check slash commands exist in .claude/commands/
- Validate file references exist in filesystem
- Test no new duplicates introduced
- Confirm format compliance
```

### 6. User Review & Commit

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

## Rollback Conditions

```bash
# Automatic rollback if any condition met:
❌ Validation failure (structure/format/references)
❌ Duplicate content detected (similarity > 85%)
❌ Broken command reference (doesn't exist)
❌ Format violation (line > 200 chars, missing section)
❌ User rejection in review step
```

## Format Templates

### Commands Template
```bash
# <Category> - <namespace>: prefix
yarn <namespace>:<command>    # <Description (max 80 chars, include timing)>

# Example:
yarn qa:gate:monitored        # Monitored validation with timeouts (~70s)
```

### Rules Template
```bash
# ✅ MANDATORY: <Imperative statement>
# ❌ NEVER: <Prohibited action>

# Example:
# ✅ MANDATORY: Run validation before CLAUDE.md updates
# ❌ NEVER: Add TODO/FIXME markers
```

### Structure Template
```bash
- `<path>/` - <Brief description>
  - `<subpath>/` - <Specific detail>

# Example:
- `.claude/commands/` - Custom slash commands (19 orchestrators)
```

## Examples

```bash
# Add new command
/update-claude-md "yarn qa:gate:monitored - Monitored validation with timeouts (~70s)"

# Add new rule
/update-claude-md "✅ MANDATORY: Validate CLAUDE.md before all updates"

# Update existing entry (auto-detected)
/update-claude-md "yarn sec:all - Complete security pipeline: 0 vulnerabilities"

# Force specific section
/update-claude-md --section "Security & Compliance" "Zero findings achieved"

# Consolidate duplicates in section
/update-claude-md --action consolidate --section "Essential Commands"

# Preview without applying
/update-claude-md --dry-run "Test content to preview"
```

## Integration

```bash
# Recommended workflow:
/audit-claude-md                    # Identify issues first
/update-claude-md --action consolidate  # Fix consolidations
/update-claude-md "New content"     # Add new content
/audit-claude-md                    # Verify improvements
```

## Success Criteria

```bash
✅ Backup created before changes
✅ All validation checks passed
✅ No duplicates introduced
✅ Format compliance 100%
✅ Command/file references valid
✅ User approved changes
✅ Committed with standard message format
```

## See Also

- `/audit-claude-md` - Comprehensive quality audit
- `CLAUDE.md` Section: "CLAUDE.md Self-Management"
- `tools/validate-claude-md.sh` - Validation script