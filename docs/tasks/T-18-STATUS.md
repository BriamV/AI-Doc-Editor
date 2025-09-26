---
task_id: "T-18"
titulo: "Context Flags & Template Selection"
estado: "Pendiente"
dependencias: "T-32"
prioridad: "Alta"
release_target: "Release 3"
complejidad: 11
descripcion: "Implementar controles en la UI que permitan al usuario seleccionar el contexto para la generación de IA (usar base de conocimiento, búsqueda web o libre) y elegir una plantilla de prompt predefinida."

# Technical Details
detalles_tecnicos: |
  **UI:** Componentes Toggle y Dropdown en React.
  **Backend:** Endpoint PATCH /context para persistir la selección del usuario por documento.
  **Lógica:** El servicio de generación debe leer esta configuración y ajustar su comportamiento (ej. no realizar búsqueda RAG si el contexto es "Libre").

# Test Strategy
estrategia_test: |
  **Unit Tests:** Probar la lógica del backend que ajusta el comportamiento de generación según el contexto.
  **E2E Tests (Cypress):** Probar que cambiar el toggle o seleccionar una plantilla en la UI se refleja en la siguiente generación de contenido.

# Documentation
documentacion: |
  Actualizar la documentación de la API para el endpoint /context.

# Acceptance Criteria
criterios_aceptacion: |
  Cambiar el toggle de contexto en la UI aplica el contexto y excluye la búsqueda RAG en ≤ 3 segundos (p95).
  El dropdown muestra y aplica la plantilla seleccionada de T-32.
  El toggle "Web search" está presente pero deshabilitado, y al pasar el cursor sobre él muestra el tooltip: "Disponible en futura versión".

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  Todos los tests (unit, E2E) pasan.
  Documentación de API completada.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R3.WP2-T18-ST1"
    description: "Implementar el componente de UI con el toggle de contextos (KB, Web, Libre) y el dropdown de plantillas."
    complejidad: 4
    entregable: "Componente React renderiza los controles. El toggle "Web search" está deshabilitado con el tooltip correcto."
    status: "pendiente"
  - id: "R3.WP2-T18-ST2"
    description: "Implementar el endpoint API /context (PATCH) que actualiza las preferencias del usuario para un documento."
    complejidad: 3
    entregable: "Colección Postman que actualiza el contexto y la plantilla de un documento."
    status: "pendiente"
  - id: "R3.WP2-T18-ST3"
    description: "Conectar la UI al backend y añadir tests que verifiquen que la selección de contexto/plantilla afecta a la generación."
    complejidad: 4
    entregable: "Test Cypress que selecciona "Libre" y verifica que no se hace una búsqueda RAG. Otro test que selecciona una plantilla y verifica que se usa en el prompt."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:36:55Z"
  checksum: "31cb2bc8529af2cbe5604c6feadccfd15f611d1c383b469b9b41f68dff6f2b1a"
  version: "1758753415"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-18: Context Flags & Template Selection

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Alta
**Release Target:** Release 3
**Complejidad Total:** 11

## Descripción
Implementar controles en la UI que permitan al usuario seleccionar el contexto para la generación de IA (usar base de conocimiento, búsqueda web o libre) y elegir una plantilla de prompt predefinida.

## Detalles Técnicos
**UI:** Componentes Toggle y Dropdown en React.
**Backend:** Endpoint PATCH /context para persistir la selección del usuario por documento.
**Lógica:** El servicio de generación debe leer esta configuración y ajustar su comportamiento (ej. no realizar búsqueda RAG si el contexto es "Libre").

## Estrategia de Test
**Unit Tests:** Probar la lógica del backend que ajusta el comportamiento de generación según el contexto.
**E2E Tests (Cypress):** Probar que cambiar el toggle o seleccionar una plantilla en la UI se refleja en la siguiente generación de contenido.

## Documentación Requerida
Actualizar la documentación de la API para el endpoint /context.

## Criterios de Aceptación
Cambiar el toggle de contexto en la UI aplica el contexto y excluye la búsqueda RAG en ≤ 3 segundos (p95).
El dropdown muestra y aplica la plantilla seleccionada de T-32.
El toggle "Web search" está presente pero deshabilitado, y al pasar el cursor sobre él muestra el tooltip: "Disponible en futura versión".

## Definición de Hecho (DoD)
Código revisado y aprobado.
Todos los tests (unit, E2E) pasan.
Documentación de API completada.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R3.WP2-T18-ST1"
- description: "Implementar el componente de UI con el toggle de contextos (KB, Web, Libre) y el dropdown de plantillas."
- complejidad: 4
- entregable: "Componente React renderiza los controles. El toggle "Web search" está deshabilitado con el tooltip correcto."
- status: "pendiente"
### id: "R3.WP2-T18-ST2"
- description: "Implementar el endpoint API /context (PATCH) que actualiza las preferencias del usuario para un documento."
- complejidad: 3
- entregable: "Colección Postman que actualiza el contexto y la plantilla de un documento."
- status: "pendiente"
### id: "R3.WP2-T18-ST3"
- description: "Conectar la UI al backend y añadir tests que verifiquen que la selección de contexto/plantilla afecta a la generación."
- complejidad: 4
- entregable: "Test Cypress que selecciona "Libre" y verifica que no se hace una búsqueda RAG. Otro test que selecciona una plantilla y verifica que se usa en el prompt."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:36:56 UTC*
*Validador: task-data-parser.sh v1.0*
