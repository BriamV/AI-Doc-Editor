# Scripts Infrastructure Scope Definition - AI-Doc-Editor

## ⚠️ Status Notice

**Current Status**: Essential infrastructure layer for quality automation and CI/CD
**Preference**: Use direct yarn commands (yarn dev, yarn fe:build, yarn fe:test) for user interface
**Role**: Backend multiplatform utilities for development workflow infrastructure

## Overview

Critical infrastructure layer solving cross-platform development workflow automation and quality assurance needs. These Node.js-based scripts (.cjs) solve foundational development infrastructure requirements:

- ✅ **Multiplatform Execution** - Windows/Linux/WSL compatibility for all development environments
- ✅ **Quality Gate Integration** - 40+ tools ecosystem with automated validation
- ✅ **Merge Protection** - Git-level safety mechanisms preventing data loss
- ✅ **Performance Optimization** - 54% execution time improvement (152s → 70s)
- ✅ **Development Workflow** - Seamless integration with package.json and yarn commands

## Core Infrastructure Components

### **multiplatform.cjs** - Cross-Platform Execution Engine

```bash
# Automatic platform detection and tool execution
# Powers all yarn commands with Windows/Linux/WSL compatibility
yarn dev                              # Uses multiplatform for cross-OS development
yarn fe:build                         # Cross-platform build execution
yarn fe:test                          # Platform-aware testing
yarn qa:gate                          # Multiplatform quality validation
```

**Features:**

- Automatic Windows/Linux/WSL detection and adaptation
- Universal command translation for cross-platform consistency
- Environment-specific path resolution and execution contexts
- Performance-optimized execution with 54% speed improvement

### **merge-protection.cjs** - Git Safety and Data Integrity

```bash
# Automated merge safety validation and protection
yarn merge-safety-full               # Complete merge protection validation
yarn pre-merge-check                 # Pre-merge safety verification
yarn validate-merge-full             # Comprehensive branch comparison
```

**Features:**

- File count comparison preventing catastrophic data loss (250+ files)
- Critical directory structure validation
- Essential configuration file integrity checks
- Automatic merge blocking on validation failures

### **install-merge-hooks.cjs** - Git-Level Protection Installation

```bash
# One-time installation of native git protection hooks
yarn install-merge-hooks             # Install git-level merge protection
```

**Features:**

- Native git hooks installation for merge protection
- Automated safety validation before any merge operation
- Integration with existing git workflow without disruption
- Persistent protection across development sessions

### **dev-runner.cjs** - Development Workflow Orchestration

```bash
# Development environment management and orchestration
# Integrated with yarn dev for seamless development experience
yarn dev                             # Orchestrated development server startup
```

**Features:**

- Development server coordination and management
- Hot-reload integration with build pipeline
- Resource optimization for development efficiency
- Error handling and recovery for development workflow

### **python-cc-gate.cjs** - Backend Quality Gate Integration

```bash
# Python backend quality validation and formatting
yarn be:quality                      # Backend Python validation (format + lint + complexity)
yarn be:format                       # Python autofix formatting (Black)
yarn be:lint                         # Python autofix linting (Ruff)
```

**Features:**

- Multi-technology quality gate integration (Python + TypeScript)
- Automated code formatting and linting with autofix capabilities
- Complexity analysis and quality metrics (CC≤15)
- Backend-specific validation tailored to FastAPI requirements

## Development Workflow Integration

### **Tier 1: Direct Commands** (Preferred User Interface)

```bash
# Primary development commands powered by scripts infrastructure
yarn dev                             # Uses dev-runner + multiplatform
yarn fe:build                        # Cross-platform via multiplatform
yarn fe:test                         # Uses multiplatform for cross-OS testing
yarn qa:gate                         # Includes merge-protection validation
yarn merge-safety-full               # Uses merge-protection
```

### **Tier 2: Slash Commands** (Workflow Automation)

```bash
# Workflow commands that leverage scripts infrastructure
/merge-safety                        # Complete merge protection using merge-protection.cjs
/health-check                        # System validation via multiplatform
/commit-smart                        # Automated commits with quality gates
/review-complete                     # Validation via python-cc-gate and merge-protection
/context-analyze                     # Context-aware analysis with multiplatform execution
```

### **Tier 3: Automated Hooks** (Background Integration)

- **Location**: .claude/hooks.json
- **Integration**: Uses multiplatform for cross-platform execution of 40+ quality tools
- **Quality Gates**: Includes merge-protection for automated safety validation
- **Performance**: 40+ tools integrated automatically with 54% optimization
- **Trigger**: Auto-runs on Edit/Write/MultiEdit operations

### **Tier 4: Infrastructure Layer** (This Directory)

- **Purpose**: Backend utilities powering higher-tier commands and automation
- **Maintenance**: Performance-optimized - focused on multiplatform compatibility
- **Integration**: Called by package.json scripts, yarn commands, and .claude/hooks.json
- **Architecture**: Foundation layer enabling all other workflow automation

## Architecture Integration

### **4-Tier Documentation Positioning**

| Tier       | Location           | User Interface                    | Purpose                                                |
| ---------- | ------------------ | --------------------------------- | ------------------------------------------------------ |
| **Tier 1** | Direct Commands    | `yarn dev, yarn build, yarn test` | User-facing development interface                      |
| **Tier 2** | Slash Commands     | `/merge-safety, /health-check`    | Workflow automation                                    |
| **Tier 3** | Hooks System       | `.claude/hooks.json`              | Background quality automation                          |
| **Tier 4** | **Infrastructure** | **`scripts/`**                    | **Backend utilities and multiplatform infrastructure** |

### **Cross-References**

- **[CLAUDE.md](../CLAUDE.md)** - Primary project guidance and command reference
- **[package.json](../package.json)** - Script integration and yarn command definitions
- **[.claude/hooks.json](../.claude/hooks.json)** - Quality automation configuration
- **[ADR-011: Directory Architecture](../docs/architecture/adr/ADR-011-scripts-tools-dual-directory-architecture.md)** - Strategic separation rationale

### **Integration Flow**

```
User Command (yarn dev)
    ↓
Infrastructure Script (dev-runner.cjs)
    ↓
Platform Detection (multiplatform.cjs)
    ↓
Cross-Platform Execution
    ↓
Quality Validation (merge-protection.cjs)
    ↓
Development Environment Ready
```

## File Structure

```
scripts/
├── SCOPE-DEFINITION.md             # This infrastructure documentation
├── multiplatform.cjs               # Cross-platform execution engine
├── merge-protection.cjs            # Git safety and merge validation
├── install-merge-hooks.cjs         # Git-level protection installation
├── dev-runner.cjs                  # Development workflow orchestration
└── python-cc-gate.cjs              # Backend quality gate integration
```

## Infrastructure Benefits

### **Cross-Platform Compatibility** 🌐

- **Windows Native**: Full compatibility without WSL requirement
- **Linux Integration**: Optimized execution in Linux environments
- **WSL2 Support**: Seamless Windows Subsystem for Linux integration
- **Universal Paths**: Automatic path resolution across operating systems

### **Quality Assurance Protection** 🛡️

- **Merge Safety**: Prevents catastrophic data loss during git operations
- **File Integrity**: Validates critical project structure before merges
- **Configuration Protection**: Ensures essential files remain intact
- **Automated Blocking**: Stops dangerous operations automatically

### **Performance Optimization** ⚡

- **54% Speed Improvement**: Execution time reduced from 152s to 70s
- **Resource Efficiency**: Optimized tool execution and resource management
- **Parallel Processing**: Concurrent validation and quality checking
- **Caching Integration**: Smart caching for repeated operations

## Performance Metrics

### **Execution Optimization**

- 54% performance improvement (152s → 70s total pipeline execution)
- Cross-platform execution overhead: <5% additional time
- Quality gate integration: 40+ tools with optimized parallel execution

### **Reliability and Safety**

- Merge protection success rate: 100% for configured validations
- Cross-platform compatibility: Windows/Linux/WSL without issues
- Quality gate accuracy: Zero false positives in protection mechanisms

## Troubleshooting

### **Common Issues**

#### Platform Detection Problems

**Problem**: Script fails to detect correct operating system or environment
**Solution**: Verify Node.js version (18.16.0+) and check environment variables
**Prevention**: Use `yarn env-validate` for comprehensive environment diagnostics

#### Merge Protection Failures

**Problem**: Merge protection blocks legitimate operations
**Solution**: Run `yarn pre-merge-check` to identify specific validation failures
**Validation**: Use `yarn validate-merge-full` to verify branch safety before retry

### **Environment-Specific Issues**

#### Windows Development

- PowerShell execution policy requirements for development workflow
- Path separator handling in multiplatform execution contexts

#### Linux/WSL Environments

- Permission requirements for git hook installation
- Shell compatibility for automated script execution

## Maintenance Guidelines

### **Update Procedures**

1. Test multiplatform compatibility across Windows/Linux/WSL environments
2. Validate integration with package.json and yarn command ecosystem
3. Verify quality gate integration maintains 40+ tool compatibility
4. Confirm merge protection mechanisms function correctly

### **Monitoring Points**

- Cross-platform execution success rates across development environments
- Quality gate performance and integration health with .claude/hooks.json
- Merge protection effectiveness and false positive/negative rates

### **Backup and Recovery**

- Git hooks backup via install-merge-hooks.cjs automatic backup creation
- Quality configuration backup in .claude/hooks.json.backup
- Development environment restoration via yarn commands

## Scope Boundaries

### **✅ DO: Scripts Directory Responsibilities**

- Cross-platform infrastructure and execution engines
- Git-level protection and merge safety mechanisms
- Development workflow orchestration and automation
- Quality gate integration for multi-technology stacks
- Performance optimization for development pipeline
- Node.js-based (.cjs) utilities requiring cross-platform compatibility

### **❌ DON'T: Outside Scripts Scope**

- Project-specific task management and navigation (→ tools/)
- Business logic or application-specific workflows (→ src/, backend/)
- User-facing documentation and guidance (→ docs/)
- Task planning and Definition of Done validation (→ tools/)
- Shell-based project management utilities (→ tools/)
- Strategic architectural decisions (→ docs/architecture/)

### **Integration Points**

- **WITH tools/**: Scripts provide infrastructure; tools provide project management
- **WITH package.json**: Scripts integrate as yarn command backends
- **WITH .claude/**: Scripts power quality automation and hook integration
- **WITH CI/CD**: Scripts provide cross-platform foundation for automated pipelines

## Quality Standards

### **Code Quality Requirements**

- Node.js/.cjs compatibility across platforms
- Error handling for cross-platform edge cases
- Performance optimization maintaining 54% improvement
- Integration testing with existing development workflow

### **Documentation Standards**

- Conway's Law compliance (implementation docs near code)
- Technical infrastructure template adherence
- Cross-reference maintenance with strategic documentation
- Integration pattern documentation for new components

### **Performance Standards**

- Maintain 54% performance improvement baseline
- Cross-platform overhead ≤5% execution time penalty
- Quality gate integration without workflow disruption
- Resource efficiency in multiplatform execution

## 📄 **License**

This project is licensed under the terms of the MIT license.
