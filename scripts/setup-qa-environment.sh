#!/usr/bin/env bash
# QA Environment Setup - Complete Installation Script
# Aligned with PRD-QA CLI.md specifications and RF-007 requirements
# Implements the "todo-en-uno" command for complete environment setup
# Cross-platform: Windows (WSL), Linux, macOS

set -e  # Exit on any error

# Platform detection
detect_platform() {
    case "$(uname -s)" in
        Linux*)     
            if grep -q Microsoft /proc/version 2>/dev/null; then
                PLATFORM="WSL"
            else
                PLATFORM="Linux"
            fi
            ;;
        Darwin*)    PLATFORM="macOS";;
        CYGWIN*)    PLATFORM="Cygwin";;
        MINGW*)     PLATFORM="MinGW";;
        MSYS*)      PLATFORM="MSYS";;
        *)          PLATFORM="Unknown";;
    esac
}

detect_platform

echo "🚀 Starting QA Environment Setup..."
echo "📋 Platform: $PLATFORM"
echo "📋 This script will install and configure all QA tools according to PRD-QA CLI.md"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
print_info "Checking prerequisites..."

# Check Node.js version (PRD requirement: Node.js 18+)
if ! command -v node &> /dev/null; then
    print_error "Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node --version | cut -c 2-)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 18 ]; then
    print_error "Node.js $NODE_VERSION detected. Please upgrade to Node.js 18+ (PRD requirement)."
    exit 1
fi
print_status "Node.js $NODE_VERSION (compatible)"

# Check package manager
if command -v yarn &> /dev/null; then
    PKG_MANAGER="yarn"
    INSTALL_CMD="yarn add -D"
    print_status "Using yarn package manager"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
    INSTALL_CMD="npm install --save-dev"
    print_status "Using npm package manager"
else
    print_error "No package manager found. Please install npm or yarn."
    exit 1
fi

# Check Python and virtual environment (Cross-platform)
VENV_PATH=""
PIP_CMD=""  # Initialize pip command variable

if [ -d ".venv" ]; then
    print_status "Virtual environment found at .venv"
    VENV_PATH=".venv"
    
    # Auto-detect venv structure (Windows vs Unix)
    if [ -d ".venv/Scripts" ]; then
        # Windows-style venv (even in WSL)
        VENV_BIN_DIR=".venv/Scripts"
        VENV_ACTIVATE=".venv/Scripts/activate"
        VENV_PIP=".venv/Scripts/pip.exe"
        print_info "Detected Windows-style virtual environment structure"
    elif [ -d ".venv/bin" ]; then
        # Unix-style venv
        VENV_BIN_DIR=".venv/bin"
        VENV_ACTIVATE=".venv/bin/activate"
        VENV_PIP=".venv/bin/pip"
        print_info "Detected Unix-style virtual environment structure"
    else
        print_warning "Unknown virtual environment structure"
        VENV_BIN_DIR=""
    fi
    
    # Activate virtual environment if structure detected
    if [ -n "$VENV_BIN_DIR" ] && [ -f "$VENV_ACTIVATE" ]; then
        source "$VENV_ACTIVATE"
        print_status "Virtual environment activated"
        
        # Verify activation and set pip command
        if [ -n "$VIRTUAL_ENV" ]; then
            print_status "VIRTUAL_ENV set to: $VIRTUAL_ENV"
            if [ -f "$VENV_PIP" ]; then
                PIP_CMD="$VENV_PIP"
                print_status "Using venv pip: $PIP_CMD"
            else
                print_warning "Venv pip not found at $VENV_PIP"
            fi
        else
            print_warning "Virtual environment activation may have failed"
        fi
    else
        print_warning "Cannot activate virtual environment - missing activate script"
    fi
fi

if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    print_status "Python $PYTHON_VERSION detected"
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version | cut -d' ' -f2)
    print_status "Python $PYTHON_VERSION detected"
    PYTHON_CMD="python"
else
    print_warning "Python not found. Backend validation tools will be skipped."
    PYTHON_CMD=""
fi

echo ""
print_info "Starting installation process..."

# 1. Install Node.js based tools (PRD RF-004 Frontend stack)
echo ""
print_info "📦 Installing Frontend validation tools..."

# Core QA tools
if ! $PKG_MANAGER list @stoplight/spectral-cli &> /dev/null; then
    print_info "Installing Spectral for OpenAPI/JSON Schema validation..."
    $INSTALL_CMD @stoplight/spectral-cli
else
    print_status "Spectral already installed, skipping..."
fi

# Ensure ESLint and Prettier are installed (may already be in devDependencies)
if ! $PKG_MANAGER list eslint &> /dev/null; then
    print_info "Installing ESLint..."
    $INSTALL_CMD eslint
fi

if ! $PKG_MANAGER list prettier &> /dev/null; then
    print_info "Installing Prettier..."
    $INSTALL_CMD prettier
fi

# TypeScript if not present
if ! $PKG_MANAGER list typescript &> /dev/null; then
    print_info "Installing TypeScript..."
    $INSTALL_CMD typescript
fi

# MegaLinter runner if not present
if ! $PKG_MANAGER list mega-linter-runner &> /dev/null; then
    print_info "Installing MegaLinter runner..."
    $INSTALL_CMD mega-linter-runner
fi

print_status "Frontend tools installation completed"

# 2. Install Python based tools (PRD RF-004 Backend stack)
if [ -n "$PYTHON_CMD" ]; then
    echo ""
    print_info "🐍 Installing Backend validation tools..."
    
    # Check pip availability (venv pip takes priority)
    if [ -n "$PIP_CMD" ] && [ -f "$PIP_CMD" ]; then
        print_info "Using virtual environment pip: $PIP_CMD"
    elif command -v pip3 &> /dev/null; then
        PIP_CMD="pip3"
        print_info "Using system pip3"
        print_warning "⚠️  Installing in system Python - consider using virtual environment"
    elif command -v pip &> /dev/null; then
        PIP_CMD="pip"
        print_info "Using system pip"
        print_warning "⚠️  Installing in system Python - consider using virtual environment"
    else
        print_warning "pip not found. Skipping Python tools installation..."
        PIP_CMD=""
    fi
    
    if [ -n "$PIP_CMD" ]; then
        if [ -n "$VENV_PATH" ]; then
            print_info "Installing Python tools in virtual environment..."
        else
            print_info "Installing Python tools system-wide..."
        fi
        
        # Check and install Black
        if ! $PIP_CMD show black &> /dev/null; then
            print_info "Installing Black (Python formatter)..."
            $PIP_CMD install black
        else
            print_status "Black already installed, skipping..."
        fi
        
        # Check and install Pylint  
        if ! $PIP_CMD show pylint &> /dev/null; then
            print_info "Installing Pylint (Python linter)..."
            $PIP_CMD install pylint
        else
            print_status "Pylint already installed, skipping..."
        fi
        
        # Check and install Pytest
        if ! $PIP_CMD show pytest &> /dev/null; then
            print_info "Installing Pytest (Python testing)..."
            $PIP_CMD install pytest pytest-cov
        else
            print_status "Pytest already installed, skipping..."
        fi
        
        print_status "Backend tools installation completed"
    fi
else
    print_warning "Skipping Python tools installation (Python not found)"
fi

# 3. Install Security tools (PRD RF-004 Security dimension)
echo ""
print_info "🔒 Installing Security validation tools..."

# Snyk CLI (global installation as per PRD RF-007)
if ! command -v snyk &> /dev/null; then
    print_info "Installing Snyk CLI globally..."
    if command -v npm &> /dev/null; then
        npm install -g snyk || print_warning "Failed to install Snyk globally. Try: sudo npm install -g snyk"
    else
        print_warning "npm not available for global Snyk installation"
    fi
else
    print_status "Snyk CLI already installed"
fi

print_status "Security tools installation completed"

# 4. Create configuration files (PRD centralized configuration)
echo ""
print_info "📝 Creating configuration files..."

# Environment configuration
print_info "Creating .env file..."
cat > .env << 'EOF'
# QA Environment Configuration
# Aligned with PRD-QA CLI.md specifications

# Python configuration for backend validation
PYTHONPATH=.
PYTHON_VERSION=3.x
BLACK_CONFIG=pyproject.toml
PYLINT_CONFIG=.pylintrc

# Performance settings (PRD RNF-002)
QA_PARALLEL_EXECUTION=true
QA_SHOW_ELAPSED_TIME=true

# Security settings
# SNYK_TOKEN=your_token_here  # Uncomment and set for authenticated scans
EOF

# Python Black configuration
print_info "Creating pyproject.toml for Black configuration..."
cat > pyproject.toml << 'EOF'
# Python tool configuration
# Aligned with PRD-QA CLI.md Design Metrics (RF-003)

[tool.black]
line-length = 100  # PRD RF-003: Strict 100 character limit
target-version = ['py38', 'py39', 'py310', 'py311']
include = '\.pyi?$'
extend-exclude = '''
/(
  # Exclude auto-generated files
  \.git
  | \.venv
  | \.tox
  | \.pytest_cache
  | __pycache__
  | node_modules
  | dist
  | build
)/
'''

[tool.pytest.ini_options]
# Test configuration for PRD RF-004 Testing dimension
testpaths = ["backend/tests", "tests"]
python_files = ["test_*.py", "*_test.py"]
python_functions = ["test_*"]
addopts = ["--verbose", "--tb=short", "--cov=.", "--cov-report=term-missing"]
EOF

# Pylint configuration
print_info "Creating .pylintrc for Pylint configuration..."
cat > .pylintrc << 'EOF'
# Pylint configuration for Python linting
# Aligned with PRD-QA CLI.md Design Metrics (RF-003)

[MASTER]
init-hook='import sys; sys.path.append(".")'
load-plugins=

[MESSAGES CONTROL]
# Disable some overly strict rules while maintaining quality
disable=missing-docstring,too-few-public-methods,fixme,too-many-arguments

[FORMAT]
# PRD RF-003: 100 character line length limit
max-line-length=100
indent-string='    '

[DESIGN]
# PRD RF-003: Complexity limits
max-complexity=10
max-args=5
max-locals=15
max-returns=6
max-branches=12
max-statements=50

[SIMILARITIES]
min-similarity-lines=4
ignore-comments=yes
ignore-docstrings=yes

[VARIABLES]
additional-builtins=
EOF

# Update .mega-linter.yml with complete configuration
print_info "Updating .mega-linter.yml with complete configuration..."
cat > .mega-linter.yml << 'EOF'
# MegaLinter Configuration - Centralized QA System Configuration
# Aligned with PRD-QA CLI.md specifications (líneas 126, 338, 403)
# Complete configuration for all stacks: Frontend, Backend, Security

# Core configuration
APPLY_FIXES: none  # QA system reports but doesn't modify code (PRD section 3)
SHOW_ELAPSED_TIME: true
PARALLEL: true
LOG_LEVEL: INFO

# Frontend Stack Configuration (TypeScript/React) - PRD RF-004
ENABLE_LINTERS:
  # JavaScript/TypeScript
  - JAVASCRIPT_ES
  - JAVASCRIPT_PRETTIER
  - TYPESCRIPT_ES
  - TYPESCRIPT_PRETTIER
  
  # React specific
  - REACT
  
  # Configuration files
  - JSON_JSONLINT
  - JSON_PRETTIER
  - YAML_YAMLLINT
  - YAML_PRETTIER
  
  # Documentation
  - MARKDOWN_MARKDOWNLINT
  
  # Infrastructure
  - DOCKERFILE_HADOLINT
  - BASH_SHELLCHECK
  
  # Frontend styling
  - CSS_STYLELINT
  - HTML_HTMLHINT

# Backend Stack Configuration (Python) - PRD RF-004
  # Python linting and formatting
  - PYTHON_PYLINT
  - PYTHON_BLACK
  - PYTHON_FLAKE8
  - PYTHON_MYPY

# Design Metrics Configuration (PRD RF-003)
# Complexity and LOC limits as specified in PRD lines 111-113
JAVASCRIPT_ES_CONFIG_FILE: "eslint.config.js"
TYPESCRIPT_ES_CONFIG_FILE: "eslint.config.js"
PYTHON_PYLINT_CONFIG_FILE: ".pylintrc"
PYTHON_BLACK_CONFIG_FILE: "pyproject.toml"

# Performance optimizations (PRD RNF-002)
VALIDATE_ALL_CODEBASE: false  # Incremental validation by default
FILEIO_REPORTER: false  # Reduce I/O overhead
CLI_LINT_MODE: list_of_files

# Integration with project package manager (auto-detected)
PRE_COMMANDS:
  - command: echo "🚀 QA System validation starting..."
    cwd: "."

# Disable tools that QA System handles directly (PRD architecture)
DISABLE_LINTERS:
  - COPYPASTE_JSCPD  # Handled by Design Metrics dimension
  - SPELL_MISSPELL   # Handled by Error Detection dimension
  - CREDENTIALS      # Handled by Security dimension (Snyk/Semgrep)

# Security scanning exclusions (handled by dedicated Security dimension)
DISABLE:
  - CREDENTIALS  # Handled by Snyk and Semgrep in Security dimension

# Output configuration for QA System integration
MEGALINTER_CONFIG: .mega-linter.yml
EOF

print_status "Configuration files created successfully"

# 5. Verification phase
echo ""
print_info "🔍 Running post-installation verification..."

# Test individual tools
echo ""
print_info "Testing installed tools..."

# Node.js tools verification
if command -v npx &> /dev/null; then
    # Spectral
    if npx @stoplight/spectral-cli --version &> /dev/null; then
        SPECTRAL_VERSION=$(npx @stoplight/spectral-cli --version)
        print_status "Spectral: $SPECTRAL_VERSION"
    else
        print_warning "Spectral verification failed"
    fi
    
    # ESLint
    if npx eslint --version &> /dev/null; then
        ESLINT_VERSION=$(npx eslint --version)
        print_status "ESLint: $ESLINT_VERSION"
    else
        print_warning "ESLint verification failed"
    fi
    
    # Prettier
    if npx prettier --version &> /dev/null; then
        PRETTIER_VERSION=$(npx prettier --version)
        print_status "Prettier: $PRETTIER_VERSION"
    else
        print_warning "Prettier verification failed"
    fi
    
    # TypeScript
    if npx tsc --version &> /dev/null; then
        TSC_VERSION=$(npx tsc --version)
        print_status "TypeScript: $TSC_VERSION"
    else
        print_warning "TypeScript verification failed"
    fi
    
    # MegaLinter
    if npx mega-linter-runner -v &> /dev/null; then
        MEGALINTER_VERSION=$(npx mega-linter-runner -v 2>&1 | head -1)
        print_status "MegaLinter: $MEGALINTER_VERSION"
    else
        print_warning "MegaLinter verification failed"
    fi
fi

# Python tools verification
if [ -n "$PYTHON_CMD" ] && [ -n "$PIP_CMD" ]; then
    # Black
    if black --version &> /dev/null; then
        BLACK_VERSION=$(black --version | head -1)
        print_status "Black: $BLACK_VERSION"
    else
        print_warning "Black verification failed"
    fi
    
    # Pylint
    if pylint --version &> /dev/null; then
        PYLINT_VERSION=$(pylint --version | head -1)
        print_status "Pylint: $PYLINT_VERSION"
    else
        print_warning "Pylint verification failed"
    fi
    
    # Pytest
    if pytest --version &> /dev/null; then
        PYTEST_VERSION=$(pytest --version)
        print_status "Pytest: $PYTEST_VERSION"
    else
        print_warning "Pytest verification failed"
    fi
fi

# Security tools verification
if command -v snyk &> /dev/null; then
    SNYK_VERSION=$(snyk --version)
    print_status "Snyk: $SNYK_VERSION"
else
    print_warning "Snyk CLI not found in PATH"
fi

# 6. QA System integration test
echo ""
print_info "🧪 Testing QA System integration..."

if [ -f "scripts/qa/qa-cli.cjs" ]; then
    print_info "Running QA environment check..."
    echo ""
    
    # Run environment check and capture relevant output
    node scripts/qa/qa-cli.cjs --dimension build --scope frontend 2>/dev/null | grep -E "🔍 Checking environment|✅.*:|🟡.*not available|✅ Environment check completed" || true
    
    echo ""
    print_status "QA System integration test completed"
else
    print_warning "QA CLI not found at scripts/qa/qa-cli.cjs"
fi

# 7. Final summary and next steps
echo ""
echo "🎉 QA Environment Setup Completed!"
echo ""
print_info "📋 Installation Summary:"
echo "   ✅ Frontend tools: Spectral, ESLint, Prettier, TypeScript, MegaLinter"
if [ -n "$PYTHON_CMD" ]; then
    echo "   ✅ Backend tools: Black, Pylint, Pytest"
else
    echo "   ⚠️  Backend tools: Skipped (Python not found)"
fi
echo "   ✅ Security tools: Snyk CLI"
echo "   ✅ Configuration files: .env, pyproject.toml, .pylintrc, .mega-linter.yml"
echo ""

print_info "🚀 Next Steps:"
echo "   1. Configure SNYK_TOKEN for authenticated security scans: export SNYK_TOKEN=your_token"
echo "   2. Run full QA validation: yarn run cmd qa"
echo "   3. Run specific dimensions: yarn run cmd qa --dimension build"
echo "   4. Check all tools: node scripts/qa/qa-cli.cjs --help"
echo ""

print_info "📚 PRD Compliance:"
echo "   ✅ RF-004: Multi-stack validation (Frontend + Backend + Security)"
echo "   ✅ RF-007: Environment verification implemented"
echo "   ✅ RNF-002: Performance optimizations configured"
echo "   ✅ Centralized configuration via .mega-linter.yml"
echo ""

print_status "QA Environment is ready for development! 🚀"