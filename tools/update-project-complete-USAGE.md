# update-project-complete.py Usage Guide

## Overview

`update-project-complete.py` is a comprehensive Python script that automatically updates **ALL sections** in `PROJECT-STATUS.md` when a Release changes status (e.g., In Progress → Complete).

## Architecture

Follows the same pattern as `update-release-complete.py`:

- **ReleaseData**: Release metadata extracted from `R*-RELEASE-STATUS.md` files
- **WPData**: Work Package data for metrics calculation
- **ProjectMetrics**: Project-level aggregated metrics (overall progress, release counts, task counts)
- **ProjectFileParser**: Extracts release/WP/task data from `PROJECT-STATUS.md`
- **ReleaseFileParser**: Parses individual `R*-RELEASE-STATUS.md` files
- **ProjectMetricsCalculator**: Computes project-level metrics from Release data
- **ProjectFileUpdater**: Updates all sections in PROJECT-STATUS.md
- **Idempotent**: Safe to run multiple times, preserves file structure

## Usage

```bash
# Basic usage (update based on release ID)
python3 update-project-complete.py <project_file> <release_id>

# Example: Update after R1 completion
python3 update-project-complete.py docs/project-management/status/PROJECT-STATUS.md R1

# Example: Update after R2 reaches milestone
python3 update-project-complete.py docs/project-management/status/PROJECT-STATUS.md R2
```

## What It Does

### 1. Reads All Release Files
- Scans `docs/project-management/status/R*-RELEASE-STATUS.md`
- Extracts metrics: progress %, complexity, status, completion date
- Calculates project-level aggregates

### 2. Calculates Project Metrics
```
Overall Progress = (Completed Releases / Total Releases) × 100
Example: R0 + R1 complete = 2/6 = 33%

Completed Releases: Count of releases at 100%
In Progress Releases: Count of releases 0% < x < 100%
Not Started Releases: Count of releases at 0%
```

### 3. Updates ALL Sections

#### Summary Dashboard
```markdown
- **Status**: ✅ R1 Complete (33%) | R2 Ready to Start
- **Overall Progress**: [████░░░░░░] 33% (2.0 releases of 6)
- **Current Release**: R1 Complete → R2 Ready to Start
- **Last Updated**: 2025-10-26
```

#### Key Metrics Dashboard
```markdown
| Metric | Target | Current | Trend | Status |
|--------|--------|---------|-------|--------|
| Releases Complete | 6 | 2 | ↑ | 🟢 |
| Total Tasks | 47 | 20 | ↑ | 🟢 |
| Work Packages | 18 | 6 | ↑ | 🟢 |
```

#### Timeline Metrics
```markdown
| Phase | Planned | Actual | Variance | Status |
|-------|---------|--------|----------|--------|
| R0 (Foundation) | 4 weeks | 4 weeks | On Time | ✅ |
| R1 (Backend Evolution) | 2 weeks | 5 weeks | +150% | ✅ |
| R2 (AI Integration) | 2 weeks | Starting | TBD | ⏳ |
```

#### Current Focus
- Changes "Active Release: R1" → "Next Release: R2" when R1 completes
- Updates focus areas for next release
- Adjusts priority areas based on current state

#### Completed Work
- **Moves completed releases** from "In Progress Work" to "Completed Work"
- Adds completion details (duration, complexity, key achievements)
- Preserves original release narrative

#### Planned Work
- Marks next release with "(NEXT)" tag
- Updates start dates based on previous release completion

#### Update History
- Adds new entry with current date
- Records release milestone (e.g., "R1 completion: 100%, T-03+T-24 done, R2 ready")
- Categorizes impact (Major milestone, Progress update, etc.)

## Examples

### Example 1: R1 Completion (100%)

**Command**:
```bash
python3 update-project-complete.py docs/project-management/status/PROJECT-STATUS.md R1
```

**Output**:
```
======================================================================
🚀 Starting COMPREHENSIVE Project update: PROJECT-STATUS.md
📌 Release context: R1
======================================================================

📂 Reading all release status files...
  ✅ Read R0: 0 pts, 100%, ✅ Complete
  ✅ Read R1: 72 pts, 100%, ✅ Complete

📊 Calculated Project Metrics:
  Total releases: 6
  Completed: 2
  In progress: 0
  Not started: 4
  Overall progress: 33%

🔧 Updating Summary Dashboard...
  Status: ... → ✅ R1 Complete (33%) | R2 Ready to Start
  Overall Progress: ... → [████░░░░░░] 33% (2.0 releases of 6)
  Current Release: ... → R1 Complete → R2 Ready to Start

🔧 Moving R1 to Completed Work...
  Removed R1 from In Progress Work
  Added R1 to Completed Work

✅ COMPREHENSIVE PROJECT UPDATE COMPLETE
📊 Overall Progress: 33% (2/6 releases)
📊 Status: ✅ R1 Complete (33%) | R2 Ready to Start
======================================================================
```

**Changes Made**:
- Summary Dashboard: Updated status, progress bar (33%), current release
- Key Metrics: Updated "Releases Complete" (1 → 2), "Total Tasks" (15 → 20)
- Timeline Metrics: R1 marked complete with actual duration (5 weeks)
- Current Focus: Changed "Active Release: R1" → "Next Release: R2"
- Completed Work: Moved R1 entry from In Progress
- Planned Work: Marked R2 as "(NEXT)"
- Update History: Added "R1 completion: 100%, T-03+T-24 done, R2 ready"

### Example 2: R2 In Progress (50%)

**Command**:
```bash
python3 update-project-complete.py docs/project-management/status/PROJECT-STATUS.md R2
```

**Output**:
```
📊 Calculated Project Metrics:
  Total releases: 6
  Completed: 2
  In progress: 1
  Not started: 3
  Overall progress: 41%  # (2 + 0.5) / 6

🔧 Updating Summary Dashboard...
  Status: ... → 🟢 R3 In Progress
  Overall Progress: ... → [████░░░░░░] 41% (2.5 releases of 6)
```

**Changes Made**:
- Summary Dashboard: Status shows "R3 In Progress"
- Overall Progress: 41% (includes 50% of R2)
- Current Focus: "Active Release: R3" (remains)
- No movement between sections (R2 still in progress)

## Integration with Workflow

### sync-project-status.sh Integration

The bash script `tools/sync-project-status.sh` calls `update-project-complete.py` automatically:

```bash
# After updating Release file
python3 tools/update-release-complete.py R1-RELEASE-STATUS.md R1-WP1

# Then update Project file
python3 tools/update-project-complete.py PROJECT-STATUS.md R1
```

### Manual Workflow

**Step 1**: Release reaches milestone or completes
```bash
# R1 reaches 100% completion
vim docs/project-management/status/R1-RELEASE-STATUS.md
# Update: Progress 100%, Status "Complete", Completion Date
```

**Step 2**: Update Release file programmatically (optional)
```bash
python3 tools/update-release-complete.py docs/project-management/status/R1-RELEASE-STATUS.md R1-WP2
```

**Step 3**: Update Project file
```bash
python3 tools/update-project-complete.py docs/project-management/status/PROJECT-STATUS.md R1
```

**Step 4**: Commit changes
```bash
git add docs/project-management/status/
git commit -m "docs(R1): Complete R1 release, update project status to 33%"
```

## Validation

**Post-Update Checks**:
```bash
# 1. Verify PROJECT-STATUS.md updated correctly
head -20 docs/project-management/status/PROJECT-STATUS.md

# 2. Check git diff
git diff docs/project-management/status/PROJECT-STATUS.md

# 3. Validate consistency
yarn docs:validate:strict

# 4. Run quality gate
yarn qa:gate:dev
```

## Error Handling

**Common Errors**:

1. **File Not Found**
   ```
   ❌ Project file not found: PROJECT-STATUS.md
   ```
   **Fix**: Ensure correct path (must be absolute or relative from project root)

2. **No Release Files Found**
   ```
   ❌ No release files found
   ```
   **Fix**: Ensure `R*-RELEASE-STATUS.md` files exist in `docs/project-management/status/`

3. **Invalid Release Data**
   ```
   ⚠️  Error parsing R1-RELEASE-STATUS.md: ...
   ```
   **Fix**: Check release file format (Progress line, Status line, Completion Date)

## Idempotency Guarantees

The script is **idempotent** - running multiple times produces same result:

```bash
# Run once
python3 update-project-complete.py PROJECT-STATUS.md R1

# Run again (no changes)
python3 update-project-complete.py PROJECT-STATUS.md R1

# Output: "Status: ... → ..." (same values)
```

**Features**:
- ✅ Detects existing history entries for today's date (updates instead of duplicating)
- ✅ Preserves file structure (no duplicate status indicators)
- ✅ Robust parsing (handles format variations)
- ✅ Clear logging (shows before/after values)

## Performance

**Typical Execution Time**: <1 second

```
Reading all release files: ~50ms
Calculating metrics: ~10ms
Updating sections: ~100ms
Writing file: ~50ms
Total: ~210ms
```

## Cross-Platform Support

**Supported Platforms**:
- ✅ Windows (Git Bash, WSL2)
- ✅ Linux (Ubuntu, Debian, etc.)
- ✅ macOS

**Python Requirements**:
- Python 3.8+ (uses dataclasses, pathlib, typing)
- No external dependencies (only stdlib)

## Limitations

1. **Manual Release File Creation**: Script doesn't create new release files, only reads them
2. **Fixed Total Counts**: Total releases (6), total tasks (47) hardcoded (can be parameterized)
3. **No Task Detail Parsing**: Task count estimated from releases, not parsed from task files
4. **English + Spanish Mixed**: Handles bilingual content but doesn't translate

## Future Enhancements

**Potential Improvements**:
1. **Dynamic Total Calculation**: Read total releases/tasks from WORK-PLAN.md
2. **Task Detail Parsing**: Read individual T-XX-STATUS.md files for accurate task counts
3. **WP Detail Parsing**: Read R*-WP*-progress.md files for accurate WP counts
4. **Dry-Run Mode**: `--dry-run` flag to preview changes without writing
5. **Validate Mode**: `--validate` flag to check consistency across files
6. **JSON Output**: `--json` flag for programmatic consumption

## Troubleshooting

**Q: Script shows wrong release count**
**A**: Check that all R*-RELEASE-STATUS.md files have correct progress % and status

**Q: Overall progress doesn't match expected**
**A**: Progress = (Completed Releases / Total Releases) × 100. Verify completed count.

**Q: Release not moved to Completed Work**
**A**: Ensure release progress = 100% and status contains "✅" or "Complete"

**Q: History entry duplicated**
**A**: Script should detect existing entries for today's date. Check date format (YYYY-MM-DD).

## Related Scripts

- **update-release-complete.py**: Updates R*-RELEASE-STATUS.md files
- **update-wp-complete.py**: Updates R*-WP*-progress.md files (if exists)
- **sync-project-status.sh**: Orchestrates all updates (bash wrapper)

## References

- **Pattern Source**: `tools/update-release-complete.py` (same architecture)
- **Status Tracking Workflow**: `docs/development/STATUS-TRACKING-UPDATE-WORKFLOW.md`
- **Project Status Template**: `docs/project-management/status/PROJECT-STATUS.md`
- **Release Status Template**: `docs/project-management/status/R1-RELEASE-STATUS.md`

---

**Version**: 1.0
**Last Updated**: 2025-10-26
**Maintained By**: Tech Lead
**Status**: Production Ready
