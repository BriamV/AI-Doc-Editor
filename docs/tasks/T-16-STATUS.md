---
task_id: "T-16"
titulo: "Deployment & Scaling (PoC)"
estado: "Pendiente"
dependencias: "T-01"
prioridad: "Alta"
release_target: "Release 6"
complejidad: 12
descripcion: "Realizar una Prueba de Concepto (PoC) para validar la estrategia de despliegue y escalado de la aplicación en un entorno orquestado como Kubernetes. El objetivo es demostrar la capacidad de auto-escalado y la viabilidad del sharding del vector-store."

# Technical Details
detalles_tecnicos: |
  **Orquestación:** Kubernetes (Minikube o similar para el PoC).
  **Manifiestos:** YAML para Deployments, Services, HPA (Horizontal Pod Autoscaler).
  **Vector Store Sharding:** PoC con Qdrant o Chroma en modo clúster.
  **Test de Carga:** Locust para generar carga y disparar el auto-escalado.

# Test Strategy
estrategia_test: |
  **Performance Tests:** Ejecutar el test de carga y observar las métricas de HPA y el número de pods.
  **Chaos Tests:** Simular la caída de un pod de la aplicación y medir el tiempo de recuperación (MTTR).

# Documentation
documentacion: |
  ADR con los resultados del PoC, incluyendo métricas de rendimiento y lecciones aprendidas.

# Acceptance Criteria
criterios_aceptacion: |
  Un test de carga con 10 usuarios y 100 documentos dispara el escalado de la aplicación a ≥ 3 réplicas.
  El PoC demuestra la distribución de datos y consultas a través de ≥ 2 shards del vector-store.
  El tiempo medio de recuperación (MTTR) ante el fallo de un pod de la aplicación es ≤ 2 horas (en el PoC).

# Definition of Done
definicion_hecho: |
  Código (manifiestos, scripts) revisado y aprobado.
  Todos los tests (performance, chaos) del PoC completados y sus resultados documentados.
  Documentación (ADR) completada.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R4.WP3-T16-ST1"
    description: "Crear manifiestos de Kubernetes (Deployment, Service, HPA) para los servicios de aplicación."
    complejidad: 4
    entregable: "kubectl apply -f . despliega la aplicación en un clúster de k8s. El HPA está configurado para escalar basado en CPU/memoria."
    status: "pendiente"
  - id: "R4.WP3-T16-ST2"
    description: "Realizar un PoC de sharding para el vector-store (Qdrant/Chroma), documentando la configuración y el método de distribución."
    complejidad: 5
    entregable: "Documento ADR y un script que demuestra que las consultas se distribuyen entre al menos dos shards del vector-store."
    status: "pendiente"
  - id: "R4.WP3-T16-ST3"
    description: "Ejecutar un test de carga (Locust) que demuestre que el HPA escala las réplicas de la aplicación cuando se supera el umbral de carga."
    complejidad: 3
    entregable: "Métricas de Grafana/Prometheus que muestran el aumento del número de pods durante el test de carga."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:36:51Z"
  checksum: "f8f33c60d4611729ae4ca994e9cc8102d63abff690ef098e96db9874eee55b35"
  version: "1758753411"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-16: Deployment & Scaling (PoC)

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Alta
**Release Target:** Release 6
**Complejidad Total:** 12

## Descripción
Realizar una Prueba de Concepto (PoC) para validar la estrategia de despliegue y escalado de la aplicación en un entorno orquestado como Kubernetes. El objetivo es demostrar la capacidad de auto-escalado y la viabilidad del sharding del vector-store.

## Detalles Técnicos
**Orquestación:** Kubernetes (Minikube o similar para el PoC).
**Manifiestos:** YAML para Deployments, Services, HPA (Horizontal Pod Autoscaler).
**Vector Store Sharding:** PoC con Qdrant o Chroma en modo clúster.
**Test de Carga:** Locust para generar carga y disparar el auto-escalado.

## Estrategia de Test
**Performance Tests:** Ejecutar el test de carga y observar las métricas de HPA y el número de pods.
**Chaos Tests:** Simular la caída de un pod de la aplicación y medir el tiempo de recuperación (MTTR).

## Documentación Requerida
ADR con los resultados del PoC, incluyendo métricas de rendimiento y lecciones aprendidas.

## Criterios de Aceptación
Un test de carga con 10 usuarios y 100 documentos dispara el escalado de la aplicación a ≥ 3 réplicas.
El PoC demuestra la distribución de datos y consultas a través de ≥ 2 shards del vector-store.
El tiempo medio de recuperación (MTTR) ante el fallo de un pod de la aplicación es ≤ 2 horas (en el PoC).

## Definición de Hecho (DoD)
Código (manifiestos, scripts) revisado y aprobado.
Todos los tests (performance, chaos) del PoC completados y sus resultados documentados.
Documentación (ADR) completada.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R4.WP3-T16-ST1"
- description: "Crear manifiestos de Kubernetes (Deployment, Service, HPA) para los servicios de aplicación."
- complejidad: 4
- entregable: "kubectl apply -f . despliega la aplicación en un clúster de k8s. El HPA está configurado para escalar basado en CPU/memoria."
- status: "pendiente"
### id: "R4.WP3-T16-ST2"
- description: "Realizar un PoC de sharding para el vector-store (Qdrant/Chroma), documentando la configuración y el método de distribución."
- complejidad: 5
- entregable: "Documento ADR y un script que demuestra que las consultas se distribuyen entre al menos dos shards del vector-store."
- status: "pendiente"
### id: "R4.WP3-T16-ST3"
- description: "Ejecutar un test de carga (Locust) que demuestre que el HPA escala las réplicas de la aplicación cuando se supera el umbral de carga."
- complejidad: 3
- entregable: "Métricas de Grafana/Prometheus que muestran el aumento del número de pods durante el test de carga."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:36:52 UTC*
*Validador: task-data-parser.sh v1.0*
