# Wrapper Architecture Design: Direct Linters Plugin System

## 📚 FUENTE DE VERDAD
**Source**: `docs/adr/ADR-009-qa-cli-direct-linters-architecture.md`  
**Evidence**: Migration MegaLinter → Direct Linters orchestration

## 🎯 OBJETIVO
Diseñar arquitectura plugin-based para Direct Linters que cumpla SOLID principles + dependency injection

## 🏗️ ARCHITECTURAL PRINCIPLES

### **Stack-Specific Tools** (from ADR-009:27-32)
```
JavaScript/TypeScript: ESLint flat config + Prettier
Python: Ruff (10-100x faster) + Black  
Documentation: markdownlint-cli2
Configuration: yamllint + jsonlint
Tooling Scripts: ESLint flat config (.cjs) + ShellCheck (.sh)
```

### **Architecture Goals** (from ADR-009:34-38)
- ✅ Orquestador inteligente nativo en Node.js
- ✅ Auto-detección de stacks por proyecto  
- ✅ Configuración nativa por herramienta (no Docker wrapper)
- ✅ Ejecución paralela con control de concurrencia

## 🔧 WRAPPER ARCHITECTURE DESIGN

### **Core Interfaces** (SOLID-Compliant)

```javascript
// Base wrapper interface (ISP compliant)
interface IBaseLinterWrapper {
  getName(): string;
  getVersion(): string;
  isAvailable(): Promise<boolean>;
}

// Execution interface (separated by ISP)
interface ILinterExecutor {
  execute(files: string[], options: LinterOptions): Promise<LinterResult>;
  validateConfig(): Promise<boolean>;
}

// Configuration interface (separated by ISP)  
interface ILinterConfig {
  getConfigPath(): string;
  loadConfig(): Promise<LinterConfiguration>;
  validateConfig(): Promise<ValidationResult>;
}

// Result interface (separated by ISP)
interface ILinterReporter {
  formatResults(results: LinterResult[]): Promise<FormattedReport>;
  saveReport(report: FormattedReport, path: string): Promise<void>;
}
```

### **Concrete Wrapper Implementations**

```javascript
// ESLint Wrapper (SRP compliant)
class ESLintWrapper implements IBaseLinterWrapper, ILinterExecutor, ILinterConfig {
  constructor(
    private configService: IConfigService,
    private fileService: IFileService,
    private logger: ILogger
  ) {}
  
  getName(): string { return 'eslint'; }
  async execute(files: string[]): Promise<LinterResult> {
    // Direct ESLint execution with flat config
    // No Docker overhead - native Node.js execution
  }
}

// Ruff Wrapper (SRP compliant)  
class RuffWrapper implements IBaseLinterWrapper, ILinterExecutor, ILinterConfig {
  constructor(
    private configService: IConfigService,
    private processService: IProcessService,
    private logger: ILogger
  ) {}
  
  getName(): string { return 'ruff'; }
  async execute(files: string[]): Promise<LinterResult> {
    // Direct Ruff execution - 10-100x faster than Pylint
  }
}
```

### **Plugin Registry System** (OCP compliant)

```javascript
// Plugin registry for extensibility (Open/Closed Principle)
class LinterWrapperRegistry {
  private wrappers: Map<string, IBaseLinterWrapper> = new Map();
  
  register(wrapper: IBaseLinterWrapper): void {
    this.wrappers.set(wrapper.getName(), wrapper);
  }
  
  // Easy addition of new linters without modifying existing code
  getWrapper(name: string): IBaseLinterWrapper | undefined {
    return this.wrappers.get(name);
  }
  
  getAllWrappers(): IBaseLinterWrapper[] {
    return Array.from(this.wrappers.values());
  }
}
```

### **Dependency Injection Container** (DIP compliant)

```javascript
// DI Container for wrapper dependencies
class DIContainer {
  private services: Map<string, any> = new Map();
  
  // Register services (interfaces, not concrete classes)
  register<T>(token: string, implementation: T): void {
    this.services.set(token, implementation);
  }
  
  // Resolve dependencies automatically
  resolve<T>(token: string): T {
    return this.services.get(token);
  }
  
  // Create wrapper with all dependencies injected
  createWrapper(wrapperType: new(...args: any[]) => IBaseLinterWrapper): IBaseLinterWrapper {
    // Auto-inject dependencies based on constructor parameters
  }
}
```

## 🚀 ORCHESTRATOR REFACTORING

### **New Direct Linters Orchestrator**

```javascript
class DirectLintersOrchestrator implements IQAOrchestrator {
  constructor(
    private registry: LinterWrapperRegistry,
    private stackDetector: IStackDetector,
    private executionController: IExecutionController,
    private logger: ILogger
  ) {}
  
  async execute(options: QAOptions): Promise<QAResult> {
    // 1. Auto-detect project stacks
    const stacks = await this.stackDetector.detectStacks();
    
    // 2. Select appropriate wrappers
    const wrappers = this.selectWrappers(stacks);
    
    // 3. Execute in parallel with concurrency control
    const results = await this.executionController.executeParallel(wrappers, options);
    
    // 4. Aggregate results
    return this.aggregateResults(results);
  }
  
  private selectWrappers(stacks: DetectedStack[]): IBaseLinterWrapper[] {
    const selectedWrappers: IBaseLinterWrapper[] = [];
    
    for (const stack of stacks) {
      switch (stack.type) {
        case 'javascript':
        case 'typescript':
          selectedWrappers.push(
            this.registry.getWrapper('eslint'),
            this.registry.getWrapper('prettier')
          );
          break;
        case 'python':
          selectedWrappers.push(
            this.registry.getWrapper('ruff'),
            this.registry.getWrapper('black')
          );
          break;
        case 'markdown':
          selectedWrappers.push(this.registry.getWrapper('markdownlint-cli2'));
          break;
        // More stacks...
      }
    }
    
    return selectedWrappers.filter(w => w !== undefined);
  }
}
```

## 📊 PERFORMANCE TARGETS

### **Resource Usage** (from ADR-009:43-44)
- **Before**: 4GB Docker overhead
- **Target**: <100MB native tools  
- **Improvement**: 50x reduction in resource usage

### **Startup Time**
- **Before**: 30-60s Docker initialization
- **Target**: <5s native execution
- **Improvement**: 10x speed improvement

### **Execution Efficiency**
- **Ruff vs Pylint**: 10-100x faster (per ADR evidence)
- **ESLint**: Direct execution without Docker layers
- **Parallel Execution**: Concurrency control for optimal performance

## 🛡️ SOLID COMPLIANCE VALIDATION

### **Single Responsibility Principle (SRP)**
- ✅ Each wrapper: Single linter responsibility
- ✅ Orchestrator: Only orchestration logic
- ✅ Registry: Only wrapper management
- ✅ DI Container: Only dependency injection

### **Open/Closed Principle (OCP)**  
- ✅ New linters: Add without modifying existing code
- ✅ Plugin architecture: Extensible system
- ✅ Interface-based: Closed for modification, open for extension

### **Interface Segregation Principle (ISP)**
- ✅ Separated interfaces: IBaseLinterWrapper, ILinterExecutor, ILinterConfig, ILinterReporter
- ✅ Client-specific: Clients only depend on methods they use
- ✅ Small interfaces: 2-4 methods per interface

### **Dependency Inversion Principle (DIP)**
- ✅ Depends on abstractions: IConfigService, IFileService, ILogger
- ✅ DI Container: Automatic dependency injection
- ✅ No hardcoded dependencies: All injected through constructor

## 🔄 MIGRATION STRATEGY

### **Configuration Migration** (from ADR-009:59-63)
- **Legacy**: `.mega-linter.yml` → **discontinued** post-migration
- **Native Configs**: `eslint.config.js`, `pyproject.toml`, `.pylintrc`
- **Rules Preservation**: complexity≤10, max-lines≤212, max-len≤100
- **Cleanup**: Remove MegaLinter artifacts after validation

### **Interface Preservation** (from requirements)
- ✅ External API unchanged: `yarn qa` continues working
- ✅ Internal refactoring: Only wrapper implementation changes
- ✅ Backward compatibility: No breaking changes to QA CLI interface

## 📋 SUCCESS CRITERIA

### **Architecture Compliance**
- ✅ SOLID principles: 100% compliant (vs baseline SRP 15/54❌, ISP 4/54❌)
- ✅ Plugin system: Easy addition of new linters
- ✅ Dependency injection: All dependencies properly injected

### **Performance Achievement**
- ✅ Startup time: <5s (vs baseline 30-60s)
- ✅ Resource usage: <100MB (vs baseline 4GB)
- ✅ Execution speed: Direct native execution

### **Functional Preservation**
- ✅ RF-003 compliance: All 6 dimensions working
- ✅ Quality rules: Same thresholds maintained
- ✅ External interface: `yarn qa` unchanged

---
**Evidence**: ADR-009 Direct Linters Architecture decision  
**Next**: FASE 2 Configuration Migration  
**Target**: Plugin-based, SOLID-compliant, high-performance wrapper system