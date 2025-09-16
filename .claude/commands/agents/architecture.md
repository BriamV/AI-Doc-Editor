# Architecture - System Design and Backend Analysis

---
description: Architectural analysis and design with backend-architect sub-agent
argument-hint: "[component] [--design]"
allowed-tools: Bash(bash tools/*), Read, Grep, Glob, LS
model: claude-3-5-sonnet-20241022
---

## Purpose
Analyzes system architecture and designs solutions using specialized backend-architect sub-agent with component-aware context.

## Usage
```bash
/architecture                       # Full architectural analysis
/architecture api                   # Focus on API design
/architecture --design              # Architecture design mode
/architecture data                  # Focus on data layer
```

## Context (auto-collected)
- Current branch: !`git branch --show-current`
- Changed files: !`git diff --name-only HEAD~1..HEAD`
- Project structure: !`ls -la src/ api/ 2>/dev/null | head -10`
- Task context: !`bash tools/task-navigator.sh $(git branch --show-current | grep -o 'T-[0-9]\+')`

## Implementation

Parse `$ARGUMENTS` for architectural component and design flag. Auto-detect scope from changed files (api/endpoint/route → api-architecture, store/data/model → data-architecture, component/ui/frontend → frontend-architecture).

**Sub-agent delegation for architectural analysis:**

> Use the backend-architect sub-agent to analyze system architecture, design API endpoints, evaluate data models, and ensure scalable system design patterns

**Architecture scope detection:**
- **API architecture** (api/endpoint/route files): API design patterns and endpoint architecture
- **Data architecture** (store/data/model files): Data layer architecture and model relationships  
- **Frontend architecture** (component/ui/frontend files): Component architecture and UI patterns
- **System architecture** (general): Overall system design and integration patterns

**Design mode integration:**
When --design flag is used, update architectural documentation in docs/ARCH-GAP-ANALYSIS.md and relevant ADR files.
```