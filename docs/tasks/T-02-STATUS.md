---
task_id: "T-02"
titulo: "OAuth 2.0 + JWT Roles"
estado: "✅ Completado 100% - DoD Satisfied"
dependencias: "T-01"
prioridad: "Crítica"
release_target: "Release 0"
complejidad: 9
descripcion: "Implementar el sistema de autenticación y autorización. Los usuarios se autenticarán mediante proveedores externos (Google/Microsoft) usando OAuth 2.0, y el sistema gestionará su acceso a través de roles (editor, admin) embebidos en JSON Web Tokens (JWT)."

# Technical Details
detalles_tecnicos: |
  **Protocolos:** OAuth 2.0 (Authorization Code Flow), JWT (RS256).
  **Backend:** Python (FastAPI), python-jose para JWT.
  **Endpoints:** /auth/login, /auth/callback, /auth/refresh, /users/me.

# Test Strategy
estrategia_test: |
  **Unit Tests:** Cubrir la lógica de creación y validación de JWT.
  **Integration Tests:** Flujo completo de login, obtención de token y acceso a un endpoint protegido.
  **Security Tests:** Verificar la expiración de tokens, validación de firma, y que un rol editor no puede acceder a endpoints de admin.

# Documentation
documentacion: |
  Actualizar la especificación OpenAPI con los nuevos endpoints de autenticación.

# Acceptance Criteria
criterios_aceptacion: |
  Un usuario puede completar el flujo de login con Google/MS.
  El sistema devuelve un JWT válido con el rol correcto tras el login.
  Un endpoint protegido devuelve 401/403 si el token es inválido, ha expirado o no tiene el rol requerido.
  El endpoint /auth/refresh funciona correctamente.

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  Todos los tests (unit, integration, security) pasan.
  Documentación de API completada.
  Integración con el sistema de usuarios verificada.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R0.WP2-T02-ST1"
    description: "Implementar el flujo de autenticación OAuth 2.0 (servidor) para Google y Microsoft, incluyendo callbacks y creación/actualización de usuario en DB."
    complejidad: 5
    entregable: "Test de integración que completa el flujo OAuth y verifica la existencia del usuario en la DB con los datos correctos."
    status: "completado"
  - id: "R0.WP2-T02-ST2"
    description: "Implementar la generación de JWT (access y refresh tokens) con roles (editor, admin) y el endpoint /auth/refresh."
    complejidad: 4
    entregable: "Colección Postman que demuestra que el login devuelve tokens y que /auth/refresh emite un nuevo access token válido."
    status: "completado"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:32:03Z"
  checksum: "65371f15d415151ab75d3922613502da10d3e318338bd856f909425b00d33fc9"
  version: "1758753122"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-02: OAuth 2.0 + JWT Roles

## Estado Actual
**Estado:** ✅ Completado 100% - DoD Satisfied
**Prioridad:** Crítica
**Release Target:** Release 0
**Complejidad Total:** 9

## Descripción
Implementar el sistema de autenticación y autorización. Los usuarios se autenticarán mediante proveedores externos (Google/Microsoft) usando OAuth 2.0, y el sistema gestionará su acceso a través de roles (editor, admin) embebidos en JSON Web Tokens (JWT).

## Detalles Técnicos
**Protocolos:** OAuth 2.0 (Authorization Code Flow), JWT (RS256).
**Backend:** Python (FastAPI), python-jose para JWT.
**Endpoints:** /auth/login, /auth/callback, /auth/refresh, /users/me.

## Estrategia de Test
**Unit Tests:** Cubrir la lógica de creación y validación de JWT.
**Integration Tests:** Flujo completo de login, obtención de token y acceso a un endpoint protegido.
**Security Tests:** Verificar la expiración de tokens, validación de firma, y que un rol editor no puede acceder a endpoints de admin.

## Documentación Requerida
Actualizar la especificación OpenAPI con los nuevos endpoints de autenticación.

## Criterios de Aceptación
Un usuario puede completar el flujo de login con Google/MS.
El sistema devuelve un JWT válido con el rol correcto tras el login.
Un endpoint protegido devuelve 401/403 si el token es inválido, ha expirado o no tiene el rol requerido.
El endpoint /auth/refresh funciona correctamente.

## Definición de Hecho (DoD)
Código revisado y aprobado.
Todos los tests (unit, integration, security) pasan.
Documentación de API completada.
Integración con el sistema de usuarios verificada.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R0.WP2-T02-ST1"
- description: "Implementar el flujo de autenticación OAuth 2.0 (servidor) para Google y Microsoft, incluyendo callbacks y creación/actualización de usuario en DB."
- complejidad: 5
- entregable: "Test de integración que completa el flujo OAuth y verifica la existencia del usuario en la DB con los datos correctos."
- status: "completado"
### id: "R0.WP2-T02-ST2"
- description: "Implementar la generación de JWT (access y refresh tokens) con roles (editor, admin) y el endpoint /auth/refresh."
- complejidad: 4
- entregable: "Colección Postman que demuestra que el login devuelve tokens y que /auth/refresh emite un nuevo access token válido."
- status: "completado"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:32:03 UTC*
*Validador: task-data-parser.sh v1.0*
