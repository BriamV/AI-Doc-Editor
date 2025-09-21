# .claude/docs/ - Implementation Documentation

This directory contains implementation-specific documentation for the Claude Code integration system.

## 📁 Directory Contents

### Hooks System Documentation
- **[hooks-migration.md](hooks-migration.md)** - Migration guide for hooks system
- **[hooks-coverage-enhancement.md](hooks-coverage-enhancement.md)** - Coverage enhancement documentation
- **[hooks-performance-optimization.md](hooks-performance-optimization.md)** - Performance optimization guide

## 🎯 Purpose

This directory serves as the technical documentation hub for internal Claude Code system implementation:

- **Implementation Details**: Technical specifications for hooks, agents, and commands
- **Migration Guides**: Step-by-step migration documentation
- **Performance Optimization**: System optimization strategies and results
- **Coverage Enhancement**: Testing and validation coverage improvements

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
├── commands/               # Command system implementation
├── agents/                # Agent specifications
└── hooks.json             # Hooks configuration

docs/                      # User-facing documentation
├── reports/               # Project reports and analysis
└── ...                    # Project documentation
```

## 📋 Navigation

| Documentation Type | Location | Purpose |
|-------------------|----------|---------|
| **Implementation** | `.claude/docs/` | Technical implementation details |
| **Commands** | `.claude/commands/` | Command system and usage |
| **Agents** | `.claude/agents/` | Agent specifications |
| **User Docs** | `docs/` | Project documentation |
| **Reports** | `docs/reports/` | Analysis and reports |

## 🔄 Maintenance

This documentation is maintained as part of the Claude Code integration system. Updates should:

1. Follow established documentation patterns
2. Maintain clear separation between implementation and user documentation
3. Update cross-references when files are moved or renamed
4. Ensure consistency with the main CLAUDE.md integration guide