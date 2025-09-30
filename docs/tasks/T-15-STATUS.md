---
task_id: "T-15"
titulo: "Backup & Storage Ops"
estado: "Pendiente"
dependencias: "T-01"
prioridad: "Crítica"
release_target: "Release 5"
complejidad: 10
descripcion: "Establecer y automatizar las operaciones de respaldo y restauración para garantizar la durabilidad de los datos y la resiliencia del sistema. Incluye la gestión de políticas de retención y alertas de almacenamiento."

# Technical Details
detalles_tecnicos: |
  **Scripts:** Scripts de shell/Python para pg_dump (o similar) y backup del vector-store.
  **Almacenamiento:** Solución de almacenamiento de objetos compatible con S3 para los backups.
  **Cifrado:** GPG o similar para cifrar los archivos de backup.
  **Automatización:** Cron jobs o jobs de CI/CD programados.

# Test Strategy
estrategia_test: |
  **Integration Tests:** El job de CI/CD restore --verify (T-29) es el principal test de integración para esta tarea.
  **E2E Tests:** Simular un escenario de desastre y medir el tiempo de recuperación manual usando los scripts.

# Documentation
documentacion: |
  Documento de runbook para el proceso de backup y restauración manual.

# Acceptance Criteria
criterios_aceptacion: |
  Un job de CI/CD semanal ejecuta restore --verify y comprueba el hash del backup restaurado contra el original.
  Una alerta se dispara cuando el uso del almacenamiento de backups supera el 80% de la cuota.
  Los backups con más de 30 días de antigüedad son purgados automáticamente por un script de retención.

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  El job de restore --verify pasa consistentemente.
  Documentación (runbook) completada.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R5.WP2-T15-ST1"
    description: "Crear y programar el script de backup diario encriptado de la base de datos y el vector-store."
    complejidad: 4
    entregable: "Job de CI/CD que se ejecuta diariamente y produce un fichero de backup encriptado en un storage seguro."
    status: "pendiente"
  - id: "R5.WP2-T15-ST2"
    description: "Desarrollar el script de restauración que toma un backup y restaura el estado del sistema en un entorno temporal."
    complejidad: 4
    entregable: "El script restaura una base de datos en un entorno de staging y un test de sanidad pasa correctamente."
    status: "pendiente"
  - id: "R5.WP2-T15-ST3"
    description: "Implementar la política de retención de 30 días y la alerta de cuota al 80%."
    complejidad: 2
    entregable: "Script que purga backups con más de 30 días. Una alerta se dispara cuando el uso del disco supera el 80%."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:36:41Z"
  checksum: "61e5dc41b426335cf5d2405899245b7a3d9e6a6004d090f8dbfd8b707a71eb89"
  version: "1758753401"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-15: Backup & Storage Ops

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Crítica
**Release Target:** Release 5
**Complejidad Total:** 10

## Descripción
Establecer y automatizar las operaciones de respaldo y restauración para garantizar la durabilidad de los datos y la resiliencia del sistema. Incluye la gestión de políticas de retención y alertas de almacenamiento.

## Detalles Técnicos
**Scripts:** Scripts de shell/Python para pg_dump (o similar) y backup del vector-store.
**Almacenamiento:** Solución de almacenamiento de objetos compatible con S3 para los backups.
**Cifrado:** GPG o similar para cifrar los archivos de backup.
**Automatización:** Cron jobs o jobs de CI/CD programados.

## Estrategia de Test
**Integration Tests:** El job de CI/CD restore --verify (T-29) es el principal test de integración para esta tarea.
**E2E Tests:** Simular un escenario de desastre y medir el tiempo de recuperación manual usando los scripts.

## Documentación Requerida
Documento de runbook para el proceso de backup y restauración manual.

## Criterios de Aceptación
Un job de CI/CD semanal ejecuta restore --verify y comprueba el hash del backup restaurado contra el original.
Una alerta se dispara cuando el uso del almacenamiento de backups supera el 80% de la cuota.
Los backups con más de 30 días de antigüedad son purgados automáticamente por un script de retención.

## Definición de Hecho (DoD)
Código revisado y aprobado.
El job de restore --verify pasa consistentemente.
Documentación (runbook) completada.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R5.WP2-T15-ST1"
- description: "Crear y programar el script de backup diario encriptado de la base de datos y el vector-store."
- complejidad: 4
- entregable: "Job de CI/CD que se ejecuta diariamente y produce un fichero de backup encriptado en un storage seguro."
- status: "pendiente"
### id: "R5.WP2-T15-ST2"
- description: "Desarrollar el script de restauración que toma un backup y restaura el estado del sistema en un entorno temporal."
- complejidad: 4
- entregable: "El script restaura una base de datos en un entorno de staging y un test de sanidad pasa correctamente."
- status: "pendiente"
### id: "R5.WP2-T15-ST3"
- description: "Implementar la política de retención de 30 días y la alerta de cuota al 80%."
- complejidad: 2
- entregable: "Script que purga backups con más de 30 días. Una alerta se dispara cuando el uso del disco supera el 80%."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:36:41 UTC*
*Validador: task-data-parser.sh v1.0*
