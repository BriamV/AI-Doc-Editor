# REF-003: QA System Architecture Refactoring

## Status

**Completed** - `refactor/qa-code-quality` branch

## Context

The QA system has grown organically and now violates project DESIGN_GUIDELINES, particularly the 981 LOC `qa.cjs` file which exceeds the 212 LOC target by 4.6x.

### Current Architecture Issues

1. **DESIGN_GUIDELINES Violations**:
    * `qa.cjs`: 981 LOC (🔴 >>251)
    * `qa-backend-steps.cjs`: 240 LOC (🟡 borderline)
    * `qa-frontend-steps.cjs`: 218 LOC (🟡 borderline)

2. **SOLID Principle Violations**:
    * **SRP**: `qa.cjs` handles CLI commands, validation logic, file detection, tool configuration, and execution.
    * **OCP**: Adding new validation types requires modifying the monolithic file.
    * **DIP**: Depends on concrete implementations, not abstractions.

3. **Code Duplication**:
    * Logger usage patterns
    * File system operations
    * Command execution patterns
    * Error handling

### Critical Dependencies (DO NOT BREAK)

1. **CLI Interface**: 20+ commands in `scripts/cli.cjs` all point to `qa.cjs`.
2. **DoD Validation**: `tools/validate-dod.sh` depends on `yarn run cmd qa-gate`.
3. **QA Workflow**: `tools/qa-workflow.sh` uses QA commands (ADR-008).
4. **CI/CD Pipeline**: GitHub Actions use QA commands.

## Decision

Implement a **Hybrid Architecture Evolution** approach:

* **Phase 1**: Pragmatic refactoring (maintain compatibility, reduce LOC).
* **Phase 2**: Hybrid architecture migration (Context-Driven UX + Dimensions-Based Engine).

## Implementation Plan

### Phase 1: Pragmatic Refactoring (Immediate)

**Goal**: Reduce `qa.cjs` from 981 LOC to <212 LOC without breaking changes.

#### 1.1 Remove Dead Code
* Delete `qa-orchestrator.cjs` (dead code with broken dependencies).
* Remove unused imports and functions.

#### 1.2 Extract Common Utilities
```bash
scripts/qa/shared/
├── QALogger.cjs          # <100 LOC - Centralized logging
├── QAFileOperations.cjs  # <100 LOC - File system utilities
├── QACommandExecutor.cjs # <100 LOC - Command execution patterns
└── QAErrorHandler.cjs    # <50 LOC - Error handling
```

#### 1.3 Split qa.cjs by Responsibility
```bash
scripts/qa/commands/
├── qa-commands.cjs       # <150 LOC - CLI interface only
├── qa-design-validation.cjs # <150 LOC - Design guidelines validation
├── qa-scope-validation.cjs  # <150 LOC - File/scope validation
└── qa-workflow-context.cjs # <150 LOC - Context-aware validation
```

#### 1.4 Maintain API Compatibility
```javascript
// scripts/commands/qa.cjs (new - facade pattern)
const { runLint, runLintFix } = require('../qa/commands/qa-commands.cjs');
const { validateDesignGuidelines } = require('../qa/commands/qa-design-validation.cjs');
// ... etc

module.exports = {
  runLint,
  runLintFix,
  validateDesignGuidelines,
  // ... all existing exports
};
```

### Phase 2: Hybrid Architecture (Context + Dimensions)

**Goal**: A Context-Driven UX + Dimensions-Based Engine with a SOLID infrastructure.

#### Core Concept
* **Problem Solved**: Combine intuitive usability (development context) with a scalable technical organization capable of validating a polyglot environment (Frontend: TypeScript/React, Backend: Python/Databases).
* **Hybrid Solution**:
  * **INTERFACE**: Context-Driven → Automatically detects what to validate based on the developer's context.
  * **ENGINE**: Dimensions-Based → Organizes validations by technical dimensions, with tools specific to each technology stack.
  * **INTELLIGENT MAPPING**: Context → Relevant Dimensions → Specific Tools (JS/TS, Python, etc.).

#### Hybrid Architecture: Two Interfaces, One Engine

##### 🎯 PRIMARY INTERFACE: Context-Driven (For Developers)
* `yarn run cmd qa` → Auto-detects context (branch, changes) and runs.
* `yarn run cmd qa T-02` → Validates a task against its Definition of Done (DoD).
* `yarn run cmd qa refactor` → Validates a refactoring branch against modified files.
* `yarn run cmd qa --fast` → Pre-commit hook: critical validations (<10s).

##### 🔧 UNIFIED ENGINE: Dimensions-Based Engine (Multi-Stack)
* **🎯 Error Detection**: FE: TypeScript, ESLint, Prettier | BE: Pylint, Black, MyPy
* **🧪 Testing & Coverage**: FE: Jest, Testing Library | BE: Pytest, Coverage.py
* **🏗️ Build & Dependencies**: FE: Vite build, npm audit | BE: Poetry check, Safety, Docker build
* **📏 Design Metrics**: FE/BE: LOC, complexity, code duplication
* **🛡️ Security & Audit**: FE: Snyk/npm audit | BE: Bandit, Snyk
* **🔗 Data & Compatibility**: BE: DB migration validation, API compatibility (Pact)

##### 🔍 SECONDARY INTERFACE: Scoping & Debug (Explicit Control)
* `yarn run cmd qa --scope=frontend` → Validates the entire frontend.
* `yarn run cmd qa --scope=backend` → Validates the entire backend.
* `yarn run cmd qa --scope=tooling` → Validates infrastructure files (scripts/, tools/, configs).
* `yarn run cmd qa --scope=src/api/utils.py` → Validates a specific file.
* `yarn run cmd qa --dimension=testing` → Runs only the testing dimension on the detected scope.

#### Mapped Use Cases

* **CASE 1: Task Development (T-XX)**
  * **Command**: `yarn run cmd qa T-02`
  * **Action**: Auto-detects the task context. Extracts the DoD criteria, maps them to relevant dimensions (e.g., testing, error-detection), and runs the corresponding tools for the tech stacks involved in the task.

* **CASE 2: Refactoring**
  * **Command**: `yarn run cmd qa` (on a `refactor/...` branch)
  * **Action**: Detects the refactoring context. It analyzes modified files (`git diff`), detects their stack (Python or TS), and runs relevant incremental validations and regression tests.

* **CASE 3: Pre-commit Hook**
  * **Command**: `yarn run cmd qa --fast`
  * **Action**: Detects staged files (`git diff --cached`). It runs only the fastest, most critical validations (formatting, basic linting) for immediate feedback (<10s).

* **CASE 4: Full-Stack & Scoped Validation**
  * **Command**: `yarn run cmd qa --scope=backend`
  * **Action**: Ignores the branch context. Focuses validation exclusively on the `backend/` directory. It runs all applicable dimensions for Python: Pylint, Pytest, Bandit, etc. Ideal for full-stack reviews.
  * **Command**: `yarn run cmd qa --scope=frontend/src/components/Login.tsx --dimension=testing`
  * **Action**: Runs only the tests (Jest/Testing Library) for the `Login.tsx` component. Perfect for debugging and focused development.

#### Scalable Infrastructure Design
* **Problem**: The monolith prevents growth and technology-specific specialization.
* **Solution**: 17+ focused modules with natural ≤212 LOC boundaries, organized for a polyglot environment.

```bash
scripts/qa-v2/
├── shared/           # QALogger, QAResult, QAConfig (language-agnostic)
├── interfaces/       # IContext, IDimension, ITool (architecture contracts)
├── core/             # ContextDetector, DimensionMapper, Orchestrator
├── contexts/         # TaskContext, RefactorContext, CommitContext
├── dimensions/       # Modules by dimension, with logic separated by stack
│   ├── error-detection/
│   │   ├── frontend.cjs  # Logic for ESLint/Prettier
│   │   └── backend.cjs   # Logic for Pylint/Black
│   ├── testing/
│   │   ├── frontend.cjs  # Logic for Jest
│   │   └── backend.cjs   # Logic for Pytest
│   └── ... (etc.)
└── integration/      # ToolsIntegration, WorkflowIntegration
```

#### Anti-Pattern Prevention
* **Adding a new tool** (e.g., `flake8` for Python): A new module `dimensions/error-detection/backend-flake8.cjs` (<100 LOC) is created instead of modifying a monolithic file.
* **Team Growth**: A frontend team and a backend team can work in parallel on `dimensions/testing/frontend.cjs` and `dimensions/testing/backend.cjs` without conflicts.
* **LOC Compliance**: The architecture imposes natural boundaries. A testing validation file for a single stack should not grow excessively.

#### ROI & Strategic Value
* **Investment**: 2-3 weeks to implement the base infrastructure.
* **Returns**:
  * **Speed**: Adding validations for new languages (Go, Rust) or stacks is 5x faster.
  * **Maintainability**: Debugging a failure in the Python tests only requires reviewing `dimensions/testing/backend.cjs`.
  * **Scalability**: Zero merge conflicts between frontend and backend teams.
  * **Clarity**: The architecture directly reflects the project's technological structure.

## Validation & Risk Mitigation

* **Critical Requirements**: ≤212 LOC per module, 100% API compatibility, `tools/` integration.
* **Rollback Plan**: `qa.cjs.backup` + feature branch + documented changes.
* **Key Risks**: CLI breaking (mitigated by facade pattern), DoD failure (mitigated by API compatibility), performance degradation (mitigated by benchmarking).

## Related Documents

* **DESIGN_GUIDELINES.md**: Defines LOC targets (≤212).
* **ADR-008**: Describes the QA Workflow.
* **scripts/cli.cjs**: Contains all CLI commands.

## Current Project Status

### ✅ Phase 1: Pragmatic Refactoring - COMPLETED
* **Achievements**: Modular QA system, ≤212 LOC per module, 100% CLI compatibility, QA Gate output fixed.
* **Critical fixes**: Consistent QALogger, robust QARunner, proper exit codes, status hierarchy (Failed > Warnings > Passed).

### 🚀 Phase 2: Hybrid Architecture - IMPLEMENTED
* **Architecture**: Hybrid (Context-Driven UX + Dimensions-Based Engine).
* **Base Command**: `yarn run cmd qa`.
* **Key Component**: Centralized FileClassifier for consistent file type detection across all dimensions.

### 🗑️ Legacy System Decommissioning - COMPLETED
* **Clean Break Executed**: All Phase 1 components completely removed.
* **Files Removed**: 15 legacy files including qa.cjs facade, qa-gate.cjs, scripts/qa/ directory.
* **CLI Updated**: 28 legacy commands removed, only `qa` command remains pointing to qa-hybrid.
* **Result**: qa-hybrid is now the single source of truth with zero technical debt.

## Final Status and Decisions

* **Date**: 2025-07-04
* **Branch**: `refactor/qa-code-quality`
* **Status**:
  * ✅ **Phase 1**: Pragmatic refactoring completed.
  * ✅ **Phase 2**: Hybrid architecture implemented with tooling scope support.
  * ✅ **Decommissioning**: Legacy system completely removed, clean architecture achieved.
* **Strategic Outcomes**:
  * **Infrastructure Investment**: Prevents future refactoring cycles and technical debt.
  * **Team Scalability**: Enables parallel development without conflicts.
  * **Maintainability**: Enforces natural LOC limits through architectural boundaries.
  * **Extensibility**: Allows adding features without touching existing code.

### Legacy System Decommissioning

**Decision**: Upon successful implementation and validation of the Phase 2 Hybrid Architecture, the entire Phase 1 implementation, including the facade layer and intermediate modules, must be completely and cleanly removed.

**Action**: No further effort shall be invested in maintaining or fixing the Phase 1 components. The goal is not to support two systems but to execute a full replacement.

**Scope of Removal**: This includes deleting the `scripts/commands/qa.cjs` facade, the split-out command files (`qa-design-validation.cjs`, etc.), and refactoring all entry points (`scripts/cli.cjs`, CI/CD workflows) to directly use the new Phase 2 architecture.

**Rationale**: This clean-break approach is critical to prevent technical debt, eliminate architectural ambiguity, and ensure that the new system is the single source of truth, leaving no garbage code or potential for error from legacy artifacts.