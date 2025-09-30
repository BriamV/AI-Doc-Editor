---
task_id: "T-25"
titulo: "Dashboard Costes & Costo por Documento"
estado: "Pendiente"
dependencias: "T-14"
prioridad: "Alta"
release_target: "Release 5"
complejidad: 12
descripcion: "Extender la solución de observabilidad para incluir la monitorización de costes. El objetivo es calcular y visualizar el coste de la API de IA por documento, por día y por modelo, y alertar sobre desviaciones."

# Technical Details
detalles_tecnicos: |
  **Backend:** Registrar el consumo de tokens por cada llamada a la IA, asociándolo a un documento.
  **Cálculo:** Un servicio o script que traduce el consumo de tokens a coste en USD, usando los precios de la API de OpenAI.
  **Visualización:** Añadir nuevos paneles al dashboard de Grafana de T-14.

# Test Strategy
estrategia_test: |
  **Unit Tests:** Para la lógica de cálculo de costes.
  **Integration Tests:** Verificar que las métricas de coste se exportan correctamente a Prometheus.

# Documentation
documentacion: |
  Documentar cómo se calculan las métricas de coste.

# Acceptance Criteria
criterios_aceptacion: |
  La métrica de coste por documento (USD/doc) se calcula y tiene una desviación < 5% en comparación con la Usage API de OpenAI.
  El dashboard muestra el total de tokens por documento, el coste por día/modelo y el coste por documento.
  Se han configurado alertas para el coste por documento y para desviaciones > 5%.

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  Todos los tests (unit, integration) pasan.
  El dashboard de costes está funcional y validado.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R5.WP1-T25-ST1"
    description: "Instrumentar el código para registrar el número de tokens utilizados por cada llamada a la API de IA, asociándolo al documento."
    complejidad: 5
    entregable: "Tras generar un documento, la DB contiene un registro del total de tokens consumidos para ese documento."
    status: "pendiente"
  - id: "R5.WP1-T25-ST2"
    description: "Crear el servicio o script que calcula el coste en USD basado en los tokens y el modelo utilizado."
    complejidad: 4
    entregable: "Test unitario que, dado un número de tokens y un modelo, calcula el coste en USD correctamente."
    status: "pendiente"
  - id: "R5.WP1-T25-ST3"
    description: "Añadir las nuevas métricas y alertas de coste al dashboard de Grafana."
    complejidad: 3
    entregable: "Screenshot del dashboard de Grafana mostrando el coste por documento y el coste diario."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:37:17Z"
  checksum: "6caca3202cda7998d6bdacce6a5ba79d00944b03ac79b92e8606bc54e0f7d1cf"
  version: "1758753437"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-25: Dashboard Costes & Costo por Documento

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Alta
**Release Target:** Release 5
**Complejidad Total:** 12

## Descripción
Extender la solución de observabilidad para incluir la monitorización de costes. El objetivo es calcular y visualizar el coste de la API de IA por documento, por día y por modelo, y alertar sobre desviaciones.

## Detalles Técnicos
**Backend:** Registrar el consumo de tokens por cada llamada a la IA, asociándolo a un documento.
**Cálculo:** Un servicio o script que traduce el consumo de tokens a coste en USD, usando los precios de la API de OpenAI.
**Visualización:** Añadir nuevos paneles al dashboard de Grafana de T-14.

## Estrategia de Test
**Unit Tests:** Para la lógica de cálculo de costes.
**Integration Tests:** Verificar que las métricas de coste se exportan correctamente a Prometheus.

## Documentación Requerida
Documentar cómo se calculan las métricas de coste.

## Criterios de Aceptación
La métrica de coste por documento (USD/doc) se calcula y tiene una desviación < 5% en comparación con la Usage API de OpenAI.
El dashboard muestra el total de tokens por documento, el coste por día/modelo y el coste por documento.
Se han configurado alertas para el coste por documento y para desviaciones > 5%.

## Definición de Hecho (DoD)
Código revisado y aprobado.
Todos los tests (unit, integration) pasan.
El dashboard de costes está funcional y validado.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R5.WP1-T25-ST1"
- description: "Instrumentar el código para registrar el número de tokens utilizados por cada llamada a la API de IA, asociándolo al documento."
- complejidad: 5
- entregable: "Tras generar un documento, la DB contiene un registro del total de tokens consumidos para ese documento."
- status: "pendiente"
### id: "R5.WP1-T25-ST2"
- description: "Crear el servicio o script que calcula el coste en USD basado en los tokens y el modelo utilizado."
- complejidad: 4
- entregable: "Test unitario que, dado un número de tokens y un modelo, calcula el coste en USD correctamente."
- status: "pendiente"
### id: "R5.WP1-T25-ST3"
- description: "Añadir las nuevas métricas y alertas de coste al dashboard de Grafana."
- complejidad: 3
- entregable: "Screenshot del dashboard de Grafana mostrando el coste por documento y el coste diario."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:37:17 UTC*
*Validador: task-data-parser.sh v1.0*
