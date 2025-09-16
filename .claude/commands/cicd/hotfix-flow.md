# Hotfix Flow - Sub-Agent Delegation

---
description: Emergency hotfix workflow with rapid issue resolution through specialized debugging and deployment sub-agents
argument-hint: "[issue-id] [--emergency]"
allowed-tools: Bash(git *), Bash(gh *), Bash(yarn run cmd *), Read, Grep
model: claude-3-5-sonnet-20241022
---

## Purpose

Complete emergency hotfix workflow using sub-agent delegation. Coordinates rapid issue analysis, fix implementation, testing, and emergency deployment procedures.

## Usage

```bash
/hotfix-flow                       # Auto-detect from branch or latest issue
/hotfix-flow ISSUE-123             # Specific issue hotfix workflow
/hotfix-flow --emergency           # Emergency mode with fast-track procedures
```

## Context (auto-collected)
- Current branch: !`git branch --show-current`
- Issue context: !`gh issue view $ARGUMENTS --json title,state,labels 2>/dev/null || echo "Issue not found"`
- Recent commits: !`git log --oneline -3`
- Deployment status: !`gh run list --workflow=deploy.yml --limit=1 --json conclusion 2>/dev/null || echo "No deployments"`

## Implementation

Parse `$ARGUMENTS` for issue ID and emergency flag. Auto-detect issue ID from branch (hotfix/ISSUE-123), commit messages, or GitHub context.

**Sub-agent delegation based on issue type:**

- **Security issues** (SEC/SECURITY in issue ID):
  > Use the security-auditor sub-agent to perform urgent vulnerability analysis and implement security fixes for the specified issue

- **Performance issues** (PERF/PERFORMANCE in issue ID):
  > Use the performance-engineer sub-agent to identify performance bottlenecks and implement optimization fixes for the specified issue

- **General issues**:
  > Use the debugger sub-agent to analyze root cause and implement appropriate fixes for the specified issue

**Hotfix implementation workflow:**
1. > Use the backend-architect sub-agent to implement minimal, targeted fix for the specified issue
2. Security validation (for security issues): > Use the security-auditor sub-agent to validate security hotfix implementation
3. > Use the deployment-engineer sub-agent to execute emergency deployment for the specified issue

**Emergency mode:**
When --emergency flag is used, enable fast-track procedures and expedited validation (yarn run cmd validate-modified --fast).
```