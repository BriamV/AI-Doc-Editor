# Forensic Validation Plan - RF-003 Comprehensive Fixes

## Validation Objective
Systematic validation of all RF-003 fixes with forensic evidence and traceability according to PRD-QA CLI RF-004 specifications.

## MegaLinter Complete Coverage (Per PRD-QA CLI RF-004)

### Error Detection Dimension - MegaLinter Orquestando:
- **ESLint**: Frontend (TS/React) - .ts, .tsx, .js, .jsx files
- **Prettier**: Code formatting - All supported file types
- **Pylint**: Backend (Python) - .py files  
- **Black**: Python formatting - .py files
- **ShellCheck**: Tooling (.cjs, .sh) - Shell scripts
- **Plus**: CSS (Stylelint), YAML (Yamllint), HTML (HTMLHint), Markdown (MarkdownLint)

### Expected Violation Types Post-Fix:
```
✅ TypeScript/JavaScript: ESLint violations (.ts, .tsx, .js, .jsx)
✅ Python: Pylint + Black violations (.py)
✅ Shell Scripts: ShellCheck violations (.sh, .cjs)
✅ CSS: Stylelint violations (.css)
✅ YAML: Yamllint violations (.yml, .yaml)
✅ HTML: HTMLHint violations (.html)
✅ Markdown: MarkdownLint violations (.md)
✅ Prettier: Formatting violations (all file types)
```

## Forensic Validation Matrix

### Test 1: Tool Detection Consistency
**Objective**: Verify snyk, black, pylint detection consistency
**Evidence**: Tool detection logs before/after fix
**Success Criteria**: Consistent detection across multiple runs

### Test 2: Virtual Environment Logging
**Objective**: Verify unified venv detection messages
**Evidence**: EnvironmentChecker logs showing consistent messaging
**Success Criteria**: No contradiction between initial and tool-specific messages

### Test 3: Multi-Language MegaLinter Parsing
**Objective**: Verify ALL linter types are parsed (not just Python/Markdown)
**Evidence**: QA CLI output showing violations from all file types in current branch
**Expected Coverage**:
- CSS violations from coverage/*.css files
- YAML violations from .github/workflows/*.yml files  
- JavaScript violations from scripts/qa/**/*.cjs files
- Python violations from backend/**/*.py files
- Markdown violations from docs/**/*.md files

### Test 4: Branch Filtering Context
**Objective**: Verify fast mode only analyzes modified files
**Evidence**: MegaLinter execution logs showing VALIDATE_ONLY_CHANGED_FILES=true
**Success Criteria**: Only branch-modified files analyzed in fast mode

### Test 5: Mode System Scalability  
**Objective**: Verify all modes (fast/automatic/scope/dod/dimension) work correctly
**Evidence**: getModeConfig() output for each mode
**Success Criteria**: Each mode has appropriate MegaLinter configuration

## Validation Execution Plan

### Phase 1: Pre-Execution Evidence Collection
1. Document current branch modified files
2. Identify expected violation types per file type
3. Establish baseline for comparison

### Phase 2: Full QA CLI Execution
1. Execute `yarn run cmd qa --fast` with comprehensive logging
2. Capture all output streams (stdout, stderr, log files)
3. Document execution time and context

### Phase 3: Forensic Analysis
1. Parse and categorize all violations found
2. Verify against expected coverage matrix
3. Validate tool detection consistency
4. Confirm branch filtering effectiveness

### Phase 4: Traceability Documentation
1. Before/after comparison
2. Issue resolution evidence
3. Architecture compliance verification
4. Performance impact assessment

## Evidence Collection Strategy

### Log Retention
- Full execution log: `systematic-validation/full-execution-validation.log`
- Tool detection analysis: `systematic-validation/tool-detection-forensics.log`
- Violation categorization: `systematic-validation/violation-coverage-analysis.log`
- Mode configuration proof: `systematic-validation/mode-system-validation.log`

### Success Metrics
- **Tool Detection**: 100% consistency across runs
- **MegaLinter Coverage**: ALL file types in branch show violations when present
- **Branch Filtering**: Only modified files analyzed in fast mode
- **Mode System**: All 5 modes properly configured
- **Performance**: No significant regression in execution time

## Next Action
Execute systematic validation with forensic logging and evidence collection for complete traceability.