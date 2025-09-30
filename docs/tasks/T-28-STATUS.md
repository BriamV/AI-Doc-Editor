---
task_id: "T-28"
titulo: "Token Budget Guard"
estado: "Pendiente"
dependencias: "T-07"
prioridad: "Alta"
release_target: "Release 3"
complejidad: 9
descripcion: "Implementar una salvaguarda para evitar enviar peticiones a la API de IA que excedan el límite de tokens del modelo. Esto previene errores y costes inesperados."

# Technical Details
detalles_tecnicos: |
  **Frontend:** Librería de tokenización (ej. tiktoken) para contar los tokens en el cliente y mostrar una advertencia visual.
  **Backend:** Validar el tamaño del prompt en el servidor antes de enviarlo a la API de IA.

# Test Strategy
estrategia_test: |
  **E2E Tests (Cypress):** Probar que la advertencia en la UI aparece al 90% del límite.
  **Integration Tests:** Probar que el backend rechaza una petición que supera el límite con un HTTP 413 (Payload Too Large).

# Documentation
documentacion: |
  Documentar el código de error 413 en la API.

# Acceptance Criteria
criterios_aceptacion: |
  Al alcanzar el 90% del presupuesto de tokens (8,100 tokens), se despliega una advertencia visual en la UI.
  Un intento de enviar una petición que exceda los 9,000 tokens es rechazado con un HTTP 413 y un mensaje claro.

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  Todos los tests (E2E, integration) pasan.
  Documentación de API completada.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R3.WP2-T28-ST1"
    description: "Implementar la lógica en el frontend para contar los tokens del contexto y mostrar una advertencia visual al 90%."
    complejidad: 4
    entregable: "Test Cypress que añade texto hasta superar el 90% del límite y verifica que aparece la advertencia."
    status: "pendiente"
  - id: "R3.WP2-T28-ST2"
    description: "Implementar la validación en el backend para rechazar peticiones que superen el límite de 9000 tokens."
    complejidad: 3
    entregable: "Test de API que envía una petición con más de 9000 tokens y recibe un HTTP 413."
    status: "pendiente"
  - id: "R3.WP2-T28-ST3"
    description: "Asegurar que el mensaje de error es claro y se muestra correctamente en la UI."
    complejidad: 2
    entregable: "Test Cypress que intenta enviar una petición demasiado grande y verifica que se muestra un mensaje de error útil al usuario."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:37:28Z"
  checksum: "a3207a26b07be9bf8df9543a2ea8fdf987201c9d4a49a6d1a4e8ba98ddd6944a"
  version: "1758753448"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-28: Token Budget Guard

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Alta
**Release Target:** Release 3
**Complejidad Total:** 9

## Descripción
Implementar una salvaguarda para evitar enviar peticiones a la API de IA que excedan el límite de tokens del modelo. Esto previene errores y costes inesperados.

## Detalles Técnicos
**Frontend:** Librería de tokenización (ej. tiktoken) para contar los tokens en el cliente y mostrar una advertencia visual.
**Backend:** Validar el tamaño del prompt en el servidor antes de enviarlo a la API de IA.

## Estrategia de Test
**E2E Tests (Cypress):** Probar que la advertencia en la UI aparece al 90% del límite.
**Integration Tests:** Probar que el backend rechaza una petición que supera el límite con un HTTP 413 (Payload Too Large).

## Documentación Requerida
Documentar el código de error 413 en la API.

## Criterios de Aceptación
Al alcanzar el 90% del presupuesto de tokens (8,100 tokens), se despliega una advertencia visual en la UI.
Un intento de enviar una petición que exceda los 9,000 tokens es rechazado con un HTTP 413 y un mensaje claro.

## Definición de Hecho (DoD)
Código revisado y aprobado.
Todos los tests (E2E, integration) pasan.
Documentación de API completada.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R3.WP2-T28-ST1"
- description: "Implementar la lógica en el frontend para contar los tokens del contexto y mostrar una advertencia visual al 90%."
- complejidad: 4
- entregable: "Test Cypress que añade texto hasta superar el 90% del límite y verifica que aparece la advertencia."
- status: "pendiente"
### id: "R3.WP2-T28-ST2"
- description: "Implementar la validación en el backend para rechazar peticiones que superen el límite de 9000 tokens."
- complejidad: 3
- entregable: "Test de API que envía una petición con más de 9000 tokens y recibe un HTTP 413."
- status: "pendiente"
### id: "R3.WP2-T28-ST3"
- description: "Asegurar que el mensaje de error es claro y se muestra correctamente en la UI."
- complejidad: 2
- entregable: "Test Cypress que intenta enviar una petición demasiado grande y verifica que se muestra un mensaje de error útil al usuario."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:37:29 UTC*
*Validador: task-data-parser.sh v1.0*
