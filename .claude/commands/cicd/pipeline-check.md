# Pipeline Check - Sub-Agent Delegation

---
description: Validate CI/CD pipeline status with automated troubleshooting through specialized sub-agent delegation
argument-hint: "[workflow] [--validate]"
allowed-tools: Bash(gh *), Bash(git *), Bash(yarn *), Read, Grep
model: claude-3-5-sonnet-20241022
---

## Purpose

Pre-push pipeline validation and health check using sub-agent delegation. Analyzes workflow status and automatically invokes specialized troubleshooting agents.

## Usage

```bash
/pipeline-check                    # Auto-detect workflows from branch
/pipeline-check ci                 # Specific workflow validation
/pipeline-check --validate         # Full pipeline validation mode
```

## Context (auto-collected)
- Current branch: !`git branch --show-current`
- Workflow status: !`gh run list --workflow=ci.yml --limit=3 --json conclusion,status`
- Local validation: !`yarn qa-gate 2>&1 | head -5`
- Recent commits: !`git log --oneline -3`

## Implementation

Parse `$ARGUMENTS` for workflow name and validate flag. Auto-detect workflow from branch context if not specified.

**Sub-agent delegation based on pipeline status:**

- **Pipeline failures**:
  > Use the devops-troubleshooter sub-agent to analyze and resolve GitHub Actions workflow failures for the specified workflow

- **Security failures** (when detected):
  > Use the security-auditor sub-agent to investigate security validation failures in CI pipeline

- **Pipeline success with validation flag**:
  > Use the devops-troubleshooter sub-agent to perform comprehensive pipeline validation before deployment

- **Unclear pipeline status**:
  > Use the devops-troubleshooter sub-agent to diagnose current pipeline status and ensure CI/CD reliability

**Local validation integration:**
Run validation tools (yarn qa-gate) to ensure local changes meet pipeline requirements.
```