# Sync Project Status - Deterministic Status Hierarchy Propagation

---
description: Synchronize project status tracking hierarchy from task to project level
argument-hint: "[task-id] [--dry-run] [--validate] [--fix]"
allowed-tools: Read, Edit, Bash(bash tools/*), Bash(powershell -ExecutionPolicy Bypass tools/*), Grep, Glob
model: claude-3-5-sonnet-20241022
tier: 1
---

## Purpose

Automate the deterministic propagation of status updates from task level through Work Package and Release to Project Status, implementing the workflow defined in `docs/development/STATUS-TRACKING-UPDATE-WORKFLOW.md`.

**Key Benefits**:
- **Minimal cognitive load**: Developers update only task status, system handles propagation
- **Consistency enforcement**: Ensures all hierarchy levels remain synchronized
- **Deterministic rules**: Clear, unambiguous update triggers at each level
- **Quality validation**: Automatic cross-reference and metric validation

## Usage

```bash
/sync-project-status T-04                    # Auto-propagate after updating T-04-STATUS.md
/sync-project-status T-04 --dry-run          # Preview changes without applying
/sync-project-status --validate              # Validate hierarchy consistency only
/sync-project-status --validate --fix        # Auto-fix detected inconsistencies
```

## Context (auto-collected)

- Current branch: !`git branch --show-current`
- Task status file: !`echo "docs/tasks/$TASK_ID-STATUS.md"`
- Recent status updates: !`git log --oneline --grep="status\|STATUS\|Update T-" -5`
- Project status: !`bash tools/progress-dashboard.sh --brief`

## Arguments & Flags

### Required Argument
- **TASK_ID**: Task identifier in format `T-XX` (e.g., T-04, T-49)
  - Auto-detected from `$ARGUMENTS[0]` if matches `T-\d+` pattern
  - If not provided and `--validate` flag present, validates entire hierarchy

### Optional Flags
- **--dry-run**: Preview changes without writing files
  - Shows what WOULD be updated at each level
  - Prints diff preview for each affected file
  - No files are modified

- **--validate**: Validate hierarchy consistency only
  - Checks all 4 levels for consistency
  - Reports discrepancies (task vs WP vs release vs project)
  - Does not propagate updates

- **--fix**: Auto-fix inconsistencies (requires --validate)
  - Applies corrections to misaligned metrics
  - Recalculates all percentages from task data
  - Creates corrective commits

## Implementation Workflow

### Phase 1: Context Resolution & Validation

**Parse arguments and resolve task context:**

```bash
# 1. Extract TASK_ID from $ARGUMENTS
TASK_ID=$(echo "$ARGUMENTS" | grep -oP 'T-\d+' | head -1)
DRY_RUN=$(echo "$ARGUMENTS" | grep -q '\-\-dry-run' && echo "true" || echo "false")
VALIDATE_ONLY=$(echo "$ARGUMENTS" | grep -q '\-\-validate' && echo "true" || echo "false")
FIX_MODE=$(echo "$ARGUMENTS" | grep -q '\-\-fix' && echo "true" || echo "false")

# 2. Validate task file exists
TASK_FILE="docs/tasks/${TASK_ID}-STATUS.md"
if [[ ! -f "$TASK_FILE" ]]; then
  echo "❌ Error: Task file not found: $TASK_FILE"
  exit 1
fi

# 3. Read task status metadata
```

**Use Read tool to extract task YAML frontmatter:**

> Read the task status file at `docs/tasks/${TASK_ID}-STATUS.md` and extract YAML frontmatter fields: `task_id`, `estado`, `completado`, `complejidad`, `ultimo_update`, `release_target`

**Parse parent relationships:**

```bash
# Extract parent WP and Release from release_target field
# Format: "Release N" → R#
# Then resolve WP from task-to-WP mapping or directory structure
```

### Phase 2: Task → Work Package Aggregation

**Decision: Update Work Package on ANY task status change**

**Implementation:**

> Use the Read tool to load the current Work Package progress file at `docs/project-management/progress/R#-WP#-progress.md`

**Calculate WP metrics from task data:**

```python
# Pseudo-code for calculation logic
def calculate_wp_progress(tasks_data):
    """
    Calculate Work Package progress from task completion data.

    Args:
        tasks_data: List of {task_id, complejidad, completado_points, status}

    Returns:
        wp_progress_percent: Percentage (0-100)
        total_completed: Complexity points completed
        total_complexity: Total WP complexity points
    """
    total_complexity = sum(task['complejidad'] for task in tasks_data)
    total_completed = sum(task['completado_points'] for task in tasks_data)

    wp_progress_percent = (total_completed / total_complexity) * 100

    return wp_progress_percent, total_completed, total_complexity

# Example:
# T-04: 18/18 (100%) = 18 points
# T-49: 5.3/8 (66%) = 5.3 points
# T-03: 0/11 (0%) = 0 points
# T-24: 0/7 (0%) = 0 points
# WP Progress = (18 + 5.3) / (18 + 8 + 11 + 7) = 23.3 / 44 = 53%
```

**Update Work Package sections using Edit tool:**

1. **Update Task Completion Matrix Table**:
   ```markdown
   | Task ID | Status | Progress | Completed Points |
   |---------|--------|----------|------------------|
   | T-04    | ✅ Complete | 100% | 18/18 |  ← UPDATE
   ```

2. **Update Complexity Progress Visualization**:
   ```markdown
   ## Summary Dashboard
   - **Progress**: [█████░░░░░] 53% (1.3/4 tasks + emergent)  ← RECALCULATE
   - **Complexity**: 23.3/44 points completed  ← RECALCULATE
   ```

3. **Update Velocity Tracking**:
   ```markdown
   ### Velocity Tracking
   - **Week 4 (Oct 16 - Oct 17)**: +18 complexity points (T-04 complete)  ← ADD ENTRY
   - **Total Delivery**: 23.3 complexity points in 3+ weeks  ← UPDATE
   ```

4. **Move task between sections** (if status changed):
   - **Not Started → In Progress**: Move from "Planned Work Details" to "In Progress Work Details"
   - **In Progress → Complete**: Move from "In Progress Work Details" to "Completed Work Details"

**Milestone detection:**

```python
def is_wp_milestone(wp_progress_percent):
    """Check if WP reached milestone (25%, 50%, 75%, 100%)"""
    milestones = [25, 50, 75, 100]
    # Tolerance: ±2% to handle rounding
    for milestone in milestones:
        if abs(wp_progress_percent - milestone) <= 2:
            return True, milestone
    return False, None

# If milestone reached → Proceed to Phase 3 (Release update)
# Otherwise → STOP (only WP updated)
```

### Phase 3: Work Package → Release Aggregation

**Trigger: Update Release on WP milestones (25%, 50%, 75%, 100%)**

**Implementation:**

> Use the Read tool to load the current Release status file at `docs/project-management/status/R#-RELEASE-STATUS.md`

**Calculate Release metrics from WP data:**

```python
def calculate_release_progress(work_packages_data):
    """
    Calculate Release progress from Work Package completion data.

    Args:
        work_packages_data: List of {wp_id, complexity, progress_percent}

    Returns:
        release_progress_percent: Weighted average progress
    """
    total_weighted_progress = 0
    total_complexity = 0

    for wp in work_packages_data:
        # Weighted progress = WP progress % × WP complexity
        weighted_progress = (wp['progress_percent'] / 100) * wp['complexity']
        total_weighted_progress += weighted_progress
        total_complexity += wp['complexity']

    release_progress_percent = (total_weighted_progress / total_complexity) * 100

    return release_progress_percent

# Example:
# R1.WP1: 53% × 36 points = 19.08 points
# R1.WP2: 0% × 28 points = 0 points
# Release Progress = 19.08 / (36 + 28) = 19.08 / 64 = 30%
```

**Update Release Status sections using Edit tool:**

1. **Update WP Summary Table**:
   ```markdown
   | Package | Complexity | Progress | Status | Key Tasks |
   |---------|------------|----------|--------|-----------|
   | R1.WP1  | 36 points  | [█████░░░░░] 53% | 🟡 In Progress | T-04 ✅ |  ← UPDATE
   ```

2. **Update Release Progress Dashboard**:
   ```markdown
   ## Summary Dashboard
   - **Progress**: [███░░░░░░░] 30%  ← RECALCULATE
   ```

3. **Update Current Focus Section**:
   ```markdown
   ## Current Focus
   - **Active Work**: T-49 ST2 (66% complete)  ← UPDATE from WP data
   - **Next Up**: T-05 Planner Service  ← UPDATE from WP planned section
   ```

**Release status change detection:**

```python
def detect_release_status_change(old_status, new_progress):
    """Detect if release status changed based on progress"""
    if new_progress == 0:
        return "Planning", False
    elif 0 < new_progress < 100:
        new_status = "In Progress"
    else:  # new_progress == 100
        new_status = "Complete"

    status_changed = (old_status != new_status)
    return new_status, status_changed

# If status changed → Proceed to Phase 4 (Project update)
# Otherwise → STOP (only WP + Release updated)
```

### Phase 4: Release → Project Status Aggregation

**Trigger: Update Project Status on release status changes**

**Implementation:**

> Use the Read tool to load the current Project Status file at `docs/project-management/status/PROJECT-STATUS.md`

**Calculate Project metrics from Release data:**

```python
def calculate_project_progress(releases_data):
    """
    Calculate overall project progress from Release completion data.

    Args:
        releases_data: List of {release_id, status, progress_percent}
        Total releases: 6 (R0-R5)

    Returns:
        project_progress_percent: Overall progress
    """
    total_releases = 6
    completed_releases = sum(1 for r in releases_data if r['status'] == 'Complete')

    # Find in-progress release
    in_progress_release = next((r for r in releases_data if r['status'] == 'In Progress'), None)
    in_progress_contribution = 0
    if in_progress_release:
        in_progress_contribution = in_progress_release['progress_percent'] / 100

    project_progress = ((completed_releases + in_progress_contribution) / total_releases) * 100

    return project_progress

# Example:
# R0: Complete (100%) = 1 release
# R1: In Progress (30%) = 0.3 release
# R2-R5: Not Started (0%) = 0 releases
# Project Progress = (1 + 0.3) / 6 = 21.7%
```

**Update Project Status sections using Edit tool:**

1. **Update Summary Dashboard**:
   ```markdown
   ## Summary Dashboard
   - **Status**: 🟢 R1 Backend Evolution Active  ← UPDATE
   - **Overall Progress**: [██░░░░░░░░] 22% (1/6 releases complete)  ← RECALCULATE
   - **Current Release**: R1 In Progress  ← UPDATE
   ```

2. **Update Active Release Summary**:
   ```markdown
   ### Active Release: R1 - Backend Architecture Evolution
   - **Completion**: [███░░░░░░░] 30% (T-04 complete, T-49 66%)  ← UPDATE
   ```

3. **Move releases between sections** (if status changed):
   - **In Progress → Complete**: Move from "In Progress Work" to "Completed Work"
   - **Planning → In Progress**: Add to "Current Focus" section

### Phase 5: Dry-Run Mode Output

**If --dry-run flag is set, print preview instead of applying edits:**

```markdown
✅ Task T-04: 100% complete (18/18 points)
  ↳ Would aggregate to R1-WP1-progress.md...
    - Task Completion Matrix: T-04 | ✅ Complete | 100% | 18/18
    - WP Progress: 40% → 53% (23.3/44 points)
    - Velocity: Week 4: +18 complexity points
  ✅ WP milestone reached (50%), would aggregate to R1-RELEASE-STATUS.md...
    - WP Summary Table: R1.WP1 | 53% | 🟡 In Progress
    - Release Progress: 25% → 30%
  ❌ Release status unchanged (In Progress → In Progress), PROJECT-STATUS.md not updated

📊 Preview Summary:
- Files to update: 2 (R1-WP1-progress.md, R1-RELEASE-STATUS.md)
- WP progress: 40% → 53% (+13%)
- Release progress: 25% → 30% (+5%)
- Project progress: No change (21.7%)

To apply changes, run: /sync-project-status T-04 (without --dry-run)
```

### Phase 6: Validation Mode

**If --validate flag is set, check consistency across all levels:**

```python
def validate_hierarchy_consistency(task_id):
    """Validate consistency across Task → WP → Release → Project"""
    issues = []

    # 1. Read all 4 levels
    task_data = read_task_status(task_id)
    wp_data = read_wp_progress(task_data['parent_wp'])
    release_data = read_release_status(task_data['parent_release'])
    project_data = read_project_status()

    # 2. Check Task ↔ WP consistency
    wp_task_row = find_task_in_wp(wp_data, task_id)
    if wp_task_row['status'] != task_data['estado']:
        issues.append(f"❌ T-{task_id}: WP shows {wp_task_row['status']}, Task shows {task_data['estado']}")
    if wp_task_row['progress'] != task_data['progreso']:
        issues.append(f"❌ T-{task_id}: WP shows {wp_task_row['progress']}%, Task shows {task_data['progreso']}%")

    # 3. Check WP ↔ Release consistency
    release_wp_row = find_wp_in_release(release_data, task_data['parent_wp'])
    if release_wp_row['progress'] != wp_data['progress']:
        issues.append(f"❌ WP {task_data['parent_wp']}: Release shows {release_wp_row['progress']}%, WP shows {wp_data['progress']}%")

    # 4. Check Release ↔ Project consistency
    project_release_summary = find_release_in_project(project_data, task_data['parent_release'])
    if project_release_summary['progress'] != release_data['progress']:
        issues.append(f"❌ Release {task_data['parent_release']}: Project shows {project_release_summary['progress']}%, Release shows {release_data['progress']}%")

    # 5. Report results
    if not issues:
        print("✅ Hierarchy is consistent across all 4 levels")
        return True
    else:
        print(f"❌ Found {len(issues)} inconsistencies:")
        for issue in issues:
            print(f"  {issue}")
        return False
```

**If --fix flag is set, apply corrections:**

```bash
# Recalculate from source of truth (task files) upward
# Use Edit tool to correct misaligned metrics
# Generate corrective commit with detailed message
```

## Example Output

### Successful Propagation

```
🔄 Syncing project status for T-04...

✅ Phase 1: Task Status
  - File: docs/tasks/T-04-STATUS.md
  - Status: ✅ 100% COMPLETADO
  - Completion: 18/18 complexity points
  - Parent WP: R1-WP1
  - Parent Release: R1

✅ Phase 2: Work Package Aggregation
  - File: docs/project-management/progress/R1-WP1-progress.md
  - Updates:
    ✓ Task Completion Matrix: T-04 | ✅ Complete | 100% | 18/18
    ✓ WP Progress: 40% → 53% (23.3/44 points completed)
    ✓ Velocity: Week 4: +18 complexity points (T-04 complete)
    ✓ Moved T-04 to "Completed Work Details" section
  - Milestone: 50% reached ✅ (triggers release update)

✅ Phase 3: Release Aggregation
  - File: docs/project-management/status/R1-RELEASE-STATUS.md
  - Updates:
    ✓ WP Summary Table: R1.WP1 | 53% | 🟡 In Progress
    ✓ Release Progress: 25% → 30%
    ✓ Current Focus: Updated active work from WP data
  - Status: In Progress → In Progress (no change, skip project update)

⏭️  Phase 4: Project Status
  - Skipped (release status unchanged)

📊 Summary:
- Files updated: 2 (WP, Release)
- WP progress: 40% → 53% (+13%)
- Release progress: 25% → 30% (+5%)
- Project progress: No change (21.7%)

✅ Status hierarchy synchronized successfully!
```

### Validation Mode

```
🔍 Validating status hierarchy consistency...

✅ T-04-STATUS.md: 100% complete (18/18 points)
✅ R1-WP1-progress.md: T-04 marked complete, 53% WP progress
❌ R1-RELEASE-STATUS.md: T-04 still shows 85% (INCONSISTENT)
✅ PROJECT-STATUS.md: R1 shows 21.7% (consistent with release)

❌ Found 1 inconsistency:
  - T-04: Release shows 85%, Task shows 100%

💡 Recommendation: Run /sync-project-status T-04 --fix
```

## Error Handling

### Error Scenarios & Recovery

1. **Task file not found**:
   ```
   ❌ Error: Task file not found: docs/tasks/T-XX-STATUS.md

   Possible causes:
   - Task ID typo (check format: T-04, not T4 or T-004)
   - Task file not yet created
   - Incorrect working directory

   Recovery: Verify task exists with: ls docs/tasks/T-*-STATUS.md
   ```

2. **Invalid task ID format**:
   ```
   ❌ Error: Invalid task ID format: "T04" (expected: T-XX)

   Usage: /sync-project-status T-04
   ```

3. **Parent WP/Release not found**:
   ```
   ❌ Error: Parent Work Package not found: R1-WP1-progress.md

   Task T-04 references Release 1, but R1-WP1-progress.md does not exist.

   Recovery: Create work package progress file using template at:
   docs/development/STATUS-TRACKING-TEMPLATES.md
   ```

4. **Inconsistent metrics detected**:
   ```
   ⚠️  Warning: Metric inconsistency detected

   Task T-04: 100% (18/18 points)
   WP R1-WP1 calculation: 53% (23.3/44 points)
   BUT WP file shows: 40% (18/44 points)  ← STALE

   Run with --fix flag to auto-correct: /sync-project-status T-04 --fix
   ```

5. **Dry-run mode differences**:
   ```
   🔍 Dry-run detected 3 changes:

   1. R1-WP1-progress.md: WP progress 40% → 53%
   2. R1-WP1-progress.md: Task matrix T-04 status → ✅ Complete
   3. R1-RELEASE-STATUS.md: Release progress 25% → 30%

   To apply, run: /sync-project-status T-04
   ```

## Validation & Quality Checks

### Post-Update Validation

After successful propagation, ALWAYS validate:

```bash
# 1. Cross-reference consistency
/sync-project-status T-04 --validate

# 2. Document placement validation
bash tools/validate-document-placement.sh

# 3. Strict documentation validation (CI/CD mode)
yarn docs:validate:strict

# 4. If CLAUDE.md touched (should not be)
bash tools/validate-claude-md.sh
```

### Consistency Checks (Automated)

**Automated checks performed during sync:**

- [ ] **Task Status**: Estado matches subtask completion percentage
- [ ] **WP Progress**: Complexity points add up correctly across all tasks
- [ ] **WP Progress %**: Calculated from actual completed points, not estimated
- [ ] **Release Progress**: WP percentages accurately reflected in release weighted average
- [ ] **Project Progress**: Release status correctly reflected in project summary
- [ ] **Tables Updated**: All task completion matrices updated at every level
- [ ] **Narratives Updated**: Completed/In Progress sections match tables
- [ ] **Dates Consistent**: Completion dates match across all hierarchy levels
- [ ] **Metrics Aligned**: Progress bars match calculated percentages (±2% tolerance)

### Metric Calculation Accuracy

**Validation formulas (reference):**

```python
# Work Package Progress
wp_progress = (sum(completed_points) / sum(total_complexity)) * 100

# Release Progress (weighted average)
release_progress = (sum(wp_progress * wp_complexity) / sum(wp_complexity)) * 100

# Project Progress
project_progress = ((completed_releases + in_progress_fraction) / total_releases) * 100
```

## Integration Points

### Cross-Command Integration

**Automatic invocation by other commands:**

- **`/task-dev T-XX complete`**: Triggers `/sync-project-status T-XX` automatically after DoD validation
- **`/commit-smart`**: Suggests running sync if T-XX-STATUS.md modified
- **`/docs-update`**: Delegates to this command for status hierarchy updates

**Pre-commit hooks (Future):**

```bash
# .git/hooks/pre-commit (Phase 3 automation)
# Automatically detects T-XX-STATUS.md changes and runs validation
if git diff --cached --name-only | grep -q 'docs/tasks/T-.*-STATUS.md'; then
  /sync-project-status --validate || exit 1
fi
```

### Quality Gate Integration

**Integrates with existing validation:**

- **`yarn docs:validate:strict`**: Ensures updated markdown is valid
- **`tools/validate-document-placement.sh`**: Verifies file placement compliance
- **`tools/progress-dashboard.sh`**: Uses synchronized data for dashboard

## Cross-References

### Documentation Standards
- **Workflow Guide**: [docs/development/STATUS-TRACKING-UPDATE-WORKFLOW.md](../../docs/development/STATUS-TRACKING-UPDATE-WORKFLOW.md)
- **Templates**: [docs/development/STATUS-TRACKING-TEMPLATES.md](../../docs/development/STATUS-TRACKING-TEMPLATES.md)
- **Placement Guidelines**: [docs/templates/DOCUMENTATION-PLACEMENT-GUIDELINES.md](../../docs/templates/DOCUMENTATION-PLACEMENT-GUIDELINES.md)

### Example Files
- **Task Status Example**: [docs/tasks/T-04-STATUS.md](../../docs/tasks/T-04-STATUS.md)
- **Work Package Example**: [docs/project-management/progress/R1-WP1-progress.md](../../docs/project-management/progress/R1-WP1-progress.md)
- **Release Status Example**: [docs/project-management/status/R1-RELEASE-STATUS.md](../../docs/project-management/status/R1-RELEASE-STATUS.md)
- **Project Status**: [docs/project-management/status/PROJECT-STATUS.md](../../docs/project-management/status/PROJECT-STATUS.md)

### Related Commands
- **`/task-dev`**: Task development with automatic sync on completion
- **`/commit-smart`**: Intelligent commits with status awareness
- **`/docs-update`**: Documentation maintenance and traceability
- **`/health-check`**: System diagnostics including status consistency

## Future Enhancements

### Phase 2: Current Implementation (Manual Orchestration)
- ✅ Slash command with deterministic logic
- ✅ YAML frontmatter parsing from task files
- ✅ Metric calculations using defined formulas
- ✅ Edit tool for precise markdown updates
- ✅ Dry-run preview mode
- ✅ Validation and consistency checks

### Phase 3: Pre-commit Hooks (Q1 2026)
- [ ] Git hook integration for automatic validation
- [ ] Block commits if hierarchy inconsistent
- [ ] Automatic fix suggestions on commit

### Phase 4: CI/CD Integration (Q2 2026)
- [ ] GitHub Actions workflow for status validation
- [ ] Block PR merges if status hierarchy broken
- [ ] Automated status reporting in PR comments

---

**Version**: 1.0
**Created**: 2025-10-18
**Tier**: 1 (Daily Workflow Command)
**Automation Phase**: Phase 2 (Manual Orchestration with Slash Command)
**Future Automation**: Phase 3 (Pre-commit Hooks) - Q1 2026
