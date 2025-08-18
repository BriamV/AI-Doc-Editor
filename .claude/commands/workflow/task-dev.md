# Task Development - Sub-Agent Delegation

---
description: Complete task development with explicit sub-agent delegation using Claude Code best practices
argument-hint: "[task-id] [action]"
allowed-tools: Bash(git branch:*), Bash(bash tools/*), Read, Grep, Glob
model: claude-3-5-sonnet-20241022
---

## Purpose

Context-aware task development using proper sub-agent delegation. Analyzes task content and automatically invokes the appropriate specialized sub-agent for implementation.

## Usage

```bash
/task-dev                       # Auto-detect from branch context  
/task-dev T-25                  # Specific task development
/task-dev T-25 complete         # Mark complete with DoD validation
```

## Context (auto-collected)
- Current branch: !`git branch --show-current`
- Modified files: !`git status --porcelain`
- Task context: !`bash tools/task-navigator.sh $ARGUMENTS`

## Implementation

Parse `$ARGUMENTS` for task ID and action parameters. Auto-detect task ID from branch context if not provided.

Task content analysis for sub-agent selection using tools/task-navigator.sh output.

**Sub-agent delegation based on task content analysis:**

- **Frontend tasks** (React/TypeScript/UI/components):
  > Use the frontend-developer sub-agent to implement React/TypeScript components and UI functionality for the specified task

- **Backend tasks** (API/FastAPI/Python/endpoints):
  > Use the backend-architect sub-agent to design and implement API endpoints and backend functionality for the specified task

- **Security tasks** (auth/oauth/encryption/audit):
  > Use the security-auditor sub-agent to implement security requirements and authentication features for the specified task

- **General development tasks**:
  > Use the frontend-developer sub-agent to implement the requirements, coordinating with backend-architect sub-agent if API changes are needed

**Task completion handling:**
When action parameter is "complete", integrate with tools/qa-workflow.sh for DoD validation.
```