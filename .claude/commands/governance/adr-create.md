# ADR Create - Sub-Agent Delegation

---
description: Create Architecture Decision Records with backend-architect sub-agent delegation using Claude Code best practices
argument-hint: "[title] [--draft]"
allowed-tools: Bash(bash tools/*), Read, Write, Edit, LS, Grep
model: claude-3-5-sonnet-20241022
---

## Purpose

Context-aware ADR creation with architectural analysis through explicit sub-agent delegation. Automatically handles numbering, template population, and index updates.

## Usage

```bash
/adr-create                         # Interactive ADR creation
/adr-create "async-api-design"      # Specific title
/adr-create "security-model" --draft # Draft mode
```

## Context (auto-collected)
- Current branch: !`git branch --show-current`
- Task context: !`bash tools/task-navigator.sh $(git branch --show-current | grep -o 'T-[0-9]\+')`
- Existing ADRs: !`ls docs/adr/ADR-*.md | tail -3`
- Tech stack: !`grep -E "(react|fastapi|typescript)" package.json pyproject.toml`

## Implementation

Parse `$ARGUMENTS` for ADR title and draft flag. Generate sequential ADR number and kebab-case filename.

Interactive title prompting if not provided, with context from current task and common architectural decision patterns.

**Sub-agent delegation for architectural analysis:**

- **Primary analysis**:
  > Use the backend-architect sub-agent to analyze the architectural context and generate a comprehensive ADR for the specified title

- **Consistency check** (when related ADRs exist):
  > Use the backend-architect sub-agent to ensure consistency with existing architectural decisions in related ADRs

**ADR creation workflow:**
1. Generate sequential ADR number from existing ADRs in docs/adr/
2. Create kebab-case filename: `ADR-XXX-title.md`
3. Copy from template.md as base structure
4. Link to current task using tools/status-updater.sh

**Draft mode handling:**
When --draft flag is used, add "DRAFT - REVIEW REQUIRED" marker to the ADR.
```