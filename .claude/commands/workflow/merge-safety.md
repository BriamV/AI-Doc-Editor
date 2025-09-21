# Merge Safety - Critical Protection System

---
description: Comprehensive merge safety validation to prevent catastrophic file loss during merges
argument-hint: "[--source branch] [--target branch] [--check-only] [--install-hooks]"
allowed-tools: Bash(git *), Bash(node scripts/*), Bash(yarn *), Read, Grep, Glob
model: claude-3-5-sonnet-20241022
---

## Purpose

Critical merge protection system that validates file count integrity, checks critical directory and file existence, verifies configuration file integrity, ensures development status consistency, and validates ADR files presence before merges.

## Usage

```bash
/merge-safety                           # Auto-detect source/target branches
/merge-safety --source feat/T-25        # Explicit source branch
/merge-safety --target main             # Explicit target branch
/merge-safety --check-only              # Validation only, no hook installation
/merge-safety --install-hooks           # Install git-level protection hooks
```

## Context (auto-collected)
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -3`
- File count current: !`find . -type f -not -path './.git/*' | wc -l`
- Critical files check: !`ls -la package.json CLAUDE.md docs/DEVELOPMENT-STATUS.md 2>/dev/null || echo "Missing files detected"`

## Implementation

Parse `$ARGUMENTS` for source/target branches and operation flags. Auto-detect branches using GitFlow conventions if not specified.

**Sub-agent delegation for comprehensive merge safety:**

- **Always required**:
  > Use the devops-troubleshooter sub-agent to perform comprehensive merge safety validation including file count comparison, critical directory structure validation, and configuration integrity checks

- **Security validation**:
  > Use the security-auditor sub-agent to validate that the merge does not compromise security configurations, authentication settings, or sensitive file structures

- **Code quality validation**:
  > Use the code-reviewer sub-agent to ensure code quality standards are maintained and no critical functionality is lost during the merge

**Merge protection workflow:**
1. Install git hooks for native protection (if --install-hooks specified)
2. Execute pre-merge safety checks via `node scripts/merge-protection.cjs pre-merge-check`
3. Run comprehensive validation via `node scripts/merge-protection.cjs validate-merge --source $SOURCE --target $TARGET`
4. Execute quality gate validation via `yarn quality-gate`
5. Provide detailed safety report with approval/blocking decision

**Integration with existing yarn commands:**
- `yarn merge-safety-full`: Alternative yarn command access
- `yarn install-merge-hooks`: Git hook installation
- `yarn pre-merge-check`: Lightweight pre-merge validation
- `yarn validate-merge-full`: Comprehensive branch comparison

## Integration Points

- **Pre-SubAgent Hook**: Automatically runs for `pr-flow` and `commit-smart` commands
- **Git Hooks**: Installs native git hooks for additional protection via `scripts/install-merge-hooks.cjs`
- **Quality Gate**: Integrates with existing quality validation system
- **Workflow Commands**: Triggered automatically by `/pr-flow` and `/commit-smart`
- **CI/CD**: Can be integrated into GitHub Actions workflows

## Error Recovery

If merge validation fails, sub-agents will provide specific guidance for:

1. **File Count Issues**: Restore deleted or missing files from backup/previous commits
2. **Critical Files Missing**: Recreate essential configuration and documentation files
3. **Configuration Errors**: Fix JSON syntax or configuration integrity issues
4. **Development Status**: Update `DEVELOPMENT-STATUS.md` with current project state
5. **ADR Files**: Ensure required Architecture Decision Record files are present

## Safety Features

- **Sub-agent validation**: Multi-specialist review before merge approval
- **Automatic failure blocking**: Fails fast to prevent damage
- **Comprehensive reporting**: Detailed validation results from each sub-agent
- **Git hook protection**: Native git-level protection via installed hooks
- **Branch context detection**: Automatically determines source/target using GitFlow
- **Quality gate integration**: Ensures code standards are maintained

## Emergency Override

**WARNING**: Emergency override bypasses ALL protection (USE ONLY IN EXTREME CASES):

```bash
# EMERGENCY ONLY - BYPASSES ALL PROTECTION
git merge --no-verify <branch>
```

Only use if you have manually verified the merge is safe and understand the complete risk profile.