---
status: LEGACY
note: "This command is deprecated. Use the new workflow commands instead."
replaced-by: "/task-dev, /pr-flow, /release-prep"
legacy-agent: workflow-architect
context: task-management
scope: current-branch
integration: tools,hooks,cli
auto-detect: true
---

# LEGACY COMMAND - DO NOT USE

**This command has been replaced by the new workflow architecture.**

**Use these commands instead:**
- `/task-dev` for intelligent task lifecycle management
- `/pr-flow` for pull request workflow
- `/release-prep` for release preparation

---

# Intelligent Task Lifecycle Management (LEGACY)

## Context Detection
```bash
# Auto-detect current task from branch name or manual override
CURRENT_BRANCH=$(git branch --show-current)
TASK_ID=$(echo "$CURRENT_BRANCH" | grep -o 'T-[0-9]\+' || echo "${1:-auto}")

if [ "$TASK_ID" = "auto" ]; then
  echo "🔍 Auto-detecting task context from git branch..."
  if [ -z "$(echo "$CURRENT_BRANCH" | grep 'T-[0-9]\+')" ]; then
    echo "❌ No task ID detected in branch name. Use: /task T-XX"
    exit 1
  fi
  TASK_ID=$(echo "$CURRENT_BRANCH" | grep -o 'T-[0-9]\+')
fi

echo "🎯 Managing task lifecycle for: $TASK_ID"
```

## Task Navigation and Setup
@tools/task-navigator.sh $TASK_ID
@tools/extract-subtasks.sh $TASK_ID
@docs/Sub Tareas v2.md

```bash
# Initialize task development environment
echo "📋 Setting up development environment for $TASK_ID..."

# Extract task details and subtasks
./tools/task-navigator.sh "$TASK_ID" > /tmp/task-details.md
./tools/extract-subtasks.sh "$TASK_ID" > current-work.md

# Display task context
echo "📊 Task Progress Summary:"
./tools/progress-dashboard.sh | grep "$TASK_ID" -A 5 -B 2 || echo "Task not found in progress dashboard"
```

## Intelligent Validation Scope Detection
```bash
# Determine validation scope based on task type and changed files
TASK_SCOPE=$(grep -A 10 "**$TASK_ID**" docs/Sub\ Tareas\ v2.md | grep -E "(frontend|backend|full-stack|security|infrastructure)" | head -1 | tr '[:upper:]' '[:lower:]')

echo "🔧 Detected task scope: $TASK_SCOPE"

# Apply appropriate validation strategy
case "$TASK_SCOPE" in
  *frontend*)
    echo "🎨 Frontend task detected - applying React/TypeScript validation"
    !yarn run cmd validate-frontend
    ;;
  *backend*)
    echo "🔧 Backend task detected - applying Python/FastAPI validation"  
    !yarn run cmd validate-backend
    ;;
  *security*)
    echo "🔒 Security task detected - applying comprehensive security validation"
    !yarn run cmd security-scan
    !yarn run cmd audit
    ;;
  *infrastructure*)
    echo "🏗️ Infrastructure task detected - applying deployment validation"
    !yarn run cmd validate-all
    !docker-compose config --quiet
    ;;
  *)
    echo "🔄 Full-stack or undefined scope - applying comprehensive validation"
    !yarn run cmd validate-all-fast
    ;;
esac
```

## Progress Tracking and DoD Validation
@tools/validate-dod.sh $TASK_ID
@tools/qa-workflow.sh $TASK_ID

```bash
# Validate Definition of Done compliance
echo "✅ Validating Definition of Done for $TASK_ID..."
./tools/validate-dod.sh "$TASK_ID"

# Update progress if validation passes
if [ $? -eq 0 ]; then
  echo "🎉 Task meets Definition of Done criteria"
  ./tools/qa-workflow.sh "$TASK_ID" dev-complete
else
  echo "⚠️ Task does not meet Definition of Done. Review requirements."
  ./tools/validate-dod.sh "$TASK_ID" --details
fi
```

## Quality Gate Integration
@.claude/hooks.json

```bash
# Ensure hooks are properly configured for this task type
echo "🔗 Validating hook configuration for task type..."

# Check if specialized hooks are needed for this task
if echo "$TASK_ID" | grep -qE "T-0[1-3]|T-12|T-43"; then
  echo "🔒 Security-sensitive task detected - enabling enhanced validation"
  export SECURITY_ENHANCED=true
fi

if echo "$TASK_ID" | grep -qE "T-04|T-05|T-06|T-11"; then
  echo "🤖 AI/ML task detected - enabling AI-specific validations"
  export AI_VALIDATION=true
fi

# Apply git hooks for quality assurance
git add -A
echo "Running pre-commit hooks for quality validation..."
```

## Workflow State Management
```bash
# Update task status in tracking system
echo "📈 Updating task status and progress metrics..."

# Determine next workflow state
CURRENT_STATUS=$(./tools/task-navigator.sh "$TASK_ID" | grep "Estado:" | head -1)
echo "Current status: $CURRENT_STATUS"

# Suggest next actions based on current state
if echo "$CURRENT_STATUS" | grep -qi "en progreso"; then
  echo "💡 Next actions available:"
  echo "  - Mark subtask complete: ./tools/mark-subtask-complete.sh $TASK_ID <subtask-id>"  
  echo "  - Update progress: ./tools/status-updater.sh $TASK_ID '<new-status>'"
  echo "  - Complete development: ./tools/qa-workflow.sh $TASK_ID dev-complete"
elif echo "$CURRENT_STATUS" | grep -qi "dev-complete"; then
  echo "💡 Ready for QA validation:"
  echo "  - Start QA: ./tools/qa-workflow.sh $TASK_ID start-qa"
  echo "  - Validate DoD: ./tools/validate-dod.sh $TASK_ID"
elif echo "$CURRENT_STATUS" | grep -qi "qa-passed"; then
  echo "🎯 Ready for completion:"
  echo "  - Mark complete: ./tools/qa-workflow.sh $TASK_ID mark-complete"
  echo "  - Update traceability: npx tsx scripts/governance.ts --format=all"
fi
```

## Integration Testing
```bash
# Run targeted integration tests based on task scope
echo "🧪 Running integration tests relevant to $TASK_ID..."

# Check if task affects API
if grep -q "API\|endpoint\|service" current-work.md 2>/dev/null; then
  echo "🔌 API changes detected - validating OpenAPI spec"
  !yarn run cmd api-spec
fi

# Check if task affects UI
if grep -q "UI\|component\|interface" current-work.md 2>/dev/null; then
  echo "🎨 UI changes detected - running visual regression tests"
  !yarn run cmd test-e2e
fi

# Check if task affects database
if grep -q "database\|migration\|model" current-work.md 2>/dev/null; then
  echo "🗄️ Database changes detected - validating migrations"
  !python backend/manage.py makemigrations --check
fi
```

## Success Summary
```bash
echo ""
echo "🎉 Task Lifecycle Management Complete for $TASK_ID"
echo "================================================"
echo "✅ Context detected and environment configured"
echo "✅ Validation scope applied appropriately" 
echo "✅ Quality gates executed successfully"
echo "✅ Progress tracking updated"
echo "✅ Integration tests completed"
echo ""
echo "💡 Quick commands for next steps:"
echo "  View task details:    ./tools/task-navigator.sh $TASK_ID"
echo "  Update progress:      ./tools/status-updater.sh $TASK_ID '<status>'"
echo "  Mark subtask done:    ./tools/mark-subtask-complete.sh $TASK_ID <subtask-id>"
echo "  Complete development: ./tools/qa-workflow.sh $TASK_ID dev-complete"
echo "  Full quality check:   /qa comprehensive"
echo ""
```

**Usage Examples:**
- `/task` - Auto-detect task from current branch name
- `/task T-25` - Manage specific task lifecycle
- `/task auto` - Force auto-detection (same as no arguments)

**Integration Points:**
- Uses existing tools/ scripts for task management
- Integrates with .claude/hooks.json for quality gates  
- Leverages current git workflow and branch naming
- Connects to progress tracking and DoD validation systems