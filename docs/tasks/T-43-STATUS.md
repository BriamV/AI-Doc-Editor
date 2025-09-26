---
task_id: "T-43"
titulo: "Implementar Escaneo de Dependencias"
estado: "Completado"
dependencias: "T-01"
prioridad: "Crítica"
release_target: "Release 0"
complejidad: 9
descripcion: "Integrar herramientas de Análisis de Composición de Software (SCA) en el pipeline de CI para detectar y prevenir automáticamente vulnerabilidades conocidas (CVEs) y conflictos de licencia en las dependencias de código abierto del proyecto."

# Technical Details
detalles_tecnicos: |
  **Herramientas:** pip-audit, yarn audit, Dependabot, Snyk (o similar).
  **Integración:** Job en el pipeline qa-gate de GitHub Actions.
  **Política:** Definir umbrales de severidad (ej. CRITICAL, HIGH) que bloqueen el build.

# Test Strategy
estrategia_test: |
  **Integration Tests:** Introducir una dependencia con una vulnerabilidad conocida en una rama de prueba y verificar que el pipeline falla.

# Documentation
documentacion: |
  Documentar la política de gestión de vulnerabilidades en CONTRIBUTING.md.

# Acceptance Criteria
criterios_aceptacion: |
  El pipeline de CI integra escaneos de vulnerabilidades y licencias.
  El job qa-gate falla si se detecta una vulnerabilidad de severidad CRITICAL o HIGH.
  Un reporte de licencias es generado como artefacto de CI.

# Definition of Done
definicion_hecho: |
  Código (configuración de CI) revisado y aprobado.
  El pipeline es capaz de detectar y bloquear una vulnerabilidad de prueba.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R0.WP1-T43-ST1"
    description: "Integrar herramientas de escaneo de vulnerabilidades (ej. pip-audit, yarn audit) en el pipeline de CI."
    complejidad: 4
    entregable: "El pipeline de CI ejecuta los escaneos y reporta las vulnerabilidades encontradas."
    status: "pendiente"
  - id: "R0.WP1-T43-ST2"
    description: "Establecer y aplicar una política de gestión de vulnerabilidades que falle el build para severidades CRITICAL o HIGH."
    complejidad: 3
    entregable: "Un PR con una dependencia vulnerable es bloqueado por el pipeline."
    status: "pendiente"
  - id: "R0.WP1-T43-ST3"
    description: "Implementar un escaneo de licencias de dependencias para generar un reporte de compatibilidad."
    complejidad: 2
    entregable: "El pipeline de CI genera un artefacto con el reporte de licencias."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:38:21Z"
  checksum: "0e37e42a5e0c934714a81cb5c148ea57eb754fe76956d510f8de1aaa6e9b65d7"
  version: "1758753501"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-43: Implementar Escaneo de Dependencias

## Estado Actual
**Estado:** Completado
**Prioridad:** Crítica
**Release Target:** Release 0
**Complejidad Total:** 9

## Descripción
Integrar herramientas de Análisis de Composición de Software (SCA) en el pipeline de CI para detectar y prevenir automáticamente vulnerabilidades conocidas (CVEs) y conflictos de licencia en las dependencias de código abierto del proyecto.

## Detalles Técnicos
**Herramientas:** pip-audit, yarn audit, Dependabot, Snyk (o similar).
**Integración:** Job en el pipeline qa-gate de GitHub Actions.
**Política:** Definir umbrales de severidad (ej. CRITICAL, HIGH) que bloqueen el build.

## Estrategia de Test
**Integration Tests:** Introducir una dependencia con una vulnerabilidad conocida en una rama de prueba y verificar que el pipeline falla.

## Documentación Requerida
Documentar la política de gestión de vulnerabilidades en CONTRIBUTING.md.

## Criterios de Aceptación
El pipeline de CI integra escaneos de vulnerabilidades y licencias.
El job qa-gate falla si se detecta una vulnerabilidad de severidad CRITICAL o HIGH.
Un reporte de licencias es generado como artefacto de CI.

## Definición de Hecho (DoD)
Código (configuración de CI) revisado y aprobado.
El pipeline es capaz de detectar y bloquear una vulnerabilidad de prueba.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R0.WP1-T43-ST1"
- description: "Integrar herramientas de escaneo de vulnerabilidades (ej. pip-audit, yarn audit) en el pipeline de CI."
- complejidad: 4
- entregable: "El pipeline de CI ejecuta los escaneos y reporta las vulnerabilidades encontradas."
- status: "pendiente"
### id: "R0.WP1-T43-ST2"
- description: "Establecer y aplicar una política de gestión de vulnerabilidades que falle el build para severidades CRITICAL o HIGH."
- complejidad: 3
- entregable: "Un PR con una dependencia vulnerable es bloqueado por el pipeline."
- status: "pendiente"
### id: "R0.WP1-T43-ST3"
- description: "Implementar un escaneo de licencias de dependencias para generar un reporte de compatibilidad."
- complejidad: 2
- entregable: "El pipeline de CI genera un artefacto con el reporte de licencias."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:38:21 UTC*
*Validador: task-data-parser.sh v1.0*
