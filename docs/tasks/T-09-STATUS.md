---
task_id: "T-09"
titulo: "Versioning & Diff"
estado: "Pendiente"
dependencias: "T-07, T-13"
prioridad: "Alta"
release_target: "Release 4"
complejidad: 12
descripcion: "Implementar un sistema de versionado automático para cada documento. El sistema guardará un snapshot cada vez que el usuario guarde, permitiendo ver las diferencias entre versiones y revertir a una versión anterior."

# Technical Details
detalles_tecnicos: |
  **Backend:** Almacenar snapshots del documento en una tabla separada, vinculada al documento principal. Usar SHA-256 para identificar cambios.
  **Frontend:** Usar el componente DiffEditor de Monaco para visualizar las diferencias.
  **Límite:** Implementar un límite de 500 versiones por documento para controlar el almacenamiento.

# Test Strategy
estrategia_test: |
  **Unit Tests:** Para la lógica de creación de snapshots y el cálculo de hashes.
  **E2E Tests (Cypress):** Probar el flujo completo: guardar varias veces, abrir el visor de versiones, seleccionar una versión, ver el diff y revertir a ella.

# Documentation
documentacion: |
  Documentar cómo funciona el sistema de versionado.

# Acceptance Criteria
criterios_aceptacion: |
  La acción de revertir a una versión vN restaura el contenido correctamente sin perder el historial de versiones posterior.
  Cada guardado de un documento se registra como un evento en el log de auditoría de T-13.

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  Todos los tests (unit, E2E) pasan.
  Documentación completada.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R4.WP1-T09-ST1"
    description: "Modificar el modelo de datos para almacenar snapshots de documentos (contenido + SHA-256) y registrar el evento en el log de auditoría (T-13)."
    complejidad: 4
    entregable: "Test que guarda un documento y verifica que se crea un nuevo registro de versión en la DB y una entrada en el log de auditoría."
    status: "pendiente"
  - id: "R4.WP1-T09-ST2"
    description: "Implementar el componente de UI DiffEditor (de Monaco) que muestra las diferencias entre la versión actual y una seleccionada."
    complejidad: 5
    entregable: "Componente React que, dados dos textos, renderiza una vista de diferencias."
    status: "pendiente"
  - id: "R4.WP1-T09-ST3"
    description: "Implementar la funcionalidad de "Rollback" en la UI y el endpoint de backend correspondiente que restaura una versión anterior."
    complejidad: 3
    entregable: "Test Cypress que selecciona una versión antigua, hace clic en "Rollback" y verifica que el contenido del editor se actualiza."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:36:20Z"
  checksum: "9635fbc41944d5502e7f7f8c4a099dcc472c1d74048e71b9dd98b231f829754a"
  version: "1758753380"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-09: Versioning & Diff

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Alta
**Release Target:** Release 4
**Complejidad Total:** 12

## Descripción
Implementar un sistema de versionado automático para cada documento. El sistema guardará un snapshot cada vez que el usuario guarde, permitiendo ver las diferencias entre versiones y revertir a una versión anterior.

## Detalles Técnicos
**Backend:** Almacenar snapshots del documento en una tabla separada, vinculada al documento principal. Usar SHA-256 para identificar cambios.
**Frontend:** Usar el componente DiffEditor de Monaco para visualizar las diferencias.
**Límite:** Implementar un límite de 500 versiones por documento para controlar el almacenamiento.

## Estrategia de Test
**Unit Tests:** Para la lógica de creación de snapshots y el cálculo de hashes.
**E2E Tests (Cypress):** Probar el flujo completo: guardar varias veces, abrir el visor de versiones, seleccionar una versión, ver el diff y revertir a ella.

## Documentación Requerida
Documentar cómo funciona el sistema de versionado.

## Criterios de Aceptación
La acción de revertir a una versión vN restaura el contenido correctamente sin perder el historial de versiones posterior.
Cada guardado de un documento se registra como un evento en el log de auditoría de T-13.

## Definición de Hecho (DoD)
Código revisado y aprobado.
Todos los tests (unit, E2E) pasan.
Documentación completada.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R4.WP1-T09-ST1"
- description: "Modificar el modelo de datos para almacenar snapshots de documentos (contenido + SHA-256) y registrar el evento en el log de auditoría (T-13)."
- complejidad: 4
- entregable: "Test que guarda un documento y verifica que se crea un nuevo registro de versión en la DB y una entrada en el log de auditoría."
- status: "pendiente"
### id: "R4.WP1-T09-ST2"
- description: "Implementar el componente de UI DiffEditor (de Monaco) que muestra las diferencias entre la versión actual y una seleccionada."
- complejidad: 5
- entregable: "Componente React que, dados dos textos, renderiza una vista de diferencias."
- status: "pendiente"
### id: "R4.WP1-T09-ST3"
- description: "Implementar la funcionalidad de "Rollback" en la UI y el endpoint de backend correspondiente que restaura una versión anterior."
- complejidad: 3
- entregable: "Test Cypress que selecciona una versión antigua, hace clic en "Rollback" y verifica que el contenido del editor se actualiza."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:36:20 UTC*
*Validador: task-data-parser.sh v1.0*
