# Deploy Validate - Sub-Agent Delegation

---
description: Pre-deployment validation with health checks using specialized deployment engineering sub-agents
argument-hint: "[environment] [--health-check]"
allowed-tools: Bash(npm run *), Bash(yarn run cmd *), Bash(git *), Read, Grep
model: claude-3-5-sonnet-20241022
---

## Purpose

Comprehensive pre-deployment validation using sub-agent delegation. Analyzes deployment readiness and invokes specialized validation agents based on environment context.

## Usage

```bash
/deploy-validate                   # Auto-detect environment from branch
/deploy-validate production        # Specific environment validation
/deploy-validate --health-check    # Full health check mode
```

## Context (auto-collected)
- Current branch: !`git branch --show-current`
- Build status: !`npm run build >/dev/null 2>&1 && echo "ok" || echo "failed"`
- Test results: !`yarn run cmd test 2>&1 | tail -3`
- Security audit: !`npm audit --audit-level=high --format=json | head -5`

## Implementation

Parse `$ARGUMENTS` for environment and health-check flag. Auto-detect environment from branch (main → production, develop/release → staging, hotfix → production, default → development).

**Sub-agent delegation based on deployment context:**

- **Build failures**:
  > Use the deployment-engineer sub-agent to resolve build issues for the target environment deployment

- **Production deployment** (with security validation):
  > Use the deployment-engineer sub-agent to perform production readiness validation with comprehensive security and performance checks
  > Use the security-auditor sub-agent to validate security requirements for production deployment

- **Staging deployment**:
  > Use the deployment-engineer sub-agent to validate staging configuration and environment compatibility

- **Development deployment**:
  > Use the deployment-engineer sub-agent to ensure development environment compatibility

**Health check mode:**
When --health-check flag is used:
> Use the cloud-architect sub-agent to validate infrastructure health for the target environment

**Frontend validation integration:**
Run frontend validation (yarn run cmd validate-frontend --fast) as part of deployment readiness check.
```