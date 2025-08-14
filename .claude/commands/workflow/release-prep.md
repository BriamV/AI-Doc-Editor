# Release Preparation - Sub-Agent Orchestration

---
description: Complete release preparation with multi-agent validation using Claude Code best practices
argument-hint: "[release-id] [action]"
sub-agent: workflow-architect
---

## Purpose

Orchestrate release preparation through sequential sub-agent delegation for comprehensive validation across all domains.

## Usage

```bash
/release-prep                   # Auto-detect from branch
/release-prep R1.0              # Specific release preparation
/release-prep R1.0 validate     # Validation only
```

## Implementation

```bash
# Context detection and release ID resolution
RELEASE_ID="${ARGUMENTS[0]}"
ACTION="${ARGUMENTS[1]:-prepare}"

# Auto-detect release ID from branch if not provided
[ -z "$RELEASE_ID" ] && RELEASE_ID=$(git branch --show-current | grep -o 'R[0-9]\+\.[0-9]\+')
[ -z "$RELEASE_ID" ] && { echo "❌ No release ID found. Use: /release-prep RX.Y"; exit 1; }

echo "🚀 Preparing release $RELEASE_ID..."

# Sequential sub-agent orchestration for comprehensive release validation using official syntax
echo "📋 Orchestrating multi-agent release validation..."

# 1. Code Quality Review
echo "1️⃣ Initiating comprehensive code quality review..."
echo "> Use the code-reviewer sub-agent to perform a final comprehensive code quality review for release $RELEASE_ID, ensuring all code meets production standards"

# 2. Security Audit
echo "2️⃣ Conducting security audit..."
echo "> Use the security-auditor sub-agent to conduct a complete security audit for release $RELEASE_ID, validating all authentication, authorization, and data protection mechanisms"

# 3. Architecture Validation
echo "3️⃣ Validating system architecture..."
echo "> Use the backend-architect sub-agent to validate that the system architecture is production-ready for release $RELEASE_ID and can handle expected load"

# 4. Frontend Production Readiness
echo "4️⃣ Checking frontend production readiness..."
echo "> Use the frontend-developer sub-agent to ensure all UI components and user flows are optimized and tested for production release $RELEASE_ID"

# 5. Documentation Review
echo "5️⃣ Ensuring documentation completeness..."
echo "> Use the api-documenter sub-agent to verify that all API changes and new features are properly documented for release $RELEASE_ID"

# Handle specific actions
case "$ACTION" in
    "validate")
        echo "✅ Release validation complete via sub-agent orchestration"
        ;;
    "prepare"|*)
        echo "📦 Preparing release artifacts..."
        
        # Check release branch status
        BRANCH=$(git branch --show-current)
        [ "$BRANCH" != "release/$RELEASE_ID" ] && {
            echo "⚠️ Not on release branch. Expected: release/$RELEASE_ID"
            echo "Current: $BRANCH"
        }
        
        # Display release preparation checklist
        echo "
📋 Release $RELEASE_ID Preparation Checklist:
- [ ] Code quality review completed (code-reviewer)
- [ ] Security audit passed (security-auditor) 
- [ ] Architecture validation completed (backend-architect)
- [ ] Frontend production check completed (frontend-developer)
- [ ] Documentation review completed (api-documenter)
- [ ] Version numbers updated
- [ ] Changelog generated
- [ ] Performance benchmarks verified
"
        ;;
esac

echo "🎯 Multi-agent release preparation for $RELEASE_ID initiated"
```