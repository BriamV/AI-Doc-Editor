# API Reference - QA CLI System

**Referencia Completa de Comandos y Opciones**

Esta guía proporciona la documentación técnica completa de todos los comandos, flags y opciones disponibles en el QA CLI System.

## 📚 Tabla de Contenidos

1. [Comando Principal](#comando-principal)
2. [Opciones Globales](#opciones-globales)
3. [Comandos Específicos](#comandos-específicos)
4. [Códigos de Salida](#códigos-de-salida)
5. [Variables de Entorno](#variables-de-entorno)
6. [Archivos de Configuración](#archivos-de-configuración)

---

## 🚀 Comando Principal

### Sintaxis Base
```bash
yarn run cmd qa [task] [options]
# o
npm run cmd qa [task] [options]
# o
pnpm run cmd qa [task] [options]
```

### Uso por Detección Automática
El comando principal detecta automáticamente el gestor de paquetes y se adapta:
- ✅ **yarn**: `yarn run cmd qa`
- ✅ **npm**: `npm run cmd qa` 
- ✅ **pnpm**: `pnpm run cmd qa`

---

## ⚙️ Opciones Globales

### `--fast` / `-f`
**Tipo**: `boolean`  
**Default**: `false`  
**Descripción**: Activa el modo rápido optimizado para pre-commit hooks.

```bash
# Modo rápido (T-07 implementation)
yarn run cmd qa --fast
yarn run cmd qa -f
```

**Comportamiento:**
- Solo analiza archivos en staging (`git diff --cached`)
- Ejecuta únicamente linters rápidos
- Excluye operaciones lentas (tests completos, security scans)
- Objetivo: P95 < 15s para cambios típicos

### `--scope` / `-s`
**Tipo**: `string`  
**Opciones**: `frontend` | `backend` | `infrastructure` | `all`  
**Descripción**: Limita la validación a un scope específico.

```bash
# Validar solo frontend
yarn run cmd qa --scope frontend
yarn run cmd qa -s frontend

# Validar scope específico con path
yarn run cmd qa --scope="src/components"
yarn run cmd qa --scope="backend/api/users.py"
```

**Mapeo de Scopes:**
- `frontend`: `src/`, `components/`, archivos `.tsx/.jsx/.ts/.js`
- `backend`: `api/`, `server/`, archivos `.py/.cjs`
- `infrastructure`: `scripts/`, `.yml/.yaml`, Docker files
- `all`: Todo el proyecto (default)

### `--dimension` / `-d`
**Tipo**: `string`  
**Opciones**: `format` | `lint` | `test` | `security` | `build`  
**Descripción**: Ejecuta solo una dimensión específica de validación.

```bash
# Ejecutar solo formatting
yarn run cmd qa --dimension format
yarn run cmd qa -d format

# Solo tests
yarn run cmd qa --dimension test

# Solo security
yarn run cmd qa --dimension security
```

**Dimensiones Disponibles:**
- `format`: Error Detection (ESLint, Prettier, Pylint, Black)
- `lint`: Alias para `format`
- `test`: Testing & Coverage (Jest, Pytest)
- `security`: Security & Audit (Snyk, Semgrep)
- `build`: Build & Dependencies (npm, tsc, pip)

### `--config` / `-c`
**Tipo**: `string`  
**Default**: `scripts/qa/qa-config.json`  
**Descripción**: Especifica archivo de configuración personalizado.

```bash
# Configuración personalizada
yarn run cmd qa --config="custom-qa.json"
yarn run cmd qa -c="/path/to/config.json"
```

### `--verbose` / `-v`
**Tipo**: `boolean`  
**Default**: `false`  
**Descripción**: Activa salida detallada para debugging.

```bash
# Salida detallada
yarn run cmd qa --verbose
yarn run cmd qa -v
```

**Información adicional mostrada:**
- Tiempo de ejecución por herramienta
- Archivos procesados
- Variables de entorno utilizadas
- Configuración cargada

### `--report` / `-r`
**Tipo**: `string`  
**Opciones**: `json` | `html` | `console` | `ci-json`  
**Descripción**: Genera reporte en formato específico.

```bash
# Reporte JSON
yarn run cmd qa --report json
yarn run cmd qa -r json

# Reporte para CI/CD
yarn run cmd qa --report ci-json
```

**Formatos de Reporte:**
- `json`: Reporte estructurado para integración
- `html`: Reporte visual navegable
- `console`: Salida estándar (default)
- `ci-json`: Formato optimizado para CI/CD

### `--report-issue`
**Tipo**: `boolean`  
**Default**: `false`  
**Descripción**: Activa el mecanismo de feedback (RF-008) tras la ejecución.

```bash
# Reportar issue después de fallo
yarn run cmd qa --report-issue
```

**Comportamiento:**
- Genera template de issue pre-llenado
- Incluye contexto completo del error
- Guarda reporte local en `qa-reports/issues/`
- Proporciona URL para GitHub Issues

---

## 📋 Comandos Específicos

### Default Command: Validación QA
```bash
yarn run cmd qa [task]
```

**Parámetros:**
- `task` (opcional): Tarea específica (T-XX) o etiqueta DoD

**Ejemplos:**
```bash
# Validación automática
yarn run cmd qa

# Tarea específica
yarn run cmd qa T-02

# DoD específico
yarn run cmd qa dod:code-review
```

### `report-issue` - Reporte de Problemas
```bash
yarn run cmd qa report-issue [options]
```

**Opciones específicas:**
- `--tool`: Herramienta que causó el problema
- `--error`: Mensaje de error específico  
- `--context`: Contexto adicional del problema

**Ejemplos:**
```bash
# Reporte básico
yarn run cmd qa report-issue

# Reporte con contexto
yarn run cmd qa report-issue --tool="snyk" --error="False positive CVE"
```

### `list-issues` - Listar Issues Locales
```bash
yarn run cmd qa list-issues [options]
```

**Opciones específicas:**
- `--limit`: Número máximo de issues (default: 10)
- `--status`: Filtrar por estado (`open` | `closed` | `all`)

**Ejemplos:**
```bash
# Listar issues abiertos
yarn run cmd qa list-issues

# Últimos 20 issues (todos)
yarn run cmd qa list-issues --limit=20 --status=all
```

### `help` - Ayuda Detallada
```bash
yarn run cmd qa help [command]
```

**Ejemplos:**
```bash
# Ayuda general
yarn run cmd qa help

# Ayuda de comando específico
yarn run cmd qa help report-issue
```

---

## 📈 Códigos de Salida

| Código | Estado | Descripción |
|--------|--------|-------------|
| `0` | **SUCCESS** | Validación exitosa, sin errores |
| `1` | **FAILED** | Errores críticos encontrados |
| `2` | **WARNINGS** | Solo advertencias (no bloquea) |
| `3` | **SYSTEM_ERROR** | Error interno del sistema QA |
| `4` | **CONFIG_ERROR** | Error de configuración |
| `5` | **DEPENDENCY_ERROR** | Herramientas requeridas no encontradas |

**Uso en Scripts:**
```bash
#!/bin/bash
yarn run cmd qa --fast
QA_EXIT_CODE=$?

case $QA_EXIT_CODE in
  0) echo "✅ QA passed" ;;
  1) echo "❌ QA failed"; exit 1 ;;
  2) echo "🟡 QA passed with warnings" ;;
  *) echo "⚠️ QA system error"; exit 1 ;;
esac
```

---

## 🌍 Variables de Entorno

### Variables de Configuración

| Variable | Descripción | Default | Ejemplo |
|----------|-------------|---------|---------|
| `QA_PARALLEL_EXECUTION` | Ejecutar validaciones en paralelo | `true` | `export QA_PARALLEL_EXECUTION=false` |
| `QA_SHOW_ELAPSED_TIME` | Mostrar tiempos de ejecución | `true` | `export QA_SHOW_ELAPSED_TIME=true` |
| `QA_CI_MODE` | Modo CI/CD optimizado | `false` | `export QA_CI_MODE=true` |
| `QA_TIMEOUT` | Timeout global en segundos | `600` | `export QA_TIMEOUT=900` |

### Variables de Herramientas

| Variable | Herramienta | Descripción |
|----------|-------------|-------------|
| `SNYK_TOKEN` | Snyk | Token de autenticación para scans |
| `GITHUB_TOKEN` | GitHub Actions | Token para integración CI/CD |
| `MEGALINTER_*` | MegaLinter | Variables de configuración MegaLinter |

### Variables de Path

| Variable | Descripción | Default |
|----------|-------------|---------|
| `QA_CONFIG_PATH` | Path del archivo de configuración | `scripts/qa/qa-config.json` |
| `QA_REPORTS_DIR` | Directorio de reportes | `qa-reports/` |
| `QA_CACHE_DIR` | Directorio de cache | `.qa-cache/` |

**Ejemplo de configuración:**
```bash
# .env
QA_PARALLEL_EXECUTION=true
QA_SHOW_ELAPSED_TIME=true
QA_CI_MODE=false
QA_TIMEOUT=600
SNYK_TOKEN=your_snyk_token_here
QA_REPORTS_DIR=custom-reports/
```

---

## 📁 Archivos de Configuración

### `qa-config.json` - Configuración Principal
**Ubicación**: `scripts/qa/qa-config.json`

```json
{
  "version": "0.4.0",
  "defaultMode": "auto",
  "dimensions": {
    "format": {
      "enabled": true,
      "tools": ["megalinter"],
      "timeout": 120
    },
    "test": {
      "enabled": true,
      "tools": ["jest", "pytest"],
      "timeout": 300
    },
    "security": {
      "enabled": true,
      "tools": ["snyk", "semgrep"],
      "timeout": 180
    }
  },
  "dodMappings": {
    "code-review": ["format", "lint", "security"],
    "all-tests": ["build", "test", "audit"],
    "integration": ["build", "test", "security"],
    "deployment": ["build", "test", "security", "audit"]
  },
  "scopes": {
    "frontend": {
      "include": ["src/**", "components/**"],
      "exclude": ["node_modules/**", "dist/**"]
    },
    "backend": {
      "include": ["api/**", "server/**", "backend/**"],
      "exclude": ["__pycache__/**", "*.pyc"]
    }
  },
  "thresholds": {
    "coverage": 80,
    "complexity": 10,
    "loc_per_file": 212
  }
}
```

### `.mega-linter.yml` - Configuración MegaLinter
**Ubicación**: Raíz del proyecto

```yaml
# MegaLinter configuration for QA System
APPLY_FIXES: none
SHOW_ELAPSED_TIME: true
PARALLEL: true
DEFAULT_BRANCH: main

# Enable specific linters
ENABLE_LINTERS:
  - JAVASCRIPT_ES
  - TYPESCRIPT_ES
  - PYTHON_PYLINT
  - PYTHON_BLACK
  - BASH_SHELLCHECK

# Disable problematic linters
DISABLE_LINTERS:
  - SPELL_CSPELL
  - REPOSITORY_CHECKOV

# File patterns
FILTER_REGEX_INCLUDE: "(src/|scripts/|api/)"
FILTER_REGEX_EXCLUDE: "(node_modules/|dist/|build/)"
```

### `pyproject.toml` - Configuración Python
**Ubicación**: Raíz del proyecto

```toml
[tool.black]
line-length = 100
target-version = ['py38', 'py39', 'py310', 'py311']
include = '\.pyi?$'
extend-exclude = '''
/(
  # directories
  \.eggs
  | \.git
  | \.hg
  | \.mypy_cache
  | \.tox
  | \.venv
  | build
  | dist
)/
'''

[tool.pylint.messages_control]
disable = "missing-module-docstring,missing-function-docstring"

[tool.pytest.ini_options]
testpaths = ["tests", "backend/tests"]
python_files = ["test_*.py", "*_test.py"]
```

### `.eslintrc.js` - Configuración ESLint
**Ubicación**: Raíz del proyecto

```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    'max-len': ['error', { code: 100 }],
    'complexity': ['warn', 10],
    'max-lines-per-function': ['warn', 50]
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '*.min.js'
  ]
};
```

---

## 🔗 Integración con Package Managers

### Detección Automática
El sistema detecta automáticamente el package manager:

```bash
# El comando se adapta automáticamente
yarn run cmd qa    # Si usa Yarn
npm run cmd qa     # Si usa npm  
pnpm run cmd qa    # Si usa pnpm
```

### Scripts en package.json
```json
{
  "scripts": {
    "qa": "node scripts/qa/qa-cli.cjs",
    "qa:fast": "node scripts/qa/qa-cli.cjs --fast",
    "qa:security": "node scripts/qa/qa-cli.cjs --dimension security",
    "qa:report": "node scripts/qa/qa-cli.cjs --report-issue",
    "qa:dod": "node scripts/qa/qa-cli.cjs --dod code-review"
  }
}
```

---

**Versión**: 0.4.0 (R0.WP6)  
**Especificación**: PRD-QA CLI.md RF-001, RF-009  
**Implementación**: T-02 (CLI Core & Help)