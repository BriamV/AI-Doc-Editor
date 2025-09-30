---
task_id: "T-13"
titulo: "Audit Log WORM & Viewer"
estado: "Completado"
dependencias: "T-01"
prioridad: "Crítica"
release_target: "Release 0"
complejidad: 11
descripcion: "Crear un sistema de registro de auditoría inmutable (WORM - Write Once, Read Many) para todas las acciones críticas del sistema. También se debe proporcionar una interfaz para que los administradores puedan visualizar y filtrar estos logs."

# Technical Details
detalles_tecnicos: |
  **Backend:** Tabla en la base de datos con permisos de INSERT y SELECT únicamente para el usuario de la aplicación.
  **Frontend:** Interfaz de visualización para administradores con filtros por usuario, tipo de acción y rango de fechas.

# Test Strategy
estrategia_test: |
  **Integration Tests:** Realizar una acción crítica (ej. login, guardar documento) y verificar que se crea la entrada correcta en el log de auditoría.
  **Security Tests:** Intentar modificar o eliminar un registro del log y verificar que la operación falla.
  **E2E Tests (Cypress):** Probar la interfaz del visor de logs, incluyendo la paginación y los filtros.

# Documentation
documentacion: |


# Acceptance Criteria
criterios_aceptacion: |
  Una entrada en el log WORM aparece en ≤ 5 segundos tras la acción correspondiente.
  La UI del visor de logs permite filtrar por usuario, tipo de acción y rango de fechas, con paginación funcional.

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  Todos los tests (integration, security, E2E) pasan.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R0.WP3-T13-ST1"
    description: "Diseñar y crear la tabla de base de datos para el log de auditoría con una política de append-only a nivel de permisos de DB."
    complejidad: 4
    entregable: "Script de migración de la base de datos. Un test que intenta un UPDATE o DELETE en la tabla falla debido a los permisos."
    status: "pendiente"
  - id: "R0.WP3-T13-ST2"
    description: "Implementar el servicio de logging que escribe eventos en la tabla de auditoría."
    complejidad: 4
    entregable: "Test de integración que realiza una acción (ej. guardar documento) y verifica que se crea la entrada correspondiente en el log."
    status: "pendiente"
  - id: "R0.WP3-T13-ST3"
    description: "Desarrollar la UI del visor de logs para administradores, incluyendo filtros por usuario, acción y fecha."
    complejidad: 3
    entregable: "Test Cypress donde un admin filtra el log y verifica que los resultados son correctos."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:36:34Z"
  checksum: "3d7e98a423ba6cfecbc55a87b237cd2f80272de518e090a97e0cf8cae50f9ec8"
  version: "1758753394"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-13: Audit Log WORM & Viewer

## Estado Actual
**Estado:** Completado
**Prioridad:** Crítica
**Release Target:** Release 0
**Complejidad Total:** 11

## Descripción
Crear un sistema de registro de auditoría inmutable (WORM - Write Once, Read Many) para todas las acciones críticas del sistema. También se debe proporcionar una interfaz para que los administradores puedan visualizar y filtrar estos logs.

## Detalles Técnicos
**Backend:** Tabla en la base de datos con permisos de INSERT y SELECT únicamente para el usuario de la aplicación.
**Frontend:** Interfaz de visualización para administradores con filtros por usuario, tipo de acción y rango de fechas.

## Estrategia de Test
**Integration Tests:** Realizar una acción crítica (ej. login, guardar documento) y verificar que se crea la entrada correcta en el log de auditoría.
**Security Tests:** Intentar modificar o eliminar un registro del log y verificar que la operación falla.
**E2E Tests (Cypress):** Probar la interfaz del visor de logs, incluyendo la paginación y los filtros.

## Documentación Requerida


## Criterios de Aceptación
Una entrada en el log WORM aparece en ≤ 5 segundos tras la acción correspondiente.
La UI del visor de logs permite filtrar por usuario, tipo de acción y rango de fechas, con paginación funcional.

## Definición de Hecho (DoD)
Código revisado y aprobado.
Todos los tests (integration, security, E2E) pasan.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R0.WP3-T13-ST1"
- description: "Diseñar y crear la tabla de base de datos para el log de auditoría con una política de append-only a nivel de permisos de DB."
- complejidad: 4
- entregable: "Script de migración de la base de datos. Un test que intenta un UPDATE o DELETE en la tabla falla debido a los permisos."
- status: "pendiente"
### id: "R0.WP3-T13-ST2"
- description: "Implementar el servicio de logging que escribe eventos en la tabla de auditoría."
- complejidad: 4
- entregable: "Test de integración que realiza una acción (ej. guardar documento) y verifica que se crea la entrada correspondiente en el log."
- status: "pendiente"
### id: "R0.WP3-T13-ST3"
- description: "Desarrollar la UI del visor de logs para administradores, incluyendo filtros por usuario, acción y fecha."
- complejidad: 3
- entregable: "Test Cypress donde un admin filtra el log y verifica que los resultados son correctos."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:36:35 UTC*
*Validador: task-data-parser.sh v1.0*
