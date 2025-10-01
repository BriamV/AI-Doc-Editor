---
task_id: "T-41"
titulo: "User API Key Management"
estado: "✅ Completado 100% - DoD Satisfied"
dependencias: "T-02, T-12"
prioridad: "Crítica"
release_target: "Release 0"
complejidad: 9
descripcion: "Permitir a los usuarios gestionar su propia clave de API de OpenAI. La clave será almacenada de forma segura y utilizada por el backend para realizar llamadas a la API de OpenAI en nombre del usuario."

# Technical Details
detalles_tecnicos: |
  **Endpoint:** POST /user/credentials.
  **Seguridad:** La clave se guarda cifrada utilizando el Credential Store de T-12. Nunca se devuelve en ninguna respuesta de la API.
  **UI:** Sección en el perfil de usuario para introducir/actualizar la clave.

# Test Strategy
estrategia_test: |
  **Unit Tests:** Verificar que la clave se cifra correctamente.
  **Integration Tests:** Probar el endpoint /user/credentials. Verificar que una llamada a un servicio de IA falla con 402 si no hay clave, y funciona si hay una clave válida.
  **Security Tests:** Asegurar que la clave no se puede recuperar a través de ninguna API.

# Documentation
documentacion: |
  Actualizar OpenAPI para el endpoint /user/credentials.

# Acceptance Criteria
criterios_aceptacion: |
  El endpoint rechaza claves inválidas (formato incorrecto) con un error 400.
  Una clave válida se guarda cifrada y no se expone en ninguna respuesta de la API.
  Las llamadas a los servicios de OpenAI sin una clave configurada devuelven un error HTTP 402 (Payment Required).

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  Todos los tests (unit, integration, security) pasan.
  Documentación de API completada.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R0.WP2-T41-ST1"
    description: "Implementar el endpoint POST /user/credentials que valida y guarda la clave de API del usuario."
    complejidad: 4
    entregable: "Colección Postman que prueba el endpoint con una clave válida (guarda) y una inválida (rechaza)."
    status: "completado"
  - id: "R0.WP2-T41-ST2"
    description: "Utilizar el Credential Store de T-12 para encriptar la clave antes de guardarla en la DB."
    complejidad: 2
    entregable: "Test que verifica que la clave en la base de datos está encriptada."
    status: "completado"
  - id: "R0.WP2-T41-ST3"
    description: "Implementar la UI en el perfil de usuario para que pueda introducir y actualizar su clave de API."
    complejidad: 3
    entregable: "Test Cypress donde un usuario guarda su clave de API a través de la UI."
    status: "completado"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:38:15Z"
  checksum: "c4a8b4d86df89c3107250abdd70dd95ac0b4ef72dde93403032e92f605e9241d"
  version: "1758753495"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-41: User API Key Management

## Estado Actual
**Estado:** ✅ Completado 100% - DoD Satisfied
**Prioridad:** Crítica
**Release Target:** Release 0
**Complejidad Total:** 9

## Descripción
Permitir a los usuarios gestionar su propia clave de API de OpenAI. La clave será almacenada de forma segura y utilizada por el backend para realizar llamadas a la API de OpenAI en nombre del usuario.

## Detalles Técnicos
**Endpoint:** POST /user/credentials.
**Seguridad:** La clave se guarda cifrada utilizando el Credential Store de T-12. Nunca se devuelve en ninguna respuesta de la API.
**UI:** Sección en el perfil de usuario para introducir/actualizar la clave.

## Estrategia de Test
**Unit Tests:** Verificar que la clave se cifra correctamente.
**Integration Tests:** Probar el endpoint /user/credentials. Verificar que una llamada a un servicio de IA falla con 402 si no hay clave, y funciona si hay una clave válida.
**Security Tests:** Asegurar que la clave no se puede recuperar a través de ninguna API.

## Documentación Requerida
Actualizar OpenAPI para el endpoint /user/credentials.

## Criterios de Aceptación
El endpoint rechaza claves inválidas (formato incorrecto) con un error 400.
Una clave válida se guarda cifrada y no se expone en ninguna respuesta de la API.
Las llamadas a los servicios de OpenAI sin una clave configurada devuelven un error HTTP 402 (Payment Required).

## Definición de Hecho (DoD)
Código revisado y aprobado.
Todos los tests (unit, integration, security) pasan.
Documentación de API completada.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R0.WP2-T41-ST1"
- description: "Implementar el endpoint POST /user/credentials que valida y guarda la clave de API del usuario."
- complejidad: 4
- entregable: "Colección Postman que prueba el endpoint con una clave válida (guarda) y una inválida (rechaza)."
- status: "completado"
### id: "R0.WP2-T41-ST2"
- description: "Utilizar el Credential Store de T-12 para encriptar la clave antes de guardarla en la DB."
- complejidad: 2
- entregable: "Test que verifica que la clave en la base de datos está encriptada."
- status: "completado"
### id: "R0.WP2-T41-ST3"
- description: "Implementar la UI en el perfil de usuario para que pueda introducir y actualizar su clave de API."
- complejidad: 3
- entregable: "Test Cypress donde un usuario guarda su clave de API a través de la UI."
- status: "completado"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:38:15 UTC*
*Validador: task-data-parser.sh v1.0*
