# CLAUDE.md

AI Document Editor - React + TypeScript + Python FastAPI

## Tech Stack
- Frontend: React 18 + TypeScript + Vite + TailwindCSS
- Backend: Python FastAPI + SQLAlchemy
- AI: OpenAI GPT-4o + embeddings
- Desktop: Electron
- State: Zustand + IndexedDB

## 🚨 MANDATORY: Sub-Agent First Workflow
1. **FIRST**: Use slash commands (`/task-dev`, `/review-complete`, `/security-audit`)
2. **SECOND**: Use tools/ scripts (`task-navigator.sh`, `progress-dashboard.sh`)
3. **LAST**: Direct CLI commands only if above unavailable

## Essential Commands
```bash
# Development
yarn run cmd dev|build|test|security-scan

# Quality (automated via hooks)
yarn run cmd lint|format|validate-all

# Task Management (use slash commands instead)
/task-dev T-XX                 # NOT: tools/task-navigator.sh T-XX
/review-complete --scope=api   # NOT: yarn run cmd lint
/security-audit --depth=full   # NOT: npm audit
```

## Project Structure
- `src/components/` - React components (Chat, Document, Menu)
- `src/store/` - Zustand stores (docs, auth, config)
- `api/` - Python FastAPI backend
- `docs/` - Spanish documentation (primary)
- `.claude/commands/` - 19 production slash commands

## Quality Assurance
- **Auto-formatting**: Runs on Edit/Write/MultiEdit via hooks
- **Performance**: 54% optimized (152s → 70s)
- **Validation**: Multi-tech TypeScript + Python detection

## Do Not Touch
- `docs/Sub Tareas v2.md` - Use tools/task-navigator.sh instead
- Legacy commands in `.claude/commands/legacy/`
- Test files `test-*.js` - Temporary debugging files

## Workflow Context
- **Branch**: develop
- **Current**: R0.WP3 (Seguridad y Auditoría)
- **Language**: Spanish docs, English code
- **Task Format**: T-XX pattern recognition

## Available Slash Commands (19 Total)
```bash
# Most Used
/task-dev T-XX              # Task development with context
/review-complete            # Code review with sub-agents
/security-audit             # Security analysis
/health-check               # System diagnostics
/commit-smart               # Intelligent commits

# Full list: /auto-workflow for context-aware suggestions
```

## Sub-Agent Pattern (Copy-Paste)
```bash
> Use the [AGENT] sub-agent to [SPECIFIC-TASK]

# Examples:
> Use the security-auditor sub-agent to analyze OAuth vulnerabilities
> Use the frontend-developer sub-agent to optimize React components
```

📋 **For detailed task info**: Use `/task-dev T-XX` instead of manual file searches
🔍 **For codebase analysis**: Use `/context-analyze` for intelligent insights