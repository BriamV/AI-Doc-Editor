# Quality Tools Ecosystem (40+ Tools)

**Usage**: This file is imported by CLAUDE.md via @import
**Purpose**: Complete reference for hooks-integrated multi-stack pipeline

**Hooks-Integrated Multi-Stack Pipeline:**

```bash
# Frontend Quality
eslint, prettier, jest, tsc              # TypeScript/JavaScript

# Python Backend Quality
black, ruff, radon, mypy, pip-audit      # Python quality gates

# Security & Secrets
semgrep, git-secrets, yarn sec:deps:fe   # Security scanning

# Documentation
markdownlint, yamlfix, yamllint, spectral # Docs quality
# Template validation (README consistency + placement guidelines)

# Configuration & Shell
taplo, shellcheck, shfmt                 # Config + shell scripts

# Multi-Format Support
prettier (JSON/XML/CSS/HTML)             # Universal formatting
```

**Auto-Detection**: Windows/Linux/WSL + multi-venv support
**Streamlined Architecture**: 5 essential scripts after 55% reduction (ADR-011 compliance)
**Error Handling**: Standardized exit codes + structured logging
**Integration Testing**: Cross-directory interface validation