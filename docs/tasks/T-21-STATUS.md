---
task_id: "T-21"
titulo: "Navigation & Accessibility"
estado: "Pendiente"
dependencias: "T-07"
prioridad: "Alta"
release_target: "Release 3"
complejidad: 12
descripcion: "Mejorar la navegación global de la aplicación y asegurar que cumple con altos estándares de accesibilidad (A11y)."

# Technical Details
detalles_tecnicos: |
  **UI:** Sidebar con pestañas, paleta "Quick Open" (⌘+P), virtual scrolling para listas largas.
  **Accesibilidad:** Cumplimiento de WCAG 2.1 AA. Navegación completa por teclado, contraste de colores, atributos ARIA.
  **Herramientas:** Lighthouse y Pa11y para la auditoría de accesibilidad.

# Test Strategy
estrategia_test: |
  **E2E Tests (Cypress):** Probar la navegación, el drag-and-drop de proyectos y el Quick Open.
  **Accessibility Tests:** Integrar Pa11y en el pipeline de CI para detectar regresiones de accesibilidad.

# Documentation
documentacion: |
  Documentar las decisiones de accesibilidad en un ADR.

# Acceptance Criteria
criterios_aceptacion: |
  La puntuación de Accesibilidad en Lighthouse es ≥ 90.
  La paleta Quick Open (⌘+P) se abre en < 150 ms (p95).
  El scroll en una lista virtualizada de 10,000 líneas no presenta "jank" (FPS > 50).
  El reordenamiento de proyectos mediante drag-and-drop persiste el orden.

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  Todos los tests (E2E, accessibility) pasan.
  Reportes de Lighthouse y Pa11y analizados y los problemas críticos resueltos.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R3.WP1-T21-ST1"
    description: "Implementar el componente Sidebar con pestañas y la funcionalidad de reordenamiento de proyectos con drag-and-drop."
    complejidad: 5
    entregable: "Test Cypress que arrastra un proyecto a una nueva posición en la lista y verifica que el orden se persiste tras recargar la página."
    status: "pendiente"
  - id: "R3.WP1-T21-ST2"
    description: "Implementar la paleta "Quick Open" (⌘+P) y el virtual-scroll para listas largas."
    complejidad: 4
    entregable: "Test Cypress que presiona ⌘+P, busca un documento y navega a él. El scroll en una lista de 1000 items es fluido."
    status: "pendiente"
  - id: "R3.WP1-T21-ST3"
    description: "Realizar una auditoría de accesibilidad (A11y) con Lighthouse/Pa11y y corregir los problemas de mayor prioridad."
    complejidad: 3
    entregable: "Reporte de Lighthouse con una puntuación de Accesibilidad ≥ 90."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:37:05Z"
  checksum: "7834cf366013e7ab41b7d7f063716f23e35905b723e8bd950582531f85425679"
  version: "1758753425"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-21: Navigation & Accessibility

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Alta
**Release Target:** Release 3
**Complejidad Total:** 12

## Descripción
Mejorar la navegación global de la aplicación y asegurar que cumple con altos estándares de accesibilidad (A11y).

## Detalles Técnicos
**UI:** Sidebar con pestañas, paleta "Quick Open" (⌘+P), virtual scrolling para listas largas.
**Accesibilidad:** Cumplimiento de WCAG 2.1 AA. Navegación completa por teclado, contraste de colores, atributos ARIA.
**Herramientas:** Lighthouse y Pa11y para la auditoría de accesibilidad.

## Estrategia de Test
**E2E Tests (Cypress):** Probar la navegación, el drag-and-drop de proyectos y el Quick Open.
**Accessibility Tests:** Integrar Pa11y en el pipeline de CI para detectar regresiones de accesibilidad.

## Documentación Requerida
Documentar las decisiones de accesibilidad en un ADR.

## Criterios de Aceptación
La puntuación de Accesibilidad en Lighthouse es ≥ 90.
La paleta Quick Open (⌘+P) se abre en < 150 ms (p95).
El scroll en una lista virtualizada de 10,000 líneas no presenta "jank" (FPS > 50).
El reordenamiento de proyectos mediante drag-and-drop persiste el orden.

## Definición de Hecho (DoD)
Código revisado y aprobado.
Todos los tests (E2E, accessibility) pasan.
Reportes de Lighthouse y Pa11y analizados y los problemas críticos resueltos.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R3.WP1-T21-ST1"
- description: "Implementar el componente Sidebar con pestañas y la funcionalidad de reordenamiento de proyectos con drag-and-drop."
- complejidad: 5
- entregable: "Test Cypress que arrastra un proyecto a una nueva posición en la lista y verifica que el orden se persiste tras recargar la página."
- status: "pendiente"
### id: "R3.WP1-T21-ST2"
- description: "Implementar la paleta "Quick Open" (⌘+P) y el virtual-scroll para listas largas."
- complejidad: 4
- entregable: "Test Cypress que presiona ⌘+P, busca un documento y navega a él. El scroll en una lista de 1000 items es fluido."
- status: "pendiente"
### id: "R3.WP1-T21-ST3"
- description: "Realizar una auditoría de accesibilidad (A11y) con Lighthouse/Pa11y y corregir los problemas de mayor prioridad."
- complejidad: 3
- entregable: "Reporte de Lighthouse con una puntuación de Accesibilidad ≥ 90."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:37:05 UTC*
*Validador: task-data-parser.sh v1.0*
