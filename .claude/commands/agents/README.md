# Agents Commands - Specialized Sub-Agent Delegation

## Overview
This directory contains slash commands that orchestrate specialized sub-agent workflows with intelligent context detection and delegation patterns.

## Available Commands

### `/review-complete` - Comprehensive Code Review
- **Purpose**: Orchestrates code review using specialized sub-agents
- **Context Detection**: Analyzes change scope to delegate to appropriate reviewer
- **Sub-Agents**: code-reviewer, security-auditor, frontend-developer, backend-architect
- **Integration**: Quality gates, DoD validation, automated testing

### `/security-audit` - Security Analysis
- **Purpose**: Conducts security audits with security-auditor sub-agent
- **Context Detection**: Identifies security scope (auth, encryption, API, general)
- **Sub-Agent**: security-auditor with comprehensive security analysis
- **Integration**: npm audit, semgrep, security validation tools

### `/architecture` - System Design Analysis
- **Purpose**: Architectural analysis and design with backend-architect
- **Context Detection**: Determines architectural scope (API, data, frontend, system)
- **Sub-Agent**: backend-architect for scalable design patterns
- **Integration**: Architecture documentation, gap analysis updates

### `/debug-analyze` - Intelligent Debugging
- **Purpose**: Advanced debugging with debugger sub-agent
- **Context Detection**: Identifies error types (runtime, build, test, general)
- **Sub-Agent**: debugger for root cause analysis and solutions
- **Integration**: Validation tools, verbose tracing, workflow context

## Design Principles

### Context-Aware Delegation
- **Auto-Detection**: Commands analyze current project state, git changes, and task context
- **Intelligent Routing**: Appropriate sub-agent selected based on change scope and error patterns
- **Multi-Agent Coordination**: Sequential delegation for complex workflows

### Integration Patterns
- **Workflow Integration**: Commands integrate with existing tools/ directory scripts
- **Quality Gates**: Automatic validation and DoD compliance checking
- **Performance Optimized**: Fast context detection (1-3 seconds) for iterative development

### Sub-Agent Invocation
- **Explicit Patterns**: Clear "> Use the [agent] sub-agent to [task]" format
- **Context Passing**: Rich context provided to sub-agents for focused analysis
- **Tool Limitation**: Each sub-agent accesses only necessary tools for their domain

## Usage Examples

```bash
# Comprehensive review of current changes
/review-complete

# Security audit focusing on authentication
/security-audit auth

# Architectural analysis for API design
/architecture api --design

# Debug runtime errors with detailed tracing
/debug-analyze runtime --trace
```

## Implementation Notes

- **Line Limit**: Each command ≤50 lines of implementation logic
- **Error Handling**: Robust error detection with fallback patterns
- **Performance**: Context detection optimized for sub-second response
- **Extensibility**: Easy addition of new specialized sub-agents and contexts