# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Essential: dev, build, test, security-scan (QA via git hooks)
yarn run cmd dev|build|test|security-scan

# Quality: lint/fix, format/check, tests, audit (automated via hooks)
yarn run cmd preview|lint|lint-fix|format|format-check|test-coverage|test-all|audit

# Validation Modular (Multi-Tech: TS+Python, Auto-detection)
yarn run cmd validate-all|validate-frontend|validate-backend|validate-modified
yarn run cmd validate-file --file=path|validate-dir --dir=path
yarn run cmd validate-*-fast|validate-*-full|validate-staged|validate-diff --base=main
yarn run cmd workflow-context|validate-task|validate-workpackage|validate-release

# Docker: dev, prod, backend, management
yarn run cmd docker-dev|docker-prod|docker-backend|docker-stop|docker-logs

# Electron: run, package, distribute
yarn run cmd electron|electron-pack|electron-dist
```

### Quality Assurance via Git Hooks (OPTIMIZED)

```bash
# AUTOMATIC QA: Quality checks run automatically on git commit via .claude/hooks.json
# OPTIMIZED: 54% performance improvement (152s → 70s total timeout)
# Complete toolchain: 10/10 tools available (taplo, shfmt included)

# Performance Improvements (2025-08-13):
# PreToolUse: 52s → 25s (52% reduction)
# PostToolUse: 100s → 45s (55% reduction)
# Total: 152s → 70s (54% improvement)

# Manual QA (if needed):
yarn run cmd qa-gate                           # Complete QA pipeline
npx eslint . && npx prettier --check .        # Linting & formatting
npm test                                       # Run tests
npm audit && npx semgrep --config=auto .      # Security scan
npx tsx scripts/governance.ts --format=all    # Traceability matrix

# Hooks Configuration: .claude/hooks.json (v2.0 - Optimized)
# - PreToolUse: Tool validation (8s), refactor hints (5s), secrets scan (5s)
# - PostToolUse: Auto-formatting (30s), quality metrics (15s)
# - Complete toolchain: black, ruff, eslint, prettier, shellcheck, taplo, shfmt
# - Enhanced error handling with clear debug messages
```

## Project Architecture

```bash
# Tech Stack
Frontend: React 18 + TypeScript + Vite + TailwindCSS
State: Zustand + IndexedDB | AI: GPT-4o + embeddings | Desktop: Electron

# Features
AI docs + RAG | MD editing + export | OAuth + encryption

# Structure
components/ (Chat, Document, Menu) | store/ (docs, auth, config)
api/, hooks/, types/, utils/, constants/ | Aliases: @components, @store, etc.

# Dependencies & Notes
@lexical/react, zustand, tailwindcss, @react-oauth/google, vite, electron
SWC + lazy loading | Jest testing | OAuth + i18next
```

### Development Methodology

```bash
# Core Principles
Multilingual: SPANISH docs, English code | Verify all metrics from source
Efficient: Targeted search for large files | Read → Verify → Edit
Quality: git hooks automatic QA on commit | Use feature branches

# MANDATORY WORKFLOW: Use tools/ directory for ALL task management
ALWAYS start with: docs/DEVELOPMENT-STATUS.md → tools/progress-dashboard.sh
ALWAYS check context: docs/WORK-PLAN v5.md section "6. Plan de Ejecución por Releases"
ALWAYS navigate: tools/task-navigator.sh T-XX for task details
ALWAYS plan: tools/extract-subtasks.sh T-XX for development planning
ALWAYS validate: tools/validate-dod.sh T-XX before marking complete
ALWAYS verify next steps: Check current WP completion → Next WP → Next Release
NEVER manually search Sub Tareas v2.md - use tools/task-navigator.sh instead

# Validation System (Multi-Tech + Context-Aware)
Auto-detection: TypeScript/React + Python/FastAPI | Windows/Linux/macOS/WSL
Workflow-aware: feature/T-XX → validate-task | develop → validate-all
Performance: validate-*-fast (1-8s) | validate-*-full (complete) | scope-specific
```

## Project Status & Performance

```bash
# Status & Security
Current: R0.WP3 (Seguridad y Auditoría) | Previous: R0.WP2 ✅ (User+API Security)
Status: docs/DEVELOPMENT-STATUS.md | Progress: tools/progress-dashboard.sh
Security: IndexedDB encryption, TLS 1.3+, AES-256, OAuth 2.0, GDPR

# Performance & Evolution
Targets: Doc gen ≤8min/10pg | Preview ≤200ms | RAG <1s/15docs
Vision: docs/PRD v2.md | Gap Analysis: docs/ARCH-GAP-ANALYSIS.md
```

### Key Documentation

```bash
# Spanish (Primary)
PRD v2.md (37KB): Requirements, RAG, roadmap R0-R6
WORK-PLAN v5.md (42KB): 6 releases, 47 tasks, 484 points
Sub Tareas v2.md (120KB): Implementation details (USE GREP)
UX-FLOW.md (5KB): UX design, performance specs

# English (Supporting)
DESIGN_GUIDELINES.md (6KB): UI/UX standards
ARCH-GAP-ANALYSIS.md (5KB): 65% PRD coverage, 20 gaps
ADRs: 001 (Pydantic v2), 002 (LangChain deferral)

# Reference Map by Development Phase
Planning: PRD v2.md → WORK-PLAN v5.md → ARCH-GAP-ANALYSIS.md
Development: Sub Tareas v2.md → ADRs → UX-FLOW.md → DESIGN_GUIDELINES.md
Validation: docs/traceability/* → docs/certifications/* → docs/tests/*
Security: docs/adr/ADR-006-security.md → scripts/commands/security.cjs
```

## Codebase & File Access

```bash
# Quick Facts: 962MB total (3MB source) | 47 tasks (484 points)

# File Access Strategy
Large (120KB+): grep -n "T-02" "docs/Sub Tareas v2.md" | tools/task-navigator.sh
Medium (37-42KB): Direct read - PRD v2.md, WORK-PLAN v5.md
Small (<10KB): Direct read - ADR files, UX-FLOW.md
```

## Environment & Workflow

```bash
# Environment: WSL2 + Node.js 18.16.0 + yarn
wsl --install -d Ubuntu-20.04
nvm install 18.16.0 && nvm use 18.16.0
yarn install && yarn run cmd dev

# Quality Gate (automatic): TS → ESLint → Prettier → Tests → Build → Security
# Triggered automatically via .claude/hooks.json on git commit

# Task Tools (Development & QA Workflow)
tools/progress-dashboard.sh    # Project progress
tools/task-navigator.sh T-02   # Task details
tools/extract-subtasks.sh T-02 # Extract subtasks
tools/status-updater.sh T-02 "Status message"     # Basic status update
tools/mark-subtask-complete.sh T-02 R0.WP2-T02-ST1 # Mark subtask done

# QA Workflow (NEW: DoD Validation)
tools/qa-workflow.sh T-02 dev-complete    # Mark development complete
tools/qa-workflow.sh T-02 start-qa        # Start QA validation
tools/validate-dod.sh T-02                # Validate Definition of Done
tools/qa-workflow.sh T-02 qa-passed       # QA validation passed
tools/qa-workflow.sh T-02 mark-complete   # Mark fully complete (DoD satisfied)
```

### Governance & Security

```bash
npx tsx scripts/governance.ts --format=all|xlsx|json|md  # Traceability matrix
npm audit && npx semgrep --config=auto .              # Validation & security
```

### Workflow Integration

```bash
# Enhanced Development Workflow (with QA validation)
tools/progress-dashboard.sh                      # View progress
tools/task-navigator.sh T-02                     # Task details
tools/extract-subtasks.sh T-02 > current-work.md # Extract subtasks for development

# Development Phase
tools/status-updater.sh T-02 "En progreso - ST1"         # Update progress
tools/mark-subtask-complete.sh T-02 R0.WP2-T02-ST1      # Complete subtasks
tools/qa-workflow.sh T-02 dev-complete                   # Mark development done

# QA & Validation Phase (NEW: DoD enforcement)
tools/validate-dod.sh T-02                               # Validate Definition of Done
git commit -m "feat: complete T-02 implementation"        # Quality checks via hooks
tools/qa-workflow.sh T-02 qa-passed                      # Mark QA passed
tools/qa-workflow.sh T-02 mark-complete                  # Final completion (DoD satisfied)

# Governance & Traceability
npx tsx scripts/governance.ts --format=all               # Update traceability

# ADR & Security
cp docs/adr/template.md docs/adr/ADR-$(printf "%03d" $(($(ls docs/adr/ADR-*.md | wc -l) + 1)))-title-kebab-case.md
npm audit && npx semgrep --config=auto . --severity=ERROR
```

## Integration Policy & Future Commands

```bash
# CRITICAL: All enhancements MUST integrate into workflow

# Integration Process
1. Document in CLAUDE.md with concrete commands
2. Map to existing tools/scripts
3. Test before documenting
4. Remove redundancies

# Best Practices
❌ Avoid: Unmapped tools, abstract concepts
✅ Example: tools/validate-auth.sh → security.cjs → CLAUDE.md

# Validation Tiers
Tier 1: CLAUDE.md, qa.cjs, package.json
Tier 2: DEVELOPMENT-STATUS.md, traceability docs

# Claude Code Slash Commands (ACTIVE)
/task-dev [T-XX] [complete]     # Task development with sub-agent delegation
/pr-flow [target] [--draft]     # PR creation with multi-agent code review  
/release-prep [RX.Y] [validate] # Release preparation via sub-agent orchestration

# Sub-Agent Integration (Claude Code Best Practices)
✅ Explicit invocation: "> Use the [agent] sub-agent to [task]"
✅ Context detection: Analyze task/branch/files for appropriate sub-agent
✅ Multi-agent orchestration: Sequential delegation for complex workflows
✅ Tool limitation: Each sub-agent accesses only necessary tools
```
