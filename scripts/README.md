# AI-Doc-Editor Scripts (LEGACY - DEPRECATED)

🚨 **CRITICAL DEPRECATION WARNING**: This scripts directory is FULLY DEPRECATED and scheduled for removal.

## 🔄 **MIGRATION MANDATORY** - Use These Alternatives:

### 🎯 **PREFERRED: Direct Yarn Commands (Tier 1)**
```bash
yarn dev|build|test|security-scan      # Core development commands
yarn lint|format|tsc-check            # Quality commands
yarn python-quality|python-format     # Backend Python validation
```

### ⚡ **PREFERRED: Slash Commands (Tier 2)**
```bash
/health-check          # System validation (replaces validate-*)
/commit-smart          # Intelligent commits
/review-complete       # Multi-agent code review
/merge-safety          # Pre-merge validation (replaces qa-gate)
/task-dev T-XX         # Task development workflow
```

### 🛡️ **AUTOMATED: Hooks System (Tier 3)**
- **Location**: `.claude/hooks.json`
- **Performance**: 54% faster (70s vs 152s)
- **Coverage**: 40+ tools integrated automatically
- **Trigger**: Auto-runs on Edit/Write/MultiEdit operations

### 📋 **BASH TOOLS: Still Functional (Tier 4)**
```bash
tools/progress-dashboard.sh            # Project progress tracking
tools/task-navigator.sh T-XX           # Task navigation
tools/validate-dod.sh T-XX             # Definition of Done validation
```

[![Build Status](https://img.shields.io/badge/build-deprecated-orange.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()

## 📚 **DOCUMENTATION NAVIGATION** - 4-Tier Architecture

### 🎯 **WHERE TO FIND CURRENT DOCUMENTATION**

| Documentation Type | Location | Purpose |
|-------------------|----------|---------|
| **Implementation Docs** | `src/docs/` | Frontend React/TypeScript patterns |
| **Implementation Docs** | `backend/docs/` | Backend API/database architecture |
| **Strategic Docs** | `docs/` | Project planning & architecture |
| **Tool Integration** | `tools/README.md` | Bash scripts & task management |

### 🔄 **COMPLETE MIGRATION REFERENCE**

#### ✅ **DIRECT COMMANDS** (Use These Instead)
```bash
# Core Development (Tier 1)
yarn dev|build|test|security-scan      # Replaces: yarn run cmd dev/build/test
yarn lint|format|tsc-check            # Replaces: yarn run cmd lint/format
yarn python-quality                    # Replaces: yarn run cmd validate-backend

# Quality Gates (Automated)
.claude/hooks.json                     # Replaces: yarn run cmd qa-gate
/merge-safety                          # Replaces: yarn run cmd validate-all
```

#### ⚡ **SLASH COMMANDS** (Workflow Automation)
```bash
/health-check          # Replaces: yarn run cmd validate-*
/commit-smart          # Replaces: manual commit workflows
/review-complete       # Replaces: manual code review prep
/merge-safety          # Replaces: yarn run cmd qa-gate
/task-dev T-XX         # Replaces: manual task setup
```

#### 🛡️ **AUTOMATED HOOKS** (Background Quality)
- **Location**: `.claude/hooks.json`
- **Performance**: 54% faster (70s vs 152s)
- **Coverage**: 40+ tools integrated automatically
- **Replaces**: All manual quality commands

### Migration Timeline
- **Phase 1**: Direct yarn commands available ✅
- **Phase 2**: Hooks integration complete ✅
- **Phase 3**: Scripts marked deprecated (current)
- **Phase 4**: Scripts removal (planned)

## 🌟 Legacy Características

⚠️ **Note**: The following information is for historical reference. New development should use the alternatives above.

Este directorio contiene el sistema de scripts modular que reemplaza completamente al Makefile, proporcionando:

- ✅ **Compatibilidad multiplataforma**: Funciona igual en Windows, macOS y Linux
- ✅ **Estructura modular**: Cada categoría de comandos en su propio archivo
- ✅ **Manejo de errores robusto**: Captura y muestra errores de forma clara
- ✅ **Logging consistente**: Formato visual uniforme con indicadores claros
- ✅ **Extensibilidad**: Fácil adición de nuevos comandos o modificación de existentes
- ✅ **Documentación integrada**: Ayuda y documentación incorporada en cada comando

## 🛠️ Estructura

```
scripts/
├── commands/           # Comandos específicos por categoría
│   ├── build.cjs       # Comandos de construcción
│   ├── dev.cjs         # Comandos de desarrollo
│   ├── docker.cjs      # Comandos de Docker
│   ├── governance.cjs  # Comandos de gobernanza
│   ├── maintenance.cjs # Comandos de mantenimiento
│   ├── qa.cjs          # Comandos de QA
│   ├── security.cjs    # Comandos de seguridad
│   └── test.cjs        # Comandos de pruebas
├── utils/              # Utilidades compartidas
│   ├── logger.cjs      # Utilidad para logging consistente
│   ├── executor.cjs    # Ejecutor de comandos con manejo de errores
│   └── config.cjs      # Configuración centralizada
├── qa-gate.cjs         # Script principal de QA
├── security-scan.cjs   # Script de seguridad
└── cli.cjs             # Punto de entrada principal
```

## 🚀 Uso (DEPRECATED)

⚠️ **DEPRECATED**: The following CLI pattern is being phased out:

```bash
# DEPRECATED - DO NOT USE
yarn run cmd <comando> [opciones]  # ❌ Old pattern
yarn run cmd help                  # ❌ Old help system
```

**Use instead**:
```bash
# RECOMMENDED - Direct commands
yarn <comando>                     # ✅ New pattern
yarn --help                        # ✅ Built-in help
/auto-workflow                     # ✅ Context-aware suggestions
```

### Legacy Usage (Historical Reference Only)

⚠️ **For migration purposes only**. The following commands still work but are deprecated:

```bash
yarn run cmd <comando> [opciones]  # Legacy CLI entry point
yarn run cmd help                  # Legacy help system
yarn run cmd help <comando>        # Legacy command-specific help
```

## 📋 Comandos Disponibles (LEGACY)

⚠️ **All commands listed below are DEPRECATED**. Use direct yarn commands or Claude Code slash commands instead.

**Quick Migration Reference**:
| Legacy Command | Replacement | Status |
|---------------|-------------|---------|
| `yarn run cmd dev` | `yarn dev` | ✅ Available |
| `yarn run cmd build` | `yarn build` | ✅ Available |
| `yarn run cmd test` | `yarn test` | ✅ Available |
| `yarn run cmd qa-gate` | `.claude/hooks.json` | ✅ Automated |
| `yarn run cmd validate-*` | `/health-check` | ✅ Enhanced |

### Desarrollo (Legacy)

- `dev`: Inicia el servidor de desarrollo
- `build`: Construye la aplicación para producción
- `build-analyze`: Construye la aplicación con análisis de bundle
- `build-dev`: Construye la aplicación en modo desarrollo
- `build-docs`: Construye la documentación del proyecto
- `build-env`: Construye para un entorno específico (development, staging, production)
- `preview`: Previsualiza la construcción de producción

### Pruebas

- `test`: Ejecuta pruebas unitarias
- `test-watch`: Ejecuta pruebas en modo observador
- `test-coverage`: Ejecuta pruebas con cobertura
- `test-e2e`: Ejecuta pruebas end-to-end
- `test-e2e-open`: Abre la interfaz de Cypress

### Calidad

- `lint`: Ejecuta ESLint
- `lint-fix`: Ejecuta ESLint con auto-corrección
- `format`: Formatea el código con Prettier
- `format-check`: Verifica el formato del código
- `tsc-check`: Verifica la compilación de TypeScript
- `qa-gate`: Ejecuta todas las verificaciones de calidad
- `validate-design-guidelines`: Valida métricas de DESIGN_GUIDELINES.md
- `validate-task [--task=T-XX]`: Valida según tarea específica (con soporte de override)

### Validación Modular (Multi-Tecnología)

Sistema avanzado de validación que detecta automáticamente tecnologías (TypeScript/React + Python/FastAPI) y contexto de flujo de trabajo según WORK-PLAN v5.md.

#### Por Scope/Estructura
- `validate-file --file=ruta [--tools=format,lint]`: Valida archivo específico
- `validate-dir --dir=ruta [--tools=format,lint]`: Valida directorio específico
- `validate-frontend`: Valida frontend (React/TypeScript)
- `validate-backend`: Valida backend (Python/FastAPI)
- `validate-store`: Valida state management (Zustand/TypeScript)
- `validate-types`: Valida tipos y constantes
- `validate-all`: Valida todo el proyecto (multi-tecnología)

#### Por Performance
- `validate-frontend-fast`: Validación ultra-rápida frontend (1-8s)
- `validate-backend-fast`: Validación ultra-rápida backend (1-3s)
- `validate-all-fast`: Validación ultra-rápida proyecto completo
- `validate-frontend-full`: Validación completa frontend (todos los tools)
- `validate-backend-full`: Validación completa backend (todos los tools)
- `validate-all-full`: Validación completa proyecto (quality gate)

#### Por Contexto de Desarrollo
- `validate-modified`: Valida solo archivos modificados (git)
- `validate-staged`: Valida archivos staged (pre-commit hook)
- `validate-diff --base=main`: Valida diferencias vs branch base

#### Por Flujo de Trabajo (Auto-detección)
- `workflow-context`: Muestra contexto actual detectado
- `validate-task [--task=T-XX]`: Valida según tarea actual o forzar tarea específica
- `validate-workpackage`: Valida según work package (WP) actual
- `validate-release`: Valida según release (R#) actual

**Características:**
- ✅ **Multi-plataforma**: Windows, Linux, macOS, WSL
- ✅ **Multi-tecnología**: TypeScript + Python automático
- ✅ **Context-aware**: Detección automática de branch/tarea + override manual
- ✅ **Performance optimizado**: 1-80s según scope
- ✅ **GitFlow integration**: feature → develop → release → main
- ✅ **DESIGN_GUIDELINES.md**: Sistema semáforo LOC, complejidad, métricas de calidad
- ✅ **Task-specific validation**: Forzar validación de tarea específica con --task=T-XX

### Seguridad

- `security-scan`: Ejecuta escaneo de dependencias (T-43)
- `audit`: Verifica vulnerabilidades de seguridad
- `audit-fix`: Corrige vulnerabilidades de seguridad

### Gobernanza

- `api-spec`: Valida la especificación OpenAPI
- `traceability`: Genera matriz de trazabilidad en múltiples formatos (XLSX, JSON, Markdown)
- `traceability:xlsx`: Genera matriz de trazabilidad solo en formato XLSX
- `traceability:json`: Genera matriz de trazabilidad solo en formato JSON
- `traceability:md`: Genera matriz de trazabilidad solo en formato Markdown
- `governance`: Ejecuta todas las verificaciones de gobernanza

### Electron

- `electron`: Ejecuta como aplicación de escritorio
- `pack`: Empaqueta la aplicación Electron
- `make-dist`: Construye y empaqueta para distribución

### Docker

- `docker-dev`: Inicia entorno de desarrollo con Docker
- `docker-prod`: Inicia entorno de producción con Docker
- `docker-backend`: Inicia stack completo con backend
- `docker-stop`: Detiene todos los servicios Docker
- `docker-logs`: Muestra logs de Docker

### Mantenimiento

- `clean`: Limpia artefactos de construcción y dependencias

## 🎯 Validación de Calidad Mejorada (R0.WP2)

El sistema de QA ha sido mejorado con validación de DESIGN_GUIDELINES.md:

### Métricas de Calidad Integradas
- **Sistema Semáforo LOC**: 🟢 ≤150, 🟡 151-250, 🔴 >251 LOC por archivo
- **Complejidad Ciclomática**: ≤10 por función (Python y TypeScript)
- **Line Length**: ≤100 caracteres por línea
- **Type Hints**: Cobertura de type hints en Python
- **Docstrings**: Documentación estilo Google en Python
- **TODO/FIXME**: Detección de código temporal en producción

### Task-Specific Validation
```bash
# Validar tarea específica basada en branch actual
yarn run cmd validate-task

# Forzar validación de tarea específica
yarn run cmd validate-task --task=T-02

# Ejemplo completo de workflow QA
yarn run cmd validate-task --task=T-02  # Validación específica
yarn run cmd qa-gate                    # Quality gate completo
```

### Criterios DoD Automatizados
- **"Código revisado y aprobado"**: Integración con DESIGN_GUIDELINES.md
- **Score de calidad**: Porcentaje basado en métricas pasadas
- **Validación por scope**: Frontend, backend, o proyecto completo

## 🔄 Migración desde Makefile

Este sistema reemplaza completamente al Makefile anterior con las siguientes ventajas:

1. **Compatibilidad multiplataforma**: Funciona igual en Windows, macOS y Linux sin necesidad de instalar herramientas adicionales.
2. **Mejor manejo de errores**: Captura y muestra errores de forma más clara y detallada.
3. **Modularidad**: Cada categoría de comandos está en su propio archivo, facilitando el mantenimiento.
4. **Extensibilidad**: Fácil adición de nuevos comandos o modificación de existentes sin afectar al resto.
5. **Documentación integrada**: Ayuda y documentación incorporada en cada comando.

### Tabla de equivalencia

| Comando Makefile | Comando Nuevo | Descripción |
|-----------------|---------------|-------------|
| `make help` | `yarn run cmd help` | Muestra ayuda |
| `make install` | `yarn install` | Instala dependencias |
| `make dev` | `yarn run cmd dev` | Inicia servidor de desarrollo |
| `make build` | `yarn run cmd build` | Construye la aplicación |
| `make test` | `yarn run cmd test` | Ejecuta pruebas |
| `make lint` | `yarn run cmd lint` | Ejecuta ESLint |
| `make format` | `yarn run cmd format` | Formatea código |
| `make qa-gate` | `yarn run cmd qa-gate` | Ejecuta quality gate |
| `make security-scan` | `yarn run cmd security-scan` | Ejecuta escaneo de seguridad |
| `make docker-dev` | `yarn run cmd docker-dev` | Inicia Docker desarrollo |
| `make clean` | `yarn run cmd clean` | Limpia artefactos |

## 📝 Desarrollo

Para añadir un nuevo comando:

1. Identifica la categoría adecuada en `scripts/commands/`
2. Añade la función en el archivo correspondiente
3. Exporta la función en el módulo
4. Actualiza el mapeo en `cli.cjs` si es necesario

## 🔒 Seguridad

El sistema de scripts incluye verificaciones de seguridad integradas:

- Escaneo de dependencias con `yarn audit`
- Generación de informes de licencias
- Verificación de vulnerabilidades críticas

## 📄 Licencia

Este proyecto está licenciado bajo los términos de la licencia MIT.
