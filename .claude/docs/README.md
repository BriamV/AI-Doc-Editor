# .claude/docs/ - Claude Code System Documentation

Implementation-specific documentation for the Claude Code integration system, organized by category for improved discoverability.

## 📁 Directory Structure

```
.claude/docs/
├── reference/          # Files imported by CLAUDE.md (@import system)
├── guides/             # Q&A knowledge base and how-to guides
├── specs/              # Specification-only documents (not implemented)
├── archive/            # Historical reports, migrations, and audits
│   ├── reports/        # Historical optimization and implementation reports
│   ├── migrations/     # Migration deliverables and completion summaries
│   └── audits/         # Historical audits and coverage enhancements
└── README.md           # This file
```

---

## 📚 Reference Documentation (4 files)

**Critical**: These files are imported by CLAUDE.md using the `@import` system.

| File | Purpose | Size | Referenced In |
|------|---------|------|---------------|
| [commands-reference.md](reference/commands-reference.md) | Complete 185-command catalog | 120 lines | CLAUDE.md line 56 |
| [quality-tools-reference.md](reference/quality-tools-reference.md) | 40+ tools ecosystem | 29 lines | CLAUDE.md line 146 |
| [protected-files-policy.md](reference/protected-files-policy.md) | Files that must NEVER be modified | 26 lines | CLAUDE.md line 254 |
| [documentation-standards.md](reference/documentation-standards.md) | Standards & templates | 37 lines | CLAUDE.md line 324 |

**Navigation**: `reference/` contains the core reference materials that Claude Code needs for daily operation.

---

## 📖 Guides & Knowledge Base (3 files)

**Purpose**: Q&A knowledge base and troubleshooting guides for system components.

| File | Purpose | Size | Original Name |
|------|---------|------|---------------|
| [claude-code-system-qa.md](guides/claude-code-system-qa.md) | Claude Code system Q&A | 62.7 KB | question-answers-about-claude.md |
| [settings-configuration-qa.md](guides/settings-configuration-qa.md) | Settings configuration Q&A | 18.8 KB | questions-answers-about-settings.md |
| [custom-slash-commands-qa.md](guides/custom-slash-commands-qa.md) | Custom slash commands Q&A | 45.2 KB | qustions-answers-about-csc.md* |

*Note: Fixed typo in original filename (qustions → custom-slash-commands)

**Navigation**: `guides/` contains comprehensive Q&A documentation (165+ KB total).

---

## 📋 Specifications (1 file)

**Status**: Specification-only documents describing desired functionality (not yet implemented).

| File | Purpose | Status | Notes |
|------|---------|--------|-------|
| [claude-md-self-management-spec.md](specs/claude-md-self-management-spec.md) | CLAUDE.md self-management specification | SPEC ONLY | Replaced by deterministic shell scripts |

**Navigation**: `specs/` contains specification documents for features not yet implemented.

---

## 📦 Archive (11 files)

**Purpose**: Historical reports, migrations, and audits (read-only, point-in-time records).

### Reports (5 files)
Historical optimization and implementation reports:

| File | Purpose | Date |
|------|---------|------|
| [claude-md-optimization-changelog.md](archive/reports/claude-md-optimization-changelog.md) | CLAUDE.md optimization history | 2025-09-30 |
| [claude-md-upgrade-qa-report.md](archive/reports/claude-md-upgrade-qa-report.md) | Upgrade QA report | 2025-09-30 |
| [functional-hooks-implementation.md](archive/reports/functional-hooks-implementation.md) | Hooks implementation report | Historical |
| [hooks-performance-optimization.md](archive/reports/hooks-performance-optimization.md) | Performance optimization guide | Historical |
| [security-hooks-integration.md](archive/reports/security-hooks-integration.md) | Security hooks summary | Historical |

### Migrations (3 files)
Migration deliverables and completion summaries:

| File | Purpose | Date |
|------|---------|------|
| [ai-documentation-migration.md](archive/migrations/ai-documentation-migration.md) | AI docs relocation notice | Historical |
| [hooks-migration.md](archive/migrations/hooks-migration.md) | Hooks migration guide | Historical |
| [phase4-completion-summary.md](archive/migrations/phase4-completion-summary.md) | Phase 4 completion | Historical |

### Audits (3 files)
Historical audits and coverage enhancements:

| File | Purpose | Date |
|------|---------|------|
| [audit-current-hooks-file.md](archive/audits/audit-current-hooks-file.md) | Hooks implementation audit | Historical |
| [hooks-coverage-enhancement.md](archive/audits/hooks-coverage-enhancement.md) | Coverage enhancement | Historical |
| [questions-answers-about-hooks.md](archive/audits/questions-answers-about-hooks.md) | Hooks Q&A (archived) | 38.6 KB |

**Navigation**: `archive/` contains historical records that should NOT be modified (see [protected-files-policy.md](reference/protected-files-policy.md)).

---

## 🎯 Purpose & Scope

This directory serves as the **technical documentation hub** for internal Claude Code system implementation:

### What's Here
- ✅ **Reference Documentation**: Files imported by CLAUDE.md
- ✅ **Q&A Knowledge Base**: Comprehensive troubleshooting guides (165+ KB)
- ✅ **Specifications**: Feature proposals and specifications
- ✅ **Historical Archive**: Reports, migrations, and audits (point-in-time)

### What's NOT Here
- ❌ Application feature documentation → `docs/`
- ❌ Architecture decision records → `docs/architecture/adr/`
- ❌ User-facing documentation → `docs/`
- ❌ Implementation code → `src/`, `backend/`

---

## 🔗 Related Documentation

### Internal System Documentation
- **[../.claude/commands/](../commands/)** - 19 production slash commands
- **[../.claude/hooks.json](../hooks.json)** - Hooks configuration (40+ tools)
- **[../../tools/](../../tools/)** - Task management scripts

### User Documentation
- **[../../CLAUDE.md](../../CLAUDE.md)** - Main Claude Code integration guide
- **[../../docs/](../../docs/)** - User-facing project documentation
- **[../../docs/architecture/](../../docs/architecture/)** - Architecture documentation

---

## 📊 Inventory Summary

| Category | Files | Total Size | Purpose |
|----------|-------|------------|---------|
| **reference/** | 4 | ~212 lines | CLAUDE.md @imports (CRITICAL) |
| **guides/** | 3 | 165+ KB | Q&A knowledge base |
| **specs/** | 1 | ~743 lines | Specifications (not implemented) |
| **archive/** | 11 | Historical | Reports/migrations/audits (read-only) |
| **Total** | **19** | **~1 MB** | Complete system documentation |

---

## 🏛️ Organization Principles

1. **Clear Categorization**: Files grouped by type (reference/guides/specs/archive)
2. **Naming Consistency**: Kebab-case, descriptive names, fixed typos
3. **Archive Separation**: Historical content clearly isolated
4. **Import System Support**: `reference/` optimized for CLAUDE.md @imports
5. **Discoverability**: Logical grouping makes files easy to find

---

## 🔄 Migration History

**Date**: 2025-09-30
**Change**: Reorganized flat structure into categorized directories

**Breaking Changes**:
- CLAUDE.md @import paths updated (5 references)
- Old paths: `.claude/docs/commands-reference.md`
- New paths: `.claude/docs/reference/commands-reference.md`

**Benefits**:
- ✅ Improved discoverability (logical grouping)
- ✅ Clear categorization (reference/guides/specs/archive)
- ✅ Fixed naming issues (typos, inconsistencies)
- ✅ Professional structure (industry standards)

---

## 📝 Maintenance

**Protected Content**: All files in `archive/` are read-only historical records. Do NOT modify archived content.

**Reference Updates**: Files in `reference/` are imported by CLAUDE.md. Changes may affect Claude Code behavior.

**Q&A Updates**: Files in `guides/` can be updated to reflect current system state.

**For Questions**: See [claude-code-system-qa.md](guides/claude-code-system-qa.md) for comprehensive Q&A.

---

**Last Updated**: 2025-09-30
**Organization Version**: 2.0 (Categorized Structure)
