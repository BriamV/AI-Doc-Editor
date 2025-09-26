---
task_id: "T-27"
titulo: "Uptime Monitoring"
estado: "Pendiente"
dependencias: "T-14"
prioridad: "Alta"
release_target: "Release 6"
complejidad: 7
descripcion: "Configurar un sistema de monitorización externo para medir el uptime del servicio y alertar en caso de caída, cumpliendo con los SLAs de disponibilidad."

# Technical Details
detalles_tecnicos: |
  **Herramientas:** Sonda de Prometheus (Blackbox Exporter) para verificar el endpoint /healthz de T-23.
  **Visualización:** Dashboard en Grafana para el uptime.
  **Alertas:** Alertmanager para enviar notificaciones.

# Test Strategy
estrategia_test: |
  **Integration Tests:** Simular una caída del servicio y verificar que se recibe una alerta en el canal configurado (ej. Slack, email).

# Documentation
documentacion: |
  Documentar el dashboard de uptime y las reglas de alerta.

# Acceptance Criteria
criterios_aceptacion: |
  Un informe mensual de Grafana muestra un uptime ≥ 99%.
  Una incidencia que causa una caída del servicio es reportada (MTTR) en ≤ 2 horas.

# Definition of Done
definicion_hecho: |
  Configuración revisada y aprobada.
  El test de alerta funciona correctamente.
  El dashboard de uptime está funcional.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R6.WP1-T27-ST1"
    description: "Configurar una sonda de Prometheus (ej. Blackbox Exporter) para verificar la disponibilidad del endpoint /healthz."
    complejidad: 3
    entregable: "Métrica probe_success es visible en Prometheus."
    status: "pendiente"
  - id: "R6.WP1-T27-ST2"
    description: "Crear un dashboard en Grafana para visualizar el uptime histórico y el estado actual."
    complejidad: 2
    entregable: "Screenshot del dashboard de uptime."
    status: "pendiente"
  - id: "R6.WP1-T27-ST3"
    description: "Configurar alertas en Alertmanager para notificar (ej. por Slack/email) si el servicio está caído por más de X minutos."
    complejidad: 2
    entregable: "Regla de alerta configurada. Test que simula una caída y verifica que se recibe una notificación."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:37:25Z"
  checksum: "dfbd48c0e47683860cfc3d668ffba7f90b15b498f9e66a8db433e0a2737da1c3"
  version: "1758753445"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-27: Uptime Monitoring

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Alta
**Release Target:** Release 6
**Complejidad Total:** 7

## Descripción
Configurar un sistema de monitorización externo para medir el uptime del servicio y alertar en caso de caída, cumpliendo con los SLAs de disponibilidad.

## Detalles Técnicos
**Herramientas:** Sonda de Prometheus (Blackbox Exporter) para verificar el endpoint /healthz de T-23.
**Visualización:** Dashboard en Grafana para el uptime.
**Alertas:** Alertmanager para enviar notificaciones.

## Estrategia de Test
**Integration Tests:** Simular una caída del servicio y verificar que se recibe una alerta en el canal configurado (ej. Slack, email).

## Documentación Requerida
Documentar el dashboard de uptime y las reglas de alerta.

## Criterios de Aceptación
Un informe mensual de Grafana muestra un uptime ≥ 99%.
Una incidencia que causa una caída del servicio es reportada (MTTR) en ≤ 2 horas.

## Definición de Hecho (DoD)
Configuración revisada y aprobada.
El test de alerta funciona correctamente.
El dashboard de uptime está funcional.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R6.WP1-T27-ST1"
- description: "Configurar una sonda de Prometheus (ej. Blackbox Exporter) para verificar la disponibilidad del endpoint /healthz."
- complejidad: 3
- entregable: "Métrica probe_success es visible en Prometheus."
- status: "pendiente"
### id: "R6.WP1-T27-ST2"
- description: "Crear un dashboard en Grafana para visualizar el uptime histórico y el estado actual."
- complejidad: 2
- entregable: "Screenshot del dashboard de uptime."
- status: "pendiente"
### id: "R6.WP1-T27-ST3"
- description: "Configurar alertas en Alertmanager para notificar (ej. por Slack/email) si el servicio está caído por más de X minutos."
- complejidad: 2
- entregable: "Regla de alerta configurada. Test que simula una caída y verifica que se recibe una notificación."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:37:26 UTC*
*Validador: task-data-parser.sh v1.0*
