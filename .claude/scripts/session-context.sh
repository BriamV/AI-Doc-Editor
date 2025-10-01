#!/bin/bash
# SessionStart: Detect GitFlow context and establish session baseline
# Output goes to Claude as context

# Ensure CLAUDE_PROJECT_DIR is set (fallback to git root)
if [ -z "$CLAUDE_PROJECT_DIR" ]; then
    CLAUDE_PROJECT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
fi

BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
TASK_ID=$(echo "$BRANCH" | sed -n 's/.*T-\([0-9]\+\).*/T-\1/p' | head -1)
RELEASE_ID=$(echo "$BRANCH" | sed -n 's/^release\/R\([0-9]\+\).*/R\1/p' | head -1)

# Determine workflow type
if [[ "$BRANCH" =~ ^feature/T-[0-9]+ ]]; then
    WORKFLOW_TYPE="task-development"
elif [[ "$BRANCH" =~ ^release/R[0-9]+ ]]; then
    WORKFLOW_TYPE="release-preparation"
elif [[ "$BRANCH" =~ ^hotfix/ ]]; then
    WORKFLOW_TYPE="hotfix"
elif [[ "$BRANCH" == "develop" ]]; then
    WORKFLOW_TYPE="integration"
elif [[ "$BRANCH" == "main" ]]; then
    WORKFLOW_TYPE="production"
else
    WORKFLOW_TYPE="general-development"
fi

# Create session marker for file tracking
touch "$CLAUDE_PROJECT_DIR/.cc-session-start"

# Save context to file for other scripts
# Format task_id and release_id as null (not "null")
TASK_JSON="null"
[ -n "$TASK_ID" ] && TASK_JSON="\"$TASK_ID\""

RELEASE_JSON="null"
[ -n "$RELEASE_ID" ] && RELEASE_JSON="\"$RELEASE_ID\""

cat > "$CLAUDE_PROJECT_DIR/.claude/session-context.json" <<EOF
{
  "branch": "$BRANCH",
  "workflow_type": "$WORKFLOW_TYPE",
  "task_id": $TASK_JSON,
  "release_id": $RELEASE_JSON,
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT%H:%M:%S 2>/dev/null)Z"
}
EOF

# Output for Claude (appears in context)
echo "🎯 GitFlow Context:"
echo "  Branch: $BRANCH"
echo "  Workflow: $WORKFLOW_TYPE"
[ -n "$TASK_ID" ] && echo "  Task: $TASK_ID"
[ -n "$RELEASE_ID" ] && echo "  Release: $RELEASE_ID"
echo ""
echo "💡 Available workflow commands:"
case "$WORKFLOW_TYPE" in
    task-development)
        echo "  /task-dev $TASK_ID - Task development workflow"
        echo "  /commit-smart - Smart commit with quality gates"
        echo "  /pr-flow - Create pull request"
        ;;
    release-preparation)
        echo "  /release-prep - Release preparation workflow"
        echo "  /merge-safety - Validate merge safety"
        ;;
    hotfix)
        echo "  /hotfix-flow - Emergency hotfix workflow"
        ;;
esac
echo ""
echo "🛡️ Quality commands: /health-check, /security-audit"