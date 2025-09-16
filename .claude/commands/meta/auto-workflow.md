# Auto-Workflow - Intelligent Context Detection

---
description: Detección automática de contexto + sugerencia de workflow óptimo
argument-hint: "[scope] [--detail]"
allowed-tools: Bash(git *), Bash(bash tools/*), Read, Grep, Glob
model: claude-3-5-sonnet-20241022
---

## Purpose
Automatically analyzes current project context (branch, task, changes, status) and suggests optimal workflow commands with intelligent routing to appropriate sub-agents.

## Usage
```bash
/auto-workflow                    # Auto-analyze full project context
/auto-workflow branch             # Focus on branch-specific workflow
/auto-workflow task               # Focus on task-specific workflow
/auto-workflow --detail          # Detailed analysis with all context
```

## Context (auto-collected)
- Current branch: !`git branch --show-current`
- Git status: !`git status --porcelain`
- Task context: !`bash tools/task-navigator.sh $(git branch --show-current | grep -o 'T-[0-9]\+')`
- Workflow context: !`bash tools/workflow-context.sh 2>/dev/null || echo "Workflow context unavailable"`

## Implementation

Parse `$ARGUMENTS` for scope and detail flag. Auto-analyze project context including branch patterns, task context, and file changes.

**Intelligent workflow analysis:**
> Use the workflow-architect sub-agent to analyze current project context and recommend optimal workflow commands based on branch, task, and modification patterns

**Contextual analysis based on scope:**

- **Branch-specific workflow**:
  > Use the workflow-architect sub-agent to analyze branch-specific workflow patterns and suggest appropriate commands for the current branch

- **Task-specific workflow**:
  > Use the workflow-architect sub-agent to analyze task-specific workflow requirements and suggest optimal command sequences for the current task
  Integration: tools/task-navigator.sh for task context

- **Full context analysis** (default):
  > Use the workflow-architect sub-agent to perform comprehensive workflow analysis and suggest optimal command sequence based on current project state
  Integration: tools/progress-dashboard.sh

**Detail mode:**
When --detail flag is used:
> Use the workflow-architect sub-agent to provide detailed workflow recommendations with specific command sequences and sub-agent coordination
Integration: docs/DEVELOPMENT-STATUS.md, yarn run cmd workflow-context
```