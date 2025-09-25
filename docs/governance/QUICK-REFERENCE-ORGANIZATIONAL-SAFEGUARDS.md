# Quick Reference: Organizational Safeguards

**🚀 TL;DR:** Use `yarn validate-docs:fix` to fix document placement issues automatically.

## Essential Commands

```bash
# 🔍 CHECK document placement
yarn validate-docs                    # Basic validation
yarn validate-docs:strict            # CI/CD mode (fails on violations)

# 🔧 FIX document placement issues
yarn validate-docs:fix               # Auto-fix misplaced documents
yarn validate-docs:fix --verbose     # Auto-fix with detailed output

# 📊 GENERATE placement reports
yarn validate-docs:report            # Comprehensive analysis report
```

## Integration Points

### Automatic Protection (No Action Required)

✅ **Pre-commit validation** - Runs during file modifications
✅ **Quality gate integration** - Part of `yarn quality-gate`
✅ **CI/CD validation** - Automatic GitHub Actions checks
✅ **Claude Code hooks** - Integrated into development workflow

### Manual Validation (When Needed)

⚠️ **Before major commits:** `yarn validate-docs`
⚠️ **Before pull requests:** `yarn quality-gate` (includes validation)
⚠️ **After reorganization:** `yarn validate-docs:report`

## Common Document Placement Rules

```bash
# ✅ CORRECT PLACEMENT
docs/project-management/migrations/     # Migration documents
docs/templates/                         # Templates and guidelines
docs/architecture/adr/                  # Architecture Decision Records
docs/governance/                        # Governance documentation
src/docs/                              # Implementation docs (near code)
tools/README.md                        # Tool documentation (with tools)

# ❌ INCORRECT PLACEMENT (Auto-fixed)
/MIGRATION-REPORT.md                   # Should be in migrations/
/TEMPLATE-GUIDE.md                     # Should be in templates/
/.claude/ADR-001.md                    # Should be in docs/architecture/adr/
```

## Troubleshooting

### Common Issues & Solutions

**Issue:** Validation timeout during file operations
```bash
# Solution: Run validation separately
yarn validate-docs
# Then retry your operation
```

**Issue:** "Document should be moved" warnings
```bash
# Solution: Auto-fix placement
yarn validate-docs:fix
```

**Issue:** CI/CD pipeline failing on document validation
```bash
# Solution: Fix locally and push
yarn validate-docs:strict  # Check what's failing
yarn validate-docs:fix     # Fix the issues
git add . && git commit -m "fix: correct document placement"
```

## System Status Indicators

### Success Messages ✅
- `✅ Document placement validated` - All documents properly placed
- `✅ All documents properly placed!` - Validation complete, no issues

### Warning Messages ⚠️
- `⚠️ Document placement issues detected` - Run fix command
- `⚠️ Placement violations found` - Auto-fixable issues exist

### Error Messages ❌
- `❌ Critical violations found` - Manual intervention required
- `❌ Violations found in strict mode` - CI/CD blocking errors

## Quick Fixes

### Most Common Scenarios

**Scenario 1:** Root directory has stray documents
```bash
yarn validate-docs:fix  # Moves them to correct locations
```

**Scenario 2:** Migration documents in wrong places
```bash
yarn validate-docs:fix  # Organizes into migration hierarchy
```

**Scenario 3:** Templates not in template directory
```bash
yarn validate-docs:fix  # Moves to docs/templates/
```

## Performance Notes

- **Hook validation:** 8-second timeout, non-blocking
- **Quality gate:** Blocking, runs first in pipeline
- **Auto-fix:** Usually completes in 2-5 seconds
- **Report generation:** 5-10 seconds for full analysis

## When to Use Each Command

| Situation | Command | Why |
|-----------|---------|-----|
| Daily development | *Automatic* | Hooks handle it |
| Before committing | `yarn validate-docs` | Quick check |
| Issues detected | `yarn validate-docs:fix` | Auto-correct |
| PR preparation | `yarn quality-gate` | Full validation |
| After reorganization | `yarn validate-docs:report` | Audit placement |
| CI/CD debugging | `yarn validate-docs:strict` | See what's failing |

## Getting Help

🔗 **Full Documentation:** [Organizational Failure Prevention System](ORGANIZATIONAL-FAILURE-PREVENTION-SYSTEM.md)
🛠️ **Script Details:** `tools/validate-document-placement.sh --help`
⚙️ **Integration Details:** `.claude/hooks.json` and `package.json`

---
**Remember:** The system is designed to help, not hinder. When in doubt, run `yarn validate-docs:fix` and let the system organize your documents professionally.