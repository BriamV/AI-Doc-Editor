# Health-Check - Comprehensive System Validation

---
description: Health check completo: código + dependencias + pipeline + docs
argument-hint: "[component] [--fix]"
allowed-tools: Bash(yarn *), Bash(npm audit), Bash(bash tools/*), Read, LS, Glob
# ⚠️ Legacy Note: Prefer direct yarn commands over yarn run cmd patterns
model: claude-3-5-sonnet-20241022
---

## Purpose
Performs comprehensive health analysis of code quality, dependencies, CI/CD pipeline, documentation completeness, and system infrastructure with intelligent issue detection.

## Usage
```bash
/health-check                     # Complete system health analysis
/health-check code                # Focus on code quality health
/health-check deps                # Focus on dependency health  
/health-check pipeline            # Focus on CI/CD pipeline health
/health-check docs                # Focus on documentation health
/health-check --fix               # Include auto-fix suggestions
```

## Context (auto-collected)
- Current branch: !`git branch --show-current`
- Project status: !`bash tools/progress-dashboard.sh --brief`
- Recent errors: !`yarn fe:typecheck 2>&1 | tail -5`
- System info: !`node --version && npm --version`
- Legacy check: !`echo "⚠️ Using direct yarn commands (scripts/cli.cjs deprecated)"`

## Implementation

Parse `$ARGUMENTS` for component focus and fix mode. Perform comprehensive system health analysis with specialized sub-agent delegation.

**Primary health analysis:**
> Use the devops-troubleshooter sub-agent to perform comprehensive system health analysis and identify critical issues

**Component-specific health checks:**

- **Code quality health**:
  > Use the security-auditor sub-agent to analyze code security health and identify vulnerabilities
  Integration: yarn qa-gate

- **Dependency health**:
  > Use the devops-troubleshooter sub-agent to analyze dependency vulnerabilities and compatibility issues
  Integration: npm audit --audit-level=moderate, yarn audit

- **CI/CD pipeline health**:
  > Use the devops-troubleshooter sub-agent to analyze CI/CD pipeline status and deployment readiness
  Integration: git status analysis

- **Documentation health**:
  > Use the api-documenter sub-agent to analyze documentation completeness and quality
  Integration: /docs-update command

- **Full system health** (default):
  > Use the devops-troubleshooter sub-agent to provide comprehensive system health report with prioritized recommendations
  > Use the performance-engineer sub-agent to analyze system performance health and optimization opportunities

**Auto-fix mode:**
When --fix flag is used:
> Use the devops-troubleshooter sub-agent to provide automated fix recommendations with specific commands for identified health issues
Integration: yarn fe:lint:fix, yarn fe:format
```