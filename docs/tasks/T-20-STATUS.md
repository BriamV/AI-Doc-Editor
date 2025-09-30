---
task_id: "T-20"
titulo: "Bench E2E Performance"
estado: "Pendiente"
dependencias: "T-08, T-10"
prioridad: "Alta"
release_target: "Release 6"
complejidad: 12
descripcion: "Crear y ejecutar una suite de benchmarks de rendimiento End-to-End (E2E) que simule el ciclo de vida completo de un documento bajo una carga de usuarios realista."

# Technical Details
detalles_tecnicos: |
  **Herramientas:** JMeter para la ingesta masiva, Locust para la simulación de usuarios interactivos.
  **Escenario:** 1. Ingesta de 100 documentos. 2. 10 usuarios concurrentes realizan acciones de generación, edición y exportación sobre esos documentos.

# Test Strategy
estrategia_test: |
  Esta tarea es en sí misma una tarea de testing.

# Documentation
documentacion: |
  Documentar los scripts de benchmark y cómo ejecutarlos.
  Generar un reporte final de rendimiento con los resultados.

# Acceptance Criteria
criterios_aceptacion: |
  El p95 del tiempo total para el flujo (generación + edición + exportación) es ≤ 6 minutos.
  El p95 del tiempo para completar un borrador (draft_complete_p95) es ≤ 8 minutos.
  Las pruebas están automatizadas y se ejecutan en un job de CI.

# Definition of Done
definicion_hecho: |
  Scripts de benchmark revisados y aprobados.
  Reportes de JMeter y Locust generados y analizados.
  El job de CI está configurado.
  **Acta de Certificación del Ciclo de KPI de Rendimiento (según plantilla de T-17) firmada por el Tech Lead.**
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R6.WP3-T20-ST1"
    description: "Desarrollar el script de JMeter que simula el flujo de ingesta masiva de 100 documentos."
    complejidad: 4
    entregable: "Reporte de JMeter mostrando los tiempos de subida de los 100 documentos."
    status: "pendiente"
  - id: "R6.WP3-T20-ST2"
    description: "Desarrollar el script de Locust que simula a 10 usuarios concurrentes realizando acciones de generación, edición y exportación."
    complejidad: 5
    entregable: "Reporte de Locust mostrando las métricas de latencia p95 para las acciones bajo carga."
    status: "pendiente"
  - id: "R6.WP3-T20-ST3"
    description: "Integrar la ejecución de estos scripts en un job de CI (manual o nocturno) que falle si se degradan las métricas clave."
    complejidad: 3
    entregable: "Configuración del job de CI. Un log de ejecución que muestra un resultado "pass" o "fail" basado en los umbrales de rendimiento."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:37:02Z"
  checksum: "d57e5987591388902d981b6ba59644fdc74b4dd00c8ef39f1c5dc2c46d0702b7"
  version: "1758753421"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-20: Bench E2E Performance

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Alta
**Release Target:** Release 6
**Complejidad Total:** 12

## Descripción
Crear y ejecutar una suite de benchmarks de rendimiento End-to-End (E2E) que simule el ciclo de vida completo de un documento bajo una carga de usuarios realista.

## Detalles Técnicos
**Herramientas:** JMeter para la ingesta masiva, Locust para la simulación de usuarios interactivos.
**Escenario:** 1. Ingesta de 100 documentos. 2. 10 usuarios concurrentes realizan acciones de generación, edición y exportación sobre esos documentos.

## Estrategia de Test
Esta tarea es en sí misma una tarea de testing.

## Documentación Requerida
Documentar los scripts de benchmark y cómo ejecutarlos.
Generar un reporte final de rendimiento con los resultados.

## Criterios de Aceptación
El p95 del tiempo total para el flujo (generación + edición + exportación) es ≤ 6 minutos.
El p95 del tiempo para completar un borrador (draft_complete_p95) es ≤ 8 minutos.
Las pruebas están automatizadas y se ejecutan en un job de CI.

## Definición de Hecho (DoD)
Scripts de benchmark revisados y aprobados.
Reportes de JMeter y Locust generados y analizados.
El job de CI está configurado.
**Acta de Certificación del Ciclo de KPI de Rendimiento (según plantilla de T-17) firmada por el Tech Lead.**
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R6.WP3-T20-ST1"
- description: "Desarrollar el script de JMeter que simula el flujo de ingesta masiva de 100 documentos."
- complejidad: 4
- entregable: "Reporte de JMeter mostrando los tiempos de subida de los 100 documentos."
- status: "pendiente"
### id: "R6.WP3-T20-ST2"
- description: "Desarrollar el script de Locust que simula a 10 usuarios concurrentes realizando acciones de generación, edición y exportación."
- complejidad: 5
- entregable: "Reporte de Locust mostrando las métricas de latencia p95 para las acciones bajo carga."
- status: "pendiente"
### id: "R6.WP3-T20-ST3"
- description: "Integrar la ejecución de estos scripts en un job de CI (manual o nocturno) que falle si se degradan las métricas clave."
- complejidad: 3
- entregable: "Configuración del job de CI. Un log de ejecución que muestra un resultado "pass" o "fail" basado en los umbrales de rendimiento."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:37:02 UTC*
*Validador: task-data-parser.sh v1.0*
