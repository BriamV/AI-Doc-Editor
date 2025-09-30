# .claude/agents/ - Specialized Agent Specifications

This directory contains project-specific agent specifications that extend Claude Code's built-in agent ecosystem for this AI Document Editor project.

## 🤖 Agent Roster

### Local Project Agents
- **[task-planner.md](task-planner.md)** - Task validation and execution planning specialist
- **[workflow-architect.md](workflow-architect.md)** - Development workflow design and automation expert

## 🎯 Agent Purpose

These specialized agents complement Claude Code's 40+ global sub-agents by providing project-specific expertise:

### Task Planner Agent
- **Role**: Minimal validator-adapter that runs before code edits
- **Purpose**: Validates task specifications, adapts to repository state
- **Output**: Structured checklists and machine-readable status reports
- **When to Use**: Before starting any development work on tasks (T-XX pattern)

### Workflow Architect Agent
- **Role**: Development workflow design and automation specialist
- **Purpose**: Creates custom slash commands, optimizes CI/CD pipelines
- **Output**: Intelligent workflow automation and multi-agent orchestration
- **When to Use**: For workflow optimization, custom command creation, process automation

## 🏗️ Agent Architecture

### Integration with Global Agents
```
Claude Code Ecosystem:
├── Global Sub-Agents (40+)          # Built-in specialists
│   ├── security-auditor             # Security analysis
│   ├── frontend-developer           # React/TypeScript expertise
│   ├── backend-architect            # Python/FastAPI expertise
│   └── ...                          # Other built-in agents
└── Local Project Agents (2)         # Project-specific (THIS DIRECTORY)
    ├── task-planner                 # Task validation specialist
    └── workflow-architect           # Workflow automation expert
```

### Agent Selection Pattern
Commands in `.claude/commands/` automatically select appropriate agents:
1. **Analyze context** and task requirements
2. **Select global agents** for general capabilities
3. **Invoke local agents** for project-specific needs
4. **Orchestrate multi-agent** workflows when needed

## 🔄 Agent Invocation

### Direct Agent Usage
```bash
# Task planning (use before development)
> Use the [task-planner] agent to validate T-XX specification

# Workflow design (use for automation)
> Use the [workflow-architect] agent to create custom workflow
```

### Automatic Agent Selection
Commands automatically invoke appropriate agents:
```bash
/task-dev T-XX          # Auto-invokes task-planner → development agents
/review-complete        # Auto-invokes security-auditor → qa agents
/auto-workflow          # Auto-invokes workflow-architect → orchestration
```

## 📋 Agent Specifications

Each agent specification includes:
- **name**: Unique agent identifier
- **description**: Purpose, examples, and usage patterns
- **tools**: Available Claude Code tools (Bash, Read, Edit, etc.)
- **model**: AI model configuration (typically sonnet)
- **color**: Agent identification color for UI

## 🔗 Related Systems

### Command System
- **[../commands/](../commands/)** - Command implementations that use these agents
- **[../commands/agents/](../commands/agents/)** - Command-specific agent configurations

### Documentation
- **[../docs/](../docs/)** - Implementation documentation
- **[../../docs/](../../docs/)** - User-facing project documentation
- **[../../CLAUDE.md](../../CLAUDE.md)** - Main integration guide

## 🛠️ Development Guidelines

### Creating New Agents
1. **Identify specific need** not covered by global agents
2. **Define clear scope** and responsibilities
3. **Follow specification format** (see existing agents)
4. **Test integration** with command system
5. **Document usage patterns** with examples

### Agent Best Practices
- **Single Responsibility**: Each agent has one clear purpose
- **Context Awareness**: Agents understand project structure
- **Tool Integration**: Leverage available Claude Code tools
- **Orchestration**: Work well with other agents
- **Documentation**: Clear examples and usage patterns

## 🔄 Maintenance

Agent specifications are maintained as part of the Claude Code integration:
- **Updates**: Sync with project evolution and new requirements
- **Testing**: Validate agent behavior through command usage
- **Documentation**: Keep examples current with project state
- **Integration**: Ensure compatibility with global agent ecosystem