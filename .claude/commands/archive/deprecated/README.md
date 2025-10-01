# Legacy Commands Archive

**Date Archived**: 2025-01-14  
**Reason**: Replaced by new workflow architecture in Phase 2

## Archived Commands

### 1. intelligent-qa.md
- **Status**: LEGACY - Do not use
- **Replaced by**: `/task-dev`, `/pr-flow`, `/release-prep`
- **Functionality**: Intelligent QA pipeline with scope detection
- **Migration**: Use new workflow commands for better integration

### 2. multi-agent-orchestrator.md  
- **Status**: LEGACY - Do not use
- **Replaced by**: `/task-dev`, `/pr-flow`, `/release-prep` with sub-agent delegation
- **Functionality**: Multi-agent workflow coordination
- **Migration**: New commands include explicit sub-agent invocation patterns

### 3. task-lifecycle.md
- **Status**: LEGACY - Do not use  
- **Replaced by**: `/task-dev` command
- **Functionality**: Task lifecycle management
- **Migration**: Use `/task-dev` for enhanced task management with context detection

## Migration Guide

### Before (Legacy):
```bash
# Old approach - deprecated
/intelligent-qa auto
/orchestrate workflow-name
/task-lifecycle T-XX
```

### After (Current):
```bash
# New workflow architecture
/task-dev T-XX complete    # Task development with validation
/pr-flow develop --draft   # PR creation with code review
/release-prep R1.0 validate # Release prep with multi-agent coordination
```

## Technical Improvements

The new workflow architecture provides:

1. **Better Integration**: Direct integration with existing `.claude/hooks.json` system
2. **Context Awareness**: Automatic detection of current workflow stage
3. **Sub-Agent Delegation**: Explicit invocation patterns for specialized agents  
4. **Performance**: Maintains 54% optimized timeout system
5. **Standardization**: Consistent command structure and documentation

## Rollback Information

If rollback is needed:
- These legacy files contain the original implementations
- All functionality has been preserved and enhanced in new commands
- Original agent coordination patterns are documented for reference

---

**Do not use legacy commands** - they are kept only for reference and potential rollback scenarios.