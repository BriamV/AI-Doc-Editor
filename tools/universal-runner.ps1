# Universal Runner for Tools Scripts
# Cross-platform wrapper for executing .sh scripts equivalents in PowerShell
# Usage: powershell tools/universal-runner.ps1 <script-name> [args...]

param(
    [Parameter(Mandatory=$true)]
    [string]$ScriptName,
    
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$Arguments
)

# Get the directory of this script
$ToolsDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Remove .sh extension if provided
$ScriptName = $ScriptName -replace '\.sh$', ''

# Map of supported scripts to their PowerShell equivalents
$ScriptMap = @{
    'task-navigator' = 'task-navigator.ps1'
    'progress-dashboard' = 'progress-dashboard.ps1' 
    'qa-workflow' = 'qa-workflow.ps1'
    'workflow-context' = 'workflow-context.ps1'
    'extract-subtasks' = 'extract-subtasks.ps1'
    'status-updater' = 'status-updater.ps1'
    'validate-dod' = 'validate-dod.ps1'
    'mark-subtask-complete' = 'mark-subtask-complete.ps1'
}

# Check if script is supported
if (-not $ScriptMap.ContainsKey($ScriptName)) {
    Write-Host "ERROR: Script '$ScriptName' not found in universal runner"
    Write-Host "Available scripts: $($ScriptMap.Keys -join ', ')"
    exit 1
}

$PowerShellScript = $ScriptMap[$ScriptName]
$ScriptPath = Join-Path $ToolsDir $PowerShellScript

# Check if PowerShell script exists
if (-not (Test-Path $ScriptPath)) {
    Write-Host "ERROR: PowerShell script not found: $ScriptPath"
    Write-Host "INFO: Falling back to bash script if available..."
    
    # Fallback to bash script
    $BashScript = Join-Path $ToolsDir "$ScriptName.sh"
    if (Test-Path $BashScript) {
        Write-Host "INFO: Using bash fallback: $BashScript"
        & bash $BashScript @Arguments
        exit $LASTEXITCODE
    } else {
        Write-Host "ERROR: Neither PowerShell nor bash script found for: $ScriptName"
        exit 1
    }
}

# Execute the PowerShell script with arguments
try {
    & $ScriptPath @Arguments
    exit $LASTEXITCODE
} catch {
    Write-Host "ERROR: Error executing $ScriptPath"
    Write-Host $_.Exception.Message
    exit 1
}