# PowerShell Manual Validation Script
Write-Host "===========================================" -ForegroundColor Green
Write-Host "  MANUAL POWERSHELL ENVIRONMENT VALIDATION" -ForegroundColor Green  
Write-Host "===========================================" -ForegroundColor Green
Write-Host "Date: $(Get-Date)"
Write-Host "Working Directory: $(Get-Location)"
Write-Host "PowerShell Version: $($PSVersionTable.PSVersion)"
Write-Host ""

Write-Host "=== STEP 1: PHYSICAL FILE VERIFICATION ===" -ForegroundColor Yellow
Write-Host "Checking Python tools in .venv\Scripts\:"
if (Test-Path ".venv\Scripts\black.exe") {
    Write-Host "  ✅ black.exe found" -ForegroundColor Green
} else {
    Write-Host "  ❌ black.exe NOT FOUND" -ForegroundColor Red
}

if (Test-Path ".venv\Scripts\pylint.exe") {
    Write-Host "  ✅ pylint.exe found" -ForegroundColor Green
} else {
    Write-Host "  ❌ pylint.exe NOT FOUND" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== STEP 2: DIRECT COMMAND TESTS ===" -ForegroundColor Yellow
Write-Host "Testing direct Python tool execution:"

Write-Host "Testing: .venv\Scripts\black.exe --version"
try {
    $blackOutput = & ".venv\Scripts\black.exe" --version 2>&1
    Write-Host "  ✅ black.exe direct execution: SUCCESS" -ForegroundColor Green
    Write-Host "  Output: $blackOutput" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ black.exe direct execution: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "Testing: .venv\Scripts\pylint.exe --version"
try {
    $pylintOutput = & ".venv\Scripts\pylint.exe" --version 2>&1
    Write-Host "  ✅ pylint.exe direct execution: SUCCESS" -ForegroundColor Green
    Write-Host "  Output: $pylintOutput" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ pylint.exe direct execution: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== STEP 3: NPM TOOLS TEST ===" -ForegroundColor Yellow
Write-Host "Testing NPM tools via yarn:"

Write-Host "Testing: yarn prettier --version"
try {
    $prettierOutput = & yarn prettier --version 2>&1
    Write-Host "  ✅ yarn prettier: SUCCESS" -ForegroundColor Green
    Write-Host "  Output: $prettierOutput" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ yarn prettier: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "Testing: yarn eslint --version"
try {
    $eslintOutput = & yarn eslint --version 2>&1
    Write-Host "  ✅ yarn eslint: SUCCESS" -ForegroundColor Green
    Write-Host "  Output: $eslintOutput" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ yarn eslint: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== STEP 4: MEGALINTER COMMAND TEST ===" -ForegroundColor Yellow
Write-Host "Testing MegaLinter command variations:"

Write-Host "Testing: npx mega-linter-runner --version"
try {
    $npxDirectOutput = & npx mega-linter-runner --version 2>&1
    Write-Host "  ✅ npx direct: SUCCESS" -ForegroundColor Green
    Write-Host "  Output: $npxDirectOutput" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ npx direct: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "Testing: cmd /c npx mega-linter-runner --version"
try {
    $cmdNpxOutput = & cmd /c "npx mega-linter-runner --version" 2>&1
    Write-Host "  ✅ cmd /c npx: SUCCESS" -ForegroundColor Green
    Write-Host "  Output: $cmdNpxOutput" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ cmd /c npx: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== STEP 5: QA CLI EXECUTION ===" -ForegroundColor Yellow
Write-Host "Running full QA CLI test (this may take 1-2 minutes):"
Write-Host "Command: yarn run cmd qa --fast"
Write-Host ""

try {
    & yarn run cmd qa --fast
    Write-Host ""
    Write-Host "QA CLI execution completed." -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "QA CLI execution failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== VALIDATION COMPLETE ===" -ForegroundColor Green
Write-Host "Check the output above for:"
Write-Host "1. Python tools detection (should show black/pylint as available)"
Write-Host "2. NPM tools detection (should show prettier/eslint as available)"
Write-Host "3. MegaLinter execution result"
Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")