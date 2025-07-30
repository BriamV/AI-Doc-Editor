# Guía de Usuario - QA CLI System

**Sistema de Automatización QA para Desarrollo con Agentes IA**

Esta guía proporciona ejemplos prácticos y casos de uso comunes para el sistema QA CLI.

## 📚 Tabla de Contenidos

1. [Instalación y Configuración](#instalación-y-configuración)
2. [Comandos Básicos](#comandos-básicos)
3. [Modos de Ejecución](#modos-de-ejecución)
4. [Casos de Uso Comunes](#casos-de-uso-comunes)
5. [Integración con Workflows](#integración-con-workflows)
6. [Interpretación de Resultados](#interpretación-de-resultados)

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ (requisito PRD)
- Git para control de versiones
- Yarn como gestor de paquetes

### Setup Rápido
```bash
# Opción 1: Script automatizado (recomendado)
./scripts/setup-qa-environment.sh

# Opción 2: Manual
yarn install
yarn run cmd qa --help
```

Ver [QA Setup Guide](../QA-SETUP-GUIDE.md) para instrucciones detalladas.

## ⚡ Comandos Básicos

### Validación Automática
```bash
# Ejecutar validación completa automática
yarn run cmd qa

# Equivalente usando el alias
yarn qa
```

**¿Qué hace?** Detecta automáticamente el contexto (rama, archivos modificados) y ejecuta las dimensiones de validación apropiadas.

### Validación Rápida (Pre-commit)
```bash
# Modo optimizado para velocidad
yarn run cmd qa --fast
```

**¿Cuándo usar?** Antes de commits, en pre-commit hooks. Solo valida archivos en staging con linters rápidos.

### Ayuda y Información
```bash
# Mostrar ayuda completa
yarn run cmd qa --help

# Mostrar versión
yarn run cmd qa --version
```

## 🎯 Modos de Ejecución

### 1. Modo Automático (Default)
```bash
yarn run cmd qa
```

**Comportamiento:**
- Detecta tipo de rama (feature, fix, refactor)
- Analiza archivos modificados (git diff)
- Mapea automáticamente a dimensiones relevantes

**Ejemplo de salida:**
```
[ℹ️] QA System: Iniciando validación automática...
[DETECCIÓN DE CONTEXTO] (en 0.1s)
└── ✅ Contexto detectado: Feature branch (T-25)
    └── Mapeando a Dimensiones: Error Detection, Testing, Security

[MOTOR DE VALIDACIÓN]
├── ✅ Error Detection (2.3s)
├── ✅ Testing & Coverage (5.1s)
└── ✅ Security & Audit (1.8s)

[RESUMEN] ✅ VALIDACIÓN EXITOSA (9.2s total)
```

### 2. Modo por Scope
```bash
# Validar directorio específico
yarn run cmd qa --scope="frontend/src/components"

# Validar archivo específico
yarn run cmd qa --scope="backend/api/users.py"

# Validar múltiples paths
yarn run cmd qa --scope="frontend/src,backend/api"
```

**¿Cuándo usar?** Para validaciones focalizadas durante desarrollo.

### 3. Modo por Dimensión
```bash
# Solo linting y formato
yarn run cmd qa --dimension=format

# Solo tests
yarn run cmd qa --dimension=test

# Solo seguridad
yarn run cmd qa --dimension=security

# Solo build
yarn run cmd qa --dimension=build
```

**Dimensiones disponibles:**
- `format`: Error Detection (ESLint, Prettier, Pylint, Black)
- `test`: Testing & Coverage (Jest, Pytest)
- `build`: Build & Dependencies (npm, tsc, pip)
- `security`: Security & Audit (Snyk, Semgrep)
- `audit`: Data & Compatibility (Spectral, migraciones)

### 4. Modo Definition of Done (DoD)
```bash
# DoD para code review
yarn run cmd qa --dod=code-review

# DoD para testing completo
yarn run cmd qa --dod=all-tests

# Auto-detectar DoD desde rama
git checkout feature/T-25_dod-code-review
yarn run cmd qa  # Detecta automáticamente dod:code-review
```

**Mapeos DoD (RF-005):**
- `code-review`: Error Detection + Design Metrics + Security & Audit
- `all-tests`: Build & Dependencies + Testing & Coverage + Data & Compatibility

## 📋 Casos de Uso Comunes

### Desarrollo de Nueva Funcionalidad
```bash
# 1. Crear rama feature
git checkout -b feature/nueva-funcionalidad

# 2. Desarrollar código...

# 3. Validación rápida continua
yarn run cmd qa --fast

# 4. Validación completa antes de PR
yarn run cmd qa

# 5. Si hay errores, revisar y corregir
yarn run cmd qa --scope="archivo-modificado.ts"
```

### Pre-commit Hook
```bash
# En .git/hooks/pre-commit
#!/bin/sh
yarn run cmd qa --fast
if [ $? -ne 0 ]; then
    echo "❌ QA validation failed. Please fix errors before committing."
    exit 1
fi
```

### Code Review Preparation
```bash
# Validación específica para code review
yarn run cmd qa --dod=code-review

# Generar reporte para el reviewer
yarn run cmd qa --report json > qa-report.json
```

### Debugging de Problemas QA
```bash
# 1. Reproducir el problema
yarn run cmd qa --scope="problema/archivo.js"

# 2. Si hay error, reportar issue
yarn run cmd qa --report-issue

# 3. Validar fix
yarn run cmd qa --scope="problema/archivo.js"
```

### Integración Continua (CI)
El sistema se integra automáticamente en GitHub Actions. Ver [workflow-integration.md](workflow-integration.md).

## 📊 Interpretación de Resultados

### Estados de Validación
- ✅ **PASSED**: Validación exitosa
- 🟡 **WARNING**: Advertencias que no bloquean
- ❌ **FAILED**: Errores que deben corregirse

### Ejemplo de Salida Detallada
```
[MOTOR DE VALIDACIÓN]
├── [⚙️] Ejecutando Dimensión: Error Detection...
│   ├── 🟡 WARNING: src/components/NewFeature.jsx
│   │   └── Línea 42: Variable 'userData' asignada pero no usada
│   └── Frontend completado (1.8s)
├── ✅ Dimensión: Error Detection (2.5s)
│
├── [⚙️] Ejecutando Dimensión: Security & Audit...
│   └── ❌ ERROR: package.json
│       └── Dependencia 'lodash@4.17.20': Vulnerabilidad crítica (CVE-2021-23337)
└── ❌ Dimensión: Security & Audit (1.2s)

[RESUMEN FINAL] ❌ VALIDACIÓN FALLIDA (3.7s total)
• Errores: 1 • Advertencias: 1

Archivos con problemas:
- ❌ package.json (1 error crítico)
- 🟡 src/components/NewFeature.jsx (1 advertencia)
```

### Códigos de Salida
- `0`: Éxito completo
- `1`: Fallos encontrados (errores críticos)
- `2`: Solo advertencias
- `3`: Error del sistema QA

## 🔧 Configuración Avanzada

### Variables de Entorno
```bash
# Configuración en .env
QA_PARALLEL_EXECUTION=true
QA_SHOW_ELAPSED_TIME=true
SNYK_TOKEN=your_token_here
```

### Archivos de Configuración
- `.mega-linter.yml`: Configuración centralizada de linting
- `qa-config.json`: Configuración específica del sistema QA
- `pyproject.toml`: Configuración de herramientas Python

### Personalización por Proyecto
```json
// qa-config.json
{
  "dodMappings": {
    "custom-dod": ["format", "test", "security"]
  },
  "thresholds": {
    "coverage": 85,
    "complexity": 10
  }
}
```

## 🎨 Integración con IDEs

### Visual Studio Code
```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "QA Fast",
      "type": "shell",
      "command": "yarn run cmd qa --fast",
      "group": "build"
    }
  ]
}
```

### Scripts Personalizados
```bash
# Agregar en package.json
{
  "scripts": {
    "qa": "node scripts/qa/qa-cli.cjs",
    "qa:fast": "yarn qa --fast",
    "qa:security": "yarn qa --dimension=security",
    "qa:report": "yarn qa --report-issue"
  }
}
```

## 🆘 Obtener Ayuda

### Sistema de Feedback Integrado
```bash
# Reportar problema con el QA system
yarn run cmd qa --report-issue
```

Esto abre un formulario pre-llenado para reportar:
- Falsos positivos/negativos
- Problemas de rendimiento
- Errores de configuración
- Solicitudes de nuevas funcionalidades

### Recursos Adicionales
- [API Reference](api-reference.md): Referencia completa de comandos
- [Troubleshooting](troubleshooting.md): Solución de problemas comunes
- [Workflow Integration](workflow-integration.md): Integración avanzada CI/CD

---

**¿Necesitas más ayuda?** Usa `yarn run cmd qa --report-issue` para contactar al equipo de desarrollo.