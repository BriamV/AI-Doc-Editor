# Status Tracking Update Workflow

**Purpose**: Deterministic status tracking system with minimal cognitive load for developers
**Principle**: Update source of truth → system propagates automatically
**Status**: ✅ **FULLY AUTOMATED** (Phases 1-4 Complete)
**Last Updated**: 2025-10-20

## Table of Contents

- [Overview](#overview)
- [Document Hierarchy](#document-hierarchy)
- [Aggregation Rules](#aggregation-rules)
- [When to Update Each Level](#when-to-update-each-level)
- [Minimal Cognitive Load Strategy](#minimal-cognitive-load-strategy)
- [Update Commands & Tools](#update-commands--tools)
- [Concrete Examples](#concrete-examples)
- [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
- [Validation & Quality Checks](#validation--quality-checks)
- [File Templates & Cross-References](#file-templates--cross-references)
- [Future Automation Roadmap](#future-automation-roadmap)

---

## Overview

The AI Document Editor project uses a hierarchical status tracking system that flows from granular task details up to executive-level project summaries. This guide establishes deterministic rules for maintaining consistency across all documentation levels.

### Key Principles

1. **Single Source of Truth**: Task status files (`T-XX-STATUS.md`) are the authoritative data source
2. **Bottom-Up Flow**: Information aggregates from tasks → work packages → releases → project status
3. **Minimal Cognitive Load**: Developers update ONLY task status, system handles propagation
4. **Deterministic Rules**: Clear, unambiguous update triggers at each level
5. **Full Automation**: ✅ Complete 4-phase automation pipeline operational

### Implementation Status (All Phases Complete)

| Aspect | Before Automation | After Automation (✅ Current) |
|--------|-------------------|------------------------------|
| **Developer Action** | Update 4 files manually | Update T-XX-STATUS.md only |
| **Propagation** | Manual calculation + updates | `/sync-project-status T-XX` (automatic) |
| **Validation** | Manual review | 3-level: Claude Hook + Git Hook + CI/CD |
| **Consistency** | Error-prone (manual) | System enforced (deterministic) |
| **Cognitive Load** | High (15 min/task) | Minimal (<30 sec/task) |
| **PR Merge Safety** | Manual review required | Automatic validation + blocking |

---

## Document Hierarchy

The status tracking system has 4 levels, each serving a distinct purpose:

```
┌─────────────────────────────────────────────────────────────┐
│ PROJECT-STATUS.md                                            │
│ Executive summary (what releases are complete/in progress)  │
│ Delegates to Release Status for details                     │
└─────────────────────────────────────────────────────────────┘
                          ↑ aggregates from
┌─────────────────────────────────────────────────────────────┐
│ R#-RELEASE-STATUS.md                                         │
│ Release-level summary (what work packages are done)         │
│ Delegates to Work Package Progress for task details         │
└─────────────────────────────────────────────────────────────┘
                          ↑ aggregates from
┌─────────────────────────────────────────────────────────────┐
│ R#-WP#-progress.md                                           │
│ Work package task breakdown (task completion matrix)        │
│ Delegates to Task Status for implementation details         │
└─────────────────────────────────────────────────────────────┘
                          ↑ aggregates from
┌─────────────────────────────────────────────────────────────┐
│ T-XX-STATUS.md                     [SOURCE OF TRUTH]        │
│ Granular task implementation details (subtask status)       │
│ Updated by developers during development                    │
└─────────────────────────────────────────────────────────────┘
```

### Document Purposes

1. **Task Status** (`docs/tasks/T-XX-STATUS.md`)
   - **Owner**: Developer assigned to task
   - **Purpose**: Track implementation progress, subtask completion, blockers
   - **Update Frequency**: Daily during active development
   - **Audience**: Development team, technical leads

2. **Work Package Progress** (`docs/project-management/progress/R#-WP#-progress.md`)
   - **Owner**: Work package lead / Tech lead
   - **Purpose**: Aggregate task progress, track WP metrics, identify blockers
   - **Update Frequency**: On task milestones (25%, 50%, 75%, 100%)
   - **Audience**: Technical team, project managers

3. **Release Status** (`docs/project-management/status/R#-RELEASE-STATUS.md`)
   - **Owner**: Release manager / Tech lead
   - **Purpose**: Track release progress, manage scope, report blockers
   - **Update Frequency**: On WP milestones or release status changes
   - **Audience**: Project stakeholders, management

4. **Project Status** (`docs/project-management/status/PROJECT-STATUS.md`)
   - **Owner**: Tech lead / Project manager
   - **Purpose**: Executive summary, overall progress, strategic decisions
   - **Update Frequency**: On release status changes or major milestones
   - **Audience**: Executives, external stakeholders

---

## Aggregation Rules

Deterministic rules govern when and how information flows between levels.

### Task → Work Package Aggregation

**Trigger**: Update Work Package on ANY task status change

**Update Actions**:

1. **Recalculate WP Progress Percentage**
   ```
   WP Progress % = (Completed Complexity Points / Total Complexity Points) × 100

   Example:
   - T-04: 18/18 points (100%)
   - T-49: 5.3/8 points (66%)
   - T-03: 0/11 points (0%)
   - T-24: 0/7 points (0%)

   WP Progress = (18 + 5.3) / (18 + 8 + 11 + 7) = 23.3 / 44 = 53%
   ```

2. **Update Task Completion Matrix Table**
   ```markdown
   | Task ID | Status | Progress | Completed Points |
   |---------|--------|----------|------------------|
   | T-04    | ✅ Complete | 100% | 18/18 |
   | T-49    | 🟡 In Progress | 66% | 5.3/8 |
   | T-03    | 🔴 Not Started | 0% | 0/11 |
   ```

3. **Update Velocity Tracking**
   ```markdown
   - **Week 4 (Oct 16 - Oct 17)**: +5.3 complexity points (T-04 complete + T-49 66%)
   - **Total Delivery**: 23.3 complexity points in 3+ weeks
   ```

**Deterministic Rules**:
- Update on task status change: Not Started → In Progress
- Update on task status change: In Progress → Complete
- Update on task progress % change: ±10% or more
- Update on task blocker identification

### Work Package → Release Aggregation

**Trigger**: Update Release on WP milestones (25%, 50%, 75%, 100%)

**Update Actions**:

1. **Update WP Summary Table**
   ```markdown
   | Package | Complexity | Progress | Status | Key Tasks |
   |---------|------------|----------|--------|-----------|
   | R1.WP1  | 36 points  | [████░░░░░░] 53% | 🟡 In Progress | T-04 ✅ |
   | R1.WP2  | 28 points  | [░░░░░░░░░░] 0%  | 🔴 Not Started | T-05 ❌ |
   ```

2. **Recalculate Release Progress Percentage**
   ```
   Release Progress % = (Sum of WP Progress × WP Complexity) / Total Release Complexity

   Example:
   - R1.WP1: 53% × 36 points = 19.08 points
   - R1.WP2: 0% × 28 points = 0 points

   Release Progress = 19.08 / (36 + 28) = 19.08 / 64 = 30%
   ```

3. **Update Current Focus Section**
   - Active work: List in-progress tasks from highest-progress WP
   - Next up: List blocked/pending tasks from highest-priority WP
   - Key milestones: Update milestone status based on WP completion

**Deterministic Rules**:
- Update when WP reaches 25%, 50%, 75%, or 100% completion
- Update when WP status changes (Not Started → In Progress → Complete)
- Update when new blocker identified in WP
- Update when WP schedule variance exceeds ±25%

### Release → Project Status Aggregation

**Trigger**: Update Project Status on release status changes

**Update Actions**:

1. **Update Summary Dashboard**
   ```markdown
   ## Summary Dashboard
   - **Status**: 🟢 R2 AI Integration Active
   - **Overall Progress**: [███░░░░░░░] 30% (2/6 releases complete)
   - **Current Release**: R1 → R2 In Progress
   ```

2. **Update Release Summary Line in Current Focus**
   ```markdown
   ### Active Release: R2 - AI Integration & Document Intelligence
   - **Completion**: [████░░░░░░] 40% (T-04 complete, T-49 66%)
   ```

3. **Update Completed Work / Planned Work Sections**
   - Move completed releases from "Planned Work" to "Completed Work"
   - Update release completion dates
   - Update metrics dashboard

**Deterministic Rules**:
- Update when release status changes (Planning → In Progress → Complete)
- Update when release completion % reaches major milestones (25%, 50%, 75%, 100%)
- Update when new release starts (add to "Current Focus")
- Update when release completes (move to "Completed Work")

---

## When to Update Each Level

Use this decision tree to determine which documents need updating:

```
┌─────────────────────────────────────────────────────────────┐
│ Did task status change?                                     │
│ (Not Started → In Progress, In Progress → Complete, etc.)  │
└─────────────────────────────────────────────────────────────┘
                    │
                    ├─ YES → UPDATE T-XX-STATUS.md
                    │          └─ Is task at milestone? (25%, 50%, 75%, 100%)
                    │               │
                    │               ├─ YES → UPDATE R#-WP#-progress.md
                    │               │          └─ Is WP at milestone?
                    │               │               │
                    │               │               ├─ YES → UPDATE R#-RELEASE-STATUS.md
                    │               │               │          └─ Did release status change?
                    │               │               │               │
                    │               │               │               ├─ YES → UPDATE PROJECT-STATUS.md
                    │               │               │               └─ NO → STOP
                    │               │               └─ NO → STOP
                    │               └─ NO → UPDATE R#-WP#-progress.md (in-progress only)
                    │                         └─ STOP
                    └─ NO → No updates needed
```

### Quick Reference Table

| Scenario | T-XX | WP | Release | Project |
|----------|------|----|---------|---------|
| Task starts (0% → In Progress) | ✅ | ✅ | ❌ | ❌ |
| Task progresses (In Progress → 50%) | ✅ | ✅ | ✅ | ❌ |
| Task completes (In Progress → 100%) | ✅ | ✅ | ✅ | ❌¹ |
| Task blocked (new blocker) | ✅ | ✅ | ✅ | ❌ |
| WP reaches milestone (e.g., 50%) | ❌ | ✅ | ✅ | ❌ |
| WP completes (100%) | ❌ | ✅ | ✅ | ✅ |
| Release status changes | ❌ | ❌ | ✅ | ✅ |

¹ *Only update Project Status if task completion causes release status change (e.g., last task in release)*

---

## Minimal Cognitive Load Strategy

**Goal**: Developers focus on coding, not documentation overhead.

### Developer Workflow (Current Manual Mode)

**Step 1: Update Task Status** (ALWAYS)
```bash
# Developer updates ONLY this file during development
vim docs/tasks/T-XX-STATUS.md

# Example update: Task reaches 100%
estado: "✅ 100% COMPLETADO"
fecha_completado: "2025-10-17"
```

**Step 2: Check Decision Tree** (Use quick reference above)
```bash
# Question: Did task reach milestone (25%, 50%, 75%, 100%)?
# YES → Proceed to Step 3
# NO → Stop, commit T-XX-STATUS.md only
```

**Step 3: Update Work Package** (IF MILESTONE)
```bash
vim docs/project-management/progress/R#-WP#-progress.md

# Recalculate progress percentage
# Update task completion matrix
# Update velocity tracking
```

**Step 4: Check Release Milestone** (IF WP UPDATED)
```bash
# Question: Did WP reach milestone (25%, 50%, 75%, 100%)?
# YES → Proceed to Step 5
# NO → Stop, commit T-XX-STATUS.md + R#-WP#-progress.md
```

**Step 5: Update Release Status** (IF WP MILESTONE)
```bash
vim docs/project-management/status/R#-RELEASE-STATUS.md

# Update WP summary table
# Recalculate release progress
# Update current focus section
```

**Step 6: Check Project Update** (IF RELEASE UPDATED)
```bash
# Question: Did release status change?
# YES → Proceed to Step 7
# NO → Stop, commit all updated files
```

**Step 7: Update Project Status** (IF RELEASE STATUS CHANGED)
```bash
vim docs/project-management/status/PROJECT-STATUS.md

# Update summary dashboard
# Update release summary line
# Update completed/planned work sections
```

### Future Workflow (Automated Mode)

**Developer Action**: Update task status only
```bash
vim docs/tasks/T-XX-STATUS.md
```

**System Propagation**: Automatic update cascade
```bash
/sync-project-status T-XX           # Auto-propagate entire hierarchy
/sync-project-status T-XX --dry-run # Preview changes first
/sync-project-status --validate     # Check consistency
```

---

## Update Commands & Tools

### Current: Manual Updates

**1. Update Task Status**
```bash
# Open task status file for editing
vim docs/tasks/T-XX-STATUS.md

# Update fields:
# - estado: Current status (En Progreso, ✅ 100% COMPLETADO, etc.)
# - progreso: Percentage (if in progress)
# - fecha_completado: Completion date (if complete)
# - subtasks: Update status for each subtask
```

**2. Check if WP Update Needed** (Milestone Reached?)
```bash
# Open work package progress file
vim docs/project-management/progress/R#-WP#-progress.md

# Update sections:
# - Task Completion Matrix (update task row)
# - Complexity Progress Visualization (recalculate %)
# - Velocity Tracking (add new week/points)
# - In Progress Work Details / Completed Work Details
```

**3. Check if Release Update Needed** (WP Milestone?)
```bash
# Open release status file
vim docs/project-management/status/R#-RELEASE-STATUS.md

# Update sections:
# - Progress Dashboard → Work Package Summary (WP row)
# - Task Completion Matrix (task row)
# - Current Focus → Active Work (move tasks between sections)
# - Completed Work / Planned Work (move tasks when done)
```

**4. Check if Project Update Needed** (Release Changed?)
```bash
# Open project status file
vim docs/project-management/status/PROJECT-STATUS.md

# Update sections:
# - Summary Dashboard (overall progress %)
# - Current Focus → Active Release (release summary line)
# - Completed Work (add completed releases)
# - In Progress Work (update release progress)
```

**5. Validate Updates**
```bash
# After manual updates, validate consistency
tools/validate-document-placement.sh
yarn docs:validate:strict

# If CLAUDE.md was touched
bash tools/validate-claude-md.sh
bash tools/audit-claude-md.sh  # Score should be ≥90/100
```

### Future: Automated Sync

**Automated Propagation**
```bash
# Auto-propagate entire hierarchy after updating T-XX-STATUS.md
/sync-project-status T-XX

# Preview changes without writing files
/sync-project-status T-XX --dry-run

# Validate consistency across all levels
/sync-project-status --validate

# Fix inconsistencies automatically
/sync-project-status --fix
```

**Pre-commit Hooks** (Future)
```bash
# Automatically validate before commit
git commit -m "Update T-04 status to 100%"
# → Pre-commit hook runs:
#    1. Check if T-XX-STATUS.md changed
#    2. Validate WP, Release, Project consistency
#    3. Block commit if inconsistencies detected
#    4. Suggest: /sync-project-status T-04 --fix
```

---

## Concrete Examples

### Example 1: Task Completion (T-04)

**Scenario**: T-04 RAG Pipeline reaches 100% completion

---

**Step 1: Update T-04-STATUS.md** (Source of Truth)

**BEFORE**:
```yaml
task_id: "T-04"
estado: "En Progreso"
progreso: "85%"
completado: 15.3/18 (85%)
```

**AFTER**:
```yaml
task_id: "T-04"
estado: "✅ 100% COMPLETADO"
fecha_completado: "2025-10-17"
completado: 18/18 (100%)
```

---

**Step 2: Check WP Milestone** (R1-WP1)

**Decision**: Did task reach milestone?
- Task status: In Progress → Complete ✅
- Progress: 85% → 100% ✅
- **Action**: Update R1-WP1-progress.md

**Calculations**:
```
T-04 complete: 18 points
Total WP complexity: 44 points (T-04: 18, T-49: 8, T-03: 11, T-24: 7)
WP Progress = 18/44 = 41% → NOT a major milestone (25%, 50%, 75%, 100%)

But T-04 completion is significant (largest task), so update anyway.
```

**BEFORE** (R1-WP1-progress.md):
```markdown
| Task ID | Status | Progress | Completed Points |
|---------|--------|----------|------------------|
| T-04    | 🟡 In Progress | 85% | 15.3/18 |
| T-49    | 🟡 In Progress | 66% | 5.3/8 |
```

**AFTER**:
```markdown
| Task ID | Status | Progress | Completed Points |
|---------|--------|----------|------------------|
| T-04    | ✅ Complete | 100% | 18/18 |
| T-49    | 🟡 In Progress | 66% | 5.3/8 |

## Completed Work Details

### T-04: RAG Pipeline Implementation ✅
- **Completed**: 2025-10-17
- **Duration**: 6 days
- **Key Achievements**: [detailed list...]
```

---

**Step 3: Check Release Milestone** (R1)

**Decision**: Did WP reach milestone?
- R1-WP1: 41% (not 25%, 50%, 75%, or 100%) ❌
- BUT: T-04 was highest-complexity task in R1 (18 points) ✅
- **Action**: Update R1-RELEASE-STATUS.md (major task completion)

**BEFORE** (R1-RELEASE-STATUS.md):
```markdown
| Task ID | Status | Progress |
|---------|--------|----------|
| T-04    | 🟡 In Progress | 85% |
```

**AFTER**:
```markdown
| Task ID | Status | Progress |
|---------|--------|----------|
| T-04    | ✅ Complete | 100% |

## Completed Work

### T-04: RAG Pipeline Implementation ✅
- **Status**: 100% Complete
- **Duration**: 6 days (2025-10-11 to 2025-10-17)
- **Key Deliverables**: [detailed list...]
```

---

**Step 4: Check Project Update**

**Decision**: Did release status change?
- R1 overall: Planning → In Progress (already "In Progress") ❌
- R1 completion %: 30% → 35% (not major milestone) ❌
- **Action**: Update PROJECT-STATUS.md (document major milestone)

**BEFORE** (PROJECT-STATUS.md):
```markdown
### Active Release: R2 - AI Integration & Document Intelligence
- **Completion**: [███░░░░░░░] 30%
```

**AFTER**:
```markdown
### Active Release: R2 - AI Integration & Document Intelligence
- **Completion**: [███░░░░░░░] 35% (T-04 complete, T-49 66%)

## Completed Work

### Release 1: Backend Architecture Evolution ✅
- **Key Achievements**:
  - ✅ **T-04 RAG Pipeline**: Complete document ingestion (2025-10-17)
```

---

### Example 2: Task Progress Update (T-49)

**Scenario**: T-49 Document Library UI reaches 66% (not complete, in progress)

---

**Step 1: Update T-49-STATUS.md**

**BEFORE**:
```yaml
task_id: "T-49"
estado: "En Progreso"
progreso: "40%"
wii_subtasks:
  - id: "ST1"
    status: "completado"
  - id: "ST2"
    status: "pendiente"
  - id: "ST3"
    status: "pendiente"
```

**AFTER**:
```yaml
task_id: "T-49"
estado: "En Progreso"
progreso: "66%"
wii_subtasks:
  - id: "ST1"
    status: "completado"
  - id: "ST2"
    status: "pendiente"
  - id: "ST3"
    status: "completado"  # ← Changed
```

---

**Step 2: Check WP Milestone** (R1-WP1)

**Decision**: Did task reach milestone?
- Task status: In Progress (no change) ❌
- Progress: 40% → 66% (change >10%) ✅
- **Action**: Update R1-WP1-progress.md (in-progress section only)

**Calculations**:
```
T-49 progress: 66% of 8 points = 5.3 points
R1-WP1 progress: (18 + 5.3) / 44 = 53%
```

**BEFORE** (R1-WP1-progress.md):
```markdown
### T-49: Document Library UI (Emergent) 🟡
- **Status**: 40% Complete (ST1 implemented)
```

**AFTER**:
```markdown
### T-49: Document Library UI (Emergent) 🟡
- **Status**: 66% Complete (ST1 + ST3 implemented, ST2 pending)
- **In Progress**: 5.3/8 complexity points
- **Implemented** (ST1 + ST3 = 5/8 points):
  - ✅ Document Library page with responsive grid
  - ✅ DocumentCard component with metadata
  - ✅ Filters by file type and processing status
```

---

**Step 3: No Propagation Needed**

**Decision**: Did WP reach milestone?
- R1-WP1: 53% (not 50%, 75%, or 100%) ❌
- WP didn't reach milestone
- **Action**: Skip Release and Project updates, STOP

**Result**: Only T-49-STATUS.md and R1-WP1-progress.md updated.

---

### Example 3: Work Package Completion (R1-WP1)

**Scenario**: Last task in R1-WP1 completes (T-24 reaches 100%), WP reaches 100%

---

**Step 1: Update T-24-STATUS.md**
```yaml
estado: "✅ 100% COMPLETADO"
fecha_completado: "2025-10-25"
```

---

**Step 2: Update R1-WP1-progress.md**

**Calculations**:
```
All tasks complete:
- T-04: 18/18 (100%)
- T-49: 8/8 (100%)
- T-03: 11/11 (100%)
- T-24: 7/7 (100%)

WP Progress = 44/44 = 100% ✅ MILESTONE REACHED
```

**Update**:
```markdown
## Summary Dashboard
- **Status**: ✅ Complete
- **Progress**: [██████████] 100% (4/4 tasks complete)

## Completed Work Details
- ✅ T-04: RAG Pipeline (2025-10-17)
- ✅ T-49: Document Library UI (2025-10-20)
- ✅ T-03: Usage Limits (2025-10-23)
- ✅ T-24: Consent Management (2025-10-25)
```

---

**Step 3: Update R1-RELEASE-STATUS.md**

**Decision**: WP reached 100% milestone → Update release

**Update**:
```markdown
| Package | Progress | Status |
|---------|----------|--------|
| R1.WP1  | [██████████] 100% | ✅ Complete |
| R1.WP2  | [████░░░░░░] 40%  | 🟡 In Progress |

## Completed Work

### R1.WP1: Flujo de Ingesta Unificado ✅
- **Status**: 100% Complete
- **Completed**: 2025-10-25
- **Key Achievements**: [detailed list...]
```

---

**Step 4: Update PROJECT-STATUS.md**

**Decision**: Release status changed (WP completed) → Update project

**Update**:
```markdown
### Active Release: R1 - Backend Architecture Evolution
- **Completion**: [██████░░░░] 60% (R1.WP1 complete, R1.WP2 in progress)

## Completed Work

### R1.WP1: Flujo de Ingesta Unificado ✅
- **Completed**: 2025-10-25
- **Duration**: 4 weeks
- **Deliverables**: RAG pipeline, Document UI, Usage limits, Consent
```

---

## Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: Top-Down Updates

**DON'T**:
```bash
# Updating PROJECT-STATUS.md directly without updating lower levels
vim docs/project-management/status/PROJECT-STATUS.md
# Change: "R1 - 30%" → "R1 - 40%"
git commit -m "Update R1 progress"
```

**WHY**: Creates inconsistency. Project Status says 40%, but Release Status still says 30%.

**DO**:
```bash
# Update source of truth (task status) first
vim docs/tasks/T-04-STATUS.md
# Then propagate upward following decision tree
vim docs/project-management/progress/R1-WP1-progress.md
vim docs/project-management/status/R1-RELEASE-STATUS.md
vim docs/project-management/status/PROJECT-STATUS.md
```

---

### ❌ Anti-Pattern 2: Skipping Intermediate Levels

**DON'T**:
```bash
# Task complete, update Project Status directly
vim docs/tasks/T-04-STATUS.md  # Complete task
vim docs/project-management/status/PROJECT-STATUS.md  # Skip WP and Release
```

**WHY**: Work Package and Release Status become stale, metrics don't align.

**DO**:
```bash
# Update ALL affected levels in hierarchy
vim docs/tasks/T-04-STATUS.md
vim docs/project-management/progress/R1-WP1-progress.md  # DON'T SKIP
vim docs/project-management/status/R1-RELEASE-STATUS.md # DON'T SKIP
vim docs/project-management/status/PROJECT-STATUS.md
```

---

### ❌ Anti-Pattern 3: Inconsistent Metrics

**DON'T**:
```markdown
<!-- T-04-STATUS.md -->
completado: 18/18 (100%)

<!-- R1-WP1-progress.md -->
| T-04 | 🟡 In Progress | 85% | 15.3/18 |  ← INCONSISTENT

<!-- R1-RELEASE-STATUS.md -->
| T-04 | ✅ Complete | 100% | 18/18 |    ← INCONSISTENT
```

**WHY**: Different documents show different states for same task.

**DO**:
```bash
# After updating T-04-STATUS.md to 100%, propagate IMMEDIATELY
vim docs/project-management/progress/R1-WP1-progress.md
# Update: T-04 | ✅ Complete | 100% | 18/18

vim docs/project-management/status/R1-RELEASE-STATUS.md
# Update: T-04 | ✅ Complete | 100% | 18/18
```

---

### ❌ Anti-Pattern 4: Updating Only Narrative Sections

**DON'T**:
```markdown
<!-- Update narrative text only -->
## Completed Work
T-04 is now complete!  ← Updated

<!-- But forget to update tables -->
| Task ID | Status | Progress |
|---------|--------|----------|
| T-04    | 🟡 In Progress | 85% |  ← NOT Updated
```

**WHY**: Tables and narrative contradict each other.

**DO**:
```markdown
<!-- Update BOTH narrative AND data tables -->
## Completed Work
### T-04: RAG Pipeline Implementation ✅
- **Status**: 100% Complete
- **Completed**: 2025-10-17

## Task Completion Matrix
| Task ID | Status | Progress |
|---------|--------|----------|
| T-04    | ✅ Complete | 100% |  ← ALSO Updated
```

---

### ❌ Anti-Pattern 5: Forgetting Calculated Metrics

**DON'T**:
```markdown
<!-- Update task row but forget to recalculate WP percentage -->
| T-04 | ✅ Complete | 100% | 18/18 |  ← Updated
| T-49 | 🟡 In Progress | 66% | 5.3/8 |

**Progress**: [███░░░░░░░] 30%  ← STALE (should be 53%)
```

**WHY**: Progress bar doesn't reflect updated task status.

**DO**:
```markdown
| T-04 | ✅ Complete | 100% | 18/18 |
| T-49 | 🟡 In Progress | 66% | 5.3/8 |

**Progress**: [█████░░░░░] 53%  ← RECALCULATED (23.3/44 points)
```

---

## Validation & Quality Checks

### Post-Update Validation

**After manual updates, ALWAYS validate consistency:**

```bash
# 1. Document placement validation
tools/validate-document-placement.sh

# 2. Strict documentation validation (CI/CD mode)
yarn docs:validate:strict

# 3. If CLAUDE.md was modified
bash tools/validate-claude-md.sh
bash tools/audit-claude-md.sh  # Score should be ≥90/100

# 4. Quality gate (comprehensive validation)
yarn qa:gate:dev  # Development mode (~45s)
yarn qa:gate      # Full pipeline (~70s, before commit)
```

### Consistency Checks

**Manual Checklist** (before committing):

- [ ] **Task Status**: Estado matches subtask completion
- [ ] **WP Progress**: Complexity points add up correctly
- [ ] **WP Progress %**: Calculated from actual points, not estimated
- [ ] **Release Progress**: WP percentages reflected in release %
- [ ] **Project Progress**: Release status reflected in project summary
- [ ] **Tables Updated**: All task completion matrices updated
- [ ] **Narratives Updated**: Completed/In Progress sections match tables
- [ ] **Dates Consistent**: Completion dates match across all levels
- [ ] **Metrics Aligned**: Progress bars match calculated percentages

### Automated Validation (Future)

```bash
# Pre-commit hook validates consistency
/sync-project-status --validate

# Example output:
# ✅ T-04-STATUS.md: 100% complete
# ✅ R1-WP1-progress.md: T-04 marked complete, 53% WP progress
# ❌ R1-RELEASE-STATUS.md: T-04 still shows 85% (INCONSISTENT)
#
# Recommendation: Run /sync-project-status T-04 --fix
```

---

## File Templates & Cross-References

### Task Status Template

**Location**: `docs/tasks/T-XX-STATUS.md`
**Reference Example**: [T-04-STATUS.md](../tasks/T-04-STATUS.md)

**Key Sections**:
```markdown
---
task_id: "T-XX"
estado: "En Progreso"
progreso: "50%"
completado: 9/18 (50%)
fecha_completado: "" # Empty if in progress
---

## Estado Actual
**Estado:** En Progreso
**Progreso:** 50%

## Subtareas WII
- **ST1**: Completado ✅
- **ST2**: En Progreso 🟡
- **ST3**: Pendiente ❌
```

---

### Work Package Progress Template

**Location**: `docs/project-management/progress/R#-WP#-progress.md`
**Reference Example**: [R1-WP1-progress.md](../project-management/progress/R1-WP1-progress.md)

**Key Sections**:
```markdown
## Summary Dashboard
- **Progress**: [████░░░░░░] 40% (1/3 tasks complete)
- **Complexity**: 18/36 points completed

## Task Execution Status

### Task Summary
| Task ID | Complexity | Status | Progress | Completed |
|---------|------------|--------|----------|-----------|
| T-04    | 18         | ✅     | 100%     | 2025-10-17 |
| T-03    | 11         | 🔴     | 0%       | -          |

### Velocity Tracking
- **Week 4**: +18 complexity points (T-04 complete)
```

---

### Release Status Template

**Location**: `docs/project-management/status/R#-RELEASE-STATUS.md`
**Reference Example**: [R1-RELEASE-STATUS.md](../project-management/status/R1-RELEASE-STATUS.md)

**Key Sections**:
```markdown
## Summary Dashboard
- **Status**: 🟡 In Progress
- **Progress**: [████░░░░░░] 40%

## Progress Dashboard

### Work Package Summary
| Package | Complexity | Progress | Status |
|---------|------------|----------|--------|
| R1.WP1  | 36 points  | 40%      | 🟡     |

## Current Focus
- **Active Work**: T-49 ST2 (66% complete)
- **Next Up**: T-05 Planner Service
```

---

### Project Status Template

**Location**: `docs/project-management/status/PROJECT-STATUS.md`
**Reference Example**: [PROJECT-STATUS.md](../project-management/status/PROJECT-STATUS.md)

**Key Sections**:
```markdown
## Summary Dashboard
- **Status**: 🟢 R2 AI Integration Active
- **Overall Progress**: [███░░░░░░░] 30%

## Current Focus

### Active Release: R2 - AI Integration
- **Completion**: [████░░░░░░] 40%

## Completed Work

### Release 1: Backend Architecture Evolution ✅
- **Status**: 100% Complete
- **Key Achievements**: [list]
```

---

## Automation Implementation History

### Phase 1: Manual Updates ✅ COMPLETED

**Status**: ✅ Complete
**Timeline**: 2025-09-24 to 2025-10-18
**Goal**: Establish deterministic patterns through manual practice

**Deliverables**:
- [x] Document hierarchy defined
- [x] Aggregation rules formalized
- [x] Decision tree established
- [x] Templates created (T-04, T-49, R1-WP1, R1, PROJECT-STATUS)
- [x] This workflow guide written (1000+ lines)

**Outcome**: Pattern successfully established, ready for automation

---

### Phase 2: Bash Script Automation ✅ COMPLETED

**Status**: ✅ Complete
**Timeline**: 2025-10-20 (1 day implementation)
**Goal**: Automate propagation via bash script + slash command

```bash
# Automatic propagation after updating T-XX-STATUS.md
/sync-project-status T-XX
# ✅ Reads T-XX-STATUS.md YAML frontmatter
# ✅ Calculates WP progress (complexity-weighted)
# ✅ Updates R#-WP#-progress.md with task matrix + progress bar
# ✅ Updates R#-RELEASE-STATUS.md if milestone reached (25%, 50%, 75%, 100%)
# ✅ Updates PROJECT-STATUS.md if release status changed

# Dry-run mode (preview changes)
/sync-project-status T-XX --dry-run
# ✅ Shows what WOULD be updated
# ✅ No files written
# ✅ Preview before applying

# Validate consistency only
/sync-project-status --validate
# ✅ Checks all 4 levels for consistency
# ✅ Reports discrepancies
# ✅ Suggests fixes
```

**Deliverables**:
- [x] Bash script: `tools/sync-project-status.sh` (450+ lines)
- [x] Usage guide: `tools/sync-project-status-USAGE.md` (650+ lines)
- [x] Slash command: `.claude/commands/workflow/sync-project-status.md`
- [x] Cross-platform support (Windows Git Bash + Linux/WSL2)
- [x] Deterministic calculations (awk-based arithmetic)
- [x] Progress bar generation (█░ 10-character)
- [x] Milestone detection (±2% tolerance)

**Testing**:
- ✅ T-04 (100%): 18/18 → R1-WP1 at 41%
- ✅ T-49 (66%): 5.3/8 → R1-WP1 at 53% (23.28/44)
- ✅ Calculations match PROJECT-STATUS.md exactly

**Outcome**: Developers can update entire hierarchy in <30 seconds with single command

---

### Phase 3: Pre-commit Hooks ✅ COMPLETED

**Status**: ✅ Complete
**Timeline**: 2025-10-20 (same day as Phase 2)
**Goal**: Validate consistency automatically before commits

```bash
# One-time installation
yarn repo:status:hooks:install

# Automatic behavior after installation
git commit -m "Update T-04 to 100%"
# ✅ Pre-commit hook detects T-XX-STATUS.md changes
# ✅ Runs sync-project-status.sh --validate
# ✅ Blocks commit if inconsistent
# ✅ Shows fix instructions (/sync-project-status or manual)
# ✅ Allows commit if consistent
```

**Deliverables**:
- [x] Pre-commit hook: `scripts/pre-commit-status-validation.sh` (72 lines)
- [x] Hook installer: `scripts/install-status-hooks.sh` (100 lines)
- [x] Yarn command: `yarn repo:status:hooks:install` (package.json)
- [x] Claude Code integration: `.claude/hooks.json` (PostToolUse hook)
- [x] Appends to existing hooks (merge protection + status validation)

**Dual Validation**:
1. **Git Hook**: Validates before `git commit`
2. **Claude Hook**: Validates when Claude edits T-XX-STATUS.md

**Outcome**: Zero manual validation needed, consistency enforced at git level

---

### Phase 4: CI/CD Integration ✅ COMPLETED

**Status**: ✅ Complete
**Timeline**: 2025-10-20 (same day, consolidated architecture)
**Goal**: Block PR merges if status inconsistent

```yaml
# Integrated into .github/workflows/pr-validation.yml
# Part of docs-validation job

- name: Status tracking hierarchy validation
  run: |
    # ✅ Detects changed T-XX-STATUS.md files in PR diff
    # ✅ Runs sync-project-status.sh --validate for each task
    # ✅ Blocks PR merge if hierarchy inconsistent
    # ✅ Clear error messages with fix instructions
```

**Architecture Decision**:
- ✅ Consolidated into existing `pr-validation.yml` workflow
- ✅ Removed standalone workflows (status-validation.yml, document-validation.yml)
- ✅ Integrated with docs-validation job (alongside docs:validate:strict)

**Outcome**: PR merge automatically blocked if hierarchy inconsistent, no manual review needed

---

## Summary: Complete 4-Phase Automation

This workflow delivers a **fully automated, deterministic, bottom-up status tracking system** with minimal cognitive load:

1. **Developers update**: Task status files only (`T-XX-STATUS.md`)
2. **System propagates**: `/sync-project-status T-XX` updates entire hierarchy automatically
3. **Validation enforced**: 3-level validation (Claude Hook → Git Hook → CI/CD)
4. **Quality guaranteed**: Inconsistencies blocked at commit and PR merge

### Before vs After

| Aspect | Before Automation | After Automation |
|--------|-------------------|------------------|
| **Time per update** | 10-15 minutes | <30 seconds |
| **Cognitive load** | High (decision tree) | Minimal (single command) |
| **Error rate** | Manual calculation errors | Zero (deterministic) |
| **Validation** | Manual review | Automatic (3 levels) |
| **PR safety** | Manual check required | Automatic blocking |

**Key Takeaway**: Update the source of truth (task status), automation handles everything else.

---

## Cross-References

### Documentation Standards
- **Template Guidelines**: [docs/templates/DOCUMENTATION-PLACEMENT-GUIDELINES.md](../templates/DOCUMENTATION-PLACEMENT-GUIDELINES.md)
- **README Validation**: [docs/templates/README-VALIDATION-CHECKLIST.md](../templates/README-VALIDATION-CHECKLIST.md)

### Task Management
- **Task Navigator**: `tools/task-navigator.sh T-XX`
- **Progress Dashboard**: `tools/progress-dashboard.sh`
- **Extract Subtasks**: `tools/extract-subtasks.sh T-XX`
- **Validate DoD**: `tools/validate-dod.sh T-XX`

### Quality Validation
- **CLAUDE.md Validation**: `bash tools/validate-claude-md.sh`
- **CLAUDE.md Audit**: `bash tools/audit-claude-md.sh`
- **Document Placement**: `tools/validate-document-placement.sh`
- **QA Gate**: `yarn qa:gate` (full), `yarn qa:gate:dev` (fast)

### Example Files
- [T-04-STATUS.md](../tasks/T-04-STATUS.md) - Completed task example
- [T-49-STATUS.md](../tasks/T-49-STATUS.md) - In-progress task example
- [R1-WP1-progress.md](../project-management/progress/R1-WP1-progress.md) - Work package example
- [R1-RELEASE-STATUS.md](../project-management/status/R1-RELEASE-STATUS.md) - Release example
- [PROJECT-STATUS.md](../project-management/status/PROJECT-STATUS.md) - Project summary

---

**Version**: 2.0 (Automation Complete)
**Last Updated**: 2025-10-20
**Maintained By**: Tech Lead
**Automation Status**: ✅ **ALL PHASES COMPLETE** (Phase 1-4 Operational)
