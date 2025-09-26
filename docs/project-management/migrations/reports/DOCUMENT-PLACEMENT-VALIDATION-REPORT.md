# Document Placement Validation Report

**Generated:** Thu, Sep 25, 2025  9:51:19 PM
**Validator:** tools/validate-document-placement.sh

## Summary

- **Total Violations:** 0
- **Critical Issues:** 0
- **Auto-fixable:** 0

## Validation Results

✅ **All documents properly placed according to guidelines**

No placement violations found. The repository follows the established 4-tier documentation architecture.

## Remediation Commands

To fix placement violations automatically:

```bash
# Run validator in fix mode
tools/validate-document-placement.sh --fix

# Or run individual fix commands:
```

## Validation Coverage

The validator now checks:

### ✅ **Repository-Wide Coverage** (7 validation functions):
- **Root Directory**: Misplaced files in project root
- **Migration Artifacts**: Project management and migration documents
- **Scripts Directory**: Technical infrastructure documentation (`scripts/README.md`)
- **Implementation Docs**: Conway's Law compliance (`src/docs/`, `backend/docs/`)
- **Claude Integration**: `.claude/` command and agent documentation
- **Tools Documentation**: Developer tool documentation (`tools/README.md`)
- **Architectural Docs**: ADR and strategic decision placement

### 📊 **Enhanced Detection**:
- **Deep Traversal**: Finds documentation up to 5 levels deep
- **Context-Aware Classification**: README.md classified by directory context
- **Proximity Validation**: Implementation docs validated for code proximity
- **Structural Compliance**: .claude/ internal organization validated

## Documentation Guidelines

**4-Tier Placement Rules:**
- **Tier 1 - User Facing**: Root README.md (project entry point)
- **Tier 2 - Documentation Hub**: `docs/` (organized by topic)
- **Tier 3 - Implementation**: `src/docs/`, `backend/docs/` (Conway's Law)
- **Tier 4 - Infrastructure**: `tools/README.md`, `scripts/README.md`

**Special Directories:**
- Migration documents: `docs/project-management/migrations/`
- Templates: `docs/templates/`
- Strategic decisions: `docs/architecture/adr/`
- Claude integration: `.claude/commands/`, `.claude/agents/`

See [Documentation Placement Guidelines](docs/templates/DOCUMENTATION-PLACEMENT-GUIDELINES.md) for complete rules.

