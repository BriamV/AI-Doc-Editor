---
description: "Update CLAUDE.md with integrated validation and quality checks"
tags: ["claude-md", "documentation", "maintenance", "automation", "governance"]
tier: 2
---

# Update CLAUDE.md Command

Systematic CLAUDE.md updates with deterministic validation workflow, ensuring quality and consistency through integrated validation scripts.

## Purpose

Automate CLAUDE.md modifications with built-in safety checks, quality validation, and token budget monitoring. This command prevents breaking changes and maintains the 90/100+ quality standard through pre/post validation gates.

## When to Use

- Adding new sections or features to CLAUDE.md
- Updating existing command references or workflows
- Modifying project structure documentation
- Integrating new tools or scripts
- Monthly/weekly maintenance reviews

**DO NOT use for**:
- Imported file updates (edit source files directly: `.claude/docs/reference/*.md`)
- Archive modifications (protected files, never modify)
- Audit report changes (point-in-time snapshots, read-only)

## Arguments & Flags

### Positional Arguments

```bash
/update-claude-md "<section>" "<changes>"
```

- `<section>` - Section name to update (e.g., "Project Overview", "Essential Commands")
- `<changes>` - Description of changes to apply (natural language or specific edits)

### Optional Flags

- `--validate` - Run validation only without making changes (dry-run mode)
- `--audit` - Run comprehensive quality audit (requires score ≥90/100)
- `--fix` - Auto-fix format violations during validation (trailing whitespace, etc.)
- `--force` - Skip quality gate (emergency only, requires explicit justification)

## Examples

### Scenario 1: Add New Section

```bash
/update-claude-md "Project Status Tracking" "Add deterministic sync workflow section with tools/sync-project-status.sh integration"
```

**Expected Output:**
```
🔍 Running pre-update validation...
✅ Pre-validation passed (exit code: 0, 3,913 tokens)

📝 Updating CLAUDE.md...
✅ Located section: "Project Status Tracking"
✅ Applied changes: Added deterministic sync workflow
✅ Preserved cross-references: @docs/project-management/status/PROJECT-STATUS.md

🔍 Running post-update validation...
✅ Post-validation passed (exit code: 0, 4,125 tokens)

📊 Token Analysis:
   Before: 3,913 tokens
   After:  4,125 tokens
   Delta:  +212 tokens (5.4% increase)
   Status: ✅ GOOD (well under 5,000 token target)

✅ Changes committed: docs(claude-md): add project status tracking workflow
```

### Scenario 2: Validation Only (Dry-Run)

```bash
/update-claude-md --validate
```

**Expected Output:**
```
🔍 CLAUDE.md Validation Report
─────────────────────────────────────────

✅ Structural integrity: PASS (all 14 sections present and ordered)
⚠️  Content quality: 1 warning
    - Line 187: Exceeds 200 characters (242 chars)

📊 Token Budget:
   Estimated Tokens: 4,125
   Target: <5,000 tokens
   Buffer: 875 tokens (17.5%)
   Status: ✅ GOOD

💡 Exit code: 1 (warnings present, non-blocking)

Recommendation: Run with --fix to auto-correct format issues
```

### Scenario 3: Full Quality Audit

```bash
/update-claude-md --audit
```

**Expected Output:**
```
🔍 Running comprehensive quality audit...

═══════════════════════════════════════════════════════════
  QUALITY SCORE BREAKDOWN
═══════════════════════════════════════════════════════════

Structure:   100/100 ✅ (all 14 sections present)
Tokens:      100/100 ✅ (3,913 tokens, well under 5,000)
Duplicates:  100/100 ✅ (0 exact duplicates found)
References:  95/100  ✅ (38/40 @import references valid)
Format:      85/100  ⚠️  (12 long lines, 3 trailing whitespace)
Content:     100/100 ✅ (no TODO/FIXME comments)

─────────────────────────────────────────
OVERALL QUALITY SCORE: 97/100 ✅ EXCELLENT
─────────────────────────────────────────

✅ World-class CLAUDE.md quality
📊 Summary: 45 passed, 0 failed, 2 warnings

💡 Recommendations:
   1. Run --fix to correct trailing whitespace
   2. Review 12 long lines for readability improvements
```

### Scenario 4: Update with Auto-Fix

```bash
/update-claude-md "Development Setup" "Update Python version requirement to 3.11+" --fix
```

**Expected Output:**
```
🔍 Running pre-update validation with auto-fix...
⚠️  Auto-fixing 3 trailing whitespace violations
✅ Pre-validation passed (exit code: 0, 3,913 tokens)

📝 Updating CLAUDE.md...
✅ Section updated: "Development Setup"
✅ Changes: Updated Python version requirement to 3.11+

🔍 Running post-update validation...
✅ Post-validation passed (exit code: 0, 3,915 tokens)

📊 Token change: +2 tokens (0.05% increase)
✅ Changes committed: docs(claude-md): update Python version to 3.11+
```

## Implementation Workflow

### Phase 1: Pre-Update Validation

**Objective**: Ensure CLAUDE.md is in valid state before modifications

```yaml
Steps:
  1. Read current CLAUDE.md content
  2. Execute: bash tools/validate-claude-md.sh
  3. Parse exit code:
     - 0 = PASS (all checks passed)
     - 1 = WARNING (non-blocking issues)
     - 2 = ERROR (content errors, blocking)
     - 3 = CRITICAL (structure errors, blocking)
  4. Extract token count from validation output
  5. If exit_code >= 2: ABORT with error message
  6. Store baseline metrics (token count, structure state)
```

**Critical Gate**: Exit codes 2 or 3 block all updates until resolved.

### Phase 2: Apply Changes

**Objective**: Make requested modifications safely

```yaml
Steps:
  1. Locate target section in CLAUDE.md
     - If section not found: Offer to create new section
     - If ambiguous match: Request clarification
  2. Apply specified changes intelligently:
     - Natural language: Interpret intent and edit accordingly
     - Specific edits: Apply exact modifications
     - Preserve formatting and indentation
     - Maintain cross-reference integrity (@import patterns)
  3. Update metadata if present:
     - "Last Updated" timestamps
     - Version numbers if applicable
  4. Create backup in memory for rollback capability
```

**Safety Features**:
- No changes if section cannot be located reliably
- Preserve all cross-references (validate @import patterns)
- Maintain consistent formatting (code blocks, lists, headers)

### Phase 3: Post-Update Validation

**Objective**: Verify changes didn't introduce issues

```yaml
Steps:
  1. Execute: bash tools/validate-claude-md.sh
  2. Compare with pre-update baseline:
     - Token count change (warn if >10% increase)
     - New validation errors (rollback if critical)
     - Broken references (rollback if @imports broken)
  3. Parse post-update token count
  4. Calculate delta and percentage change
  5. If exit_code >= 2: ROLLBACK and report issues
  6. If token_count > 5000: WARN (exceeds community target)
```

**Rollback Triggers**:
- Exit code 2 or 3 (errors/critical)
- New broken cross-references introduced
- Token count exceeds 10,000 (absolute limit)

### Phase 4: Quality Audit (Optional)

**Objective**: Comprehensive quality assessment (--audit flag)

```yaml
Steps:
  1. Execute: bash tools/audit-claude-md.sh
  2. Parse quality score components:
     - Structure: /100
     - Tokens: /100
     - Duplicates: /100
     - References: /100
     - Format: /100
     - Content: /100
  3. Calculate overall score (average of 6 components)
  4. If overall_score < 90: WARN (below quality threshold)
  5. Extract recommendations from audit output
  6. Present detailed breakdown to user
```

**Quality Gates**:
- Score ≥90/100: PASS (production-ready)
- Score 80-89: ACCEPTABLE (improvements recommended)
- Score <80: NEEDS WORK (review required)

### Phase 5: Commit & Report

**Objective**: Finalize changes and document results

```yaml
Steps:
  1. Stage CLAUDE.md changes: git add CLAUDE.md
  2. Create structured commit message:
     - Format: "docs(claude-md): <concise description>"
     - Include validation results in commit body
     - Document token count change
  3. Execute commit
  4. Generate success report:
     - Validation status (pre/post)
     - Token count analysis (before/after/delta)
     - Quality score (if --audit used)
     - Applied changes summary
     - Recommendations (if any)
```

**Commit Message Template**:
```
docs(claude-md): <description>

Validation: ✅ PASS (exit code: 0)
Token change: +XX tokens (X.X% increase)
Quality score: XX/100
```

## Validation Script Integration

### validate-claude-md.sh (Fast, CI/CD)

**Purpose**: Quick structural and content validation with auto-fix capability

**Features**:
- Structural integrity check (14 required sections)
- Content quality validation (prohibited patterns, line length)
- Reference validation (yarn commands, slash commands, file paths)
- Token budget estimation (chars / 3.5)
- Auto-fix mode (--fix flag)

**Exit Codes**:
- `0` = PASS (all checks passed)
- `1` = WARNING (non-blocking issues, auto-fixable)
- `2` = ERROR (content errors, blocking)
- `3` = CRITICAL (structure errors, blocking)

**Usage in Command**:
```bash
# Pre-update validation
validation_result=$(bash tools/validate-claude-md.sh)
exit_code=$?

# With auto-fix
validation_result=$(bash tools/validate-claude-md.sh --fix)

# Verbose mode for debugging
validation_result=$(bash tools/validate-claude-md.sh --verbose)
```

**Token Extraction**:
```bash
# Parse token count from validation output
token_count=$(echo "$validation_result" | grep "Estimated Tokens:" | awk '{print $3}')
```

### audit-claude-md.sh (Comprehensive, Quality)

**Purpose**: Deep quality analysis with 0-100 scoring across 6 categories

**Features**:
- Structure audit (section presence and order)
- Token budget analysis (with buffer zones)
- Duplicate detection (exact and near-duplicate warnings)
- Reference validation (@import, yarn, slash commands)
- Format compliance (line length, whitespace, code blocks)
- Content quality (TODO/FIXME detection, line counts)

**Scoring System** (0-100 per category):
- **Structure**: Required sections present and ordered
- **Tokens**: Distance from 5,000 token target
  - <4,500: 100/100 (excellent)
  - 4,500-4,750: 85/100 (caution)
  - 4,750-5,000: 70/100 (warning)
  - >5,000: 0/100 (exceeded)
- **Duplicates**: Penalty per duplicate line (-10 points each)
- **References**: Percentage of valid @import references
- **Format**: Line length violations, whitespace issues
- **Content**: TODO/FIXME comments, content density

**Usage in Command**:
```bash
# Run comprehensive audit
audit_result=$(bash tools/audit-claude-md.sh)

# Generate markdown report
audit_result=$(bash tools/audit-claude-md.sh --report)

# Verbose output
audit_result=$(bash tools/audit-claude-md.sh --verbose)
```

**Score Extraction**:
```bash
# Parse overall quality score
overall_score=$(echo "$audit_result" | grep "OVERALL QUALITY SCORE:" | awk '{print $4}' | cut -d/ -f1)
```

## Detailed Implementation Instructions

### Pseudo-Code for Claude

```python
def update_claude_md(section=None, changes=None, validate=False, audit=False, fix=False, force=False):
    """
    Main command execution flow with deterministic validation gates
    """

    # ─────────────────────────────────────────
    # PHASE 1: Pre-Update Validation
    # ─────────────────────────────────────────

    print("🔍 Running pre-update validation...")

    # Read current content
    current_content = Read("CLAUDE.md")

    # Run validation script with optional auto-fix
    validation_cmd = "bash tools/validate-claude-md.sh"
    if fix:
        validation_cmd += " --fix"

    validation_result = Bash(validation_cmd)
    exit_code = validation_result.exit_code

    # Parse token count from validation output
    token_count_before = extract_token_count(validation_result.output)

    # Quality gate: block on errors/critical
    if exit_code >= 2 and not force:
        print(f"❌ ERROR: CLAUDE.md has critical issues (exit code: {exit_code})")
        print("Fix issues before updating or use --force (not recommended)")
        print("\n" + validation_result.output)
        return FAILURE

    print(f"✅ Pre-validation passed (exit code: {exit_code}, {token_count_before} tokens)")

    # If --validate flag: stop here (dry-run mode)
    if validate:
        print("\n📊 Validation Report:")
        print(validation_result.output)
        return SUCCESS

    # ─────────────────────────────────────────
    # PHASE 2: Apply Changes
    # ─────────────────────────────────────────

    if not section or not changes:
        print("ℹ️  No changes specified (use --validate for validation-only mode)")
        return SUCCESS

    print("\n📝 Updating CLAUDE.md...")

    # Locate target section
    section_match = locate_section(current_content, section)

    if not section_match:
        response = prompt_user(f"Section '{section}' not found. Create new section? (y/n)")
        if response.lower() != 'y':
            print("❌ Update cancelled")
            return FAILURE

        # Create new section at appropriate location
        updated_content = insert_new_section(current_content, section, changes)
    else:
        # Update existing section
        updated_content = apply_changes_to_section(
            content=current_content,
            section=section_match,
            changes=changes
        )

    # Preserve cross-references validation
    import_refs_before = extract_import_refs(current_content)
    import_refs_after = extract_import_refs(updated_content)

    broken_refs = import_refs_before - import_refs_after
    if broken_refs and not force:
        print(f"❌ ERROR: Update would break {len(broken_refs)} cross-references:")
        for ref in broken_refs:
            print(f"   - {ref}")
        print("Update cancelled to preserve reference integrity")
        return FAILURE

    # Apply edit
    Edit("CLAUDE.md", old=current_content, new=updated_content)
    print(f"✅ Section updated: \"{section}\"")
    print(f"✅ Changes: {summarize_changes(current_content, updated_content)}")

    # ─────────────────────────────────────────
    # PHASE 3: Post-Update Validation
    # ─────────────────────────────────────────

    print("\n🔍 Running post-update validation...")

    validation_result_after = Bash("bash tools/validate-claude-md.sh")
    exit_code_after = validation_result_after.exit_code
    token_count_after = extract_token_count(validation_result_after.output)

    # Calculate deltas
    token_delta = token_count_after - token_count_before
    token_percent = (token_delta / token_count_before) * 100

    # Quality gate: rollback on critical issues
    if exit_code_after >= 2 and not force:
        print(f"❌ ERROR: Update introduced critical issues (exit code: {exit_code_after})")
        print("Rolling back changes...")
        Edit("CLAUDE.md", old=updated_content, new=current_content)
        print("✅ Rollback successful - CLAUDE.md restored")
        print("\n" + validation_result_after.output)
        return FAILURE

    # Token budget warnings
    if token_count_after > 10000:
        print(f"🚨 CRITICAL: Token count {token_count_after} exceeds absolute limit (10,000)")
        if not force:
            print("Rolling back changes...")
            Edit("CLAUDE.md", old=updated_content, new=current_content)
            return FAILURE
    elif token_count_after > 5000:
        print(f"⚠️  WARNING: Token count {token_count_after} exceeds community target (5,000)")

    print(f"✅ Post-validation passed (exit code: {exit_code_after}, {token_count_after} tokens)")

    # ─────────────────────────────────────────
    # PHASE 4: Quality Audit (Optional)
    # ─────────────────────────────────────────

    quality_score = None

    if audit:
        print("\n🔍 Running comprehensive quality audit...")

        audit_result = Bash("bash tools/audit-claude-md.sh")
        quality_score = extract_quality_score(audit_result.output)

        print("\n" + audit_result.output)

        if quality_score < 90 and not force:
            print(f"\n⚠️  WARNING: Quality score {quality_score}/100 below threshold (90)")
            print("Review recommendations above and consider improvements")

    # ─────────────────────────────────────────
    # PHASE 5: Commit & Report
    # ─────────────────────────────────────────

    # Generate commit message
    commit_msg = f"""docs(claude-md): {generate_commit_description(section, changes)}

Validation: ✅ PASS (exit code: {exit_code_after})
Token change: {'+' if token_delta >= 0 else ''}{token_delta} tokens ({token_percent:+.1f}%)"""

    if quality_score:
        commit_msg += f"\nQuality score: {quality_score}/100"

    # Commit changes
    commit_result = Bash(f'git add CLAUDE.md && git commit -m "{commit_msg}"')

    if commit_result.exit_code != 0:
        print("⚠️  Git commit failed (changes preserved in working directory):")
        print(commit_result.output)
    else:
        print(f"✅ Changes committed: {commit_msg.split(chr(10))[0]}")

    # Generate success report
    print("\n" + "="*60)
    print("  UPDATE SUMMARY")
    print("="*60)
    print(f"\n📊 Token Analysis:")
    print(f"   Before: {token_count_before} tokens")
    print(f"   After:  {token_count_after} tokens")
    print(f"   Delta:  {'+' if token_delta >= 0 else ''}{token_delta} tokens ({token_percent:+.1f}%)")

    # Token status indicator
    if token_count_after < 4500:
        print(f"   Status: ✅ GOOD (well under 5,000 token target)")
    elif token_count_after < 4750:
        print(f"   Status: ⚠️  CAUTION (within buffer zone)")
    elif token_count_after < 5000:
        print(f"   Status: ⚠️  WARNING (approaching 5,000 token limit)")
    else:
        print(f"   Status: ❌ EXCEEDED (over 5,000 token target)")

    if quality_score:
        print(f"\n🎯 Quality Score: {quality_score}/100")

    return SUCCESS


# ─────────────────────────────────────────
# Helper Functions
# ─────────────────────────────────────────

def extract_token_count(validation_output: str) -> int:
    """Extract token count from validation script output"""
    import re
    match = re.search(r'Estimated Tokens:\s*(\d+)', validation_output)
    if match:
        return int(match.group(1))
    return 0

def extract_quality_score(audit_output: str) -> int:
    """Extract overall quality score from audit script output"""
    import re
    match = re.search(r'OVERALL QUALITY SCORE:\s*(\d+)/100', audit_output)
    if match:
        return int(match.group(1))
    return 0

def locate_section(content: str, section_name: str) -> dict:
    """
    Locate a section in CLAUDE.md by header name
    Returns: {start_line, end_line, header_level, exact_match}
    """
    lines = content.split('\n')

    # Normalize section name (remove ##, #, etc.)
    normalized_name = section_name.lstrip('#').strip()

    for i, line in enumerate(lines):
        if line.startswith('#'):
            header = line.lstrip('#').strip()
            if normalized_name.lower() in header.lower():
                # Found match - determine section boundaries
                header_level = len(line) - len(line.lstrip('#'))

                # Find end of section (next header of same or higher level)
                end_line = len(lines)
                for j in range(i + 1, len(lines)):
                    if lines[j].startswith('#'):
                        next_level = len(lines[j]) - len(lines[j].lstrip('#'))
                        if next_level <= header_level:
                            end_line = j
                            break

                return {
                    'start_line': i,
                    'end_line': end_line,
                    'header_level': header_level,
                    'exact_match': header == normalized_name
                }

    return None

def apply_changes_to_section(content: str, section: dict, changes: str) -> str:
    """
    Apply changes to a specific section based on natural language description
    """
    lines = content.split('\n')
    section_content = '\n'.join(lines[section['start_line']:section['end_line']])

    # Interpret changes (natural language processing)
    # This is where Claude's intelligence applies the requested modifications
    # Examples:
    #   - "Add new command /foo" → Append to command list
    #   - "Update Python version to 3.11+" → Replace version string
    #   - "Remove deprecated note" → Delete specified content

    # For this pseudo-code, assume intelligent interpretation
    modified_section = interpret_and_apply_changes(section_content, changes)

    # Reconstruct full document
    new_lines = (
        lines[:section['start_line']] +
        modified_section.split('\n') +
        lines[section['end_line']:]
    )

    return '\n'.join(new_lines)

def extract_import_refs(content: str) -> set:
    """Extract all @import references from content"""
    import re
    return set(re.findall(r'@[\w/.+-]+\.md', content))

def summarize_changes(before: str, after: str) -> str:
    """Generate concise summary of changes made"""
    # Simple diff summary (lines added/removed/modified)
    before_lines = set(before.split('\n'))
    after_lines = set(after.split('\n'))

    added = len(after_lines - before_lines)
    removed = len(before_lines - after_lines)

    if added > 0 and removed > 0:
        return f"Modified content ({added} lines added, {removed} removed)"
    elif added > 0:
        return f"Added {added} new lines"
    elif removed > 0:
        return f"Removed {removed} lines"
    else:
        return "Content reformatted (no lines added/removed)"
```

## Error Handling

### Common Errors & Resolution

#### 1. Section Not Found

**Error**:
```
❌ ERROR: Section "XYZ" not found in CLAUDE.md
```

**Resolution**:
- Verify exact section name (case-sensitive)
- List available sections: `grep "^## " CLAUDE.md`
- Offer to create new section if intended

#### 2. Validation Fails (Pre-Update)

**Error**:
```
❌ ERROR: CLAUDE.md has critical issues (exit code: 2)
Structural integrity: FAIL (missing section: ## Essential Commands)
```

**Resolution**:
- Fix structural issues before updating
- Run `bash tools/validate-claude-md.sh --verbose` for details
- Cannot proceed with updates until exit code ≤ 1

#### 3. Validation Fails (Post-Update)

**Error**:
```
❌ ERROR: Update introduced critical issues (exit code: 3)
Reference validation: FAIL (broken @import: .claude/docs/missing.md)
Rolling back changes...
```

**Resolution**:
- Automatic rollback preserves integrity
- Review intended changes for reference breakage
- Fix broken references before retrying

#### 4. Token Budget Exceeded

**Warning**:
```
⚠️  WARNING: Token count 5,234 exceeds community target (5,000)
Changes committed but consider optimization
```

**Resolution**:
- Review added content for redundancy
- Move detailed content to imported files
- Run `bash tools/audit-claude-md.sh` for optimization recommendations

#### 5. Quality Score Below Threshold

**Warning**:
```
⚠️  WARNING: Quality score 87/100 below threshold (90)
Review recommendations:
  - 15 lines exceed 200 characters (Format: 75/100)
  - 2 TODO comments found (Content: 90/100)
```

**Resolution**:
- Non-blocking warning (changes still committed)
- Review audit recommendations
- Run with `--fix` flag to auto-correct format issues

#### 6. Git Commit Fails

**Error**:
```
⚠️  Git commit failed (changes preserved in working directory):
fatal: no changes added to commit
```

**Resolution**:
- Changes are safely preserved in CLAUDE.md
- Manually review: `git diff CLAUDE.md`
- Commit manually if needed: `git add CLAUDE.md && git commit -m "..."`

#### 7. Cross-Reference Breakage

**Error**:
```
❌ ERROR: Update would break 2 cross-references:
   - @.claude/docs/reference/commands-reference.md
   - @docs/architecture/adr/ADR-011-dual-directory-architecture.md
Update cancelled to preserve reference integrity
```

**Resolution**:
- Review changes to ensure @import patterns preserved
- Verify source files exist before referencing
- Use `--force` only if intentionally removing references

## Quality Gates

### Must Pass (Blocking)

These gates will **ABORT** the update if failed:

1. **Pre-validation exit code ≤ 1** (no errors or critical issues)
2. **Post-validation exit code ≤ 1** (update didn't introduce errors)
3. **No broken cross-references** (@import patterns preserved)
4. **Token count < 10,000** (absolute hard limit)

### Should Pass (Warnings)

These gates will **WARN** but allow update:

1. **Quality score ≥ 90/100** (production-ready standard)
2. **Token count < 5,000** (community recommendation)
3. **No format violations** (line length, trailing whitespace)
4. **No prohibited content** (TODO, FIXME comments)

## Integration with Other Commands

### Automatic Invocation

This command is automatically invoked by:

1. **`/sync-project-status`** - After updating PROJECT-STATUS.md references in CLAUDE.md
2. **New slash command creation** - When adding commands to `.claude/commands/`
3. **Scheduled maintenance** - Monthly quality reviews via GitHub Actions

### Related Commands

- **`/audit-claude-md`** - Alias for `/update-claude-md --audit` (audit-only mode)
- **`/validate-claude-md`** - Alias for `/update-claude-md --validate` (validation-only)
- **`/docs-update`** - Updates documentation, may trigger CLAUDE.md updates

### Command Chaining Examples

```bash
# Validate, then update if valid
/update-claude-md --validate && /update-claude-md "Section" "Changes"

# Update with full audit
/update-claude-md "Section" "Changes" --audit

# Fix format issues, then validate
/update-claude-md --fix && /update-claude-md --validate

# Emergency update (skip quality gates)
/update-claude-md "Section" "Critical fix" --force
```

## Best Practices

### When Updating CLAUDE.md

1. **Always validate first** - Run `--validate` before making changes
2. **Update source files** - Edit `.claude/docs/reference/*.md` files, not CLAUDE.md directly for imported content
3. **Test commands** - Verify yarn commands and slash commands exist before documenting
4. **Preserve structure** - Maintain the 14 required sections in order
5. **Keep it concise** - Aim for <4,500 tokens (10% buffer from 5,000 target)
6. **Use auto-fix** - Run `--fix` to automatically correct format violations
7. **Audit regularly** - Run `--audit` monthly to maintain 90/100+ quality

### Token Budget Management

**Current Budget**: 3,913 tokens (well under 5,000 target)

**Optimization Strategies**:
- Move detailed command lists to `.claude/docs/reference/commands-reference.md` (imported)
- Use @import for quality tools reference instead of inline lists
- Consolidate redundant sections into comprehensive references
- Remove outdated emergency procedures (archive instead)

**Token Zones**:
- **Green (<4,500)**: Optimal, plenty of buffer
- **Yellow (4,500-4,750)**: Caution zone, review before adding
- **Orange (4,750-5,000)**: Warning zone, consolidation recommended
- **Red (>5,000)**: Exceeded target, optimization required

### Quality Maintenance

**Weekly**:
- Run `/update-claude-md --validate` to catch issues early

**Monthly**:
- Run `/update-claude-md --audit` for comprehensive quality review
- Review token budget trends
- Consolidate new content into imported files

**Quarterly**:
- Full CLAUDE.md audit with architectural review
- Update cross-references for accuracy
- Archive deprecated sections

## Cross-References

### Validation & Audit Scripts

- **Validation**: `bash tools/validate-claude-md.sh` - Fast structural validation
- **Audit**: `bash tools/audit-claude-md.sh` - Comprehensive quality analysis

### Documentation

- **Maintenance Spec**: `.claude/docs/specs/claude-md-self-management-spec.md` - Design specifications
- **Commands Reference**: `.claude/docs/reference/commands-reference.md` - Complete command catalog
- **Quality Tools**: `.claude/docs/reference/quality-tools-reference.md` - Tools ecosystem
- **Protected Files**: `.claude/docs/reference/protected-files-policy.md` - What not to modify

### Related Commands

- **`/sync-project-status`** - Project status synchronization (may update CLAUDE.md)
- **`/docs-update`** - Documentation maintenance (broader scope)
- **`/health-check`** - System diagnostics (includes CLAUDE.md validation)

## Technical Notes

### Tool Requirements

- **Read** - Read CLAUDE.md and validation output
- **Edit** - Modify CLAUDE.md safely with rollback capability
- **Bash** - Execute validation and audit scripts
- **Git** (optional) - Commit changes automatically

### Script Dependencies

- `tools/validate-claude-md.sh` - **REQUIRED** (exits gracefully if missing)
- `tools/audit-claude-md.sh` - Optional (--audit flag ignored if missing)
- `package.json` - Optional (yarn command validation disabled if missing)
- `.claude/commands/` - Optional (slash command validation disabled if missing)

### Exit Codes

Command exit codes (not validation script codes):

- `0` - SUCCESS (update completed or validation passed)
- `1` - FAILURE (validation failed, rollback performed, or user cancelled)

### Performance

- **Validation**: <2 seconds (fast, suitable for pre-commit hooks)
- **Audit**: 3-5 seconds (comprehensive, monthly/quarterly use)
- **Total workflow**: 5-10 seconds (validation + update + validation + commit)

---

**Version**: 1.0.0
**Last Updated**: 2025-10-18
**Maintainer**: Workflow Architect
**Status**: Production-Ready
