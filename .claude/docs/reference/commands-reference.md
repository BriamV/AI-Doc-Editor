# Essential Commands Reference

**Usage**: This file is imported by CLAUDE.md via @import
**Context**: Complete 185-command catalog organized by tier and namespace

**See also**: [GitHub Actions Workflows](../../.github/workflows/README.md) for CI/CD infrastructure details

## Daily Workflow Commands (Tier 1)

```bash
/task-dev T-XX [complete]       # Task development with context
/review-complete [--scope]      # Multi-agent code review
/commit-smart                   # Intelligent commits
/pr-flow [--draft]              # Pull request automation
/merge-safety [--source --target] # MANDATORY merge protection
/health-check                   # System diagnostics
/docs-update [scope]            # Documentation maintenance
/auto-workflow [scope]          # Context-aware suggestions
/context-analyze [--depth]      # Project analysis
```

## Development Commands (PREFERRED - Namespaced)

```bash
# Development & Testing - e2e: namespace
yarn all:dev                   # Start all development servers
yarn fe:build                  # Frontend production build
yarn fe:test                   # Frontend unit tests (Jest)
yarn e2e:fe                    # E2E tests (Playwright)
yarn e2e:fe:headed             # E2E with browser visible
yarn e2e:fe:debug              # Debug E2E tests
yarn e2e:fe:ui                 # Interactive UI mode
yarn e2e:report                # Show HTML test report
yarn e2e:be                    # Backend E2E tests
yarn e2e:integration           # Cross-directory interface testing

# Quality Assurance - qa: namespace
yarn qa:gate                   # Full quality pipeline (~70s)
yarn qa:gate:dev               # Development mode (~45s, skip heavy tools)
yarn qa:gate:fast              # Fast validation (~30s, essential only)
yarn qa:gate:monitored         # Monitored validation with timeouts

# Frontend Quality - fe: namespace
yarn fe:lint                   # Frontend linting (ESLint)
yarn fe:format                 # Frontend formatting (Prettier)
yarn fe:typecheck              # TypeScript validation

# Backend Quality - be: namespace
yarn be:quality                # Backend Python validation (format + lint + complexity)
yarn be:format                 # Python autofix formatting (Black)
yarn be:lint                   # Python autofix linting (Ruff)
yarn be:typecheck              # Python type checking (MyPy)
yarn be:test                   # Backend test suite
yarn be:test:coverage          # Backend test coverage

# Security - sec: namespace
yarn sec:all                   # Complete security pipeline: 0 vulnerabilities
yarn sec:deps:fe               # Frontend dependency security audit
yarn sec:deps:be               # Backend dependency security audit
yarn sec:sast                  # Static analysis security scan
yarn sec:secrets               # Secret scanning

# Documentation - docs: namespace
yarn docs:validate             # Document placement validation
yarn docs:validate:fix         # Auto-fix misplaced documents
yarn docs:validate:strict      # Strict validation (CI/CD mode)
yarn docs:validate:report      # Generate placement report
yarn docs:api:lint             # API documentation linting
yarn docs:api:bundle           # API documentation bundling
yarn docs:architecture         # Dual directory compliance (ADR-011)

# Repository Operations - repo: namespace
yarn repo:clean                # Clean workspace (node_modules, dist, cache)
yarn repo:install              # Install all dependencies
yarn repo:env:validate         # Environment validation
yarn repo:env:info             # Detailed environment information
yarn repo:licenses             # License information
yarn repo:merge:validate       # Complete merge safety validation
yarn repo:merge:precheck       # Pre-merge safety checks
yarn repo:merge:hooks:install  # Install git-level protection
```

## Specialized Commands (Tier 2)

```bash
# Use as needed for specific tasks
/security-audit                # Comprehensive security assessment
/architecture                  # Architecture integrity check
/debug-analyze                 # Debug analysis
/pipeline-check                # CI/CD pipeline validation
/deploy-validate               # Deployment validation
/adr-create                    # Create Architecture Decision Record
/issue-generate                # Generate GitHub issues
```

## Advanced Commands (Tier 3)

```bash
# Production/Emergency use only
/release-prep                  # Release preparation workflow
/hotfix-flow                   # Hotfix workflow
/search-web                    # Web search integration
/explain-codebase              # Codebase explanation
```

## CLAUDE.md Management (NEW)

```bash
/update-claude-md "<content>"        # Systematic CLAUDE.md updates with validation
/audit-claude-md [--scope <type>]    # Quality audit + consolidation recommendations
```

## Quick Reference

```bash
# Most used commands
/task-dev T-XX                 # Task details & development
/context-analyze               # Project progress analysis
/merge-safety                  # MANDATORY before merges
/health-check                  # System validation
tools/progress-dashboard.sh    # Visual progress dashboard

# Namespace quick commands (185/185 operational)
yarn all:build                 # Frontend + backend build
yarn all:test                  # Complete test suite
yarn sec:all                   # Security audit (0 vulnerabilities)
yarn qa:gate                   # Quality pipeline (70s)
yarn docs:validate             # Documentation quality
yarn repo:clean                # Workspace cleanup
```