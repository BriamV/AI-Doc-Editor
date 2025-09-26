---
task_id: "T-22"
titulo: "Delete & Restore (Logical)"
estado: "Pendiente"
dependencias: "T-37"
prioridad: "Alta"
release_target: "Release 4"
complejidad: 9
descripcion: "Implementar la funcionalidad de borrado lógico (mover a la papelera) y restauración de documentos. Los documentos borrados lógicamente deben ser recuperables durante un período de tiempo configurable."

# Technical Details
detalles_tecnicos: |
  **Backend:** Usar un campo deleted_at (soft delete) en el modelo del documento. Endpoints DELETE /docs/{id} y POST /docs/{id}/restore.
  **Frontend:** Mover los documentos borrados a una vista de "Papelera" desde donde se pueden restaurar.

# Test Strategy
estrategia_test: |
  **Integration Tests:** Probar los endpoints de borrado y restauración.
  **E2E Tests (Cypress):** Probar el flujo completo desde la UI: borrar un documento, ir a la papelera y restaurarlo.

# Documentation
documentacion: |
  Actualizar OpenAPI para los nuevos endpoints.

# Acceptance Criteria
criterios_aceptacion: |
  La llamada a DELETE /docs/{id} marca el documento como "deleted" en la base de datos.
  La llamada a /docs/{id}/restore recupera el documento si se realiza dentro del período de retención.
  Después del período de retención, el documento es un candidato para la purga por el job de T-36.

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  Todos los tests (integration, E2E) pasan.
  Documentación de API completada.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R4.WP1-T22-ST1"
    description: "Añadir el campo deleted_at al modelo de datos del documento y modificar las consultas para excluir los documentos borrados."
    complejidad: 3
    entregable: "Test que verifica que un documento con deleted_at no aparece en la lista principal de documentos."
    status: "pendiente"
  - id: "R4.WP1-T22-ST2"
    description: "Implementar los endpoints de backend /docs/{id} (DELETE) y /docs/{id}/restore."
    complejidad: 3
    entregable: "Colección Postman que borra lógicamente un documento y luego lo restaura, verificando el estado en la DB."
    status: "pendiente"
  - id: "R4.WP1-T22-ST3"
    description: "Implementar los botones correspondientes en la UI y la vista de "Papelera"."
    complejidad: 3
    entregable: "Test Cypress que mueve un documento a la papelera y luego lo restaura desde allí."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:37:08Z"
  checksum: "f0ff318c54a600d8dd3ee54d86a8adba2610c9f8eda7225a2965a1bab24911d5"
  version: "1758753427"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-22: Delete & Restore (Logical)

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Alta
**Release Target:** Release 4
**Complejidad Total:** 9

## Descripción
Implementar la funcionalidad de borrado lógico (mover a la papelera) y restauración de documentos. Los documentos borrados lógicamente deben ser recuperables durante un período de tiempo configurable.

## Detalles Técnicos
**Backend:** Usar un campo deleted_at (soft delete) en el modelo del documento. Endpoints DELETE /docs/{id} y POST /docs/{id}/restore.
**Frontend:** Mover los documentos borrados a una vista de "Papelera" desde donde se pueden restaurar.

## Estrategia de Test
**Integration Tests:** Probar los endpoints de borrado y restauración.
**E2E Tests (Cypress):** Probar el flujo completo desde la UI: borrar un documento, ir a la papelera y restaurarlo.

## Documentación Requerida
Actualizar OpenAPI para los nuevos endpoints.

## Criterios de Aceptación
La llamada a DELETE /docs/{id} marca el documento como "deleted" en la base de datos.
La llamada a /docs/{id}/restore recupera el documento si se realiza dentro del período de retención.
Después del período de retención, el documento es un candidato para la purga por el job de T-36.

## Definición de Hecho (DoD)
Código revisado y aprobado.
Todos los tests (integration, E2E) pasan.
Documentación de API completada.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R4.WP1-T22-ST1"
- description: "Añadir el campo deleted_at al modelo de datos del documento y modificar las consultas para excluir los documentos borrados."
- complejidad: 3
- entregable: "Test que verifica que un documento con deleted_at no aparece en la lista principal de documentos."
- status: "pendiente"
### id: "R4.WP1-T22-ST2"
- description: "Implementar los endpoints de backend /docs/{id} (DELETE) y /docs/{id}/restore."
- complejidad: 3
- entregable: "Colección Postman que borra lógicamente un documento y luego lo restaura, verificando el estado en la DB."
- status: "pendiente"
### id: "R4.WP1-T22-ST3"
- description: "Implementar los botones correspondientes en la UI y la vista de "Papelera"."
- complejidad: 3
- entregable: "Test Cypress que mueve un documento a la papelera y luego lo restaura desde allí."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:37:08 UTC*
*Validador: task-data-parser.sh v1.0*
