# Release Preparation - Sub-Agent Orchestration

---
description: Complete release preparation with multi-agent validation using Claude Code best practices
argument-hint: "[release-id] [action]"
allowed-tools: Bash(git *), Bash(bash tools/*), Read, Grep, Glob
model: claude-3-5-sonnet-20241022
---

## Purpose

Orchestrate release preparation through sequential sub-agent delegation for comprehensive validation across all domains.

## Usage

```bash
/release-prep                   # Auto-detect from branch
/release-prep R1.0              # Specific release preparation
/release-prep R1.0 validate     # Validation only
```

## Context (auto-collected)
- Current branch: !`git branch --show-current`
- Release context: !`bash tools/progress-dashboard.sh --release`
- Version info: !`git tag --list --sort=-v:refname | head -3`

## Implementation

Parse `$ARGUMENTS` for release ID and action parameters. Auto-detect release ID from branch context (release/RX.Y pattern).

**Sequential sub-agent orchestration for comprehensive release validation:**

1. **Code Quality Review**:
   > Use the code-reviewer sub-agent to perform a final comprehensive code quality review for the specified release, ensuring all code meets production standards

2. **Security Audit**:
   > Use the security-auditor sub-agent to conduct a complete security audit for the specified release, validating all authentication, authorization, and data protection mechanisms

3. **Architecture Validation**:
   > Use the backend-architect sub-agent to validate that the system architecture is production-ready for the specified release and can handle expected load

4. **Frontend Production Readiness**:
   > Use the frontend-developer sub-agent to ensure all UI components and user flows are optimized and tested for production release

5. **Documentation Review**:
   > Use the api-documenter sub-agent to verify that all API changes and new features are properly documented for the specified release

**Action handling:**

- **validate**: Execute validation-only workflow via sub-agent orchestration
- **prepare** (default): Full release preparation including artifact generation

**Release branch validation:**
Verify current branch matches expected release/RX.Y pattern.

**Release preparation checklist:**
- Code quality review completed (code-reviewer)
- Security audit passed (security-auditor) 
- Architecture validation completed (backend-architect)
- Frontend production check completed (frontend-developer)
- Documentation review completed (api-documenter)
- Version numbers updated
- Changelog generated
- Performance benchmarks verified
```