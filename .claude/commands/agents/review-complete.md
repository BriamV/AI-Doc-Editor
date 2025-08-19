# Review Complete - Sub-Agent Code Review

---
description: Comprehensive code review with specialized sub-agent delegation
argument-hint: "[scope] [--draft]"
allowed-tools: Bash(git *), Bash(yarn *), Bash(bash tools/*), Read, Grep, Glob
model: claude-3-5-sonnet-20241022
---

## Purpose
Orchestrates comprehensive code review using specialized sub-agents based on project context and change scope.

## Usage
```bash
/review-complete                    # Auto-detect current changes
/review-complete feature            # Review feature branch changes
/review-complete --draft            # Draft review mode
/review-complete security           # Focus on security aspects
```

## Context (auto-collected)
- Current branch: !`git branch --show-current`
- Changed files: !`git diff --name-only HEAD~1..HEAD`
- Workflow context: !`bash tools/workflow-context.sh`
- Task context: !`bash tools/task-navigator.sh $(git branch --show-current | grep -o 'T-[0-9]\+')`

## Implementation

Parse `$ARGUMENTS` for review scope and draft flag. Auto-detect scope from changed files and branch context.

**Sub-agent delegation based on change scope:**

- **Security/Auth changes**:
  > Use the security-auditor sub-agent to perform security review of authentication and data protection changes

- **Frontend/UI/Components**:
  > Use the frontend-developer sub-agent to review React components, TypeScript interfaces, and UI/UX implementations

- **Backend/API/Data**:
  > Use the backend-architect sub-agent to review API endpoints, data models, and system architecture changes

- **General code review**:
  > Use the code-reviewer sub-agent to perform comprehensive code quality analysis and best practices review

**Quality gates integration:**
When not in draft mode, run validation tools (yarn qa-gate) and DoD validation (tools/validate-dod.sh).
```