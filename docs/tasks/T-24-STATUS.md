---
task_id: "T-24"
titulo: "Consentimiento Explícito"
estado: "Pendiente"
dependencias: "T-04"
prioridad: "Crítica"
release_target: "Release 1"
complejidad: 7
descripcion: "Implementar un mecanismo de consentimiento explícito del usuario antes de enviar sus datos a servicios de IA externos. El consentimiento debe ser registrado de forma inmutable."

# Technical Details
detalles_tecnicos: |
  **UI:** Checkbox en la interfaz de subida de archivos.
  **Backend:** Registrar el evento de consentimiento en el log de auditoría de T-13. La lógica de negocio debe impedir la llamada a la IA si no hay consentimiento.

# Test Strategy
estrategia_test: |
  **E2E Tests (Cypress):** Probar que el botón de "Upload" está deshabilitado hasta que se marca el checkbox. Probar que si no se da el consentimiento, las funcionalidades de IA no se ejecutan.

# Documentation
documentacion: |
  Documentar el flujo de consentimiento.

# Acceptance Criteria
criterios_aceptacion: |
  Sin marcar el checkbox, los botones "Upload" y "Generate context" están deshabilitados.
  El acto de dar consentimiento se registra en el log de auditoría inmutable.

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  Todos los tests E2E pasan.
  El flujo ha sido revisado y aprobado desde una perspectiva de compliance.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R1.WP1-T24-ST1"
    description: "Añadir el checkbox de consentimiento en la UI de subida de archivos."
    complejidad: 2
    entregable: "El checkbox es visible en la UI y el botón de "Upload" está deshabilitado por defecto."
    status: "pendiente"
  - id: "R1.WP1-T24-ST2"
    description: "Implementar la lógica de frontend para habilitar/deshabilitar los botones según el estado del checkbox."
    complejidad: 2
    entregable: "Test Cypress que verifica que el botón "Upload" se habilita al marcar el checkbox."
    status: "pendiente"
  - id: "R1.WP1-T24-ST3"
    description: "Implementar la lógica de backend para registrar el consentimiento en el log de auditoría al subir un archivo."
    complejidad: 3
    entregable: "Al subir un archivo, se crea una entrada en el log de auditoría registrando el consentimiento del usuario."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:37:14Z"
  checksum: "0441274c2a7a4b7ac5a3507a330e3e0ffc43c10e5b879d58b06efd4ce6a30a17"
  version: "1758753434"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-24: Consentimiento Explícito

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Crítica
**Release Target:** Release 1
**Complejidad Total:** 7

## Descripción
Implementar un mecanismo de consentimiento explícito del usuario antes de enviar sus datos a servicios de IA externos. El consentimiento debe ser registrado de forma inmutable.

## Detalles Técnicos
**UI:** Checkbox en la interfaz de subida de archivos.
**Backend:** Registrar el evento de consentimiento en el log de auditoría de T-13. La lógica de negocio debe impedir la llamada a la IA si no hay consentimiento.

## Estrategia de Test
**E2E Tests (Cypress):** Probar que el botón de "Upload" está deshabilitado hasta que se marca el checkbox. Probar que si no se da el consentimiento, las funcionalidades de IA no se ejecutan.

## Documentación Requerida
Documentar el flujo de consentimiento.

## Criterios de Aceptación
Sin marcar el checkbox, los botones "Upload" y "Generate context" están deshabilitados.
El acto de dar consentimiento se registra en el log de auditoría inmutable.

## Definición de Hecho (DoD)
Código revisado y aprobado.
Todos los tests E2E pasan.
El flujo ha sido revisado y aprobado desde una perspectiva de compliance.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R1.WP1-T24-ST1"
- description: "Añadir el checkbox de consentimiento en la UI de subida de archivos."
- complejidad: 2
- entregable: "El checkbox es visible en la UI y el botón de "Upload" está deshabilitado por defecto."
- status: "pendiente"
### id: "R1.WP1-T24-ST2"
- description: "Implementar la lógica de frontend para habilitar/deshabilitar los botones según el estado del checkbox."
- complejidad: 2
- entregable: "Test Cypress que verifica que el botón "Upload" se habilita al marcar el checkbox."
- status: "pendiente"
### id: "R1.WP1-T24-ST3"
- description: "Implementar la lógica de backend para registrar el consentimiento en el log de auditoría al subir un archivo."
- complejidad: 3
- entregable: "Al subir un archivo, se crea una entrada en el log de auditoría registrando el consentimiento del usuario."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:37:14 UTC*
*Validador: task-data-parser.sh v1.0*
