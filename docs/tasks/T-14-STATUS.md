---
task_id: "T-14"
titulo: "Observability & Dashboards + KPIs"
estado: "Pendiente"
dependencias: "T-01"
prioridad: "Alta"
release_target: "Release 5"
complejidad: 13
descripcion: "Implementar una solución de observabilidad completa para monitorizar la salud, el rendimiento y el uso del sistema. Esto incluye la recolección de trazas, métricas y logs, y su visualización en dashboards."

# Technical Details
detalles_tecnicos: |
  **Estándar:** OpenTelemetry (OTel) para la instrumentación.
  **Stack:** Prometheus para métricas, Grafana para dashboards, y un colector OTel (como Jaeger o Grafana Tempo) para trazas.
  **KPIs:** TMG, ratio de éxito de ingesta, reutilización de plantillas, etc.

# Test Strategy
estrategia_test: |
  **Integration Tests:** Verificar que las métricas y trazas personalizadas se exportan y son visibles en Grafana/Jaeger.

# Documentation
documentacion: |
  Documentar las métricas personalizadas que se exponen.
  Exportar la configuración de los dashboards de Grafana como JSON.

# Acceptance Criteria
criterios_aceptacion: |
  El 99% de los spans de una transacción están instrumentados y son visibles en el sistema de trazas.
  Un panel de Grafana muestra los KPIs clave (TMG, doc_count/month, etc.) con un lag de datos < 60 segundos.
  Se han configurado alertas para los umbrales de cada KPI.

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  Todos los tests de integración pasan.
  Documentación y dashboards exportados completados.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R5.WP1-T14-ST1"
    description: "Instrumentar el código de backend y frontend con OpenTelemetry (OTel) para generar trazas y métricas."
    complejidad: 5
    entregable: "Trazas de una petición E2E (frontend -> backend -> DB) son visibles en un colector OTel (ej. Jaeger)."
    status: "pendiente"
  - id: "R5.WP1-T14-ST2"
    description: "Configurar Prometheus para recolectar métricas y Grafana para la visualización."
    complejidad: 4
    entregable: "Una métrica custom (ej. documents_created_total) es visible y se actualiza en un dashboard de Grafana."
    status: "pendiente"
  - id: "R5.WP1-T14-ST3"
    description: "Crear los dashboards de Grafana con los KPIs definidos (TMG, ratio de éxito, etc.) y configurar las alertas."
    complejidad: 4
    entregable: "Screenshots de los dashboards de Grafana mostrando los KPIs. Una regla de alerta configurada para el KPI TMG."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:36:37Z"
  checksum: "378f72004669bc230a17d4329d9a3ac00ca0b6f58e96550af6a4bf6ed089f727"
  version: "1758753397"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-14: Observability & Dashboards + KPIs

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Alta
**Release Target:** Release 5
**Complejidad Total:** 13

## Descripción
Implementar una solución de observabilidad completa para monitorizar la salud, el rendimiento y el uso del sistema. Esto incluye la recolección de trazas, métricas y logs, y su visualización en dashboards.

## Detalles Técnicos
**Estándar:** OpenTelemetry (OTel) para la instrumentación.
**Stack:** Prometheus para métricas, Grafana para dashboards, y un colector OTel (como Jaeger o Grafana Tempo) para trazas.
**KPIs:** TMG, ratio de éxito de ingesta, reutilización de plantillas, etc.

## Estrategia de Test
**Integration Tests:** Verificar que las métricas y trazas personalizadas se exportan y son visibles en Grafana/Jaeger.

## Documentación Requerida
Documentar las métricas personalizadas que se exponen.
Exportar la configuración de los dashboards de Grafana como JSON.

## Criterios de Aceptación
El 99% de los spans de una transacción están instrumentados y son visibles en el sistema de trazas.
Un panel de Grafana muestra los KPIs clave (TMG, doc_count/month, etc.) con un lag de datos < 60 segundos.
Se han configurado alertas para los umbrales de cada KPI.

## Definición de Hecho (DoD)
Código revisado y aprobado.
Todos los tests de integración pasan.
Documentación y dashboards exportados completados.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R5.WP1-T14-ST1"
- description: "Instrumentar el código de backend y frontend con OpenTelemetry (OTel) para generar trazas y métricas."
- complejidad: 5
- entregable: "Trazas de una petición E2E (frontend -> backend -> DB) son visibles en un colector OTel (ej. Jaeger)."
- status: "pendiente"
### id: "R5.WP1-T14-ST2"
- description: "Configurar Prometheus para recolectar métricas y Grafana para la visualización."
- complejidad: 4
- entregable: "Una métrica custom (ej. documents_created_total) es visible y se actualiza en un dashboard de Grafana."
- status: "pendiente"
### id: "R5.WP1-T14-ST3"
- description: "Crear los dashboards de Grafana con los KPIs definidos (TMG, ratio de éxito, etc.) y configurar las alertas."
- complejidad: 4
- entregable: "Screenshots de los dashboards de Grafana mostrando los KPIs. Una regla de alerta configurada para el KPI TMG."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:36:38 UTC*
*Validador: task-data-parser.sh v1.0*
