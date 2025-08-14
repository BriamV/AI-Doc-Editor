# Pull Request Flow - Sub-Agent Delegation

---
description: Create PRs with proper code review delegation using Claude Code sub-agent best practices  
argument-hint: "[target-branch] [--draft]"
sub-agent: workflow-architect
---

## Purpose

Create pull requests with automated code review and security validation through explicit sub-agent delegation.

## Usage

```bash
/pr-flow                        # Auto-detect target from branch
/pr-flow develop                # Explicit target branch  
/pr-flow --draft                # Create draft PR
```

## Implementation

```bash
# Context detection and branch analysis
TARGET_BRANCH="${ARGUMENTS[0]}"
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)
DRAFT_FLAG=""

# Handle draft flag
for arg in "$@"; do
    [ "$arg" = "--draft" ] && DRAFT_FLAG="--draft"
done

# Auto-detect target branch from GitFlow convention
[ -z "$TARGET_BRANCH" ] && {
    case "$CURRENT_BRANCH" in
        feature/*) TARGET_BRANCH="develop" ;;
        release/*) TARGET_BRANCH="main" ;;
        hotfix/*) TARGET_BRANCH="main" ;;
        *) TARGET_BRANCH="develop" ;;
    esac
}

echo "🔍 Analyzing changes for PR: $CURRENT_BRANCH → $TARGET_BRANCH"

# Check for security-sensitive changes  
SECURITY_FILES=$(git diff --name-only HEAD...$TARGET_BRANCH | grep -E "(auth|oauth|security|crypto|token)" || true)
API_FILES=$(git diff --name-only HEAD...$TARGET_BRANCH | grep -E "\.(py|js|ts)$" || true)

# Explicit sub-agent delegation for code review using official syntax
echo "📋 Delegating code review to appropriate sub-agents..."

# Always perform general code review
echo "> Use the code-reviewer sub-agent to perform a comprehensive quality analysis of all changes in this pull request before creation"

# Security review for sensitive changes
[ -n "$SECURITY_FILES" ] && {
    echo "🔒 Security-sensitive files detected: $SECURITY_FILES"
    echo "> Use the security-auditor sub-agent to perform a thorough security review of authentication and security-related changes before creating this pull request"
}

# Backend/API review for Python/JS/TS changes
[ -n "$API_FILES" ] && {
    echo "⚡ API/Backend files detected: $API_FILES" 
    echo "> Use the backend-architect sub-agent to validate architectural decisions and API design patterns in this pull request"
}

# Generate conventional commit title
TITLE=$(git log -1 --pretty=format:'%s')
echo "$TITLE" | grep -qE '^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .+' || {
    echo "⚠️ Non-conventional commit title: $TITLE"
}

echo "🚀 Creating PR: $CURRENT_BRANCH → $TARGET_BRANCH"  
echo "Title: $TITLE"
echo "Draft: ${DRAFT_FLAG:-false}"
echo "✅ Sub-agents will complete review before PR creation"
```