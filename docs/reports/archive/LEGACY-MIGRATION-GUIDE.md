# Legacy Migration Guide

This document provides migration paths from deprecated scripts to modern direct commands and slash commands.

## ⚠️ Deprecation Notice

The following legacy patterns are deprecated and marked for removal:

### Deprecated: scripts/cli.cjs
- **Status**: DEPRECATED (marked for removal)
- **Reason**: Replaced by direct yarn commands and slash commands
- **Timeline**: Will be removed in next major cleanup phase

### Deprecated: yarn run cmd pattern
- **Status**: DEPRECATED (scripts updated but pattern discouraged)
- **Reason**: Direct yarn commands are faster and more maintainable
- **Timeline**: Immediate migration recommended

## Migration Mappings

### Development Commands
```bash
# OLD (DEPRECATED)                    # NEW (PREFERRED)
yarn run cmd dev                  →   yarn dev
yarn run cmd build                →   yarn fe:build
yarn run cmd test                 →   yarn fe:test
yarn run cmd security-scan        →   yarn sec:all
```

### Quality & Validation Commands
```bash
# OLD (DEPRECATED)                    # NEW (PREFERRED)
yarn run cmd lint                 →   yarn fe:lint
yarn run cmd format               →   yarn fe:format
yarn run cmd tsc-check            →   yarn fe:typecheck
yarn run cmd qa-gate              →   yarn qa:gate
```

### Governance & Documentation Commands
```bash
# OLD (DEPRECATED)                    # NEW (PREFERRED)
yarn run cmd traceability         →   /docs-update command
yarn run cmd governance           →   /adr-create or /issue-generate commands
yarn run cmd validate-task T-XX   →   /task-dev T-XX command
```

### Task Management Commands
```bash
# OLD (DEPRECATED)                    # NEW (PREFERRED)
yarn run cmd validate-frontend    →   yarn fe:typecheck
yarn run cmd validate-backend     →   Python venv activation
yarn run cmd validate-modified    →   Use .claude/hooks.json auto-validation
```

## Slash Commands (PREFERRED for Complex Tasks)

For complex workflows, use custom slash commands instead of direct CLI:

### Primary Workflow Commands
```bash
/task-dev T-XX [complete]       # Task development with context
/review-complete [--scope]      # Multi-agent code review
/security-audit [--depth=full]  # Security analysis
/health-check                   # System diagnostics
/commit-smart                   # Intelligent commits
```

### Documentation & Governance
```bash
/docs-update [scope]            # Documentation maintenance
/adr-create [topic]             # Architecture Decision Records
/issue-generate [scope]         # Issue tracking
```

### Analysis & Debugging
```bash
/context-analyze [--depth]      # Project analysis
/debug-analyze [component]      # Debugging assistance
/architecture [component]       # Architecture review
```

## Functional Components Status

### ✅ Fully Migrated
- **Development commands**: All moved to direct yarn commands
- **Quality gates**: Integrated into .claude/hooks.json with 54% performance improvement
- **Auto-formatting**: Automated via Edit/Write/MultiEdit hooks

### ⚠️ In Transition
- **tools/ bash scripts**: Still functional, gradually being replaced by slash commands
- **Legacy command references**: Being updated in documentation

### ❌ Deprecated (Do Not Use)
- **scripts/cli.cjs**: Legacy CLI wrapper
- **yarn run cmd pattern**: Use direct yarn commands instead
- **scripts/governance.ts**: Use /docs-update, /adr-create instead

## Best Practices for Migration

### 1. Immediate Changes
- Replace all `yarn run cmd <command>` with `yarn <command>`
- Update scripts and documentation to use direct commands
- Use slash commands for complex multi-step workflows

### 2. Workflow Integration
- Use .claude/hooks.json for automatic quality gates
- Leverage slash commands for context-aware task management
- Prefer sub-agent delegation through custom commands

### 3. Performance Benefits
- Direct commands: 54% faster execution (152s → 70s total timeout)
- Auto-validation: Runs on file edits without manual intervention
- Intelligent context: Slash commands auto-detect project state

## Troubleshooting Migration Issues

### Issue: Command not found after migration
**Solution**: Ensure package.json scripts are updated to use direct commands

### Issue: Quality gates not running
**Solution**: Verify .claude/hooks.json is properly configured for auto-formatting

### Issue: Legacy workflow dependencies
**Solution**: Use /health-check to identify remaining legacy references

## Support and Documentation

- **Main Guide**: CLAUDE.md
- **Command Reference**: .claude/commands/ directory
- **Health Check**: /health-check command
- **Project Status**: tools/progress-dashboard.sh

## Future Roadmap

### Phase 1: Documentation Migration (COMPLETE)
- ✅ Update CLAUDE.md with deprecation warnings
- ✅ Update command files to remove legacy references
- ✅ Create migration guide

### Phase 2: Code Migration (IN PROGRESS)
- 🔄 Update all scripts to use direct commands
- 🔄 Remove legacy CLI references
- 🔄 Test migration completeness

### Phase 3: Cleanup (PLANNED)
- 🔲 Remove scripts/cli.cjs
- 🔲 Archive legacy components
- 🔲 Final validation of direct command workflow

---

**Last Updated**: 2025-08-18
**Migration Status**: Documentation Complete, Code Migration In Progress