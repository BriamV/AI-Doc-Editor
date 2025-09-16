# Search Web - Intelligent Web Research

---
description: Intelligent web search with context-aware query optimization and research synthesis
argument-hint: "[query] [--technical] [--recent]"
allowed-tools: WebSearch, WebFetch, Read, Grep
model: claude-3-5-sonnet-20241022
---

## Purpose

Performs intelligent web research with context-aware query optimization, providing relevant information synthesized for development and technical queries.

## Usage

```bash
/search-web "React hooks best practices"     # General web search
/search-web "FastAPI authentication" --technical  # Technical focus
/search-web "TypeScript 2024" --recent      # Recent information focus
```

## Context (auto-collected)
- Current branch: !`git branch --show-current`
- Project tech stack: !`grep -E "(react|typescript|fastapi|python)" package.json pyproject.toml`
- Task context: !`bash tools/task-navigator.sh $(git branch --show-current | grep -o 'T-[0-9]\+')`

## Implementation

Parse `$ARGUMENTS` for search query and mode flags. Optimize search query based on project context and perform intelligent web research.

**Context-aware search optimization:**

> Use the research-analyst sub-agent to optimize search queries based on current project context and perform comprehensive web research to find the most relevant and accurate information

**Search modes:**
- **Technical mode** (--technical): Focus on documentation, best practices, and technical resources
- **Recent mode** (--recent): Prioritize recent information and latest updates
- **General mode** (default): Balanced search across multiple sources

**Results synthesis:**
Synthesize search results into actionable insights relevant to the current project context and development needs.
