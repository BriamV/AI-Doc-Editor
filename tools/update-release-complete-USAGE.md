# update-release-complete.py - Usage Guide

**Purpose**: Comprehensive Release status file updater that maintains consistency across all sections in `R*-RELEASE-STATUS.md` files.

**Architecture**: Follows the same pattern as `update-wp-complete.py` with parsing, calculation, and update phases.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [What Gets Updated](#what-gets-updated)
- [Input/Output Behavior](#inputoutput-behavior)
- [Usage Examples](#usage-examples)
- [Integration with sync-project-status](#integration-with-sync-project-status)
- [Error Handling](#error-handling)
- [Development Notes](#development-notes)

---

## Quick Start

```bash
# Basic usage (update release status after WP milestone)
python update-release-complete.py docs/project-management/status/R1-RELEASE-STATUS.md R1-WP1

# Without WP context (generic update)
python update-release-complete.py docs/project-management/status/R1-RELEASE-STATUS.md

# Example: R1-WP1 completes (100%), update R1 release status
python update-release-complete.py docs/project-management/status/R1-RELEASE-STATUS.md R1-WP1
```

---

## Architecture Overview

### Three-Phase Design Pattern

```
┌────────────────────────────────────────────────────────────┐
│ Phase 1: PARSING (ReleaseFileParser)                       │
│ - Extract WP Summary table from Release file              │
│ - Extract Task Completion Matrix                          │
│ - Read WP progress files for fresh data                   │
│ - Merge parsed + fresh data (prefer fresh)                │
└────────────────────────────────────────────────────────────┘
                           ↓
┌────────────────────────────────────────────────────────────┐
│ Phase 2: CALCULATION (ReleaseMetricsCalculator)            │
│ - Calculate total/completed/in-progress complexity        │
│ - Count completed/in-progress/not-started WPs             │
│ - Calculate release progress % (complexity-weighted)      │
│ - Generate status text (✅ Complete, 🟡 In Progress, etc.) │
└────────────────────────────────────────────────────────────┘
                           ↓
┌────────────────────────────────────────────────────────────┐
│ Phase 3: UPDATE (ReleaseFileUpdater)                       │
│ - Summary Dashboard (status, progress bar, dates)         │
│ - Success Criteria (checkboxes)                           │
│ - Key Deliverables (Delivered/In Progress/Deferred)       │
│ - Work Package Summary table                              │
│ - Task Completion Matrix                                  │
│ - Current Focus (change to "Release Complete" if 100%)    │
│ - Completed Work (verify tasks documented)                │
│ - Update History (add new entry)                          │
│ - Cleanup (remove duplicate status indicators)            │
└────────────────────────────────────────────────────────────┘
```

### Data Classes

```python
@dataclass
class WPData:
    """Work Package data from WP Summary table or WP progress files"""
    wp_id: str           # e.g., "R1.WP1"
    complexity: int      # e.g., 44
    progress: int        # e.g., 100 (percentage)
    status: str          # e.g., "✅ Complete"
    completed_date: str  # e.g., "2025-10-26"

@dataclass
class TaskData:
    """Task data from Task Completion Matrix"""
    task_id: str         # e.g., "T-04"
    title: str           # e.g., "RAG Pipeline"
    complexity: int      # e.g., 18
    status: str          # e.g., "✅ Complete"
    progress: int        # e.g., 100
    owner: str           # e.g., "Backend"
    completed_date: str  # e.g., "2025-10-17"

@dataclass
class ReleaseMetrics:
    """Calculated release-level metrics"""
    total_complexity: int
    completed_points: float
    in_progress_points: float
    remaining_points: float
    deferred_points: float
    release_progress: int       # Weighted by complexity
    completed_wps: int
    in_progress_wps: int
    not_started_wps: int
    total_wps: int
    completed_tasks: int
    total_tasks: int
```

---

## What Gets Updated

### 1. Summary Dashboard (Lines 3-10)

**Before**:
```markdown
- **Status**: 🟡 87% Complete (Core objectives met)
- **Progress**: [████████░░] 87% (59/68 points)
- **Last Updated**: 2025-10-24
```

**After** (R1-WP1 completes):
```markdown
- **Status**: ✅ 100% Complete (ALL objectives met)
- **Progress**: [██████████] 100% (72/72 points)
- **Last Updated**: 2025-10-26
- **Completion Date**: 2025-10-26
```

**Calculation**:
```
Release Progress = (Σ WP completed points) / (Σ WP total complexity) × 100

Example:
- R1.WP1: 44/44 points (100%)
- R1.WP2: 28/28 points (100%)
Release Progress = (44 + 28) / (44 + 28) = 72/72 = 100%
```

---

### 2. Success Criteria (Checkboxes)

**Before**:
```markdown
- [~] **RAG Pipeline**: Complete document ingestion (T-04) 🟡
- [ ] **Usage Limits**: Rate limiting and ingestion controls (T-03)
```

**After**:
```markdown
- [x] **RAG Pipeline**: Complete document ingestion (T-04) ✅
- [x] **Usage Limits**: Rate limiting and ingestion controls (T-03) ✅
```

**Mapping**:
- Task complete → `[x]` + ✅
- Task in progress → `[~]` + 🟡
- Task deferred → `[~]` + 🔵
- Task not started → `[ ]`

---

### 3. Key Deliverables (Section Organization)

**Before**:
```markdown
**Delivered** ✅
- **T-04**: RAG Pipeline (18 points) - Complete

**In Progress** 🟡
- **T-03**: Usage Limits (11 points) - 45% complete

**Deferred to R2** 🔵
- **T-24**: Consent Management (7 points) - Deferred
```

**After** (T-03 completes):
```markdown
**Delivered** ✅ (ALL TASKS COMPLETE)
- **T-04**: RAG Pipeline (18 points) - Complete
- **T-03**: Usage Limits (11 points) - Complete

**In Progress** 🟡
(None - all tasks complete)

**Deferred to R2** 🔵
(None - all tasks delivered in R1)
```

---

### 4. Work Package Summary Table

**Before**:
```markdown
| Package | Complexity | Progress | Status | Completion Date |
|---------|------------|----------|--------|-----------------|
| R1.WP1: Flujo de Ingesta | 44 points | [████████░░] 87% | 🟡 In Progress | - |
| R1.WP2: Generation Pipeline | 28 points | [██████████] 100% | ✅ Complete | 2025-10-21 |
| **Total R1** | **72 points** | **[████████░░] 87%** | **🟡 In Progress** | **TBD** |
```

**After** (R1-WP1 completes):
```markdown
| Package | Complexity | Progress | Status | Completion Date |
|---------|------------|----------|--------|-----------------|
| R1.WP1: Flujo de Ingesta | 44 points | [██████████] 100% | ✅ Complete | 2025-10-26 |
| R1.WP2: Generation Pipeline | 28 points | [██████████] 100% | ✅ Complete | 2025-10-21 |
| **Total R1** | **72 points** | **[██████████] 100%** | **✅ Complete** | **2025-10-26** |
```

**Data Source**:
- Reads WP progress files directly: `docs/project-management/progress/R1-WP*.md`
- Extracts: `- **Progress**: [██████████] 100% (44/44 points)`
- Prefers fresh data from files over stale Release file data

---

### 5. Task Completion Matrix

**Before**:
```markdown
| Task ID | Title | Complexity | Status | Progress | Owner | Completed |
|---------|-------|------------|--------|----------|-------|-----------|
| T-04 | RAG Pipeline | 18 | ✅ Complete | 100% | Backend | 2025-10-17 |
| T-03 | Usage Limits | 11 | 🟡 In Progress | 45% | Backend | - |
```

**After**:
```markdown
| Task ID | Title | Complexity | Status | Progress | Owner | Completed |
|---------|-------|------------|--------|----------|-------|-----------|
| T-04 | RAG Pipeline | 18 | ✅ Complete | 100% | Backend | 2025-10-17 |
| T-03 | Usage Limits | 11 | ✅ Complete | 100% | Backend | 2025-10-24 |
```

---

### 6. Current Focus → Release Complete

**Before** (Release in progress):
```markdown
## Current Focus

### Priority Areas
1. **R1 Closure Decision** - Complete T-03 (+3-4 days) OR Close at 87%
2. **R2 Transition** - Editor UI ready to start
```

**After** (Release 100% complete):
```markdown
## Release Complete ✅

### R1 Achievements (5 weeks, 72 complexity points)
1. **Complete Document Ingestion Pipeline** (T-04 + T-49)
2. **AI Generation Pipeline** (T-05 + T-06)
3. **Usage Controls** (T-03)
4. **GDPR Compliance** (T-24)
```

**Behavior**: Section header changes from "Current Focus" to "Release Complete ✅" when `release_progress == 100%`.

---

### 7. Update History (New Entry)

**Before**:
```markdown
| Date | Author | Changes | Impact |
|------|--------|---------|--------|
| 2025-10-24 | Tech Lead | T-03 completion (11 pts), R1 at 87% | R1 near complete |
```

**After** (R1-WP1 completes):
```markdown
| Date | Author | Changes | Impact |
|------|--------|---------|--------|
| 2025-10-26 | Tech Lead | R1 completion: R1-WP1+WP2 100%, R1 COMPLETE | Major milestone |
| 2025-10-24 | Tech Lead | T-03 completion (11 pts), R1 at 87% | R1 near complete |
```

**Behavior**:
- Idempotent: Updates existing entry if date matches
- Inserts new entry if date is new
- Uses WP context if provided: `{wp_id} milestone update`
- Uses release completion if 100%: `R1 completion: ALL objectives met`

---

## Input/Output Behavior

### Inputs

1. **Release Status File** (REQUIRED)
   - Path: `docs/project-management/status/R*-RELEASE-STATUS.md`
   - Example: `docs/project-management/status/R1-RELEASE-STATUS.md`

2. **WP ID** (OPTIONAL)
   - Format: `R1-WP1`, `R1-WP2`, etc.
   - Purpose: Logging context, used in Update History entry
   - If omitted: Generic "Release status update" message

### Outputs

1. **Updated Release File** (IN-PLACE)
   - Same path as input
   - All sections updated deterministically

2. **Console Logging** (STDERR)
   ```
   ======================================================================
   🚀 Starting COMPREHENSIVE Release update: docs/.../R1-RELEASE-STATUS.md
   📌 WP context: R1-WP1
   ======================================================================

   📂 Reading WP progress files for R1...
     ✅ Read R1-WP1: 44 pts, 100%, ✅ Complete
     ✅ Read R1-WP2: 28 pts, 100%, ✅ Complete

   ✅ Parsed R1.WP1: 44 pts, 100%, ✅ Complete
   ✅ Parsed R1.WP2: 28 pts, 100%, ✅ Complete
   ✅ Parsed T-04: 18 pts, 100%, ✅ Complete
   ✅ Parsed T-03: 11 pts, 100%, ✅ Complete

   📊 Calculated Release Metrics:
     Total complexity: 72 points
     Completed: 72.0 points (2/2 WPs)
     In progress: 0.0 points (0 WPs)
     Remaining: 0.0 points
     Deferred: 0.0 points
     Release progress: 100%
     Tasks: 6/6 complete

   🔧 Updating Summary Dashboard...
     Status: - **Status**: 🟡 87% Complete → - **Status**: ✅ 100% Complete (ALL objectives met)
     Progress: - **Progress**: [████████░░] 87% → - **Progress**: [██████████] 100% (72/72 points)

   🔧 Updating Success Criteria...
     [~] → [x]: RAG Pipeline (T-04)

   🔧 Updating Key Deliverables sections...
     Updated Delivered section: 6 tasks

   🔧 Updating Work Package Summary table...
     Updated WP Summary table: 2 work packages

   🔧 Updating Task Completion Matrix...
     Updated T-03: 100% ✅ Complete

   🔧 Updating Current Focus...
     Changed 'Current Focus' to 'Release Complete'

   🔧 Updating Update History...
     Added new history entry for 2025-10-26

   ======================================================================
   ✅ COMPREHENSIVE RELEASE UPDATE COMPLETE
   📊 Sections updated: Summary, Success Criteria, Key Deliverables,
      WP Summary, Task Matrix, Current Focus, Completed Work, History
   📊 Release Progress: 100% (72/72 points)
   📊 Status: ✅ 100% Complete (ALL objectives met)
   📊 WPs: 2/2 complete
   📊 Tasks: 6/6 complete
   ======================================================================
   ```

3. **Exit Codes**
   - `0`: Success
   - `1`: File parsing/update error
   - `2`: File not found

---

## Usage Examples

### Example 1: R1-WP1 Reaches 100%

**Scenario**: T-03 completes, R1-WP1 reaches 100%, update R1 release status

```bash
# Step 1: Update WP progress file (done by update-wp-complete.py)
python update-wp-complete.py docs/project-management/progress/R1-WP1-progress.md T-03

# Step 2: Update Release status (this script)
python update-release-complete.py docs/project-management/status/R1-RELEASE-STATUS.md R1-WP1
```

**Before**:
- R1-WP1: 87% (38.5/44 points)
- R1-WP2: 100% (28/28 points)
- R1 Overall: 87% (59/72 points)

**After**:
- R1-WP1: 100% (44/44 points)
- R1-WP2: 100% (28/28 points)
- R1 Overall: 100% (72/72 points) ✅

---

### Example 2: R1-WP2 Starts (0% → In Progress)

**Scenario**: T-05 starts, R1-WP2 begins, no major milestone yet

```bash
# Step 1: Update WP progress file
python update-wp-complete.py docs/project-management/progress/R1-WP2-progress.md T-05

# Step 2: Update Release status
python update-release-complete.py docs/project-management/status/R1-RELEASE-STATUS.md R1-WP2
```

**Before**:
- R1-WP1: 100% (44/44 points)
- R1-WP2: 0% (0/28 points)
- R1 Overall: 61% (44/72 points)

**After**:
- R1-WP1: 100% (44/44 points)
- R1-WP2: 50% (14/28 points) [T-05 complete]
- R1 Overall: 81% (58/72 points)

---

### Example 3: Generic Status Update (No WP Context)

**Scenario**: Manual update after reviewing multiple WPs

```bash
# No WP context specified
python update-release-complete.py docs/project-management/status/R1-RELEASE-STATUS.md
```

**Behavior**:
- Reads all WP progress files for R1
- Recalculates release metrics
- Updates all sections
- Update History: "Release status update: 87% complete"

---

### Example 4: Release Completion (100%)

**Scenario**: Last WP completes, R1 reaches 100%

```bash
# R1-WP1 was at 100%, R1-WP2 completes (T-06 done)
python update-wp-complete.py docs/project-management/progress/R1-WP2-progress.md T-06
python update-release-complete.py docs/project-management/status/R1-RELEASE-STATUS.md R1-WP2
```

**Changes**:
- Summary: Status → "✅ 100% Complete (ALL objectives met)"
- Summary: Progress → `[██████████] 100% (72/72 points)`
- Summary: Completion Date → `2025-10-26`
- Current Focus → Changed to "## Release Complete ✅"
- Key Deliverables: All moved to "Delivered" section
- Update History: "R1 completion: 2/2 WPs complete, R1 COMPLETE"

---

## Integration with sync-project-status

The `update-release-complete.py` script is designed to be called by `sync-project-status.sh` (Phase 2 automation).

### Call Sequence

```bash
# sync-project-status.sh workflow

1. Parse T-XX-STATUS.md (YAML frontmatter)
2. Calculate task progress (complexity points)
3. Update R#-WP#-progress.md (call update-wp-complete.py)
4. Check if WP milestone reached (25%, 50%, 75%, 100%)
5. IF milestone: Update R#-RELEASE-STATUS.md (call update-release-complete.py) ← THIS SCRIPT
6. Check if release status changed
7. IF changed: Update PROJECT-STATUS.md
```

### Integration Example

```bash
# In sync-project-status.sh (future)

# After updating WP
python3 tools/update-wp-complete.py "$WP_FILE" "$TASK_ID"

# Check if WP reached milestone
if is_milestone "$WP_PROGRESS"; then
    # Update Release
    python3 tools/update-release-complete.py "$RELEASE_FILE" "$WP_ID"

    # Check if release status changed
    RELEASE_PROGRESS=$(extract_release_progress "$RELEASE_FILE")
    if release_changed "$RELEASE_PROGRESS"; then
        # Update Project Status
        bash tools/update-project-status.sh "$RELEASE_FILE"
    fi
fi
```

---

## Error Handling

### File Not Found

```bash
$ python update-release-complete.py docs/status/R1-RELEASE-STATUS.md
❌ File not found: docs/status/R1-RELEASE-STATUS.md
```

**Exit code**: 2

---

### No Work Packages Found

```bash
$ python update-release-complete.py docs/.../R1-RELEASE-STATUS.md
⚠️  Work Package Summary table not found
❌ No work packages found in docs/.../R1-RELEASE-STATUS.md
```

**Exit code**: 1

**Cause**: Release file doesn't have Work Package Summary table

---

### No Tasks Found (Warning Only)

```bash
$ python update-release-complete.py docs/.../R1-RELEASE-STATUS.md
⚠️  Task Completion Matrix table not found
⚠️  No tasks found, continuing with WP data only
```

**Exit code**: 0 (continues with WP-only data)

**Behavior**: Script continues, calculates release metrics from WP data only

---

### WP Progress Files Not Found

```bash
📂 Reading WP progress files for R1...
⚠️  Progress directory not found: /docs/project-management/progress
```

**Exit code**: 0 (falls back to Release file data)

**Behavior**: Uses WP data parsed from Release file instead of fresh WP files

---

## Development Notes

### Design Decisions

1. **Fresh Data Preference**
   - Reads WP progress files directly (not just Release file)
   - Merges: `{**wps_from_file, **wps_from_files}`
   - Prefers fresh data from WP files if conflict

2. **Idempotent Updates**
   - Safe to run multiple times
   - Update History: Updates existing entry if date matches
   - No duplicate status indicators (✅ Complete ✅ Complete)

3. **Milestone Detection**
   - Release progress calculated: `(Σ WP completed) / (Σ WP total) × 100`
   - Status text: 100% → "✅ ALL objectives met", 75%+ → "🟢 Core objectives met"

4. **Section Header Changes**
   - "Current Focus" → "Release Complete ✅" when 100%
   - Automatic section reorganization

### Code Structure

```
update-release-complete.py (800 lines)
├── Data Classes (100 lines)
│   ├── WPData
│   ├── TaskData
│   └── ReleaseMetrics
├── ReleaseFileParser (150 lines)
│   ├── parse_wp_summary_table()
│   ├── parse_task_completion_matrix()
│   └── extract_release_id()
├── ReleaseMetricsCalculator (80 lines)
│   └── calculate_release_metrics()
├── ReleaseFileUpdater (400 lines)
│   ├── update_summary_dashboard()
│   ├── update_success_criteria()
│   ├── update_key_deliverables()
│   ├── update_wp_summary_table()
│   ├── update_task_completion_matrix()
│   ├── update_current_focus()
│   ├── update_completed_work()
│   ├── update_history()
│   └── clean_duplicate_status_indicators()
└── Main Functions (70 lines)
    ├── read_wp_progress_files()
    ├── update_release_complete()
    └── main()
```

### Extending the Script

**Adding a new section update**:

```python
class ReleaseFileUpdater:
    def update_new_section(self, lines: List[str], metrics: ReleaseMetrics) -> List[str]:
        """Update new section"""
        print(f"\n🔧 Updating New Section...", file=sys.stderr)

        # Find section
        section_start = -1
        for i, line in enumerate(lines):
            if '## New Section' in line:
                section_start = i
                break

        # Update section content
        # ...

        return lines

# In update_release_complete():
lines_list = updater.update_new_section(lines_list, metrics)
```

### Testing

```bash
# Test on R1 (complete release)
python update-release-complete.py docs/project-management/status/R1-RELEASE-STATUS.md R1-WP1

# Test on R2 (in-progress release)
python update-release-complete.py docs/project-management/status/R2-RELEASE-STATUS.md R2-WP1

# Test without WP context
python update-release-complete.py docs/project-management/status/R1-RELEASE-STATUS.md

# Validate output
git diff docs/project-management/status/R1-RELEASE-STATUS.md
```

---

## Cross-References

### Related Scripts
- **update-wp-complete.py**: Work Package progress updater (same pattern)
- **sync-project-status.sh**: Orchestrates entire hierarchy update (Phase 2 automation)
- **update-project-status.sh**: Project-level status updater (Phase 3, not yet implemented)

### Related Documentation
- [STATUS-TRACKING-UPDATE-WORKFLOW.md](../docs/development/STATUS-TRACKING-UPDATE-WORKFLOW.md) - Complete workflow
- [R1-RELEASE-STATUS.md](../docs/project-management/status/R1-RELEASE-STATUS.md) - Example Release file
- [R1-WP1-progress.md](../docs/project-management/progress/R1-WP1-progress.md) - Example WP file

---

**Version**: 1.0
**Last Updated**: 2025-10-26
**Maintained By**: Technical Researcher
**Status**: ✅ Production Ready
