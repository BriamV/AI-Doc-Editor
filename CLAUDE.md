# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Document Editor: React 18 + TypeScript + Python FastAPI + AI integration
Features: AI-powered document generation, real-time collaboration, OAuth security
Repository: https://github.com/BriamV/AI-Doc-Editor/

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Python FastAPI + SQLAlchemy + Alembic
- **AI**: OpenAI GPT-4o/GPT-4/GPT-3.5 + streaming
- **Desktop**: Electron + auto-updater
- **State**: Zustand + IndexedDB encryption
- **Testing**: Playwright E2E + Jest unit tests
- **Tools**: 40+ multi-stack quality ecosystem (see @.claude/docs/quality-tools-reference.md)

## Development Setup

```bash
# Prerequisites: Node.js 18.16.0, Python 3.11+, WSL2 (Windows)
yarn repo:install && yarn all:dev    # Start development
yarn fe:build && yarn fe:test        # Build & test
yarn sec:all                         # Security audit
```

## 🚨 MANDATORY: Sub-Agent First Workflow

1. **FIRST**: Use CUSTOM slash commands (.claude/commands/) for complex tasks
2. **SECOND**: Use namespaced yarn commands
3. **LAST**: Direct CLI only if above unavailable
4. **NEVER**: Use eliminated scripts (cli.cjs, qa-gate.cjs, etc. - removed)

### **8 Namespace Architecture**

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

**Complete 185-Command Reference**: @.claude/docs/reference/commands-reference.md

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

**Strict separation**: tools/ (project workflows) vs scripts/ (infrastructure automation)

```bash
# tools/ - Task management, progress tracking, QA workflows
tools/task-navigator.sh T-XX     # Task development workflows
tools/progress-dashboard.sh      # Project status dashboards

# scripts/ - CI/CD, platform detection, git hooks (5 essential scripts)
scripts/multiplatform.cjs        # Cross-platform environment
scripts/merge-protection.cjs     # Merge safety automation

# Validation
yarn docs:architecture           # ADR-011 compliance check
```

**See**: docs/architecture/adr/ADR-011-*.md for complete architecture details

## 🔧 Quality Tools Ecosystem

**Complete 40+ Tools Reference**: @.claude/docs/reference/quality-tools-reference.md

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
- **Multi-OS**: Windows/Linux/WSL auto-detection

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

**Current Status**: @docs/project-management/status/PROJECT-STATUS.md

- **Language**: Spanish docs, English code
- **Pattern**: T-XX task identification
- **Branch**: develop

## Sub-Agent Architecture

**MANDATORY**: Prioritize sub-agents for complex tasks (code analysis, security audits, architecture review, multi-file investigation, testing, debugging)

**Available**: 40+ global specialists (security-auditor, backend-architect, frontend-developer, technical-researcher, code-reviewer, etc.) + workflow-architect (local)

```bash
# Automatic delegation (PREFERRED)
/security-audit          # → security-auditor
/architecture            # → backend-architect
/review-complete         # → code-reviewer
```

**Main thread only for**: Sub-agent coordination, brief confirmations, single commands, user prompts

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
yarn sec:all                   # Complete security pipeline
/security-audit                # Comprehensive assessment
```

**Documentation**: docs/architecture/adr/ADR-006-dependency-security-scanning.md

**Compliance**: OAuth 2.0, TLS 1.3+, AES-256, GDPR, OWASP Top 10

## Do Not Touch

**Complete Protected Files Policy**: @.claude/docs/reference/protected-files-policy.md

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

## CLAUDE.md Maintenance

**Architecture**: Deterministic shell scripts (not AI slash commands)

```bash
# Validation (fast, deterministic)
bash tools/validate-claude-md.sh        # Structure + format + references

# Comprehensive audit (with quality scoring)
bash tools/audit-claude-md.sh           # Full analysis + score report
bash tools/audit-claude-md.sh --report  # Generate markdown report

# Manual update workflow:
# 1. Read CLAUDE.md before editing
# 2. Make minimal, focused changes
# 3. Run validation script
# 4. Check token count is displayed in validation
# 5. Commit with descriptive message
```

**Note**: Previous `/update-claude-md` and `/audit-claude-md` slash commands moved to archive (were specification-only, not implemented)

## 📋 Documentation Standards

**Complete Standards & Templates**: @.claude/docs/reference/documentation-standards.md

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