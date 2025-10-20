# sync-project-status.sh - Usage Guide

## Overview

**Purpose**: Deterministic status tracking automation for AI Document Editor project.

**Architecture**: Bottom-up hierarchical propagation
- **Source of Truth**: Task status files (`docs/tasks/T-XX-STATUS.md`)
- **Propagation Flow**: Task → Work Package → Release → Project Status
- **Deterministic Rules**: Milestone-driven cascading updates (25%, 50%, 75%, 100%)

**See**: `docs/development/STATUS-TRACKING-UPDATE-WORKFLOW.md` for complete workflow details

---

## Quick Start

```bash
# Basic usage: Propagate status updates for a task
bash tools/sync-project-status.sh T-04

# Preview changes without modifying files
bash tools/sync-project-status.sh T-04 --dry-run

# Validate consistency across entire hierarchy
bash tools/sync-project-status.sh --validate

# Auto-correct inconsistencies (future)
bash tools/sync-project-status.sh --fix
```

---

## Operational Modes

### 1. Full Propagation (Default)

Updates entire hierarchy based on task status changes.

```bash
bash tools/sync-project-status.sh T-04
```

**What it does**:
1. Parses `T-04-STATUS.md` YAML frontmatter
2. Extracts: `estado`, `complejidad`, `completado`, `progreso`
3. Maps task to parent WP (R1-WP1) and Release (R1)
4. Updates WP task matrix with new status
5. Recalculates WP progress: `(completed_points / total_complexity) * 100`
6. Checks if WP reached milestone (25%, 50%, 75%, 100% ±2%)
7. If milestone: Updates Release WP summary
8. If milestone: Recalculates Release progress (weighted by WP complexity)
9. If Release status changed: Updates Project summary

**Output Example**:
```
ℹ️  Starting status propagation for T-04...
📊 Task Status: ✅ 100% COMPLETADO | Complexity: 18 | Progress: 100%
ℹ️  Parent: R1-WP1 (Release: R1)
✅ Updated task row in WP: T-04 → ✅ Complete (100%)
📊 WP Progress: 41% (18.00 / 44 points)
ℹ️  WP not at milestone (41%), updating progress bar only
✅ Updated WP progress bar: 41% [████░░░░░░]
✅ Status propagation complete for T-04
```

---

### 2. Dry-Run Mode

Preview changes without modifying any files.

```bash
bash tools/sync-project-status.sh T-04 --dry-run
```

**Use cases**:
- Test script logic before committing changes
- Validate calculations (WP/Release progress percentages)
- Review which files would be updated
- Debug milestone detection logic

**Output Example**:
```
ℹ️  DRY RUN MODE: No files will be modified
ℹ️  DRY RUN: Would update task row in R1-WP1-progress.md
ℹ️    Task: T-04 | Status: ✅ Complete | Progress: 100% | Points: 18/18
ℹ️  DRY RUN: Would update progress bar in R1-WP1-progress.md to 41%
```

---

### 3. Validation Mode (Future)

Check consistency across all 4 hierarchy levels.

```bash
bash tools/sync-project-status.sh --validate
```

**Planned checks** (not yet implemented):
- Task status matches WP task matrix
- WP progress matches calculated complexity points
- Release progress matches WP weighted aggregation
- Project summary matches release status

**Exit codes**:
- `0`: Validation passed
- `1`: Inconsistencies found

---

### 4. Auto-Fix Mode (Future)

Automatically correct inconsistencies.

```bash
bash tools/sync-project-status.sh --fix
```

**Planned behavior**:
1. Run validation checks
2. Identify discrepancies
3. Auto-correct based on source of truth (task status files)
4. Generate report of changes made

---

## Task-to-WP Mapping (Hardcoded MVP)

The script uses a hardcoded mapping for the MVP phase:

| Task IDs | Work Package | Release |
|----------|--------------|---------|
| T-04, T-49, T-03, T-24 | R1-WP1 | R1 |
| T-05, T-06 | R1-WP2 | R1 |
| T-07, T-08, T-31 | R2-WP1 | R2 |
| T-11, T-33 | R2-WP2 | R2 |
| T-45, T-46 | R2-WP3 | R2 |
| T-21, T-19, T-39 | R3-WP1 | R3 |
| T-32, T-18, T-28 | R3-WP2 | R3 |
| T-09, T-10, T-22 | R4-WP1 | R4 |
| T-37, T-47 | R4-WP2 | R4 |
| T-16 | R4-WP3 | R4 |

**Future**: Extract from `WORK-PLAN v5.md` dynamically.

---

## Progress Calculation Formulas

### Work Package Progress

```bash
WP Progress % = (Σ completed_points / Σ total_complexity) × 100

Example (R1-WP1):
  T-04: 18/18 points (100%)  → 18.00 completed
  T-49: 5.3/8 points (66%)   → 5.30 completed
  T-03: 0/11 points (0%)     → 0.00 completed
  T-24: 0/7 points (0%)      → 0.00 completed

  Total: 23.30 / 44 = 53%
```

### Release Progress

```bash
Release Progress % = Σ(WP_progress × WP_complexity) / Σ WP_complexity × 100

Example (R1):
  R1-WP1: 53% × 36 points = 19.08 points
  R1-WP2: 0% × 28 points = 0.00 points

  Total: 19.08 / (36 + 28) = 30%
```

### Project Progress

```bash
Project Progress % = (Complete Releases + Current Release %) / Total Releases × 100

Example:
  R0: 100% (1 release complete)
  R1: 30% (in progress)
  R2-R6: 0% (not started)

  Total: (1 + 0.30) / 6 = 22%
```

---

## Milestone Detection

**Milestones**: 25%, 50%, 75%, 100% (±2% tolerance)

**Logic**:
```bash
if |progress - milestone| ≤ 2%:
  trigger_cascading_update()
```

**Examples**:
- `23%` → Milestone (25% ±2%)
- `27%` → Milestone (25% ±2%)
- `41%` → NOT milestone (not within ±2% of 25/50/75/100)
- `52%` → Milestone (50% ±2%)

---

## File Update Patterns

### 1. WP Task Matrix Update

**File**: `docs/project-management/progress/R1-WP1-progress.md`

**Pattern**:
```markdown
| Task ID | Status | Progress | Completed Points |
|---------|--------|----------|------------------|
| T-04    | 🟡 In Progress | 85% | 15.3/18 |
```

**Updated to**:
```markdown
| Task ID | Status | Progress | Completed Points |
|---------|--------|----------|------------------|
| T-04    | ✅ Complete | 100% | 18/18 |
```

---

### 2. WP Progress Bar Update

**File**: `docs/project-management/progress/R1-WP1-progress.md`

**Pattern**:
```markdown
**Progress**: [███░░░░░░░] 30%
```

**Updated to**:
```markdown
**Progress**: [█████░░░░░] 53%
```

**Bar generation**: 10 characters, each represents 10%
- `█` = Filled (completed)
- `░` = Empty (remaining)

---

### 3. Release WP Summary Update

**File**: `docs/project-management/status/R1-RELEASE-STATUS.md`

**Pattern**:
```markdown
| R1.WP1 | 36 points | [███░░░░░░░] 30% | 🟡 In Progress |
```

**Updated to**:
```markdown
| R1.WP1 | 36 points | [█████░░░░░] 53% | 🟡 In Progress |
```

---

### 4. Project Summary Update

**File**: `docs/project-management/status/PROJECT-STATUS.md`

**Pattern**:
```markdown
**Completion**: [███░░░░░░░] 30% (T-04 85%, T-49 66%)
```

**Updated to**:
```markdown
**Completion**: [████░░░░░░] 40% (T-04 complete, T-49 66%)
```

---

## Exit Codes

| Code | Meaning | Description |
|------|---------|-------------|
| `0` | Success | Operation completed successfully |
| `1` | Validation Failed | Inconsistencies detected (--validate mode) |
| `2` | File Not Found | Task/WP/Release/Project file missing |
| `3` | Parse Error | YAML parsing or calculation error |

**Usage**:
```bash
bash tools/sync-project-status.sh T-04
if [ $? -eq 0 ]; then
  echo "Status updated successfully"
else
  echo "Update failed with exit code $?"
fi
```

---

## Troubleshooting

### Issue: "Task file not found"

**Error**:
```
❌ Task file not found: docs/tasks/T-XX-STATUS.md
```

**Solution**: Ensure task ID exists and file is named correctly (`T-XX-STATUS.md`).

---

### Issue: "Unknown task ID: no WP mapping"

**Error**:
```
❌ Unknown task ID: T-XX (no WP mapping)
```

**Solution**: Add task mapping in `get_parent_wp_and_release()` function.

---

### Issue: "bc: command not found" (Windows Git Bash)

**Error**:
```
tools/sync-project-status.sh: line 222: bc: command not found
```

**Status**: FIXED - Script now uses `awk` for cross-platform arithmetic.

---

### Issue: Progress shows 0% for in-progress tasks

**Cause**: Task YAML missing `completado` field.

**Solution**: Add `completado` field to task frontmatter:
```yaml
---
complejidad: 8
completado: 5/8 (66%)  # ← Add this line
---
```

---

## Integration with Workflow

### Manual Update Workflow (Current)

```bash
# Step 1: Update task status file
vim docs/tasks/T-04-STATUS.md
# Change: estado: "En Progreso" → "✅ 100% COMPLETADO"
# Update: completado: 15.3/18 (85%) → 18/18 (100%)

# Step 2: Run sync script
bash tools/sync-project-status.sh T-04

# Step 3: Validate changes
git diff docs/project-management/progress/R1-WP1-progress.md
git diff docs/project-management/status/R1-RELEASE-STATUS.md

# Step 4: Commit changes
git add docs/tasks/T-04-STATUS.md
git add docs/project-management/progress/R1-WP1-progress.md
git commit -m "Update T-04 status to 100% complete"
```

---

### Future Automated Workflow

```bash
# Step 1: Update task status file
vim docs/tasks/T-04-STATUS.md

# Step 2: Pre-commit hook auto-runs sync script
git commit -m "Update T-04 status to 100%"
# → Hook detects T-XX-STATUS.md change
# → Runs: bash tools/sync-project-status.sh T-04 --validate
# → If inconsistencies: blocks commit, suggests --fix
# → If consistent: includes updated files in commit
```

---

## Performance Considerations

### Execution Time

**Typical run**: < 2 seconds (for single task)

**Breakdown**:
- YAML parsing: ~100ms
- WP progress calculation: ~200ms (iterates 4 tasks)
- Release progress calculation: ~300ms (iterates 2 WPs, recalculates each)
- File updates (sed): ~500ms (3-4 files)

**Optimization opportunities** (future):
- Cache parsed YAML in session
- Batch file updates (single sed invocation)
- Parallel WP progress calculations

---

### Idempotency

**Safe to run multiple times**:
```bash
# Running twice produces same result
bash tools/sync-project-status.sh T-04
bash tools/sync-project-status.sh T-04
# → No changes on second run (idempotent)
```

**Backups created**: `.backup` files before each edit
```
R1-WP1-progress.md.backup
R1-RELEASE-STATUS.md.backup
PROJECT-STATUS.md.backup
```

---

## Future Enhancements

### Phase 2: Slash Command Integration

**Goal**: Expose via `.claude/commands/sync-project-status.md`

```bash
/sync-project-status T-04           # Auto-propagate
/sync-project-status T-04 --dry-run # Preview
/sync-project-status --validate     # Check consistency
```

**Implementation**: Wrapper command that calls bash script.

---

### Phase 3: Pre-commit Hook Automation

**Goal**: Validate consistency before every commit

**.git/hooks/pre-commit**:
```bash
#!/bin/bash
# Detect T-XX-STATUS.md changes
changed_tasks=$(git diff --cached --name-only | grep 'docs/tasks/T-.*-STATUS.md')

for task_file in $changed_tasks; do
  task_id=$(basename "$task_file" | sed 's/-STATUS.md//')
  bash tools/sync-project-status.sh "$task_id" --validate
  if [ $? -ne 0 ]; then
    echo "❌ Inconsistent status for $task_id"
    echo "Run: bash tools/sync-project-status.sh $task_id --fix"
    exit 1
  fi
done
```

---

### Phase 4: CI/CD Integration

**Goal**: Block merges if status inconsistent

**.github/workflows/status-validation.yml**:
```yaml
name: Status Tracking Validation
on:
  pull_request:
    paths:
      - 'docs/tasks/**.md'
      - 'docs/project-management/**.md'

jobs:
  validate-status:
    runs-on: ubuntu-latest
    steps:
      - name: Validate hierarchy consistency
        run: bash tools/sync-project-status.sh --validate --strict
```

---

## Related Documentation

- **Workflow Guide**: `docs/development/STATUS-TRACKING-UPDATE-WORKFLOW.md`
- **Decision Tree**: Section "When to Update Each Level" in workflow guide
- **Templates**: See workflow guide for Task/WP/Release/Project templates
- **Aggregation Rules**: Section "Aggregation Rules" in workflow guide

---

## Support

**Questions or Issues?**

1. Check this usage guide first
2. Review `docs/development/STATUS-TRACKING-UPDATE-WORKFLOW.md`
3. Run with `--dry-run` to debug
4. Check exit codes for error types
5. Examine `.backup` files if unexpected changes occur

**Script Location**: `tools/sync-project-status.sh`
**Maintainer**: Tech Lead
**Last Updated**: 2025-10-18
