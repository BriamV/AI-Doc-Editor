---
task_id: "T-01"
titulo: "Baseline & CI/CD"
estado: "Completado 83% (Pydantic v2 diferido a R1 por ADR-004)"
dependencias: "Ninguna"
prioridad: "Crítica"
release_target: "Release 0"
complejidad: 12
descripcion: "Establecer la infraestructura de código, el entorno de desarrollo local y el pipeline de Integración Continua (CI) que servirá como base para todo el proyecto. Esta tarea es fundamental para garantizar la calidad, consistencia y automatización desde el primer día. **El alcance incluye la migración del backend a Pydantic v2 y el freeze de dependencias de producción para aprovechar sus mejoras de rendimiento.**"

# Technical Details
detalles_tecnicos: |


# Test Strategy
estrategia_test: |


# Documentation
documentacion: |


# Acceptance Criteria
criterios_aceptacion: |


# Definition of Done
definicion_hecho: |


# WII Subtasks
wii_subtasks:
  - id: "R0.WP1-T01-ST1"
    description: "Configurar estructura de monorepo, `docker-compose.yml` para servicios base (backend, frontend, db) y `Makefile` con comandos comunes (up, down, test)."
    complejidad: 3
    entregable: "`make up` levanta el entorno local. Repositorio inicializado con la estructura de directorios definida."
    status: "pendiente"
  - id: "R0.WP1-T01-ST2"
    description: "Crear pipeline de CI en GitHub Actions que instala dependencias, ejecuta linters (ruff, eslint) y tests unitarios en cada PR."
    complejidad: 3
    entregable: "PR a `main` dispara el pipeline y este pasa o falla según la calidad del código. Logs de CI disponibles."
    status: "pendiente"
  - id: "R0.WP1-T01-ST3"
    description: "Implementar el job `qa-gate` con análisis de complejidad (radon), linter de títulos de PR, `CODEOWNERS` y plantilla de ADR."
    complejidad: 4
    entregable: "Un PR con un título no convencional o código que excede el umbral de complejidad es bloqueado por el pipeline. Fichero ADR-000 existe."
    status: "pendiente"
  - id: "R0.WP1-T01-ST4"
    description: "Migrar los modelos de datos del backend a Pydantic v2 y realizar un benchmark para validar la mejora de rendimiento."
    complejidad: 2
    entregable: "Pull Request con la migración completada. Reporte de benchmark que muestra la mejora de rendimiento."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:31:13Z"
  checksum: "7569647f9652c9e16d658603f89f07e5c79ffb38ad398498b56400d05d0a3d9f"
  version: "1758753073"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-01: Baseline & CI/CD

## Estado Actual
**Estado:** Completado 83% (Pydantic v2 diferido a R1 por ADR-004)
**Prioridad:** Crítica
**Release Target:** Release 0
**Complejidad Total:** 12

## Descripción
Establecer la infraestructura de código, el entorno de desarrollo local y el pipeline de Integración Continua (CI) que servirá como base para todo el proyecto. Esta tarea es fundamental para garantizar la calidad, consistencia y automatización desde el primer día. **El alcance incluye la migración del backend a Pydantic v2 y el freeze de dependencias de producción para aprovechar sus mejoras de rendimiento.**

## Detalles Técnicos


## Estrategia de Test


## Documentación Requerida


## Criterios de Aceptación


## Definición de Hecho (DoD)


## Subtareas WII
### id: "R0.WP1-T01-ST1"
- description: "Configurar estructura de monorepo, `docker-compose.yml` para servicios base (backend, frontend, db) y `Makefile` con comandos comunes (up, down, test)."
- complejidad: 3
- entregable: "`make up` levanta el entorno local. Repositorio inicializado con la estructura de directorios definida."
- status: "pendiente"
### id: "R0.WP1-T01-ST2"
- description: "Crear pipeline de CI en GitHub Actions que instala dependencias, ejecuta linters (ruff, eslint) y tests unitarios en cada PR."
- complejidad: 3
- entregable: "PR a `main` dispara el pipeline y este pasa o falla según la calidad del código. Logs de CI disponibles."
- status: "pendiente"
### id: "R0.WP1-T01-ST3"
- description: "Implementar el job `qa-gate` con análisis de complejidad (radon), linter de títulos de PR, `CODEOWNERS` y plantilla de ADR."
- complejidad: 4
- entregable: "Un PR con un título no convencional o código que excede el umbral de complejidad es bloqueado por el pipeline. Fichero ADR-000 existe."
- status: "pendiente"
### id: "R0.WP1-T01-ST4"
- description: "Migrar los modelos de datos del backend a Pydantic v2 y realizar un benchmark para validar la mejora de rendimiento."
- complejidad: 2
- entregable: "Pull Request con la migración completada. Reporte de benchmark que muestra la mejora de rendimiento."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:31:14 UTC*
*Validador: task-data-parser.sh v1.0*
