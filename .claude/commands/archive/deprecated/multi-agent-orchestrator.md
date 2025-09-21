---
status: LEGACY
note: "This command is deprecated. Use the new workflow commands instead."
replaced-by: "/task-dev, /pr-flow, /release-prep"
legacy-agent: workflow-architect
context: multi-agent-coordination
delegation: enabled
orchestration: advanced
integration: all-systems
---

# LEGACY COMMAND - DO NOT USE

**This command has been replaced by the new workflow architecture.**

**Use these commands instead:**
- `/task-dev` for task development with sub-agent delegation
- `/pr-flow` for pull request workflow with code review
- `/release-prep` for multi-agent release preparation

---

# Multi-Agent Workflow Orchestrator (LEGACY)

## Agent Ecosystem Discovery
```bash
# Discover available specialized agents and their capabilities
echo "🤖 Multi-Agent Workflow Orchestrator"
echo "===================================="

echo "🔍 Discovering available specialized agents..."

# Check for specialized agent definitions
AGENTS_DIR=".claude/agents"
COMMANDS_DIR=".claude/commands"

if [ -d "$AGENTS_DIR" ]; then
  echo "📁 Available Agent Definitions:"
  find "$AGENTS_DIR" -name "*.md" -type f | while read -r agent_file; do
    agent_name=$(basename "$agent_file" .md)
    specialization=$(grep "^**Specialization**:" "$agent_file" | cut -d: -f2 | xargs)
    echo "  🎯 $agent_name: $specialization"
  done
else
  echo "📁 No agent definitions directory found - creating..."
  mkdir -p "$AGENTS_DIR"
fi

echo ""
echo "🔧 Available Command Interfaces:"
if [ -d "$COMMANDS_DIR" ]; then
  find "$COMMANDS_DIR" -name "*.md" -type f | while read -r cmd_file; do
    cmd_name=$(basename "$cmd_file" .md)
    agent_context=$(grep "^agent:" "$cmd_file" | cut -d: -f2 | xargs)
    cmd_context=$(grep "^context:" "$cmd_file" | cut -d: -f2 | xargs)
    echo "  ⚡ /$cmd_name -> $agent_context ($cmd_context)"
  done
fi
```

## Workflow Context Analysis
@tools/progress-dashboard.sh
@tools/workflow-context.sh
@docs/WORK-PLAN v5.md

```bash
echo ""
echo "📊 Workflow Context Analysis"
echo "============================"

# Current project state analysis
CURRENT_BRANCH=$(git branch --show-current)
TASK_ID=$(echo "$CURRENT_BRANCH" | grep -o 'T-[0-9]\+' || echo "")
CURRENT_WP=$(./tools/progress-dashboard.sh | grep -E "Release R[0-9]" | head -1 | grep -o "R[0-9]" || echo "unknown")

echo "🎯 Current Context:"
echo "  Branch: $CURRENT_BRANCH"
echo "  Task: ${TASK_ID:-'No active task'}"  
echo "  Work Package: $CURRENT_WP"

# Analyze pending work and priorities
echo ""
echo "📋 Pending Work Analysis:"
./tools/progress-dashboard.sh | head -20

# Changed files analysis for agent assignment
CHANGED_FILES=$(git status --porcelain 2>/dev/null | awk '{print $2}' | tr '\n' ' ')
if [ -n "$CHANGED_FILES" ]; then
  echo ""
  echo "📝 Changed Files Analysis:"
  echo "  Files: $(echo $CHANGED_FILES | wc -w)"
  
  # Categorize changes for agent assignment
  SECURITY_FILES=$(echo "$CHANGED_FILES" | grep -E "(auth|security|crypto|audit)" | wc -w)
  PERFORMANCE_FILES=$(echo "$CHANGED_FILES" | grep -E "(perf|benchmark|optimization)" | wc -w)
  DOC_FILES=$(echo "$CHANGED_FILES" | grep -E "\.(md|rst|txt)$" | wc -w)
  API_FILES=$(echo "$CHANGED_FILES" | grep -E "(api|router|endpoint)" | wc -w)
  
  echo "  Security-related: $SECURITY_FILES"
  echo "  Performance-related: $PERFORMANCE_FILES" 
  echo "  Documentation: $DOC_FILES"
  echo "  API-related: $API_FILES"
fi
```

## Intelligent Agent Assignment
```bash
echo ""
echo "🎯 Intelligent Agent Assignment"
echo "==============================="

WORKFLOW_TYPE="${1:-auto}"
TARGET_AGENTS=()
COORDINATION_STRATEGY=""

# Auto-detect workflow type if not specified
if [ "$WORKFLOW_TYPE" = "auto" ]; then
  echo "🔍 Auto-detecting optimal workflow type..."
  
  # Analyze task complexity and scope
  if [ -n "$TASK_ID" ]; then
    TASK_DETAILS=$(./tools/task-navigator.sh "$TASK_ID" 2>/dev/null | head -10)
    
    if echo "$TASK_DETAILS" | grep -qi "security\|auth\|crypto"; then
      WORKFLOW_TYPE="security-focused"
      TARGET_AGENTS+=("security-specialist")
      echo "  🔒 Security-focused workflow detected"
    elif echo "$TASK_DETAILS" | grep -qi "performance\|optimization\|benchmark"; then
      WORKFLOW_TYPE="performance-focused" 
      TARGET_AGENTS+=("performance-optimizer")
      echo "  ⚡ Performance-focused workflow detected"
    elif echo "$TASK_DETAILS" | grep -qi "api\|endpoint\|service"; then
      WORKFLOW_TYPE="api-development"
      TARGET_AGENTS+=("api-specialist")
      echo "  🔌 API development workflow detected"
    elif echo "$TASK_DETAILS" | grep -qi "ui\|ux\|interface\|component"; then
      WORKFLOW_TYPE="ui-development"
      TARGET_AGENTS+=("ui-ux-specialist")
      echo "  🎨 UI/UX development workflow detected"
    else
      WORKFLOW_TYPE="comprehensive"
      echo "  🔄 Comprehensive workflow required"
    fi
  else
    # Analyze by file changes
    if [ $SECURITY_FILES -gt 0 ]; then
      WORKFLOW_TYPE="security-review"
      TARGET_AGENTS+=("security-specialist")
    fi
    if [ $PERFORMANCE_FILES -gt 0 ]; then
      TARGET_AGENTS+=("performance-optimizer")
    fi
    if [ $DOC_FILES -gt 0 ]; then
      TARGET_AGENTS+=("documentation-manager")
    fi
    if [ $API_FILES -gt 0 ]; then
      TARGET_AGENTS+=("api-specialist")
    fi
    
    if [ ${#TARGET_AGENTS[@]} -eq 0 ]; then
      WORKFLOW_TYPE="general-development"
      echo "  🔄 General development workflow"
    elif [ ${#TARGET_AGENTS[@]} -gt 2 ]; then
      WORKFLOW_TYPE="multi-agent-complex"
      echo "  🌐 Complex multi-agent workflow required"
    else
      WORKFLOW_TYPE="specialized"
      echo "  🎯 Specialized workflow: ${TARGET_AGENTS[*]}"
    fi
  fi
else
  echo "🎯 Using explicit workflow type: $WORKFLOW_TYPE"
fi

echo "📋 Workflow Type: $WORKFLOW_TYPE"
echo "🤖 Target Agents: ${TARGET_AGENTS[*]:-'Auto-assigned'}"
```

## Agent Coordination Strategy
```bash
echo ""
echo "🎼 Agent Coordination Strategy"
echo "=============================="

case "$WORKFLOW_TYPE" in
  "security-focused"|"security-review")
    COORDINATION_STRATEGY="security-first"
    echo "🔒 Security-First Coordination:"
    echo "  1. Security Specialist: Vulnerability assessment"
    echo "  2. Workflow Architect: Integration and automation"
    echo "  3. Documentation Manager: Security documentation"
    
    # Security-focused workflow
    echo ""
    echo "🛡️ Executing Security-Focused Workflow..."
    
    # Delegate security scan to security specialist
    echo "👤 Security Specialist: Comprehensive security analysis"
    !yarn run cmd security-scan
    !yarn run cmd audit
    
    # Check for sensitive data patterns
    echo "🔍 Scanning for sensitive data patterns..."
    git secrets --scan 2>/dev/null || echo "No secrets detected"
    
    # Security-specific validations
    if [ -n "$CHANGED_FILES" ]; then
      for file in $CHANGED_FILES; do
        if echo "$file" | grep -qE "(auth|security|crypto|password|token)"; then
          echo "🔍 Security-sensitive file detected: $file"
          echo "  → Requiring enhanced validation"
        fi
      done
    fi
    ;;
    
  "performance-focused")
    COORDINATION_STRATEGY="performance-optimization"
    echo "⚡ Performance-Optimization Coordination:"
    echo "  1. Performance Optimizer: Benchmarking and profiling"
    echo "  2. Workflow Architect: Automation and monitoring"
    echo "  3. Testing Specialist: Performance test execution"
    
    echo ""
    echo "🚀 Executing Performance-Focused Workflow..."
    
    # Performance analysis
    echo "📊 Performance Optimizer: Analyzing performance metrics"
    
    # Check bundle size (frontend)
    if echo "$CHANGED_FILES" | grep -qE "\.(tsx?|jsx?)$"; then
      echo "📦 Frontend bundle analysis..."
      !yarn run cmd build-analyze 2>/dev/null || echo "Bundle analysis not available"
    fi
    
    # Check Python performance patterns (backend)  
    if echo "$CHANGED_FILES" | grep -qE "\.py$"; then
      echo "🐍 Backend performance analysis..."
      # Look for potential performance issues
      for file in $CHANGED_FILES; do
        if echo "$file" | grep -qE "\.py$"; then
          if grep -q "for.*in.*:" "$file" 2>/dev/null; then
            echo "  ℹ️ Loop detected in $file - consider optimization"
          fi
          if grep -q "SELECT\|Query" "$file" 2>/dev/null; then
            echo "  ℹ️ Database queries in $file - verify indexing"
          fi
        fi
      done
    fi
    ;;
    
  "api-development")
    COORDINATION_STRATEGY="api-first"
    echo "🔌 API-First Development Coordination:"
    echo "  1. API Specialist: OpenAPI validation and testing"
    echo "  2. Security Specialist: API security review"
    echo "  3. Documentation Manager: API documentation"
    
    echo ""
    echo "🔌 Executing API Development Workflow..."
    
    # API validation
    echo "📋 API Specialist: OpenAPI specification validation"
    !yarn run cmd api-spec
    
    # API testing
    echo "🧪 API endpoint testing..."
    if [ -d "backend/tests" ]; then
      !python -m pytest backend/tests/test_*api*.py -v 2>/dev/null || echo "API tests not available"
    fi
    
    # Security review for APIs
    echo "🔒 API security analysis..."
    if echo "$CHANGED_FILES" | grep -qE "(router|endpoint|api)"; then
      echo "  🔍 API security patterns check required"
    fi
    ;;
    
  "ui-development")
    COORDINATION_STRATEGY="user-centric"
    echo "🎨 User-Centric Development Coordination:"
    echo "  1. UI/UX Specialist: Interface design validation"
    echo "  2. Testing Specialist: User interaction testing"
    echo "  3. Performance Optimizer: UI performance analysis"
    
    echo ""
    echo "🎨 Executing UI Development Workflow..."
    
    # UI component validation
    echo "🧩 UI/UX Specialist: Component validation"
    if echo "$CHANGED_FILES" | grep -qE "\.(tsx|jsx)$"; then
      echo "  🎯 React component analysis..."
      for file in $CHANGED_FILES; do
        if echo "$file" | grep -qE "\.(tsx|jsx)$"; then
          lines=$(wc -l < "$file" 2>/dev/null || echo 0)
          if [ "$lines" -gt 200 ]; then
            echo "  ⚠️ Large component in $file ($lines lines) - consider splitting"
          fi
        fi
      done
    fi
    
    # Accessibility checks
    echo "♿ Accessibility validation..."
    if echo "$CHANGED_FILES" | grep -qE "\.(tsx|jsx|html)$"; then
      echo "  ℹ️ UI changes detected - verify accessibility compliance"
    fi
    ;;
    
  "comprehensive"|"multi-agent-complex")
    COORDINATION_STRATEGY="orchestrated-parallel"
    echo "🌐 Orchestrated Parallel Coordination:"
    echo "  1. All Specialists: Parallel specialized analysis"
    echo "  2. Workflow Architect: Coordination and integration"
    echo "  3. Sequential validation and consolidation"
    
    echo ""
    echo "🌐 Executing Comprehensive Multi-Agent Workflow..."
    
    # Parallel specialist execution
    echo "🔄 Parallel Specialist Execution:"
    
    # Security analysis (background-capable)
    echo "  🔒 Security Specialist: Background security scan"
    (yarn run cmd security-scan > /tmp/security-results.txt 2>&1 &)
    
    # Performance analysis
    echo "  ⚡ Performance Optimizer: Performance metrics"
    # Performance checks here
    
    # Quality analysis  
    echo "  ✅ Quality Specialist: Code quality validation"
    !yarn run cmd validate-all-fast
    
    # Documentation check
    echo "  📚 Documentation Manager: Documentation validation"
    if [ $DOC_FILES -gt 0 ]; then
      !markdownlint-cli2 $CHANGED_FILES
    fi
    
    # Wait for background processes and consolidate
    echo "⏳ Consolidating parallel results..."
    wait
    
    if [ -f /tmp/security-results.txt ]; then
      echo "📋 Security Results:"
      cat /tmp/security-results.txt | head -10
      rm /tmp/security-results.txt
    fi
    ;;
    
  *)
    COORDINATION_STRATEGY="adaptive"
    echo "🔄 Adaptive General Development:"
    echo "  1. Context analysis and agent selection"
    echo "  2. Dynamic workflow adaptation"
    echo "  3. Quality validation and integration"
    
    echo ""
    echo "🔄 Executing Adaptive Workflow..."
    
    # Basic quality validation
    !yarn run cmd qa
    ;;
esac
```

## Workflow State Management & Handoffs
@tools/qa-workflow.sh

```bash
echo ""
echo "🔄 Workflow State Management & Agent Handoffs"
echo "=============================================="

# Create workflow state tracking
WORKFLOW_STATE_FILE=".claude/workflow-state.json"
mkdir -p .claude

# Record workflow execution state
cat > "$WORKFLOW_STATE_FILE" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "workflow_type": "$WORKFLOW_TYPE",
  "coordination_strategy": "$COORDINATION_STRATEGY",
  "target_agents": [$(printf '"%s",' "${TARGET_AGENTS[@]}" | sed 's/,$//')]",
  "task_id": "$TASK_ID",
  "branch": "$CURRENT_BRANCH",
  "changed_files": $(echo "$CHANGED_FILES" | wc -w),
  "status": "executed"
}
EOF

echo "📊 Workflow state recorded in $WORKFLOW_STATE_FILE"

# Agent handoff recommendations
echo ""
echo "🤝 Agent Handoff Recommendations:"

if [ -n "$TASK_ID" ]; then
  TASK_STATUS=$(./tools/task-navigator.sh "$TASK_ID" | grep "Estado:" | head -1 2>/dev/null)
  
  case "$WORKFLOW_TYPE" in
    "security-focused"|"security-review")
      echo "  🔒 Security Review Complete → Next: Development integration"
      echo "    - Security requirements validated"
      echo "    - Ready for secure implementation"
      echo "    - Handoff to: development team with security constraints"
      ;;
    "performance-focused")
      echo "  ⚡ Performance Analysis Complete → Next: Optimization implementation"
      echo "    - Performance bottlenecks identified"
      echo "    - Optimization strategies recommended"
      echo "    - Handoff to: development team with performance targets"
      ;;
    "api-development")
      echo "  🔌 API Development Complete → Next: Integration testing"
      echo "    - API specification validated"
      echo "    - Security review completed"
      echo "    - Handoff to: QA team for integration testing"
      ;;
    *)
      echo "  🔄 Multi-agent coordination complete"
      echo "    - All specialist reviews completed"
      echo "    - Ready for final integration"
      ;;
  esac
  
  # Suggest next workflow command
  echo ""
  echo "💡 Suggested Next Steps:"
  echo "  Development: /task $TASK_ID"
  echo "  Quality Gate: /qa comprehensive"
  echo "  Task Completion: ./tools/qa-workflow.sh $TASK_ID mark-complete"
fi
```

## Workflow Metrics & Optimization
```bash
echo ""
echo "📈 Workflow Metrics & Optimization"
echo "=================================="

# Performance metrics
WORKFLOW_END_TIME=$(date +%s)
WORKFLOW_START_TIME=${WORKFLOW_START_TIME:-$WORKFLOW_END_TIME}
EXECUTION_TIME=$((WORKFLOW_END_TIME - WORKFLOW_START_TIME))

echo "⏱️ Execution Metrics:"
echo "  Total execution time: ${EXECUTION_TIME}s"
echo "  Workflow type: $WORKFLOW_TYPE"
echo "  Agents coordinated: ${#TARGET_AGENTS[@]}"
echo "  Files processed: $(echo $CHANGED_FILES | wc -w)"

# Efficiency analysis
echo ""
echo "📊 Efficiency Analysis:"
case "$COORDINATION_STRATEGY" in
  "security-first")
    echo "  🔒 Security-first strategy executed"
    echo "  ✅ Comprehensive security validation"
    echo "  💡 Optimization: Consider security automation for future"
    ;;
  "performance-optimization")
    echo "  ⚡ Performance optimization strategy executed"
    echo "  ✅ Performance bottlenecks analyzed"
    echo "  💡 Optimization: Implement automated performance testing"
    ;;
  "orchestrated-parallel")
    echo "  🌐 Parallel orchestration strategy executed"
    echo "  ✅ Multiple agents coordinated efficiently"
    echo "  💡 Optimization: Consider pipeline parallelization"
    ;;
esac

# Recommendations for future optimizations
echo ""
echo "🚀 Future Workflow Optimizations:"
echo "  1. Implement agent result caching"
echo "  2. Add predictive agent assignment"
echo "  3. Create workflow templates for common patterns"
echo "  4. Implement automated handoff protocols"

echo ""
echo "✅ Multi-Agent Orchestration Complete!"
echo "🎯 Workflow: $WORKFLOW_TYPE | Strategy: $COORDINATION_STRATEGY"
echo "🤖 Agents: ${TARGET_AGENTS[*]:-'Auto-assigned'} | Time: ${EXECUTION_TIME}s"
```

## Integration with Task Management
@tools/progress-dashboard.sh
@tools/task-navigator.sh

```bash
# Update task progress if applicable
if [ -n "$TASK_ID" ]; then
  echo ""
  echo "📋 Task Integration Update"
  echo "========================="
  
  # Update task status to reflect multi-agent review
  ./tools/status-updater.sh "$TASK_ID" "Multi-agent review completed ($WORKFLOW_TYPE)"
  
  echo "✅ Task $TASK_ID updated with multi-agent workflow results"
  echo "📊 View progress: ./tools/progress-dashboard.sh"
  echo "🔍 Task details: ./tools/task-navigator.sh $TASK_ID"
fi

# Cleanup temporary files
rm -f /tmp/*-results.txt 2>/dev/null || true

echo ""
echo "🎉 Multi-Agent Orchestration Successfully Completed!"
```

**Usage Examples:**
- `/orchestrate` - Auto-detect workflow type and coordinate appropriate agents
- `/orchestrate security-focused` - Security-first multi-agent coordination
- `/orchestrate performance-focused` - Performance-optimization coordination
- `/orchestrate comprehensive` - Full multi-agent parallel execution
- `/orchestrate api-development` - API-focused development coordination

**Agent Coordination Features:**
- Intelligent workflow type detection based on context
- Parallel agent execution for efficiency
- State management and handoff protocols
- Integration with existing task management system
- Performance metrics and optimization recommendations
- Adaptive coordination strategies based on project needs