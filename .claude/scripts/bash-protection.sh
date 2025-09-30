#!/bin/bash
# PreToolUse(Bash): Protect against dangerous operations
# Exit 2 blocks operation, stderr sent to Claude

# Read JSON input from stdin
INPUT=$(cat)

# Extract command from JSON
COMMAND=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('command', ''))
except:
    pass
" 2>/dev/null || echo "")

CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)

# Block direct operations on protected branches
if [[ "$CURRENT_BRANCH" == "main" || "$CURRENT_BRANCH" == "master" ]]; then
    if echo "$COMMAND" | grep -qE "(git push|git merge|git rebase)"; then
        echo "🚫 BLOCKED: Direct git operations on $CURRENT_BRANCH branch" >&2
        echo "Use proper GitFlow workflow: create feature branch or use /pr-flow" >&2
        exit 2
    fi
fi

# Detect merge/push operations and validate with yarn command
if echo "$COMMAND" | grep -qE "git.*(merge|push.*origin.*main)"; then
    echo "🔍 Merge protection check..." >&2

    # Delegate to existing yarn command (suppress output to avoid clutter)
    if ! yarn repo:merge:precheck >/dev/null 2>&1; then
        echo "🚫 BLOCKED: Pre-merge check failed" >&2
        echo "Run 'yarn repo:merge:validate' for details" >&2
        echo "Use '/merge-safety' command for full validation" >&2
        exit 2
    fi

    echo "✅ Merge protection passed" >&2
fi

# Allow operation
exit 0