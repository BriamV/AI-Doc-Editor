---
task_id: "T-11"
titulo: "Coherence Checker"
estado: "Pendiente"
dependencias: "T-06"
prioridad: "Alta"
release_target: "Release 2"
complejidad: 15
descripcion: "Desarrollar un servicio que pueda analizar el texto completo de un documento y proporcionar una puntuación de coherencia. Esto ayuda a los editores a identificar inconsistencias lógicas o estilísticas introducidas durante la generación o edición."

# Technical Details
detalles_tecnicos: |
  **IA:** Modelo de lenguaje pre-entrenado (tipo BERT) para la clasificación de coherencia o "Next Sentence Prediction".
  **Backend:** Endpoint POST /revise_global.
  **Investigación:** Requiere una fase de I+D para seleccionar y ajustar el modelo más adecuado.

# Test Strategy
estrategia_test: |
  **Unit Tests:** Crear un dataset de prueba con pares de textos (coherentes e incoherentes) y verificar que el modelo los clasifica correctamente.

# Documentation
documentacion: |
  ADR documentando la investigación, la elección del modelo y los resultados de la validación.

# Acceptance Criteria
criterios_aceptacion: |
  El clasificador de coherencia alcanza una tasa de error ≤ 1% en el dataset de prueba curado.

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  Todos los tests unitarios con el dataset de prueba pasan.
  Documentación (ADR) completada.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R2.WP2-T11-ST1"
    description: "Investigar y seleccionar un modelo pre-entrenado (BERT-based) para la evaluación de cohesión textual."
    complejidad: 4
    entregable: "ADR documentando la elección del modelo, sus pros y contras, y cómo integrarlo."
    status: "pendiente"
  - id: "R2.WP2-T11-ST2"
    description: "Implementar el endpoint /revise_global que toma el contenido del documento y devuelve un score de cohesión."
    complejidad: 6
    entregable: "Colección Postman que envía un texto coherente (score alto) y uno incoherente (score bajo) y verifica los resultados."
    status: "pendiente"
  - id: "R2.WP2-T11-ST3"
    description: "Crear un dataset de prueba con ejemplos de textos coherentes e incoherentes para validar el checker."
    complejidad: 5
    entregable: "Test de integración que ejecuta el checker contra el dataset y verifica que la precisión es la esperada (≤ 1% de error)."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:36:26Z"
  checksum: "fdea25ddb628da29ecff75168f322728bc0b09a0bf25363bdf22679677610268"
  version: "1758753386"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-11: Coherence Checker

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Alta
**Release Target:** Release 2
**Complejidad Total:** 15

## Descripción
Desarrollar un servicio que pueda analizar el texto completo de un documento y proporcionar una puntuación de coherencia. Esto ayuda a los editores a identificar inconsistencias lógicas o estilísticas introducidas durante la generación o edición.

## Detalles Técnicos
**IA:** Modelo de lenguaje pre-entrenado (tipo BERT) para la clasificación de coherencia o "Next Sentence Prediction".
**Backend:** Endpoint POST /revise_global.
**Investigación:** Requiere una fase de I+D para seleccionar y ajustar el modelo más adecuado.

## Estrategia de Test
**Unit Tests:** Crear un dataset de prueba con pares de textos (coherentes e incoherentes) y verificar que el modelo los clasifica correctamente.

## Documentación Requerida
ADR documentando la investigación, la elección del modelo y los resultados de la validación.

## Criterios de Aceptación
El clasificador de coherencia alcanza una tasa de error ≤ 1% en el dataset de prueba curado.

## Definición de Hecho (DoD)
Código revisado y aprobado.
Todos los tests unitarios con el dataset de prueba pasan.
Documentación (ADR) completada.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R2.WP2-T11-ST1"
- description: "Investigar y seleccionar un modelo pre-entrenado (BERT-based) para la evaluación de cohesión textual."
- complejidad: 4
- entregable: "ADR documentando la elección del modelo, sus pros y contras, y cómo integrarlo."
- status: "pendiente"
### id: "R2.WP2-T11-ST2"
- description: "Implementar el endpoint /revise_global que toma el contenido del documento y devuelve un score de cohesión."
- complejidad: 6
- entregable: "Colección Postman que envía un texto coherente (score alto) y uno incoherente (score bajo) y verifica los resultados."
- status: "pendiente"
### id: "R2.WP2-T11-ST3"
- description: "Crear un dataset de prueba con ejemplos de textos coherentes e incoherentes para validar el checker."
- complejidad: 5
- entregable: "Test de integración que ejecuta el checker contra el dataset y verifica que la precisión es la esperada (≤ 1% de error)."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:36:27 UTC*
*Validador: task-data-parser.sh v1.0*
