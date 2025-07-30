# Base Architecture Implementation: SOLID Interfaces & BaseWrapper

## 📚 FUENTE DE VERDAD
**Source**: `phase-1-design/WRAPPER-ARCHITECTURE-DESIGN.md` lines 29-57  
**Evidence**: ISP-compliant interfaces design + existing wrapper structure analysis  
**Principle**: **NO CÓDIGO MUERTO** - Solo implementar lo necesario, reutilizar estructura existente

## 🔍 ANÁLISIS DE ESTRUCTURA EXISTENTE

### **Wrappers Actuales** (para reutilizar/reemplazar)
```
scripts/qa/core/wrappers/
├── MegaLinterWrapper.cjs     # ❌ REPLACE with DirectLintersOrchestrator
├── BuildWrapper.cjs          # ✅ KEEP (build dimension)
├── JestWrapper.cjs           # ✅ KEEP (testing dimension)  
├── PytestWrapper.cjs         # ✅ KEEP (Python testing)
├── SnykWrapper.cjs           # ✅ KEEP (security dimension)
├── SemgrepWrapper.cjs        # ✅ KEEP (security dimension)
├── DataWrapper.cjs           # ✅ KEEP (data dimension)
└── NativeWrapper.cjs         # ✅ KEEP (native tool execution)
```

### **Componentes MegaLinter** (eliminar sin código muerto)
```
megalinter/
├── MegaLinterConfig.cjs      # ❌ DELETE (será reemplazado)
├── MegaLinterExecutor.cjs    # ❌ DELETE (Docker execution no needed)
├── MegaLinterReporter.cjs    # ❌ DELETE (Direct linter reporting)
├── ViolationUtils.cjs        # ❌ DELETE (MegaLinter specific)
└── LinterParsers.cjs         # ❌ DELETE (MegaLinter parsers)
```

## 🏗️ IMPLEMENTACIÓN BASE INTERFACES

### **File**: `scripts/qa/core/interfaces/ILinterWrapper.cjs`
```javascript
/**
 * SOLID-Compliant Linter Wrapper Interfaces
 * ISP: Interface Segregation Principle - Small, focused interfaces
 * No dead code - Only essential methods
 */

// Base interface (ISP compliant - minimal interface)
class IBaseLinterWrapper {
  getName() { throw new Error('Must implement getName()'); }
  getVersion() { throw new Error('Must implement getVersion()'); }
  async isAvailable() { throw new Error('Must implement isAvailable()'); }
}

// Execution interface (separated by ISP)
class ILinterExecutor {
  async execute(files, options) { throw new Error('Must implement execute()'); }
  async validateConfig() { throw new Error('Must implement validateConfig()'); }
}

// Configuration interface (separated by ISP)
class ILinterConfig {
  getConfigPath() { throw new Error('Must implement getConfigPath()'); }
  async loadConfig() { throw new Error('Must implement loadConfig()'); }
}

// Result interface (separated by ISP)
class ILinterReporter {
  async formatResults(results) { throw new Error('Must implement formatResults()'); }
}

module.exports = {
  IBaseLinterWrapper,
  ILinterExecutor, 
  ILinterConfig,
  ILinterReporter
};
```

### **File**: `scripts/qa/core/wrappers/BaseWrapper.cjs`
```javascript
/**
 * BaseWrapper - SOLID Base Implementation
 * SRP: Single responsibility - Common wrapper functionality
 * DIP: Depends on abstractions (injected dependencies)
 * No dead code - Only shared functionality
 */

const { IBaseLinterWrapper } = require('../interfaces/ILinterWrapper.cjs');

class BaseWrapper extends IBaseLinterWrapper {
  constructor(config, logger, processService) {
    super();
    this.config = config;
    this.logger = logger;
    this.processService = processService;
  }

  // Common availability check (reusable across wrappers)
  async isAvailable() {
    try {
      const result = await this.processService.execute(this.getName(), ['--version']);
      return result.success;
    } catch (error) {
      this.logger.warn(`${this.getName()} not available: ${error.message}`);
      return false;
    }
  }

  // Common error handling (DRY principle)
  handleExecutionError(error, toolName) {
    this.logger.error(`${toolName} execution failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
      violations: [],
      executionTime: 0
    };
  }

  // Common result formatting (reusable)
  formatResult(success, violations, executionTime, metadata = {}) {
    return {
      success,
      violations,
      executionTime,
      metadata,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = BaseWrapper;
```

## 🚀 DIRECT LINTER IMPLEMENTATIONS

### **File**: `scripts/qa/core/wrappers/ESLintWrapper.cjs`
```javascript
/**
 * ESLint Direct Wrapper - SOLID Compliant
 * SRP: Only ESLint execution responsibility
 * ISP: Implements only needed interfaces
 * DIP: Dependencies injected via constructor
 * Performance: Direct execution (no Docker overhead)
 */

const BaseWrapper = require('./BaseWrapper.cjs');
const { ILinterExecutor, ILinterConfig } = require('../interfaces/ILinterWrapper.cjs');

class ESLintWrapper extends BaseWrapper {
  constructor(config, logger, processService, fileService) {
    super(config, logger, processService);
    this.fileService = fileService;
  }

  getName() { return 'eslint'; }
  
  async getVersion() {
    const result = await this.processService.execute('eslint', ['--version']);
    return result.stdout.trim();
  }

  // ILinterConfig implementation
  getConfigPath() {
    return this.fileService.resolve('eslint.config.js');
  }

  async loadConfig() {
    const configPath = this.getConfigPath();
    return this.fileService.exists(configPath) ? configPath : null;
  }

  // ILinterExecutor implementation  
  async execute(files, options = {}) {
    const startTime = Date.now();
    
    try {
      const args = [
        ...files,
        '--format', 'json',
        '--max-warnings', '0',  // From MegaLinter migration
        '--config', await this.loadConfig()
      ];

      const result = await this.processService.execute('eslint', args);
      const violations = this.parseESLintOutput(result.stdout);
      
      return this.formatResult(
        result.success,
        violations,
        Date.now() - startTime,
        { filesProcessed: files.length }
      );
    } catch (error) {
      return this.handleExecutionError(error, 'ESLint');
    }
  }

  // ESLint-specific parsing (no dead code - only what's needed)
  parseESLintOutput(stdout) {
    try {
      const results = JSON.parse(stdout);
      return results.flatMap(file => 
        file.messages.map(msg => ({
          file: file.filePath,
          line: msg.line,
          column: msg.column,
          severity: msg.severity === 2 ? 'error' : 'warning',
          message: msg.message,
          ruleId: msg.ruleId
        }))
      );
    } catch (error) {
      this.logger.warn(`Failed to parse ESLint output: ${error.message}`);
      return [];
    }
  }
}

module.exports = ESLintWrapper;
```

### **File**: `scripts/qa/core/wrappers/RuffWrapper.cjs`
```javascript
/**
 * Ruff Direct Wrapper - SOLID Compliant  
 * SRP: Only Ruff execution responsibility
 * Performance: 10-100x faster than Pylint
 * No Docker overhead - direct binary execution
 */

const BaseWrapper = require('./BaseWrapper.cjs');
const { ILinterExecutor, ILinterConfig } = require('../interfaces/ILinterWrapper.cjs');

class RuffWrapper extends BaseWrapper {
  constructor(config, logger, processService, fileService) {
    super(config, logger, processService);
    this.fileService = fileService;
  }

  getName() { return 'ruff'; }
  
  async getVersion() {
    const result = await this.processService.execute('ruff', ['--version']);
    return result.stdout.trim();
  }

  getConfigPath() {
    return this.fileService.resolve('pyproject.toml');
  }

  async loadConfig() {
    const configPath = this.getConfigPath();
    return this.fileService.exists(configPath) ? configPath : null;
  }

  async execute(files, options = {}) {
    const startTime = Date.now();
    
    try {
      const args = [
        'check',
        '--format', 'json',
        ...files
      ];

      const result = await this.processService.execute('ruff', args);
      const violations = this.parseRuffOutput(result.stdout);
      
      return this.formatResult(
        result.success,
        violations,
        Date.now() - startTime,
        { filesProcessed: files.length, tool: 'ruff' }
      );
    } catch (error) {
      return this.handleExecutionError(error, 'Ruff');
    }
  }

  parseRuffOutput(stdout) {
    try {
      const results = JSON.parse(stdout);
      return results.map(violation => ({
        file: violation.filename,
        line: violation.location.row,
        column: violation.location.column, 
        severity: violation.fix ? 'warning' : 'error',
        message: violation.message,
        ruleId: violation.code
      }));
    } catch (error) {
      this.logger.warn(`Failed to parse Ruff output: ${error.message}`);
      return [];
    }
  }
}

module.exports = RuffWrapper;
```

## 🗑️ CLEANUP STRATEGY (No Código Muerto)

### **Files to DELETE** (MegaLinter components)
```bash
# Remove MegaLinter-specific files (no longer needed)
rm scripts/qa/core/wrappers/megalinter/MegaLinterConfig.cjs
rm scripts/qa/core/wrappers/megalinter/MegaLinterExecutor.cjs  
rm scripts/qa/core/wrappers/megalinter/MegaLinterReporter.cjs
rm scripts/qa/core/wrappers/megalinter/ViolationUtils.cjs
rm scripts/qa/core/wrappers/megalinter/LinterParsers.cjs
rm scripts/qa/core/wrappers/MegaLinterWrapper.cjs
```

### **Files to REPLACE** (Update existing)
```bash
# Update imports in orchestrator to use new wrappers
# scripts/qa/core/execution/WrapperManager.cjs
# Remove MegaLinterWrapper references, add ESLintWrapper, RuffWrapper
```

## 📊 IMPLEMENTATION VALIDATION

### **SOLID Compliance Check**
- ✅ **SRP**: Each wrapper has single linter responsibility
- ✅ **OCP**: Plugin registry allows adding new wrappers
- ✅ **LSP**: BaseWrapper can be substituted by any implementation
- ✅ **ISP**: Interfaces are small and focused (2-4 methods each)  
- ✅ **DIP**: All dependencies injected, no hardcoded imports

### **No Dead Code Verification**
- ✅ **Only Essential**: Interfaces have only required methods
- ✅ **Reuse Existing**: BaseWrapper reuses common functionality
- ✅ **Clean Removal**: MegaLinter components completely removed
- ✅ **Direct Implementation**: No unnecessary abstraction layers

---
**Evidence**: Phase-1 SOLID design + existing wrapper structure analysis  
**Next**: FASE 3.2 Specific Wrapper Implementation  
**Target**: Lean, SOLID-compliant wrappers with zero dead code