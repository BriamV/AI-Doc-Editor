# Integración de Workflows - QA CLI System

**Documentación Especializada para T-13, T-14, T-15**

Esta guía cubre las funcionalidades avanzadas de integración en workflows de desarrollo implementadas en el Release 0.4.0 (R0.WP6).

## 📚 Tabla de Contenidos

1. [T-13: Definition of Done (DoD)](#t-13-definition-of-done-dod)
2. [T-14: CI/CD Integration](#t-14-cicd-integration)
3. [T-15: Feedback Mechanism](#t-15-feedback-mechanism)
4. [Casos de Uso Integrados](#casos-de-uso-integrados)
5. [Configuración Avanzada](#configuración-avanzada)

---

## 🎯 T-13: Definition of Done (DoD)

**Implementación**: `scripts/qa/core/modes/DoDMode.cjs`  
**Requisito PRD**: RF-005 (Por Tarea)

### Descripción General

El sistema DoD permite validar código contra criterios específicos de "Definition of Done", mapeando automáticamente etiquetas DoD a conjuntos de dimensiones de validación.

### Activación del Modo DoD

#### 1. Desde Nombre de Rama (Automático)
```bash
# Crear rama con etiqueta DoD
git checkout -b feature/T-25_dod-code-review

# El sistema detecta automáticamente el DoD
yarn run cmd qa
# ✅ DoD tag detected from branch name: code-review
```

#### 2. Desde Línea de Comandos (Explícito)
```bash
# DoD específico por comando
yarn run cmd qa --dod=code-review
yarn run cmd qa --dod=all-tests
yarn run cmd qa --dod=integration
```

#### 3. Desde Archivo qa.json (Configuración)
```json
// qa.json en el proyecto
{
  "dod": "deployment",
  "customThresholds": {
    "coverage": 90,
    "complexity": 8
  }
}
```

### Mapeos DoD Según RF-005

#### `dod:code-review` - Revisión de Código
**Dimensiones ejecutadas:**
- ✅ Error Detection (ESLint, Prettier, Pylint, Black)
- ✅ Design Metrics (Complejidad, LOC, longitud de línea)
- ✅ Security & Audit (Snyk, Semgrep)

**Uso típico:** Pull Requests, revisiones de código

```bash
yarn run cmd qa --dod=code-review
```

**Ejemplo de salida:**
```
[ℹ️] DoD validation (RF-005) for "code-review": [format, lint, security]

[MOTOR DE VALIDACIÓN]
├── ✅ Error Detection (2.1s)
├── ✅ Design Metrics (1.3s)
└── ✅ Security & Audit (3.2s)

[DoD VALIDACIÓN] ✅ COMPLETADA
└── Code Review requirements satisfied (6.6s total)
```

#### `dod:all-tests` - Testing Completo
**Dimensiones ejecutadas:**
- ✅ Build & Dependencies (npm, tsc, pip)
- ✅ Testing & Coverage (Jest, Pytest)
- ✅ Data & Compatibility (Spectral, migraciones)

**Uso típico:** Antes de merge a main, releases

```bash
yarn run cmd qa --dod=all-tests
```

#### DoD Personalizados
```javascript
// Configuración en qa-config.json
{
  "dodMappings": {
    "integration": ["build", "test", "security"],
    "deployment": ["build", "test", "security", "audit"],
    "hotfix": ["format", "test"]
  }
}
```

### Validación de Completitud DoD

El sistema valida automáticamente si se cumplen todos los criterios DoD:

```bash
# Comando de validación específica
yarn run cmd validate-dod --config=code-review
```

**Resultado de validación:**
```json
{
  "dodTag": "code-review",
  "isComplete": true,
  "completionRate": 100,
  "missing": [],
  "requirements": {
    "coverageThreshold": 70,
    "allowWarnings": true,
    "requiresSecurity": true,
    "maxComplexity": 10
  }
}
```

---

## 🔄 T-14: CI/CD Integration

**Implementación**: `.github/workflows/reusable-qa.yml`  
**Requisito PRD**: RNF-004

### Workflow Reutilizable de GitHub Actions

El sistema proporciona un workflow reutilizable que actúa como **QA Gate** en Pull Requests.

#### Configuración Básica

```yaml
# .github/workflows/pr-validation.yml
name: PR Quality Gate

on:
  pull_request:
    branches: [main, develop]

jobs:
  qa-validation:
    uses: ./.github/workflows/reusable-qa.yml
    with:
      mode: 'auto'
      report-format: 'both'
```

#### Configuración Avanzada con DoD

```yaml
# Ejemplo para branches con DoD específico
name: DoD Validation

on:
  pull_request:
    branches: [main]

jobs:
  code-review-dod:
    if: contains(github.head_ref, 'dod-code-review')
    uses: ./.github/workflows/reusable-qa.yml
    with:
      mode: 'dod'
      dod-config: 'code-review'
      
  all-tests-dod:
    if: contains(github.head_ref, 'dod-all-tests')
    uses: ./.github/workflows/reusable-qa.yml
    with:
      mode: 'dod'
      dod-config: 'all-tests'
```

### Parámetros del Workflow

| Parámetro | Descripción | Valores | Default |
|-----------|-------------|---------|---------|
| `mode` | Modo de ejecución | `auto`, `fast`, `dod`, `full` | `auto` |
| `scope` | Directorio/archivo específico | Path válido | `''` |
| `dimension` | Dimensión específica | `format`, `test`, `security`, `build`, `audit` | `''` |
| `dod-config` | Configuración DoD | `code-review`, `all-tests`, custom | `''` |
| `report-format` | Formato de reporte | `console`, `json`, `both` | `both` |
| `node-version` | Versión de Node.js | `18.x`, `20.x` | `20.x` |

### Outputs del Workflow

```yaml
# Usar outputs en workflows dependientes
jobs:
  qa-validation:
    uses: ./.github/workflows/reusable-qa.yml
    
  deploy:
    needs: qa-validation
    if: needs.qa-validation.outputs.qa-passed == 'true'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy
        run: echo "Deploying with ${{ needs.qa-validation.outputs.issues-found }} issues resolved"
```

### Artefactos Generados

El workflow genera automáticamente:
- **Reportes QA**: `qa-report.json`
- **Issues locales**: `qa-reports/issues/`
- **Métricas de rendimiento**: Tiempo de ejecución por dimensión

### Integración Multi-Stack

```yaml
# Soporte completo para Frontend + Backend
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20.x'
    
- name: Setup Python
  uses: actions/setup-python@v5
  with:
    python-version: '3.9'
```

---

## 🐛 T-15: Feedback Mechanism

**Implementación**: `scripts/qa/core/feedback/FeedbackManager.cjs`  
**Requisito PRD**: RF-008

### Sistema de Reporte de Issues

El mecanismo de feedback permite a los usuarios reportar problemas con el sistema QA de manera sistemática.

#### Uso Básico

```bash
# Reportar issue después de un error
yarn run cmd qa --report-issue
```

#### Generación Automática de Reportes

Cuando el QA system encuentra un error, se puede generar automáticamente un reporte:

```bash
# Después de un fallo QA
yarn run cmd qa --dimension=security
# ❌ Error detected

# Generar reporte del problema
yarn run cmd qa --report-issue
```

### Template de Reporte

**Ubicación**: `scripts/qa/templates/report-issue.md`

El template incluye:
- **Información del entorno**: OS, Node.js, QA version
- **Contexto de ejecución**: Comando, modo, scope
- **Error específico**: Herramienta fallida, mensaje de error
- **Pasos de reproducción**: Comando exacto ejecutado
- **Metadatos**: Report ID, timestamp, archivos afectados

#### Ejemplo de Template Generado

```markdown
# QA System Issue Report

## Problem Description
False positive in security scan

**Issue Type:** [x] False Positive [ ] Performance [ ] Configuration

## Environment
- **QA Version:** 0.4.0
- **OS:** Linux 5.15.167.4-microsoft-standard-WSL2
- **Node:** 20.19.3
- **Branch:** feature/T-25_dod-code-review

## Execution Context
- **Command:** `yarn run cmd qa --dimension=security`
- **Mode:** dod | **Scope:** 
- **Failed Tool:** snyk (security)

## Error
```
Critical vulnerability in lodash@4.17.20 (CVE-2021-23337)
Path: node_modules/lodash/lodash.js
```

## Expected vs Actual Behavior
**Expected:** Lodash 4.17.21+ should not trigger this vulnerability
**Actual:** False positive for updated version

## Reproduction Steps
1. Run: `yarn run cmd qa --dimension=security`
2. Check lodash version in package.json

## Additional Context
- **Files:** package.json, yarn.lock
- **Report ID:** QA-1735123456-abc123

---
*Auto-generated by QA System v0.4.0 (RF-008)*
```

### Sistema de Almacenamiento Local

#### Estructura de Directorios
```
qa-reports/
├── issues/
│   ├── 2025-01-15T10-30-00_snyk_QA-1735123456-abc123.md
│   └── 2025-01-15T11-45-00_eslint_QA-1735123457-def456.md
└── issues-summary.json
```

#### Gestión de Issues
```bash
# Listar issues pendientes
yarn run cmd qa list-issues

# Marcar issue como resuelto
yarn run cmd qa close-issue QA-1735123456-abc123

# Ver estadísticas de issues
yarn run cmd qa issues-stats
```

### Integración con GitHub

#### URL Generation
El sistema genera URLs optimizadas para GitHub Issues:

```javascript
// URL generada automáticamente
https://github.com/BriamV/AI-Doc-Editor/issues/new?
  title=QA+System+Issue%3A+snyk+(security)+-+dod+mode&
  body=...&
  labels=qa-system,automated-report,bug,tool:snyk,dimension:security,mode:dod,env:linux
```

#### Cross-Platform Support
- **Linux**: `xdg-open` / `xclip`
- **macOS**: `open` / `pbcopy`
- **Windows**: `start` / `clip`

### Casos de Uso del Feedback

#### 1. Falso Positivo en Security Scan
```bash
# 1. Error detectado
yarn run cmd qa --dimension=security
# ❌ Snyk reports vulnerability in updated package

# 2. Reportar falso positivo
yarn run cmd qa --report-issue
# ✅ Report saved: qa-reports/issues/snyk-false-positive.md

# 3. El equipo QA investigará y ajustará reglas
```

#### 2. Problema de Performance
```bash
# 1. Ejecución lenta detectada
yarn run cmd qa --fast
# ⚠️ Fast mode took 45s (expected <15s)

# 2. Reportar problema de performance
yarn run cmd qa --report-issue
# ✅ Performance issue documented with metrics
```

#### 3. Error de Configuración
```bash
# 1. Tool no funciona en entorno específico
yarn run cmd qa --dimension=build
# ❌ TypeError: cannot read property 'scripts'

# 2. Reportar problema de entorno
yarn run cmd qa --report-issue
# ✅ Environment issue documented with full context
```

---

## 🔗 Casos de Uso Integrados

### Workflow Completo: Feature Development

```bash
# 1. Crear feature branch con DoD
git checkout -b feature/T-30_dod-code-review

# 2. Desarrollo iterativo con validación rápida
yarn run cmd qa --fast

# 3. Pre-PR validation con DoD específico
yarn run cmd qa --dod=code-review

# 4. Si hay problemas, reportar
yarn run cmd qa --report-issue

# 5. GitHub Actions automáticamente valida en PR
# 6. Merge solo si QA Gate pasa
```

### Workflow de Release

```yaml
# .github/workflows/release.yml
name: Release Quality Gate

on:
  push:
    branches: [main]

jobs:
  pre-release-qa:
    uses: ./.github/workflows/reusable-qa.yml
    with:
      mode: 'dod'
      dod-config: 'deployment'
      
  deploy:
    needs: pre-release-qa
    if: needs.pre-release-qa.outputs.qa-passed == 'true'
    # ... deployment steps
```

### Integration Testing con DoD

```bash
# Validación completa antes de integration
yarn run cmd qa --dod=integration

# Validación específica de APIs
yarn run cmd qa --scope=api/ --dimension=audit

# Performance benchmarking
yarn run cmd qa --benchmark --mode=fast
```

---

## ⚙ Configuración Avanzada

### Configuración Multi-Proyecto

```json
// qa-config.json
{
  "dodMappings": {
    "microservice": ["format", "test", "security"],
    "frontend": ["format", "test", "build"],
    "backend": ["format", "test", "security", "audit"]
  },
  "ciConfig": {
    "failOnWarnings": false,
    "parallel": true,
    "timeoutMinutes": 15
  },
  "feedbackConfig": {
    "autoReport": true,
    "githubRepo": "BriamV/AI-Doc-Editor"
  }
}
```

### Variables de Entorno para CI

```bash
# GitHub Actions secrets/variables
QA_PARALLEL_EXECUTION=true
QA_CI_MODE=true
SNYK_TOKEN=${{ secrets.SNYK_TOKEN }}
QA_TIMEOUT=900  # 15 minutes
```

### Hooks Personalizados

```json
// package.json
{
  "scripts": {
    "pre-commit": "yarn run cmd qa --fast",
    "pre-push": "yarn run cmd qa --dod=code-review",
    "post-merge": "yarn run cmd qa --dimension=security"
  }
}
```

---

## 📊 Métricas y Monitoreo

### KPIs por Workflow

| Métrica | DoD Mode | CI/CD Integration | Feedback |
|---------|----------|-------------------|----------|
| **Tiempo promedio** | 8-12s | 5-15min | <5s |
| **Tasa de éxito** | >95% | >90% | 100% |
| **Falsos positivos** | <3% | <5% | N/A |

### Dashboard de CI/CD

GitHub Actions proporciona métricas automáticas:
- Tiempo de ejecución por dimensión
- Número de issues encontrados
- Tasa de éxito por tipo de branch
- Tendencias de calidad del código

---

**Estado**: ✅ R0.WP6 Completado (T-13, T-14, T-15)  
**Documentación**: Completa según especificaciones PRD RF-005, RNF-004, RF-008