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
yarn fe:build && yarn fe:test                      # Build & test
yarn sec:all                                       # Security audit

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

### Sub-Agent Coordination

- **Custom Commands**: 19 workflow orchestrators in .claude/commands/ that analyze context
- **Global Sub-Agents**: 40+ Claude Code specialists (security-auditor, frontend-developer, etc.)
- **Invocation**: Commands auto-select and delegate to appropriate sub-agents

## Essential Commands

**See also**: [GitHub Actions Workflows](.github/workflows/README.md) for CI/CD infrastructure details

### Daily Workflow Commands (Tier 1)

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

### Development Commands (PREFERRED - Namespaced)

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

### Specialized Commands (Tier 2)

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

### Advanced Commands (Tier 3)

```bash
# Production/Emergency use only
/release-prep                  # Release preparation workflow
/hotfix-flow                   # Hotfix workflow
/search-web                    # Web search integration
/explain-codebase              # Codebase explanation
```

### Quick Reference

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

## ⚡ CONSTANT VALIDATION Required

```bash
# ALWAYS validate after branch changes, context switches, or issues
/health-check                    # Immediate system validation
tools/progress-dashboard.sh      # Project status verification
yarn qa:gate                     # Multi-stack quality validation (~70s)
yarn qa:gate:dev                 # Development mode validation (~45s)
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
/architecture                    # Architecture integrity check
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
**Streamlined Architecture**: 5 essential scripts after 55% reduction (ADR-011 compliance)
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
/task-dev T-XX                           # Task development with context
/review-complete --scope T-XX            # Validation and review
/commit-smart                            # Mark development complete

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
# ✅ ZERO SECURITY FINDINGS ACHIEVED (January 2025)
yarn sec:all                   # Complete security pipeline: 0 vulnerabilities
yarn sec:deps:fe               # Frontend dependency security audit
yarn sec:deps:be               # Backend dependency security audit
yarn sec:sast                  # Static analysis security scan
yarn sec:secrets               # Secret scanning
/security-audit                # Comprehensive security assessment

# 🛡️ ENTERPRISE-GRADE SECURITY ACTIVE (0 vulnerabilities across 1,782+ packages):
# • Defense-in-depth: Multi-stack scanning (Node.js + Python)
# • OWASP Top 10: Complete compliance implemented
# • Command allowlisting: Injection prevention controls
# • Transport security: TLS 1.3+ with Perfect Forward Secrecy
# • Audit system: WORM-compliant tamper-proof logging

# 📚 Security Documentation
docs/architecture/adr/ADR-006-dependency-security-scanning.md  # Security architecture
docs/security/audits/general-security-audit-report.md         # Zero findings report
```

## Do Not Touch

**NEVER modify files in these categories:**

### Archive Directories (Historical Reference Only)
- `**/archive/` - Archived documentation (historical snapshots, DO NOT UPDATE)
- `.claude/commands/archive/` - Archived historical commands
- `docs/architecture/archive/` - Archived architecture docs (e.g., DESIGN_GUIDELINES-v1)
- `docs/reports/archive/` - Archived reports
- `legacy/` - Migrated Cypress files (see legacy/MIGRATION-README.md)

### Audit Reports & Deliverables (Point-in-Time Snapshots)
- Files matching `*audit*.md`, `*-audit-*.md` - Audit reports from specific dates
- Files matching `*-report.md`, `*REPORT*.md` - Formal reports and deliverables
- Files matching `*SUMMARY*.md`, `*-SUMMARY.md` - Completion summaries
- Examples:
  - `.claude/docs/audit-current-hooks-file.md` (now in archive/)
  - `docs/security/audits/general-security-audit-report.md`
  - `docs/reports/archive/phase-*-completion-report.md`

**Rationale**: Archives and audit reports are historical records. When updating documentation, create NEW versions or update CURRENT files, never modify archived/audit files.

### Temporary Files
- `test-*.js` - Temporary debugging files
- `.claude/hooks.json.backup-*` - Backup configurations (gitignored)
- `.claude/session-context.json` - Runtime session data (gitignored)

## 🎉 Modernization Success (100% Command Ecosystem + ADR-011 Compliance)

- **185/185 Commands**: 100% operational success rate
- **8 Namespaces**: repo:, fe:, be:, e2e:, sec:, qa:, docs:, all:
- **54% Performance**: Execution time optimized (152s → 70s)
- **0 Vulnerabilities**: Enterprise-grade security across 1,782+ packages
- **ADR-011 Compliance**: Dual directory architecture (tools/ vs scripts/)
- **Cross-Platform**: Windows/Linux/WSL auto-detection

**Migration Details:**
- `scripts/` - Infrastructure automation (5 essential scripts)
  - **ELIMINATED**: cli.cjs, qa-gate.cjs, generate-traceability*.cjs, security-scan.cjs, test-runner.cjs
  - **REMAINING**: multiplatform.cjs, merge-protection.cjs, install-merge-hooks.cjs, dev-runner.cjs, python-cc-gate.cjs
- `tools/` - Project workflow management (task navigation, progress tracking)
- `legacy/cypress/` - Cypress E2E tests replaced by Playwright (cleanup after validation)

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
# ✅ ALWAYS run after modifying package.json or adding scripts
yarn repo:install --frozen-lockfile     # Verify dependencies
yarn fe:build                           # Ensure frontend builds work
yarn all:test                           # Run all test suites
yarn qa:gate                            # Full quality pipeline (~70s)
```

## CLAUDE.md Self-Management & Governance

**Purpose**: Prevent format degradation and maintain structural integrity through systematic updates.

### Update Protocol

```bash
# ✅ MANDATORY: Use systematic update workflow
/update-claude-md "new content"         # Guided update with validation
/audit-claude-md                        # Quality audit + consolidation
tools/validate-claude-md.sh             # Structural validation

# ❌ NEVER: Direct manual edits without validation
```

### Decision Tree for Content Classification

```bash
Command Reference?
├─ Contains "yarn" → Essential Commands
├─ Contains "/" (slash cmd) → Essential Commands
├─ Contains "tools/" → Task Management Workflow
└─ Contains "scripts/" → Integration Policy

Rule/Policy?
├─ About editing CLAUDE.md → CLAUDE.md Editing Rules
├─ About security → Security & Compliance
├─ About quality → Quality Assurance
└─ About workflow → Integration Policy

Structure Info?
├─ Directory/file → Project Structure
├─ Archive reference → Do Not Touch
└─ Architecture → Integration Policy

Context/Status?
├─ Current branch/phase → Current Context
└─ Task pattern → Task Management Workflow
```

### Quality Thresholds

```bash
# Maintained via automated validation:
✓ Zero exact duplicates (was 8)
✓ <3 near-duplicates (85%+ similarity)
✓ All commands ≤5 lines
✓ All lines ≤200 characters
✓ 100% reference validity (yarn/slash/files)
✓ All 14 required sections present
✓ Quality score: 95+/100
```

### Rollback Conditions

```bash
# Automatic rollback if:
❌ Structure validation fails
❌ Duplicate introduced (>85% similarity)
❌ Broken reference (command/file doesn't exist)
❌ Format violation (line >200 chars)
❌ Quality score drops below 90
```

### Maintenance Commands

```bash
# Weekly: Audit for duplicates
/audit-claude-md --scope duplicates

# Monthly: Full quality assessment
/audit-claude-md

# After major changes: Validate structure
tools/validate-claude-md.sh --verbose

# Emergency: Rollback to last good version
git checkout HEAD~1 -- CLAUDE.md
```

## CLAUDE.md Editing Rules

```bash
# ✅ MANDATORY: Follow existing structure and style
# ✅ CONCISO: Max 3-5 lines per concept
# ✅ CLARO: Specific commands, not explanations
# ✅ DIRECTO: What to do (✅) and NOT do (❌)
# ✅ ESPECÍFICO: Use placeholders (<NUMBER>, <FILE>)
# ✅ VALIDADO: Run tools/validate-claude-md.sh before commit
# ❌ NO extensive documentation - keep compact
# ❌ NO manual edits - use /update-claude-md
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