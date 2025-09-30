# Documentation Standards & Templates

**Usage**: This file is imported by CLAUDE.md via @import
**Purpose**: Template usage and quality requirements for documentation

## Template Usage (REQUIRED for README creation)

```bash
# 1. Evaluate content type and placement
docs/templates/DOCUMENTATION-PLACEMENT-GUIDELINES.md

# 2. Select appropriate template from 6 categories:
# - User-Facing Application (main project entry)
# - Technical Infrastructure (tools/scripts)
# - Documentation Hub (navigation/organization)
# - Implementation Guide (code-proximate docs)
# - Architecture Reference (ADRs/formal decisions)
# - Claude Code Integration (commands/automation)

# 3. Validate compliance before committing
docs/templates/README-VALIDATION-CHECKLIST.md
```

## Quality Requirements

✅ **MANDATORY**: Template compliance for all new READMEs
✅ **MANDATORY**: Conway's Law compliance (implementation docs ≤2 dirs from code)
✅ **MANDATORY**: 4-tier navigation table (user-facing docs)
✅ **MANDATORY**: Bilingual standards (Spanish user-facing, English technical)
✅ **VALIDATION**: 95%+ working cross-references, 90%+ template adherence

## Quick Template Selection

- **Main project README**: User-Facing Application template
- **Tools/scripts dirs**: Technical Infrastructure template
- **docs/ navigation**: Documentation Hub template
- **src/docs/ or backend/docs/**: Implementation Guide template
- **ADR collections**: Architecture Reference template
- **.claude/ directories**: Claude Code Integration template