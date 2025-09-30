---
task_id: "T-37"
titulo: "Admin Panel: Add User & System Mgmt Features"
estado: "Pendiente"
dependencias: "T-02, T-44, T-04"
prioridad: "Alta"
release_target: "Release 4"
complejidad: 14
descripcion: "Extender el panel de administración existente (T-44) para permitir a los usuarios con rol admin gestionar usuarios y configuraciones clave del sistema."

# Technical Details
detalles_tecnicos: |
  **UI:** Nueva sección en la aplicación, visible solo para administradores.
  **Funcionalidades:**

# Test Strategy
estrategia_test: |
  **E2E Tests (Cypress):** Probar cada una de las funcionalidades del panel de administración desde la perspectiva de un usuario admin.

# Documentation
documentacion: |
  Documentar las capacidades del panel de administración.

# Acceptance Criteria
criterios_aceptacion: |
  El CRUD de usuarios se refleja inmediatamente en el sistema (ej. un usuario desactivado no puede iniciar sesión).
  El panel muestra el estado del vector-store y el botón de re-indexación dispara la tarea correspondiente.
  El sistema respeta la ventana de restauración y el modelo de IA configurados en el panel.

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  Todos los tests E2E del panel de administración pasan.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R4.WP2-T37-ST1"
    description: "Implementar la UI y los endpoints API para el CRUD de usuarios (Crear, Leer, Actualizar rol, Desactivar)."
    complejidad: 5
    entregable: "Test Cypress donde un admin crea un nuevo usuario, cambia su rol y lo desactiva, verificando los cambios."
    status: "pendiente"
  - id: "R4.WP2-T37-ST2"
    description: "Implementar la sección del panel para ver el estado del vector-store y un botón para disparar una re-indexación."
    complejidad: 4
    entregable: "El panel muestra "Healthy". Un clic en "Re-index" dispara una tarea asíncrona y la UI muestra "Indexing..."."
    status: "pendiente"
  - id: "R4.WP2-T37-ST3"
    description: "Implementar los controles en la UI para configurar la ventana de restauración y seleccionar el modelo de IA por defecto."
    complejidad: 5
    entregable: "Test que cambia la ventana de restauración y el modelo de IA, y verifica que la configuración se aplica."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:38:00Z"
  checksum: "50997e59581efdd8595b3d65640d9500599b707f817c569ac40d47543cff1181"
  version: "1758753480"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-37: Admin Panel: Add User & System Mgmt Features

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Alta
**Release Target:** Release 4
**Complejidad Total:** 14

## Descripción
Extender el panel de administración existente (T-44) para permitir a los usuarios con rol admin gestionar usuarios y configuraciones clave del sistema.

## Detalles Técnicos
**UI:** Nueva sección en la aplicación, visible solo para administradores.
**Funcionalidades:**

## Estrategia de Test
**E2E Tests (Cypress):** Probar cada una de las funcionalidades del panel de administración desde la perspectiva de un usuario admin.

## Documentación Requerida
Documentar las capacidades del panel de administración.

## Criterios de Aceptación
El CRUD de usuarios se refleja inmediatamente en el sistema (ej. un usuario desactivado no puede iniciar sesión).
El panel muestra el estado del vector-store y el botón de re-indexación dispara la tarea correspondiente.
El sistema respeta la ventana de restauración y el modelo de IA configurados en el panel.

## Definición de Hecho (DoD)
Código revisado y aprobado.
Todos los tests E2E del panel de administración pasan.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R4.WP2-T37-ST1"
- description: "Implementar la UI y los endpoints API para el CRUD de usuarios (Crear, Leer, Actualizar rol, Desactivar)."
- complejidad: 5
- entregable: "Test Cypress donde un admin crea un nuevo usuario, cambia su rol y lo desactiva, verificando los cambios."
- status: "pendiente"
### id: "R4.WP2-T37-ST2"
- description: "Implementar la sección del panel para ver el estado del vector-store y un botón para disparar una re-indexación."
- complejidad: 4
- entregable: "El panel muestra "Healthy". Un clic en "Re-index" dispara una tarea asíncrona y la UI muestra "Indexing..."."
- status: "pendiente"
### id: "R4.WP2-T37-ST3"
- description: "Implementar los controles en la UI para configurar la ventana de restauración y seleccionar el modelo de IA por defecto."
- complejidad: 5
- entregable: "Test que cambia la ventana de restauración y el modelo de IA, y verifica que la configuración se aplica."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:38:00 UTC*
*Validador: task-data-parser.sh v1.0*
