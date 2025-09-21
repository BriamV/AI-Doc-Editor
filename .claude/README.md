# .claude/ - Claude Code Integration System

This directory contains the complete Claude Code integration system for the AI Document Editor project, providing intelligent development workflow automation through commands, agents, and hooks.

## 📁 Directory Structure

```
.claude/
├── README.md                    # This navigation guide
├── hooks.json                   # Hooks configuration and automation
├── docs/                        # Implementation documentation
│   ├── README.md               # Documentation navigation
│   ├── hooks-migration.md      # Hooks migration guide
│   ├── hooks-coverage-enhancement.md
│   └── hooks-performance-optimization.md
├── agents/                      # Project-specific agent specifications
│   ├── README.md               # Agent system navigation
│   ├── task-planner.md         # Task validation specialist
│   └── workflow-architect.md   # Workflow automation expert
└── commands/                    # Custom slash commands
    ├── agents/                  # Command-specific agents
    ├── archive/                 # Historical commands and reports
    └── [19 active commands]     # Production workflow commands
```

## 🎯 System Purpose

The Claude Code integration provides:

### Intelligent Workflow Automation
- **Custom Slash Commands**: 19 production commands for development workflows
- **Multi-Agent Orchestration**: Automatic selection of 40+ global + 2 local agents
- **Context-Aware Automation**: Commands adapt to project state and requirements

### Quality Assurance Integration
- **Hooks System**: 40+ tools integrated via hooks.json configuration
- **Multi-Stack Pipeline**: TypeScript, Python, security, docs, and config validation
- **Performance Optimization**: 54% faster execution (152s → 70s)

### Development Process Enhancement
- **Task Management**: Automated T-XX task lifecycle management
- **Merge Protection**: Comprehensive safety validation before merges
- **Security Integration**: Automated security audits and vulnerability detection

## 🚀 Quick Start

### Essential Commands
```bash
# Daily Development Workflow
/task-dev T-XX                  # Start task development with context
/review-complete                # Multi-agent code review
/commit-smart                   # Intelligent commit creation
/merge-safety                   # MANDATORY merge protection

# System Validation
/health-check                   # System diagnostics
/context-analyze                # Project analysis
/auto-workflow                  # Context-aware suggestions
```

### Direct Integration
```bash
# Quality Pipeline (hooks-integrated)
yarn dev|build|test|security-scan
yarn lint|format|tsc-check
yarn python-quality             # Python validation
yarn merge-safety-full          # Merge protection
```

## 🤖 Agent Ecosystem

### Local Project Agents (2)
- **[task-planner](agents/task-planner.md)** - Task validation and execution planning
- **[workflow-architect](agents/workflow-architect.md)** - Workflow design and automation

### Global Claude Code Agents (40+)
- **security-auditor** - Security analysis and vulnerability detection
- **frontend-developer** - React/TypeScript expertise
- **backend-architect** - Python/FastAPI expertise
- **qa-specialist** - Testing and quality assurance
- **[Full roster available via commands]**

## 🔧 Technical Implementation

### Hooks Configuration
- **[hooks.json](hooks.json)** - Master configuration for 40+ tools
- **Multi-Platform Support** - Windows/Linux/WSL auto-detection
- **Performance Optimized** - 54% execution time reduction
- **Quality Gates** - Automated formatting, linting, security scanning

### Command System
- **19 Active Commands** - Production-ready development workflows
- **Archive System** - Historical commands and deprecated features
- **Agent Integration** - Automatic agent selection and orchestration

## 🔗 Cross-System Integration

### Implementation ↔ User Documentation
```
.claude/                        # Implementation system (THIS DIRECTORY)
├── docs/                       # Implementation documentation
├── agents/                     # Agent specifications
└── commands/                   # Command implementations

docs/                          # User-facing documentation
├── reports/                   # Project reports and analysis
│   └── archive/               # Historical reports (moved from .claude/)
├── architecture/              # Architecture decisions
└── [project documentation]   # User guides and references
```

### Bridge Documentation
- **[../docs/reports/](../docs/reports/)** - Project reports (includes moved .claude/ reports)
- **[../CLAUDE.md](../CLAUDE.md)** - Main integration guide for users
- **[docs/README.md](docs/README.md)** - Implementation documentation navigation

## 📋 Navigation Guide

| Need | Location | Description |
|------|----------|-------------|
| **Start Development** | `/task-dev T-XX` | Task development with context |
| **Quality Check** | `/review-complete` | Multi-agent code review |
| **Merge Safety** | `/merge-safety` | Comprehensive merge protection |
| **System Health** | `/health-check` | System diagnostics |
| **Agent Specs** | `agents/` | Local agent documentation |
| **Command Details** | `commands/` | Command implementations |
| **Implementation Docs** | `docs/` | Technical documentation |
| **User Documentation** | `../docs/` | Project documentation |
| **Integration Guide** | `../CLAUDE.md` | Main user guide |

## 🛡️ Security & Compliance

### Automated Security
- **Semgrep Integration** - Static analysis security testing
- **Git Secrets** - Prevent credential leaks
- **Dependency Auditing** - Yarn and pip security scanning
- **Merge Protection** - Mandatory safety validation

### Compliance Features
- **Multi-Stack Validation** - TypeScript + Python + security
- **Performance Monitoring** - Execution time optimization
- **Quality Gates** - Automated formatting and linting
- **Documentation Consistency** - Cross-reference validation

## 🔄 Maintenance

### System Updates
1. **Hook Configuration** - Update hooks.json for new tools
2. **Agent Specifications** - Enhance agent capabilities
3. **Command Enhancement** - Improve workflow automation
4. **Documentation Sync** - Maintain cross-references

### Best Practices
- **Command-First Workflow** - Use slash commands before direct CLI
- **Merge Protection** - Always run /merge-safety before merges
- **Context Validation** - Use /health-check for system diagnostics
- **Documentation Updates** - Keep implementation and user docs synced

---

**🎯 Getting Started**: Run `/auto-workflow` for context-aware workflow suggestions based on your current project state.