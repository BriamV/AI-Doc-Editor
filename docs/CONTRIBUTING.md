# Contributing

This project uses a simple branching workflow based on `main` and `develop`.

## Branches

- **`main`** – stable, releasable code. Every commit on this branch should be deployable.
- **`develop`** – integration branch for upcoming features. Regularly merged into `main` once stable.
- **`feature/*`** – short-lived branches for specific tasks. Start from `develop` and merge back via pull request.
- **`release/*`** – optional branches used to prepare production releases. After final testing they are merged to both `main` and `develop`.

## Workflow

1. Create a feature branch from `develop`.
2. Commit your changes with descriptive messages.
3. Open a pull request targeting `develop`. Ensure all pre-commit checks and tests pass.
4. Changes are merged after code review approval.

### Setting up pre-commit

Install the hook manager and set up the repository hooks before your first commit:

```bash
yarn add -D pre-commit
yarn pre-commit install
```

Run `yarn pre-commit run --all-files` to verify formatting and linting locally.

