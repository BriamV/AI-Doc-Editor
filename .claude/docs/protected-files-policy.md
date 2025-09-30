# Protected Files Policy

**Usage**: This file is imported by CLAUDE.md via @import
**Purpose**: Files that must NEVER be modified

**NEVER modify files in these categories:**

## Archive Directories (Historical Reference Only)
- `**/archive/` - Archived documentation (historical snapshots, DO NOT UPDATE)
- `.claude/commands/archive/` - Archived historical commands
- `docs/architecture/archive/` - Archived architecture docs (e.g., DESIGN_GUIDELINES-v1)
- `docs/reports/archive/` - Archived reports
- `legacy/` - Migrated Cypress files (see legacy/MIGRATION-README.md)

## Audit Reports & Deliverables (Point-in-Time Snapshots)
- Files matching `*audit*.md`, `*-audit-*.md` - Audit reports from specific dates
- Files matching `*-report.md`, `*REPORT*.md` - Formal reports and deliverables
- Files matching `*SUMMARY*.md`, `*-SUMMARY.md` - Completion summaries
- Examples:
  - `.claude/docs/audit-current-hooks-file.md` (now in archive/)
  - `docs/security/audits/general-security-audit-report.md`
  - `docs/reports/archive/phase-*-completion-report.md`

**Rationale**: Archives and audit reports are historical records. When updating documentation, create NEW versions or update CURRENT files, never modify archived/audit files.

## Temporary Files
- `test-*.js` - Temporary debugging files
- `.claude/hooks.json.backup-*` - Backup configurations (gitignored)
- `.claude/session-context.json` - Runtime session data (gitignored)