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

**Phase 5: Quality Assurance**
- Run `bash tools/qa-workflow.sh ${TASK_ID} dev-verify` (tests, lint, file count validation)
- If `ACTION="complete"`: Execute `bash tools/qa-workflow.sh ${TASK_ID} dev-complete` with diff summary and DoD confirmation

**Final Output**
Print structured summary: TASK_ID, ACTION, category, planner checklist, specialists used, QA outcome.
```