# Plan de Trabajo: Sistema de Automatización QA

**Documento** Plan de Trabajo  
**Versión** 2.0  
**Fecha** 06 de julio de 2025  
**Autor** Tech Lead / Project Manager  
**Estado** Borrador para Aprobación

## 1. Introducción y Objetivos

Este documento detalla el plan de trabajo para la ejecución del proyecto "Sistema de Automatización QA para Desarrollo con Agentes IA", según lo definido en el Documento de Requisitos del Producto (PRD-QA.md). El objetivo principal es desarrollar un sistema de automatización QA modular, extensible y eficiente que sirva como herramienta para que los Agentes de Programación IA validen la calidad del código que generan.

El plan sigue un enfoque iterativo, distribuyendo el trabajo en cinco releases principales (R0 a R4), cada una con una duración de dos a tres semanas. Cada release se compone de Paquetes de Trabajo (Work Packages - WP) cohesivos, con un objetivo de complejidad de 20 a 35 puntos por paquete, para asegurar una carga de trabajo predecible y sostenible.

Este plan de trabajo es el documento rector para la asignación de tareas, el seguimiento del progreso y la gestión de dependencias durante todo el ciclo de vida del proyecto.

## 2. Metodología y Proceso

La ejecución del proyecto se regirá por los siguientes principios y procesos:

- **Desarrollo Iterativo**: El proyecto se ejecuta en **sprints de dos semanas**. Cada **Release** (con una duración de 3 a 4 semanas, agrupando típicamente dos sprints) define un hito de negocio. Los **Paquetes de Trabajo (WP)**, con una complejidad objetivo de 20-35 puntos, están diseñados para ser la unidad de trabajo principal a completar dentro de un único sprint, asegurando un flujo de entrega predecible.
- **Gestión de Tareas**: Las tareas, definidas en el Catálogo (Sección 7), son las unidades funcionales de trabajo. Cada una posee un Identificador Global de Tarea (T-XX) que es único e inmutable.
- **Flujo de Ramas (Git Flow)**: Se utilizará un flujo de trabajo estándar. Las ramas de funcionalidad se nombrarán usando el Identificador Global de Tarea: feature/T<XX>-nombre-descriptivo.
- **Calidad del Código**: Se aplicarán estrictamente las directrices del PRD, incluyendo el límite de 212 LOC (RNF-001) y la cobertura de pruebas >80% (RNF-005). La tarea T-01 establece un pipeline de CI con puertas de calidad automáticas.
- **Gestión de Riesgos**: La matriz de riesgos (definida en PRD-QA.md, §11) será revisada formalmente al finalizar cada hito de release. Esta actividad corresponde a la tarea de proceso **T-18**, la cual no computa en la complejidad de los Paquetes de Trabajo de desarrollo.


## 3. Metodología de Análisis de Complejidad

Para cuantificar la complejidad de cada tarea, se utiliza un modelo de puntuación basado en cuatro criterios (escala 1-5).

- **C1: Esfuerzo de Implementación (Effort)**: Volumen de código, configuración y pruebas.

- **C2: Riesgo Técnico y Novedad (Risk)**: Incertidumbre, uso de tecnologías nuevas.

- **C3: Dependencias e Integración (Deps)**: Interconexión con otros módulos.

- **C4: Ambigüedad de Alcance (Scope)**: Claridad de los requisitos.


La Complejidad Total de una tarea es C1 + C2 + C3 + C4. Una tarea con Complejidad Total > 15 debe desglosarse en Subtareas (ST) manejables.

### Tabla de Evaluación de Complejidad por Tarea

|   |   |   |   |   |   |   |
|---|---|---|---|---|---|---|
|#|Tarea|C1 (Effort)|C2 (Risk)|C3 (Deps)|C4 (Scope)|Total|
|**T-01**|Baseline & CI/CD|5|2|2|2|11|
|**T-02**|CLI Core & Help (--help)|3|2|2|2|9|
|**T-03**|Context Detector (Git & FS)|4|3|3|2|12|
|**T-04**|Orchestrator Core Logic|2|2|2|2|8|
|**T-05**|Visual Logger & Reporter|3|2|3|4|12|
|**T-06**|MegaLinter Wrapper|3|3|3|2|11|
|**T-07**|Fast Mode (Pre-commit)|3|2|4|2|11|
|**T-08**|Jest & Pytest Wrappers|4|2|3|3|12|
|**T-09**|Snyk & Semgrep Wrappers|4|3|3|3|13|
|**T-10**|Environment & Dependency Checker|2|2|2|1|7|
|**T-11**|Build & Dependency Validators|3|2|3|2|10|
|**T-12**|Data & Compatibility Validators|3|3|3|2|11|
|**T-13**|DoD Mode (Definition of Done)|3|3|4|3|13|
|**T-14**|CI/CD Integration (GitHub Actions)|3|2|4|2|11|
|**T-15**|Feedback Mechanism (--report-issue)|2|1|2|2|7|
|**T-16**|Performance Benchmarking|4|3|4|4|15|
|**T-17**|System Test Coverage & Docs|4|2|4|3|13|
|**T-18**|Risk Matrix Review (Proceso)|1|2|1|1|5|
|**T-19**|QAConfig & Dynamic Configuration|3|2|2|1|8|
|**T-20**|Plan Selector & Mode Handler|3|3|3|2|11|
|**T-21**|Wrapper Execution Coordinator|3|2|3|2|10|
|**Total**||||||**213**|

## 4. Roles y Responsabilidades

- **Product Owner**: Responsable de definir prioridades y aprobar releases.

- **Tech Lead / Arquitecto de Software**: Responsable de la arquitectura, calidad del código y supervisión de la ejecución de este plan.

- **Equipo de Desarrollo**: Responsable de implementar las tareas asignadas. Este equipo incluye a los Desarrolladores Humanos y, potencialmente, a los Agentes de Programación IA. La asignación de tareas a Agentes IA será gestionada por el Tech Lead, y sus resultados serán siempre revisados por un Desarrollador Humano antes de la integración, siguiendo los mismos estándares de calidad que se aplican a todo el código.

- **QA Engineers**: Colaboradores en la definición de criterios de validación y pruebas del sistema.


## 5. Estructura del Plan y Desglose de Trabajo (WBS)

El plan se organiza en una jerarquía de cinco niveles para una trazabilidad completa.

- **Identificador Global de Tarea (GTI)**: Código único (T-XX) para cada tarea. Representa el "QUÉ".

- **Identificador de Elemento de Trabajo (WII)**: Código jerárquico que describe la ubicación de una unidad de trabajo en el plan. Representa el "DÓNDE" y "CUÁNDO".


### Formato del WII: R<#>.WP<#>-T<XX>-ST<#>

Ejemplo: **R0.1.WP2-T03-ST1** identifica la "Subtarea 1" de la "Tarea T-03", planificada para el "Paquete de Trabajo 2" de la "Release 0.1.0".

## 6. Plan de Ejecución por Releases

### Release 0.1.0: MVP & Core (Plazo: 4 semanas)

**Objetivo:** Entregar un MVP funcional que pueda ejecutar las validaciones de linting y métricas de diseño, incluyendo el modo rápido para pre-commit.

|   |   |   |   |
|---|---|---|---|
|ID Paquete|Complejidad|Tareas|Justificación del Agrupamiento|
|R0.WP1|30|T-01, T-02, T-05, T-19|**Fundación y Herramientas Base**: Agrupa las tareas de infraestructura indispensables: el baseline del proyecto (11), la CLI (9), el Logger visual (12) y el sistema de configuración dinámica (8). Crea una base sólida y bien probada.|
|R0.WP2|29|T-03, T-04, T-20|**Núcleo del Sistema**: Detector de Contexto (12), Orchestrator simplificado (8) y Plan Selector con prototipos (11). **T-20 absorbe la complejidad de modos y mapeos, reduciendo la carga de T-04.**|
|R0.WP3|28|T-21, T-06, T-07, T-10|**Coordinación y Primera Funcionalidad**: Wrapper Coordinator (10), MegaLinter Wrapper (11), Fast Mode ajustado (complejidad reducida a 7 puntos), y verificador de entorno (7).|
**Análisis de la Release 0.1.0:** En lugar de dos paquetes de 35 puntos al límite del riesgo, ahora tenemos tres paquetes muy equilibrados (30, 30, 22), lo que permite un mejor flujo de trabajo, reduce el riesgo por paquete y facilita la asignación de trabajo en paralelo.

### Release 0.2.0: Testing & Security (Plazo: 4 semanas)

**Objetivo:** Expandir las capacidades del sistema para incluir pruebas, cobertura, seguridad y mejorar la robustez.

|   |   |   |   |
|---|---|---|---|
|ID Paquete|Complejidad|Tareas|Justificación del Agrupamiento|
|R0.WP4|25|T-08, T-09|**Nuevas Dimensiones de Validación**: Se beneficia de T-21 ya implementado para coordinación de wrappers.|

**Análisis de la Release 0.2.0:** Se elimina el paquete de 7 puntos que causaba el desequilibrio. Ahora tenemos un único paquete de trabajo robusto y temáticamente coherente de 32 puntos, ideal para un sprint de 2-3 semanas dentro de la release.

### Release 0.3.0: Advanced & Config (Plazo: 3 semanas)

**Objetivo:** Completar el soporte para todas las dimensiones de validación.

|   |   |   |   |
|---|---|---|---|
|ID Paquete|Complejidad|Tareas|Justificación del Agrupamiento|
|R0.WP5|21|T-11, T-12|**Validadores de Stack Avanzados**: Mantiene el agrupamiento de los validadores de Build (10) y Data/Compatibility (11). Aunque es un paquete más ligero (21 puntos), es altamente cohesivo y adecuado para una release de 3 semanas que puede necesitar tiempo extra para pruebas de integración.|

**Análisis de la Release 0.3.0:** La carga se mantiene, ya que era razonable. La ligereza del paquete permite absorber posibles desviaciones o iniciar tareas de investigación para la siguiente release.

### Release 0.4.0: Workflow & Integration (Plazo: 3 semanas)

**Objetivo:** Integrar el sistema en flujos de trabajo de desarrollo avanzados (DoD, CI/CD) y añadir mecanismos de feedback.

|   |   |   |   |
|---|---|---|---|
|ID Paquete|Complejidad|Tareas|Justificación del Agrupamiento|
|R0.WP6|31|T-13, T-14, T-15|**Integración en el Flujo de Desarrollo**: Agrupa todas las tareas orientadas a la experiencia y el flujo de trabajo del desarrollador: el modo DoD (13), la integración en CI/CD (11) y el mecanismo de feedback (7). Juntas, forman un entregable completo de "integración en el workflow".|

**Análisis de la Release 0.4.0:** Se fusionan los paquetes desequilibrados en uno solo de 31 puntos, mucho más robusto y representativo de un sprint de trabajo completo.

### Release 1.0.0: Production Ready (Plazo: 4 semanas)

**Objetivo:** Asegurar la fiabilidad, rendimiento y calidad final del producto para su lanzamiento oficial.

|   |   |   |   |
|---|---|---|---|
|ID Paquete|Complejidad|Tareas|Justificación del Agrupamiento|
|R1.WP1|28|T-16, T-17|**Hardening y Estabilización**: Agrupa las tareas finales de "hardening": la creación de benchmarks de rendimiento y KPIs (15) y el aumento de la cobertura de pruebas y documentación (13). Es un paquete final cohesivo para asegurar la calidad del producto.|

**Análisis de la Release 1.0.0:** La carga se mantiene en 25 puntos, lo cual es adecuado para una release de 4 semanas, ya que estas tareas de estabilización y documentación a menudo implican una sobrecarga no reflejada en la complejidad pura de la implementación (revisiones, correcciones de última hora, etc.).

## 7. Catálogo de Tareas (Work Breakdown Structure - WBS)

|   |   |   |   |   |   |   |
|---|---|---|---|---|---|---|
|# (GTI)|Tarea (rama Git: feature/T<XX>-...)|Alcance / Entregables verificables|Requisitos PRD y Gaps Abordados|Depende de|Criterio de aceptación|Evidencia / Artefactos|
|**T-01**|Baseline & CI/CD|Configuración inicial del proyecto: package.json, linters (ESLint, Prettier), estructura de directorios (scripts/qa/...). Pipeline de CI en GitHub Actions que ejecuta linting y pruebas en cada PR.|RNF-001, RNF-005|—|1. Pipeline verde en commit inicial. 2. PRs fallan si el linting no pasa. 3. Estructura de directorios creada según PRD.|package.json, .github/workflows/ci.yml, logs de CI.|
|**T-02**|CLI Core & Help (--help)|Implementación del punto de entrada qa-cli.cjs usando yargs o commander. Debe parsear flags básicos (--fast, --scope) y mostrar un menú de ayuda con yarn qa --help.|RF-001, RF-009|T-01|1. yarn qa --help muestra todas las opciones y ejemplos. 2. El script parsea y reconoce los flags correctamente.|qa-cli.cjs, screenshots de la salida de --help.|
|**T-03**|Context Detector (Git & FS)|Módulo ContextDetector.cjs que usa la CLI de git para detectar la rama actual y los archivos modificados (staged y unstaged). Debe poder determinar el stack tecnológico por extensión de archivo.|RF-002|T-01|1. El módulo devuelve correctamente la lista de archivos modificados. 2. Identifica correctamente el tipo de rama (feature, fix, etc.). 3. Mapea archivos a sus stacks (TS, Python, etc.).|Pruebas unitarias para el módulo, logs de depuración.|
|**T-04**|Orchestrator Core Logic|Módulo Orchestrator.cjs simplificado que actúa como coordinador principal: recibe el contexto del ContextDetector, invoca al PlanSelector (T-20) para obtener el plan de ejecución, delega la ejecución al WrapperCoordinator (T-21) y recopila resultados finales para el Logger. **Responsabilidad única: coordinación del flujo principal sin lógica de negocio compleja.** Cumple límite <150 LOC.|Arquitectura §2|T-03, T-05, T-20, T-21|1. Recibe contexto del ContextDetector. 2. Invoca PlanSelector para obtener plan de dimensiones. 3. Delega ejecución al WrapperCoordinator. 4. Recopila y formatea resultados para el Logger. 5. Mantiene <150 LOC.|Pruebas unitarias con mocks de PlanSelector y WrapperCoordinator; verificación de cumplimiento 150 LOC.|
|**T-05**|Visual Logger & Reporter|Módulo QALogger.cjs que genera la salida de consola estructurada en árbol, con colores, timings y resúmenes, tal como se especifica en el ejemplo del PRD. **Incluye generación opcional de reportes en formato JSON para integración con herramientas externas (según PRD §8 Release 0.4.0).**|RF-006, PRD §8 Release 0.4.0|T-01|1. La salida coincide con el formato de RF-006. 2. Muestra correctamente los estados (✅, 🟡, ❌). 3. Calcula y muestra los tiempos de ejecución. **4. Genera reportes JSON opcionales cuando se requiera.**|Pruebas de snapshot para la salida del logger; pruebas de formato JSON.|
|**T-06**|MegaLinter Wrapper|Módulo MegaLinterWrapper.cjs que sabe cómo invocar a MegaLinter con las variables de entorno y flags correctos para ejecutar las dimensiones Error Detection y Design Metrics.|RF-003, RF-004|T-21, T-05|1. yarn qa ejecuta MegaLinter en los archivos cambiados. 2. La salida se formatea según RF-006. 3. Falla si MegaLinter encuentra errores.|Logs de CI, PR con el código del wrapper, screenshots de la salida.|
|**T-07**|Fast Mode (Pre-commit)|Ajustes específicos en MegaLinterWrapper para optimización de velocidad cuando recibe indicador de modo rápido del PlanSelector. **La lógica principal de Modo Rápido se movió a T-20.**|RF-005 (Rápido)|T-06, T-20|1. yarn qa --fast es significativamente más rápido que una ejecución normal. 2. Solo analiza archivos en staging. 3. La salida indica que se está ejecutando en modo rápido.|Scripts de benchmark, logs de CI.|
|**T-08**|Jest & Pytest Wrappers|Módulos JestWrapper.cjs y PytestWrapper.cjs para ejecutar la dimensión Testing & Coverage. Deben saber cómo ejecutar los tests en un scope específico y capturar los resultados de cobertura.|RF-003, RF-004|T-21, T-05, T-10|1. yarn qa ejecuta Jest y Pytest en los directorios correspondientes. 2. Reporta correctamente los resultados de las pruebas y la cobertura.|Reportes de cobertura, logs de CI.|
|**T-09**|Snyk & Semgrep Wrappers|Módulo SnykWrapper.cjs para ejecutar la dimensión Security & Audit. Debe poder invocar a Snyk para analizar dependencias y código, y parsear las vulnerabilidades encontradas.|RF-003, RF-004|T-21, T-05, T-10|1. yarn qa ejecuta Snyk y reporta vulnerabilidades. 2. La validación falla si se encuentran vulnerabilidades críticas.|Reporte de Snyk, logs de CI.|
|**T-10**|Environment & Dependency Checker|Lógica que se ejecuta una única vez al inicio del `Orchestrator.cjs` para verificar la presencia de todas las herramientas externas requeridas (git, megalinter, snyk, etc.) en el PATH del sistema, antes de proceder con cualquier plan de validación.|RF-007|T-01|1. El script falla inmediatamente si una herramienta requerida no está instalada. 2. El mensaje de error es claro, accionable e identifica la herramienta faltante.|Pruebas de integración en un entorno sin una de las dependencias.|
|**T-11**|Build & Dependency Validators|Wrappers para herramientas como npm, tsc y pip. Implementa la dimensión Build & Dependencies verificando que las dependencias se instalan (npm ci) y el código compila (tsc --noEmit).|RF-003, RF-004|T-04, T-05|1. yarn qa ejecuta npm ci y tsc --noEmit. 2. La validación falla si alguno de estos comandos falla.|Logs de CI.|
|**T-12**|Data & Compatibility Validators|Wrappers para herramientas como Spectral o scripts de Django. Implementa la dimensión Data & Compatibility para validar especificaciones OpenAPI y comprobar migraciones de BD pendientes.|RF-003, RF-004|T-04, T-05|1. yarn qa ejecuta Spectral en los archivos de API. 2. La validación falla si hay errores de especificación o migraciones pendientes.|Logs de CI, reportes de Spectral.|
|**T-13**|DoD Configuration & Validation|Configuración y validación de los mapeos DoD establecidos en T-20. Incluye tests de integración para diferentes etiquetas DoD y validación de que los planes generados son correctos. **La lógica principal de DoD se movió a T-20.**|RF-005 (Por Tarea)|T-20|1. Una rama con dod:code-review ejecuta solo las dimensiones de linting y seguridad. 2. Una rama sin etiqueta DoD ejecuta el modo automático por defecto. **3. Maneja toda la lógica específica de mapeo DoD de forma independiente.**|Pruebas unitarias para la lógica de mapeo; integración con T-04 para delegación de responsabilidades.|
|**T-14**|CI/CD Integration (GitHub Actions)|Creación de un workflow de GitHub Actions reutilizable que ejecuta yarn qa en cada Pull Request, actuando como una puerta de calidad (QA Gate).|RNF-004|T-01|1. El workflow se ejecuta en cada PR. 2. Un PR con código de mala calidad es bloqueado por el workflow fallido.|reusable-qa-workflow.yml, PR de ejemplo bloqueado.|
|**T-15**|Feedback Mechanism (--report-issue)|Implementación del flag yarn qa --report-issue que abre el navegador del usuario en la página de "Nueva Issue" del repositorio, pre-llenando una plantilla con datos del entorno.|RF-008|T-02|1. El comando abre la URL correcta. 2. La plantilla de issue (report-issue.md) existe en el repositorio.|report-issue.md template, prueba manual del comando.|
|**T-16**|Performance Benchmarking & KPIs|Creación de scripts y un pipeline de CI para ejecutar el sistema QA sobre el "Proyecto de Referencia" y medir los tiempos de ejecución. Establece las baselines de rendimiento. **Implementa el sistema de monitoreo de KPIs definidos en PRD §10: regresión de performance, salud del modo rápido, métricas de calidad, seguridad, cobertura, falsos positivos y adopción por Agentes IA.**|RNF-002, PRD §10|T-14|1. Un job de CI ejecuta el benchmark y reporta los tiempos. 2. Las baselines para el modo completo y rápido están documentadas. **3. Dashboard de KPIs implementado y operativo. 4. Alertas configuradas para métricas fuera de umbrales.**|Pipeline de benchmark, documento con los resultados de la baseline, **dashboard de KPIs operativo, configuración de alertas.**|
|**T-17**|System Test Coverage & Docs|Tarea de "hardening" final. Aumentar la cobertura de pruebas unitarias y de integración del propio sistema QA a >80%. Completar la documentación para desarrolladores y usuarios.|RNF-005, RNF-004, Roadmap 1.0.0|Todas las tareas de desarrollo (T-01 a T-16)|1. El reporte de cobertura muestra >80%. 2. La documentación (README.md, etc.) está completa y actualizada. **3. Las pruebas de sistema se han ejecutado y superado con éxito en los entornos de SO definidos como Tier 1 en RNF-004.**|Reporte de cobertura, archivos de documentación, logs de ejecución en SO Tier 1.|
|**T-18**|Risk Matrix Review (Proceso)|Revisión de la matriz de riesgos al final de cada hito (R0-R4). El entregable es un artefacto versionado y auditable.|PRD §11|—|1. La revisión se completa dentro de la semana de cierre del hito. 2. El artefacto de salida sigue la nomenclatura estándar.|Minuta de reunión y commit con la actualización de la matriz de riesgos en PRD-QA.md.|
|**T-19**|QAConfig & Dynamic Configuration|Implementación del módulo QAConfig.cjs (según PRD §Estructura de Implementación) para carga de configuraciones, umbrales y mapeos DoD. Sistema de configuración dinámica de herramientas en tiempo de ejecución mencionado en PRD §4.|PRD §Estructura, PRD §4|T-01|1. El módulo QAConfig.cjs existe y es funcional. 2. Carga correctamente las configuraciones de umbrales. 3. Maneja los mapeos DoD definidos. 4. Permite configuración dinámica de herramientas.|QAConfig.cjs, pruebas unitarias, documentación de configuración.|
|**T-20**|Plan Selector & Mode Handler|Módulo PlanSelector.cjs que implementa la lógica de mapeo contexto-dimensiones y manejo de todos los modos de ejecución de RF-005: Automático, Por Scope, Rápido y DoD. **Absorbe la lógica compleja de selección de dimensiones que originalmente estaba en T-04, coordinación con T-07 para Modo Rápido y la lógica de DoD originalmente planeada para T-13.** Incluye prototipos de MegaLinter y Snyk para validación temprana.|RF-005 (todos los modos), RF-002|T-03, T-19|1. Implementa mapeo contexto → dimensiones para modo Automático. 2. Maneja propagación de --scope a dimensiones específicas. 3. Implementa lógica de Modo Rápido (coordinación que estaba en T-07). 4. Implementa detección y mapeo de etiquetas DoD. 5. Incluye prototipos funcionales de MegaLinter y Snyk.|Pruebas unitarias para cada modo; prototipos funcionales; pruebas de integración con herramientas reales; documentación de mapeos.|
|**T-21**|Wrapper Execution Coordinator|Módulo WrapperCoordinator.cjs que maneja la ejecución secuencial/paralela de wrappers según el plan recibido del PlanSelector. **Absorbe la responsabilidad de invocar wrappers y manejar sus resultados que originalmente estaba en T-04.** Incluye manejo de errores, timeouts y agregación de resultados de múltiples herramientas.|Arquitectura §2, RNF-002|T-05, T-10, T-20|1. Ejecuta wrappers según el plan recibido. 2. Maneja ejecución paralela cuando sea posible. 3. Agrega resultados de múltiples wrappers. 4. Maneja errores y timeouts de herramientas externas. 5. Proporciona interfaz uniforme para el Orchestrator.|Pruebas unitarias con mocks de wrappers; pruebas de manejo de errores; pruebas de ejecución paralela.|

## Anexo A – Glosario

- **GTI**: Identificador Global de Tarea. Código único e inmutable (T-XX) que define una tarea en el proyecto.

- **WII**: Identificador de Elemento de Trabajo. Código jerárquico (R.WP-TXX-ST) que ubica una subtarea en el plan.

- **PRD**: Product Requirements Document.

- **CI/CD**: Continuous Integration / Continuous Delivery.

- **LOC**: Lines of Code.

- **DoD**: Definition of Done.

- **Wrapper**: Módulo que actúa como una capa de abstracción (façade) sobre una herramienta externa.


(El resto de los términos se pueden consultar en el glosario del PRD-QA.md)

## 9. Aprobación del Plan

La firma de este documento implica la aceptación del alcance, la metodología y la planificación aquí descritos, y autoriza el inicio de la ejecución de la Release 0.

|   |   |   |   |
|---|---|---|---|
|Rol|Nombre|Firma|Fecha|
|**Product Owner**||||
|**Arquitecto de Software**||||
|**Tech Lead**||||