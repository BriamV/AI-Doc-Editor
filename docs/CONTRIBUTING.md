# Contributing to AI-Doc-Editor

This project follows a GitFlow-inspired workflow to ensure code stability, facilitate parallel development, and align with our release-based planning documented in `WORK-PLAN v5.md`.

## Core Concepts

- **Main Branches**: `main` and `develop` are long-lived branches.
- **Supporting Branches**: `feature/*`, `release/*`, and `hotfix/*` are temporary and have specific purposes.

---

## Branching Strategy

### 1. `main`
- **Purpose**: Contains production-ready, stable code. Every commit on `main` represents a new version and should be deployable.
- **Rule**: Direct commits are forbidden. Merges only come from `release/*` or `hotfix/*` branches.
- **Tagging**: Each merge into `main` must be tagged with a version number (e.g., `v0.1.0`).

### 2. `develop`
- **Purpose**: The primary integration branch for ongoing development. It reflects the latest delivered development changes for the next release.
- **Rule**: All `feature/*` branches are merged into `develop` via Pull Requests.

### 3. `feature/T<ID>-<short-description>`
- **Purpose**: To develop a specific task defined in the work plan (e.g., T-02, T-41).
- **Workflow**:
    1.  Create the branch from `develop`: `git checkout -b feature/T-02-oauth-integration develop`
    2.  Work on the feature and commit your changes.
    3.  Once complete, open a Pull Request to merge back into `develop`.
    4.  The branch is deleted after the merge is complete.

### 4. `release/R<Number>`
- **Purpose**: To prepare a new production release. This branch is used for final testing, bug fixing, and documentation updates specific to the release.
- **Workflow**:
    1.  Create the branch from `develop` when it's feature-complete for the release (e.g., `git checkout -b release/R0 develop`).
    2.  No new features are added here, only bug fixes and release-specific changes.
    3.  Once stable, the release branch is merged into `main` and tagged.
    4.  It is also merged back into `develop` to incorporate any last-minute fixes.
    5.  The branch is deleted after the release.

### 5. `hotfix/*`
- **Purpose**: To address critical bugs in a production version urgently.
- **Workflow**:
    1.  Create the branch from `main` (from the specific version tag).
    2.  Fix the bug and increment the patch version number.
    3.  Merge the hotfix back into both `main` and `develop`.

---

## Pull Request (PR) Workflow

1.  **Create your PR**: When your `feature/*` branch is complete, open a Pull Request targeting the `develop` branch.
2.  **Title and Description**: Use a clear title (e.g., `feat(T-02): Implement OAuth Integration`) and a detailed description of the changes. Reference the task ID.
3.  **CI Checks**: Ensure all automated checks (linting, tests, build) pass successfully.
4.  **Code Review**: At least one team member must review and approve the PR.
5.  **Merge**: Once approved and all checks pass, the PR will be squashed and merged into `develop`.

---

## Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. This helps in automating changelog generation and keeping the commit history clean.

**Format**: `<type>(<scope>): <subject>`

- **`type`**: `feat` (new feature), `fix` (bug fix), `docs` (documentation), `style`, `refactor`, `test`, `chore`.
- **`scope`** (optional): The part of the codebase affected (e.g., `auth`, `editor`, `ci`).
- **`subject`**: A concise description of the change.

**Example**: `feat(auth): Implement Google OAuth login flow`

### Setting up pre-commit

Install the hook manager and set up the repository hooks before your first commit:

```bash
yarn add -D pre-commit
yarn pre-commit install
```

Run `yarn pre-commit run --all-files` to verify formatting and linting locally.

### Validation Commands for Development

The project includes an advanced modular validation system with multi-technology support (TypeScript + Python) and workflow context detection:

```bash
# Context-aware validation (auto-detects current task/workflow)
yarn run cmd workflow-context          # Show current context
yarn run cmd validate-task             # Validate based on current task (T-XX)
yarn run cmd validate-staged           # Pre-commit validation

# Performance-optimized validation
yarn run cmd validate-frontend-fast    # Quick frontend check (1-8s)
yarn run cmd validate-backend-fast     # Quick backend check (1-3s)
yarn run cmd validate-modified         # Only modified files

# Complete validation
yarn run cmd validate-all              # Full project validation
yarn run cmd qa-gate                   # Complete quality gate
```

**Workflow Integration**: The system automatically detects your current branch context (feature/T-XX, develop, release/RX) and suggests appropriate validation commands.
