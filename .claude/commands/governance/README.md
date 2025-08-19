# Governance Commands - QA y Gobernanza Integrada

Phase 2 of the comprehensive slash commands system focusing on intelligent governance automation with full ecosystem integration.

## Commands Overview

### 1. `/commit-smart` - Intelligent Commit with Quality Gates
**Purpose**: Automated commit with conventional commits, hooks validation, and traceability updates

**Usage**:
```bash
/commit-smart "implement OAuth integration" --task=T-02 --type=feat
/commit-smart "fix authentication bug" --type=fix
/commit-smart "update documentation" --type=docs
```

**Integration Points**:
- `@docs/CONTRIBUTING.md` - Conventional commits standards
- `!yarn run cmd validate-staged` - Quality gates via optimized hooks (54% faster)
- `tools/status-updater.sh` - Task progress tracking
- `scripts/governance.ts` - Traceability matrix updates
- Auto-detects task ID from branch name (feature/T-XX)
- Sub-agents: `code-reviewer`, `api-documenter`

### 2. `/adr-create` - Architecture Decision Records
**Purpose**: Create ADRs with template, auto-numbering, and index management

**Usage**:
```bash
/adr-create "Migration to Pydantic v2" --context="Performance improvements needed" --status=proposed
/adr-create "Testing Strategy" --status=proposed
```

**Integration Points**:
- `@docs/adr/ADR-000-template.md` - Template source
- `@docs/adr/README.md` - Auto-updated index
- Automatic sequential numbering (ADR-001, ADR-002, etc.)
- Kebab-case title formatting
- Sub-agents: `backend-architect`, `api-documenter`

### 3. `/issue-generate` - GitHub Issue Creation
**Purpose**: Generate GitHub issues from tasks/bugs with proper labeling and context

**Usage**:
```bash
/issue-generate bug "Authentication fails on mobile" --task=T-02 --priority=high
/issue-generate enhancement "Add dark mode toggle" --priority=medium --assignee=@developer
/issue-generate security "SQL injection vulnerability" --priority=critical
```

**Integration Points**:
- `!gh issue create` - GitHub CLI integration
- `tools/task-navigator.sh` - Task context extraction
- `@docs/Sub Tareas v2.md` - Task details reference
- Automatic labeling and priority assignment
- Sub-agents: `security-auditor`, `debugger`

### 4. `/docs-update` - Documentation & Traceability Automation
**Purpose**: Update DEVELOPMENT-STATUS.md and traceability matrix automatically

**Usage**:
```bash
/docs-update --scope=task --task=T-02 --format=all
/docs-update --scope=workpackage --format=xlsx
/docs-update --scope=release --format=md
```

**Integration Points**:
- `@docs/DEVELOPMENT-STATUS.md` - Status tracking
- `@docs/traceability/README.md` - Traceability matrix
- `!yarn run cmd traceability --format=all` - Matrix generation (scripts/ legacy)
- `tools/progress-dashboard.sh` - Current progress analysis
- Sub-agents: `workflow-architect`, `api-documenter`

## Technical Architecture

### Context Intelligence
All commands feature automatic context detection:
- **Branch Context**: Auto-extracts task IDs from feature/T-XX branches
- **File Change Analysis**: Determines commit type based on modified files
- **Workflow Phase**: Detects current development phase (dev/qa/release)
- **Project State**: Integrates with existing progress tracking

### Integration Requirements
- **Performance**: Maintains 54% optimized hooks system (70s timeout)
- **Quality Gates**: Full integration with existing validation pipeline
- **Traceability**: Automatic updates to governance documentation
- **Standards**: Follows conventional commits and ADR templates

### Sub-Agent Integration Pattern
```bash
echo "> Use the [agent-name] sub-agent to [specific task with context]"
```

**Specialized Sub-Agents**:
- `code-reviewer`: Commit content analysis and quality validation
- `backend-architect`: Architecture decision analysis and ADR creation
- `security-auditor`: Security issue analysis and vulnerability assessment
- `debugger`: Bug report analysis and debugging context
- `api-documenter`: Documentation formatting and maintenance
- `workflow-architect`: Project status analysis and workflow optimization

## Performance & Quality

### Integration Metrics
- **Hook Compatibility**: 100% compatible with optimized .claude/hooks.json
- **Response Time**: <2s for context detection, <5s for full operations
- **Quality Gates**: Zero bypass of existing validation systems
- **Standards Compliance**: 100% conventional commits and ADR template adherence

### Error Handling
- Graceful fallbacks for missing tools or context
- Clear error messages with actionable suggestions
- Validation checks before destructive operations
- Rollback capabilities for failed operations

## Usage Examples

### Complete Task Workflow
```bash
# Start development
/task-dev T-02 --phase=implementation

# Smart commits during development
/commit-smart "implement user authentication" --task=T-02
/commit-smart "add OAuth integration tests" --task=T-02 --type=test

# Create ADR for architecture decisions
/adr-create "OAuth Provider Selection" --context="Need secure authentication"

# Generate issues for discovered bugs
/issue-generate bug "OAuth token refresh fails" --task=T-02 --priority=high

# Update documentation and traceability
/docs-update --scope=task --task=T-02

# Complete with PR creation
/pr-flow develop --task=T-02
```

### Release Preparation
```bash
# Update all documentation
/docs-update --scope=release --format=all

# Generate release issues
/issue-generate task "Release R1 preparation" --priority=high

# Create release ADR
/adr-create "R1 Release Strategy" --status=accepted
```

This governance system provides intelligent automation while maintaining full integration with the existing optimized infrastructure and quality standards.