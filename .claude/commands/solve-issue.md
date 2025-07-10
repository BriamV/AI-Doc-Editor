When executing this command, analyze the problem described in "$ARGUMENTS" and follow this exact step-by-step methodology:

### 1. DEEP CONTEXT ANALYSIS AND ACTIVE PROCESS DETECTION

**Current state and process evaluation:**
- Execute `pwd` to confirm current directory
- Execute comprehensive git analysis to detect current process:
  ```bash
  git status --porcelain  # Precise change status
  git branch -v  # Current branch with last commit
  git log --oneline -15 --graph  # Recent history with structure
  git diff --name-status  # Modified vs staged files
  git stash list  # Stashes indicating paused work
  ```

**Intelligent work context detection:**
- Analyze branch name to detect work type:
  - `feature/`, `feat/` → New functionality development
  - `refactor/`, `ref/` → Refactoring process in progress
  - `fix/`, `bugfix/`, `hotfix/` → Already fixing something
  - `chore/`, `docs/`, `test/` → Maintenance tasks
  - `wip/`, `tmp/`, `experiment/` → Experimental work
- Analyze recent commits to understand work scope:
  - Multiple files touched → Massive refactoring or large feature
  - Incremental commits → Iterative development in progress
  - "WIP" or "checkpoint" commits → Paused work in progress
- Examine staged vs modified files to understand workflow

**Impact and scope analysis of the problem:**
```bash
# Detect if problem is within scope of current work
git diff --name-only HEAD~5..HEAD  # Files touched in last 5 commits
git diff --stat  # Change statistics
```

**Detected context categorization:**
1. **NEW PROBLEM** - Clean branch, few changes, isolated problem
2. **PROBLEM IN REFACTORING** - Multiple files, restructuring commits
3. **PROBLEM IN FEATURE** - Feature branch, incremental development
4. **PROBLEM IN FIX** - Already in debugging/fixing process
5. **PROBLEM IN WIP** - Paused work, multiple stashes or WIP commits
6. **CRITICAL PROBLEM** - Can break work in progress, requires special strategy

### 2. EVIDENCE COLLECTION AND ROOT CAUSE ANALYSIS

**Environment context:**
- Execute environment verification commands according to detected stack:
  - Node.js: `node -v && npm -v && cat package.json`
  - Python: `python --version && pip --version && cat requirements.txt`
  - Rust: `rustc --version && cargo --version && cat Cargo.toml`
  - Go: `go version && cat go.mod`
- Read CLAUDE.md if exists to understand project conventions
- Analyze previous attempts:
  - If recent commits related to problem detected: `git show HEAD` to analyze last attempt
  - Search for TODO, FIXME, or HACK comments indicating temporary solutions
  - Review if backup files exist (.bak, .old) indicating previous iterations

**Evidence collection:**
- If specific error reported in $ARGUMENTS: reproduce exact failing command
- If problematic code mentioned in $ARGUMENTS: read complete file using View tool
- Use Grep tool to search for patterns related to the problem described in $ARGUMENTS
- Identify relevant configuration files (.gitignore, .env, configs)

### 3. FIVE WHYS METHODOLOGY ANALYSIS

Apply this methodology systematically:
1. **Why did it fail?** - Identify immediate symptom
2. **Why did that symptom occur?** - Find proximal cause
3. **Why does that cause exist?** - Determine intermediate cause
4. **Why wasn't it prevented?** - Analyze structural cause
5. **Why did the system allow this?** - Identify systemic cause

**Problem categorization:**
- Missing/incompatible dependencies
- Incorrect configuration
- Logic error in code
- Permissions/environment problem
- Version conflicts
- Syntax/typing error

### 4. CONTEXTUAL SIMULATION AND ADAPTIVE STRATEGY

**For complex problems, trigger extended thinking first:**
```
> Think deeply about the problem: "$ARGUMENTS" considering the detected context and work in progress
```

**Then use Think tool for complete analysis:**
```
Think: "COMPLETE CONTEXTUAL ANALYSIS:

DETECTED CONTEXT: [NEW/REFACTORING/FEATURE/FIX/WIP/CRITICAL]

WORK IN PROGRESS:
- Branch: [name and detected type]
- Current scope: [files and components involved in main work]
- Progress: [commit and change analysis]
- Status: [staged, modified, stashed]

REPORTED PROBLEM:
- Description: $ARGUMENTS
- Location: [affected files/components]
- Relationship with work in progress: [ISOLATED/RELATED/BLOCKING/CAUSED_BY]

IMPACT ANALYSIS:
- Can the fix break work in progress? [YES/NO + reasons]
- Does the problem block continuing main work? [YES/NO]
- Is it caused by work in progress changes? [YES/NO]
- Does it require partial rollback? [YES/NO]

RECOMMENDED STRATEGY:
1. [Specific strategy based on context]
2. [Risk mitigation steps]
3. [Restoration plan if it fails]

BRANCHING DECISION:
- [CONTINUE_IN_BRANCH/CREATE_SUBBRANCH/STASH_AND_NEW_BRANCH/COMMIT_WIP]
- Reason: [strategy justification]"
```

**For architectural or complex debugging issues, use intensified thinking:**
- **Complex architectural problems**: `> think harder about the best architectural approach`
- **Intricate debugging**: `> think more about potential root causes and edge cases`
- **Multi-step implementations**: `> think longer about the implementation plan and potential pitfalls`

**Intelligent branching strategies by context:**

**CONTEXT: NEW PROBLEM**
```bash
git checkout -b fix/[issue-description]
```

**CONTEXT: PROBLEM IN REFACTORING**
```bash
# Preserve refactoring work
git add -A && git commit -m "WIP: refactoring checkpoint before fixing issue"
git checkout -b fix/[issue-description]-during-refactor
# Or if small and related:
# Continue in current branch with specific commit
```

**CONTEXT: PROBLEM IN FEATURE**
```bash
# If problem blocks the feature
git add -A && git commit -m "WIP: feature development checkpoint"
git checkout -b fix/[issue-description]-blocking-feature
# If it's part of feature development
# Continue in current branch
```

**CONTEXT: PROBLEM IN FIX**
```bash
# Analyze if it's same problem or new one
if [same problem]; then
    # Continue iterating on solution
    git add -A && git commit -m "Previous fix attempt - checkpoint"
else
    # New problem during fix
    git checkout -b fix/[new-issue]-during-fix
fi
```

**CONTEXT: PROBLEM IN WIP**
```bash
# Evaluate WIP state
if [salvageable WIP]; then
    git add -A && git commit -m "WIP: save current state before fix"
    git checkout -b fix/[issue-description]
else
    git stash push -m "WIP: experimental changes"
    git checkout -b fix/[issue-description]
fi
```

**CONTEXT: CRITICAL PROBLEM**
```bash
# Problem that can corrupt all work
git add -A && git commit -m "CHECKPOINT: before critical fix"
git tag checkpoint-$(date +%Y%m%d-%H%M%S)  # Safety tag
git checkout -b fix/critical-[issue-description]
```

### 5. INTELLIGENT CONTEXTUAL IMPLEMENTATION

**Adaptive execution according to detected context:**

**FOR NEW/ISOLATED CONTEXT:**
- Direct implementation with standard TDD
- Complete validation before merge

**FOR REFACTORING/FEATURE CONTEXT:**
- Minimal implementation that doesn't break work in progress
- Tests focused on not introducing regressions in main work
- Special consideration of interfaces and APIs in development

**FOR FIX IN PROGRESS CONTEXT:**
- Analysis of why previous fix didn't work
- Iterative implementation building on previous work
- Extra validation to ensure this time it works

**FOR WIP/EXPERIMENTAL CONTEXT:**
- Careful preservation of experimental state
- Implementation that allows continuing exploratory work
- Flexibility for rollback without losing exploration

**Contextual dependency management:**
```bash
# Verify fix doesn't break work in progress
npm test 2>/dev/null || yarn test 2>/dev/null  # Main work tests
npm run build 2>/dev/null || yarn build 2>/dev/null  # Main project build

# For refactoring in progress, verify interfaces
if [REFACTORING_CONTEXT]; then
    # Validate interfaces weren't broken
    npm run type-check 2>/dev/null || tsc --noEmit 2>/dev/null
    # Verify refactoring can continue
fi
```

**TDD mandatory strategy:**
1. **Write failing test first**: Create test that reproduces the problem
2. **Implement minimal solution**: Make smallest possible change to pass test  
3. **Refactor and validate**: Improve code while keeping tests green

**Required tests:**
```javascript
// Mandatory test pattern for: $ARGUMENTS
describe('Fix for [$ARGUMENTS]', () => {
  test('normal case: expected behavior works', () => {
    // Arrange: Set up normal conditions
    // Act: Execute functionality
    // Assert: Verify expected result
  });
  
  test('edge case: handles boundary values correctly', () => {
    // Test with extreme values, nulls, empty arrays, etc.
  });
  
  test('error handling: fails gracefully with invalid input', () => {
    // Test that verifies appropriate error handling
  });
  
  test('regression: doesn\'t break existing functionality', () => {
    // Test that verifies fix doesn't introduce new bugs
  });
});
```

**Contextual TDD implementation:**
```javascript
// For NEW PROBLEM
describe('Fix for [PROBLEM] - Isolated Case', () => {
  test('solution works independently', () => {
    // Standard test
  });
});

// For PROBLEM IN REFACTORING  
describe('Fix for [PROBLEM] - During Refactoring', () => {
  test('fix doesn\'t break refactoring in progress', () => {
    // Verify compatibility with refactoring changes
  });
  
  test('refactored interfaces still work', () => {
    // Regression test specific to refactoring
  });
});

// For PROBLEM IN FEATURE
describe('Fix for [PROBLEM] - During Feature Development', () => {
  test('fix allows continuing feature development', () => {
    // Verify feature can continue being developed
  });
  
  test('feature functionality is not affected', () => {
    // Feature + fix integration test
  });
});
```

### 6. VERIFICATION AND QUALITY CONTROL

**Mandatory validation checklist:**
- [ ] Execute the command/code that originally failed
- [ ] Run all tests: find and execute project test command
- [ ] Run linter: find and execute project linting command  
- [ ] Run type checker if applicable: `tsc --noEmit`, `mypy`, etc.
- [ ] Verify no syntax errors were introduced
- [ ] Confirm solution is minimal necessary (KISS principle)
- [ ] Verify follows project code conventions

**Automatic verification commands:**
```bash
# Find and execute project commands
npm run test 2>/dev/null || yarn test 2>/dev/null || python -m pytest 2>/dev/null || cargo test 2>/dev/null || go test ./... 2>/dev/null

npm run lint 2>/dev/null || yarn lint 2>/dev/null || ruff check . 2>/dev/null || cargo clippy 2>/dev/null || golangci-lint run 2>/dev/null
```

### 7. CONTEXTUAL COMMIT AND DOCUMENTATION WITH USER APPROVAL

**CRITICAL: All git add and git commit operations require explicit user approval**

Before any git operation, ask user:
```
"I need to commit these changes to preserve the fix:

Files to be added:
[list files]

Proposed commit message:
[show complete commit message]

Do you approve this commit? Please respond with 'yes' to proceed or 'no' to modify."
```

**Wait for explicit user confirmation before executing any git add or git commit commands.**

**Adaptive commit according to work context:**

```bash
# Context analysis for commit message
git log --oneline -10 --graph  # See workflow
git diff --stat  # See scope of changes

# Only execute after user approval:
# Contextual commit message
git add -A  # ONLY after user approves
git commit -m "$(cat <<'EOF'
fix: [problem description] [CONTEXT]

Context: [NEW/REFACTORING/FEATURE/FIX/WIP] - [branch_name]
Work in progress: [description of main work in progress]
Issue location: [within/outside scope of main work]
Impact on main work: [NONE/MINIMAL/MODERATE/SIGNIFICANT]

Root cause: [identified root cause]
Solution: [changes made]
Compatibility: [how it preserves work in progress]

Previous attempts: [if applicable]
Validation: [context-specific tests]
Next steps: [continue main work/merge/etc]

Fixes: [issue reference]
Related work: [related commits from main work]

🤖 Generated with Claude Code - Context-Aware Fix
Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"  # ONLY after user approves
```

**Post-fix context management:**
```bash
# Post-commit: guidance to continue work
echo "CONTEXT PRESERVATION STATUS:"
echo "✅ Fix applied without breaking work in progress"
echo "📋 Suggested next step: [continue refactoring/feature/etc]"
echo "🔄 To continue main work: git checkout [original_branch]"
```

**Post-fix guidance by context:**
```bash
# For REFACTORING in progress
if [REFACTORING_CONTEXT]; then
    echo "💡 Tip: Consider integrating this fix into refactoring if relevant"
    echo "📁 Refactoring files: [list main files]"
fi

# For FEATURE in development  
if [FEATURE_CONTEXT]; then
    echo "🚀 Fix completed - feature development can continue"
    echo "🧪 Consider adding this scenario to feature tests"
fi

# For FIX in progress
if [FIX_CONTEXT]; then
    echo "🔧 Iterative fix completed - verify if it resolves original issue"
    echo "📊 Main fix progress: [evaluate status]"
fi
```

### 8. FAILURE HANDLING AND ESCALATION

**The command should ONLY fail if:**
1. **Critical dependencies unavailable** requiring manual installation with special permissions
2. **Corrupted system configuration** requiring administrator intervention  
3. **External infrastructure problem** (services down, connectivity)
4. **Security permission restrictions** that cannot be resolved programmatically

**In case of escalation, provide:**
```
ESCALATION REPORT:
====================
ORIGINAL PROBLEM: [exact description]
ANALYSIS COMPLETED: [list of steps executed]
ROOT CAUSE IDENTIFIED: [result of 5 whys analysis]
SOLUTIONS ATTEMPTED: [detailed list with results]
LOGS AND EVIDENCE: [attached files, screenshots, outputs]
RECOMMENDATION: [suggested next step]
WORK BRANCH: [branch name with partial changes]
```

### 9. CLAUDE CODE SPECIFIC OPTIMIZATIONS

**Efficient tool usage:**
- Use Agent tool for complex multi-file searches
- Use View tool for reading specific known files  
- Use Bash tool only for verification/execution commands
- Use Edit tool with sufficient context (5+ lines before/after)
- Use multiple tool calls in parallel when possible

**Extended thinking optimization:**
- Use extended thinking for complex architectural problems, intricate debugging, and multi-step implementations
- Trigger deeper analysis with phrases like "think harder", "think more", "think longer"
- Most valuable for: planning architectural changes, debugging complex issues, evaluating implementation tradeoffs
- Concise responses without unnecessary explanations otherwise
- Use direct tool outputs instead of paraphrasing
- Avoid preambles and summaries unless requested
- Maximize information per token used

---

## INTELLIGENT CONTEXTUAL EXECUTION PATTERN

### For New Problem (clean main/master):
1. **Basic analysis** (2-3 tool calls): Git status, environment, CLAUDE.md
2. **Problem reproduction** (1 tool call): Confirm failure  
3. **Root cause search** (2-3 tool calls): Grep/View relevant files
4. **Plan simulation** (1 Think tool): Validate logic before implementing
5. **Branch setup** (1 tool call): Create specific branch
6. **Direct implementation** (1-2 tool calls): Standard fix
7. **Complete validation** (2-3 tool calls): Tests, linting, verification
8. **User approval for commit** (1 interaction): Request explicit permission
9. **Simple commit** (1 tool call): Standard commit after approval

**Total: 12-18 tool calls + user approval**

### For Problem During Refactoring:
1. **Deep context analysis** (4-5 tool calls): Git history, diff, branch analysis, scope detection
2. **Refactoring work evaluation** (2-3 tool calls): Analysis of modified files, change patterns
3. **Extended thinking for architectural impact**: `> think deeply about how this problem affects the refactoring architecture and potential implementation approaches`
4. **Impact determination** (1 Think tool): How problem affects refactoring
5. **Reproduction in context** (1-2 tool calls): Specific problem vs general refactoring
6. **Contextual root cause search** (3-4 tool calls): Considering refactoring changes
7. **Compatibility simulation** (1 Think tool): Validate fix doesn't break refactoring
8. **Preservative branching strategy** (1-2 tool calls): Preserve refactoring work
9. **Compatible implementation** (2-3 tool calls): Fix that respects interfaces in development
10. **Extended validation** (3-4 tool calls): Tests + refactoring compatibility
11. **User approval for commit** (1 interaction): Request explicit permission
12. **Contextual commit** (1 tool call): Document relationship with refactoring

**Total: 21-32 tool calls + user approval + extended thinking**

### For Problem During Feature Development:
1. **Feature context analysis** (3-4 tool calls): Scope, progress, involved components
2. **Blocking vs non-blocking evaluation** (2-3 tool calls): If it prevents continuing feature
3. **Contextual root cause analysis** (2-3 tool calls): Related to feature development
4. **Feature impact simulation** (1 Think tool): How it affects main development
5. **Integration strategy** (1-2 tool calls): Fix as part of feature vs separate
6. **Integrated implementation** (2-3 tool calls): Considering feature architecture
7. **Feature + fix validation** (3-4 tool calls): Integrated tests
8. **User approval for commit** (1 interaction): Request explicit permission
9. **Feature context commit** (1 tool call): Document relationship with development

**Total: 16-25 tool calls + user approval**

### For Problem During Fix in Progress:
1. **Fix history analysis** (4-5 tool calls): Previous commits, attempted approaches
2. **Failure evaluation** (2-3 tool calls): Deep analysis of previous attempts
3. **Extended thinking for complex failures**: `> think harder about why multiple fix attempts failed and what alternative approaches might work`
4. **Failure pattern identification** (1 Think tool): Why fixes aren't working
5. **New validated approach** (1 Think tool): Different strategy
6. **Solution iteration** (2-3 tool calls): Build on previous work
7. **Iterative implementation** (2-4 tool calls): Different but informed approach
8. **Exhaustive validation** (3-4 tool calls): Extra testing due to failure history
9. **User approval for commit** (1 interaction): Request explicit permission
10. **Complete history commit** (1 tool call): Document entire debugging process

**Total: 17-28 tool calls + user approval + extended thinking**

### For Problem in WIP/Experimental:
1. **Experimental state analysis** (3-4 tool calls): Stashes, WIP commits, experiments
2. **Salvageability evaluation** (2-3 tool calls): What work to preserve vs discard
3. **Preservation strategy** (1 Think tool): How to maintain valuable exploration
4. **WIP state handling** (2-3 tool calls): Stash/commit according to work value
5. **Non-disruptive implementation** (2-3 tool calls): Fix that doesn't kill experimentation
6. **Flexible validation** (2-3 tool calls): Tests that allow continuing WIP
7. **User approval for commit** (1 interaction): Request explicit permission
8. **Preservative commit** (1 tool call): Maintain experimental context

**Total: 14-22 tool calls + user approval**

**Automatic context detection guarantees correct flow and maximum effectiveness.**

---