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
# AUTO-FORMATTING: Fixed hook now reliably formats files on Edit/Write/MultiEdit

# Performance Improvements (2025-08-13):
# PreToolUse: 52s → 25s (52% reduction)
# PostToolUse: 100s → 45s (55% reduction)  
# Total: 152s → 70s (54% improvement)

# Auto-formatting Fix (2025-08-18):
# Issue: Hooks relied on unreliable JSON stdin input for file detection
# Fix: Added robust fallback to git detection with proper error handling
# Result: Auto-formatting now works reliably on every Claude Code tool usage

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
🤖 SUB-AGENT FIRST: ALWAYS use /command + sub-agents before manual CLI
Multilingual: SPANISH docs, English code | Verify all metrics from source
Efficient: Targeted search for large files | Read → Verify → Edit
Quality: git hooks automatic QA on commit | Use feature branches

# 🚨 MANDATORY: SUB-AGENT PRIORITY WORKFLOW
1. ✅ FIRST: Use slash commands (/task-dev, /health-check, /commit-smart, etc.)
2. ✅ SECOND: Use tools/ scripts (task-navigator.sh, progress-dashboard.sh)
3. ❌ LAST: Direct yarn/npm commands only if sub-agents unavailable

Examples:
❌ yarn run cmd lint            → ✅ /review-complete --scope=components
❌ npm audit                    → ✅ /security-audit --depth=full
❌ git commit -m "message"      → ✅ /commit-smart "message"
❌ tools/task-navigator.sh T-XX → ✅ /task-dev T-XX
❌ manual debugging             → ✅ /debug-analyze --trace

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

## Sub-Agent Workflow Priority

```bash
# MANDATORY: Always prioritize sub-agents and slash commands over basic CLI

# Priority Hierarchy (Intelligent → Basic)
1. Slash Commands + Sub-Agents (PREFERRED)
2. tools/ scripts (context-specific)
3. yarn run cmd (fallback)
4. Direct CLI (last resort)

# Why Sub-Agents First?
✅ Context Intelligence: Analyze branch/task/files for optimal sub-agent selection
✅ Performance Maintained: 54% optimization (152s → 70s) preserved with intelligence
✅ Quality Enhancement: Specialized expertise per domain (security, architecture, etc.)
✅ Workflow Integration: Seamless integration with existing tools/ and git hooks

# Sub-Agent Delegation Pattern
"> Use the [agent] sub-agent to [specific task description]"

# 9 Specialized Sub-Agents & Their Capabilities
workflow-architect    # Project orchestration, task management, context analysis
security-auditor      # Security validation, audit reports, compliance checks
backend-architect     # API design, system architecture, performance optimization
code-reviewer         # Code quality, best practices, review automation
devops-troubleshooter # CI/CD, deployment, infrastructure, health monitoring
frontend-developer    # UI/UX, component analysis, React/TypeScript optimization
api-documenter        # Documentation generation, OpenAPI specs, examples
deployment-engineer   # Deployment validation, environment management
debugger              # Error analysis, troubleshooting, performance debugging

# Common Workflow Examples

# Task Development (Use /task-dev instead of tools/task-navigator.sh)
/task-dev T-15                          # ✅ Intelligent task analysis + sub-agent delegation
# tools/task-navigator.sh T-15          # ❌ Basic script without intelligence

# Code Review (Use /review-complete instead of manual review)
/review-complete --scope=components     # ✅ code-reviewer sub-agent with expertise
# git diff --cached | manual review     # ❌ Manual process without standards

# Security Audit (Use /security-audit instead of npm audit)
/security-audit --depth=full           # ✅ security-auditor with comprehensive analysis
# npm audit && npx semgrep              # ❌ Basic tools without intelligence

# Architecture Analysis (Use /architecture instead of manual docs)
/architecture --analyze                 # ✅ backend-architect with system expertise
# grep -r "architecture" docs/          # ❌ Manual search without analysis

# Deployment Validation (Use /deploy-validate instead of basic checks)
/deploy-validate staging --test         # ✅ deployment-engineer with validation expertise
# docker ps && curl health-check        # ❌ Basic checks without intelligence

# Health Monitoring (Use /health-check instead of manual monitoring)
/health-check --verbose                 # ✅ devops-troubleshooter with comprehensive analysis
# ps aux | grep node                    # ❌ Basic process check without context

# Commit Generation (Use /commit-smart instead of manual git commit)
/commit-smart --type=feat auth          # ✅ workflow-architect with conventional commit intelligence
# git commit -m "fix stuff"             # ❌ Manual commit without standards

# Context Analysis (Use /context-analyze for project understanding)
/context-analyze --deep                 # ✅ workflow-architect with full project context
# find . -name "*.md" | head             # ❌ Basic file listing without analysis

# When to Use Basic Commands (Fallback Only)
Use tools/ scripts and yarn commands ONLY when:
- Sub-agent functionality is not available for specific use case
- Debugging sub-agent behavior itself
- Performance-critical operations requiring direct control
- Integration testing of basic toolchain

# Integration with Existing Workflow
# The sub-agent system enhances, not replaces, existing tools
# Git hooks, QA validation, and traceability remain unchanged
# Sub-agents provide intelligence layer on top of existing infrastructure
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

# Claude Code Slash Commands (19 PRODUCTION COMMANDS - 2024-2025 COMPLIANT)

## Workflow Commands (3)
/task-dev [T-XX] [complete]     # Task development with workflow-architect sub-agent
/pr-flow [target] [--draft]     # PR creation with code-reviewer sub-agent integration
/release-prep [RX.Y] [validate] # Release preparation via workflow-architect orchestration

## Governance Commands (4)
/commit-smart [--type] [scope]  # Intelligent commit generation via workflow-architect
/adr-create [title] [--status]  # Architecture Decision Record via backend-architect
/issue-generate [type] [--prio] # GitHub issue generation via workflow-architect
/docs-update [scope] [--verify] # Documentation maintenance via api-documenter

## Agent Commands (4)
/review-complete [--scope]      # Comprehensive code review via code-reviewer
/security-audit [--depth]       # Security analysis via security-auditor
/architecture [--analyze]       # System architecture via backend-architect
/debug-analyze [--trace]        # Intelligent debugging via debugger

## CI/CD Commands (3)
/pipeline-check [--stage]       # CI/CD pipeline validation via devops-troubleshooter
/deploy-validate [env] [--test] # Pre-deployment validation via deployment-engineer
/hotfix-flow [branch] [--urgent] # Emergency hotfix via devops-troubleshooter

## Meta Commands (3)
/auto-workflow [context]        # Context-aware workflow via workflow-architect
/health-check [--verbose]       # Comprehensive system health via devops-troubleshooter
/context-analyze [--deep]       # Project context analysis via workflow-architect

## Utility Commands (2)
/search-web [query] [--domain]  # Intelligent web research with context filtering
/explain-codebase [path] [--detail] # Codebase explanation with architecture mapping

# Sub-Agent Integration & Usage Examples (Claude Code 2024-2025 Standards)
✅ Canonical syntax: "> Use the [agent] sub-agent to [specific task description]"
✅ Context intelligence: Branch/task/file analysis for optimal sub-agent selection
✅ Multi-agent orchestration: Sequential delegation for complex multi-step workflows
✅ Scoped tool permissions: Each sub-agent accesses only necessary tools per command
✅ Performance optimized: 54% improvement maintained (152s → 70s execution)
✅ Full compliance: Frontmatter structure, model specification, argument handling

# Practical Usage Examples

# Development Workflow Integration
/task-dev T-15                    # → workflow-architect analyzes task + delegates to specialists
/review-complete --scope=api      # → code-reviewer focuses on API code quality
/security-audit --depth=full      # → security-auditor comprehensive analysis
/commit-smart --type=feat auth    # → workflow-architect generates conventional commit

# Multi-Agent Orchestration Examples
/release-prep R1.0 validate       # → workflow-architect orchestrates:
                                   #   1. security-auditor: Security validation
                                   #   2. code-reviewer: Quality gates
                                   #   3. devops-troubleshooter: CI/CD checks
                                   #   4. deployment-engineer: Release validation

/pr-flow main --draft             # → workflow-architect orchestrates:
                                   #   1. code-reviewer: Automated code review
                                   #   2. security-auditor: Security check
                                   #   3. api-documenter: Documentation updates

# Context-Aware Sub-Agent Selection
Branch: feature/T-15-auth         # → Automatically selects security-auditor
Files: components/*.tsx           # → Automatically selects frontend-developer
Files: api/*.py                   # → Automatically selects backend-architect
Error logs present                # → Automatically selects debugger

# Sub-Agent Delegation Pattern in Action
"> Use the security-auditor sub-agent to analyze authentication implementation"
"> Use the backend-architect sub-agent to review API design patterns"
"> Use the frontend-developer sub-agent to optimize React component performance"
"> Use the workflow-architect sub-agent to orchestrate release preparation"

# Sub-Agent Distribution (9 specialized agents)
- workflow-architect: 8 commands (workflow, context, orchestration)
- security-auditor: 6 commands (audit, security validation)
- backend-architect: 4 commands (architecture, API design)
- code-reviewer: 4 commands (review, quality analysis)
- devops-troubleshooter: 4 commands (CI/CD, deployment, health)
- frontend-developer: 3 commands (UI/UX, component analysis)
- api-documenter: 3 commands (documentation, specifications)
- deployment-engineer: 2 commands (deployment, validation)
- debugger: 2 commands (error analysis, troubleshooting)

# 🎯 QUICK REFERENCE: Sub-Agent Usage Patterns

## Common Development Tasks (USE THESE FIRST!)

```bash
# Task Development
/task-dev T-15                    # Auto-detects context, delegates to appropriate sub-agent
/task-dev T-15 complete           # Mark task complete with DoD validation

# Code Quality
/review-complete                  # Comprehensive review with context-aware sub-agent selection
/review-complete --scope=security # Focus on security via security-auditor sub-agent
/security-audit                  # Full security analysis via security-auditor
/debug-analyze                   # Intelligent debugging via debugger sub-agent

# CI/CD & Deployment  
/health-check                     # System health via devops-troubleshooter sub-agent
/pipeline-check                  # CI/CD validation via devops-troubleshooter
/deploy-validate production      # Pre-deployment checks via deployment-engineer

# Architecture & Documentation
/architecture --analyze          # System analysis via backend-architect sub-agent
/docs-update api                 # Documentation via api-documenter sub-agent
/adr-create "decision-title"     # Architecture decisions via backend-architect

# Smart Workflows
/auto-workflow                   # Context-aware suggestions via workflow-architect
/context-analyze --deep          # Project analysis via workflow-architect
/commit-smart                    # Intelligent commits via code-reviewer + security-auditor
```

## Sub-Agent Delegation Pattern (Copy-Paste Ready)

```bash
# Template for Claude Code interaction:
> Use the [AGENT-NAME] sub-agent to [SPECIFIC-TASK-DESCRIPTION]

# Examples:
> Use the security-auditor sub-agent to analyze authentication vulnerabilities in the OAuth implementation
> Use the frontend-developer sub-agent to review React component architecture and suggest performance optimizations
> Use the workflow-architect sub-agent to analyze current project context and recommend optimal next steps
```

🚨 **REMEMBER**: These commands provide intelligent, context-aware analysis that manual commands cannot match!
```
