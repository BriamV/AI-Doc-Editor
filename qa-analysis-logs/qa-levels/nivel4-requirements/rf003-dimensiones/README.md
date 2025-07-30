# RF-003: Validación por Dimensiones de Calidad

## Estructura Modular

Este directorio contiene la validación sistemática de las 6 dimensiones de calidad del QA CLI:

### 📁 error-detection/
**Dimensión 1: Detección de Errores**
- QA CLI: `--dimension=error-detection`
- Herramientas directas: prettier, eslint, compiladores
- Validación cruzada: frontend (TS/React), backend (Python), infraestructura (.sh/.cjs)

### 📁 testing-coverage/
**Dimensión 2: Testing & Coverage**
- QA CLI: `--dimension=testing`
- Herramientas directas: jest, pytest, cypress
- Métricas: cobertura de código, calidad de tests

### 📁 build-dependencies/
**Dimensión 3: Build & Dependencies**
- QA CLI: `--dimension=build`
- Herramientas directas: tsc, yarn, pip
- Validación: compilación, resolución de dependencias

### 📁 security-audit/
**Dimensión 4: Security & Audit**
- QA CLI: `--dimension=security`
- Herramientas directas: snyk, audit, bandit
- Análisis: vulnerabilidades, licencias, seguridad

### 📁 data-compatibility/
**Dimensión 5: Data & Compatibility**
- QA CLI: `--dimension=compatibility`
- Herramientas directas: spectral, validators
- Validación: APIs, esquemas, compatibilidad

### 📁 design-metrics/
**Dimensión 6: Design Metrics**
- QA CLI: `--dimension=design`
- Herramientas directas: madge, radon, complexity analyzers
- Métricas: complejidad, LOC, mantenibilidad
- Umbrales PRD: Complejidad ≤10🟢, LOC ≤212🟢, Líneas ≤100 chars

## Metodología de Validación

1. **QA CLI Individual**: Cada dimensión ejecutada individualmente
2. **Herramientas Directas**: Cross-stack validation (Frontend/Backend/Infra)
3. **Validación Cruzada**: Comparación de resultados y detección de discrepancias
4. **Análisis Comparativo**: Síntesis y recomendaciones

## Estados de Ejecución

- ✅ **Completo**: Validación QA CLI + Directa + Cross-validation + Análisis
- 🔄 **En Progreso**: Ejecutando validaciones
- ⏸️ **Pendiente**: No iniciado
- ❌ **Falló**: Errores en ejecución

## Archivos Legacy

- `../nivel4-rf003-legacy.log`: Contenido original incorrecto (RF-005)
- `../nivel4-rf003-direct.log`: Validación cruzada parcial anterior