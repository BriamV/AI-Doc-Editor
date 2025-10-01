---
task_id: "T-05"
titulo: "Planner Service (/plan)"
estado: "Pendiente"
dependencias: "T-01, T-41"
prioridad: "Crítica"
release_target: "Release 1"
complejidad: 14
descripcion: "Crear el servicio de backend que, a partir de un prompt inicial, genera un esquema estructurado (outline) del documento. Este servicio es el primer paso en el pipeline de generación de contenido y debe ser rápido y fiable."

# Technical Details
detalles_tecnicos: |
  **Arquitectura:** Hexagonal (Ports & Adapters) para aislar la lógica de negocio.
  **Protocolo:** HTTP POST a /plan.
  **Payload:** JSON con el prompt del usuario.
  **Respuesta:** JSON con el outline estructurado (H1, H2, H3).
  **IA:** LLM para la generación del outline.

# Test Strategy
estrategia_test: |
  **Unit Tests:** Probar la lógica de validación de la respuesta del LLM y el modo fallback.
  **Integration Tests:** Llamada al endpoint /plan y verificación de la estructura del JSON de respuesta.

# Documentation
documentacion: |
  Actualizar OpenAPI para el endpoint /plan.
  Diagrama de flujo del proceso de generación del plan.

# Acceptance Criteria
criterios_aceptacion: |
  La petición al endpoint /plan devuelve una respuesta en ≤ 1 segundo.
  La respuesta es un JSON válido que contiene una estructura de headings H1-H3.
  El servicio incluye una lógica de fallback a un modo 'single-shot' si el outline generado no cumple un umbral de calidad.
  Un test E2E demuestra la generación de un borrador inicial según el flujo documentado.

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  Todos los tests (unit, integration) pasan.
  Documentación (API, diagrama) completada.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R1.WP2-T05-ST1"
    description: "Diseñar la arquitectura del servicio (Hexagonal) y definir el contrato de la API para /plan en OpenAPI."
    complejidad: 3
    entregable: "Documento OpenAPI actualizado y un ADR que justifica la elección de la arquitectura."
    status: "pendiente"
  - id: "R1.WP2-T05-ST2"
    description: "Implementar la lógica de "Outline-Guided Thought Generation" que interactúa con el LLM para generar el esquema del documento."
    complejidad: 6
    entregable: "Test unitario que, dado un prompt, invoca al LLM y valida que la respuesta es un JSON con la estructura de outline esperada (H1-H3)."
    status: "pendiente"
  - id: "R1.WP2-T05-ST3"
    description: "Implementar la lógica de fallback a modo 'single-shot' y el test E2E que valida el flujo completo."
    complejidad: 5
    entregable: "Test E2E que simula una respuesta de outline de baja calidad y verifica que el sistema cambia al modo fallback."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:36:08Z"
  checksum: "77cd9a15b3d689c04b59d6b4d2124ac59006c85aca2bb3cc3d3c897254e5d801"
  version: "1758753368"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-05: Planner Service (/plan)

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Crítica
**Release Target:** Release 1
**Complejidad Total:** 14

## Descripción
Crear el servicio de backend que, a partir de un prompt inicial, genera un esquema estructurado (outline) del documento. Este servicio es el primer paso en el pipeline de generación de contenido y debe ser rápido y fiable.

## Detalles Técnicos
**Arquitectura:** Hexagonal (Ports & Adapters) para aislar la lógica de negocio.
**Protocolo:** HTTP POST a /plan.
**Payload:** JSON con el prompt del usuario.
**Respuesta:** JSON con el outline estructurado (H1, H2, H3).
**IA:** LLM para la generación del outline.

## Estrategia de Test
**Unit Tests:** Probar la lógica de validación de la respuesta del LLM y el modo fallback.
**Integration Tests:** Llamada al endpoint /plan y verificación de la estructura del JSON de respuesta.

## Documentación Requerida
Actualizar OpenAPI para el endpoint /plan.
Diagrama de flujo del proceso de generación del plan.

## Criterios de Aceptación
La petición al endpoint /plan devuelve una respuesta en ≤ 1 segundo.
La respuesta es un JSON válido que contiene una estructura de headings H1-H3.
El servicio incluye una lógica de fallback a un modo 'single-shot' si el outline generado no cumple un umbral de calidad.
Un test E2E demuestra la generación de un borrador inicial según el flujo documentado.

## Definición de Hecho (DoD)
Código revisado y aprobado.
Todos los tests (unit, integration) pasan.
Documentación (API, diagrama) completada.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R1.WP2-T05-ST1"
- description: "Diseñar la arquitectura del servicio (Hexagonal) y definir el contrato de la API para /plan en OpenAPI."
- complejidad: 3
- entregable: "Documento OpenAPI actualizado y un ADR que justifica la elección de la arquitectura."
- status: "pendiente"
### id: "R1.WP2-T05-ST2"
- description: "Implementar la lógica de "Outline-Guided Thought Generation" que interactúa con el LLM para generar el esquema del documento."
- complejidad: 6
- entregable: "Test unitario que, dado un prompt, invoca al LLM y valida que la respuesta es un JSON con la estructura de outline esperada (H1-H3)."
- status: "pendiente"
### id: "R1.WP2-T05-ST3"
- description: "Implementar la lógica de fallback a modo 'single-shot' y el test E2E que valida el flujo completo."
- complejidad: 5
- entregable: "Test E2E que simula una respuesta de outline de baja calidad y verifica que el sistema cambia al modo fallback."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:36:08 UTC*
*Validador: task-data-parser.sh v1.0*
