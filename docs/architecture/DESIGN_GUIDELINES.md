# Design and Development Guidelines

Modern design principles and coding standards for AI-Doc-Editor.

## Section 1: Current Architecture (WHAT EXISTS)

### Technology Stack

- **Frontend**: React 18.2.0 + TypeScript 5.6.3 + Vite 7.1.7 + TailwindCSS 3.2.7
- **Backend**: Python 3.11+ FastAPI + SQLAlchemy + Alembic
- **Desktop**: Electron 38.1.0 + electron-updater 6.6.8
- **State Management**: Zustand 4.3.6 + IndexedDB (idb-keyval 6.2.1)
- **Editor**: Lexical 0.11.1 with @lexical/react
- **Testing**: Playwright 1.55.0 (E2E primary) + Vitest 2.0.5 (unit) + pytest (backend)
- **Security**: Semgrep SAST + npm audit + pip-audit + git-secrets (Gitleaks)
- **AI Integration**: OpenAI Chat Completions API (frontend streaming)

### Project Structure

```
AI-Doc-Editor/
├── src/                    # Frontend (React 18 + TypeScript)
│   ├── components/         # React components (Chat, Document, Menu)
│   ├── store/              # Zustand state management
│   ├── hooks/              # Custom React hooks
│   ├── api/                # API client layer
│   └── docs/               # Frontend implementation docs
├── backend/                # Backend (Python FastAPI)
│   ├── app/
│   │   ├── services/       # Business logic (audit, auth, config, credentials)
│   │   ├── models/         # SQLAlchemy models
│   │   ├── security/       # Security modules (encryption, OAuth)
│   │   └── api/            # FastAPI routers
│   ├── tests/              # Integration, performance, security tests
│   └── docs/               # Backend implementation docs
├── .claude/                # Claude Code automation
│   ├── commands/           # 43 slash commands
│   ├── scripts/            # 9 hook scripts
│   └── hooks.json          # Hook orchestration (6 lifecycle events)
├── docs/                   # Spanish documentation (user-facing)
├── tools/                  # Project workflow scripts (task management)
└── scripts/                # Infrastructure automation (17 scripts)
```

### Implemented Services (backend/app/services/)

- **audit.py**: WORM-compliant audit logging (T-13)
- **audit_service_utils.py**: Audit utilities and helpers
- **audit_queries.py**: Audit query operations
- **auth.py**: OAuth 2.0 authentication with JWT
- **config.py**: Application configuration management
- **credentials.py**: Encrypted credential storage (Fernet AES-256)

### API Endpoints (OpenAPI 3.0.3)

Current implementation (docs/architecture/api/openapi-specification.yaml):

- **Health**: `/`, `/api/healthz`
- **Auth**: `/api/auth/login`, `/api/auth/logout`, `/api/auth/token`
- **Config**: `/api/config`, `/api/config/{key}`
- **Credentials**: `/api/credentials`, `/api/credentials/{id}`
- **Audit**: `/api/audit/logs`, `/api/audit/search`
- **Security**: `/api/security/validate`

## Section 2: Quality Standards (ENFORCED)

### Cyclomatic Complexity (CC)

- **Threshold**: ≤15 (fail if exceeded)
- **Bands**:
  - 🟢 Green: CC ≤ 10 (optimal)
  - 🟡 Yellow: CC 11-15 (acceptable, refactor if time permits)
  - 🔴 Red: CC > 15 (blocks commit)
- **Enforcement**:
  - Frontend: ESLint `complexity` rule (eslint.config.js:67)
  - Backend: Radon rank C via python-cc-gate.cjs (scripts/python-cc-gate.cjs)
  - Hooks: .claude/scripts/quality-metrics.sh (PostToolUse after Edit/Write)

### Lines of Code (LOC)

- **Threshold**: ≤300 lines per file (fail if exceeded)
- **Bands**:
  - 🟢 Green: LOC ≤ 212 (optimal, 70% of max)
  - 🟡 Yellow: LOC 213-300 (acceptable)
  - 🔴 Red: LOC > 300 (blocks commit)
- **Enforcement**:
  - Frontend: ESLint `max-lines` rule (eslint.config.js:68)
  - Backend: quality-metrics.sh validation
  - Hooks: .claude/scripts/quality-metrics.sh (PostToolUse after Edit/Write)

### Line Length

- **Backend**: 100 characters (pyproject.toml:71)
  - Black formatter enforces automatically
  - Configured in backend/pyproject.toml [tool.black]
- **Frontend**: No strict limit (recommended ≤120 for readability)
  - Prettier handles formatting
  - Focus on readability over strict enforcement

### Test Coverage

- **Backend**: ≥60% (enforced via pytest --cov-fail-under=60)
  - Target: 80% (aspirational goal)
  - Configuration: backend/pyproject.toml [tool.coverage]
- **Frontend**: Unit tests with Vitest, E2E with Playwright
  - E2E tests are primary testing strategy
- **Commands**:
  - `yarn be:test:coverage` - Backend coverage report
  - `yarn fe:test` - Frontend unit tests
  - `yarn e2e:all` - Complete E2E suite (frontend + backend)

### Security Standards

- **Zero Vulnerabilities**: Maintained across 1,782+ packages (dependencies + devDependencies)
- **OWASP Top 10**: Complete compliance
- **Encryption**: AES-256-GCM (Fernet) for data at rest
- **Transport**: TLS 1.3+ with Perfect Forward Secrecy
- **SAST**: Semgrep scanning on every commit via hooks
- **Dependency Audit**: npm audit (frontend) + pip-audit (backend)
- **Secret Detection**: Gitleaks scanning (opt-in via sec:secrets)
- **Commands**: `yarn sec:all` - Complete security pipeline

## Section 3: Development Workflow (AUTOMATED)

### Quality Gates

```bash
# Multi-stack validation (40+ tools integrated)
yarn qa:gate                # Full pipeline (~70s)
yarn qa:gate:dev            # Development mode (~45s, skip heavy tools)
yarn qa:gate:fast           # Fast validation (~30s, essential only)

# Stack-specific validation
yarn fe:quality             # Frontend: lint + format + typecheck
yarn be:quality             # Backend: format + lint + complexity
```

### Claude Code Hooks (.claude/hooks.json)

**Automated quality enforcement (6 lifecycle events):**

1. **SessionStart**: `session-context.sh` - GitFlow context detection
2. **UserPromptSubmit**: `inject-context.sh` - Dynamic context injection
3. **PreToolUse (Bash)**: `bash-protection.sh` - Prevent destructive git operations
4. **PreToolUse (Edit/Write)**: `pre-edit-checks.sh` - Pre-modification validations
5. **PostToolUse (Edit/Write)**: Three parallel hooks:
   - `auto-format.sh` - Multi-language formatting (TypeScript, Python, YAML, Markdown, TOML, Shell, JSON, CSS)
   - `quality-metrics.sh` - CC≤15 + LOC≤300 validation with green/yellow/red bands
   - `security-validation.sh` - SAST + secret scanning + dependency audits
6. **SubagentStop**: `subagent-summary.sh` - Sub-agent execution summary

**9 hook scripts total**: All located in .claude/scripts/

### Namespaced Commands (ADR-012)

**8 namespaces operational (185/185 commands at 100% success, 54% faster execution):**

```bash
# Repository operations (repo:)
yarn repo:clean             # Clean workspace (node_modules, dist, coverage, cache)
yarn repo:install           # Install dependencies (--immutable --check-cache)
yarn repo:merge:validate    # Merge protection (MANDATORY before merges)

# Frontend operations (fe:)
yarn fe:build               # Vite build
yarn fe:lint                # ESLint with --max-warnings=0
yarn fe:typecheck           # TypeScript validation (tsc --noEmit)
yarn fe:format              # Prettier auto-format

# Backend operations (be:)
yarn be:format              # Black auto-format (line-length=100)
yarn be:lint                # Ruff lint (autofix with --fix)
yarn be:complexity          # Radon CC validation (≤15)
yarn be:test                # pytest test suite

# End-to-end testing (e2e:)
yarn e2e:fe                 # Playwright E2E tests
yarn e2e:fe:ui              # Playwright interactive UI mode
yarn e2e:be                 # Backend integration tests
yarn e2e:all                # Complete E2E suite (FE + BE)

# Security operations (sec:)
yarn sec:sast               # Semgrep SAST scanning
yarn sec:deps:fe            # Frontend dependency audit (npm audit)
yarn sec:deps:be            # Backend dependency audit (pip-audit)
yarn sec:secrets            # Secret scanning (Gitleaks)
yarn sec:all                # Complete security pipeline

# Quality assurance (qa:)
yarn qa:gate                # Complete quality pipeline (~70s)
yarn qa:gate:dev            # Development mode (~45s)
yarn qa:gate:fast           # Fast validation (~30s)

# Documentation (docs:)
yarn docs:validate          # Document placement validation (PowerShell/WSL/Linux)
yarn docs:api:lint          # API spec validation (redocly)

# Aggregators (all:)
yarn all:dev                # Start frontend + backend servers (concurrently)
yarn all:build              # Build frontend + desktop application
yarn all:test               # Complete test suite (FE + BE + E2E)
```

### Slash Commands (.claude/commands/)

**43 workflow orchestrators with automatic sub-agent delegation:**

**Daily Workflow (Tier 1):**

```bash
/task-dev T-XX              # Task development with context
/commit-smart               # Intelligent commits with quality gates
/pr-flow                    # Pull request automation
/merge-safety               # Merge validation (MANDATORY before merges)
/health-check               # System diagnostics
/review-complete            # Multi-agent code review
```

**Specialized (Tier 2):**

```bash
/security-audit             # Security assessment
/architecture               # Architecture integrity check
/debug-analyze              # Debugging workflows
/pipeline-check             # CI/CD validation
```

**Advanced (Tier 3):**

```bash
/release-prep               # Release preparation
/hotfix-flow                # Emergency fixes
/adr-create                 # Architecture decision records
```

## Section 4: Architectural Principles (TIMELESS)

### Hexagonal Architecture

- **Core domain**: Isolated business logic (backend/app/services/)
- **Ports**: Interfaces defining contracts (protocols, abstract base classes)
- **Adapters**: Infrastructure implementations (API routers, database, external services)
- **Benefits**: Testability, flexibility, independent evolution of layers

### SOLID Principles

- **Single Responsibility (S)**: Each class/module has one reason to change
- **Open/Closed (O)**: Extend without modifying existing code
- **Liskov Substitution (L)**: Subclasses must be substitutable for base classes
- **Interface Segregation (I)**: Specific interfaces over general ones
- **Dependency Inversion (D)**: Depend on abstractions, not implementations

### Frontend/Backend Separation

- **Frontend**: `src/` - React 18 + TypeScript + Vite
- **Backend**: `backend/` - Python FastAPI + SQLAlchemy
- **Communication**: REST APIs exclusively (OpenAPI 3.0.3 specification)
- **Deployment**: Independent CI/CD pipelines (GitHub Actions)
- **Zero cross-contamination**: No frontend code in backend, no backend code in frontend

### Dual Directory Architecture (ADR-011)

**Conway's Law Compliance**: Implementation docs ≤2 directories from code

- **tools/**: Project workflow management (task navigation, progress tracking)
- **scripts/**: Infrastructure automation (17 essential scripts)
- **src/docs/**: Frontend implementation docs (React, Zustand, hooks)
- **backend/docs/**: Backend implementation docs (API, database, security)
- **docs/architecture/**: Architecture decisions (ADRs)
- **docs/**: Spanish user-facing documentation

### Security-First Design

- **Encryption at rest**: Fernet AES-256-GCM for credentials
- **Encryption in transit**: TLS 1.3+ with Perfect Forward Secrecy
- **Authentication**: OAuth 2.0 with JWT tokens
- **Authorization**: Role-based access control (RBAC)
- **Audit logging**: WORM-compliant tamper-proof logs (T-13)
- **Input validation**: Pydantic v2 schemas with strict type checking
- **Secret management**: Never commit secrets, use environment variables

### Code Quality Philosophy

- **Clean Code**: Self-documenting, minimal comments, clear naming
- **Refactoring**: Continuous improvement, not one-time effort
- **Technical Debt**: Track and prioritize, don't accumulate
- **Premature Optimization**: Avoid. Optimize only with metrics
- **Simplicity**: Prefer readable code over clever code

## Section 5: Code Standards

### Python (Backend)

- **Style**: PEP 8 compliance (enforced via Ruff)
- **Formatting**: Black with line-length=100 (pyproject.toml:71)
- **Type Hints**: Recommended for function signatures (MyPy configured)
- **Docstrings**: Google style with Args/Returns/Raises sections
- **Async**: FastAPI async/await patterns
- **Dependency Injection**: Use `fastapi.Depends` for testability
- **Error Handling**: Custom exceptions with proper HTTP status codes
- **Validation**: Pydantic v2 models (ADR-001)

### TypeScript (Frontend)

- **Style**: ESLint + Prettier
- **Type Safety**: Strict TypeScript mode enabled (tsconfig.json)
- **Components**: Functional components with hooks
- **State**: Zustand stores with TypeScript interfaces
- **Props**: Explicit type definitions for all components
- **Error Boundaries**: Graceful error handling with fallback UI
- **Performance**: React.memo, useMemo, useCallback where appropriate

### Testing Standards

- **Unit Tests**: Vitest (frontend), pytest (backend)
- **Integration Tests**: pytest (backend API tests)
- **E2E Tests**: Playwright (primary testing strategy)
- **Test Naming**: Descriptive names revealing intent
- **Test Structure**: Arrange-Act-Assert pattern
- **Mocking**: Minimal mocking, prefer real implementations when feasible
- **Coverage**: ≥60% enforced (backend), aim for 80%

## Section 6: Documentation Standards

### Code Documentation

- **Python**: Google-style docstrings for all public functions/classes
- **TypeScript**: JSDoc comments for components, hooks, utilities
- **Inline Comments**: Only for complex logic that isn't self-evident
- **README Files**: Template-based (6 categories, see docs/templates/)

### Architecture Documentation

- **ADRs**: Mandatory for architectural decisions (docs/architecture/adr/)
  - 12 ADRs currently documented
  - Template: docs/architecture/adr/ADR-000-template.md
- **API Specification**: OpenAPI 3.0.3 maintained in sync with code
- **Diagrams**: Mermaid diagrams for complex flows
- **Bilingual**: Spanish user-facing docs, English technical docs

### Documentation Placement (ADR-011)

**Conway's Law Compliance**: Implementation docs ≤2 directories from code

- **Frontend implementation**: `src/docs/` (React, Zustand, hooks)
- **Backend implementation**: `backend/docs/` (API, database, security)
- **Architecture decisions**: `docs/architecture/adr/`
- **User-facing docs**: `docs/` (Spanish primary language)
- **Templates**: `docs/templates/` (6 README templates + validation checklist)

## Section 7: CI/CD Pipeline

### GitHub Actions Workflows

- **ci.yml**: Integration testing (frontend + backend)
- **pr-validation.yml**: PR quality gates
- **document-validation.yml**: Documentation compliance
- See `.github/workflows/README.md` for complete workflow documentation

### Pipeline Stages

1. **Linting**: ESLint (frontend) + Ruff (backend)
2. **Formatting**: Prettier + Black validation
3. **Type Checking**: TSC (frontend) + MyPy (backend)
4. **Complexity**: Radon CC ≤15 validation
5. **Unit Tests**: Vitest + pytest
6. **Integration Tests**: pytest backend integration
7. **E2E Tests**: Playwright critical flows
8. **Security**: Semgrep SAST + dependency audits (npm + pip)
9. **Build**: Vite frontend + Electron desktop
10. **Deploy**: Automated deployment on merge to main

### Pre-merge Requirements (MANDATORY)

```bash
# ALWAYS run before merging to main
yarn repo:merge:validate    # File count, directory structure, config integrity
/merge-safety               # Complete merge protection (slash command)

# Install git hooks for automatic protection
yarn repo:merge:hooks:install
```

**Protection Features:**

- 📊 File count comparison (prevents 250+ file loss)
- 📁 Critical directory structure validation
- 📄 Essential file existence checks
- ⚙️ Configuration integrity verification
- 📋 Development status consistency
- 🏛️ ADR files presence validation
- 🔒 Git hooks for native protection (via scripts/install-merge-hooks.cjs)

## Section 8: Future Work (DEFERRED/PLANNED)

### AI Generation Pipeline (Deferred)

- **Endpoints**: `/plan`, `/draft_section`, `/export` (not implemented)
- **Services**: PlanningService, SectionsService, ExportService (deferred)
- **Rationale**: Focus on security, infrastructure, and core functionality first
- **ADR**: See docs/architecture/adr/ADR-002-defer-orchestrators.md

### Advanced Features (Planned)

- **WebSocket Streaming**: Real-time AI generation progress (deferred)
- **Background Jobs**: Celery + Redis for long-running tasks (deferred)
- **Virtualization**: react-window for large documents (optimization deferred)
- **Monaco Editor**: Evaluate Monaco vs Lexical for production (evaluation pending)

### Quality Targets (Aspirational)

- **Test Coverage**: Increase from 60% to 80%
- **Performance**: Sub-second API response times
- **Accessibility**: WCAG 2.1 AAA compliance
- **Internationalization**: Full i18n support beyond Spanish/English

---

## References

### Architecture Decision Records

- **ADR-001**: Pydantic V2 Validation
- **ADR-002**: Defer Orchestrators (AI generation pipeline)
- **ADR-003**: Baseline CI/CD
- **ADR-004**: Pydantic V2 Deferral
- **ADR-005**: API Key Model
- **ADR-006**: Dependency Security Scanning
- **ADR-007**: Makefile to Node.js Migration
- **ADR-008**: QA Workflow Enhancement
- **ADR-009**: QA CLI to Hooks Migration
- **ADR-010**: E2E Testing Playwright Migration
- **ADR-011**: Scripts/Tools Dual Directory Architecture
- **ADR-012**: Package.json Namespace Architecture

### Documentation

- **CLAUDE.md**: Operational commands and workflow guidance
- **CONTRIBUTING.md**: Contribution guidelines and Git workflow
- **docs/templates/**: 6 README templates + validation checklist
- **.github/workflows/README.md**: CI/CD infrastructure documentation
- **docs/architecture/api/openapi-specification.yaml**: Complete API specification

### Quick Command Reference

```bash
# Development
yarn all:dev                # Start frontend + backend servers

# Quality validation
yarn qa:gate                # Complete quality pipeline (~70s)
yarn qa:gate:dev            # Development mode (~45s)

# Testing
yarn e2e:all                # Complete E2E suite (Playwright + backend)
yarn be:test:coverage       # Backend coverage (≥60% enforced)

# Security
yarn sec:all                # Complete security pipeline (0 vulnerabilities)

# Merge protection
yarn repo:merge:validate    # MANDATORY before merging
```