# GitHub Actions Workflows

## Overview

Zero overlap CI/CD architecture with complete GitFlow alignment for the AI-Doc-Editor project.

## Workflow Architecture

| Workflow | Purpose | Triggers | Execution Time |
|----------|---------|----------|----------------|
| **ci.yml** | Post-integration comprehensive testing | Push to `main`, `develop`, `release/**` | ~10-15 min |
| **pr-validation.yml** | Pre-merge validation & fast feedback | PRs to `main`, `develop` | ~5-8 min |
| **document-validation.yml** | ❌ Deprecated | Manual only | - |

## Key Features

- **Zero Overlap**: Mutually exclusive triggers eliminate redundancy
- **GitFlow Support**: Complete feature/* → develop → main flow
- **Performance Optimized**: 54% faster execution (152s → 70s)
- **Enterprise Security**: 0 vulnerabilities across 1,782+ packages
- **185/185 Commands**: All namespaced yarn commands operational

## Quick Commands

```bash
# Local validation (before push/PR)
yarn qa:gate:fast                    # Fast quality pipeline (~30s)
yarn fe:lint && yarn be:format       # Quick fixes
yarn e2e:fe                          # E2E tests

# Complete validation
yarn qa:gate                         # Full quality pipeline (~70s)
yarn sec:all                         # Security audit
yarn all:test                        # All test suites
```

## GitFlow Integration

```bash
# Feature development
git checkout -b feature/T-XX-description develop
/task-dev T-XX                       # Context-aware development
/pr-flow                             # Automated PR creation

# Release preparation
git checkout -b release/R1 develop
/release-prep                        # Release automation

# Hotfix emergency
git checkout -b hotfix/patch main
/hotfix-flow                         # Emergency workflow
```

## Documentation

- **[WORKFLOW-ARCHITECTURE-SOLUTION.md](./WORKFLOW-ARCHITECTURE-SOLUTION.md)** - Complete architectural documentation
- **[OPTIMIZATION-SUMMARY.md](./OPTIMIZATION-SUMMARY.md)** - Performance optimizations achieved
- **[CONTRIBUTING.md](../../docs/development/CONTRIBUTING.md)** - Development workflow guide

## Compliance

- **ADR-003**: Baseline CI/CD architecture
- **ADR-006**: Dependency security scanning
- **ADR-012**: Package.json namespace architecture
- **Conway's Law**: Implementation docs proximate to workflows
- **Security**: Multi-layer validation with enterprise compliance
