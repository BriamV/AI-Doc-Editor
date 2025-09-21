# Contributing to AI-Doc-Editor

Esta guía documenta el workflow real del proyecto, eliminando inconsistencias y comandos ficticios para proporcionar una experiencia de desarrollo precisa y ejecutable.

## Información del Proyecto

- **Tech Stack**: React 18 + TypeScript + Python FastAPI + AI integration
- **Testing**: Playwright E2E (primary) + Jest unit tests
- **Quality**: 40+ tools integrados vía .claude/hooks.json (54% optimizado)
- **Branching**: GitFlow-inspired con task-based development

---

## Branching Strategy Completa

### Ramas Principales (Long-lived)

#### 1. `main`
- **Propósito**: Código production-ready, cada commit es deployable
- **Regla**: Solo merges desde `release/*` o `hotfix/*`
- **Tagging**: Todo merge requiere tag de versión (ej. `v0.1.0`)

#### 2. `develop`
- **Propósito**: Rama de integración para desarrollo continuo
- **Regla**: Todos los `feature/*` se integran aquí vía Pull Requests

### Ramas de Desarrollo (Feature branches)

#### 3. `feature/T<ID>-<description>`
- **Propósito**: Desarrollo de tareas específicas del work plan
- **Ejemplo**: `feature/T-02-oauth-integration`
- **Workflow**:
  ```bash
  git checkout -b feature/T-02-oauth-integration develop
  # Desarrollo con comandos slash: /task-dev T-02
  # Validación: /review-complete --scope T-02
  # PR creation: /pr-flow
  ```

#### 4. `fix/<issue-description>`
- **Propósito**: Bug fixes no críticos para develop
- **Ejemplo**: `fix/eslint-configuration-errors`
- **Workflow**: Similar a feature pero para correcciones

#### 5. `docs/<update-description>`
- **Propósito**: Actualizaciones de documentación standalone
- **Ejemplo**: `docs/api-spec-update`
- **Workflow**: Usar `/docs-update` para validación

#### 6. `chore/<task-description>`
- **Propósito**: Mantenimiento, dependencies, config updates
- **Ejemplo**: `chore/upgrade-node-dependencies`

#### 7. `refactor/<component-description>`
- **Propósito**: Refactoring sin cambios funcionales
- **Ejemplo**: `refactor/auth-service-cleanup`

#### 8. `test/<test-description>`
- **Propósito**: Mejoras en testing exclusivamente
- **Ejemplo**: `test/e2e-playwright-migration`

#### 9. `style/<styling-description>`
- **Propósito**: Cambios de estilo, formatting, UI-only
- **Ejemplo**: `style/tailwind-dark-mode`

### Ramas de Release y Hotfix

#### 10. `release/R<Number>`
- **Propósito**: Preparación de releases para producción
- **Ejemplo**: `release/R0`
- **Workflow**:
  ```bash
  git checkout -b release/R0 develop
  # Release preparation: /release-prep
  # Merge to main + tag when ready
  ```

#### 11. `hotfix/<critical-fix>`
- **Propósito**: Fixes críticos para producción
- **Ejemplo**: `hotfix/security-vulnerability`
- **Workflow**:
  ```bash
  git checkout -b hotfix/security-patch main
  # Emergency fix: /hotfix-flow
  # Merge to main AND develop
  ```

---

## Commit Message Convention (Aligned)

Seguimos [Conventional Commits](https://www.conventionalcommits.org/) alineado con nuestra branching strategy:

### Formato
```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types (Alineados con Branch Types)
- `feat`: Nueva funcionalidad (feature/*)
- `fix`: Bug fix (fix/* o hotfix/*)
- `docs`: Documentación (docs/*)
- `style`: Cambios de formato/UI (style/*)
- `refactor`: Refactoring de código (refactor/*)
- `test`: Cambios en tests (test/*)
- `chore`: Mantenimiento/dependencies (chore/*)
- `perf`: Mejoras de performance
- `ci`: Cambios en CI/CD
- `build`: Cambios en build system

### Scopes Sugeridos
- `auth`: Sistema de autenticación
- `editor`: Editor de documentos
- `api`: Backend API
- `ui`: Interfaz de usuario
- `ci`: CI/CD pipeline
- `deps`: Dependencies

### Ejemplos Válidos
```
feat(auth): implement Google OAuth login flow
fix(editor): resolve save document race condition
docs(api): update FastAPI endpoint documentation
style(ui): apply dark mode theme consistency
refactor(auth): extract OAuth service to separate module
test(e2e): add Playwright tests for document workflow
chore(deps): upgrade React to v18.2.0
```

---

## Development Workflow

### 1. Setup Inicial
```bash
# Clonar y setup
git clone https://github.com/BriamV/AI-Doc-Editor.git
cd AI-Doc-Editor
yarn install --frozen-lockfile

# Validar environment
yarn env-validate
```

### 2. Desarrollo de Tasks (Flujo Principal)
```bash
# Crear branch desde develop
git checkout develop
git pull origin develop
git checkout -b feature/T-XX-description

# Workflow con comandos slash (RECOMENDADO)
/context-analyze                    # Analizar contexto del proyecto
/task-dev T-XX                     # Desarrollo con context-awareness
/health-check                      # Validación continua del sistema

# Desarrollo iterativo
yarn dev                           # Start development server
yarn test:e2e                     # Run E2E tests (Playwright)
yarn lint && yarn format          # Quality checks
```

### 3. Validación y Quality Gates
```bash
# Validación rápida (1-8 segundos)
yarn lint                          # ESLint check
yarn tsc-check                     # TypeScript validation
yarn python-format                 # Python auto-format

# Validación completa (pre-PR)
yarn quality-gate                  # Full quality pipeline
yarn test:e2e                     # E2E tests complete
yarn security-scan                # Security audit
```

### 4. Pull Request Creation
```bash
# Automated PR workflow (RECOMENDADO)
/review-complete --scope T-XX      # Multi-agent code review
/commit-smart                      # Smart commit with quality gates
/pr-flow                          # Automated PR creation

# Manual workflow (alternativa)
git add . && git commit -m "feat(scope): description"
git push origin feature/T-XX-description
gh pr create --title "feat(T-XX): Description" --body "..."
```

---

## Validation Commands (Solo Comandos Reales)

### Comandos Directos (Tier 1 - Uso Diario)
```bash
# Development
yarn dev                           # Start development server
yarn build                        # Production build
yarn test                         # Unit tests (Jest)
yarn test:e2e                     # E2E tests (Playwright)

# Quality & Formatting
yarn lint                          # ESLint check
yarn lint:fix                     # ESLint auto-fix
yarn format                       # Prettier formatting
yarn tsc-check                    # TypeScript validation

# Python Backend
yarn python-format                # Black auto-format
yarn python-lint                  # Ruff linting
yarn python-quality               # Full Python quality gate

# Security & Compliance
yarn security-scan                # Security audit (npm + semgrep)
yarn quality-gate                 # Complete quality pipeline

# Environment
yarn env-validate                 # Environment diagnostics
yarn env-info                     # Platform information
```

### Comandos Slash (Tier 2 - Workflow Automation)
```bash
# Daily Workflow
/task-dev T-XX [complete]          # Task development with context
/review-complete [--scope]         # Multi-agent code review
/commit-smart                      # Intelligent commits
/pr-flow [--draft]                 # Pull request automation
/health-check                     # System diagnostics

# Analysis & Documentation
/context-analyze [--depth]        # Project analysis
/docs-update [scope]               # Documentation maintenance
/auto-workflow [scope]             # Context-aware suggestions

# Specialized
/security-audit                   # Security review
/architecture                     # Architecture analysis
/debug-analyze                    # Debug assistance
```

### Multi-Technology Support
El proyecto incluye detección automática de entorno:
- **Windows/WSL/Linux**: Auto-detection via `scripts/multiplatform.cjs`
- **Python Virtual Env**: Auto-activation para backend tools
- **Node.js Tools**: Yarn-first, npm fallback
- **Quality Tools**: 40+ herramientas integradas vía hooks

---

## Pre-commit Hooks y Automation

### Hook System Real
El proyecto utiliza `.claude/hooks.json` (54% optimizado) con:

#### PreToolUse Hooks (Auto-ejecutados)
- **Git Secrets Scan**: 5s timeout
- **Security Scan**: Semgrep + audit (10s)
- **ESLint Check**: Granular config (8s)
- **Environment Check**: Tools availability (8s)

#### PostToolUse Hooks (Auto-formatting)
- **Multi-format Auto-format**: 30s timeout
  - TypeScript/JavaScript: ESLint + Prettier
  - Python: Black + Ruff
  - Markdown: markdownlint + prettier
  - YAML: yamlfix + prettier
  - Shell: shellcheck + shfmt
- **Design Metrics**: CC≤15, LOC≤300 validation (15s)

### No hay Pre-commit Manager
> **Nota**: El proyecto NO usa pre-commit manager tradicional.
> La validación se ejecuta automáticamente vía Claude Code hooks.

---

## GitHub Integration

### Issue Management
```bash
# ⚠️ ALWAYS specify target repository (this repo has forks)
gh issue view <NUMBER> --repo BriamV/AI-Doc-Editor
gh issue close <NUMBER> --repo BriamV/AI-Doc-Editor -c "Resolved in PR #XX"

# Automated issue creation
/issue-generate [type] [scope]     # Create contextual issues
```

### PR Workflow Automation
```bash
# Automated (RECOMENDADO)
/pr-flow                          # Full PR automation with context

# Manual fallback
gh pr create --title "feat(T-XX): Description" \
             --body "## Summary\n- Implementation details\n\n## Test plan\n- [ ] E2E tests pass\n- [ ] Manual testing" \
             --assignee @me
```

---

## Task Management Integration

### Work Plan Alignment
- **Pattern**: T-XX task identification
- **Status**: `docs/DEVELOPMENT-STATUS.md`
- **Tools**: `tools/task-navigator.sh T-XX`, `tools/progress-dashboard.sh`

### Task Development Workflow
```bash
# Context-aware task development
/task-dev T-XX                    # Auto-detects task context
tools/task-navigator.sh T-XX      # Task details
tools/extract-subtasks.sh T-XX    # Development planning

# Mark completion
tools/qa-workflow.sh T-XX dev-complete
/commit-smart                     # Quality gates + commit
```

---

## Common Workflows

### 1. Feature Development (Standard)
```bash
git checkout -b feature/T-42-document-export develop
/task-dev T-42
# Development...
yarn quality-gate && yarn test:e2e
/review-complete --scope T-42
/pr-flow
```

### 2. Bug Fix (Non-critical)
```bash
git checkout -b fix/editor-save-button develop
# Fix implementation...
yarn lint:fix && yarn test
git commit -m "fix(editor): resolve save button state issue"
/pr-flow
```

### 3. Documentation Update
```bash
git checkout -b docs/api-documentation develop
/docs-update api-spec
# Documentation changes...
yarn api-spec                    # Validate API spec
git commit -m "docs(api): update FastAPI endpoint documentation"
/pr-flow
```

### 4. Release Preparation
```bash
git checkout -b release/R1 develop
/release-prep
# Release testing and preparation...
git checkout main
git merge --no-ff release/R1
git tag v1.0.0
git push origin main --tags
```

### 5. Hotfix (Critical)
```bash
git checkout -b hotfix/security-patch main
/hotfix-flow
# Critical fix...
git checkout main && git merge --no-ff hotfix/security-patch
git tag v1.0.1
git checkout develop && git merge --no-ff hotfix/security-patch
```

---

## Quality Standards

### Code Quality Metrics
- **Complexity**: CC ≤ 15 (enforced via hooks)
- **Lines of Code**: LOC ≤ 300 per file
- **Coverage**: Monitored via Jest + Playwright
- **Security**: Semgrep + npm audit + git-secrets

### Performance Benchmarks
- **Hook Execution**: 54% optimizado (152s → 70s)
- **Validation Speed**: 1-8s para checks iterativos
- **Quality Gate**: <2 minutos completo

### Multi-Technology Standards
- **Frontend**: ESLint (max-warnings=0) + Prettier + TSC
- **Backend**: Black + Ruff + Radon + MyPy
- **Documentation**: markdownlint + yamlfix + spectral
- **Security**: TLS 1.3+, AES-256, GDPR compliance

---

## Troubleshooting

### Environment Issues
```bash
yarn env-validate                 # Comprehensive diagnostics
yarn env-info                     # Platform details
/health-check                     # System-wide validation
```

### Quality Gate Failures
```bash
# Check specific issues
yarn lint                         # ESLint errors
yarn python-quality               # Python quality issues
yarn security-scan               # Security problems

# Auto-fix when possible
yarn lint:fix                     # Fix ESLint issues
yarn python-format               # Fix Python formatting
```

### Workflow Issues
```bash
/context-analyze                  # Current context analysis
/auto-workflow                    # Suggested next actions
tools/progress-dashboard.sh       # Project status overview
```

---

## Migration from Legacy Patterns

### DEPRECATED Patterns (No usar)
```bash
# ❌ OLD (DEPRECATED)
yarn run cmd <command>            # Use yarn <command>
yarn test:cypress                 # Use yarn test:e2e (Playwright)
scripts/cli.cjs                   # Use direct yarn commands

# ✅ NEW (Current)
yarn <command>                    # Direct execution
yarn test:e2e                     # Playwright E2E
/slash-commands                   # Workflow automation
```

### Performance Improvements
- **54% faster execution**: Direct commands vs legacy CLI
- **Real-time validation**: Via .claude/hooks.json
- **Context-aware automation**: Slash commands with GitFlow detection

---

## Integration Policy

Todas las mejoras DEBEN:
1. **Documentarse** en esta guía con comandos concretos
2. **Integrarse** con tools/ existentes y .claude/hooks.json
3. **Probarse** antes de documentar
4. **Eliminar redundancias** y mantener consistencia

Para mayor información:
- **Project Setup**: `CLAUDE.md`
- **Work Plan**: `docs/WORK-PLAN v5.md`
- **Development Status**: `docs/DEVELOPMENT-STATUS.md`
- **Task Management**: `tools/` directory scripts