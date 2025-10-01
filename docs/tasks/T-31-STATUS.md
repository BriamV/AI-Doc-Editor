---
task_id: "T-31"
titulo: "Pause/Abort Flow"
estado: "Pendiente"
dependencias: "T-07"
prioridad: "Media"
release_target: "Release 2"
complejidad: 10
descripcion: "Dar al usuario el control sobre el proceso de generación de contenido, permitiéndole pausar, reanudar o cancelar por completo una generación en curso."

# Technical Details
detalles_tecnicos: |
  **Backend:** Endpoints POST /pause y POST /resume. La lógica debe manejar el estado de la tarea de generación (ej. en Celery).
  **Frontend:** Botón "Pause" en la Prompt Bar que, al ser presionado, muestra un modal con las opciones "Continuar" y "Cancelar".

# Test Strategy
estrategia_test: |
  **Integration Tests:** Probar los endpoints de la API para pausar y reanudar.
  **E2E Tests (Cypress):** Probar el flujo completo desde la UI: iniciar generación, pausar, ver el modal, y probar las opciones de continuar y cancelar.

# Documentation
documentacion: |
  Actualizar OpenAPI para los nuevos endpoints.

# Acceptance Criteria
criterios_aceptacion: |
  Una petición a POST /pause tiene una latencia p95 ≤ 150 ms.
  El modal de confirmación aparece en la UI en ≤ 200 ms tras hacer clic en "Pause".
  La opción "Continuar" reanuda el flujo de generación, y "Cancelar" lo detiene permanentemente.

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  Todos los tests (integration, E2E) pasan.
  Documentación de API completada.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R2.WP1-T31-ST1"
    description: "Implementar los endpoints de API /pause y /resume en el backend para controlar el estado de la tarea de generación."
    complejidad: 4
    entregable: "Colección Postman que prueba los endpoints y verifica que el estado de la tarea de generación cambia."
    status: "pendiente"
  - id: "R2.WP1-T31-ST2"
    description: "Añadir el botón "Pause" en la Prompt Bar de la UI."
    complejidad: 3
    entregable: "El botón es visible durante la generación de contenido."
    status: "pendiente"
  - id: "R2.WP1-T31-ST3"
    description: "Implementar el modal de confirmación con las opciones "Continuar" y "Cancelar" y su lógica correspondiente."
    complejidad: 3
    entregable: "Test Cypress que pausa la generación, hace clic en "Cancelar" y verifica que el flujo se detiene."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:37:43Z"
  checksum: "1dc603a6ddf3944180f1f6ccaa63042d67d8524fddc30ba3fe21201589aaf670"
  version: "1758753463"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-31: Pause/Abort Flow

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Media
**Release Target:** Release 2
**Complejidad Total:** 10

## Descripción
Dar al usuario el control sobre el proceso de generación de contenido, permitiéndole pausar, reanudar o cancelar por completo una generación en curso.

## Detalles Técnicos
**Backend:** Endpoints POST /pause y POST /resume. La lógica debe manejar el estado de la tarea de generación (ej. en Celery).
**Frontend:** Botón "Pause" en la Prompt Bar que, al ser presionado, muestra un modal con las opciones "Continuar" y "Cancelar".

## Estrategia de Test
**Integration Tests:** Probar los endpoints de la API para pausar y reanudar.
**E2E Tests (Cypress):** Probar el flujo completo desde la UI: iniciar generación, pausar, ver el modal, y probar las opciones de continuar y cancelar.

## Documentación Requerida
Actualizar OpenAPI para los nuevos endpoints.

## Criterios de Aceptación
Una petición a POST /pause tiene una latencia p95 ≤ 150 ms.
El modal de confirmación aparece en la UI en ≤ 200 ms tras hacer clic en "Pause".
La opción "Continuar" reanuda el flujo de generación, y "Cancelar" lo detiene permanentemente.

## Definición de Hecho (DoD)
Código revisado y aprobado.
Todos los tests (integration, E2E) pasan.
Documentación de API completada.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R2.WP1-T31-ST1"
- description: "Implementar los endpoints de API /pause y /resume en el backend para controlar el estado de la tarea de generación."
- complejidad: 4
- entregable: "Colección Postman que prueba los endpoints y verifica que el estado de la tarea de generación cambia."
- status: "pendiente"
### id: "R2.WP1-T31-ST2"
- description: "Añadir el botón "Pause" en la Prompt Bar de la UI."
- complejidad: 3
- entregable: "El botón es visible durante la generación de contenido."
- status: "pendiente"
### id: "R2.WP1-T31-ST3"
- description: "Implementar el modal de confirmación con las opciones "Continuar" y "Cancelar" y su lógica correspondiente."
- complejidad: 3
- entregable: "Test Cypress que pausa la generación, hace clic en "Cancelar" y verifica que el flujo se detiene."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:37:44 UTC*
*Validador: task-data-parser.sh v1.0*
