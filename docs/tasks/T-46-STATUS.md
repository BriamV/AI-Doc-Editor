---
task_id: "T-46"
titulo: "DeepEval Benchmarks"
estado: "Pendiente"
dependencias: "T-11"
prioridad: "Alta"
release_target: "Release 2"
complejidad: 11
descripcion: "Implementar una suite de benchmarks automatizada utilizando un framework avanzado como DeepEval o RAGAS para evaluar de forma continua la calidad de las respuestas del sistema RAG. Se medirán métricas como la coherencia semántica, la factualidad y la relevancia de las respuestas."

# Technical Details
detalles_tecnicos: |
  **Framework:** DeepEval o RAGAS.
  **Métricas:** Answer Relevancy, Faithfulness, Contextual Precision.
  **Integración:** Job en el pipeline de CI que se ejecuta contra un dataset de evaluación.

# Test Strategy
estrategia_test: |
  Esta tarea es en sí misma una tarea de testing de calidad.

# Documentation
documentacion: |
  Documentar el dataset de evaluación y el proceso de ejecución de los benchmarks.

# Acceptance Criteria
criterios_aceptacion: |
  El pipeline de CI integra la suite de benchmarks de DeepEval/RAGAS.
  El pipeline falla si alguna de las métricas de calidad clave (ej. Faithfulness) cae por debajo de un umbral predefinido (ej. 0.85).
  Se genera un reporte HTML con los resultados de los benchmarks como artefacto de CI.

# Definition of Done
definicion_hecho: |
  Código (scripts de benchmark, dataset) revisado y aprobado.
  El job de CI está configurado y es capaz de detectar una regresión de calidad.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R2.WP3-T46-ST1"
    description: "Crear un dataset de evaluación curado con pares de pregunta-respuesta y contextos de referencia."
    complejidad: 4
    entregable: "Dataset de evaluación en formato JSON o similar, versionado en el repositorio."
    status: "pendiente"
  - id: "R2.WP3-T46-ST2"
    description: "Desarrollar el script de benchmark que utiliza DeepEval/RAGAS para evaluar el sistema contra el dataset."
    complejidad: 5
    entregable: "El script se ejecuta localmente y produce un reporte con las métricas de calidad."
    status: "pendiente"
  - id: "R2.WP3-T46-ST3"
    description: "Integrar la ejecución del script en el pipeline de CI y configurar los umbrales de fallo."
    complejidad: 2
    entregable: "El pipeline de CI genera el reporte como artefacto y falla si se viola un umbral."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:38:30Z"
  checksum: "0b5a9b9c76bb2ec948e45963bc63575f970493c50ae8f3f9351ebd319117e9ce"
  version: "1758753510"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-46: DeepEval Benchmarks

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Alta
**Release Target:** Release 2
**Complejidad Total:** 11

## Descripción
Implementar una suite de benchmarks automatizada utilizando un framework avanzado como DeepEval o RAGAS para evaluar de forma continua la calidad de las respuestas del sistema RAG. Se medirán métricas como la coherencia semántica, la factualidad y la relevancia de las respuestas.

## Detalles Técnicos
**Framework:** DeepEval o RAGAS.
**Métricas:** Answer Relevancy, Faithfulness, Contextual Precision.
**Integración:** Job en el pipeline de CI que se ejecuta contra un dataset de evaluación.

## Estrategia de Test
Esta tarea es en sí misma una tarea de testing de calidad.

## Documentación Requerida
Documentar el dataset de evaluación y el proceso de ejecución de los benchmarks.

## Criterios de Aceptación
El pipeline de CI integra la suite de benchmarks de DeepEval/RAGAS.
El pipeline falla si alguna de las métricas de calidad clave (ej. Faithfulness) cae por debajo de un umbral predefinido (ej. 0.85).
Se genera un reporte HTML con los resultados de los benchmarks como artefacto de CI.

## Definición de Hecho (DoD)
Código (scripts de benchmark, dataset) revisado y aprobado.
El job de CI está configurado y es capaz de detectar una regresión de calidad.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R2.WP3-T46-ST1"
- description: "Crear un dataset de evaluación curado con pares de pregunta-respuesta y contextos de referencia."
- complejidad: 4
- entregable: "Dataset de evaluación en formato JSON o similar, versionado en el repositorio."
- status: "pendiente"
### id: "R2.WP3-T46-ST2"
- description: "Desarrollar el script de benchmark que utiliza DeepEval/RAGAS para evaluar el sistema contra el dataset."
- complejidad: 5
- entregable: "El script se ejecuta localmente y produce un reporte con las métricas de calidad."
- status: "pendiente"
### id: "R2.WP3-T46-ST3"
- description: "Integrar la ejecución del script en el pipeline de CI y configurar los umbrales de fallo."
- complejidad: 2
- entregable: "El pipeline de CI genera el reporte como artefacto y falla si se viola un umbral."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:38:31 UTC*
*Validador: task-data-parser.sh v1.0*
