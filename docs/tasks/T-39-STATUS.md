---
task_id: "T-39"
titulo: "Implementar Pin/Favoritos en Sidebar"
estado: "Pendiente"
dependencias: "T-21"
prioridad: "Media"
release_target: "Release 3"
complejidad: 7
descripcion: "Añadir una funcionalidad que permita a los usuarios marcar documentos como favoritos o anclados (pin), para que aparezcan en una sección dedicada en la parte superior de la barra de navegación lateral."

# Technical Details
detalles_tecnicos: |
  **Backend:** Endpoint para marcar/desmarcar un documento como favorito.
  **DB:** Tabla de unión user_favorite_documents.
  **Frontend:** Icono de "pin" en cada item de la lista de documentos y una nueva sección "Favoritos" en la sidebar.

# Test Strategy
estrategia_test: |
  **E2E Tests (Cypress):** Probar el flujo completo: hacer clic en el icono de pin, verificar que el documento se mueve a la sección de favoritos y que el estado persiste tras recargar la página.

# Documentation
documentacion: |
  Actualizar OpenAPI para el nuevo endpoint.

# Acceptance Criteria
criterios_aceptacion: |
  Al hacer clic en el icono 'pin', el documento se mueve a la sección 'Favoritos' y el estado persiste entre sesiones.
  La sección 'Favoritos' es la primera en la lista de navegación de la sidebar.

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  Todos los tests E2E pasan.
  Documentación de API completada.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R3.WP1-T39-ST1"
    description: "Modificar el modelo de datos para almacenar el estado de "favorito" por usuario y documento."
    complejidad: 2
    entregable: "Script de migración de la base de datos."
    status: "pendiente"
  - id: "R3.WP1-T39-ST2"
    description: "Implementar el endpoint de API para marcar/desmarcar un documento como favorito."
    complejidad: 2
    entregable: "Colección Postman que prueba el endpoint."
    status: "pendiente"
  - id: "R3.WP1-T39-ST3"
    description: "Implementar el icono de "pin" en la UI y la sección de "Favoritos" en la sidebar."
    complejidad: 3
    entregable: "Test Cypress que marca un documento como favorito y verifica que aparece en la sección correspondiente."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:38:06Z"
  checksum: "8c8249fe74c26b1928f0ee07f5f3fc5a262748cf373d88a2b82f45bd44da6793"
  version: "1758753486"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-39: Implementar Pin/Favoritos en Sidebar

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Media
**Release Target:** Release 3
**Complejidad Total:** 7

## Descripción
Añadir una funcionalidad que permita a los usuarios marcar documentos como favoritos o anclados (pin), para que aparezcan en una sección dedicada en la parte superior de la barra de navegación lateral.

## Detalles Técnicos
**Backend:** Endpoint para marcar/desmarcar un documento como favorito.
**DB:** Tabla de unión user_favorite_documents.
**Frontend:** Icono de "pin" en cada item de la lista de documentos y una nueva sección "Favoritos" en la sidebar.

## Estrategia de Test
**E2E Tests (Cypress):** Probar el flujo completo: hacer clic en el icono de pin, verificar que el documento se mueve a la sección de favoritos y que el estado persiste tras recargar la página.

## Documentación Requerida
Actualizar OpenAPI para el nuevo endpoint.

## Criterios de Aceptación
Al hacer clic en el icono 'pin', el documento se mueve a la sección 'Favoritos' y el estado persiste entre sesiones.
La sección 'Favoritos' es la primera en la lista de navegación de la sidebar.

## Definición de Hecho (DoD)
Código revisado y aprobado.
Todos los tests E2E pasan.
Documentación de API completada.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R3.WP1-T39-ST1"
- description: "Modificar el modelo de datos para almacenar el estado de "favorito" por usuario y documento."
- complejidad: 2
- entregable: "Script de migración de la base de datos."
- status: "pendiente"
### id: "R3.WP1-T39-ST2"
- description: "Implementar el endpoint de API para marcar/desmarcar un documento como favorito."
- complejidad: 2
- entregable: "Colección Postman que prueba el endpoint."
- status: "pendiente"
### id: "R3.WP1-T39-ST3"
- description: "Implementar el icono de "pin" en la UI y la sección de "Favoritos" en la sidebar."
- complejidad: 3
- entregable: "Test Cypress que marca un documento como favorito y verifica que aparece en la sección correspondiente."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:38:07 UTC*
*Validador: task-data-parser.sh v1.0*
