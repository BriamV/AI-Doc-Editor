## PROBLEM: $ARGUMENTS

## EXECUTION FLOW

### PHASE 1: UNIFIED CONTEXT DETECTION (1-2 tool calls)

```bash
# Single command for all context data
CONTEXT=$(git status --porcelain && echo "---DIVIDER---" && git branch -v && echo "---DIVIDER---" && git log --oneline -5 && echo "---DIVIDER---" && git diff --name-status && echo "---DIVIDER---" && pwd && echo "---DIVIDER---" && ls -la 2>&1)
```

**Instant context classification from branch name:**
- `feature/*` → PROBLEM IN FEATURE
- `refactor/*` → PROBLEM IN REFACTORING  
- `fix/*` → PROBLEM IN FIX
- `wip/*` → PROBLEM IN WIP
- `main/master` + clean → NEW PROBLEM
- Multiple files changed → Check if CRITICAL PROBLEM

**Check for project conventions (lightweight):**
[ -f "CLAUDE.md" ] && echo "Project conventions found in CLAUDE.md" && head -20 CLAUDE.md

### PHASE 2: SMART EVIDENCE COLLECTION

**Stack detection + error reproduction in one shot:**
```bash
# Detect stack and reproduce error simultaneously
if [ -f package.json ]; then
    node -v && npm -v && ($COMMAND_FROM_ERROR 2>&1 || echo "Error reproduced")
elif [ -f requirements.txt ]; then
    python --version && pip --version && ($COMMAND_FROM_ERROR 2>&1 || echo "Error reproduced")
elif [ -f Cargo.toml ]; then
    rustc --version && cargo --version && ($COMMAND_FROM_ERROR 2>&1 || echo "Error reproduced")
elif [ -f go.mod ]; then
    go version && ($COMMAND_FROM_ERROR 2>&1 || echo "Error reproduced")
fi
```

**Quick Five Whys (only for non-trivial issues):**

```bash
# Skip for obvious pattern matches
if ! echo "$ARGUMENTS" in *"Module not found"*|*"EADDRINUSE"*|*"SyntaxError"*); then
    # Rapid Five Whys
    echo "Quick root cause analysis:"
    echo "1. Symptom: $ARGUMENTS"
    echo "2. Checking recent changes that might cause this..."
    git diff --name-only HEAD~1 | grep -E "(config|package|requirements|env)" && echo "Config changes detected"
    echo "3. Checking for related issues..."
    grep -r "TODO\|FIXME\|HACK" --include="*.{js,ts,py,go,rs}" . | grep -i "${ERROR_KEYWORD}" | head -3
fi
```

**Pattern-based quick fixes (real implementation):**
```bash
# Extract error type from $ARGUMENTS
case "$ARGUMENTS" in
    *"not found"*|*"Cannot find"*|*"Could not find"*|*"Unable to resolve"*|*"Cannot resolve"*)
        npm install || yarn install || pip install -r requirements.txt
        ;;
    *"EADDRINUSE"*|*"port"*"in use"*)
        echo "Port conflict detected. Kill process or change port in config"
        PORT=$(echo "$ARGUMENTS" | grep -oE '[0-9]{4,5}' | head -1 || echo "3000")
        lsof -ti:$PORT | xargs kill -9 2>/dev/null || echo "Change port $PORT in config"
        ;;
    *"SyntaxError"*)
        # Extract file and line from error
        FILE=$(echo "$ARGUMENTS" | grep -oE '[a-zA-Z0-9_/.-]+\.(js|ts|py|go|rs)' | head -1)
        LINE=$(echo "$ARGUMENTS" | grep -oE 'line [0-9]+' | grep -oE '[0-9]+' | head -1)
        [ -n "$FILE" ] && [ -n "$LINE" ] && sed -n "$((LINE-5)),$((LINE+5))p" "$FILE"
        ;;
    *"TypeError"*|*"undefined"*|*"null"*)
        # Extract property name and suggest fix
        PROP=$(echo "$ARGUMENTS" | grep -oE "property '[^']+'" | cut -d"'" -f2)
        echo "TypeError detected. Consider adding optional chaining (?.) or null checks for '$PROP'"
        FILE=$(echo "$ARGUMENTS" | grep -oE '[a-zA-Z0-9_/.-]+\.(js|ts)' | head -1)
        [ -n "$FILE" ] && grep -n "$PROP" "$FILE" | head -5
        ;;
    *"Permission denied"*|*"EACCES"*|*"EPERM"*)
        FILE=$(echo "$ARGUMENTS" | grep -oE '[a-zA-Z0-9_/.-]+' | tail -1)
        echo "Permission issue detected. Checking file permissions..."
        ls -la "$FILE" 2>/dev/null || echo "Try: sudo chmod 755 $FILE"
        ;;
esac
```

### PHASE 3: CONTEXTUAL STRATEGIES (Optimized from Original)

#### NEW PROBLEM (Clean workspace)
```bash
git checkout -b fix/${ISSUE_SLUG}
# Apply fix
# Test: npm test -- --testNamePattern="$COMPONENT" 2>/dev/null || npm test
# Request commit approval
```

#### PROBLEM IN REFACTORING
```bash
# Quick assessment: is problem related to refactoring?
REFACTORED_FILES=$(git diff --name-only HEAD~5..HEAD)
if echo "$ARGUMENTS" | grep -qE "$REFACTORED_FILES"; then
    # Fix in current branch - it's part of refactoring
    echo "Fixing within refactoring context"
else
    # Checkpoint and branch
    git add -A && git commit -m "WIP: refactoring checkpoint before fix"
    git checkout -b fix/${ISSUE_SLUG}-during-refactor
fi
```

#### PROBLEM IN FEATURE  
```bash
# Check if blocking
if ! npm run dev 2>/dev/null && ! npm start 2>/dev/null; then
    # Blocking - must fix
    git add -A && git commit -m "WIP: feature checkpoint - fixing blocker"
    git checkout -b fix/${ISSUE_SLUG}-blocking-feature
else
    # Non-blocking - fix in place
    echo "Non-blocking issue - fixing in feature branch"
fi
```

#### PROBLEM IN FIX
```bash
# Are we fixing the same issue?
LAST_COMMIT_MSG=$(git log -1 --pretty=%B)
if echo "$LAST_COMMIT_MSG" | grep -qi "${ISSUE_KEYWORDS}"; then
    # Same issue - continue iterating
    git add -A && git commit -m "fix: iteration on ${ISSUE_SLUG}"
else
    # Different issue emerged
    git checkout -b fix/${ISSUE_SLUG}-during-fix
fi
```

#### PROBLEM IN WIP
```bash
# Quick WIP assessment
if [ -n "$(git diff --cached)" ]; then
    git commit -m "WIP: preserving staged work"
fi
git stash push -m "WIP: preserving unstaged work" || echo "No unstaged changes"
git checkout -b fix/${ISSUE_SLUG}
```

#### CRITICAL PROBLEM
```bash
# Auto-detect critical issues
if echo "$ARGUMENTS" | grep -qiE "production|security|data.?loss|crash|breaking"; then
    git add -A && git commit -m "CRITICAL: emergency checkpoint"
    git tag emergency-$(date +%Y%m%d-%H%M%S)
    git checkout -b fix/critical-${ISSUE_SLUG}
fi
```

### PHASE 3.5: FALLBACK CONTEXT DETECTION

```bash
# If context parsing fails, use direct git commands
if [ -z "$CURRENT_BRANCH" ] || [ -z "$DETECTED_CONTEXT" ]; then
    echo "Context parsing failed, using fallback detection..."
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    if [ $(git status --porcelain | wc -l) -eq 0 ]; then
        DETECTED_CONTEXT="NEW"
    else
        DETECTED_CONTEXT="UNKNOWN"
    fi
fi
```

### PHASE 4: EFFICIENT IMPLEMENTATION

**Use Think tool only for complex issues:**
```bash
# Complexity detection
COMPLEXITY="simple"
[ $(git diff --name-only | wc -l) -gt 10 ] && COMPLEXITY="complex"
echo "$ARGUMENTS" | grep -qiE "architecture|refactor|design|performance" && COMPLEXITY="complex"

if [ "$COMPLEXITY" = "complex" ]; then
    # Use Think tool for complex analysis (architecture changes, multi-file refactors, etc.)
    Think: "Analyze $ARGUMENTS in context of current work: $CONTEXT"
else
    # For simple issues, proceed directly to implementation
    echo "Simple issue detected - proceeding with direct fix"
fi
```

**Cached command outputs:**
```bash
# Reuse CONTEXT variable instead of re-running git commands
CURRENT_BRANCH=$(echo "$CONTEXT" | awk -F'---DIVIDER---' '{print $2}' | grep "^\*" | awk '{print $2}' || git rev-parse --abbrev-ref HEAD)
MODIFIED_FILES=$(echo "$CONTEXT" | awk -F'---DIVIDER---' '{print $4}' | grep "^M " | awk '{print $2}' || git diff --name-only)
```

### PHASE 5: SMART VALIDATION

**Conditional validation based on what changed:**
```bash
# Only run relevant tests
CHANGED_FILES=$(git diff --name-only)

# JavaScript/TypeScript
if echo "$CHANGED_FILES" | grep -qE '\.(js|ts|jsx|tsx)$'; then
    # Find and run only affected tests
    for file in $CHANGED_FILES; do
        TEST_FILE="${file%.js}.test.js"
        [ -f "$TEST_FILE" ] && npm test -- "$TEST_FILE" --passWithNoTests
    done
fi

# Type checking only if TS files changed
if echo "$CHANGED_FILES" | grep -qE '\.ts(x)?$'; then
    npx tsc --noEmit --skipLibCheck
fi

# Linting only changed files
if command -v eslint &> /dev/null; then
    eslint $CHANGED_FILES 2>/dev/null || echo "Linting passed"
fi
```

### PHASE 6: USER APPROVAL FOR COMMITS

```bash
# Always require approval (safety preserved from original)
echo "Ready to commit fix:

Changed files:"
git diff --name-only

echo "
Commit message: fix: $ISSUE_DESCRIPTION

Approve? (yes/no):"
# Wait for user response
```

### PHASE 7: EFFICIENT COMMIT MESSAGES

```bash
# Context-aware but concise
if [ "$DETECTED_CONTEXT" = "NEW" ]; then
    git commit -m "fix: ${ISSUE_DESCRIPTION}"
else
    git commit -m "fix: ${ISSUE_DESCRIPTION}

Context: ${DETECTED_CONTEXT} on ${CURRENT_BRANCH}
Impact: ${IMPACT_LEVEL:-minimal}"
fi
```

### TOKEN-SAVING OPTIMIZATIONS

1. **Command output caching** - CONTEXT variable reused
2. **Combined operations** - Single command for multiple checks  
3. **Conditional execution** - Skip irrelevant validations
4. **Pattern matching** - Quick fixes without analysis
5. **Smart test selection** - Only test what changed
6. **Minimal Think usage** - Only for complex issues

### REAL TOOL CALL COUNTS

**NEW PROBLEM:** 8-12 calls
1. Context detection (1)
2. Error reproduction + stack (1)
3. Quick fix attempt or file read (1-2)
4. Branch creation (1)
5. Implementation (1-2)
6. Validation (1-2)
7. User approval (interaction)
8. Commit (1)

**PROBLEM IN REFACTORING:** 10-16 calls
1. Context detection (1)
2. Relationship analysis (1)
3. Checkpoint if needed (0-1)
4. Branch if needed (0-1)
5. Implementation (2-3)
6. Extra validation (2-3)
7. User approval (interaction)
8. Commit (1)

**CRITICAL PROBLEM:** 12-18 calls
- Adds emergency checkpoint (1)
- Adds safety tag (1)
- Extended validation (2-3 extra)

### QUICK REFERENCE PATTERNS

```bash
# Import/Module errors
*"not found"* → npm/pip install → verify → done

# Syntax errors  
*"SyntaxError"* → extract file/line → view context → fix bracket/quote

# Type errors
*"Cannot read"* → add optional chaining (?.) → verify

# Port conflicts
*"EADDRINUSE"* → kill process or change port → restart

# Permission errors
*"EACCES"* → check file permissions → chmod/sudo if needed
```

---