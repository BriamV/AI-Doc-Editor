---
task_id: "T-23"
titulo: "Health-check API"
estado: "Completado"
dependencias: "T-01"
prioridad: "Crítica"
release_target: "Release 0"
complejidad: 5
descripcion: "Exponer un endpoint de health-check que verifique el estado de la aplicación y sus dependencias críticas (base de datos, vector-store, API de OpenAI)."

# Technical Details
detalles_tecnicos: |
  **Endpoint:** GET /healthz.
  **Respuesta:** JSON con un estado general (ok o degraded) y el estado de cada dependencia.

# Test Strategy
estrategia_test: |
  **Integration Tests:** Probar el endpoint en diferentes escenarios (todo funcionando, una dependencia caída) y verificar la respuesta.

# Documentation
documentacion: |
  Actualizar OpenAPI para el endpoint /healthz.

# Acceptance Criteria
criterios_aceptacion: |
  El endpoint responde con HTTP 200 y un p95 de latencia < 200 ms.
  El endpoint retorna un estado degraded si alguna de sus dependencias clave falla.

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  Todos los tests de integración pasan.
  Documentación de API completada.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R0.WP1-T23-ST1"
    description: "Implementar el endpoint /healthz que devuelve un estado básico "ok"."
    complejidad: 2
    entregable: "Endpoint /healthz responde con HTTP 200 y {"status": "ok"}."
    status: "pendiente"
  - id: "R0.WP1-T23-ST2"
    description: "Añadir las verificaciones de conectividad a la base de datos, vector-store y API de OpenAI."
    complejidad: 3
    entregable: "Test de integración que simula una caída de la DB y verifica que /healthz responde con {"status": "degraded"}."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:37:11Z"
  checksum: "c857d80dd9647cbb12572f9d4d5d1664df51242b0a93619c8087e5ff232dee9e"
  version: "1758753431"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-23: Health-check API

## Estado Actual
**Estado:** Completado
**Prioridad:** Crítica
**Release Target:** Release 0
**Complejidad Total:** 5

## Descripción
Exponer un endpoint de health-check que verifique el estado de la aplicación y sus dependencias críticas (base de datos, vector-store, API de OpenAI).

## Detalles Técnicos
**Endpoint:** GET /healthz.
**Respuesta:** JSON con un estado general (ok o degraded) y el estado de cada dependencia.

## Estrategia de Test
**Integration Tests:** Probar el endpoint en diferentes escenarios (todo funcionando, una dependencia caída) y verificar la respuesta.

## Documentación Requerida
Actualizar OpenAPI para el endpoint /healthz.

## Criterios de Aceptación
El endpoint responde con HTTP 200 y un p95 de latencia < 200 ms.
El endpoint retorna un estado degraded si alguna de sus dependencias clave falla.

## Definición de Hecho (DoD)
Código revisado y aprobado.
Todos los tests de integración pasan.
Documentación de API completada.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R0.WP1-T23-ST1"
- description: "Implementar el endpoint /healthz que devuelve un estado básico "ok"."
- complejidad: 2
- entregable: "Endpoint /healthz responde con HTTP 200 y {"status": "ok"}."
- status: "pendiente"
### id: "R0.WP1-T23-ST2"
- description: "Añadir las verificaciones de conectividad a la base de datos, vector-store y API de OpenAI."
- complejidad: 3
- entregable: "Test de integración que simula una caída de la DB y verifica que /healthz responde con {"status": "degraded"}."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:37:11 UTC*
*Validador: task-data-parser.sh v1.0*
