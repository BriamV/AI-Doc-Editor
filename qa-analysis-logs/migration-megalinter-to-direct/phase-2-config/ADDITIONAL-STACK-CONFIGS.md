# Additional Stack Configurations: Direct Linters Setup

## 📚 FUENTE DE VERDAD
**Source**: QA CLI environment check output (líneas del bash anterior)  
**Evidence**: Tools confirmed available in system  
**Objective**: Create configs only for confirmed available tools

## 🔍 CONFIRMED AVAILABLE TOOLS

### **From Environment Check** (QA CLI output)
```
✅ git: 2.48.1
✅ node: 22.15.0  
✅ yarn: 1.22.22
✅ docker: 28.3.2
✅ megalinter: 8.8.0
✅ snyk: 1.297.3
✅ prettier: 1.22.22
✅ eslint: 1.22.22
✅ tsc: 1.22.22
✅ pip: 22.3.1
✅ spectral: 6.15.0 (file-based)
✅ black: 25.1.0
✅ pylint: 3.3.7
```

### **Tools Requiring Configuration**
- ✅ **Prettier**: Already configured via ESLint integration
- ✅ **TypeScript (tsc)**: Existing tsconfig.json
- ✅ **Spectral**: OpenAPI/AsyncAPI linting (6.15.0 confirmed)
- ⚠️ **Additional Tools**: Only configure if explicitly needed

## 🔧 SPECTRAL CONFIGURATION

### **Spectral for API Specifications**
```yaml
# .spectral.yml - OpenAPI/AsyncAPI linting
extends: ["@stoplight/spectral-core"]

rules:
  # OpenAPI rules
  openapi-tags: true
  openapi-operation-operationId: true
  openapi-operation-description: true
  openapi-operation-tags: true
  openapi-parameters: true
  openapi-no-unevaluated-properties: true
  
  # Custom rules aligned with PRD RF-003
  operation-description-length:
    description: Operation descriptions should be meaningful
    message: "Operation description should be at least 10 characters"
    given: "$.paths.*[get,post,put,patch,delete].description"
    then:
      function: length
      functionOptions:
        min: 10

  schema-names-pascal-case:
    description: Schema names should be PascalCase
    message: "Schema names should be PascalCase"
    given: "$.components.schemas.*~"
    then:
      function: pattern
      functionOptions:
        match: "^[A-Z][a-zA-Z0-9]*$"

# File patterns
formats: ["oas2", "oas3", "oas3.0", "oas3.1", "asyncapi2"]
```

### **TypeScript Configuration Enhancement**
```json
// tsconfig.json enhancement (if needed)
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["src/**/*", "backend/**/*"],
  "exclude": ["node_modules", "dist", "build"]
}
```

## 📋 TOOLS NOT REQUIRING ADDITIONAL CONFIG

### **Already Configured**
- ✅ **ESLint**: Enhanced in FASE 2.1 with MegaLinter rules
- ✅ **Prettier**: Integrated via ESLint plugin  
- ✅ **Ruff**: Configured in FASE 2.2 with comprehensive rules
- ✅ **Black**: Existing configuration in pyproject.toml
- ✅ **Git**: Native tool, no config needed
- ✅ **Node/Yarn**: Package manager, no additional config needed

### **Docker Tools to be Replaced**
- ⚠️ **MegaLinter**: Will be replaced by direct linter orchestration
- ⚠️ **Snyk**: Security scanning (keep as direct tool, no config changes needed)

## 🎯 MINIMAL CONFIGURATION APPROACH

### **Philosophy**: "Only Configure What's Needed"
Based on ADR-009 principle of native tool orchestration:

1. **Preserve Existing**: Keep working configurations
2. **Enhance Only**: Add only missing essential configs  
3. **Direct Execution**: No wrapper configurations
4. **Stack-Specific**: Configure per detected stack only

### **Configuration Files Created**
```
.spectral.yml          # API specification linting (if API files present)
eslint.config.js       # ✅ Enhanced (FASE 2.1)
pyproject.toml         # ✅ Enhanced with Ruff (FASE 2.2)
tsconfig.json          # ✅ Existing (no changes needed)
.pylintrc              # ✅ Existing (preserved for gradual migration)
```

## 🔍 STACK DETECTION LOGIC

### **File-Based Configuration Decision**
```javascript
// DirectLintersOrchestrator stack detection
const detectRequiredConfigs = (projectFiles) => {
  const configs = [];
  
  // API specifications detected
  if (projectFiles.some(f => f.match(/\.(json|ya?ml)$/) && 
      f.includes('openapi') || f.includes('swagger'))) {
    configs.push('.spectral.yml');
  }
  
  // Additional configs only if specific files present
  // Avoid over-configuration
  
  return configs;
};
```

## 📊 CONFIGURATION VALIDATION

### **Validation Commands**
```bash
# Spectral validation (if API specs present)
spectral lint docs/api/*.yml

# TypeScript compilation check  
tsc --noEmit

# Prettier formatting check
prettier --check "**/*.{ts,tsx,js,jsx,json,md}"

# All tools integration test
yarn run cmd qa --fast
```

### **Success Criteria**
- ✅ **Minimal Config**: Only essential configurations created
- ✅ **Tool Integration**: All confirmed tools properly configured
- ✅ **No Over-Engineering**: Avoid unnecessary configuration files
- ✅ **Preservation**: Existing working configs maintained

## 🔄 IMPLEMENTATION STATUS

### **Immediate Actions**
1. **Spectral Config**: Create only if API specification files detected
2. **TypeScript**: Verify existing tsconfig.json is sufficient
3. **Integration Test**: Validate all configurations work together

### **Deferred Configurations**
- **Additional Linters**: Only add if specific needs identified
- **Custom Rules**: Only create if baseline coverage insufficient
- **Tool-Specific Configs**: Only for tools requiring configuration

---
**Evidence**: Environment check confirmed 13 available tools  
**Approach**: Minimal configuration, preserve existing, enhance only essentials  
**Next**: FASE 3 SOLID-Compliant Wrapper Implementation