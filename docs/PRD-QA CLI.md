# Product Requirements Document (PRD)

## Sistema de Automatización QA para Desarrollo con Agentes IA

### 1. Visión y Objetivo

**Visión**: Crear un sistema de automatización QA modular, extensible y eficiente que sirva como herramienta fundamental para que los Agentes de Programación IA puedan validar automáticamente la calidad del código que generan, garantizando estándares de excelencia en proyectos de desarrollo de software.

**Objetivos Principales**:

- Proporcionar una interfaz CLI intuitiva para ejecutar validaciones QA automáticas
    
- Detectar automáticamente el contexto de desarrollo y aplicar las validaciones apropiadas
    
- Soportar múltiples stacks tecnológicos (Frontend: TypeScript/React, Backend: Python/Databases)
    
- Facilitar la integración con pipelines CI/CD y flujos de trabajo de desarrollo
    

### 2. Stakeholders & Roles

|   |   |   |
|---|---|---|
|Stakeholder|Rol|Responsabilidades|
|Agentes de Programación IA|Usuario Principal|Ejecutar validaciones QA automáticas sobre el código generado|
|Desarrolladores Humanos|Usuario Secundario|Configurar, mantener y extender el sistema QA|
|DevOps Team|Integrador|Integrar el sistema en pipelines CI/CD|
|Arquitecto de Software|Supervisor Técnico|Asegurar cumplimiento de principios SOLID y estándares de diseño|
|Product Owner|Sponsor|Definir prioridades y aprobar releases|
|QA Engineers|Colaborador|Definir criterios de validación y métricas de calidad|

### 3. Alcance

**Incluido**:

- **Capa de Orquestación Inteligente (CLI):** Un script de línea de comandos (yarn qa) que actúa como el cerebro del sistema.
    
- **Detección de Contexto:** Detección automática de rama, cambios (git diff), flags de la CLI y tipo de proyecto.
    
- **Mapeo Contexto-Dimensiones:** Lógica para mapear el contexto detectado a un plan de validación específico (conjunto de Dimensiones de Calidad).
    
- **Integración y Configuración Dinámica de Herramientas:** El sistema integrará y controlará un ecosistema de herramientas de calidad líderes (ej. MegaLinter, Snyk, Pytest, Jest), configurándolas dinámicamente en tiempo de ejecución para satisfacer los requisitos del plan de validación.
    
- **Validación Multi-Stack:** Soporte para Frontend (TypeScript/React), Backend (Python) e Infraestructura/Tooling (.cjs, .sh).
    
- **Soporte para Modos de Ejecución:** Implementación de los modos Automático, Por Tarea (DoD), Por Scope y Rápido (Pre-commit).
    
- **Reportes de Validación Unificados:** Generación de reportes estructurados y visuales en la consola, agregando los resultados de todas las herramientas ejecutadas.
    
- **Arquitectura Extensible:** Diseño que facilita la adición de nuevas herramientas o dimensiones a través de "wrappers" de herramientas.
    

**Excluido**:

- **Desarrollo de Herramientas de Validación Propias:** El sistema no implementará sus propios linters, escáneres de seguridad o frameworks de testing. Se basa 100% en herramientas existentes del ecosistema.
    
- **UI Gráfica:** La interacción es exclusivamente a través de la CLI.
    
- **Modificación Automática de Código:** El sistema solo reporta problemas; no los corrige.
    
- **Gestión de Versiones del Código y Deployment.**
    

### 4. Arquitectura de la Solución

El sistema se diseñará siguiendo un patrón de **Orquestador Inteligente sobre Herramientas Externas**.

1. **CLI Entry Point (qa-cli.cjs):** Punto de entrada que parsea los argumentos de la línea de comandos.
2. **Capa de Orquestación (Orchestrator.cjs):** Es el núcleo del sistema. No contiene lógica de validación, sino la lógica de control de flujo:
    - Utiliza un **Detector de Contexto** para entender el entorno de ejecución.
    - Selecciona un **Plan de Ejecución** (un conjunto de dimensiones a validar) basado en el contexto y los modos de RF-005. 
    - Para cada dimensión en el plan, invoca al **Wrapper de Herramienta** correspondiente.
    - Recopila los resultados de todos los wrappers y los pasa a un **Generador de Reportes**.
3. **Wrappers de Herramientas (tool-wrappers/):** Son módulos pequeños y especializados que actúan como una capa de abstracción (façade) sobre cada **herramienta principal orquestada**. Un MegaLinterWrapper.cjs sabrá cómo invocar a MegaLinter con las variables de entorno y flags correctos para una ejecución rápida o completa. Un JestWrapper.cjs sabrá cómo ejecutar Jest en un scope específico. Esto aísla al orquestador de los detalles de implementación de cada herramienta.
4. **Herramientas Externas:** **MegaLinter, Snyk, Jest, Pytest, etc.** Son las "cajas negras" que realizan el trabajo pesado de validación. El sistema confía en ellas y se enfoca en orquestar su ejecución y unificar sus resultados.
    

Esta arquitectura maximiza la reutilización de herramientas probadas en la industria mientras nos da control total sobre el flujo de validación, cumpliendo con todos los requisitos funcionales.

### 5. Requisitos Funcionales

#### RF-001: Interfaz CLI Principal

- El sistema debe exponer un comando principal (ej. `yarn qa`, `npm run qa` (configurable en `package.json`).
    
- Debe detectar automáticamente el contexto de ejecución
    
- Debe soportar flags para control explícito (--scope, --dimension, --fast)
    

#### RF-002: Detección de Contexto

- Detectar tipo de rama (feature, refactor, fix, etc.)
    
- Identificar archivos modificados usando git diff (filtrar/ignorar archivos que hayan sido eliminados en la rama actual, como parte de los trabajos en la rama)
    
- Determinar stack tecnológico de archivos (TypeScript, Python, etc.)
    
- Mapear contexto a dimensiones de validación relevantes
    

#### RF-003: Dimensiones de Validación

- **Error Detection**: Linting y formateo de código
    
- **Testing & Coverage**: Ejecución de pruebas y cobertura
    
- **Build & Dependencies**: Validación de build y dependencias
    
- **Design Metrics**: Métricas de calidad de código evaluadas con un sistema de semáforos para proporcionar una guía flexible y accionable. Los umbrales serán configurables a través de los archivos de configuración de las herramientas subyacentes (ej. `.mega-linter.yml`).
	- **Complejidad Ciclomática**: - 🟢 **Verde (Pasa)**: ≤ 10 - 🟡 **Amarillo (Advertencia)**: 11 - 15 - 🔴 **Rojo (Falla)**: > 15
	- **Líneas de Código (LOC) por Archivo**: - 🟢 **Verde (Pasa)**: ≤ 212 - 🟡 **Amarillo (Advertencia)**: 213 - 300 - 🔴 **Rojo (Falla)**: > 300
	- **Longitud de Línea**: Se establece un límite estricto de 100 caracteres, con excepciones configurables para casos justificados.
    
- **Security & Audit**: Análisis de vulnerabilidades
    
- **Data & Compatibility**: Validación de migraciones y APIs
    

#### RF-004: Validación por Stack

La estrategia se basa en un orquestador inteligente que integra un motor de validación central (MegaLinter) y herramientas especializadas.

| Dimensión de Validación (RF-003) | Herramienta Principal | Stacks Cubiertos | Configuración y Notas Clave |
| :--- | :--- | :--- | :--- |
| **Error Detection** (Linting y Formato) | **MegaLinter** (orquestando ESLint, Prettier, Pylint, Black, ShellCheck) | Frontend (TS/React), Backend (Python), Tooling (.cjs, .sh) | La configuración se centraliza en `.mega-linter.yml`. Se aplicarán reglas de formato (longitud de línea, etc.) y linting (variables no usadas, etc.). |
| **Testing & Coverage** | **Jest** (Frontend) <br> **Pytest** (Backend) | Frontend (TS/React) <br> Backend (Python) | Se ejecutan los frameworks de testing nativos. La cobertura se mide con `--coverage` (Jest) y `pytest-cov` (Pytest). Los umbrales de cobertura son configurables por proyecto. |
| **Build & Dependencies** | **npm/yarn/pnpm** <br> **pip** <br> **TypeScript Compiler (tsc)** | Frontend (TS/React) <br> Backend (Python) | Se valida la correcta instalación de dependencias (`npm ci`, `pip install -r ...`) y el éxito del proceso de build (`npm run build`, `tsc --noEmit`). |
| **Design Metrics** (Complejidad, LOC) | **MegaLinter** (usando los linters subyacentes) | Frontend (TS/React), Backend (Python) | **Complejidad Ciclomática:** 🟢(≤10), 🟡(11-15), 🔴(>15). <br> **LOC por Archivo:** 🟢(≤212), 🟡(213-300), 🔴(>300). <br> **Longitud de Línea:** Límite estricto de 100 caracteres (configurable). |
| **Security & Audit** (SAST & SCA) | **Snyk** (Principal) <br> **Semgrep** (Complementario) | Frontend (TS/React), Backend (Python) | **Snyk:** Para análisis de vulnerabilidades en dependencias (SCA) y código (SAST). <br> **Semgrep:** Para reglas de seguridad personalizadas y patrones específicos no cubiertos por Snyk. |
| **Data & Compatibility** (Migraciones, API) | **Herramientas de Migración** (ej. `manage.py makemigrations --check`) <br> **Spectral** (para OpenAPI) | Backend (Python) <br> API Specs (YAML/JSON) | Se validará que no haya migraciones de BD pendientes. Se usará Spectral para "lintear" las especificaciones de API y asegurar su consistencia. |
    

#### RF-005: Modos de Ejecución

- **Automático**: Basado en contexto detectado.
    
    - **Mecanismo de Implementación**: El Orquestador consultará el tipo de rama (feature, refactor, fix) y aplicará un conjunto de dimensiones preconfigurado para cada tipo.
        
- **Por Tarea (Validación DoD)**: Validación contra un Definition of Done (DoD) explícito.
    
    - **Mecanismo de Activación**: Presencia de etiquetas en el nombre de la rama Git (ej: feature/T-02_dod-full-test) o un archivo qa.json en la rama.
    - **Mapeo de DoD**: El sistema mapeará etiquetas a conjuntos de Dimensiones.
        - dod:code-review: Ejecuta Error Detection, Design Metrics, Security & Audit.
        - dod:all-tests: Ejecuta Build & Dependencies, Testing & Coverage, Data & Compatibility.
            
    - **Mecanismo de Implementación**: El Orquestador identificará la etiqueta DoD, seleccionará el plan de dimensiones correspondiente e invocará solo los wrappers de las herramientas necesarias (ej. para dod:code-review, llamará a los wrappers de MegaLinter y Snyk, pero no a los de Jest/Pytest).
        
- **Por Scope**: Validación de directorios o archivos específicos (--scope <path>).
    
    - **Mecanismo de Implementación**: El Orquestador pasará el <path> proporcionado a cada wrapper de herramienta. Los wrappers, a su vez, lo usarán como argumento para la herramienta subyacente (ej. jest <path>, snyk test --file=<path>).
        
- **Rápido (Modo Pre-commit)**: Ejecución optimizada para velocidad, ideal para pre-commit hooks. El rendimiento se medirá según los objetivos definidos en RNF-002, no por un tiempo absoluto.
    
    - **Alcance**: Se enfoca en los archivos modificados (git diff --cached), ignora archivos eliminados.
    - **Dimensiones Incluidas**: Error Detection (linting y formato) y Design Metrics (solo las más rápidas).
    - **Dimensiones Excluidas**: Se excluyen operaciones lentas como la ejecución completa de suites de tests (`Testing & Coverage`), análisis de dependencias (`Security & Audit`) y validaciones de build.
    - **Mecanismo de Implementación**: El Orquestador:
        
        1. Detectará el flag --fast o el contexto de pre-commit.
        2. Obtendrá la lista de archivos en staging.
        3. Invocará al wrapper de MegaLinter, que a su vez ejecutará la herramienta con variables de entorno para optimizar la velocidad (ej. VALIDATE_ONLY_CHANGED_FILES=true, DISABLE_LINTERS=...) y pasándole la lista de archivos.
        4. No se invocarán los wrappers de Snyk, Jest, Pytest ni los de validación de build.
    

#### RF-006: Reportes y Salida

- El sistema debe generar una salida en la consola que sea informativa, estructurada y fácil de leer, permitiendo a los usuarios identificar rápidamente el progreso, los problemas y los tiempos de ejecución.
    
- La salida debe seguir un formato visual de árbol, ser minimalista pero accionable.
    
- Se debe mostrar la duración de cada dimensión principal y el tiempo total de la validación.
    
- **Ejemplo de Salida en Consola:**
    
    Generated code
    
          `[ℹ️] QA System: Iniciando validación completa...  [DETECCIÓN DE CONTEXTO] (en 0.1s) └── ✅ Contexto detectado: Desarrollo de Tarea (T-02)     └── Mapeando a Dimensiones de Calidad: Error Detection, Testing, Security & Audit  [MOTOR DE VALIDACIÓN] ├── [⚙️] Ejecutando Dimensión: Error Detection... │   ├── 🟡 WARNING: src/components/NewFeature.jsx │   │   └── Línea 42: La variable 'userData' se asigna pero nunca se usa (no-unused-vars). │   └── Revisión de Frontend completada (en 1.8s) ├── ✅ Dimensión: Error Detection (Completada con advertencias en 2.5s) │ ├── [⚙️] Ejecutando Dimensión: Testing & Coverage... │   ├── Revisión de Backend completada (en 3.1s) │   └── Revisión de Frontend completada (en 4.2s) ├── ✅ Dimensión: Testing & Coverage (Completada en 7.3s) │ ├── [⚙️] Ejecutando Dimensión: Security & Audit... │   └── ❌ ERROR: yarn.lock │       └── Dependencia 'left-pad@1.3.0': Vulnerabilidad crítica de seguridad encontrada (CVE-2023-9999). └── ❌ Dimensión: Security & Audit (Fallida en 1.2s)  [RESUMEN FINAL] (Duración total: 11.1s) └── ❌ VALIDACIÓN FALLIDA      • Errores: 1     • Advertencias: 1      Archivos con problemas:     - ❌ yarn.lock (1 error)     - 🟡 src/components/NewFeature.jsx (1 advertencia)      Revisa los errores críticos para poder continuar.`
        
    
- **Códigos de Salida**: El proceso debe finalizar con códigos de salida estándar (0 para éxito, >0 para fallo) para facilitar la integración en scripts y pipelines CI/CD.
    
- **Jerarquía de Estados**: Un solo Error debe hacer que toda la validación falle. Si no hay errores pero sí Warnings, la validación puede considerarse completada con advertencias.
    

#### RF-007: Verificación de Entorno y Dependencias
- Antes de ejecutar las validaciones, el sistema debe verificar la **presencia** de las herramientas externas requeridas (ej: `megalinter`, `snyk`, `pytest`).
- Si una herramienta no se encuentra en el `PATH`, el sistema **debe fallar inmediatamente** la ejecución.
- Se debe emitir un mensaje de error claro y accionable que identifique la herramienta faltante y la dimensión de QA afectada. El mensaje debe sugerir un método de instalación estándar (ej: `Error: 'snyk' no encontrado. Por favor, instálelo globalmente con 'npm install -g snyk' o añádalo a las devDependencies del proyecto para ejecutar la dimensión 'Security & Audit'.`).
- La gestión de versiones específicas de las herramientas debe ser delegada a los archivos de configuración de dependencias del proyecto (ej. `package.json`, `requirements.txt`), que son la fuente de verdad para el entorno.

#### RF-008: Mecanismo de Feedback
- El sistema debe incluir una opción en la CLI para facilitar el reporte de problemas, como falsos positivos o errores en la herramienta.
- Un comando como `yarn qa --report-issue` guiará al usuario para crear una issue en el repositorio del proyecto con una plantilla pre-llenada, incluyendo la versión de la herramienta, el contexto de ejecución y el error detectado.

#### **RF-009: Interfaz de Ayuda y Auto-documentación**

- **Objetivo**: Proporcionar a los usuarios una forma rápida y directa de entender cómo usar la herramienta, sus comandos, flags y modos de ejecución.
    
- **Requisito**: El sistema debe exponer un mecanismo de ayuda estándar en la CLI.
    
    - Al ejecutar el comando con el flag --help (o -h), se debe mostrar en la consola un mensaje de ayuda claro y estructurado.
        
    - El mensaje de ayuda debe listar y describir:
        
        - El uso básico del comando (ej. yarn qa [options]).
            
        - Todos los flags disponibles (ej. --scope, --dimension, --fast, --report-issue) con una breve explicación de su función.
            
        - Los modos de ejecución principales y cómo se activan (si es aplicable a través de flags).
            
        - Ejemplos de uso comunes para ilustrar la funcionalidad.
            
- **Mantenibilidad**: La información de ayuda debe generarse dinámicamente a partir de la configuración de los comandos para evitar que quede desactualizada a medida que se añaden o modifican opciones.
    

**Ejemplo de Salida del Comando de Ayuda:**

Generated code

```
$ yarn qa --help

QA System - Validador de Calidad de Código Automatizado

Uso:
  yarn qa [options]

Descripción:
  Ejecuta un conjunto de validaciones de calidad de código basadas en el contexto
  del proyecto (rama, archivos modificados) o en los flags proporcionados.

Opciones:
  -h, --help                Muestra este mensaje de ayuda.
  --scope <path>            Ejecuta la validación solo en el directorio o archivo
                            especificado.
                            Ej: --scope=backend/src/api/
  --dimension <name>        Ejecuta solo una dimensión de calidad específica.
                            Dimensiones: ErrorDetection, Testing, Security, ...
  --fast                    Activa el modo rápido (pre-commit), validando solo
                            archivos en staging con linters rápidos.
  --report-issue            Abre una plantilla para reportar un problema con la
                            herramienta.
  -v, --version             Muestra la versión actual de la herramienta.

Ejemplos:
  # Ejecutar validación automática basada en el contexto de la rama
  $ yarn qa

  # Validar solo el directorio de componentes de frontend
  $ yarn qa --scope=frontend/src/components

  # Ejecutar una validación rápida antes de un commit
  $ yarn qa --fast
```

### 6. Requisitos No Funcionales

#### RNF-001: Modularidad

- **Límite de LOC**: Como norma general, ningún archivo debería exceder las 212 líneas de código. Este límite, derivado de estándares internos, promueve la alta cohesión y el Principio de Responsabilidad Única (SRP). Las excepciones deben ser justificadas y documentadas.
    

#### RNF-002: Performance

- **Enfoque de Medición Relativa**: El rendimiento se medirá en relación con una baseline para evitar metas absolutas que no consideran las variaciones de hardware o la complejidad del código.
- **Proyecto de Referencia para Benchmarking**: Se utilizará un proyecto de referencia interno para establecer baselines de rendimiento y validar la escalabilidad. Características: Monorepo con ~150k LOC (60% TypeScript/React, 40% Python), ~2000 dependencias, ~5000 tests.
- **Objetivos de Performance**:
	- **Regresión de Performance**: Una ejecución sobre un conjunto de cambios no debe exceder en más de un 20% el tiempo de la baseline establecida para un scope comparable.
	- **Modo Rápido (Guía)**: En el proyecto de referencia y bajo hardware estándar, el tiempo de ejecución para cambios típicos (hasta 10 archivos) se monitoreará para mantenerse en un rango competitivo (ej. P95 < 15 segundos), sirviendo como un indicador de salud y no como un criterio de fallo estricto.
	- **Escalabilidad**: El tiempo de ejecución debe escalar de forma predecible (sub-lineal o casi-lineal) con el número de archivos analizados. Se debe favorecer la ejecución paralela de validaciones independientes.
    

#### RNF-003: Extensibilidad

- Agregar nuevo lenguaje/herramienta sin modificar código existente
    
- Configuración declarativa para nuevas validaciones
    
- Plugins para dimensiones personalizadas
    

#### RNF-004: Compatibilidad

- Node.js 18+
    
- **Sistemas Operativos**:
	- **Tier 1 (Soporte completo y probado)**: Ubuntu 20.04+, macOS 12+, Windows 11 con WSL2.
	- **Tier 2 (Soporte de mejor esfuerzo)**: Windows 11 nativo (PowerShell 7+).
    
- Integración con GitHub Actions, GitLab CI, Jenkins
    

#### RNF-005: Mantenibilidad

- Cobertura de pruebas >80%
    
- Documentación inline para cada módulo
    
- Logs estructurados para debugging, siguiendo el formato visual definido en RF-006.
    

### 7. Supuestos y Dependencias

**Supuestos**:

- Los proyectos usan Git para control de versiones.
- El entorno de ejecución tiene Node.js 18+ disponible.
- El proyecto utiliza un gestor de paquetes de Node.js estándar (npm, yarn, pnpm) y define los comandos de calidad como scripts en `package.json`.    
- Estructura de proyecto estándar (frontend/, backend/, scripts/)
    

**Dependencias**:

- Git CLI para detección de cambios
- Node.js 18+ runtime
- Herramientas externas de validación por stack
- Sistema de archivos con permisos de lectura
    

### 8. Roadmap Iterativo (Releases)

#### Release 0.1.0 - MVP & Core (4 semanas)

- **Estructura base de la CLI (qa-cli.cjs) utilizando yargs o commander, incluyendo un comando --help funcional (RF-009).**
- Sistema de logging centralizado (formato visual).
- Detección de contexto básica (archivos modificados).
- Integración de MegaLinter para cubrir las dimensiones de **Error Detection** y **Design Metrics**.
- Implementación del **Modo Rápido** funcional para pre-commit.

#### Release 0.2.0 - Testing & Security (4 semanas)
- Implementación de dimensiones **Testing & Coverage** (Jest/Pytest) y **Security & Audit** (Snyk/Semgrep).
- Detección de contexto mejorada (tipo de rama).
- Verificación de dependencias de entorno (RF-007).

#### Release 0.3.0 - Advanced & Config (3 semanas)
- **Integración de validadores** para las dimensiones **Build & Dependencies** y **Data & Compatibility**.
- **Refinamiento de la configuración por proyecto** para umbrales y reglas, utilizando los mecanismos nativos de las herramientas (ej. `.mega-linter.yml`, `snyk.yml`).
- Reportes estructurados con timings detallados.

#### Release 0.4.0 - Workflow & Integration (3 semanas)
- Implementación del mecanismo de validación contra **DoD (RF-005)**.
- Integración CI/CD (GitHub Actions).
- Implementación del **Mecanismo de Feedback (RF-008)**.
- Generación de reportes opcionales en formato JSON.

#### Release 1.0.0 - Production Ready (4 semanas)
- Optimización de performance y paralelización.
- Cobertura de pruebas del sistema QA >80%.
- Documentación completa para usuarios y desarrolladores.
- Estabilización y corrección de bugs.
- (Futuro post-1.0) Sistema de plugins y métricas avanzadas.

### 9. Criterios de Verificación & Validación

#### Verificación (¿Construimos el producto correctamente?)

- Todos los módulos ≤212 LOC
- Pruebas unitarias para cada módulo
- La salida del logger cumple con el formato especificado en RF-006
- Sin dependencias circulares
- Documentación actualizada
    

#### Validación (¿Construimos el producto correcto?)

- Agentes IA pueden ejecutar validaciones sin intervención humana
- Tiempo de ejecución cumple con requisitos
- Detecta correctamente errores inyectados intencionalmente
- Integración exitosa con pipelines existentes
- Feedback positivo de usuarios piloto
    

### 10. KPIs & Analítica

|KPI|Objetivo|Medición|
|---|---|---|
|Regresión de Performance|<20% de incremento sobre la baseline|Monitoreo de la duración de la validación completa en CI para el **Proyecto de Referencia**.|
|Salud del Modo Rápido|Mantener P95 < 15s como guía de salud (no como criterio de fallo estricto)|Percentil 95 de ejecuciones locales sobre cambios de hasta 10 archivos en el **Proyecto de Referencia**.|
|Calidad del Código (Métricas)|<5% de archivos en estado 🔴 Rojo|Análisis estático continuo sobre la base de código.|
|Salud de Seguridad|0 vulnerabilidades 🔴 Rojas (Críticas/Altas)|Reporte de Snyk en cada ejecución de CI.|
|Cobertura de Pruebas|Mantenerse en el umbral 🟢 Verde (ej. ≥85% como base, con objetivos más altos para módulos críticos). El umbral es configurable.|Reporte de cobertura de Jest/Pytest en CI.|
|Tasa de Falsos Positivos|<5%|Reportes de usuarios a través del mecanismo de feedback de la CLI (**RF-008**).|
|Adopción por Agentes IA|>90% de los commits validados|Análisis de los logs del pipeline de CI.|

### 11. Riesgos Principales

|   |   |   |   |
|---|---|---|---|
|Riesgo|Probabilidad|Impacto|Mitigación|
|Herramientas externas cambian API|Media|Alto|Capa de abstracción, versionado|
|Performance degrada con proyecto grande|Media|Medio|Caché, ejecución paralela|
|Dificultad mantener límite 212 LOC|Baja|Medio|Reviews estrictos, refactoring continuo|
|Baja adopción por complejidad|Baja|Alto|UX intuitiva, documentación clara|
|Incompatibilidad con nuevos lenguajes|Media|Bajo|Arquitectura extensible|

### 12. Temas Abiertos / Futuro

- **Soporte para más lenguajes**: Go, Rust, Java
- **Integración con IDEs**: VSCode, IntelliJ
- **Dashboard web**: Visualización de métricas históricas
- **Machine Learning**: Detección inteligente de code smells
- **Configuración por proyecto**: Extender y refinar la configuración nativa de las herramientas orquestadoras (ej. `.mega-linter.yml`, `.snyk`).
- **Modo watch**: Validación continua durante desarrollo
- **Integración con servicios cloud**: AWS CodeGuru, SonarCloud
    

### 13. Aprobación

|   |   |   |   |
|---|---|---|---|
|Rol|Nombre|Fecha|Firma|
|Product Owner|[Pendiente]|||
|Arquitecto de Software|[Pendiente]|||
|Tech Lead|[Pendiente]|||
|QA Lead|[Pendiente]|||

---

## Anexo A – Glosario

- **Agente de Programación IA**: Sistema de inteligencia artificial capaz de generar código automáticamente
    
- **CLI**: Command Line Interface - Interfaz de línea de comandos
    
- **Contexto**: Estado actual del desarrollo (rama, archivos modificados, tipo de cambio)
    
- **Dimensión**: Categoría de validación (testing, seguridad, etc.)
    
- **DoD**: Definition of Done - Criterios de aceptación para completar una tarea
    
- **LOC**: Lines of Code - Líneas de código
    
- **Scope**: Alcance de validación (archivos/directorios específicos)
    
- **Stack**: Conjunto de tecnologías (Frontend/Backend)
    
- **SOLID**: Principios de diseño orientado a objetos
    
- **QA Gate**: Punto de control de calidad que debe pasar el código
    

---

## Estructura de Implementación Propuesta (Revisada y Alineada)

El sistema se diseñará siguiendo un patrón de **Orquestador Inteligente sobre Herramientas Externas**. La implementación se centrará en una capa de orquestación delgada pero potente, responsable de la lógica de negocio, que a su vez invoca a las herramientas de validación externas.

Generated bash

```
scripts/qa/ ├── qa-cli.cjs # <150 LOC - Entry point. Usa 'yargs' o 'commander' para │ # definir comandos, parsear flags y generar la ayuda (--help). │ # Llama al orquestador con la configuración parseada. ├── core/ │ ├── Orchestrator.cjs # <200 LOC - Lógica principal: detecta, planea, invoca wrappers, reporta. │ └── ContextDetector.cjs# <150 LOC - Lógica para leer git, flags, etc. ├── tool-wrappers/ # Capa de abstracción sobre herramientas externas. │ ├── MegaLinterWrapper.cjs # <150 LOC - Sabe cómo llamar a MegaLinter (con env vars, flags). │ ├── SnykWrapper.cjs # <100 LOC - Sabe cómo llamar a Snyk y parsear su salida. │ ├── JestWrapper.cjs # <100 LOC - Sabe cómo llamar a Jest. │ └── PytestWrapper.cjs # <100 LOC - Sabe cómo llamar a Pytest. ├── shared/ │ ├── QALogger.cjs # <200 LOC - Sistema de logging visual (formato árbol). │ └── QAConfig.cjs # <100 LOC - Carga de configuraciones (umbrales, mapeos DoD). └── templates/ └── report-issue.md # Plantilla para el mecanismo de feedback (RF-008).
```

Esta estructura garantiza modularidad, mantenibilidad y extensibilidad, respetando el límite de 212 LOC por archivo y alineándose con la arquitectura de orquestación.