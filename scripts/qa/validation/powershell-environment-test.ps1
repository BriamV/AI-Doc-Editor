# PowerShell Environment Test Script
Write-Host "=== POWERSHELL ENVIRONMENT TEST ===" -ForegroundColor Green
Write-Host "Working Directory: $(Get-Location)"
Write-Host "PowerShell Version: $($PSVersionTable.PSVersion)"
Write-Host "OS: $($env:OS)"
Write-Host ""

Write-Host "=== PYTHON TOOLS PHYSICAL CHECK ===" -ForegroundColor Yellow
if (Test-Path ".venv\Scripts\black.exe") {
    Write-Host "black.exe: EXISTS" -ForegroundColor Green
} else {
    Write-Host "black.exe: NOT FOUND" -ForegroundColor Red
}

if (Test-Path ".venv\Scripts\pylint.exe") {
    Write-Host "pylint.exe: EXISTS" -ForegroundColor Green
} else {
    Write-Host "pylint.exe: NOT FOUND" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== COMMAND EXECUTION TEST ===" -ForegroundColor Yellow
Write-Host "Testing black --version:"
try {
    $blackOutput = & black --version 2>&1
    Write-Host "  SUCCESS: $blackOutput" -ForegroundColor Green
} catch {
    Write-Host "  FAILED: black command not in PATH" -ForegroundColor Red
}

Write-Host "Testing .venv\Scripts\black.exe --version:"
try {
    $blackDirectOutput = & ".venv\Scripts\black.exe" --version 2>&1
    Write-Host "  SUCCESS: $blackDirectOutput" -ForegroundColor Green
} catch {
    Write-Host "  FAILED: Direct black.exe failed" -ForegroundColor Red
}

Write-Host "Testing pylint --version:"
try {
    $pylintOutput = & pylint --version 2>&1
    Write-Host "  SUCCESS: $pylintOutput" -ForegroundColor Green
} catch {
    Write-Host "  FAILED: pylint command not in PATH" -ForegroundColor Red
}

Write-Host "Testing .venv\Scripts\pylint.exe --version:"
try {
    $pylintDirectOutput = & ".venv\Scripts\pylint.exe" --version 2>&1
    Write-Host "  SUCCESS: $pylintDirectOutput" -ForegroundColor Green
} catch {
    Write-Host "  FAILED: Direct pylint.exe failed" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== NODE.JS TOOLCHECKER SIMULATION ===" -ForegroundColor Yellow
& node scripts\qa\validation\diagnosis-toolchecker.cjs
Write-Host ""

Write-Host "=== QA CLI EXECUTION ===" -ForegroundColor Yellow
Write-Host "Running: yarn run cmd qa --fast"
& yarn run cmd qa --fast