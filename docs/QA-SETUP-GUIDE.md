# QA Environment Setup Guide

Complete setup guide for the QA system aligned with PRD-QA CLI.md specifications.

## 🚀 Quick Start

### Option 1: Bash Script (Linux/macOS/WSL)
```bash
# Make executable and run
chmod +x scripts/setup-qa-environment.sh
./scripts/setup-qa-environment.sh
```

### Option 2: PowerShell Script (Windows)
```powershell
# Run PowerShell as Administrator (recommended)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\scripts\setup-qa-environment.ps1
```

### Option 3: Manual Step-by-Step
See [Manual Installation](#manual-installation) section below.

## 📋 What Gets Installed

### Frontend Tools (Node.js ecosystem)
- **Spectral** - OpenAPI/JSON Schema validation
- **ESLint** - JavaScript/TypeScript linting  
- **Prettier** - Code formatting
- **TypeScript** - Type checking
- **MegaLinter** - Multi-language linting orchestrator

### Backend Tools (Python ecosystem)
- **Black** - Python code formatter
- **Pylint** - Python linting
- **Pytest** - Python testing framework

### Security Tools
- **Snyk CLI** - Vulnerability scanning

### Configuration Files
- `.mega-linter.yml` - Centralized QA configuration (PRD compliant)
- `.env` - Environment variables
- `pyproject.toml` - Python tool configuration
- `.pylintrc` - Pylint specific settings

## 🔧 Prerequisites

### Required
- **Node.js 18+** (PRD requirement)
- **npm** or **yarn** package manager
- **Git** (for repository operations)

### Optional but Recommended
- **Python 3.8+** (for backend validation)
- **pip** (Python package manager)
- **Virtual environment** (.venv) - Auto-detected and used

### Platform Support
- ✅ **Linux** (Ubuntu 20.04+)
- ✅ **macOS** (12+)
- ✅ **Windows 11** with WSL2 (Tier 1 support per PRD)
- ✅ **Windows 11** native PowerShell (Tier 2 support per PRD)

## 📊 Expected Results

After successful installation, environment check should show:

```bash
node scripts/qa/qa-cli.cjs --dimension build --scope frontend
```

**Expected Output:**
```
🔍 Checking environment and dependencies...
✅ git: 2.43.0
✅ node: 20.19.3
✅ yarn: 1.22.22
🟡 docker not available (OK - optional)
✅ megalinter: 8.8.0
✅ snyk: 1.1297.3
✅ prettier: 3.6.2
✅ eslint: 9.30.1
✅ black: x.x.x        ← NEW
✅ pylint: x.x.x       ← NEW
✅ tsc: 4.9.5
✅ pip: installed
✅ spectral: x.x.x     ← NEW
📦 Virtual environment detected: .venv - Python tools will use isolated environment
✅ Environment check completed
```

## 🐍 Virtual Environment Integration

The QA system automatically detects and uses your existing `.venv`:

### Auto-Detection Features
- ✅ **Detects existing .venv** in project root
- ✅ **Auto-activates for Python tools** (Black, Pylint, Pytest)
- ✅ **Cross-platform compatibility** (Windows/Linux/macOS)
- ✅ **Fallback to system Python** if no venv found

### Manual Virtual Environment Setup (if needed)
```bash
# Create virtual environment
python -m venv .venv

# Activate it
# Linux/macOS:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate

# Install Python tools
pip install black pylint pytest pytest-cov
```

## 🔧 Manual Installation

If automated scripts fail, follow these manual steps:

### 1. Install Node.js Tools
```bash
# Using yarn (preferred)
yarn add -D @stoplight/spectral-cli
yarn add -D eslint prettier typescript
yarn add -D mega-linter-runner

# Using npm
npm install --save-dev @stoplight/spectral-cli
npm install --save-dev eslint prettier typescript
npm install --save-dev mega-linter-runner
```

### 2. Install Python Tools
```bash
# Activate virtual environment if available
source .venv/bin/activate  # Linux/macOS
# or
.venv\Scripts\activate     # Windows

# Install tools
pip install black pylint pytest pytest-cov
```

### 3. Install Security Tools
```bash
# Install Snyk globally
npm install -g snyk

# Or using yarn
yarn global add snyk
```

### 4. Create Configuration Files

**`.mega-linter.yml`:**
```yaml
# MegaLinter centralized configuration
APPLY_FIXES: none
SHOW_ELAPSED_TIME: true
PARALLEL: true
ENABLE_LINTERS:
  - JAVASCRIPT_ES
  - TYPESCRIPT_ES
  - PYTHON_PYLINT
  - PYTHON_BLACK
```

**`.env`:**
```bash
PYTHONPATH=.
QA_PARALLEL_EXECUTION=true
QA_SHOW_ELAPSED_TIME=true
```

**`pyproject.toml`:**
```toml
[tool.black]
line-length = 100
target-version = ['py38', 'py39', 'py310', 'py311']
```

## 🚨 Troubleshooting

### Common Issues

#### "command not found" errors
```bash
# Refresh shell environment
source ~/.bashrc
# or
source ~/.zshrc

# Verify PATH
echo $PATH
```

#### Permission errors (Linux/macOS)
```bash
# Make script executable
chmod +x scripts/setup-qa-environment.sh

# If global npm install fails
sudo npm install -g snyk
```

#### PowerShell execution policy (Windows)
```powershell
# Allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or bypass for single execution
PowerShell -ExecutionPolicy Bypass -File scripts\setup-qa-environment.ps1
```

#### Virtual environment not detected
```bash
# Verify .venv exists and has proper structure
ls -la .venv/
ls -la .venv/bin/     # Linux/macOS
ls -la .venv/Scripts/ # Windows

# Recreate if needed
rm -rf .venv
python -m venv .venv
```

### Verification Commands

```bash
# Test individual tools
npx @stoplight/spectral-cli --version
npx eslint --version
npx prettier --version
npx tsc --version
npx mega-linter-runner -v
black --version
pylint --version
pytest --version
snyk --version

# Test QA system integration
node scripts/qa/qa-cli.cjs --help
node scripts/qa/qa-cli.cjs --dimension build --scope frontend
```

## 🔗 Next Steps

1. **Configure Snyk token** for authenticated security scans:
   ```bash
   export SNYK_TOKEN=your_token_here
   ```

2. **Run full QA validation**:
   ```bash
   yarn run cmd qa
   ```

3. **Test specific dimensions**:
   ```bash
   yarn run cmd qa --dimension build
   yarn run cmd qa --dimension security
   ```

4. **Set up CI/CD integration** - GitHub Actions workflow already configured in `.github/workflows/mega-linter.yml`

## 📚 Documentation References

- [PRD-QA CLI.md](PRD-QA%20CLI.md) - Complete system specifications
- [CLAUDE.md](../CLAUDE.md) - Development workflow and commands
- [MegaLinter Documentation](https://megalinter.io/latest/) - Linter configuration
- [Snyk CLI Documentation](https://docs.snyk.io/snyk-cli) - Security scanning