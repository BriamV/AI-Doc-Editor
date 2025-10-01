---
task_id: "T-07"
titulo: "Editor UI Core + Split View"
estado: "Pendiente"
dependencias: "T-06"
prioridad: "Alta"
release_target: "Release 2"
complejidad: 14
descripcion: "Construir la interfaz de usuario principal para la edición de documentos. Esta interfaz debe ser una vista dividida (split-view) que muestre el outline del documento, el contenido principal y una barra de prompts interactiva. Esta tarea consolida y asume la propiedad de la métrica de rendimiento PERF-002 (< 200 ms render), medida a través de Lighthouse."

# Technical Details
detalles_tecnicos: |
  **Framework:** React 18.
  **Editor:** Monaco Editor.
  **Estado:** Zustand o Redux Toolkit para la gestión del estado del documento.
  **Componentes:** SplitView, OutlinePane, EditorPane, PromptBar.

# Test Strategy
estrategia_test: |
  **Unit Tests:** Para los componentes de UI y la lógica de estado.
  **E2E Tests (Cypress):** Probar la interacción del usuario, como el drag-and-drop de secciones en el outline.
  **Performance Tests:** Medir el tiempo de renderizado inicial con Lighthouse (PERF-002).

# Documentation
documentacion: |
  Storybook para los componentes de la UI del editor.

# Acceptance Criteria
criterios_aceptacion: |
  El tiempo de renderizado inicial de la vista del editor es < 200 ms (p95) según Lighthouse.
  El reordenamiento de secciones mediante drag-and-drop en el Outline Pane persiste en el estado de la aplicación.
  La ETA en la Prompt Bar muestra un progreso con una precisión de ±5%.
  El editor Monaco está configurado según las directrices de DESIGN_GUIDELINES.md.

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  Todos los tests (unit, E2E, performance) pasan.
  Documentación en Storybook completada.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R2.WP1-T07-ST1"
    description: "Implementar el layout de Split View con React, integrando el editor Monaco y un panel de outline."
    complejidad: 5
    entregable: "Componente React renderiza la vista dividida. El editor Monaco está configurado según DESIGN_GUIDELINES.md."
    status: "pendiente"
  - id: "R2.WP1-T07-ST2"
    description: "Desarrollar el componente "Prompt Bar" con cálculo y visualización de ETA dinámica, conectándose al stream de T-06."
    complejidad: 4
    entregable: "La barra de progreso se actualiza durante la generación de contenido y la ETA es visible."
    status: "pendiente"
  - id: "R2.WP1-T07-ST3"
    description: "Implementar el "Outline Pane" con funcionalidad de drag-and-drop para reordenar secciones."
    complejidad: 5
    entregable: "Test Cypress que arrastra un heading en el panel de outline y verifica que el orden se actualiza en el estado de la aplicación."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:36:14Z"
  checksum: "65bed088b3d4c53a095c3b41b13de385cc6694e9144ab2bb04a6d28a34d3c5ba"
  version: "1758753374"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-07: Editor UI Core + Split View

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Alta
**Release Target:** Release 2
**Complejidad Total:** 14

## Descripción
Construir la interfaz de usuario principal para la edición de documentos. Esta interfaz debe ser una vista dividida (split-view) que muestre el outline del documento, el contenido principal y una barra de prompts interactiva. Esta tarea consolida y asume la propiedad de la métrica de rendimiento PERF-002 (< 200 ms render), medida a través de Lighthouse.

## Detalles Técnicos
**Framework:** React 18.
**Editor:** Monaco Editor.
**Estado:** Zustand o Redux Toolkit para la gestión del estado del documento.
**Componentes:** SplitView, OutlinePane, EditorPane, PromptBar.

## Estrategia de Test
**Unit Tests:** Para los componentes de UI y la lógica de estado.
**E2E Tests (Cypress):** Probar la interacción del usuario, como el drag-and-drop de secciones en el outline.
**Performance Tests:** Medir el tiempo de renderizado inicial con Lighthouse (PERF-002).

## Documentación Requerida
Storybook para los componentes de la UI del editor.

## Criterios de Aceptación
El tiempo de renderizado inicial de la vista del editor es < 200 ms (p95) según Lighthouse.
El reordenamiento de secciones mediante drag-and-drop en el Outline Pane persiste en el estado de la aplicación.
La ETA en la Prompt Bar muestra un progreso con una precisión de ±5%.
El editor Monaco está configurado según las directrices de DESIGN_GUIDELINES.md.

## Definición de Hecho (DoD)
Código revisado y aprobado.
Todos los tests (unit, E2E, performance) pasan.
Documentación en Storybook completada.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R2.WP1-T07-ST1"
- description: "Implementar el layout de Split View con React, integrando el editor Monaco y un panel de outline."
- complejidad: 5
- entregable: "Componente React renderiza la vista dividida. El editor Monaco está configurado según DESIGN_GUIDELINES.md."
- status: "pendiente"
### id: "R2.WP1-T07-ST2"
- description: "Desarrollar el componente "Prompt Bar" con cálculo y visualización de ETA dinámica, conectándose al stream de T-06."
- complejidad: 4
- entregable: "La barra de progreso se actualiza durante la generación de contenido y la ETA es visible."
- status: "pendiente"
### id: "R2.WP1-T07-ST3"
- description: "Implementar el "Outline Pane" con funcionalidad de drag-and-drop para reordenar secciones."
- complejidad: 5
- entregable: "Test Cypress que arrastra un heading en el panel de outline y verifica que el orden se actualiza en el estado de la aplicación."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:36:14 UTC*
*Validador: task-data-parser.sh v1.0*
