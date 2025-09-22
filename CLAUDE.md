# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
AI Document Editor: React 18 + TypeScript + Python FastAPI + AI integration
Features: Document generation with RAG, real-time collaboration, OAuth security
Repository: https://github.com/BriamV/AI-Doc-Editor/

## Tech Stack
- Frontend: React 18 + TypeScript + Vite + TailwindCSS
- Backend: Python FastAPI + SQLAlchemy + Alembic
- AI: OpenAI GPT-4o + embeddings + LangChain
- Desktop: Electron + auto-updater
- State: Zustand + IndexedDB encryption
- Testing: Playwright E2E + Jest unit tests
- Tools: Multi-stack quality ecosystem (40+ tools integrated)
  - **Frontend**: ESLint, Prettier, Jest, TSC
  - **Python**: Black, Ruff, Radon, MyPy, pip-audit
  - **Security**: Semgrep, git-secrets, yarn audit
  - **Docs**: markdownlint, yamlfix, yamllint, spectral
  - **Shell**: shellcheck, shfmt
  - **Config**: taplo (TOML), prettier (JSON/XML/CSS)
  - **Infrastructure**: Docker, GitHub Actions, Claude Code hooks

## Development Setup
```bash
# Prerequisites: Node.js 18.16.0, Python 3.11+, WSL2 (Windows)
yarn install && yarn dev                  # Start development
yarn build && yarn test                   # Build & test
yarn security-scan                        # Security audit

# ⚠️  LEGACY MIGRATION WARNING:
# scripts/cli.cjs and 'yarn run cmd' commands are DEPRECATED
# Use direct yarn commands instead (see Essential Commands section)
```

## 🚨 MANDATORY: Sub-Agent First Workflow
1. **FIRST**: Use CUSTOM slash commands (.claude/commands/) for complex tasks
2. **SECOND**: Use direct yarn commands (yarn dev, yarn build, yarn test)  
3. **LAST**: Direct CLI only if above unavailable
4. **NEVER**: Use scripts/cli.cjs (DEPRECATED - marked for removal)

### Sub-Agent Architecture
- **Custom Commands**: 19 workflow orchestrators in .claude/commands/ that analyze context
- **Global Sub-Agents**: 40+ Claude Code specialists (security-auditor, frontend-developer, etc.)
- **Invocation**: Commands auto-select and delegate to appropriate sub-agents

## ⚡ CONSTANT VALIDATION Required
```bash
# ALWAYS validate after branch changes, context switches, or issues
/health-check                    # Immediate system validation
tools/progress-dashboard.sh      # Project status verification
yarn run cmd validate-modified   # Code quality check
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
```bash
# Development (PREFERRED - Direct commands)
yarn dev|build|test|security-scan

# Testing (Playwright E2E primary)
yarn test:e2e              # Run E2E tests (Playwright)
yarn test:e2e:headed       # Run with browser visible
yarn test:e2e:debug        # Debug E2E tests
yarn test:e2e:ui           # Interactive UI mode
yarn test:e2e:report       # Show HTML test report

# Quality (automated via hooks - 54% performance optimized)
yarn lint|format|tsc-check

# Multi-tech validation (TypeScript + Python auto-detection)
yarn tsc-check        # Frontend TypeScript validation
yarn python-quality   # Backend Python validation (format + lint + complexity)
yarn python-format    # Python autofix formatting (Black)
yarn python-lint      # Python autofix linting (Ruff)

# 🛡️ MERGE PROTECTION (MANDATORY before merges)
yarn merge-safety-full           # Complete merge safety validation
yarn pre-merge-check            # Pre-merge safety checks
yarn validate-merge-full        # Full branch comparison
yarn install-merge-hooks        # Install git-level protection

# Environment validation & diagnostics (NEW - Unified Multiplatform)
yarn env-validate     # Comprehensive environment diagnostics
yarn env-info         # Detailed platform and tool information

# ⚠️  LEGACY DEPRECATION NOTICE:
# OLD: yarn run cmd <command>  <- DEPRECATED, will be removed
# NEW: yarn <command>          <- Use this instead
# Migration: All 'yarn run cmd' references should use direct yarn commands
```

## Project Structure
- `src/components/` - React components (Chat, Document, Menu)
- `src/store/` - Zustand stores (docs, auth, config)
- `backend/` - Python FastAPI backend + .venv
- `docs/` - Spanish documentation (primary)
- `frontend/docs/` - **NEW** Frontend implementation docs (React, Zustand, hooks)
- `backend/docs/` - Backend implementation docs (API, database, security)
- `.claude/commands/` - 19 production slash commands
- `tools/` - Task management scripts
- `scripts/multiplatform.cjs` - **NEW** Unified cross-platform validator

## 🔧 Quality Tools Ecosystem (40+ Tools)
**Hooks-Integrated Multi-Stack Pipeline:**
```bash
# Frontend Quality
eslint, prettier, jest, tsc              # TypeScript/JavaScript

# Python Backend Quality  
black, ruff, radon, mypy, pip-audit      # Python quality gates

# Security & Secrets
semgrep, git-secrets, yarn audit         # Security scanning

# Documentation
markdownlint, yamlfix, yamllint, spectral # Docs quality

# Configuration & Shell
taplo, shellcheck, shfmt                 # Config + shell scripts

# Multi-Format Support
prettier (JSON/XML/CSS/HTML)             # Universal formatting
```
**Auto-Detection**: Windows/Linux/WSL + multi-venv support
**Unified Validator**: `scripts/multiplatform.cjs` consolidates all cross-platform logic

## Quality Assurance
- **Multi-Stack Pipeline**: 40+ tools integrated via .claude/hooks.json
- **Auto-formatting**: Real-time format on Edit/Write/MultiEdit
  - TypeScript/JavaScript: ESLint + Prettier
  - Python: Black + Ruff (autofix)
  - Docs: markdownlint + yamlfix
  - Shell: shellcheck + shfmt
  - Config: taplo (TOML) + prettier (JSON/XML/CSS)
- **Design Metrics**: Complexity (CC≤15) + LOC (≤300) validation
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
- **Status**: docs/project-management/DEVELOPMENT-STATUS.md

## Sub-Agent Architecture
- **40+ Global Sub-Agents**: Built-in Claude Code specialists (security-auditor, backend-architect, etc.)
- **Local Project Agent**: workflow-architect - Specialized for this project's workflow orchestration
- **Custom Commands**: Auto-select appropriate sub-agents (global + local) based on project context

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
# PREFERRED: Direct commands
yarn security-scan                         # Security scan (audit + semgrep)
/docs-update                               # Traceability matrix via commands
docs/architecture/adr/ADR-006-dependency-security-scanning.md  # Security architecture

# ⚠️  LEGACY: Avoid these deprecated patterns
# yarn run cmd security-scan  <- DEPRECATED
# yarn run cmd traceability   <- Use /docs-update instead
```

## Do Not Touch
- `docs/project-management/Sub Tareas v2.md` - Use tools/task-navigator.sh instead
- `.claude/commands/archive/` - Archived historical commands
- `test-*.js` - Temporary debugging files
- `.claude/hooks.json.backup` - Backup configuration
- `legacy/` - Migrated Cypress files (see legacy/MIGRATION-README.md)

## ⚠️  Legacy Components (Marked for Deprecation)
- `scripts/` - **DEPRECATED** - All CLI functionality moved to direct yarn commands
  - `scripts/cli.cjs` - Legacy CLI wrapper, use direct yarn commands instead
  - `yarn run cmd <command>` - Replace with `yarn <command>`
- `legacy/cypress/` - **MIGRATED** - Cypress E2E tests replaced by Playwright
  - `yarn test:cypress` - Legacy Cypress commands (use `yarn test:e2e` instead)
  - Migration completed: All E2E testing now uses Playwright
- Timeline: legacy/ will be removed after Playwright validation phase

## Integration Policy
All enhancements MUST integrate into workflow:
1. Document in CLAUDE.md with concrete commands
2. Map to existing tools/scripts  
3. Test before documenting
4. Remove redundancies

## 🔨 POST-BUILD VALIDATION Protocol
**MANDATORY after package.json changes or new scripts:**
```bash
# ✅ ALWAYS run after modifying package.json or adding scripts
yarn install --frozen-lockfile          # Verify dependencies
yarn build                              # Ensure build doesn't break
yarn tsc-check                          # TypeScript validation
yarn quality-gate                       # Full quality pipeline
# ✅ Multi-tech validation (Python + TypeScript + Frontend)
# ✅ Autofix priorized: Use --fix flags when available
# ✅ Validate CI/CD integration works end-to-end
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

## 🛡️ MERGE PROTECTION SYSTEM
**CRITICAL: NEVER merge without running these commands first**

```bash
# 🚨 MANDATORY BEFORE ANY MERGE
/merge-safety                    # Complete merge protection (REQUIRED)
yarn merge-safety-full           # Alternative yarn command
yarn install-merge-hooks         # Install git-level protection (once)

# Emergency validation (if hooks fail)
yarn pre-merge-check            # Pre-merge safety only
yarn validate-merge-full        # Comprehensive validation
yarn branch-audit               # File count audit

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