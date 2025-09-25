---
task_id: "T-01"
title: "Baseline & CI/CD"
release: "unknown"
estado: "Completado 83% (Pydantic v2 diferido a R1 por ADR-004)"
complejidad: 0
prioridad: "Crítica"
wii_subtasks: []
  - id: "R0.WP1-T01-ST4"
    description: "Migrar los modelos de datos del backend a Pydantic v2 y realizar un benchmark para validar la mejora de rendimiento."
    complejidad: 2
    estado: "Pendiente"
    entregable: "Pull Request con la migración completada. Reporte de benchmark que muestra la mejora de rendimiento."
  - id: "R0.WP1-T01-ST3"
    description: "Implementar el job `qa-gate` con análisis de complejidad (radon), linter de títulos de PR, `CODEOWNERS` y plantilla de ADR."
    complejidad: 4
    estado: "Pendiente"
    entregable: "Un PR con un título no convencional o código que excede el umbral de complejidad es bloqueado por el pipeline. Fichero ADR-000 existe."
  - id: "R0.WP1-T01-ST2"
    description: "Crear pipeline de CI en GitHub Actions que instala dependencias, ejecuta linters (ruff, eslint) y tests unitarios en cada PR."
    complejidad: 3
    estado: "Pendiente"
    entregable: "PR a `main` dispara el pipeline y este pasa o falla según la calidad del código. Logs de CI disponibles."
  - id: "R0.WP1-T01-ST1"
    description: "Configurar estructura de monorepo, `docker-compose.yml` para servicios base (backend, frontend, db) y `Makefile` con comandos comunes (up, down, test)."
    complejidad: 3
    estado: "Pendiente"
    entregable: "`make up` levanta el entorno local. Repositorio inicializado con la estructura de directorios definida."
  - id: ":-------------------------------"
    description: ":------------------------------------------------------------------------------------------------------------------------------------------------------"
    complejidad: :-------------------
    estado: "Pendiente"
    entregable: ":-------------------------------------------------------------------------------------------------------------------------------------"
# WII subtasks will be populated below
dod_checklist: []
# DoD checklist will be populated below
acceptance_criteria: []
# Acceptance criteria will be populated below
sync_metadata:
  last_sync: "2025-09-24T12:31:28-05:00"
  source: "monolith"
  checksum: "01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b"
---

# Tarea T-01: Baseline & CI/CD

## Información General
**Estado:** Completado 83% (Pydantic v2 diferido a R1 por ADR-004)
**Release:** No especificado
**Complejidad:** 0 puntos de historia
**Prioridad:** Crítica

## Subtareas WII

- **:-------------------------------** (:------------------- pts): :------------------------------------------------------------------------------------------------------------------------------------------------------
  📦 *Entregable: :-------------------------------------------------------------------------------------------------------------------------------------*

- **R0.WP1-T01-ST1** (3 pts): Configurar estructura de monorepo, `docker-compose.yml` para servicios base (backend, frontend, db) y `Makefile` con comandos comunes (up, down, test).
  📦 *Entregable: `make up` levanta el entorno local. Repositorio inicializado con la estructura de directorios definida.*

- **R0.WP1-T01-ST2** (3 pts): Crear pipeline de CI en GitHub Actions que instala dependencias, ejecuta linters (ruff, eslint) y tests unitarios en cada PR.
  📦 *Entregable: PR a `main` dispara el pipeline y este pasa o falla según la calidad del código. Logs de CI disponibles.*

- **R0.WP1-T01-ST3** (4 pts): Implementar el job `qa-gate` con análisis de complejidad (radon), linter de títulos de PR, `CODEOWNERS` y plantilla de ADR.
  📦 *Entregable: Un PR con un título no convencional o código que excede el umbral de complejidad es bloqueado por el pipeline. Fichero ADR-000 existe.*

- **R0.WP1-T01-ST4** (2 pts): Migrar los modelos de datos del backend a Pydantic v2 y realizar un benchmark para validar la mejora de rendimiento.
  📦 *Entregable: Pull Request con la migración completada. Reporte de benchmark que muestra la mejora de rendimiento.*


## Criterios de Definición de Hecho (DoD)


## Criterios de Aceptación
**Criterios de Aceptación:**

## Contenido Original del Monolito
```

[... contenido truncado para legibilidad ...]
```

---
*Archivo generado automáticamente desde Sub Tareas v2.md*
*Última sincronización: Wed, Sep 24, 2025 12:31:29 PM*
