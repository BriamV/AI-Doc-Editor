# Explain Codebase - Architecture Analysis

---
description: Comprehensive codebase analysis and explanation with architectural insights
argument-hint: "[focus] [--detailed]"
allowed-tools: Read, Grep, Glob, LS, Bash(bash tools/*)
model: claude-3-5-sonnet-20241022
---

## Purpose

Provides comprehensive codebase analysis and explanation in an accessible format, helping understand system architecture, component connections, and overall functionality.

## Usage

```bash
/explain-codebase                  # Complete codebase overview
/explain-codebase frontend         # Focus on frontend architecture
/explain-codebase backend          # Focus on backend architecture
/explain-codebase --detailed       # Detailed analysis with code examples
```

## Context (auto-collected)
- Project structure: !`ls -la src/ api/ docs/ | head -10`
- Package info: !`grep -E "(name|description|version)" package.json pyproject.toml`
- Tech stack: !`grep -E "(react|typescript|fastapi|python)" package.json pyproject.toml`
- Project status: !`bash tools/progress-dashboard.sh --brief`

## Implementation

Parse `$ARGUMENTS` for focus area and detailed flag. Perform comprehensive codebase scan and architectural analysis.

**Codebase analysis with sub-agent delegation:**

> Use the backend-architect sub-agent to analyze the complete codebase architecture, explain system components, data flow, and provide clear understanding of how everything connects

**Focus-specific analysis:**
- **Frontend focus**: Component structure, state management, and UI patterns
- **Backend focus**: API design, data models, and service architecture
- **Complete analysis** (default): Full-stack overview with integration patterns

**Detailed mode:**
When --detailed flag is used, provide code examples and in-depth architectural explanations.
