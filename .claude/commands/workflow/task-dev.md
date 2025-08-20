# Task Development - Planner → Specialist → QA

---
description: Complete task development with mandatory task-planner validation, then sub-agent delegation using Claude Code best practices
argument-hint: "[task-id] [action]"
allowed-tools: Bash(git branch:*), Bash(git diff:*), Bash(git log:*), Bash(git status:*), Bash(bash tools/*)
model: claude-3-5-sonnet-20241022
---

## Purpose

Context-aware task development using **mandatory task-planner validation** followed by specialized sub-agent delegation. Implements the Planner → Specialist → QA workflow for predictable and secure task orchestration.

## Usage

```bash
/task-dev                       # Auto-detect from branch context  
/task-dev T-25                  # Specific task development
/task-dev T-25 complete         # Mark complete with DoD validation
```

## Context (auto-collected)
- Current branch: !`git branch --show-current`
- Staged/Unstaged diff: !`git diff --name-status HEAD`
- Recent commits: !`git log --oneline -8`
- Task details: !`bash tools/task-navigator.sh $ARGUMENTS`

## Implementation Workflow

**Phase 1: Context & Resolution**
1. Parse `$ARGUMENTS` for TASK_ID pattern (`T-\d+`) and ACTION (`complete` if present)
2. If TASK_ID not found in args, infer from current branch name
3. Collect task specification and current repository state
4. **Branch Management** (following CONTRIBUTING.md guidelines):
   - If on `develop` branch: Create new `feature/T<ID>-<description>` branch from develop
   - If already on feature branch: Continue with current branch
   - If ACTION="complete": Ensure proper branch state for PR creation

**Phase 2: MANDATORY Task Planner Validation**
> Use the task-planner sub-agent to validate the task specification and create an execution plan before starting any code changes

The task-planner will:
- Validate task spec against repository state  
- Generate 5-7 step execution checklist with exact file paths
- Apply risk-based validation (auto/fast/strict modes)
- Set file change caps and identify sensitive areas
- Check dependencies and create test plan
- Produce machine-readable `planner_status` JSON

**Phase 3: Gating & Safety Rails**
- **STOP execution** if `planner_status.status != "OK"`
- Block if missing dependencies or unresolved confirmations
- Enforce `file_change_cap` limits before any edits
- Require explicit approval for sensitive areas (configs/secrets/migrations)

**Phase 4: Specialized Sub-Agent Delegation**

Based on task-planner analysis and content classification:

- **Frontend tasks** (React/TypeScript/UI/components):
  > Use the frontend-developer sub-agent to implement React/TypeScript components and UI functionality following the planner checklist

- **Backend tasks** (API/FastAPI/Python/endpoints):
  > Use the backend-architect sub-agent to design and implement API endpoints and backend functionality following the planner checklist

- **Security tasks** (auth/oauth/encryption/audit):
  > Use the security-auditor sub-agent to implement security requirements and authentication features following the planner checklist

- **Mixed/Complex tasks**:
  > Sequence multiple specialists as needed, ensuring atomic commits with `${TASK_ID}:` prefix

**Phase 5: Quality Assurance & Governance Integration**
- Run `bash tools/qa-workflow.sh ${TASK_ID} dev-verify` (tests, lint, file count validation)
- Execute context-aware validation: `yarn run cmd validate-task` (auto-detects current task/workflow)
- If `ACTION="complete"`: 
  - Execute `bash tools/qa-workflow.sh ${TASK_ID} dev-complete` with diff summary and DoD confirmation
  - **Governance Integration**: Use existing governance commands for proper workflow
    - `/commit-smart` for conventional commits with quality gates
    - `/docs-update` for automatic traceability and status updates  
    - `/pr-flow develop` for PR creation following CONTRIBUTING.md GitFlow

**Final Output**
Print structured summary: TASK_ID, ACTION, category, planner checklist, specialists used, QA outcome.

## Branch Management Integration

Following **CONTRIBUTING.md** GitFlow workflow:

**For New Task Development:**
```bash
/task-dev T-25                    # Auto-creates feature/T-25-<description> from develop
```

**Branch Creation Logic:**
- Current branch = `develop` → Create `feature/T<ID>-<short-description>` 
- Current branch = `feature/T<ID>-*` → Continue on existing feature branch
- Branch naming follows: `feature/T<ID>-<kebab-case-description>`

**For Task Completion:**
```bash  
/task-dev T-25 complete           # Validates, commits with conventional format, suggests PR
```

**Governance Commands Integration:**
- **Development commits**: Use `/commit-smart` for intelligent conventional commits with quality gates
- **Documentation updates**: Use `/docs-update` for automatic traceability and DEVELOPMENT-STATUS.md updates
- **Architecture decisions**: Use `/adr-create` when architectural decisions are made during implementation
- **Issue creation**: Use `/issue-generate` for bugs/enhancements discovered during development

**Quality Gates Integration:**
- Context-aware validation via `yarn run cmd validate-task` (auto-detects current task/workflow)
- Full integration with optimized hooks system (54% performance optimized)
- CI/CD ready with existing governance pipeline

## Command Orchestration

`/task-dev` acts as the **main orchestrator** for task development, delegating to specialized governance commands:

**During Development:**
- `/task-dev T-25` → Creates feature branch, runs planner, delegates to specialists
- Atomic commits handled internally during implementation
- Sub-agents (frontend-developer, backend-architect, security-auditor) handle code changes

**On Task Completion:**
- `/task-dev T-25 complete` → Triggers governance workflow:
  1. Final validation via `qa-workflow.sh`
  2. **Delegates to `/commit-smart`** for final conventional commit
  3. **Delegates to `/docs-update`** for traceability updates  
  4. **Delegates to `/pr-flow develop`** for PR creation with comprehensive code review

**Architecture Decisions During Development:**
- If architectural decisions emerge → **Suggest `/adr-create`** 
- If bugs/issues found → **Suggest `/issue-generate`**

**No Duplication:** `/task-dev` coordinates but doesn't replicate the functionality of governance commands
```