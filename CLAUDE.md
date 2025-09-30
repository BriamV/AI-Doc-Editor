# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Document Editor: React 18 + TypeScript + Python FastAPI + AI integration
Features: AI-powered document generation, real-time collaboration, OAuth security
Repository: https://github.com/BriamV/AI-Doc-Editor/

## Tech Stack

- Frontend: React 18 + TypeScript + Vite + TailwindCSS
- Backend: Python FastAPI + SQLAlchemy + Alembic
- AI: OpenAI Chat Completions (GPT-4o, GPT-4, GPT-3.5-turbo) + Frontend Streaming
- Desktop: Electron + auto-updater
- State: Zustand + IndexedDB encryption
- Testing: Playwright E2E + Jest unit tests
- Tools: Multi-stack quality ecosystem (40+ tools integrated)
  - **Frontend**: ESLint, Prettier, Jest, TSC
  - **Python**: Black, Ruff, Radon, MyPy, pip-audit
  - **Security**: Semgrep, git-secrets, yarn sec:deps:fe
  - **Docs**: markdownlint, yamlfix, yamllint, spectral
  - **Shell**: shellcheck, shfmt
  - **Config**: taplo (TOML), prettier (JSON/XML/CSS)
  - **Infrastructure**: Docker, GitHub Actions, Claude Code hooks

## Development Setup

```bash
# Prerequisites: Node.js 18.16.0, Python 3.11+, WSL2 (Windows)
yarn repo:install && yarn all:dev                  # Start development
yarn fe:build && yarn fe:test             # Build & test
yarn sec:all                              # Security audit

# 🎉 MODERNIZATION COMPLETE: 185/185 commands working (100% success rate)
# 8 namespaces operational: repo:, fe:, be:, e2e:, sec:, qa:, docs:, all:
# Performance: 54% faster execution (152s → 70s)
# Security: 0 vulnerabilities achieved
```

## 🚨 MANDATORY: Sub-Agent First Workflow

1. **FIRST**: Use CUSTOM slash commands (.claude/commands/) for complex tasks
2. **SECOND**: Use namespaced yarn commands (185/185 working at 100%)
3. **LAST**: Direct CLI only if above unavailable
4. **NEVER**: Use eliminated scripts (cli.cjs, qa-gate.cjs, etc. - removed)

### **8 Namespace Architecture (100% Operational)**

- **repo:*** - Repository operations (clean, reset, status)
- **fe:*** - Frontend operations (build, test, lint, format)
- **be:*** - Backend operations (quality, format, lint, test)
- **e2e:*** - End-to-end testing (Playwright automation)
- **sec:*** - Security operations (scan, audit, validate)
- **qa:*** - Quality assurance (gates, validation, reports)
- **docs:*** - Documentation operations (validate, fix, generate)
- **all:*** - Cross-cutting operations (build, test, quality)

### Sub-Agent Architecture

- **Custom Commands**: 19 workflow orchestrators in .claude/commands/ that analyze context
- **Global Sub-Agents**: 40+ Claude Code specialists (security-auditor, frontend-developer, etc.)
- **Invocation**: Commands auto-select and delegate to appropriate sub-agents

## ⚡ CONSTANT VALIDATION Required

```bash
# ALWAYS validate after branch changes, context switches, or issues
/health-check                    # Immediate system validation
tools/progress-dashboard.sh      # Project status verification
yarn qa:gate                     # Multi-stack quality validation (~70s)
yarn qa:gate:dev                  # Development mode validation (~45s)
```

```bash
# Daily Workflow Commands (Tier 1)
/task-dev T-XX [complete]       # Task development with context
/review-complete [--scope]      # Multi-agent code review
/commit-smart                   # Intelligent commits
/pr-flow [--draft]              # Pull request automation
/merge-safety [--source --target] # MANDATORY merge protection
/health-check                   # System diagnostics
/docs-update [scope]            # Documentation maintenance
/auto-workflow [scope]          # Context-aware suggestions
/context-analyze [--depth]      # Project analysis

# Specialized Commands (Tier 2) - Use as needed
/security-audit /architecture /debug-analyze /pipeline-check
/deploy-validate /adr-create /issue-generate

# Advanced Commands (Tier 3) - Production/Emergency
/release-prep /hotfix-flow /search-web /explain-codebase

# Sub-Agent Invocation Pattern (Auto-handled by commands)
> Use the [AGENT] sub-agent to [SPECIFIC-TASK]
```

## Essential Commands

**See also**: [GitHub Actions Workflows](.github/workflows/README.md) for CI/CD infrastructure details

```bash
# Development (PREFERRED - Namespaced commands: 185/185 working)
yarn all:dev|fe:build|fe:test|sec:all

# Testing (Playwright E2E primary) - e2e: namespace
yarn e2e:fe                # Run E2E tests (Playwright)
yarn e2e:fe:headed         # Run with browser visible
yarn e2e:fe:debug          # Debug E2E tests
yarn e2e:fe:ui             # Interactive UI mode
yarn e2e:report            # Show HTML test report
yarn e2e:be                # Backend E2E tests

# Quality (automated via hooks - 54% performance optimized) - fe:/be: namespaces
yarn fe:lint|fe:format|fe:typecheck
yarn be:lint|be:format|be:typecheck

# Quality Gates (Multi-stack validation - qa: namespace)
yarn qa:gate                # Full quality pipeline (~70s)
yarn qa:gate:dev            # Development mode (~45s, skip heavy tools)
yarn qa:gate:fast           # Fast validation (~30s, essential only)
yarn qa:gate:monitored      # Monitored validation with timeouts

# Multi-tech validation (TypeScript + Python auto-detection) - fe:/be: namespaces
yarn fe:typecheck           # Frontend TypeScript validation
yarn be:quality             # Backend Python validation (format + lint + complexity)
yarn be:format              # Python autofix formatting (Black)
yarn be:lint                # Python autofix linting (Ruff)
yarn be:test                # Backend test suite
yarn be:test:coverage       # Backend test coverage

# Architecture & Integration (NEW)
yarn docs:architecture           # Dual directory compliance (ADR-011)
yarn e2e:integration             # Cross-directory interface testing

# 🛡️ MERGE PROTECTION (MANDATORY before merges)
yarn repo:merge:validate        # Complete merge safety validation
yarn repo:merge:precheck        # Pre-merge safety checks
yarn repo:merge:hooks:install   # Install git-level protection

# Repository operations - repo: namespace
yarn repo:clean                # Clean workspace (node_modules, dist, cache)
yarn repo:env:validate         # Environment validation
yarn repo:env:info             # Detailed environment information
yarn repo:licenses             # License information

# Environment validation & diagnostics (NEW - Unified Multiplatform)
yarn repo:env:validate     # Comprehensive environment diagnostics
yarn repo:env:info         # Detailed platform and tool information

# 📋 DOCUMENT ORGANIZATION - docs: namespace
yarn docs:validate           # Document placement validation (PowerShell/WSL/Linux)
yarn docs:validate:fix       # Auto-fix misplaced documents
yarn docs:validate:strict    # Strict validation (CI/CD mode)
yarn docs:validate:report    # Generate placement report
yarn docs:api:lint           # API documentation linting
yarn docs:api:bundle         # API documentation bundling

# 🎉 NAMESPACE ARCHITECTURE SUCCESS:
# 185/185 commands operational (100% success rate)
# 8 namespaces: repo:, fe:, be:, e2e:, sec:, qa:, docs:, all:
# Performance: 54% faster execution (152s → 70s)
# Legacy aliases maintained for compatibility
```

## Project Structure

- `src/components/` - React components (Chat, Document, Menu)
- `src/store/` - Zustand stores (docs, auth, config)
- `backend/` - Python FastAPI backend + .venv
  - `backend/app/` - Main FastAPI application code
  - `backend/tests/` - Integration, performance, security tests
  - `backend/scripts/` - Database utilities, security validation
  - `backend/reports/` - Generated analysis reports
- `docs/` - Spanish documentation (primary)
- `src/docs/` - **NEW** Frontend implementation docs (React, Zustand, hooks)
- `src/docs/ai/` - **NEW** AI implementation docs (frontend patterns, integration)
- `backend/docs/` - Backend implementation docs (API, database, security)
- `docs/architecture/ai/` - **NEW** AI architecture docs (strategy, audit, implementation)
- `.github/workflows/` - CI/CD automation ([detailed docs](.github/workflows/README.md))
- `.claude/commands/` - 19 production slash commands
- `tools/` - Task management scripts (project workflow)
- `scripts/` - **STREAMLINED** Infrastructure automation (5 essential scripts)

## 🏗️ Dual Directory Architecture (ADR-011)

**GOVERNANCE: Strict separation between workflow tools and infrastructure scripts**

### **tools/ - Project Workflow Management**

```bash
# ✅ Project-specific workflows, task management, progress tracking
tools/task-navigator.sh T-XX         # Task development workflows
tools/progress-dashboard.sh          # Project status dashboards
tools/extract-subtasks.sh T-XX       # Development planning
tools/validate-dod.sh T-XX           # Definition of Done validation
tools/qa-workflow.sh T-XX            # Quality assurance workflows
```

### **scripts/ - Infrastructure Automation**

```bash
# ✅ Build tools, CI/CD automation, development environment setup
scripts/multiplatform.cjs            # Platform detection & environment
scripts/merge-protection.cjs         # Git merge safety automation
scripts/install-merge-hooks.cjs      # Git hooks installation
scripts/dev-runner.cjs               # Development server automation
scripts/python-cc-gate.cjs           # Python quality gate automation
```

### **Integration Validation**

```bash
# ✅ Validate dual directory compliance
yarn docs:architecture           # Directory structure compliance
/architecture                        # Architecture integrity check
yarn e2e:integration             # Cross-directory interface testing
```

**Scopes & Interface Contracts:**

- **tools/**: Project domain, task context, workflow orchestration
- **scripts/**: Infrastructure domain, build automation, environment setup
- **Error Handling**: Standardized exit codes, structured logging
- **Integration**: Clear APIs between workflow and infrastructure layers

## 🔧 Quality Tools Ecosystem (40+ Tools)

**Hooks-Integrated Multi-Stack Pipeline:**

```bash
# Frontend Quality
eslint, prettier, jest, tsc              # TypeScript/JavaScript

# Python Backend Quality
black, ruff, radon, mypy, pip-audit      # Python quality gates

# Security & Secrets
semgrep, git-secrets, yarn sec:deps:fe   # Security scanning

# Documentation
markdownlint, yamlfix, yamllint, spectral # Docs quality
# Template validation (README consistency + placement guidelines)

# Configuration & Shell
taplo, shellcheck, shfmt                 # Config + shell scripts

# Multi-Format Support
prettier (JSON/XML/CSS/HTML)             # Universal formatting
```

**Auto-Detection**: Windows/Linux/WSL + multi-venv support
**Streamlined Architecture**: 6 essential scripts remain after 55% reduction (ADR-011 compliance + cross-platform wrapper)
**Error Handling**: Standardized exit codes + structured logging
**Integration Testing**: Cross-directory interface validation

## Quality Assurance

- **Multi-Stack Pipeline**: 40+ tools integrated via .claude/hooks.json
- **Auto-formatting**: Real-time format on Edit/Write/MultiEdit
  - TypeScript/JavaScript: ESLint + Prettier
  - Python: Black + Ruff (autofix)
  - Docs: markdownlint + yamlfix + template validation
  - Shell: shellcheck + shfmt
  - Config: taplo (TOML) + prettier (JSON/XML/CSS)
- **Design Metrics**: Complexity (CC≤15) + LOC (≤300) validation
  - **Green Zone** (optimal): CC ≤ 10, LOC ≤ 212
  - **Yellow Zone** (acceptable): CC 11-15, LOC 213-300
  - **Red Zone** (blocks commit): CC > 15, LOC > 300
- **Security Gates**: Semgrep + git-secrets + dependency audits
- **Performance**: 54% optimized (152s → 70s total timeout)
- **Multi-OS**: Windows/Linux/WSL auto-detection
- **Compliance**: OAuth 2.0, TLS 1.3+, AES-256, GDPR

## Task Management Workflow

```bash
# Use custom slash commands for workflow automation (PREFERRED)
/context-analyze                         # Project progress analysis
/task-dev T-XX                          # Task development with context
/review-complete --scope T-XX           # Validation and review
/commit-smart                           # Mark development complete

# Legacy bash tools (still functional but use slash commands when possible)
tools/progress-dashboard.sh              # Project progress
tools/task-navigator.sh T-XX             # Task details
tools/extract-subtasks.sh T-XX           # Development planning
tools/validate-dod.sh T-XX               # Definition of Done validation
tools/qa-workflow.sh T-XX dev-complete   # Mark development complete
```

## Current Context

- **Branch**: develop
- **Phase**: R0.WP3 (Seguridad y Auditoría)
- **Language**: Spanish docs, English code
- **Pattern**: T-XX task identification
- **Status**: docs/project-management/status/R0-RELEASE-STATUS.md

## Sub-Agent Architecture

**MANDATORY**: Prioritize sub-agents for complex analysis tasks

### Agent Selection Policy

✅ **Use sub-agents for** (delegate immediately):
- Code analysis → technical-researcher
- Security audits → security-auditor
- Architecture review → backend-architect, frontend-developer
- Multi-file investigation → general-purpose
- Test automation → test-automator
- Refactoring/debugging → debugger

❌ **Main thread only for**:
- Sub-agent coordination
- Brief confirmations (< 3 lines)
- Single command execution
- User interaction prompts

### Available Agents

- **Global Sub-Agents**: 40+ Claude Code specialists (security-auditor, backend-architect, frontend-developer, test-automator, debugger, technical-researcher, code-reviewer, general-purpose)
- **Local Project Agent**: workflow-architect (specialized for this project's workflow orchestration)
- **Custom Commands**: Auto-select appropriate sub-agents via .claude/commands/ (19 workflow orchestrators)

### Invocation Pattern

```bash
# Automatic delegation via slash commands (PREFERRED)
/security-audit          # → security-auditor sub-agent
/architecture            # → backend-architect sub-agent
/review-complete         # → code-reviewer sub-agent

# Manual invocation pattern (when needed)
> Use the [technical-researcher] sub-agent to analyze hooks implementation
```

## GitHub Issues Management

```bash
# ✅ ALWAYS specify target repository (this repo has forks)
gh issue view <NUMBER> --repo BriamV/AI-Doc-Editor          # View issue
gh issue close <NUMBER> --repo BriamV/AI-Doc-Editor -c "..." # Close issue

# ❌ NEVER use without --repo flag (targets wrong repository)
gh issue view <NUMBER>                                      # WRONG
```

## Security & Compliance

```bash
# ✅ ZERO SECURITY FINDINGS ACHIEVED (January 2025) - sec: namespace
yarn sec:all                                # Complete security pipeline: 0 vulnerabilities
yarn sec:deps:fe                            # Frontend dependency security audit
yarn sec:deps:be                            # Backend dependency security audit
yarn sec:sast                               # Static analysis security scan
yarn sec:secrets                            # Secret scanning
/security-audit                            # Comprehensive security assessment
/docs-update                               # Traceability matrix via commands

# 🛡️ ENTERPRISE-GRADE SECURITY ACTIVE (0 vulnerabilities across 1,782+ packages):
# • Defense-in-depth: Multi-stack scanning (Node.js + Python)
# • OWASP Top 10: Complete compliance implemented
# • Command allowlisting: Injection prevention controls
# • Transport security: TLS 1.3+ with Perfect Forward Secrecy
# • Audit system: WORM-compliant tamper-proof logging
# • Namespace security: sec: commands validate all aspects

# 📚 Security Documentation
docs/architecture/adr/ADR-006-dependency-security-scanning.md  # Security architecture
docs/security/audits/general-security-audit-report.md         # Zero findings report

# ✅ MODERN PATTERNS: Use namespaced commands
# yarn sec:sast               <- Modern security scanning
# yarn sec:deps:fe            <- Frontend dependency security audit
# yarn docs:api:bundle        <- Documentation generation
# /security-audit             <- Comprehensive slash command
```

## Do Not Touch

- Historical task file archived - Use tools/task-navigator.sh for current tasks
- `.claude/commands/archive/` - Archived historical commands
- `test-*.js` - Temporary debugging files
- `.claude/hooks.json.backup` - Backup configuration
- `legacy/` - Migrated Cypress files (see legacy/MIGRATION-README.md)

## 🎉 Modernization Success (100% Command Ecosystem + ADR-011 Compliance)

- **Dual Directory Architecture**: tools/ (workflow) vs scripts/ (infrastructure) - ADR-011
- `scripts/` - **MODERNIZED** - Infrastructure automation (5 essential scripts)
  - **ELIMINATED**: cli.cjs, qa-gate.cjs, generate-traceability\*.cjs, security-scan.cjs, test-runner.cjs
  - **REMAINING**: multiplatform.cjs, merge-protection.cjs, install-merge-hooks.cjs, dev-runner.cjs, python-cc-gate.cjs
  - Migration to namespaced yarn commands completed (185/185 working, 54% faster execution)
- `tools/` - **SPECIALIZED** - Project workflow management (task navigation, progress tracking)
- **Error Handling**: Standardized across both directories with structured logging
- `legacy/cypress/` - **MIGRATED** - Cypress E2E tests replaced by Playwright
  - `yarn test:cypress` - Legacy Cypress commands (use `yarn e2e:fe` instead)
  - All legacy commands maintain compatibility while promoting modern namespaced alternatives
  - Migration completed: All E2E testing now uses Playwright
- Timeline: Final legacy/ cleanup after Playwright validation phase

## Integration Policy

All enhancements MUST integrate into workflow:

1. Document in CLAUDE.md with concrete commands
2. Map to existing tools/scripts
3. Test before documenting
4. Remove redundancies

### 📋 Package.json Script Standards

**MANDATORY**: Follow structured namespace architecture when adding scripts

- **Guidelines**: docs/development/PACKAGE-JSON-SCRIPTS-GUIDELINES.md
- **Architecture**: docs/architecture/adr/ADR-012-package-json-namespace-architecture.md
- **Pattern**: `namespace:action[:modifier][:subaction]`
- **Validation**: Must use multiplatform wrapper for system commands

## 🔨 POST-BUILD VALIDATION Protocol

**MANDATORY after package.json changes or new scripts:**

```bash
# ✅ ALWAYS run after modifying package.json or adding scripts (all: namespace)
yarn repo:install --frozen-lockfile          # Verify dependencies
yarn fe:build                           # Ensure frontend builds work
yarn all:test                           # Run all test suites
yarn qa:gate                            # Full quality pipeline (~70s)
# ✅ 185/185 commands operational (100% success rate)
# ✅ 8 namespaces: repo:, fe:, be:, e2e:, sec:, qa:, docs:, all:
# ✅ Performance: 54% faster execution (152s → 70s)
# ✅ Security: 0 vulnerabilities across 1,782+ packages
```

## CLAUDE.md Editing Rules

```bash
# ✅ MANDATORY: Follow existing structure and style
# ✅ CONCISO: Max 3-5 lines per concept
# ✅ CLARO: Specific commands, not explanations
# ✅ DIRECTO: What to do (✅) and NOT do (❌)
# ✅ ESPECÍFICO: Use placeholders (<NUMBER>, <FILE>)
# ❌ NO extensive documentation - keep compact
```

## 📋 Documentation Standards & Templates

### **Template Usage (REQUIRED for README creation)**

```bash
# 1. Evaluate content type and placement
docs/templates/DOCUMENTATION-PLACEMENT-GUIDELINES.md

# 2. Select appropriate template from 6 categories:
# - User-Facing Application (main project entry)
# - Technical Infrastructure (tools/scripts)
# - Documentation Hub (navigation/organization)
# - Implementation Guide (code-proximate docs)
# - Architecture Reference (ADRs/formal decisions)
# - Claude Code Integration (commands/automation)

# 3. Validate compliance before committing
docs/templates/README-VALIDATION-CHECKLIST.md
```

### **Quality Requirements**

✅ **MANDATORY**: Template compliance for all new READMEs
✅ **MANDATORY**: Conway's Law compliance (implementation docs ≤2 dirs from code)
✅ **MANDATORY**: 4-tier navigation table (user-facing docs)
✅ **MANDATORY**: Bilingual standards (Spanish user-facing, English technical)
✅ **VALIDATION**: 95%+ working cross-references, 90%+ template adherence

### **Quick Template Selection**

- **Main project README**: User-Facing Application template
- **Tools/scripts dirs**: Technical Infrastructure template
- **docs/ navigation**: Documentation Hub template
- **src/docs/ or backend/docs/**: Implementation Guide template
- **ADR collections**: Architecture Reference template
- **.claude/ directories**: Claude Code Integration template

## 🛡️ MERGE PROTECTION SYSTEM

**CRITICAL: NEVER merge without running these commands first**

```bash
# 🚨 MANDATORY BEFORE ANY MERGE
/merge-safety                    # Complete merge protection (REQUIRED)
yarn repo:merge:validate         # Alternative yarn command
yarn repo:merge:hooks:install    # Install git-level protection (once)

# Emergency validation (if hooks fail)
yarn repo:merge:precheck         # Pre-merge safety only

# ⚠️ DANGER: Emergency override (NEVER use unless critical)
# git merge --no-verify <branch>  # BYPASSES ALL PROTECTION
```

**Protection Features:**

- 📊 File count comparison (prevents 250+ file loss)
- 📁 Critical directory structure validation
- 📄 Essential file existence checks
- ⚙️ Configuration integrity verification
- 📋 Development status consistency
- 🏛️ ADR files presence validation
- 🔒 Git hooks for native protection
- 🚫 Automatic merge blocking on failures

## Quick Reference

- 📋 **Task details**: `/task-dev T-XX`
- 🔍 **Codebase analysis**: `/context-analyze`
- 🛡️ **Merge safety**: `/merge-safety`
- 🚀 **Full command list**: `/auto-workflow`
- 📊 **Progress**: `tools/progress-dashboard.sh`

### **🎯 Namespace Quick Commands (185/185 operational)**

- **🏗️ Build**: `yarn all:build` (frontend + backend)
- **🧪 Test**: `yarn all:test` (complete test suite)
- **🛡️ Security**: `yarn sec:all` (0 vulnerabilities)
- **⚡ Quality**: `yarn qa:gate` (70s pipeline)
- **📚 Docs**: `yarn docs:validate` (placement + quality)
- **🔄 Repo**: `yarn repo:clean` (workspace cleanup)

### **📊 Modernization Achievements**

- **185/185 Commands**: 100% operational success rate
- **8 Namespaces**: Complete coverage (repo:, fe:, be:, e2e:, sec:, qa:, docs:, all:)
- **54% Performance**: Execution time optimized (152s → 70s)
- **0 Vulnerabilities**: Enterprise-grade security across 1,782+ packages
- **ADR-011 Compliance**: Dual directory architecture implemented
- **Cross-Platform**: Windows/Linux/WSL auto-detection
