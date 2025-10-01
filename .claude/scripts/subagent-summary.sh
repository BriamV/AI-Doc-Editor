#!/bin/bash
# SubagentStop: Summarize sub-agent work and validate completion
# Output shown to Claude

# Ensure CLAUDE_PROJECT_DIR is set
if [ -z "$CLAUDE_PROJECT_DIR" ]; then
    CLAUDE_PROJECT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
fi

INPUT=$(cat)

echo "🎯 Sub-agent task completed" >&2

# Load session context
CONTEXT_FILE="$CLAUDE_PROJECT_DIR/.claude/session-context.json"
if [ -f "$CONTEXT_FILE" ]; then
    TASK_ID=$(python3 -c "
import json
try:
    with open('.claude/session-context.json') as f:
        ctx = json.load(f)
    print(ctx.get('task_id', '') or '')
except:
    pass
" 2>/dev/null || echo "")

    WORKFLOW_TYPE=$(python3 -c "
import json
try:
    with open('.claude/session-context.json') as f:
        ctx = json.load(f)
    print(ctx.get('workflow_type', '') or '')
except:
    pass
" 2>/dev/null || echo "")

    # Validate DoD if task context
    if [ -n "$TASK_ID" ] && [ "$WORKFLOW_TYPE" = "task-development" ]; then
        echo "📋 Validating Definition of Done for $TASK_ID..." >&2

        if [ -x "$CLAUDE_PROJECT_DIR/tools/validate-dod.sh" ]; then
            "$CLAUDE_PROJECT_DIR/tools/validate-dod.sh" "$TASK_ID" >&2 || {
                echo "⚠️ DoD validation has warnings" >&2
            }
        fi
    fi
fi

# Summary of changes
CHANGED=$(git status --porcelain 2>/dev/null | wc -l)
echo "📝 Changes: $CHANGED files modified" >&2

# Suggest next actions
echo "" >&2
echo "💡 Next steps:" >&2
case "$WORKFLOW_TYPE" in
    task-development)
        echo "  - Review changes with /review-complete" >&2
        echo "  - Commit with /commit-smart" >&2
        echo "  - Create PR with /pr-flow" >&2
        ;;
    release-preparation)
        echo "  - Run /release-prep for validation" >&2
        echo "  - Execute /merge-safety before merging" >&2
        ;;
    *)
        echo "  - Run /health-check for system validation" >&2
        echo "  - Use /commit-smart when ready" >&2
        ;;
esac

exit 0