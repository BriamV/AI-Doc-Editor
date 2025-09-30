---
task_id: "T-45"
titulo: "Guardrails Integration"
estado: "Pendiente"
dependencias: "T-11"
prioridad: "Alta"
release_target: "Release 2"
complejidad: 9
descripcion: "Implementar un sistema de guardrails para asegurar que las salidas de los modelos de lenguaje (LLM) se adhieran a un formato estructurado predefinido (ej. JSON, XML). Esto es crucial para la fiabilidad de los servicios que consumen estas salidas, como el Planner Service (T-05)."

# Technical Details
detalles_tecnicos: |
  **Librería:** Guardrails AI o similar.
  **Validación:** Definición de esquemas de validación (Pydantic models o similar) para las respuestas del LLM.
  **Integración:** Envolver las llamadas al LLM en el cliente de IA para aplicar la validación.

# Test Strategy
estrategia_test: |
  **Unit Tests:** Probar el validador con salidas de LLM válidas e inválidas. Cobertura > 90%.
  **Integration Tests:** Integrar en el pipeline de CI un test que falle si una respuesta del LLM no cumple con el esquema.

# Documentation
documentacion: |
  ADR sobre la elección de la librería de guardrails.
  Documentar los esquemas de validación en el código.

# Acceptance Criteria
criterios_aceptacion: |
  El sistema rechaza o corrige automáticamente las salidas del LLM que no se ajustan al esquema definido.
  La cobertura de tests para la lógica de validación es ≥ 90%.
  El pipeline de CI falla si se detecta una regresión en la validación de formato.

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  Todos los tests (unit, integration) pasan.
  Documentación (ADR) completada.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R2.WP3-T45-ST1"
    description: "Investigar y seleccionar una librería de guardrails. Definir los esquemas de validación para las salidas clave (ej. outline del Planner)."
    complejidad: 3
    entregable: "ADR documentando la elección. Esquemas de validación definidos como modelos Pydantic."
    status: "pendiente"
  - id: "R2.WP3-T45-ST2"
    description: "Integrar la librería de guardrails en el cliente de IA para validar las respuestas del LLM en tiempo de ejecución."
    complejidad: 4
    entregable: "Test de integración que provoca una respuesta mal formada del LLM (mock) y verifica que el sistema la maneja correctamente (rechaza o reintenta)."
    status: "pendiente"
  - id: "R2.WP3-T45-ST3"
    description: "Crear tests unitarios para la lógica de validación y asegurar una cobertura > 90%."
    complejidad: 2
    entregable: "Reporte de cobertura de tests que muestra ≥ 90% para los módulos de validación."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:38:27Z"
  checksum: "269f37f37b766d4e42173515746e25bdeb52fc91183688ad34d78fb359d8c29e"
  version: "1758753507"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-45: Guardrails Integration

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Alta
**Release Target:** Release 2
**Complejidad Total:** 9

## Descripción
Implementar un sistema de guardrails para asegurar que las salidas de los modelos de lenguaje (LLM) se adhieran a un formato estructurado predefinido (ej. JSON, XML). Esto es crucial para la fiabilidad de los servicios que consumen estas salidas, como el Planner Service (T-05).

## Detalles Técnicos
**Librería:** Guardrails AI o similar.
**Validación:** Definición de esquemas de validación (Pydantic models o similar) para las respuestas del LLM.
**Integración:** Envolver las llamadas al LLM en el cliente de IA para aplicar la validación.

## Estrategia de Test
**Unit Tests:** Probar el validador con salidas de LLM válidas e inválidas. Cobertura > 90%.
**Integration Tests:** Integrar en el pipeline de CI un test que falle si una respuesta del LLM no cumple con el esquema.

## Documentación Requerida
ADR sobre la elección de la librería de guardrails.
Documentar los esquemas de validación en el código.

## Criterios de Aceptación
El sistema rechaza o corrige automáticamente las salidas del LLM que no se ajustan al esquema definido.
La cobertura de tests para la lógica de validación es ≥ 90%.
El pipeline de CI falla si se detecta una regresión en la validación de formato.

## Definición de Hecho (DoD)
Código revisado y aprobado.
Todos los tests (unit, integration) pasan.
Documentación (ADR) completada.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R2.WP3-T45-ST1"
- description: "Investigar y seleccionar una librería de guardrails. Definir los esquemas de validación para las salidas clave (ej. outline del Planner)."
- complejidad: 3
- entregable: "ADR documentando la elección. Esquemas de validación definidos como modelos Pydantic."
- status: "pendiente"
### id: "R2.WP3-T45-ST2"
- description: "Integrar la librería de guardrails en el cliente de IA para validar las respuestas del LLM en tiempo de ejecución."
- complejidad: 4
- entregable: "Test de integración que provoca una respuesta mal formada del LLM (mock) y verifica que el sistema la maneja correctamente (rechaza o reintenta)."
- status: "pendiente"
### id: "R2.WP3-T45-ST3"
- description: "Crear tests unitarios para la lógica de validación y asegurar una cobertura > 90%."
- complejidad: 2
- entregable: "Reporte de cobertura de tests que muestra ≥ 90% para los módulos de validación."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:38:28 UTC*
*Validador: task-data-parser.sh v1.0*
