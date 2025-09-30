---
task_id: "T-26"
titulo: "Storage Quota"
estado: "Pendiente"
dependencias: "T-01"
prioridad: "Media"
release_target: "Release 5"
complejidad: 7
descripcion: "Implementar una cuota de almacenamiento global para prevenir el uso excesivo de disco. Si se supera la cuota, el sistema debe rechazar nuevas subidas de archivos."

# Technical Details
detalles_tecnicos: |
  **Backend:** Un servicio que monitoriza el uso total del almacenamiento (base de datos + vector-store + archivos).
  **Validación:** El endpoint de subida debe verificar el uso actual antes de aceptar un nuevo archivo.
  **UI:** Mostrar una alerta en el panel de settings cuando se acerca al límite.

# Test Strategy
estrategia_test: |
  **Integration Tests:** Probar que una subida que superaría la cuota es rechazada con un HTTP 507 (Insufficient Storage).
  **E2E Tests (Cypress):** Verificar que la alerta en la UI se muestra correctamente.

# Documentation
documentacion: |
  Documentar el código de error 507 en la API.

# Acceptance Criteria
criterios_aceptacion: |
  Una subida de archivo que haría que el almacenamiento total superara los 50 GB es rechazada con un HTTP 507.
  Una alerta es visible en el panel de Settings cuando el uso supera el 90% de la cuota.

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  Todos los tests (integration, E2E) pasan.
  Documentación de API completada.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R5.WP2-T26-ST1"
    description: "Implementar un servicio que monitorice el uso total de almacenamiento y lo exponga como una métrica de Prometheus."
    complejidad: 3
    entregable: "Endpoint de métricas que expone el uso actual del almacenamiento."
    status: "pendiente"
  - id: "R5.WP2-T26-ST2"
    description: "Añadir la validación en el endpoint de subida para rechazar peticiones si se supera la cuota de 50 GB."
    complejidad: 2
    entregable: "Test de integración que intenta subir un archivo superando la cuota y recibe un HTTP 507."
    status: "pendiente"
  - id: "R5.WP2-T26-ST3"
    description: "Añadir una alerta visual en el panel de settings de la UI cuando se acerca al límite."
    complejidad: 2
    entregable: "Test Cypress que verifica que la alerta es visible en el panel de Settings cuando el uso de almacenamiento supera el 90% de la cuota."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:37:22Z"
  checksum: "b8f0540c9ffe93b054dd5bbdacb083cbc068d88ef13ddad6010e7b6bf3bd30a7"
  version: "1758753442"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-26: Storage Quota

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Media
**Release Target:** Release 5
**Complejidad Total:** 7

## Descripción
Implementar una cuota de almacenamiento global para prevenir el uso excesivo de disco. Si se supera la cuota, el sistema debe rechazar nuevas subidas de archivos.

## Detalles Técnicos
**Backend:** Un servicio que monitoriza el uso total del almacenamiento (base de datos + vector-store + archivos).
**Validación:** El endpoint de subida debe verificar el uso actual antes de aceptar un nuevo archivo.
**UI:** Mostrar una alerta en el panel de settings cuando se acerca al límite.

## Estrategia de Test
**Integration Tests:** Probar que una subida que superaría la cuota es rechazada con un HTTP 507 (Insufficient Storage).
**E2E Tests (Cypress):** Verificar que la alerta en la UI se muestra correctamente.

## Documentación Requerida
Documentar el código de error 507 en la API.

## Criterios de Aceptación
Una subida de archivo que haría que el almacenamiento total superara los 50 GB es rechazada con un HTTP 507.
Una alerta es visible en el panel de Settings cuando el uso supera el 90% de la cuota.

## Definición de Hecho (DoD)
Código revisado y aprobado.
Todos los tests (integration, E2E) pasan.
Documentación de API completada.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R5.WP2-T26-ST1"
- description: "Implementar un servicio que monitorice el uso total de almacenamiento y lo exponga como una métrica de Prometheus."
- complejidad: 3
- entregable: "Endpoint de métricas que expone el uso actual del almacenamiento."
- status: "pendiente"
### id: "R5.WP2-T26-ST2"
- description: "Añadir la validación en el endpoint de subida para rechazar peticiones si se supera la cuota de 50 GB."
- complejidad: 2
- entregable: "Test de integración que intenta subir un archivo superando la cuota y recibe un HTTP 507."
- status: "pendiente"
### id: "R5.WP2-T26-ST3"
- description: "Añadir una alerta visual en el panel de settings de la UI cuando se acerca al límite."
- complejidad: 2
- entregable: "Test Cypress que verifica que la alerta es visible en el panel de Settings cuando el uso de almacenamiento supera el 90% de la cuota."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:37:22 UTC*
*Validador: task-data-parser.sh v1.0*
