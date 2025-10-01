---
task_id: "T-29"
titulo: "Restore-Verifier"
estado: "Pendiente"
dependencias: "T-15"
prioridad: "Alta"
release_target: "Release 6"
complejidad: 7
descripcion: "Crear un job automatizado que verifique periódicamente la integridad y la viabilidad de los backups. Este proceso simula una restauración y valida los datos para garantizar que los backups son fiables."

# Technical Details
detalles_tecnicos: |
  **Automatización:** Job de CI/CD (ej. GitHub Actions) programado para ejecutarse semanalmente.
  **Script:** Script restore --verify que utiliza el script de restauración de T-15 en un entorno temporal y aislado.
  **Validación:** Comparación de checksums (hashes) de los datos clave (ej. una selección de registros de la DB) antes del backup y después de la restauración.

# Test Strategy
estrategia_test: |
  Esta tarea es en sí misma un test automatizado de la tarea T-15.

# Documentation
documentacion: |
  Documentar el proceso de verificación en el runbook de operaciones de T-15.

# Acceptance Criteria
criterios_aceptacion: |
  El job se ejecuta semanalmente de forma programada.
  El hash de los datos restaurados se compara con el hash de los datos originales; una divergencia dispara una alerta crítica (email/Slack) al equipo de operaciones.

# Definition of Done
definicion_hecho: |
  Código (script, config CI) revisado y aprobado.
  El job de CI se ejecuta correctamente y es capaz de detectar una divergencia en un escenario de prueba.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R6.WP1-T29-ST1"
    description: "Desarrollar la lógica del script restore --verify que orquesta la restauración en un entorno temporal."
    complejidad: 4
    entregable: "El script se ejecuta sin errores en un entorno de CI, restaurando el último backup disponible."
    status: "pendiente"
  - id: "R6.WP1-T29-ST2"
    description: "Implementar la lógica de validación de checksum del contenido restaurado contra una fuente de verdad (hashes pre-calculados)."
    complejidad: 3
    entregable: "El script compara los hashes y devuelve un código de salida 0 si coinciden, y 1 si no, disparando una alerta."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:37:31Z"
  checksum: "f3b2c71dc781cd6733b8c0fd146e1ced70d703674ffbc6337b2d40a56c57176b"
  version: "1758753451"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-29: Restore-Verifier

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Alta
**Release Target:** Release 6
**Complejidad Total:** 7

## Descripción
Crear un job automatizado que verifique periódicamente la integridad y la viabilidad de los backups. Este proceso simula una restauración y valida los datos para garantizar que los backups son fiables.

## Detalles Técnicos
**Automatización:** Job de CI/CD (ej. GitHub Actions) programado para ejecutarse semanalmente.
**Script:** Script restore --verify que utiliza el script de restauración de T-15 en un entorno temporal y aislado.
**Validación:** Comparación de checksums (hashes) de los datos clave (ej. una selección de registros de la DB) antes del backup y después de la restauración.

## Estrategia de Test
Esta tarea es en sí misma un test automatizado de la tarea T-15.

## Documentación Requerida
Documentar el proceso de verificación en el runbook de operaciones de T-15.

## Criterios de Aceptación
El job se ejecuta semanalmente de forma programada.
El hash de los datos restaurados se compara con el hash de los datos originales; una divergencia dispara una alerta crítica (email/Slack) al equipo de operaciones.

## Definición de Hecho (DoD)
Código (script, config CI) revisado y aprobado.
El job de CI se ejecuta correctamente y es capaz de detectar una divergencia en un escenario de prueba.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R6.WP1-T29-ST1"
- description: "Desarrollar la lógica del script restore --verify que orquesta la restauración en un entorno temporal."
- complejidad: 4
- entregable: "El script se ejecuta sin errores en un entorno de CI, restaurando el último backup disponible."
- status: "pendiente"
### id: "R6.WP1-T29-ST2"
- description: "Implementar la lógica de validación de checksum del contenido restaurado contra una fuente de verdad (hashes pre-calculados)."
- complejidad: 3
- entregable: "El script compara los hashes y devuelve un código de salida 0 si coinciden, y 1 si no, disparando una alerta."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:37:32 UTC*
*Validador: task-data-parser.sh v1.0*
