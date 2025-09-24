# .claude/docs/ - Implementation Documentation

This directory contains implementation-specific documentation for the Claude Code integration system.

## 📁 Directory Contents

### Migration Documentation
- **[AI-DOCUMENTATION-MIGRATION.md](AI-DOCUMENTATION-MIGRATION.md)** - AI docs relocation notice and redirects

### Hooks System Documentation (4 files)
- **[audit-current-hooks-file.md](audit-current-hooks-file.md)** - Current hooks implementation audit
- **[hooks-migration.md](hooks-migration.md)** - Migration guide for hooks system
- **[hooks-coverage-enhancement.md](hooks-coverage-enhancement.md)** - Coverage enhancement documentation
- **[hooks-performance-optimization.md](hooks-performance-optimization.md)** - Performance optimization guide

### Q&A Knowledge Base (4 files, 165+ KB)
- **[question-answers-about-claude.md](question-answers-about-claude.md)** - Claude Code system Q&A (62.7 KB)
- **[questions-answers-about-hooks.md](questions-answers-about-hooks.md)** - Hooks system Q&A (38.6 KB)
- **[questions-answers-about-settings.md](questions-answers-about-settings.md)** - Settings configuration Q&A (18.8 KB)
- **[qustions-answers-about-csc.md](qustions-answers-about-csc.md)** - CSC system Q&A (45.2 KB)

## 🎯 Purpose

This directory serves as the technical documentation hub for internal Claude Code system implementation:

- **Claude Code Tooling Documentation**: Technical specifications for hooks, agents, and commands
- **Migration Documentation**: Architectural changes including AI documentation relocation
- **Comprehensive Q&A Knowledge Base**: Troubleshooting guides for system components
- **Performance Optimization**: System optimization strategies and results
- **Coverage Enhancement**: Testing and validation coverage improvements
- **Clear Separation**: Distinct boundary from application feature documentation

## 🔗 Related Documentation

### Internal System Documentation
- **[../.claude/commands/](../commands/)** - Command implementations
- **[../.claude/agents/](../agents/)** - Agent specifications
- **[../.claude/hooks.json](../hooks.json)** - Hooks configuration

### User Documentation
- **[../../docs/](../../docs/)** - User-facing project documentation
- **[../../docs/reports/](../../docs/reports/)** - Project reports and analysis
- **[../../CLAUDE.md](../../CLAUDE.md)** - Main Claude Code integration guide

## 🏛️ Architecture

```
.claude/                    # Claude Code implementation
├── docs/                   # Implementation documentation (THIS DIRECTORY)
│   ├── AI-DOCUMENTATION-MIGRATION.md    # Migration notice
│   ├── audit-current-hooks-file.md      # Hooks audit
│   ├── hooks-*.md                       # Hooks system docs (3 files)
│   ├── question-answers-about-*.md      # Q&A knowledge base (4 files)
│   └── README.md                        # This file
├── commands/               # Command system implementation
├── agents/                # Agent specifications
└── hooks.json             # Hooks configuration

docs/                      # User-facing documentation
├── architecture/ai/        # AI documentation (migrated from .claude/docs/)
├── reports/               # Project reports and analysis
└── ...                    # Project documentation
```

### Architectural Context
- **AI Documentation Migration**: Successfully completed - AI docs relocated from `.claude/docs/` to `docs/architecture/ai/`
- **Clear Boundaries**: Tooling documentation (`.claude/docs/`) vs application documentation (`docs/`)
- **Migration Documentation**: Available for historical context and reference
- **Conway's Law Compliance**: Implementation docs remain proximate to Claude Code system

## 📋 Navigation

### By Content Type
| Documentation Type | Location | Purpose |
|-------------------|----------|---------|
| **Implementation** | `.claude/docs/` | Technical implementation details |
| **Migration** | `.claude/docs/AI-DOCUMENTATION-MIGRATION.md` | AI docs relocation notice |
| **Q&A Knowledge Base** | `.claude/docs/question-answers-*.md` | System troubleshooting |
| **Commands** | `.claude/commands/` | Command system and usage |
| **Agents** | `.claude/agents/` | Agent specifications |
| **User Docs** | `docs/` | Project documentation |
| **Reports** | `docs/reports/` | Analysis and reports |

### Q&A Knowledge Base by Topic
| Topic | File | Size | Purpose |
|-------|------|------|---------|
| **Claude Code System** | `question-answers-about-claude.md` | 62.7 KB | Core system Q&A |
| **Hooks System** | `questions-answers-about-hooks.md` | 38.6 KB | Hooks configuration Q&A |
| **CSC System** | `qustions-answers-about-csc.md` | 45.2 KB | CSC component Q&A |
| **Settings** | `questions-answers-about-settings.md` | 18.8 KB | Configuration Q&A |

### Cross-References to Migrated Content
- **AI Documentation**: Relocated to `docs/architecture/ai/` (see AI-DOCUMENTATION-MIGRATION.md)
- **Application Features**: Located in `docs/` and subdirectories
- **Implementation Docs**: Proximate to code in `src/docs/` and `backend/docs/`

## 🔄 Maintenance

This documentation is maintained as part of the Claude Code integration system. Updates should:

1. **Follow Technical Infrastructure Template Standards**: Ensure compliance with established patterns
2. **Maintain Clear Separation**: Implementation docs vs application feature documentation
3. **Update Cross-References**: When files are moved, renamed, or migrated (see AI-DOCUMENTATION-MIGRATION.md)
4. **Ensure Consistency**: With main CLAUDE.md integration guide and Q&A knowledge base
5. **Validate File Inventory**: All 10 files in directory should be accurately listed and described
6. **Reference Migration Documentation**: For historical context of architectural changes

### Current Status
- **File Count**: 10 files (100% documented)
- **Content Coverage**: 165+ KB Q&A knowledge base + migration docs + hooks system
- **Template Compliance**: Technical Infrastructure template standards
- **Cross-References**: Validated links to migrated AI documentation