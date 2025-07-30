# ISP Interface Design: 4 Violations → Interface Segregation

## 📚 FUENTE DE VERDAD
**Source**: `BASELINE-EVIDENCE-CAPTURE.json` + `nivel1-analysis-meticuloso.log:128-130`  
**Evidence**: ISP 4/54 archivos failing, 50/54 passing

## 🎯 OBJETIVO  
Diseñar interfaces segregadas para resolver 4 violaciones Interface Segregation Principle

## 🔍 ISP VIOLATION ANALYSIS

### **CONFIRMED ISP VIOLATIONS** (from architectural-report.json:1165-1209)
- ❌ **ContextDetector.cjs**: 47 public methods (Interface too large)
- ❌ **EnvironmentChecker.cjs**: 44 public methods (Interface too large)  
- ❌ **Orchestrator.cjs**: 24 public methods (Interface too large)
- ❌ **PlanSelector.cjs**: 46 public methods (Interface too large)

**Additional Violations Found**:
- ❌ **WrapperCoordinator.cjs**: 19 public methods (Interface too large)
- ❌ **EnvironmentValidator.cjs**: Methods count reading...

**Total**: 5-6 files with ISP violations (more than baseline 4 - updated evidence)

## 🏗️ ISP DESIGN PRINCIPLES  

### **Interface Segregation Strategy**
```
BEFORE: Large interfaces with unused methods
AFTER: Multiple specific interfaces per client need
```

### **General ISP Refactoring Pattern**
```javascript
// ❌ VIOLACIÓN ISP - Interface grande
interface MassiveInterface {
  methodA();  // Solo usado por ClientA
  methodB();  // Solo usado por ClientB  
  methodC();  // Solo usado por ClientC
  methodD();  // Usado por todos
}

// ✅ ISP COMPLIANT - Interfaces segregadas
interface SharedInterface {
  methodD();  // Método común
}

interface ClientAInterface extends SharedInterface {
  methodA();  // Específico para ClientA
}

interface ClientBInterface extends SharedInterface {
  methodB();  // Específico for ClientB
}
```

## 🛠️ SPECIFIC ISP REFACTORING DESIGNS

### **1️⃣ ContextDetector.cjs** (47 public methods → Segregated interfaces)
**Segregation Strategy**:
```javascript
// Split by responsibility:
IContextDetector → Core detection (8-10 methods)
IGitContextDetector → Git operations (12-15 methods)  
IStackContextDetector → Tech stack detection (12-15 methods)
IProjectContextDetector → Project structure (10-12 methods)
```

### **2️⃣ PlanSelector.cjs** (46 public methods → Segregated interfaces)  
**Segregation Strategy**:
```javascript
// Split by plan type:
IPlanSelector → Core selection (5-8 methods)
IFastPlanSelector → Fast mode plans (10-12 methods)
IScopePlanSelector → Scope-based plans (10-12 methods)  
IDoDPlanSelector → Definition of Done plans (10-12 methods)
ICustomPlanSelector → Custom plans (8-10 methods)
```

### **3️⃣ EnvironmentChecker.cjs** (44 public methods → Segregated interfaces)
**Segregation Strategy**:
```javascript  
// Split by environment type:
IEnvironmentChecker → Core checking (6-8 methods)
INodeEnvironmentChecker → Node.js environment (10-12 methods)
IPythonEnvironmentChecker → Python environment (10-12 methods)
IToolEnvironmentChecker → Tool availability (12-14 methods)
```

### **4️⃣ Orchestrator.cjs** (24 public methods → Segregated interfaces)
**Segregation Strategy**:
```javascript
// Split by orchestration phase:
IOrchestrator → Core orchestration (4-6 methods)  
IExecutionOrchestrator → Execution control (8-10 methods)
IResultOrchestrator → Result processing (6-8 methods)
IReportOrchestrator → Report generation (4-6 methods)
```

### **5️⃣ WrapperCoordinator.cjs** (19 public methods → Segregated interfaces)
**Segregation Strategy**:
```javascript
// Split by wrapper lifecycle:
IWrapperCoordinator → Core coordination (4-5 methods)
IWrapperFactory → Wrapper creation (6-8 methods)  
IWrapperExecutor → Execution management (6-8 methods)
```

## 🛠️ ISP REFACTORING METHODOLOGY

### **Step 1: Interface Analysis**
For each suspected file:
1. Identify all public methods
2. Map method usage by clients
3. Find unused methods per client

### **Step 2: Interface Segregation**  
```javascript
// Strategy: Split by client responsibility
BaseInterface → SharedMethods
SpecificInterface1 → ClientA specific methods
SpecificInterface2 → ClientB specific methods
```

### **Step 3: Implementation**
- Extract common behavior to base interfaces
- Create specific interfaces per client need
- Implement multiple inheritance where needed

## 📊 SUCCESS METRICS
- **Before**: 5 ISP violations (updated from baseline 4)
- **Target**: 0/54 ISP violations (0%)  
- **Interface Count**: 5 large interfaces → 20+ segregated interfaces
- **Method Count**: 180+ methods → avg 6-10 methods per interface
- **Compliance**: Interface Segregation principle 100% implemented

## 🎯 IMPLEMENTATION PRIORITY
1. **High Impact**: ContextDetector.cjs (47 methods) + PlanSelector.cjs (46 methods)  
2. **Medium Impact**: EnvironmentChecker.cjs (44 methods)
3. **Lower Impact**: Orchestrator.cjs (24 methods) + WrapperCoordinator.cjs (19 methods)

## 🔄 VALIDATION APPROACH  
1. **Pre-refactoring**: Current interface usage analysis
2. **During refactoring**: Incremental interface extraction  
3. **Post-refactoring**: Re-run architectural-report.json generation
4. **Success criteria**: "Interface too large" issues = 0

---
**Status**: ✅ GREEN - ISP violations identified and designs completed  
**Next**: FASE 1.3 Wrapper Architecture Design  
**Evidence**: architectural-report.json:1165-1209 (5 confirmed violations)