# Smart Commit - Sub-Agent Delegation

---
description: Create intelligent commits with code review delegation using Claude Code sub-agent best practices
argument-hint: "[message] [--no-verify]"
allowed-tools: Bash(git *), Bash(bash tools/*), Read, Grep
model: claude-3-5-sonnet-20241022
---

## Purpose

Context-aware commit creation with automated code review and conventional commit validation through explicit sub-agent delegation.

## Usage

```bash
/commit-smart                     # Auto-generate from staged changes
/commit-smart "feat: add feature" # Explicit commit message
/commit-smart --no-verify         # Skip pre-commit hooks
```

## Context (auto-collected)
- Current branch: !`git branch --show-current`
- Staged files: !`git diff --cached --name-only`
- Task context: !`bash tools/task-navigator.sh $(git branch --show-current | grep -o 'T-[0-9]\+')`

## Implementation

Parse `$ARGUMENTS` for commit message and no-verify flag. Analyze staged changes to determine security-sensitive files.

**Sub-agent delegation for commit analysis:**

- **Always required**:
  > Use the code-reviewer sub-agent to analyze the staged changes and generate an appropriate conventional commit message with proper scope and description

- **Security-sensitive files** (auth/oauth/security/crypto/token/.env):
  > Use the security-auditor sub-agent to review security implications of these changes before committing

**Conventional commit generation:**
Auto-generate commit message if not provided, using file patterns to determine type (feat/fix/test/etc.) and scope from directory structure.

**Conventional commit validation:**
Verify commit message follows format: `type(scope): description`

**Task integration:**
Update task status using tools/status-updater.sh when task context is available from branch.
```