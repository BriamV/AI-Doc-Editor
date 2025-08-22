# Progress Dashboard Generator - PowerShell Version
# Usage: .\tools\progress-dashboard.ps1 [release] [-Brief] [-Release]
# Windows-compatible wrapper for tools/progress-dashboard.sh

param(
    [string]$ReleaseFilter = "",
    [switch]$Brief = $false,
    [switch]$Release = $false
)

# Script configuration
$bashScript = "tools/progress-dashboard.sh"

# Validation
if (-not (Test-Path $bashScript)) {
    Write-Host "Error: Bash script not found: $bashScript" -ForegroundColor Red
    Write-Host "Info: This PowerShell script requires the bash version to be present." -ForegroundColor Yellow
    exit 1
}

# Build arguments array
$scriptArgs = @()

# Handle release flag for auto-detection
if ($Release) {
    try {
        $currentBranch = & git branch --show-current 2>$null
        if ($currentBranch -match "R(\d+)") {
            $scriptArgs += "R$($matches[1])"
        }
    }
    catch {
        Write-Warning "Could not auto-detect release from git branch"
    }
} elseif ($ReleaseFilter -ne "") {
    $scriptArgs += $ReleaseFilter
}

# Main execution
if ($Brief) {
    Write-Host "AI-Doc-Editor Progress (Brief)" -ForegroundColor Cyan
    Write-Host "==============================" -ForegroundColor Cyan
    
    try {
        $result = & bash $bashScript @scriptArgs 2>$null
        $foundProgress = $false
        
        foreach ($line in $result) {
            $trimmed = $line.Trim()
            if ($trimmed -like "**?*tasks completed*") {
                $cleaned = $trimmed -replace '\*', ''
                Write-Host "Overall: $cleaned" -ForegroundColor Magenta
                $foundProgress = $true
            }
            elseif ($trimmed -like "## * Release*") {
                $release = $trimmed -replace '## .* Release ', ''
                Write-Host "Release: $release" -ForegroundColor Green
            }
        }
        
        if (-not $foundProgress) {
            Write-Host "No progress data available" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "Error executing bash script" -ForegroundColor Red
        Write-Host "Try running: bash $bashScript" -ForegroundColor Yellow
    }
} else {
    # Full mode - pass through to bash script
    & bash $bashScript @scriptArgs
    
    Write-Host ""
    Write-Host "PowerShell Usage:" -ForegroundColor Blue
    Write-Host "  .\tools\progress-dashboard.ps1 -Brief" -ForegroundColor Gray
    Write-Host "  .\tools\progress-dashboard.ps1 -Release" -ForegroundColor Gray
    Write-Host "  .\tools\progress-dashboard.ps1 R0" -ForegroundColor Gray
}