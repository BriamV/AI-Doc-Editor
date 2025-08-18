# Context-Analyze - Comprehensive Project Analysis

---
description: Análisis de contexto: branch + task + WP + release + next steps
argument-hint: "[focus] [--planning]"
allowed-tools: Bash(bash tools/*), Bash(git *), Bash(npx tsx scripts/*), Read, Grep, Glob
model: claude-3-5-sonnet-20241022
---

## Purpose
Performs intelligent analysis of complete project context including branch state, task progress, work package status, release planning, and provides actionable next steps recommendations.

## Usage
```bash
/context-analyze                  # Complete project context analysis
/context-analyze task             # Focus on current task context
/context-analyze release          # Focus on release planning context
/context-analyze governance       # Focus on governance and traceability
/context-analyze --planning       # Include detailed planning analysis
```

## Context (auto-collected)
- Current branch: !`git branch --show-current`
- Task context: !`bash tools/task-navigator.sh $(git branch --show-current | grep -o 'T-[0-9]\+')`
- Project status: !`bash tools/progress-dashboard.sh --brief`
- Governance: !`npx tsx scripts/governance.ts --format=json | head -5`

## Implementation

Parse `$ARGUMENTS` for focus area and planning mode. Perform comprehensive project context analysis with specialized sub-agent delegation.

**Primary context analysis:**
> Use the workflow-architect sub-agent to analyze complete project context and provide intelligent insights

**Focus-specific analysis:**

- **Task context analysis**:
  > Use the workflow-architect sub-agent to analyze current task context and recommend optimal next steps for the identified task
  Integration: tools/task-navigator.sh, tools/validate-dod.sh

- **Release planning context**:
  > Use the workflow-architect sub-agent to analyze release planning context and provide strategic recommendations for the current release cycle
  Integration: tools/progress-dashboard.sh, docs/WORK-PLAN v5.md

- **Governance and traceability context**:
  > Use the api-documenter sub-agent to analyze documentation completeness and governance compliance
  Integration: npx tsx scripts/governance.ts --format=json, docs/traceability.md

- **Complete context analysis** (default):
  > Use the workflow-architect sub-agent to perform comprehensive analysis integrating branch, task, project progress, and development status context
  Integration: docs/DEVELOPMENT-STATUS.md, project status synthesis

**Planning mode:**
When --planning flag is used:
> Use the workflow-architect sub-agent to perform detailed planning analysis including work package prioritization and resource allocation recommendations
> Use the workflow-architect sub-agent to provide strategic planning recommendations with timeline and resource considerations
Integration: tools/extract-subtasks.sh (for task context), docs/WORK-PLAN v5.md
```