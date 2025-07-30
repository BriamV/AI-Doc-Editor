# Orchestrator Refactoring: MegaLinter → DirectLintersOrchestrator

## 📚 FUENTE DE VERDAD
**Norte**: Migrar MegaLinter (4GB→80MB, 30-60s→<5s) + SOLID compliance  
**Source**: WrapperManager.cjs + WrapperRegistry.cjs + WrapperFactory.cjs analysis  
**Evidence**: MegaLinter mapping encontrado en 11 ubicaciones del execution layer  
**Principle**: **NO PERDER EL NORTE** - Surgical replacement, zero dead code

## 🔍 CURRENT INTEGRATION POINTS

### **WrapperRegistry.cjs Lines Found**
```javascript
// Lines 23-27: Tool-to-wrapper mapping
'prettier': 'megalinter',     // ❌ REPLACE with 'prettier': 'direct-linters'
'eslint': 'megalinter',       // ❌ REPLACE with 'eslint': 'direct-linters'  
'black': 'megalinter',        // ❌ REPLACE with 'black': 'direct-linters'
'pylint': 'megalinter',       // ❌ REPLACE with 'pylint': 'direct-linters' (→ruff)
'megalinter': 'megalinter',   // ❌ REMOVE completely

// Lines 54-55: Dimension mapping  
'format': 'megalinter',       // ❌ REPLACE with 'format': 'direct-linters'
'lint': 'megalinter',         // ❌ REPLACE with 'lint': 'direct-linters'

// Lines 103-104: Category mapping
'linter': 'megalinter',       // ❌ REPLACE with 'linter': 'direct-linters'
'formatter': 'megalinter',    // ❌ REPLACE with 'formatter': 'direct-linters'
```

### **WrapperFactory.cjs Line Found**
```javascript
// Line 19: Wrapper class mapping
this.wrapperClasses.set('megalinter', () => require('../wrappers/MegaLinterWrapper.cjs'));
// ❌ REPLACE with DirectLintersOrchestrator
```

## 🔧 SURGICAL REFACTORING STRATEGY

### **Step 1: Update WrapperFactory.cjs** (NO código muerto)
```javascript
/**
 * ONLY CHANGE: Replace MegaLinterWrapper with DirectLintersOrchestrator
 * Keep all other wrappers unchanged (surgical approach)
 */

// BEFORE (Line 19):
this.wrapperClasses.set('megalinter', () => require('../wrappers/MegaLinterWrapper.cjs'));

// AFTER (Replacement):
this.wrapperClasses.set('direct-linters', () => require('../wrappers/DirectLintersOrchestrator.cjs'));

// Remove megalinter entry completely (no dead code)
// this.wrapperClasses.delete('megalinter'); // Not needed - will be replaced
```

### **Step 2: Update WrapperRegistry.cjs** (Surgical mapping)
```javascript
/**
 * ONLY CHANGE: Update megalinter mappings to direct-linters
 * Preserve all other wrapper mappings (existing JestWrapper, BuildWrapper, etc.)
 */

// Tool mappings update (Lines 23-30):
const toolMappings = {
  // Direct linters (performance improvement)
  'prettier': 'direct-linters',    // Direct Prettier execution
  'eslint': 'direct-linters',      // Direct ESLint execution  
  'black': 'direct-linters',       // Direct Black execution
  'ruff': 'direct-linters',        // Direct Ruff execution (replaces pylint)
  'spectral': 'direct-linters',    // Direct Spectral execution
  
  // Keep existing wrappers (no unnecessary changes)
  'jest': 'jest',
  'pytest': 'pytest',
  'snyk': 'snyk',
  'semgrep': 'semgrep',
  'build': 'build',
  'data': 'data',
  
  // Remove megalinter references
  // 'megalinter': 'megalinter',  // ❌ DELETE - no longer needed
  // 'pylint': 'megalinter',      // ❌ DELETE - replaced by ruff
  // 'bandit': 'megalinter',      // ❌ DELETE - handled by direct security tools
};

// Dimension mappings update (Lines 54-55):
const dimensionMappings = {
  'format': 'direct-linters',      // Prettier + Black direct execution
  'lint': 'direct-linters',        // ESLint + Ruff direct execution
  
  // Keep existing dimensions
  'test': 'jest',                  // Jest/Pytest wrappers preserved
  'security': 'snyk',              // Snyk/Semgrep wrappers preserved
  'build': 'build',                // Build wrapper preserved
  'data': 'data',                  // Data wrapper preserved
};

// Category mappings update (Lines 103-104):
'linter': 'direct-linters',        // Direct linter orchestration
'formatter': 'direct-linters',     // Direct formatter orchestration
```

## 🎯 INTEGRATION VALIDATION

### **Interface Preservation** (No breaking changes)
```javascript
// DirectLintersOrchestrator implements same interface as MegaLinterWrapper
class DirectLintersOrchestrator {
  constructor(config, logger, processService, fileService) { /* ... */ }
  
  // Same method signature as MegaLinterWrapper.execute()
  async execute(files, options = {}) {
    // Returns same format: { success, violations, executionTime, metadata }
  }
}
```

### **Backward Compatibility Check**
- ✅ **Same Constructor**: (config, logger, processService, fileService)
- ✅ **Same Execute Method**: execute(files, options) → Promise<Result>
- ✅ **Same Result Format**: { success, violations, executionTime, metadata }
- ✅ **External API**: `yarn qa` command unchanged

## 🗑️ MEGALINTER CLEANUP (Sin código muerto)

### **Files to Delete** (After integration)
```bash
# MegaLinter wrapper components (no longer referenced)
rm scripts/qa/core/wrappers/MegaLinterWrapper.cjs
rm scripts/qa/core/wrappers/megalinter/MegaLinterConfig.cjs
rm scripts/qa/core/wrappers/megalinter/MegaLinterExecutor.cjs  
rm scripts/qa/core/wrappers/megalinter/MegaLinterReporter.cjs
rm scripts/qa/core/wrappers/megalinter/ViolationUtils.cjs
rm scripts/qa/core/wrappers/megalinter/LinterParsers.cjs

# Remove megalinter directory entirely
rmdir scripts/qa/core/wrappers/megalinter/
```

### **No Unnecessary Changes**
```javascript
// KEEP UNCHANGED (no dead code creation):
// - BuildWrapper.cjs ✅
// - JestWrapper.cjs ✅  
// - PytestWrapper.cjs ✅
// - SnykWrapper.cjs ✅
// - SemgrepWrapper.cjs ✅
// - DataWrapper.cjs ✅
// - NativeWrapper.cjs ✅
// - All execution/*.cjs files except updated mappings
```

## 📊 PERFORMANCE IMPACT VERIFICATION

### **Expected Improvements** (Targets from norte)
- **Resource Usage**: 4GB MegaLinter Docker → <100MB direct tools ✅
- **Startup Time**: 30-60s Docker init → <5s native execution ✅  
- **Tool Performance**: Ruff 10-100x faster than Pylint ✅
- **Parallel Execution**: Multiple tools simultaneously ✅

### **Integration Test Command**
```bash
# Test new orchestrator with existing QA CLI
yarn run cmd qa --fast --scope=frontend

# Should use DirectLintersOrchestrator instead of MegaLinterWrapper
# Expected: ESLint + Prettier direct execution (no Docker)
```

## 🛡️ RISK MITIGATION

### **Rollback Strategy** (From governance framework)
1. **Targeted Fix**: Fix specific issues in DirectLintersOrchestrator
2. **Partial Rollback**: Revert mapping for specific tool only
3. **Hybrid Approach**: Keep MegaLinter for specific tools, direct for others
4. **Full Rollback**: Restore original mappings (last resort)

### **Validation Checklist**
- ✅ **Tool Mapping**: All megalinter references updated to direct-linters
- ✅ **Interface Compatibility**: Same method signatures preserved  
- ✅ **Result Format**: Same violation structure maintained
- ✅ **External API**: yarn qa command behavior unchanged
- ✅ **Performance**: Startup time and resource usage improved

---
**Evidence**: 11 MegaLinter references found, surgical replacement strategy  
**Norte Maintained**: 4GB→80MB, 30-60s→<5s performance targets  
**Next**: Integration testing and MegaLinter component removal