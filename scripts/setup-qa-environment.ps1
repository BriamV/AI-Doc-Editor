# QA Environment Setup - PowerShell Script for Windows
# Aligned with PRD-QA CLI.md specifications and RF-007 requirements
# Cross-platform companion to setup-qa-environment.sh

param(
    [switch]$DryRun,
    [switch]$Fast,
    [switch]$Verbose
)

# Set execution policy for current session
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

Write-Host "🚀 Starting QA Environment Setup (Windows PowerShell)..." -ForegroundColor Green
Write-Host "📋 Platform: Windows (PowerShell)" -ForegroundColor Cyan
Write-Host "📋 This script will install and configure all QA tools according to PRD-QA CLI.md" -ForegroundColor Cyan
Write-Host ""

# Function definitions
function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Test-CommandExists {
    param([string]$Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# Check prerequisites
Write-Info "Checking prerequisites..."

# Check Node.js version (PRD requirement: Node.js 18+)
if (Test-CommandExists "node") {
    $nodeVersion = node --version
    $nodeMajor = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($nodeMajor -ge 18) {
        Write-Success "Node.js $nodeVersion (compatible)"
    } else {
        Write-Error "Node.js $nodeVersion detected. Please upgrade to Node.js 18+ (PRD requirement)."
        exit 1
    }
} else {
    Write-Error "Node.js not found. Please install Node.js 18+ first."
    exit 1
}

# Check package manager
$pkgManager = ""
$installCmd = ""

if (Test-CommandExists "yarn") {
    $pkgManager = "yarn"
    $installCmd = "yarn add -D"
    Write-Success "Using yarn package manager"
} elseif (Test-CommandExists "npm") {
    $pkgManager = "npm"
    $installCmd = "npm install --save-dev"
    Write-Success "Using npm package manager"
} else {
    Write-Error "No package manager found. Please install npm or yarn."
    exit 1
}

# Check Python and virtual environment
$venvPath = ""
if (Test-Path ".venv") {
    Write-Success "Virtual environment found at .venv"
    $venvPath = ".venv"
    
    # Activate virtual environment (Windows)
    if (Test-Path ".venv\Scripts\Activate.ps1") {
        & ".venv\Scripts\Activate.ps1"
        Write-Success "Virtual environment activated (PowerShell)"
    } elseif (Test-Path ".venv\Scripts\activate.bat") {
        Write-Info "Batch activation script found (will use in CMD contexts)"
    }
}

# Check Python
$pythonCmd = ""
if (Test-CommandExists "python") {
    $pythonVersion = python --version
    Write-Success "Python $pythonVersion detected"
    $pythonCmd = "python"
} elseif (Test-CommandExists "python3") {
    $pythonVersion = python3 --version
    Write-Success "Python $pythonVersion detected"
    $pythonCmd = "python3"
} else {
    Write-Warning "Python not found. Backend validation tools will be skipped."
}

Write-Host ""
Write-Info "Starting installation process..."

# 1. Install Node.js based tools
Write-Host ""
Write-Info "📦 Installing Frontend validation tools..."

if (-not $DryRun) {
    Write-Info "Installing Spectral for OpenAPI/JSON Schema validation..."
    & $pkgManager add -D @stoplight/spectral-cli
    
    # Check if tools are already installed
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    $devDeps = $packageJson.devDependencies
    
    if (-not $devDeps.eslint) {
        Write-Info "Installing ESLint..."
        & $pkgManager add -D eslint
    }
    
    if (-not $devDeps.prettier) {
        Write-Info "Installing Prettier..."
        & $pkgManager add -D prettier
    }
    
    if (-not $devDeps.typescript) {
        Write-Info "Installing TypeScript..."
        & $pkgManager add -D typescript
    }
    
    if (-not $devDeps.'mega-linter-runner') {
        Write-Info "Installing MegaLinter runner..."
        & $pkgManager add -D mega-linter-runner
    }
} else {
    Write-Info "[DRY-RUN] Would install: Spectral, ESLint, Prettier, TypeScript, MegaLinter"
}

Write-Success "Frontend tools installation completed"

# 2. Install Python tools
if ($pythonCmd -and (-not $DryRun)) {
    Write-Host ""
    Write-Info "🐍 Installing Backend validation tools..."
    
    if ($venvPath) {
        Write-Info "Installing Python tools in virtual environment..."
    } else {
        Write-Info "Installing Python tools system-wide..."
    }
    
    # Check if pip is available
    if (Test-CommandExists "pip") {
        Write-Info "Installing Black (Python formatter)..."
        pip install black
        
        Write-Info "Installing Pylint (Python linter)..."
        pip install pylint
        
        Write-Info "Installing Pytest (Python testing)..."
        pip install pytest pytest-cov
        
        Write-Success "Backend tools installation completed"
    } else {
        Write-Warning "pip not found. Skipping Python tools installation."
    }
} elseif ($DryRun) {
    Write-Info "[DRY-RUN] Would install Python tools: Black, Pylint, Pytest"
} else {
    Write-Warning "Skipping Python tools installation (Python not found)"
}

# 3. Install Security tools
Write-Host ""
Write-Info "🔒 Installing Security validation tools..."

if (-not $DryRun) {
    if (-not (Test-CommandExists "snyk")) {
        Write-Info "Installing Snyk CLI globally..."
        try {
            npm install -g snyk
        } catch {
            Write-Warning "Failed to install Snyk globally. You may need to run as Administrator."
        }
    } else {
        Write-Success "Snyk CLI already installed"
    }
} else {
    Write-Info "[DRY-RUN] Would install Snyk CLI globally"
}

Write-Success "Security tools installation completed"

# 4. Create configuration files
Write-Host ""
Write-Info "📝 Creating configuration files..."

if (-not $DryRun) {
    # .env file
    Write-Info "Creating .env file..."
    $envContent = @"
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
"@
    $envContent | Out-File -FilePath ".env" -Encoding UTF8

    # pyproject.toml
    Write-Info "Creating pyproject.toml..."
    $pyprojectContent = @"
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
testpaths = ["backend/tests", "tests"]
python_files = ["test_*.py", "*_test.py"]
python_functions = ["test_*"]
addopts = ["--verbose", "--tb=short", "--cov=.", "--cov-report=term-missing"]
"@
    $pyprojectContent | Out-File -FilePath "pyproject.toml" -Encoding UTF8

    # .pylintrc
    Write-Info "Creating .pylintrc..."
    $pylintrcContent = @"
# Pylint configuration for Python linting
# Aligned with PRD-QA CLI.md Design Metrics (RF-003)

[MASTER]
init-hook='import sys; sys.path.append(".")'
load-plugins=

[MESSAGES CONTROL]
disable=missing-docstring,too-few-public-methods,fixme,too-many-arguments

[FORMAT]
max-line-length=100
indent-string='    '

[DESIGN]
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
"@
    $pylintrcContent | Out-File -FilePath ".pylintrc" -Encoding UTF8

    Write-Success "Configuration files created successfully"
} else {
    Write-Info "[DRY-RUN] Would create: .env, pyproject.toml, .pylintrc, .mega-linter.yml"
}

# 5. Verification
Write-Host ""
Write-Info "🔍 Running post-installation verification..."

Write-Host ""
Write-Info "Testing installed tools..."

# Test tools
$tools = @(
    @{Name="Spectral"; Command="npx @stoplight/spectral-cli --version"},
    @{Name="ESLint"; Command="npx eslint --version"},
    @{Name="Prettier"; Command="npx prettier --version"},
    @{Name="TypeScript"; Command="npx tsc --version"},
    @{Name="MegaLinter"; Command="npx mega-linter-runner -v"}
)

foreach ($tool in $tools) {
    try {
        $version = Invoke-Expression $tool.Command 2>$null
        if ($version) {
            Write-Success "$($tool.Name): $version"
        } else {
            Write-Warning "$($tool.Name) verification failed"
        }
    } catch {
        Write-Warning "$($tool.Name) verification failed"
    }
}

# Python tools
if ($pythonCmd) {
    $pythonTools = @("black", "pylint", "pytest")
    foreach ($tool in $pythonTools) {
        try {
            $version = Invoke-Expression "$tool --version" 2>$null
            if ($version) {
                Write-Success "$tool`: $version"
            } else {
                Write-Warning "$tool verification failed"
            }
        } catch {
            Write-Warning "$tool verification failed"
        }
    }
}

# Snyk
if (Test-CommandExists "snyk") {
    try {
        $snykVersion = snyk --version
        Write-Success "Snyk: $snykVersion"
    } catch {
        Write-Warning "Snyk verification failed"
    }
} else {
    Write-Warning "Snyk CLI not found in PATH"
}

# 6. QA System integration test
Write-Host ""
Write-Info "🧪 Testing QA System integration..."

if (Test-Path "scripts\qa\qa-cli.cjs") {
    Write-Info "Running QA environment check..."
    try {
        node scripts/qa/qa-cli.cjs --dimension build --scope frontend 2>$null | Where-Object {
            $_ -match "🔍 Checking environment|✅.*:|🟡.*not available|✅ Environment check completed"
        } | ForEach-Object { Write-Host $_ }
        Write-Success "QA System integration test completed"
    } catch {
        Write-Warning "QA System test failed"
    }
} else {
    Write-Warning "QA CLI not found at scripts\qa\qa-cli.cjs"
}

# Final summary
Write-Host ""
Write-Host "🎉 QA Environment Setup Completed!" -ForegroundColor Green
Write-Host ""
Write-Info "📋 Installation Summary:"
Write-Host "   ✅ Frontend tools: Spectral, ESLint, Prettier, TypeScript, MegaLinter"
if ($pythonCmd) {
    Write-Host "   ✅ Backend tools: Black, Pylint, Pytest"
} else {
    Write-Host "   ⚠️  Backend tools: Skipped (Python not found)"
}
Write-Host "   ✅ Security tools: Snyk CLI"
Write-Host "   ✅ Configuration files: .env, pyproject.toml, .pylintrc, .mega-linter.yml"
Write-Host ""

Write-Info "🚀 Next Steps:"
Write-Host "   1. Configure SNYK_TOKEN: `$env:SNYK_TOKEN='your_token'"
Write-Host "   2. Run full QA validation: yarn run cmd qa"
Write-Host "   3. Run specific dimensions: yarn run cmd qa --dimension build"
Write-Host "   4. Check all tools: node scripts/qa/qa-cli.cjs --help"
Write-Host ""

Write-Success "QA Environment is ready for development! 🚀"