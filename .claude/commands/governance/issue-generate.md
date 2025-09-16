# Issue Generate - Sub-Agent Delegation

---
description: Generate GitHub issues with specialized sub-agent analysis using Claude Code best practices
argument-hint: "[type] [--task=T-XX]"
allowed-tools: Bash(git *), Bash(gh *), Bash(bash tools/*), Read, Grep
model: claude-3-5-sonnet-20241022
---

## Purpose

Context-aware GitHub issue generation with specialized sub-agent delegation based on issue type. Automatically analyzes bugs, features, or security issues for proper classification and assignment.

## Usage

```bash
/issue-generate                     # Auto-detect from current context
/issue-generate bug                 # Bug report generation
/issue-generate security --task=T-15 # Security issue for specific task
```

## Context (auto-collected)
- Current branch: !`git branch --show-current`
- Recent commits: !`git log -5 --oneline`
- Task context: !`bash tools/task-navigator.sh $ARGUMENTS`
- Repository info: !`gh repo view --json name,owner`

## Implementation

Parse `$ARGUMENTS` for issue type and task ID parameter. Auto-detect issue type from recent commits and branch context when not specified.

**Sub-agent delegation based on issue type:**

- **Bug issues**:
  > Use the debugger sub-agent to analyze the current codebase, identify the root cause, and generate a comprehensive bug report with reproduction steps and proposed solution

- **Security issues**:
  > Use the security-auditor sub-agent to analyze security vulnerabilities, assess risk level, and generate a security issue with proper classification and remediation steps

- **Feature requests**:
  > Use the frontend-developer sub-agent to analyze feature requirements and generate a detailed feature request with user stories and acceptance criteria

- **General issues**:
  > Use the code-reviewer sub-agent to analyze the current context and generate an appropriate issue template with proper categorization

**Issue generation workflow:**
1. Auto-detect issue type from recent commits (fix/bug/error → bug, security/auth/vuln → security, default → feature)
2. Load task context when available using tools/task-navigator.sh
3. Check for related existing issues using GitHub CLI
4. Update task status using tools/status-updater.sh
echo "🚀 Specialized sub-agent will complete issue analysis and generation"
```