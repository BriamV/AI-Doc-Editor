# Infrastructure Scripts - AI-Doc-Editor

## ⚠️ Status Notice

**Current Status**: Essential infrastructure layer for development automation
**Preference**: Use direct yarn commands and slash commands for user-facing operations
**Role**: Backend utilities powering cross-platform development and merge protection

## Overview

Core infrastructure scripts providing cross-platform utilities and safety systems for the AI-Doc-Editor development environment. These scripts solve critical infrastructure needs:

- ✅ **Cross-platform compatibility** - Windows/Linux/WSL environment detection
- ✅ **Merge safety validation** - Automated file count and structure protection
- ✅ **Development orchestration** - Multi-service coordination for dev environment
- ✅ **Quality gate enforcement** - Python complexity and design validation
- ✅ **Git protection system** - Native hook installation and management

## Infrastructure Scripts

### **multiplatform.cjs** - Cross-Platform Environment Detection

```bash
# Used internally by yarn commands for environment detection
# Automatically detects: Windows/Linux/WSL, Python venv, tool availability
```

**Features:**
- Cross-platform environment detection (Windows/Linux/WSL)
- Python virtual environment management and activation
- Tool availability verification across platforms
- Multi-OS command translation and path handling

### **merge-protection.cjs** - Merge Safety System

```bash
# Triggered by merge safety commands
yarn merge-safety-full           # Uses this script for validation
/merge-safety                    # Slash command wrapper
```

**Features:**
- File count comparison validation (prevents accidental file loss)
- Critical directory structure integrity checks
- Configuration file existence verification
- Automated merge blocking on validation failures

### **install-merge-hooks.cjs** - Git Protection Installer

```bash
# Install native git-level protection
yarn install-merge-hooks         # Installs hooks using this script
```

**Features:**
- Git pre-merge hook installation
- Native repository protection setup
- Hook configuration management and updates
- Integration with merge-protection system

### **dev-runner.cjs** - Development Server Orchestrator

```bash
# Used by development commands for multi-service coordination
yarn dev                         # Uses this for orchestration
```

**Features:**
- Multi-service development server coordination
- Frontend and backend service management
- Environment variable coordination
- Process lifecycle management

### **python-cc-gate.cjs** - Python Quality Validation

```bash
# Integrated with Python quality commands
yarn python-quality              # Includes complexity validation
```

**Features:**
- Python cyclomatic complexity analysis
- Code quality metrics validation
- Design guideline enforcement (CC≤15, LOC≤300)
- Integration with quality pipeline

## Development Workflow Integration

### **Tier 1: Direct Commands** (Preferred User Interface)
```bash
# Core development commands that use these infrastructure scripts
yarn dev                         # Uses dev-runner.cjs for orchestration
yarn build|test|security-scan    # Cross-platform via multiplatform.cjs
yarn merge-safety-full           # Uses merge-protection.cjs for validation
yarn python-quality              # Includes python-cc-gate.cjs validation
yarn install-merge-hooks         # Uses install-merge-hooks.cjs
```

### **Tier 2: Slash Commands** (Workflow Automation)
```bash
# Workflow commands that leverage infrastructure scripts
/health-check                    # System validation using multiplatform.cjs
/merge-safety                    # Pre-merge validation via merge-protection.cjs
/commit-smart                    # Intelligent commits with quality gates
/review-complete                 # Multi-agent code review with validation
/task-dev T-XX                   # Context-aware task development
```

### **Tier 3: Automated Hooks** (Background Integration)
- **Location**: `.claude/hooks.json`
- **Integration**: Uses multiplatform.cjs for cross-platform tool execution
- **Quality Gates**: Includes python-cc-gate.cjs for Python validation
- **Performance**: 40+ tools integrated automatically
- **Trigger**: Auto-runs on Edit/Write/MultiEdit operations

### **Tier 4: Infrastructure Layer** (This Directory)
- **Purpose**: Backend utilities powering higher-tier commands
- **Maintenance**: Minimal - focused on cross-platform compatibility
- **Integration**: Called by yarn commands and hooks system
- **Architecture**: Essential infrastructure that cannot be replaced

## Architecture Integration

### **4-Tier Documentation Positioning**

| Tier | Location | User Interface | Purpose |
|------|----------|----------------|---------|
| **Tier 1** | Direct Commands | `yarn dev`, `yarn build` | User-facing development interface |
| **Tier 2** | Slash Commands | `/health-check`, `/merge-safety` | Workflow automation |
| **Tier 3** | Hooks System | `.claude/hooks.json` | Background quality automation |
| **Tier 4** | **Infrastructure** | **`scripts/` (this directory)** | **Backend utilities and platform support** |

### **Cross-References**

- **[Hooks System](.claude/docs/)** - Quality automation configuration
- **[Direct Commands](../CLAUDE.md)** - User-facing yarn and slash commands
- **[Development Tools](../tools/README.md)** - Bash task management scripts
- **[Architecture Documentation](../docs/architecture/)** - Technical design and ADRs

### **Integration Flow**

```
User Command (yarn dev)
    ↓
Infrastructure Script (dev-runner.cjs)
    ↓
Cross-Platform Detection (multiplatform.cjs)
    ↓
Service Orchestration
    ↓
Quality Validation (hooks + python-cc-gate.cjs)
    ↓
Development Environment Ready
```

## File Structure

```
scripts/
├── README.md                    # This infrastructure documentation
├── multiplatform.cjs           # Cross-platform environment detection
├── merge-protection.cjs         # Merge safety validation system
├── install-merge-hooks.cjs     # Git protection installer
├── dev-runner.cjs              # Development server orchestrator
└── python-cc-gate.cjs          # Python complexity validation
```

## Infrastructure Benefits

### **Cross-Platform Compatibility** 🌐
- **Windows/Linux/WSL**: Seamless environment detection
- **Python Virtual Environments**: Automatic activation and management
- **Tool Availability**: Dynamic detection and fallback handling
- **Path Translation**: Cross-platform path and command handling

### **Merge Safety Protection** 🛡️
- **File Loss Prevention**: Automated file count validation
- **Structure Integrity**: Critical directory existence checks
- **Configuration Validation**: Essential file presence verification
- **Native Git Integration**: Hook-based protection at repository level

### **Quality Enforcement** 🎯
- **Design Guidelines**: Python complexity metrics (CC≤15, LOC≤300)
- **Automated Validation**: Integration with quality pipeline
- **Performance Optimization**: Efficient complexity analysis
- **Standards Compliance**: Consistent code quality across project

## 📄 **License**

This project is licensed under the terms of the MIT license.
