---
task_id: "T-35"
titulo: "GDPR Erasure on Demand"
estado: "Pendiente"
dependencias: "T-13, T-22"
prioridad: "Crítica"
release_target: "Release 5"
complejidad: 10
descripcion: "Implementar la funcionalidad que permite a un usuario solicitar el borrado definitivo de un documento, en cumplimiento con el \"derecho al olvido\" del GDPR."

# Technical Details
detalles_tecnicos: |
  **Backend:** Endpoint DELETE /docs/{id}/erase que marca un documento para purga inmediata.
  **Frontend:** Botón "Borrar definitivamente" en la UI (ej. en la papelera) con un modal de confirmación muy claro sobre la irreversibilidad de la acción.
  **Auditoría:** La solicitud de borrado debe registrarse en el log WORM de T-13.

# Test Strategy
estrategia_test: |
  **Integration Tests:** Probar el endpoint /erase.
  **E2E Tests:** Probar el ciclo completo: borrar lógicamente (T-22), ir a la papelera, borrar definitivamente y verificar que el documento ya no es accesible.

# Documentation
documentacion: |
  Actualizar OpenAPI para el nuevo endpoint.

# Acceptance Criteria
criterios_aceptacion: |
  Una llamada a DELETE /docs/{id}/erase devuelve un HTTP 204 tras la confirmación del usuario.
  Se crea una entrada en el Audit Log WORM con el usuario, doc-ID y timestamp en ≤ 5 segundos.
  El documento se marca para ser purgado por el job de T-36.

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  Todos los tests (integration, E2E) pasan.
  El flujo ha sido validado desde una perspectiva de compliance.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R5.WP2-T35-ST1"
    description: "Implementar el endpoint DELETE /docs/{id}/erase que marca un documento para purga."
    complejidad: 4
    entregable: "Colección Postman que prueba el endpoint y verifica que el documento se marca correctamente en la DB."
    status: "pendiente"
  - id: "R5.WP2-T35-ST2"
    description: "Añadir el botón "Borrar definitivamente" en la UI y el flujo de confirmación."
    complejidad: 3
    entregable: "Test Cypress que borra un documento permanentemente y verifica que desaparece de la UI."
    status: "pendiente"
  - id: "R5.WP2-T35-ST3"
    description: "Asegurar que la acción de borrado se registra correctamente en el log WORM de auditoría."
    complejidad: 3
    entregable: "Test que borra un documento y verifica que se crea la entrada correspondiente en el log de auditoría."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:39:34Z"
  checksum: "e0a07f8f72db0e59a75902b9e269def6737e1b21ec7c6edef9a7cb479979ca01"
  version: "1758753574"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-35: GDPR Erasure on Demand

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Crítica
**Release Target:** Release 5
**Complejidad Total:** 10

## Descripción
Implementar la funcionalidad que permite a un usuario solicitar el borrado definitivo de un documento, en cumplimiento con el "derecho al olvido" del GDPR.

## Detalles Técnicos
**Backend:** Endpoint DELETE /docs/{id}/erase que marca un documento para purga inmediata.
**Frontend:** Botón "Borrar definitivamente" en la UI (ej. en la papelera) con un modal de confirmación muy claro sobre la irreversibilidad de la acción.
**Auditoría:** La solicitud de borrado debe registrarse en el log WORM de T-13.

## Estrategia de Test
**Integration Tests:** Probar el endpoint /erase.
**E2E Tests:** Probar el ciclo completo: borrar lógicamente (T-22), ir a la papelera, borrar definitivamente y verificar que el documento ya no es accesible.

## Documentación Requerida
Actualizar OpenAPI para el nuevo endpoint.

## Criterios de Aceptación
Una llamada a DELETE /docs/{id}/erase devuelve un HTTP 204 tras la confirmación del usuario.
Se crea una entrada en el Audit Log WORM con el usuario, doc-ID y timestamp en ≤ 5 segundos.
El documento se marca para ser purgado por el job de T-36.

## Definición de Hecho (DoD)
Código revisado y aprobado.
Todos los tests (integration, E2E) pasan.
El flujo ha sido validado desde una perspectiva de compliance.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R5.WP2-T35-ST1"
- description: "Implementar el endpoint DELETE /docs/{id}/erase que marca un documento para purga."
- complejidad: 4
- entregable: "Colección Postman que prueba el endpoint y verifica que el documento se marca correctamente en la DB."
- status: "pendiente"
### id: "R5.WP2-T35-ST2"
- description: "Añadir el botón "Borrar definitivamente" en la UI y el flujo de confirmación."
- complejidad: 3
- entregable: "Test Cypress que borra un documento permanentemente y verifica que desaparece de la UI."
- status: "pendiente"
### id: "R5.WP2-T35-ST3"
- description: "Asegurar que la acción de borrado se registra correctamente en el log WORM de auditoría."
- complejidad: 3
- entregable: "Test que borra un documento y verifica que se crea la entrada correspondiente en el log de auditoría."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:39:35 UTC*
*Validador: task-data-parser.sh v1.0*
