---
task_id: "T-32"
titulo: "Template Management"
estado: "Pendiente"
dependencias: "T-01"
prioridad: "Alta"
release_target: "Release 3"
complejidad: 9
descripcion: "Crear una interfaz de gestión completa (CRUD) para las plantillas de prompts. Los usuarios administradores podrán crear, listar, editar y eliminar plantillas que luego estarán disponibles para todos los usuarios."

# Technical Details
detalles_tecnicos: |
  **Backend:** API REST (/templates) para el CRUD de plantillas, con persistencia en la base de datos.
  **Frontend:** Interfaz en la sección de "Settings" del panel de administración.
  **DB:** Tabla templates con migraciones gestionadas por Alembic o similar.

# Test Strategy
estrategia_test: |
  **Integration Tests:** Cobertura completa de la API /templates.
  **E2E Tests (Cypress):** Probar el flujo CRUD completo desde la UI del panel de administración.

# Documentation
documentacion: |
  Actualizar OpenAPI para los endpoints de /templates.

# Acceptance Criteria
criterios_aceptacion: |
  El CRUD de plantillas opera con éxito (respuestas 2xx) y los cambios se reflejan en la base de datos.
  El dropdown de selección de plantillas de T-18 lista las plantillas creadas aquí.
  La API valida los inputs (ej. nombre de plantilla no vacío) y retorna errores 4xx claros.

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  Todos los tests (integration, E2E) pasan.
  Documentación de API y scripts de migración completados.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R3.WP2-T32-ST1"
    description: "Implementar los endpoints REST para el CRUD de plantillas (/templates) y las migraciones de DB."
    complejidad: 4
    entregable: "Colección Postman que prueba el CRUD completo de plantillas. Script de migración existe."
    status: "pendiente"
  - id: "R3.WP2-T32-ST2"
    description: "Desarrollar la UI en la sección de "Settings" (usando el esqueleto de T-44) para gestionar las plantillas."
    complejidad: 5
    entregable: "Test Cypress donde un usuario crea, edita y elimina una plantilla a través de la UI."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:37:46Z"
  checksum: "b80eff646e5b7d93945d2a775619dc266000f34e272a0423749b1ccd943f5198"
  version: "1758753466"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-32: Template Management

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Alta
**Release Target:** Release 3
**Complejidad Total:** 9

## Descripción
Crear una interfaz de gestión completa (CRUD) para las plantillas de prompts. Los usuarios administradores podrán crear, listar, editar y eliminar plantillas que luego estarán disponibles para todos los usuarios.

## Detalles Técnicos
**Backend:** API REST (/templates) para el CRUD de plantillas, con persistencia en la base de datos.
**Frontend:** Interfaz en la sección de "Settings" del panel de administración.
**DB:** Tabla templates con migraciones gestionadas por Alembic o similar.

## Estrategia de Test
**Integration Tests:** Cobertura completa de la API /templates.
**E2E Tests (Cypress):** Probar el flujo CRUD completo desde la UI del panel de administración.

## Documentación Requerida
Actualizar OpenAPI para los endpoints de /templates.

## Criterios de Aceptación
El CRUD de plantillas opera con éxito (respuestas 2xx) y los cambios se reflejan en la base de datos.
El dropdown de selección de plantillas de T-18 lista las plantillas creadas aquí.
La API valida los inputs (ej. nombre de plantilla no vacío) y retorna errores 4xx claros.

## Definición de Hecho (DoD)
Código revisado y aprobado.
Todos los tests (integration, E2E) pasan.
Documentación de API y scripts de migración completados.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R3.WP2-T32-ST1"
- description: "Implementar los endpoints REST para el CRUD de plantillas (/templates) y las migraciones de DB."
- complejidad: 4
- entregable: "Colección Postman que prueba el CRUD completo de plantillas. Script de migración existe."
- status: "pendiente"
### id: "R3.WP2-T32-ST2"
- description: "Desarrollar la UI en la sección de "Settings" (usando el esqueleto de T-44) para gestionar las plantillas."
- complejidad: 5
- entregable: "Test Cypress donde un usuario crea, edita y elimina una plantilla a través de la UI."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:37:47 UTC*
*Validador: task-data-parser.sh v1.0*
