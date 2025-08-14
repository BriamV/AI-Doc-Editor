# Task Development - Sub-Agent Delegation

---
description: Complete task development with explicit sub-agent delegation using Claude Code best practices
argument-hint: "[task-id] [action]"
sub-agent: workflow-architect
---

## Purpose

Context-aware task development using proper sub-agent delegation. Analyzes task content and automatically invokes the appropriate specialized sub-agent for implementation.

## Usage

```bash
/task-dev                       # Auto-detect from branch context  
/task-dev T-25                  # Specific task development
/task-dev T-25 complete         # Mark complete with DoD validation
```

## Implementation

```bash
# Context detection and task ID resolution
TASK_ID="${ARGUMENTS[0]}"
ACTION="${ARGUMENTS[1]:-develop}"

# Auto-detect task ID from branch if not provided
[ -z "$TASK_ID" ] && TASK_ID=$(git branch --show-current | grep -o 'T-[0-9]\+')
[ -z "$TASK_ID" ] && { echo "❌ No task ID found. Use: /task-dev T-XX"; exit 1; }

# Analyze task content to determine sub-agent
echo "🔍 Analyzing task $TASK_ID..."
!tools/task-navigator.sh $TASK_ID

# Get task details for sub-agent selection
TASK_CONTENT=$(bash tools/task-navigator.sh "$TASK_ID" 2>/dev/null | head -10)

# Explicit sub-agent delegation using official Claude Code syntax
case "$TASK_CONTENT" in
    *"frontend"*|*"React"*|*"TypeScript"*|*"UI"*|*"component"*)
        echo "🎨 Frontend task detected"
        echo "> Use the frontend-developer sub-agent to implement React/TypeScript components and UI functionality for task $TASK_ID"
        ;;
    *"backend"*|*"API"*|*"FastAPI"*|*"Python"*|*"endpoint"*)
        echo "⚡ Backend task detected"  
        echo "> Use the backend-architect sub-agent to design and implement API endpoints and backend functionality for task $TASK_ID"
        ;;
    *"security"*|*"auth"*|*"oauth"*|*"encryption"*|*"audit"*)
        echo "🔒 Security task detected"
        echo "> Use the security-auditor sub-agent to implement security requirements and authentication features for task $TASK_ID"
        ;;
    *)
        echo "🚀 General development task"
        echo "> Use the frontend-developer sub-agent to implement the requirements for task $TASK_ID, coordinating with backend-architect sub-agent if API changes are needed"
        ;;
esac

# Handle completion actions
[ "$ACTION" = "complete" ] && {
    echo "✅ Marking task $TASK_ID as development complete"
    bash tools/qa-workflow.sh "$TASK_ID" dev-complete
}
```