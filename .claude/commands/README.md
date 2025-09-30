# Claude Commands Directory

This directory contains slash commands for the AI-Doc-Editor project. Commands are organized by category for easy discovery and maintenance.

## Directory Structure

### Active Commands

- **[agents/](./agents/)** - AI agent specialists for specific tasks
  - `architecture.md` - System architecture analysis
  - `debug-analyze.md` - Debug and troubleshooting
  - `review-complete.md` - Code review automation
  - `security-audit.md` - Security analysis and auditing

- **[cicd/](./cicd/)** - CI/CD and deployment commands
  - `deploy-validate.md` - Deployment validation
  - `hotfix-flow.md` - Emergency hotfix workflow
  - `pipeline-check.md` - CI/CD pipeline health

- **[governance/](./governance/)** - Project governance and documentation
  - `adr-create.md` - Architecture Decision Record creation
  - `commit-smart.md` - Intelligent commit management
  - `docs-update.md` - Documentation maintenance
  - `issue-generate.md` - GitHub issue management

- **[meta/](./meta/)** - Meta-commands for project analysis
  - `auto-workflow.md` - Context-aware workflow suggestions
  - `context-analyze.md` - Project context analysis
  - `health-check.md` - System health diagnostics

- **[utility/](./utility/)** - General utility commands
  - `explain-codebase.md` - Codebase explanation and documentation
  - `search-web.md` - Web search capabilities

- **[workflow/](./workflow/)** - Development workflow commands
  - `merge-safety.md` - Merge protection system
  - `pr-flow.md` - Pull request automation
  - `release-prep.md` - Release preparation
  - `task-dev.md` - Task development workflow

### Archive

- **[archive/](./archive/)** - Archived content
  - `historical-reports/` - Phase reports and audit documents
  - `deprecated/` - Legacy commands no longer in use

## Usage

Commands can be invoked using the slash (`/`) prefix followed by the command name:

```
/health-check
/task-dev T-XX
/merge-safety
/review-complete --scope T-XX
```

## Command Categories

### Tier 1 - Daily Workflow Commands
Most frequently used commands for daily development:
- `/task-dev` - Task development with context
- `/review-complete` - Multi-agent code review
- `/commit-smart` - Intelligent commits
- `/pr-flow` - Pull request automation
- `/merge-safety` - MANDATORY merge protection
- `/health-check` - System diagnostics

### Tier 2 - Specialized Commands
Use as needed for specific scenarios:
- `/security-audit` - Security analysis
- `/architecture` - System architecture review
- `/debug-analyze` - Troubleshooting assistance
- `/pipeline-check` - CI/CD validation

### Tier 3 - Advanced Commands
Production and emergency scenarios:
- `/release-prep` - Release preparation
- `/hotfix-flow` - Emergency hotfix workflow
- `/deploy-validate` - Deployment validation

## Maintenance

This directory structure follows the project's organizational principles:
- Commands are categorized by functional area
- Each category has its own README with detailed command descriptions
- Historical content is archived but preserved
- Active commands follow consistent naming conventions

For command development guidelines, see the individual category README files.