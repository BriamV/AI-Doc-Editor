---
task_id: "T-33"
titulo: "Draft-Quality Test"
estado: "Pendiente"
dependencias: "T-06"
prioridad: "Alta"
release_target: "Release 2"
complejidad: 13
descripcion: "Crear un test harness automatizado para evaluar la calidad semántica y la cobertura del borrador inicial generado por el sistema, comparándolo contra un dataset de referencia."

# Technical Details
detalles_tecnicos: |
  **Métrica:** ROUGE-L para medir la similitud semántica.
  **Dataset:** Un conjunto de 10 documentos de referencia con sus borradores "golden" esperados.
  **Automatización:** Integrar el test en el pipeline de CI para detectar regresiones de calidad.

# Test Strategy
estrategia_test: |
  Esta tarea es en sí misma una tarea de testing de calidad.

# Documentation
documentacion: |
  Documentar el dataset y el proceso de evaluación.

# Acceptance Criteria
criterios_aceptacion: |
  El score ROUGE-L es ≥ 0.8 en el borrador inicial (p95) en comparación con el dataset de referencia.
  La latencia para generar un borrador completo es ≤ 8 minutos (p95).
  El job de CI falla si el score ROUGE-L es < 0.8 o la latencia es > 8 minutos.

# Definition of Done
definicion_hecho: |
  Código (test harness, dataset) revisado y aprobado.
  El job de CI está configurado y pasa con la implementación actual.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R2.WP2-T33-ST1"
    description: "Crear un dataset de referencia con 10 documentos fuente y sus borradores "golden" esperados."
    complejidad: 4
    entregable: "El dataset existe en el repositorio en un formato estructurado (ej. JSON)."
    status: "pendiente"
  - id: "R2.WP2-T33-ST2"
    description: "Desarrollar el test harness que genera borradores para el dataset y calcula el score ROUGE-L contra los "golden"."
    complejidad: 6
    entregable: "El script se ejecuta y produce un reporte con los scores ROUGE-L para cada documento."
    status: "pendiente"
  - id: "R2.WP2-T33-ST3"
    description: "Integrar el test en el pipeline de CI para que falle si el score o la latencia no cumplen los umbrales."
    complejidad: 3
    entregable: "El job de CI falla si el ROUGE-L p95 es < 0.8 o la latencia p95 es > 8 min."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:37:50Z"
  checksum: "30235d5cae5e4884e2b012d712750794057f8db7cef9c14bf08af17042067629"
  version: "1758753470"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-33: Draft-Quality Test

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Alta
**Release Target:** Release 2
**Complejidad Total:** 13

## Descripción
Crear un test harness automatizado para evaluar la calidad semántica y la cobertura del borrador inicial generado por el sistema, comparándolo contra un dataset de referencia.

## Detalles Técnicos
**Métrica:** ROUGE-L para medir la similitud semántica.
**Dataset:** Un conjunto de 10 documentos de referencia con sus borradores "golden" esperados.
**Automatización:** Integrar el test en el pipeline de CI para detectar regresiones de calidad.

## Estrategia de Test
Esta tarea es en sí misma una tarea de testing de calidad.

## Documentación Requerida
Documentar el dataset y el proceso de evaluación.

## Criterios de Aceptación
El score ROUGE-L es ≥ 0.8 en el borrador inicial (p95) en comparación con el dataset de referencia.
La latencia para generar un borrador completo es ≤ 8 minutos (p95).
El job de CI falla si el score ROUGE-L es < 0.8 o la latencia es > 8 minutos.

## Definición de Hecho (DoD)
Código (test harness, dataset) revisado y aprobado.
El job de CI está configurado y pasa con la implementación actual.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R2.WP2-T33-ST1"
- description: "Crear un dataset de referencia con 10 documentos fuente y sus borradores "golden" esperados."
- complejidad: 4
- entregable: "El dataset existe en el repositorio en un formato estructurado (ej. JSON)."
- status: "pendiente"
### id: "R2.WP2-T33-ST2"
- description: "Desarrollar el test harness que genera borradores para el dataset y calcula el score ROUGE-L contra los "golden"."
- complejidad: 6
- entregable: "El script se ejecuta y produce un reporte con los scores ROUGE-L para cada documento."
- status: "pendiente"
### id: "R2.WP2-T33-ST3"
- description: "Integrar el test en el pipeline de CI para que falle si el score o la latencia no cumplen los umbrales."
- complejidad: 3
- entregable: "El job de CI falla si el ROUGE-L p95 es < 0.8 o la latencia p95 es > 8 min."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:37:50 UTC*
*Validador: task-data-parser.sh v1.0*
