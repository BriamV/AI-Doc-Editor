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

**Complete 185-Command Reference**: @.claude/docs/commands-reference.md

**Daily Workflow (Most Used)**:

```bash
/task-dev T-XX [complete]       # Task development with context
/merge-safety                   # MANDATORY merge protection
/health-check                   # System diagnostics
/review-complete [--scope]      # Multi-agent code review
/commit-smart                   # Intelligent commits
```

**Quick Access by Category**:

```bash
# Development & Testing
yarn all:dev                   # Start all development servers
yarn fe:build                  # Frontend production build
yarn fe:test                   # Frontend unit tests (Jest)
yarn e2e:fe                    # E2E tests (Playwright)

# Quality & Security
yarn qa:gate                   # Full quality pipeline (~70s)
yarn qa:gate:dev               # Development mode (~45s)
yarn sec:all                   # Complete security pipeline

# Repository Operations
yarn repo:clean                # Clean workspace
yarn repo:install              # Install dependencies
yarn repo:merge:validate       # Merge safety validation
```

**See imported commands-reference.md for**:
- Complete 8-namespace breakdown (repo:, fe:, be:, e2e:, sec:, qa:, docs:, all:)
- Tier 1/2/3 slash commands organization
- Specialized workflow commands
- CLAUDE.md management commands
- Performance timings and usage patterns

## ⚡ CONSTANT VALIDATION Required

```bash
# ALWAYS validate after branch changes, context switches, or issues
# See also: MERGE PROTECTION SYSTEM section (end of file)
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
- `src/docs/` - Frontend implementation docs (React, Zustand, hooks)
- `src/docs/ai/` - AI implementation docs (frontend patterns, integration)
- `backend/docs/` - Backend implementation docs (API, database, security)
- `docs/architecture/ai/` - AI architecture docs (strategy, audit, implementation)
- `.github/workflows/` - CI/CD automation ([detailed docs](.github/workflows/README.md))
- `.claude/commands/` - 19 production slash commands
- `tools/` - Task management scripts (project workflow)
- `scripts/` - Infrastructure automation (5 essential scripts)

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

## 🔧 Quality Tools Ecosystem

**Complete 40+ Tools Reference**: @.claude/docs/quality-tools-reference.md

**Key Tools Integration:**

```bash
# Frontend Quality
eslint, prettier, jest, tsc              # TypeScript/JavaScript

# Python Backend Quality
black, ruff, radon, mypy, pip-audit      # Python quality gates

# Security & Secrets
semgrep, git-secrets, yarn sec:deps:fe   # Security scanning

# Documentation
markdownlint, yamlfix, yamllint, spectral # Docs quality

# Configuration & Shell
taplo, shellcheck, shfmt                 # Config + shell scripts
```

**See imported quality-tools-reference.md for**:
- Complete hooks-integrated pipeline details
- Auto-detection (Windows/Linux/WSL + multi-venv)
- Streamlined architecture (5 essential scripts, ADR-011 compliance)
- Error handling (standardized exit codes + structured logging)
- Integration testing (cross-directory interface validation)

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

**Complete Security Commands**: See Essential Commands → @.claude/docs/commands-reference.md

### Security Status (Sept 2025)

```bash
# ✅ ZERO SECURITY FINDINGS: 0 vulnerabilities (1,782+ packages)
yarn sec:all                         # Complete security pipeline
/security-audit                      # Comprehensive assessment

# 🛡️ ENTERPRISE-GRADE: 0 vulnerabilities (1,782+ packages)
# • Multi-stack (Node/Python), OWASP Top 10, TLS 1.3+, WORM audit
# • Defense-in-depth + injection prevention + perfect forward secrecy
```

**Documentation**:
- Security architecture: docs/architecture/adr/ADR-006-dependency-security-scanning.md
- Zero findings report: docs/security/audits/general-security-audit-report.md

## Do Not Touch

**Complete Protected Files Policy**: @.claude/docs/protected-files-policy.md

**NEVER modify**:
- `**/archive/` directories (historical snapshots)
- Files matching `*audit*.md`, `*-report.md`, `*SUMMARY*.md` (point-in-time records)
- Temporary files (test-*.js, *.backup-*, session-context.json)

**Rationale**: Archives and audit reports are historical records. When updating documentation, create NEW versions or update CURRENT files, never modify archived/audit files.

**See imported protected-files-policy.md for**:
- Complete archive directory listing
- Audit report patterns and examples
- Temporary file patterns
- Detailed rationale for protection policy

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

## CLAUDE.md Self-Management

**Complete Management System**: @.claude/docs/self-management-guide.md

### Update Protocol (MANDATORY)

```bash
# ✅ MANDATORY: Use systematic update workflow
/update-claude-md "<content>"    # Guided update with validation
/audit-claude-md                 # Quality audit + consolidation
tools/validate-claude-md.sh      # Structural validation

# ❌ NEVER: Direct manual edits without validation
```

**Quality Thresholds**: Zero duplicates, <3 near-duplicates, ≤200 chars/line, 95+ score

**See imported self-management-guide.md for**:
- Complete update protocol and decision trees
- Quality threshold details and metrics
- Rollback conditions and emergency procedures
- Maintenance schedule (weekly/monthly/after-changes)
- Content classification flowchart

## CLAUDE.md Editing Rules

```bash
# ✅ MANDATORY: Follow existing structure and style
# ✅ MANDATORY: Use /update-claude-md for systematic updates
# ✅ MANDATORY: Run /audit-claude-md monthly
# ✅ CONCISO: Max 3-5 lines per concept
# ✅ CLARO: Specific commands, not explanations
# ✅ DIRECTO: What to do (✅) and NOT do (❌)
# ✅ ESPECÍFICO: Use placeholders (<NUMBER>, <FILE>)
# ✅ VALIDADO: Run tools/validate-claude-md.sh before commit
# ❌ NO extensive documentation - keep compact
# ❌ NO manual edits - use /update-claude-md
# ❌ NO duplicate commands - consolidate via /audit-claude-md
```

## 📋 Documentation Standards

**Complete Standards & Templates**: @.claude/docs/documentation-standards.md

### Quick Template Selection

- **Main README**: User-Facing Application template
- **Tools/scripts**: Technical Infrastructure template
- **docs/ navigation**: Documentation Hub template
- **src/docs/ or backend/docs/**: Implementation Guide template
- **ADR collections**: Architecture Reference template
- **.claude/ directories**: Claude Code Integration template

**Quality Requirements**: Template compliance, Conway's Law (≤2 dirs), bilingual standards

**See imported documentation-standards.md for**:
- Complete template usage guidelines
- 6-category template selection flowchart
- Placement guidelines (DOCUMENTATION-PLACEMENT-GUIDELINES.md)
- Validation checklists (README-VALIDATION-CHECKLIST.md)
- Quality requirements (95%+ cross-references, 90%+ template adherence)

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