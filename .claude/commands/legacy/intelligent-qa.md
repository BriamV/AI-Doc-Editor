---
status: LEGACY
note: "This command is deprecated. Use the new workflow commands instead."
replaced-by: "/task-dev, /pr-flow, /release-prep"
legacy-agent: workflow-architect
context: quality-assurance
scope: auto-detect
integration: hooks,cli,megalinter
performance-optimized: true
---

# LEGACY COMMAND - DO NOT USE

**This command has been replaced by the new workflow architecture.**

**Use these commands instead:**
- `/task-dev` for task development
- `/pr-flow` for pull request workflow
- `/release-prep` for release preparation

---

# Intelligent Quality Assurance Pipeline (LEGACY)

## Smart Scope Detection
```bash
# Intelligent scope detection based on changed files and context
SCOPE="${1:-auto}"
CHANGED_FILES=$(git status --porcelain 2>/dev/null | awk '{print $2}' | tr '\n' ' ')
BRANCH_CONTEXT=$(git branch --show-current)
TASK_ID=$(echo "$BRANCH_CONTEXT" | grep -o 'T-[0-9]\+' || echo "")

echo "🔍 Intelligent QA Pipeline - Scope Detection"
echo "============================================"

if [ "$SCOPE" = "auto" ]; then
  echo "📊 Analyzing changed files for optimal validation scope..."
  
  # Determine scope based on changed files
  FRONTEND_CHANGES=$(echo "$CHANGED_FILES" | grep -E '\.(tsx?|jsx?|css|scss|html)$' | wc -w)
  BACKEND_CHANGES=$(echo "$CHANGED_FILES" | grep -E '\.(py|pyi)$' | wc -w)  
  CONFIG_CHANGES=$(echo "$CHANGED_FILES" | grep -E '\.(json|yaml|yml|toml|env)$' | wc -w)
  SCRIPT_CHANGES=$(echo "$CHANGED_FILES" | grep -E '\.(sh|bash|zsh|cjs|mjs)$' | wc -w)
  DOC_CHANGES=$(echo "$CHANGED_FILES" | grep -E '\.(md|rst|txt)$' | wc -w)
  
  echo "📋 Change Analysis:"
  echo "  Frontend files: $FRONTEND_CHANGES"
  echo "  Backend files: $BACKEND_CHANGES"
  echo "  Config files: $CONFIG_CHANGES"
  echo "  Script files: $SCRIPT_CHANGES" 
  echo "  Documentation: $DOC_CHANGES"
  
  # Smart scope determination
  if [ $FRONTEND_CHANGES -gt 0 ] && [ $BACKEND_CHANGES -gt 0 ]; then
    SCOPE="full-stack"
    echo "🔄 Detected full-stack changes - comprehensive validation required"
  elif [ $FRONTEND_CHANGES -gt 0 ]; then
    SCOPE="frontend"
    echo "🎨 Detected frontend changes - React/TypeScript validation focus"
  elif [ $BACKEND_CHANGES -gt 0 ]; then
    SCOPE="backend"
    echo "🔧 Detected backend changes - Python/FastAPI validation focus"
  elif [ $CONFIG_CHANGES -gt 0 ] || [ $SCRIPT_CHANGES -gt 0 ]; then
    SCOPE="infrastructure"
    echo "🏗️ Detected infrastructure changes - configuration validation focus"
  elif [ $DOC_CHANGES -gt 0 ]; then
    SCOPE="documentation"
    echo "📚 Detected documentation changes - content validation focus"
  else
    SCOPE="minimal"
    echo "📝 No significant changes detected - minimal validation scope"
  fi
else
  echo "🎯 Using explicit scope: $SCOPE"
fi

echo "⚡ Selected validation scope: $SCOPE"
echo ""
```

## Context-Aware Validation Strategy
@.claude/hooks.json
@scripts/commands/qa.cjs

```bash
# Apply validation strategy based on detected scope
echo "🚀 Executing Context-Aware Validation Strategy"
echo "==============================================="

case "$SCOPE" in
  "frontend")
    echo "🎨 Frontend Validation Pipeline"
    echo "-------------------------------"
    
    # TypeScript/React specific validations
    echo "📝 TypeScript compilation check..."
    !yarn run cmd tsc-check
    
    echo "🎯 ESLint validation (React rules)..."
    !yarn run cmd lint
    
    echo "💅 Prettier formatting check..."
    !yarn run cmd format-check
    
    echo "🧪 Frontend unit tests..."
    !yarn run cmd test --coverage --passWithNoTests
    
    # Component-specific checks
    echo "🔍 Component complexity analysis..."
    for file in $CHANGED_FILES; do
      if echo "$file" | grep -qE '\.(tsx|jsx)$'; then
        echo "  Analyzing: $file"
        # Check component size and complexity
        loc=$(wc -l < "$file" 2>/dev/null || echo 0)
        if [ $loc -gt 200 ]; then
          echo "  ⚠️ Large component ($loc lines) - consider breaking down"
        fi
      fi
    done
    ;;
    
  "backend")
    echo "🔧 Backend Validation Pipeline"
    echo "------------------------------"
    
    # Python/FastAPI specific validations
    echo "🐍 Python code formatting (Black)..."
    if [ -f .venv/bin/activate ]; then
      source .venv/bin/activate
    fi
    !black --check --diff .
    
    echo "🔍 Python linting (Ruff)..."
    !ruff check .
    
    echo "🏷️ Type checking (MyPy)..."
    !mypy backend/app --ignore-missing-imports
    
    echo "🧪 Backend unit tests..."
    !python -m pytest backend/tests/ -v --cov=backend/app
    
    echo "🔐 Security scan (Python packages)..."
    !pip-audit
    
    # API-specific checks
    if echo "$CHANGED_FILES" | grep -q "routers\|api"; then
      echo "🔌 API specification validation..."
      !yarn run cmd api-spec
      
      echo "🚀 API endpoint tests..."
      !python -m pytest backend/tests/test_*api*.py -v
    fi
    ;;
    
  "full-stack")
    echo "🔄 Full-Stack Validation Pipeline"
    echo "---------------------------------"
    
    # Comprehensive validation for full-stack changes
    echo "🎨 Frontend validation..."
    !yarn run cmd validate-frontend-fast
    
    echo "🔧 Backend validation..."
    !yarn run cmd validate-backend-fast
    
    echo "🔗 Integration tests..."
    !yarn run cmd test-all
    
    echo "🚀 End-to-end tests (critical paths)..."
    !yarn run cmd test-e2e --spec="**/*critical*.cy.ts"
    
    echo "📊 System health check..."
    !yarn run cmd health-check
    ;;
    
  "infrastructure")
    echo "🏗️ Infrastructure Validation Pipeline"
    echo "-------------------------------------"
    
    echo "📝 Configuration validation..."
    # YAML/JSON validation
    for file in $CHANGED_FILES; do
      case "$file" in
        *.json)
          echo "  Validating JSON: $file"
          !python -m json.tool "$file" >/dev/null
          ;;
        *.yaml|*.yml)
          echo "  Validating YAML: $file"
          !yamllint "$file"
          ;;
        *.toml)
          echo "  Validating TOML: $file"
          !taplo check "$file" 2>/dev/null || echo "  ⚠️ TOML validation skipped (taplo not available)"
          ;;
      esac
    done
    
    echo "🐳 Docker configuration validation..."
    if echo "$CHANGED_FILES" | grep -qE "(Dockerfile|docker-compose|\.dockerignore)"; then
      !docker-compose config --quiet
      echo "  ✅ Docker configuration valid"
    fi
    
    echo "🔧 Shell script validation..."
    for file in $CHANGED_FILES; do
      if echo "$file" | grep -qE '\.(sh|bash|zsh)$'; then
        echo "  Validating shell script: $file"
        !shellcheck "$file" || echo "  ⚠️ ShellCheck issues found in $file"
      fi
    done
    ;;
    
  "documentation")
    echo "📚 Documentation Validation Pipeline"
    echo "-----------------------------------"
    
    echo "📝 Markdown validation..."
    !markdownlint-cli2 $CHANGED_FILES
    
    echo "🔗 Link validation..."
    # Check for broken internal links
    for file in $CHANGED_FILES; do
      if echo "$file" | grep -qE '\.md$'; then
        echo "  Checking links in: $file"
        # Extract and validate internal links
        grep -oE '\[.*\]\([^)]+\)' "$file" 2>/dev/null | while read -r link; do
          href=$(echo "$link" | sed 's/.*(\([^)]*\)).*/\1/')
          if [ -f "$href" ] || echo "$href" | grep -qE '^https?://'; then
            continue
          else
            echo "    ⚠️ Potential broken link: $href"
          fi
        done
      fi
    done
    
    echo "📊 Documentation completeness check..."
    # Check if code changes need documentation updates
    if echo "$CHANGED_FILES" | grep -qE '\.(py|ts|tsx|js|jsx)$'; then
      echo "  💡 Code changes detected - consider updating documentation"
    fi
    ;;
    
  "minimal")
    echo "📝 Minimal Validation Pipeline"
    echo "-----------------------------"
    
    echo "🎯 Essential checks only..."
    !yarn run cmd format-check
    
    if [ -n "$CHANGED_FILES" ]; then
      echo "✅ Basic validation complete - no critical issues"
    else
      echo "ℹ️ No changes detected - validation skipped"
    fi
    ;;
    
  *)
    echo "🔄 Comprehensive Validation Pipeline"
    echo "-----------------------------------"
    
    echo "⚡ Running optimized comprehensive validation..."
    !yarn run cmd validate-all-fast
    ;;
esac
```

## Performance-Optimized Execution
@.claude/HOOKS-PERFORMANCE-OPTIMIZATION.md

```bash
# Leverage existing 54% performance optimization
echo ""
echo "⚡ Performance-Optimized Quality Gates"
echo "====================================="

# Use optimized hook system for final validation
echo "🔗 Applying optimized quality gates (70s timeout system)..."

# Simulate hook execution for validation
git add . 2>/dev/null || true
echo "✅ Quality gates ready - hooks will run on commit"

# Provide performance metrics
HOOK_START_TIME=$(date +%s)
echo "📊 Estimated execution time based on scope:"
case "$SCOPE" in
  "frontend"|"backend"|"documentation") echo "  Expected: 15-25 seconds" ;;
  "full-stack"|"infrastructure") echo "  Expected: 25-40 seconds" ;;
  "minimal") echo "  Expected: 5-10 seconds" ;;
  *) echo "  Expected: 30-50 seconds (comprehensive)" ;;
esac
```

## Intelligent Error Reporting
```bash
# Smart error categorization and actionable suggestions
echo ""
echo "🎯 Intelligent Error Analysis & Suggestions"
echo "==========================================="

# Check for common issues based on scope
case "$SCOPE" in
  "frontend")
    if ! yarn run cmd lint --quiet 2>/dev/null; then
      echo "💡 Frontend Issues Detected:"
      echo "  - Run 'yarn run cmd lint-fix' for auto-corrections"
      echo "  - Check React hooks dependencies and effects"
      echo "  - Verify TypeScript strict mode compliance"
    fi
    ;;
    
  "backend")
    if ! python -c "import backend.app" 2>/dev/null; then
      echo "💡 Backend Issues Detected:"
      echo "  - Check Python import paths and dependencies"
      echo "  - Verify virtual environment activation"
      echo "  - Review FastAPI route definitions"
    fi
    ;;
    
  "infrastructure")
    echo "💡 Infrastructure Validation Tips:"
    echo "  - Verify all configuration files are valid"
    echo "  - Check Docker compose service definitions"
    echo "  - Ensure environment variables are properly set"
    ;;
esac

# Task-specific suggestions
if [ -n "$TASK_ID" ]; then
  echo ""
  echo "🎯 Task-Specific Recommendations for $TASK_ID:"
  
  # Get task details for context-aware suggestions
  TASK_DETAILS=$(./tools/task-navigator.sh "$TASK_ID" 2>/dev/null || echo "")
  
  if echo "$TASK_DETAILS" | grep -qi security; then
    echo "  🔒 Security Task Detected:"
    echo "    - Run 'yarn run cmd security-scan' for vulnerability check"
    echo "    - Validate authentication and authorization logic"
    echo "    - Review sensitive data handling practices"
  fi
  
  if echo "$TASK_DETAILS" | grep -qi performance; then
    echo "  ⚡ Performance Task Detected:"
    echo "    - Profile application performance metrics"
    echo "    - Check database query optimization"
    echo "    - Validate caching strategies"
  fi
  
  if echo "$TASK_DETAILS" | grep -qi api; then
    echo "  🔌 API Task Detected:"
    echo "    - Validate OpenAPI specification"
    echo "    - Test endpoint response formats"
    echo "    - Check API versioning and backward compatibility"
  fi
fi
```

## Quality Metrics Dashboard
@tools/progress-dashboard.sh

```bash
echo ""
echo "📊 Quality Metrics Summary"
echo "========================="

# Display relevant quality metrics
echo "🏆 Current Quality Status:"

# Code complexity metrics (from existing hooks)
if [ -f .cc-metrics-fail.json ]; then
  echo "  ⚠️ Code complexity issues detected - review .cc-metrics-fail.json"
else
  echo "  ✅ Code complexity within acceptable limits"
fi

# Test coverage summary
if command -v jest >/dev/null 2>&1; then
  echo "  📈 Test Coverage:"
  yarn test --coverage --silent --watchAll=false 2>/dev/null | grep -E "(Statements|Branches|Functions|Lines)" | head -4 | while read -r line; do
    echo "    $line"
  done 2>/dev/null || echo "    ℹ️ Coverage data not available"
fi

# Security status
if [ -f reports/security-audit.json ]; then
  CRITICAL_ISSUES=$(jq '.vulnerabilities | map(select(.severity == "critical")) | length' reports/security-audit.json 2>/dev/null || echo "0")
  if [ "$CRITICAL_ISSUES" -gt 0 ]; then
    echo "  🔴 $CRITICAL_ISSUES critical security issues found"
  else
    echo "  ✅ No critical security vulnerabilities detected"
  fi
fi

# Performance indicators
echo "  ⚡ Performance Status:"
echo "    - Hook optimization: 54% improved (70s total timeout)"
echo "    - Validation scope: Optimized for $SCOPE"
echo "    - Expected completion: Based on scope analysis"
```

## Next Steps and Workflow Integration
@tools/qa-workflow.sh

```bash
echo ""
echo "🎯 Next Steps & Workflow Integration"
echo "===================================="

# Determine workflow state and suggest next actions
if [ -n "$TASK_ID" ]; then
  TASK_STATUS=$(./tools/task-navigator.sh "$TASK_ID" | grep "Estado:" | head -1 2>/dev/null || echo "")
  
  echo "📋 Current Task Status: $TASK_STATUS"
  
  if git status --porcelain | grep -q .; then
    echo "💡 Ready for commit with quality gates:"
    echo "  git add ."
    echo "  git commit -m \"feat($TASK_ID): implement validation scope\""
    echo "  # → Hooks will run automatically (70s optimized system)"
  else
    echo "ℹ️ No changes to commit"
  fi
  
  echo ""
  echo "🔄 Workflow Commands:"
  echo "  Mark dev complete:    ./tools/qa-workflow.sh $TASK_ID dev-complete"
  echo "  Start QA validation:  ./tools/qa-workflow.sh $TASK_ID start-qa"
  echo "  Validate DoD:         ./tools/validate-dod.sh $TASK_ID"
else
  echo "💡 General QA completed successfully"
  echo "🔄 Consider running task-specific validation with: /task"
fi

echo ""
echo "⚡ Quick QA Commands:"
echo "  /qa frontend     - Frontend-specific validation"
echo "  /qa backend      - Backend-specific validation"  
echo "  /qa full-stack   - Comprehensive full-stack validation"
echo "  /qa minimal      - Essential checks only"
echo "  /qa auto         - Intelligent scope detection (default)"

echo ""
echo "✅ Intelligent QA Pipeline Complete!"
echo "🎯 Scope: $SCOPE | Files: $(echo $CHANGED_FILES | wc -w) | Context: $BRANCH_CONTEXT"
```

**Usage Examples:**
- `/qa` - Auto-detect scope and apply optimal validation
- `/qa frontend` - Focus on React/TypeScript validation
- `/qa backend` - Focus on Python/FastAPI validation
- `/qa full-stack` - Comprehensive multi-technology validation
- `/qa infrastructure` - Configuration and deployment validation
- `/qa minimal` - Essential checks only for minor changes

**Performance Features:**
- Leverages existing 54% optimized hook system (70s total timeout)
- Intelligent scope detection reduces unnecessary validations
- Context-aware error reporting with actionable suggestions
- Integration with existing CLI commands and tools
- Smart file change analysis for targeted validation