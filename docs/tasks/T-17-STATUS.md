---
task_id: "T-17"
titulo: "API-SPEC & ADR Governance"
estado: "Completado"
dependencias: "T-01"
prioridad: "Alta"
release_target: "Release 0"
complejidad: 8
descripcion: "Establecer un proceso de gobernanza automatizado para la documentación de la arquitectura y la API. Esto asegura que la documentación se mantenga actualizada, sea consistente y trazable a lo largo del proyecto. **El alcance incluye la creación de una plantilla estándar para \"Actas de Certificación\" de tareas críticas.**"

# Technical Details
detalles_tecnicos: |
  **API Spec:** OpenAPI 3.1.
  **Linting:** spectral para validar la especificación OpenAPI.
  **Trazabilidad:** Script que parsea los requisitos y el plan de trabajo para generar una matriz de trazabilidad.
  **Automatización:** Job de CI en GitHub Actions.

# Test Strategy
estrategia_test: |
  **Integration Tests:** El propio job de CI actúa como test. Un PR con una OpenAPI inválida o una matriz de trazabilidad desactualizada debe hacer fallar el pipeline.

# Documentation
documentacion: |
  La tarea consiste en automatizar la generación y validación de la propia documentación.

# Acceptance Criteria
criterios_aceptacion: |
  El linter spectral se ejecuta en CI y no reporta errores en la especificación OpenAPI.
  La matriz de trazabilidad (docs/traceability.xlsx) se genera y versiona en cada commit a main.
  El índice de ADRs está actualizado.

# Definition of Done
definicion_hecho: |
  Código (scripts, config CI) revisado y aprobado.
  El job de CI de gobernanza pasa correctamente.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R0.WP1-T17-ST1"
    description: "Integrar spectral en el pipeline de CI para validar el fichero OpenAPI 3.1 en cada commit."
    complejidad: 2
    entregable: "El pipeline de CI falla si se introduce un cambio no válido en la especificación OpenAPI."
    status: "pendiente"
  - id: "R0.WP1-T17-ST2"
    description: "Crear el script que genera la matriz de trazabilidad (traceability.xlsx) y añadirlo como artefacto de CI."
    complejidad: 3
    entregable: "El pipeline de CI genera y adjunta el fichero traceability.xlsx en cada ejecución."
    status: "pendiente"
  - id: "R0.WP1-T17-ST3"
    description: "Escribir los ADRs iniciales para decisiones clave (ej. elección de Celery, estrategia de chunking)."
    complejidad: 1
    entregable: "Ficheros ADR correspondientes existen en el directorio /docs/adr."
    status: "pendiente"
  - id: "R0.WP1-T17-ST4"
    description: "Crear ADR para el Modelo de Gestión de API Keys de Usuario (relacionado a T-41), y la plantilla para "Actas de Certificación"."
    complejidad: 2
    entregable: "Fichero ADR-XXX-api-key-management-model.md y la plantilla de Acta de Certificación existen y están versionados."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:39:31Z"
  checksum: "c5f94b6bb001876c087b99ba49017b3efd6ff23101d8b3cf811002e25342383d"
  version: "1758753571"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-17: API-SPEC & ADR Governance

## Estado Actual
**Estado:** Completado
**Prioridad:** Alta
**Release Target:** Release 0
**Complejidad Total:** 8

## Descripción
Establecer un proceso de gobernanza automatizado para la documentación de la arquitectura y la API. Esto asegura que la documentación se mantenga actualizada, sea consistente y trazable a lo largo del proyecto. **El alcance incluye la creación de una plantilla estándar para "Actas de Certificación" de tareas críticas.**

## Detalles Técnicos
**API Spec:** OpenAPI 3.1.
**Linting:** spectral para validar la especificación OpenAPI.
**Trazabilidad:** Script que parsea los requisitos y el plan de trabajo para generar una matriz de trazabilidad.
**Automatización:** Job de CI en GitHub Actions.

## Estrategia de Test
**Integration Tests:** El propio job de CI actúa como test. Un PR con una OpenAPI inválida o una matriz de trazabilidad desactualizada debe hacer fallar el pipeline.

## Documentación Requerida
La tarea consiste en automatizar la generación y validación de la propia documentación.

## Criterios de Aceptación
El linter spectral se ejecuta en CI y no reporta errores en la especificación OpenAPI.
La matriz de trazabilidad (docs/traceability.xlsx) se genera y versiona en cada commit a main.
El índice de ADRs está actualizado.

## Definición de Hecho (DoD)
Código (scripts, config CI) revisado y aprobado.
El job de CI de gobernanza pasa correctamente.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R0.WP1-T17-ST1"
- description: "Integrar spectral en el pipeline de CI para validar el fichero OpenAPI 3.1 en cada commit."
- complejidad: 2
- entregable: "El pipeline de CI falla si se introduce un cambio no válido en la especificación OpenAPI."
- status: "pendiente"
### id: "R0.WP1-T17-ST2"
- description: "Crear el script que genera la matriz de trazabilidad (traceability.xlsx) y añadirlo como artefacto de CI."
- complejidad: 3
- entregable: "El pipeline de CI genera y adjunta el fichero traceability.xlsx en cada ejecución."
- status: "pendiente"
### id: "R0.WP1-T17-ST3"
- description: "Escribir los ADRs iniciales para decisiones clave (ej. elección de Celery, estrategia de chunking)."
- complejidad: 1
- entregable: "Ficheros ADR correspondientes existen en el directorio /docs/adr."
- status: "pendiente"
### id: "R0.WP1-T17-ST4"
- description: "Crear ADR para el Modelo de Gestión de API Keys de Usuario (relacionado a T-41), y la plantilla para "Actas de Certificación"."
- complejidad: 2
- entregable: "Fichero ADR-XXX-api-key-management-model.md y la plantilla de Acta de Certificación existen y están versionados."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:39:32 UTC*
*Validador: task-data-parser.sh v1.0*
