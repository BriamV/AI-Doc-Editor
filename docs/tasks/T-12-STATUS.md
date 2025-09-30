---
task_id: "T-12"
titulo: "Credential Store & Crypto"
estado: "Pendiente"
dependencias: "T-13"
prioridad: "Crítica"
release_target: "Release 0"
complejidad: 14
descripcion: "Implementar las medidas criptográficas fundamentales para proteger los datos de la aplicación, tanto en reposo (at-rest) como en tránsito (in-transit), y establecer un proceso para la rotación automática de credenciales."

# Technical Details
detalles_tecnicos: |
  **Cifrado en Reposo:** AES-256 para datos sensibles en la DB (ej. claves de API de usuario).
  **Cifrado en Tránsito:** Forzar TLS 1.3 en todas las comunicaciones.
  **Rotación de Claves:** Cron job que identifica y fuerza la rotación de claves de API de usuario con más de 90 días.

# Test Strategy
estrategia_test: |
  **Unit Tests:** Para las funciones de cifrado y descifrado.
  **Integration Tests:** Probar el cron job de rotación de claves.
  **Security Tests:** Realizar un pentest básico para verificar la configuración de TLS y que los datos sensibles no se almacenan en texto plano.

# Documentation
documentacion: |
  ADR sobre la estrategia de gestión de secretos.

# Acceptance Criteria
criterios_aceptacion: |
  Una simulación de una clave de 91 días de antigüedad dispara la rotación automática y genera una entrada en el log WORM en ≤ 5 minutos.
  La clave antigua queda invalidada después de la rotación.

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  Todos los tests (unit, integration, security) pasan.
  Documentación (ADR) completada.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R0.WP3-T12-ST1"
    description: "Implementar la encriptación AES-256 para los datos sensibles en reposo (at-rest) en la base de datos."
    complejidad: 5
    entregable: "Test unitario que encripta un dato, lo guarda, lo recupera y lo desencripta, verificando que el valor original se mantiene."
    status: "pendiente"
  - id: "R0.WP3-T12-ST2"
    description: "Configurar el servidor web para forzar TLS 1.3 en todas las comunicaciones (in-transit)."
    complejidad: 3
    entregable: "Reporte de una herramienta como SSL Labs que confirma que el servidor usa TLS 1.3 y tiene una configuración segura."
    status: "pendiente"
  - id: "R0.WP3-T12-ST3"
    description: "Crear el cron job diario que identifica claves API de usuario con más de 90 días de antigüedad."
    complejidad: 3
    entregable: "Script que, al ejecutarse, imprime una lista de las claves que necesitan rotación."
    status: "pendiente"
  - id: "R0.WP3-T12-ST4"
    description: "Implementar la lógica de rotación automática de claves y el registro del evento en el log de auditoría."
    complejidad: 3
    entregable: "Test que simula una clave de 91 días y verifica que se genera una nueva clave y se registra el evento en el log WORM."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:36:29Z"
  checksum: "d6c9d1e63e6cb21daf540c57baecda442290a334c648dc02280c941e964acc9c"
  version: "1758753389"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-12: Credential Store & Crypto

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Crítica
**Release Target:** Release 0
**Complejidad Total:** 14

## Descripción
Implementar las medidas criptográficas fundamentales para proteger los datos de la aplicación, tanto en reposo (at-rest) como en tránsito (in-transit), y establecer un proceso para la rotación automática de credenciales.

## Detalles Técnicos
**Cifrado en Reposo:** AES-256 para datos sensibles en la DB (ej. claves de API de usuario).
**Cifrado en Tránsito:** Forzar TLS 1.3 en todas las comunicaciones.
**Rotación de Claves:** Cron job que identifica y fuerza la rotación de claves de API de usuario con más de 90 días.

## Estrategia de Test
**Unit Tests:** Para las funciones de cifrado y descifrado.
**Integration Tests:** Probar el cron job de rotación de claves.
**Security Tests:** Realizar un pentest básico para verificar la configuración de TLS y que los datos sensibles no se almacenan en texto plano.

## Documentación Requerida
ADR sobre la estrategia de gestión de secretos.

## Criterios de Aceptación
Una simulación de una clave de 91 días de antigüedad dispara la rotación automática y genera una entrada en el log WORM en ≤ 5 minutos.
La clave antigua queda invalidada después de la rotación.

## Definición de Hecho (DoD)
Código revisado y aprobado.
Todos los tests (unit, integration, security) pasan.
Documentación (ADR) completada.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R0.WP3-T12-ST1"
- description: "Implementar la encriptación AES-256 para los datos sensibles en reposo (at-rest) en la base de datos."
- complejidad: 5
- entregable: "Test unitario que encripta un dato, lo guarda, lo recupera y lo desencripta, verificando que el valor original se mantiene."
- status: "pendiente"
### id: "R0.WP3-T12-ST2"
- description: "Configurar el servidor web para forzar TLS 1.3 en todas las comunicaciones (in-transit)."
- complejidad: 3
- entregable: "Reporte de una herramienta como SSL Labs que confirma que el servidor usa TLS 1.3 y tiene una configuración segura."
- status: "pendiente"
### id: "R0.WP3-T12-ST3"
- description: "Crear el cron job diario que identifica claves API de usuario con más de 90 días de antigüedad."
- complejidad: 3
- entregable: "Script que, al ejecutarse, imprime una lista de las claves que necesitan rotación."
- status: "pendiente"
### id: "R0.WP3-T12-ST4"
- description: "Implementar la lógica de rotación automática de claves y el registro del evento en el log de auditoría."
- complejidad: 3
- entregable: "Test que simula una clave de 91 días y verifica que se genera una nueva clave y se registra el evento en el log WORM."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:36:30 UTC*
*Validador: task-data-parser.sh v1.0*
