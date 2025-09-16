# Docs Update - Sub-Agent Delegation

---
description: Update documentation with intelligent content generation using Claude Code sub-agent best practices
argument-hint: "[scope] [--format=md|api]"
allowed-tools: Bash(bash tools/*), Bash(yarn *), Read, Write, Edit, Grep, Glob
# ⚠️ Migration Note: 'yarn run cmd' patterns deprecated, using direct yarn commands
model: claude-3-5-sonnet-20241022
---

## Purpose

Context-aware documentation updates with specialized sub-agent delegation for different documentation types. Automatically handles API docs, README updates, and traceability maintenance.

## Usage

```bash
/docs-update                        # Auto-detect from recent changes
/docs-update api --format=api       # API documentation update
/docs-update readme                 # README and user docs
```

## Context (auto-collected)
- Current branch: !`git branch --show-current`
- Recent changes: !`git diff --name-only HEAD~3..HEAD`
- Project status: !`bash tools/progress-dashboard.sh --brief`
- Task context: !`bash tools/task-navigator.sh $(git branch --show-current | grep -o 'T-[0-9]\+')`

## Implementation

Parse `$ARGUMENTS` for documentation scope and format parameters. Auto-detect scope from recent file changes (api/backend → api, README/docs → user, src/components → technical).

**Sub-agent delegation based on documentation type:**

- **API documentation**:
  > Use the api-documenter sub-agent to analyze the current API structure, generate comprehensive endpoint documentation, and update API reference materials with proper OpenAPI formatting
- **User/README documentation**:
  > Use the frontend-developer sub-agent to analyze user-facing features and generate clear, accessible documentation with usage examples and getting started guides

- **Technical documentation**:
  > Use the backend-architect sub-agent to analyze the codebase architecture and generate detailed technical documentation including component diagrams and integration patterns

- **Security documentation**:
  > Use the security-auditor sub-agent to analyze security implementations and generate comprehensive security documentation with compliance requirements and best practices

- **General documentation**:
  > Use the code-reviewer sub-agent to analyze recent changes and update relevant documentation sections with accurate, current information

**Documentation workflow:**
1. Check documentation consistency with recent codebase changes
2. Update traceability using tools/status-updater.sh when task context available
3. Update DEVELOPMENT-STATUS.md for API/technical changes
4. Generate governance reports using direct commands (scripts/governance.ts deprecated)

**⚠️ Legacy Migration:**
- OLD: yarn run cmd traceability --format=json
- NEW: Use /docs-update command with sub-agent delegation
- scripts/governance.ts functionality integrated into slash commands
```