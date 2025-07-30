# ESLint .cjs Files Forensic Investigation

## INVESTIGATION METADATA
- **Date**: 2025-07-23 23:30:00
- **Issue**: 33 .cjs files detected by git but excluded from MegaLinter ESLint violations
- **Investigator**: Claude Code (Evidence-Based Analysis Mode)
- **Objective**: Identify and remediate triple root cause for .cjs exclusion

## BASELINE STATE DOCUMENTATION

### Git Detection Reality
- **Total modified files**: 66 (verified by git diff --name-only | wc -l)
- **.cjs files count**: 33 (verified by git diff --name-only | grep '\.cjs$' | wc -l)
- **Other file types**: .css, .yml, .md, .py, .html, .json

### Sample .cjs Files Detected
1. scripts/qa/core/EnvironmentChecker.cjs
2. scripts/qa/core/Orchestrator.cjs  
3. scripts/qa/core/PlanSelector.cjs
4. scripts/qa/core/environment/ToolChecker.cjs
5. scripts/qa/core/execution/ExecutionController.cjs

### Current ESLint Configuration Analysis
- **Primary config**: eslint.config.js (flat config format)
- **Scope**: Only `files: ['**/*.{ts,tsx}']` - NO .cjs files included
- **Legacy file**: .eslintrc-legacy.json exists (potential conflict)

### MegaLinter Configuration Analysis  
- **Version**: 8.8.0
- **JAVASCRIPT_ES enabled**: YES
- **JAVASCRIPT_ES_USE_ESLINTRC**: false
- **JAVASCRIPT_ES_FILE_EXTENSIONS**: [.js, .jsx, .cjs, .mjs] - .cjs IS included
- **Problem**: MegaLinter ignores USE_ESLINTRC: false setting

### Current Violation Output
- **CSS violations**: Present (coverage/*.css files)
- **YAML violations**: Present (.mega-linter.yml, docs/api-spec/openapi.yml)
- **.cjs violations**: ZERO (despite 33 files modified)

## ROOT CAUSE ANALYSIS

### Problem 1: MegaLinter Bug
- ESLint execution fails with "Invalid option '--eslintrc'" 
- MegaLinter 8.8.0 ignores JAVASCRIPT_ES_USE_ESLINTRC: false
- Results in complete ESLint failure

### Problem 2: ESLint Config Gap
- eslint.config.js configured only for TypeScript files
- .cjs files not in scope even if ESLint executed successfully
- Modern flat config missing .cjs file pattern

### Problem 3: Legacy Config Conflict
- .eslintrc-legacy.json present in root
- May interfere with flat config resolution
- Potential command confusion in MegaLinter

## INVESTIGATION PLAN

### Phase 1: Manual Validation
1. Test ESLint directly on .cjs files with current config
2. Test ESLint with legacy config for comparison
3. Document exact violations expected vs obtained

### Phase 2: MegaLinter Command Analysis
1. Extract exact ESLint command executed by MegaLinter
2. Identify why --eslintrc flag is used despite USE_ESLINTRC: false
3. Document command construction logic

### Phase 3: Triple Fix Implementation
1. Extend eslint.config.js to include .cjs files
2. Override MegaLinter ESLint command construction
3. Resolve legacy config conflicts

### Phase 4: Forensic Validation
1. Execute complete QA CLI run with detailed logging
2. Compare before/after violation detection
3. Validate 33 .cjs files now generate expected violations

## SUCCESS CRITERIA
1. ESLint executes without --eslintrc error
2. 33 .cjs files analyzed and violations reported
3. QA CLI output shows specific .cjs violations  
4. No regressions in other linters
5. All claims backed by logged evidence

---
**Next**: Execute manual ESLint validation to establish violation baseline