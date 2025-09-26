---
task_id: "T-36"
titulo: "GDPR Erase Purge Job"
estado: "Pendiente"
dependencias: "T-35, T-15"
prioridad: "Crítica"
release_target: "Release 6"
complejidad: 17
descripcion: "Crear un job automatizado que purga de forma irreversible los datos de los documentos que han sido marcados para borrado definitivo (T-35) o cuyo período de retención en la papelera (T-22) ha expirado. **Nota de Riesgo Crítico:** Esta tarea es de alto impacto y requiere una validación exhaustiva. **Nota de Gestión de Riesgo:** La implementación y revisión de esta tarea debe ser asignada a personal senior. El plan de pruebas para la purga de backups (ST3) debe ser aprobado explícitamente por el Tech Lead."

# Technical Details
detalles_tecnicos: |
  **Automatización:** Cron job diario.
  **Lógica:** El job debe eliminar los datos del documento de todas las ubicaciones: base de datos principal, tabla de versiones, vector-store, almacenamiento de archivos y backups.

# Test Strategy
estrategia_test: |
  **E2E Tests:** Probar el ciclo de vida completo del borrado: crear doc -> borrar lógicamente -> esperar/forzar expiración -> ejecutar job de purga -> verificar que los datos han sido eliminados de todos los sistemas.

# Documentation
documentacion: |
  Documentar el proceso de purga y las ubicaciones de datos que afecta.

# Acceptance Criteria
criterios_aceptacion: |
  El cron job diario se ejecuta sin errores.
  Los datos de las solicitudes de borrado con más de 30 días (o marcados para borrado inmediato) son purgados de forma irrevocable.
  Un test E2E valida el ciclo de vida completo del borrado.

# Definition of Done
definicion_hecho: |
  Código (job) revisado y aprobado.
  El test E2E del ciclo de vida del borrado pasa.
  El proceso ha sido validado desde una perspectiva de compliance.
  **Acta de Certificación del Ciclo de Borrado (según plantilla de T-17) firmada por el Tech Lead.**
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R6.WP1-T36-ST1"
    description: "Implementar el cron job diario (purge_erase_requests) que identifica los documentos a purgar."
    complejidad: 4
    entregable: "El job se ejecuta y genera una lista de los IDs de documentos a eliminar."
    status: "pendiente"
  - id: "R6.WP1-T36-ST2"
    description: "Implementar la lógica de purga de sistemas en vivo (Base de Datos, Vector-Store, Almacenamiento de Archivos)."
    complejidad: 4
    entregable: "Test de integración que verifica que, tras ejecutar la purga, los datos del documento ya no existen en los sistemas en vivo."
    status: "pendiente"
  - id: "R6.WP1-T36-ST3"
    description: "(Alto Riesgo) Diseñar e implementar script de purga de datos específicos de los backups encriptados. **Nota de Riesgo:** Esta es la subtarea de mayor riesgo del proyecto. Su implementación debe ser extremadamente cuidadosa y su plan de pruebas, riguroso y formalmente aprobado."
    complejidad: 6
    entregable: "Test que valida que un documento purgado no puede ser restaurado desde un backup posterior a la purga."
    status: "pendiente"
  - id: "R6.WP1-T36-ST4"
    description: "Validar el ciclo de vida de borrado E2E (T-22 -> T-35 -> T-36) en un entorno de pruebas."
    complejidad: 3
    entregable: "Reporte de test E2E que confirma que el ciclo completo de borrado funciona como se espera."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:37:57Z"
  checksum: "a0472e5e3fa50941b199cb47307a4dc899c63dc99be071de609866c58d5d4ad8"
  version: "1758753477"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-36: GDPR Erase Purge Job

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Crítica
**Release Target:** Release 6
**Complejidad Total:** 17

## Descripción
Crear un job automatizado que purga de forma irreversible los datos de los documentos que han sido marcados para borrado definitivo (T-35) o cuyo período de retención en la papelera (T-22) ha expirado. **Nota de Riesgo Crítico:** Esta tarea es de alto impacto y requiere una validación exhaustiva. **Nota de Gestión de Riesgo:** La implementación y revisión de esta tarea debe ser asignada a personal senior. El plan de pruebas para la purga de backups (ST3) debe ser aprobado explícitamente por el Tech Lead.

## Detalles Técnicos
**Automatización:** Cron job diario.
**Lógica:** El job debe eliminar los datos del documento de todas las ubicaciones: base de datos principal, tabla de versiones, vector-store, almacenamiento de archivos y backups.

## Estrategia de Test
**E2E Tests:** Probar el ciclo de vida completo del borrado: crear doc -> borrar lógicamente -> esperar/forzar expiración -> ejecutar job de purga -> verificar que los datos han sido eliminados de todos los sistemas.

## Documentación Requerida
Documentar el proceso de purga y las ubicaciones de datos que afecta.

## Criterios de Aceptación
El cron job diario se ejecuta sin errores.
Los datos de las solicitudes de borrado con más de 30 días (o marcados para borrado inmediato) son purgados de forma irrevocable.
Un test E2E valida el ciclo de vida completo del borrado.

## Definición de Hecho (DoD)
Código (job) revisado y aprobado.
El test E2E del ciclo de vida del borrado pasa.
El proceso ha sido validado desde una perspectiva de compliance.
**Acta de Certificación del Ciclo de Borrado (según plantilla de T-17) firmada por el Tech Lead.**
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R6.WP1-T36-ST1"
- description: "Implementar el cron job diario (purge_erase_requests) que identifica los documentos a purgar."
- complejidad: 4
- entregable: "El job se ejecuta y genera una lista de los IDs de documentos a eliminar."
- status: "pendiente"
### id: "R6.WP1-T36-ST2"
- description: "Implementar la lógica de purga de sistemas en vivo (Base de Datos, Vector-Store, Almacenamiento de Archivos)."
- complejidad: 4
- entregable: "Test de integración que verifica que, tras ejecutar la purga, los datos del documento ya no existen en los sistemas en vivo."
- status: "pendiente"
### id: "R6.WP1-T36-ST3"
- description: "(Alto Riesgo) Diseñar e implementar script de purga de datos específicos de los backups encriptados. **Nota de Riesgo:** Esta es la subtarea de mayor riesgo del proyecto. Su implementación debe ser extremadamente cuidadosa y su plan de pruebas, riguroso y formalmente aprobado."
- complejidad: 6
- entregable: "Test que valida que un documento purgado no puede ser restaurado desde un backup posterior a la purga."
- status: "pendiente"
### id: "R6.WP1-T36-ST4"
- description: "Validar el ciclo de vida de borrado E2E (T-22 -> T-35 -> T-36) en un entorno de pruebas."
- complejidad: 3
- entregable: "Reporte de test E2E que confirma que el ciclo completo de borrado funciona como se espera."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:37:57 UTC*
*Validador: task-data-parser.sh v1.0*
