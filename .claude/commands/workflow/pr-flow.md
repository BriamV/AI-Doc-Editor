# Pull Request Flow - Sub-Agent Delegation

---
description: Create PRs with proper code review delegation using Claude Code sub-agent best practices  
argument-hint: "[target-branch] [--draft]"
allowed-tools: Bash(git *), Bash(gh *), Read, Grep, Glob
model: claude-3-5-sonnet-20241022
---

## Purpose

Create pull requests with automated code review and security validation through explicit sub-agent delegation.

## Usage

```bash
/pr-flow                        # Auto-detect target from branch
/pr-flow develop                # Explicit target branch  
/pr-flow --draft                # Create draft PR
```

## Context (auto-collected)
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -3`
- Changed files: !`git diff --name-only HEAD~1..HEAD`
- PR target: Auto-detect from GitFlow (feature→develop, release/hotfix→main)

## Implementation

Parse `$ARGUMENTS` for target branch and draft flag. Auto-detect target branch using GitFlow conventions.

Analyze changed files to determine security-sensitive and API files for appropriate sub-agent delegation.

**Sub-agent delegation for comprehensive code review:**

- **Always required**:
  > Use the code-reviewer sub-agent to perform a comprehensive quality analysis of all changes in this pull request before creation

- **Security-sensitive files** (auth/oauth/security/crypto/token):
  > Use the security-auditor sub-agent to perform a thorough security review of authentication and security-related changes before creating this pull request

- **API/Backend files** (.py/.js/.ts files):
  > Use the backend-architect sub-agent to validate architectural decisions and API design patterns in this pull request

**Conventional commit validation:**
Verify the latest commit follows conventional commit format (feat|fix|docs|style|refactor|test|chore).

**PR creation workflow:**
Generate PR with appropriate title, target branch detection, and draft mode support.
```