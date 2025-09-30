#!/bin/bash
# UserPromptSubmit: Inject workflow context into prompts
# Output appears as additional context for Claude

# Ensure CLAUDE_PROJECT_DIR is set
if [ -z "$CLAUDE_PROJECT_DIR" ]; then
    CLAUDE_PROJECT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
fi

CONTEXT_FILE="$CLAUDE_PROJECT_DIR/.claude/session-context.json"

# Determine python command
PYTHON_CMD="python3"
command -v python3 >/dev/null 2>&1 || PYTHON_CMD="python"

if [ -f "$CONTEXT_FILE" ]; then
    # Extract context with Python for reliability
    $PYTHON_CMD - <<'PYEOF'
import json
import sys
try:
    with open('.claude/session-context.json') as f:
        ctx = json.load(f)

    print("📍 Current Context:")
    print(f"  Branch: {ctx['branch']}")
    print(f"  Workflow: {ctx['workflow_type']}")

    if ctx.get('task_id') and ctx['task_id'] != 'null':
        print(f"  Task: {ctx['task_id']}")
        print(f"  📋 View task: tools/task-navigator.sh {ctx['task_id']}")

    if ctx.get('release_id') and ctx['release_id'] != 'null':
        print(f"  Release: {ctx['release_id']}")

    print("")
except:
    pass
PYEOF
fi