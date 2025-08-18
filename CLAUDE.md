# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
AI Document Editor: React 18 + TypeScript + Python FastAPI + AI integration
Features: Document generation with RAG, real-time collaboration, OAuth security

## Tech Stack
- Frontend: React 18 + TypeScript + Vite + TailwindCSS
- Backend: Python FastAPI + SQLAlchemy + Alembic  
- AI: OpenAI GPT-4o + embeddings + LangChain
- Desktop: Electron + auto-updater
- State: Zustand + IndexedDB encryption
- Tools: Git hooks, ESLint, Prettier, Jest, Semgrep

## Development Setup
```bash
# Prerequisites: Node.js 18.16.0, Python 3.11+, WSL2 (Windows)
yarn install && yarn run cmd dev          # Start development
yarn run cmd build && yarn run cmd test   # Build & test
yarn run cmd security-scan                # Security audit
```

## 🚨 MANDATORY: Sub-Agent First Workflow
1. **FIRST**: Use CUSTOM slash commands for complex tasks
2. **SECOND**: Use tools/ scripts for task management  
3. **LAST**: Direct CLI only if above unavailable

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
# Development
yarn run cmd dev|build|test|security-scan

# Quality (automated via hooks - 54% performance optimized)
yarn run cmd lint|format|validate-all|validate-modified

# Multi-tech validation (TypeScript + Python auto-detection)
yarn run cmd validate-frontend|validate-backend|validate-task T-XX
```

## Project Structure
- `src/components/` - React components (Chat, Document, Menu)
- `src/store/` - Zustand stores (docs, auth, config)  
- `api/` - Python FastAPI backend
- `docs/` - Spanish documentation (primary)
- `.claude/commands/` - 19 production slash commands
- `tools/` - Task management scripts

## Quality Assurance
- **Auto-formatting**: Runs on Edit/Write/MultiEdit via .claude/hooks.json
- **Performance**: 54% optimized (152s → 70s total timeout)
- **Validation**: Multi-tech TypeScript + Python detection
- **Security**: OAuth 2.0, TLS 1.3+, AES-256, GDPR compliance

## Task Management Workflow
```bash
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
- **Status**: docs/DEVELOPMENT-STATUS.md

## Sub-Agent Architecture
- **40+ Global Sub-Agents**: Built-in Claude Code specialists (security-auditor, backend-architect, etc.)
- **Local Project Context**: Single project-aware agent with branch/task understanding
- **Custom Commands**: Auto-select appropriate global sub-agents based on project context

## Security & Compliance
```bash
npm audit && npx semgrep --config=auto .    # Security scan
npx tsx scripts/governance.ts --format=all  # Traceability matrix
docs/adr/ADR-006-security.md               # Security architecture
```

## Do Not Touch
- `docs/Sub Tareas v2.md` - Use tools/task-navigator.sh instead
- `.claude/commands/legacy/` - Deprecated commands  
- `test-*.js` - Temporary debugging files
- `.claude/hooks.json.backup` - Backup configuration

## Integration Policy
All enhancements MUST integrate into workflow:
1. Document in CLAUDE.md with concrete commands
2. Map to existing tools/scripts  
3. Test before documenting
4. Remove redundancies

## Quick Reference
- 📋 **Task details**: `/task-dev T-XX`
- 🔍 **Codebase analysis**: `/context-analyze`
- 🚀 **Full command list**: `/auto-workflow`
- 📊 **Progress**: `tools/progress-dashboard.sh`