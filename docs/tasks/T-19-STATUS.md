---
task_id: "T-19"
titulo: "Comment Tags & /comment CRUD"
estado: "Pendiente"
dependencias: "T-07"
prioridad: "Media"
release_target: "Release 3"
complejidad: 10
descripcion: "Implementar una funcionalidad de comentarios en el editor. Los usuarios podrán añadir comentarios tipo tag (ej. TODO, NOTE) en líneas específicas del texto, que serán visibles como decoraciones y estarán enlazados con el panel de outline."

# Technical Details
detalles_tecnicos: |
  **Backend:** API REST para el CRUD de comentarios (/comment).
  **Frontend:** Usar las decoraciones de Monaco Editor para mostrar los tags en el gutter o en el propio texto.
  **Estado:** Sincronizar los comentarios entre el editor y un posible panel de comentarios.

# Test Strategy
estrategia_test: |
  **Unit Tests (Jest):** Cobertura > 90% para la lógica de estado de los comentarios en el frontend.
  **Integration Tests:** Probar el CRUD de la API de comentarios.
  **E2E Tests (Cypress):** Probar el flujo completo de añadir un comentario desde la UI y verificar que persiste.

# Documentation
documentacion: |
  Actualizar OpenAPI para los endpoints de /comment.

# Acceptance Criteria
criterios_aceptacion: |
  Crear o eliminar un tag se refleja en la UI en < 150 ms.
  Los tests de Jest para la lógica de comentarios tienen una cobertura > 90%.

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  Todos los tests (unit, integration, E2E) pasan.
  Documentación de API completada.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R3.WP1-T19-ST1"
    description: "Implementar los endpoints REST para el CRUD de comentarios (/comment)."
    complejidad: 4
    entregable: "Colección Postman que prueba la creación, listado y eliminación de comentarios asociados a un documento."
    status: "pendiente"
  - id: "R3.WP1-T19-ST2"
    description: "Integrar las decoraciones de Monaco Editor para visualizar los tags (TODO, NOTE) en el texto."
    complejidad: 3
    entregable: "Al añadir un comentario con un tag, una decoración visual aparece en la línea correspondiente del editor."
    status: "pendiente"
  - id: "R3.WP1-T19-ST3"
    description: "Conectar la UI al backend y asegurar que los comentarios se pueden crear/eliminar desde el editor."
    complejidad: 3
    entregable: "Test Cypress que añade un comentario a través de la UI y verifica que persiste tras recargar la página."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:36:59Z"
  checksum: "8b9cd411a80b18894b527e2bf388396a5baa89707ebab2c46ace17b6e0c4196f"
  version: "1758753419"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-19: Comment Tags & /comment CRUD

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Media
**Release Target:** Release 3
**Complejidad Total:** 10

## Descripción
Implementar una funcionalidad de comentarios en el editor. Los usuarios podrán añadir comentarios tipo tag (ej. TODO, NOTE) en líneas específicas del texto, que serán visibles como decoraciones y estarán enlazados con el panel de outline.

## Detalles Técnicos
**Backend:** API REST para el CRUD de comentarios (/comment).
**Frontend:** Usar las decoraciones de Monaco Editor para mostrar los tags en el gutter o en el propio texto.
**Estado:** Sincronizar los comentarios entre el editor y un posible panel de comentarios.

## Estrategia de Test
**Unit Tests (Jest):** Cobertura > 90% para la lógica de estado de los comentarios en el frontend.
**Integration Tests:** Probar el CRUD de la API de comentarios.
**E2E Tests (Cypress):** Probar el flujo completo de añadir un comentario desde la UI y verificar que persiste.

## Documentación Requerida
Actualizar OpenAPI para los endpoints de /comment.

## Criterios de Aceptación
Crear o eliminar un tag se refleja en la UI en < 150 ms.
Los tests de Jest para la lógica de comentarios tienen una cobertura > 90%.

## Definición de Hecho (DoD)
Código revisado y aprobado.
Todos los tests (unit, integration, E2E) pasan.
Documentación de API completada.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R3.WP1-T19-ST1"
- description: "Implementar los endpoints REST para el CRUD de comentarios (/comment)."
- complejidad: 4
- entregable: "Colección Postman que prueba la creación, listado y eliminación de comentarios asociados a un documento."
- status: "pendiente"
### id: "R3.WP1-T19-ST2"
- description: "Integrar las decoraciones de Monaco Editor para visualizar los tags (TODO, NOTE) en el texto."
- complejidad: 3
- entregable: "Al añadir un comentario con un tag, una decoración visual aparece en la línea correspondiente del editor."
- status: "pendiente"
### id: "R3.WP1-T19-ST3"
- description: "Conectar la UI al backend y asegurar que los comentarios se pueden crear/eliminar desde el editor."
- complejidad: 3
- entregable: "Test Cypress que añade un comentario a través de la UI y verifica que persiste tras recargar la página."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:36:59 UTC*
*Validador: task-data-parser.sh v1.0*
