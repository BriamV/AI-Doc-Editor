# Task Navigator for Sub Tareas v2.md (PowerShell version)
# Usage: ./tools/task-navigator.ps1 [TASK_ID]

param([string]$TaskId)

$FILE = "docs/project-management/archive/task-breakdown-detailed-v1.md"

if (-not (Test-Path $FILE)) {
    Write-Host "File not found: $FILE"
    exit 1
}

if ([string]::IsNullOrEmpty($TaskId)) {
    Write-Host "Available Tasks:"
    Write-Host "=================="
    
    $content = Get-Content $FILE -Encoding UTF8
    for ($i = 0; $i -lt $content.Length; $i++) {
        $line = $content[$i]
        $lineNum = $i + 1
        
        if ($line -match "^### \*\*Tarea") {
            if ($line -match "T-\d+") {
                $taskIdFound = $matches[0]
            } else {
                continue
            }
            
            $taskTitle = $line -replace "^### \*\*Tarea [^:]*: ", "" -replace "\*\*$", ""
            
            $status = ""
            for ($j = $i; $j -lt $content.Length; $j++) {
                if ($j -gt $i -and $content[$j] -match "^### \*\*Tarea") {
                    break
                }
                if ($content[$j] -match "- \*\*Estado:\*\* (.+)") {
                    $status = $matches[1]
                    break
                }
            }
            
            $taskTitleTruncated = if ($taskTitle.Length -gt 50) { $taskTitle.Substring(0, 47) + "..." } else { $taskTitle.PadRight(50) }
            Write-Host ("Line {0,4}: {1,-6} {2,-50} {3}" -f $lineNum, $taskIdFound, $taskTitleTruncated, $status)
        }
    }
    
    Write-Host ""
    Write-Host "Usage: task-navigator.ps1 [TASK_ID] to see detailed task info"
    exit 0
}

Write-Host "Searching for Task: $TaskId"
Write-Host "================================"

$content = Get-Content $FILE -Encoding UTF8

$taskLineNum = $null
for ($i = 0; $i -lt $content.Length; $i++) {
    if ($content[$i] -match "^### \*\*Tarea ${TaskId}:") {
        $taskLineNum = $i + 1
        break
    }
}

if ($null -eq $taskLineNum) {
    Write-Host "Task $TaskId not found"
    $numericPart = $TaskId -replace "T-", ""
    Write-Host "Available tasks starting with T-${numericPart}:"
    
    $content | Where-Object { $_ -match "^### \*\*Tarea T-$numericPart" } | Select-Object -First 3 | ForEach-Object {
        Write-Host $_
    }
    exit 1
}

Write-Host "Found at line: $taskLineNum"
Write-Host ""

$startIndex = $taskLineNum - 1
$endIndex = $content.Length - 1

for ($i = $startIndex + 1; $i -lt $content.Length; $i++) {
    if ($content[$i] -match "^### \*\*Tarea") {
        $endIndex = $i - 1
        break
    }
}

$taskContent = $content[$startIndex..$endIndex]
if ($taskContent.Length -gt 20) {
    $taskContent = $taskContent[0..19]
}

$taskContent | ForEach-Object {
    Write-Host $_
}

Write-Host ""
Write-Host "Quick Actions:"
Write-Host "  View full task: sed -n '$taskLineNum,/### \*\*Tarea/p' '$FILE'"
Write-Host "  Update status:  ./tools/status-updater.sh $TaskId 'New Status'"
Write-Host "  Extract subtasks: ./tools/extract-subtasks.sh $TaskId"