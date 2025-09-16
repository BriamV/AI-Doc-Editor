# CI/CD Commands - Sub-Agent Delegation

This directory contains CI/CD and deployment workflow commands that leverage Claude Code's sub-agent delegation system for automated pipeline management, deployment validation, and emergency response procedures.

## Available Commands

### `/pipeline-check` - Pipeline Validation
- **Purpose**: Pre-push pipeline validation with automated troubleshooting
- **Sub-agents**: `devops-troubleshooter` (primary), `security-auditor` (security failures)
- **Integration**: GitHub Actions, local validation via `!yarn run cmd validate-staged`
- **Context**: Auto-detects workflow based on branch (feature/develop/release/hotfix)

### `/deploy-validate` - Deployment Readiness
- **Purpose**: Pre-deployment validation with comprehensive health checks
- **Sub-agents**: `deployment-engineer` (primary), `cloud-architect` (health checks), `security-auditor` (production)
- **Integration**: Docker validation, build verification, environment-specific checks
- **Context**: Auto-detects environment from branch (main=production, develop=staging)

### `/hotfix-flow` - Emergency Response
- **Purpose**: Complete emergency hotfix workflow with rapid resolution
- **Sub-agents**: `debugger`/`security-auditor` (analysis), `backend-architect` (implementation), `deployment-engineer` (deployment)
- **Integration**: Emergency procedures, fast-track validation, automated rollback prep
- **Context**: Auto-detects issue ID from branch or commit messages

## Sub-Agent Integration Pattern

All commands follow Claude Code's official sub-agent delegation best practices:

```bash
echo "> Use the [agent-name] sub-agent to [specific-task-with-context]"
```

### Specialized Sub-Agents Used

- **devops-troubleshooter**: Pipeline analysis, CI/CD issue resolution
- **deployment-engineer**: Deployment validation, infrastructure management
- **security-auditor**: Security validation, vulnerability assessment
- **cloud-architect**: Infrastructure health, scalability validation
- **debugger**: Issue analysis, root cause identification
- **performance-engineer**: Performance optimization, bottleneck analysis

## Integration Points

- **GitHub Actions**: `gh workflow` commands, pipeline status analysis
- **Docker**: Health checks via existing `!yarn run cmd docker-*` commands
- **Validation**: Integration with `!yarn run cmd validate-*` ecosystem
- **Emergency Procedures**: Fast-track validation, automated rollback preparation

## Context Detection

Commands automatically detect:
- Current git branch and workflow context
- Deployment environment: production, staging, development
- Issue type and urgency: security, performance, critical, general
- Pipeline status and failure patterns
- Build and deployment readiness

This enables intelligent sub-agent selection and workflow orchestration without manual specification.