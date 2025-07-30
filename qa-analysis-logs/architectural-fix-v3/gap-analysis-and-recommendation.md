# GAP ANALYSIS: PRD v2.0 vs Real-World Architecture

## 📋 EXECUTIVE SUMMARY

**GAP IDENTIFICADO**: PRD v2.0 asume proyectos mono-stack, implementación actual resuelve casos multi-stack reales.

**DECISIÓN**: Mantener DirectLintersOrchestrator (arquitectura superior) + Fix bugs + Update PRD.

## 🔍 EVIDENCIA DEL GAP

### PRD v2.0 (Original)
```
ESLintWrapper.cjs  -> ejecuta SOLO eslint
RuffWrapper.cjs    -> ejecuta SOLO ruff  
PrettierWrapper.cjs -> ejecuta SOLO prettier
```

### Realidad de Proyectos
```
AI-Doc-Editor proyecto:
├── src/ (TypeScript/React)     -> necesita eslint + prettier
├── backend/ (Python/FastAPI)  -> necesita ruff + black  
├── scripts/ (CJS/Node)        -> necesita eslint + prettier
└── docs/ (Markdown)           -> necesita prettier
```

**Comando Real**: `yarn qa --dimension=lint`
- **PRD approach**: Ejecutaría SOLO eslint, ignoraría archivos .py
- **Actual approach**: Ejecuta eslint para .js/.ts Y ruff para .py

## 🏗️ ARQUITECTURA SUPERIOR ACTUAL

### DirectLintersOrchestrator (254 LOC)
```javascript
// Intelligent detection based on file types
detectRequiredLinters(files) {
  if (files.some(f => f.match(/\.(js|jsx|ts|tsx)$/))) {
    requiredLinters.push('eslint', 'prettier');
  }
  if (files.some(f => f.match(/\.py$/))) {
    requiredLinters.push('ruff', 'black');
  }
}
```

**Ventajas**:
- ✅ **Multi-stack support**: Un comando valida todo el proyecto
- ✅ **Intelligent detection**: Auto-detecta stack por archivos
- ✅ **Performance**: Ejecución paralela coordinada
- ✅ **UX Superior**: `--dimension=lint` hace lo que el usuario espera

## 🐛 BUG ACTUAL IDENTIFICADO

**Problema**: Cross-tool contamination
```
Input: tool.name = "eslint" (dimensión lint)
Bug: detectRequiredLinters() ignora tool.name
Result: Ejecuta ['ruff', 'black'] en lugar de ['eslint']
```

**Evidencia**:
```
Executing Direct Linters for eslint (lint)
Detected 2 required linters: ruff, black  ❌ WRONG
🟡 ruff not available: Cannot read properties of undefined (reading 'execute')
```

## 🔧 SOLUCIÓN IMPLEMENTADA

**Strategy**: Conditional behavior basado en contexto
```javascript
// Si tool específico solicitado -> ejecutar solo ese tool
if (tool.config && tool.config.dimensionMode && tool.name) {
  requiredLinters = [tool.name];
} else {
  // Multi-stack auto-detection (para comandos generales)
  requiredLinters = this.detectRequiredLinters(files);
}
```

## 📋 PRÓXIMOS PASOS

1. ✅ **Aplicar fix inmediato** al DirectLintersOrchestrator
2. ⏳ **Validar fix con tests**
3. ⏳ **Actualizar PRD v2.0** con arquitectura multi-stack
4. ⏳ **Documentar decisión en ADR**

## 🎯 SUCCESS CRITERIA

- ✅ `yarn qa --dimension=lint` ejecuta SOLO eslint para tool específico
- ✅ `yarn qa` (auto mode) ejecuta multi-stack detection  
- ✅ Performance mantiene <5s execution time
- ✅ SOLID compliance mantenido (SRP by context)

---
**Date**: 2025-07-25T13:45:00Z  
**Status**: Gap confirmed, solution designed, ready for implementation