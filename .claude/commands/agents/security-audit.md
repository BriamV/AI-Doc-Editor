# Security Audit - Specialized Security Analysis

---
description: Comprehensive security audit with security-auditor sub-agent
argument-hint: "[scope] [--quick]"
allowed-tools: Bash(npm audit), Bash(npx semgrep), Bash(yarn run cmd *), Bash(bash tools/*), Read, Grep
model: claude-3-5-sonnet-20241022
---

## Purpose
Conducts thorough security analysis using specialized security-auditor sub-agent with context-aware scope detection.

## Usage
```bash
/security-audit                     # Full security audit
/security-audit auth                # Focus on authentication
/security-audit --quick             # Quick security scan
/security-audit encryption          # Focus on data protection
```

## Context (auto-collected)
- Current branch: !`git branch --show-current`
- Recent changes: !`git diff --name-only HEAD~1..HEAD`
- Security-sensitive files: !`git diff --name-only HEAD~1..HEAD | grep -E "(auth|oauth|security|crypto|token)"`
- Task context: !`bash tools/task-navigator.sh $(git branch --show-current | grep -o 'T-[0-9]\+')`

## Implementation

Parse `$ARGUMENTS` for security scope and quick flag. Auto-detect scope from recent changes (auth/login/oauth → authentication, encrypt/crypto/key → encryption, api/endpoint/route → api-security).

**Security scope detection and sub-agent delegation:**

> Use the security-auditor sub-agent to perform comprehensive security analysis of authentication mechanisms, data encryption, API security, and compliance with GDPR requirements

**Automated security tools integration:**
- npm audit --audit-level moderate
- npx semgrep --config=auto . --severity=ERROR
- tools/validate-auth.sh (if available)
- yarn run cmd security-scan
```