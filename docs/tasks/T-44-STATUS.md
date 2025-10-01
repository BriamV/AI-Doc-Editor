---
task_id: "T-44"
titulo: "Admin Panel Skeleton & Config Store"
estado: "✅ Completado 100% - DoD Satisfied"
dependencias: "T-02"
prioridad: "Crítica"
release_target: "Release 0"
complejidad: 9
descripcion: "Crear la estructura fundamental para todas las futuras funcionalidades de administración. Esto incluye el layout de UI base para la sección Settings y un servicio de configuración genérico en el backend para persistir ajustes del sistema."

# Technical Details
detalles_tecnicos: |
  **UI:** Componente React para el layout de la sección /settings, accesible solo para roles de admin.
  **Backend:** API REST (GET /config, POST /config) para gestionar una tabla de configuración de tipo clave-valor.
  **DB:** Modelo y migración para la tabla system_configurations.

# Test Strategy
estrategia_test: |
  **E2E Tests (Cypress):** Verificar que la ruta /settings es accesible para un admin y denegada para un editor.
  **Integration Tests:** Probar el CRUD de la API de configuración.

# Documentation
documentacion: |
  Actualizar OpenAPI para los endpoints /config.

# Acceptance Criteria
criterios_aceptacion: |
  La ruta /settings es accesible para roles de admin y muestra un layout vacío.
  La API /config permite leer y escribir configuraciones clave-valor.
  La UI del panel es un esqueleto listo para ser poblado por tareas dependientes (T-03, T-32, T-37).

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  Todos los tests (E2E, integration) pasan.
  Documentación de API completada.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R0.WP2-T44-ST1"
    description: "Implementar el modelo de datos y la API REST para el servicio de configuración clave-valor."
    complejidad: 4
    entregable: "Colección Postman que prueba el CRUD de la API /config."
    status: "completado"
  - id: "R0.WP2-T44-ST2"
    description: "Crear el componente de UI base para el panel de "Settings" y proteger la ruta /settings por rol de admin."
    complejidad: 5
    entregable: "Test Cypress donde un admin accede a /settings y un editor recibe un error 403/redirección."
    status: "completado"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:38:24Z"
  checksum: "227a47a3df652149cb4babee73fdd45b7936ed8708cb2833b1281e1e1a1c0991"
  version: "1758753504"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-44: Admin Panel Skeleton & Config Store

## Estado Actual
**Estado:** ✅ Completado 100% - DoD Satisfied
**Prioridad:** Crítica
**Release Target:** Release 0
**Complejidad Total:** 9

## Descripción
Crear la estructura fundamental para todas las futuras funcionalidades de administración. Esto incluye el layout de UI base para la sección Settings y un servicio de configuración genérico en el backend para persistir ajustes del sistema.

## Detalles Técnicos
**UI:** Componente React para el layout de la sección /settings, accesible solo para roles de admin.
**Backend:** API REST (GET /config, POST /config) para gestionar una tabla de configuración de tipo clave-valor.
**DB:** Modelo y migración para la tabla system_configurations.

## Estrategia de Test
**E2E Tests (Cypress):** Verificar que la ruta /settings es accesible para un admin y denegada para un editor.
**Integration Tests:** Probar el CRUD de la API de configuración.

## Documentación Requerida
Actualizar OpenAPI para los endpoints /config.

## Criterios de Aceptación
La ruta /settings es accesible para roles de admin y muestra un layout vacío.
La API /config permite leer y escribir configuraciones clave-valor.
La UI del panel es un esqueleto listo para ser poblado por tareas dependientes (T-03, T-32, T-37).

## Definición de Hecho (DoD)
Código revisado y aprobado.
Todos los tests (E2E, integration) pasan.
Documentación de API completada.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R0.WP2-T44-ST1"
- description: "Implementar el modelo de datos y la API REST para el servicio de configuración clave-valor."
- complejidad: 4
- entregable: "Colección Postman que prueba el CRUD de la API /config."
- status: "completado"
### id: "R0.WP2-T44-ST2"
- description: "Crear el componente de UI base para el panel de "Settings" y proteger la ruta /settings por rol de admin."
- complejidad: 5
- entregable: "Test Cypress donde un admin accede a /settings y un editor recibe un error 403/redirección."
- status: "completado"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:38:24 UTC*
*Validador: task-data-parser.sh v1.0*
