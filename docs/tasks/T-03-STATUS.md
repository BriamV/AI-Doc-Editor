---
task_id: "T-03"
titulo: "Límites de Ingesta & Rate"
estado: "Pendiente"
dependencias: "T-44"
prioridad: "Alta"
release_target: "Release 1"
complejidad: 11
descripcion: "Implementar mecanismos de control para prevenir el abuso y garantizar la estabilidad del sistema. Esto incluye limitar la cantidad de datos que un usuario puede ingestar y la frecuencia de las peticiones a los endpoints más costosos. **Nota de Dependencia Crítica:** Esta tarea depende del servicio "

# Technical Details
detalles_tecnicos: |
  **Rate Limiting:** Middleware en FastAPI usando un backend de Redis para el conteo.
  **Límites de Ingesta:** Lógica de negocio en el servicio de subida que consulta los límites configurados por el administrador.
  **Configuración:** Modelo en la DB para almacenar los límites (Nº docs, MB totales).

# Test Strategy
estrategia_test: |
  **Performance Tests:** Test de carga (JMeter/Locust) para verificar que el rate limiter responde con HTTP 429 cuando se supera el umbral.
  **Integration Tests:** Test que intenta subir un archivo que excede la cuota y verifica que se recibe un HTTP 400.

# Documentation
documentacion: |
  Documentar los códigos de error 429 y 400 en la especificación de la API.

# Acceptance Criteria
criterios_aceptacion: |
  Una carga de N+1 documentos o un tamaño superior al límite en MB resulta en una respuesta HTTP 400.
  Realizar 40 peticiones por minuto a los endpoints rate-limitados resulta en respuestas HTTP 429.
  Los límites son configurables mediante la API del Config Store (T-44) y se persisten en la base de datos. La UI para su gestión por un administrador se completará en T-37.

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  Todos los tests (integration, performance) pasan.
  Documentación de API completada.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R1.WP1-T03-ST1"
    description: "Implementar middleware de rate-limiting (con Redis) para los endpoints críticos (/upload, /rewrite, /plan, /draft_section)."
    complejidad: 4
    entregable: "Test de carga que supera 30 req/min al endpoint /plan recibe respuestas HTTP 429."
    status: "pendiente"
  - id: "R1.WP1-T03-ST2"
    description: "Desarrollar la lógica de backend para validar los límites de ingesta (Nº de documentos, tamaño total en MB) contra la configuración del admin."
    complejidad: 4
    entregable: "Test unitario que simula una carga que excede el límite de MB y recibe un error de validación HTTP 400."
    status: "pendiente"
  - id: "R1.WP1-T03-ST3"
    description: "Crear la sección "Límites de Uso" en el panel de admin (usando el esqueleto de T-44) para configurar estos valores y persistirlos en la DB."
    complejidad: 3
    entregable: "Test Cypress donde un admin guarda nuevos límites y se verifica que se persisten en la DB."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:39:28Z"
  checksum: "710f1866d6787459b924464223b7e80d22332297e4c378116054d0164dc021e7"
  version: "1758753568"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-03: Límites de Ingesta & Rate

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Alta
**Release Target:** Release 1
**Complejidad Total:** 11

## Descripción
Implementar mecanismos de control para prevenir el abuso y garantizar la estabilidad del sistema. Esto incluye limitar la cantidad de datos que un usuario puede ingestar y la frecuencia de las peticiones a los endpoints más costosos. **Nota de Dependencia Crítica:** Esta tarea depende del servicio 

## Detalles Técnicos
**Rate Limiting:** Middleware en FastAPI usando un backend de Redis para el conteo.
**Límites de Ingesta:** Lógica de negocio en el servicio de subida que consulta los límites configurados por el administrador.
**Configuración:** Modelo en la DB para almacenar los límites (Nº docs, MB totales).

## Estrategia de Test
**Performance Tests:** Test de carga (JMeter/Locust) para verificar que el rate limiter responde con HTTP 429 cuando se supera el umbral.
**Integration Tests:** Test que intenta subir un archivo que excede la cuota y verifica que se recibe un HTTP 400.

## Documentación Requerida
Documentar los códigos de error 429 y 400 en la especificación de la API.

## Criterios de Aceptación
Una carga de N+1 documentos o un tamaño superior al límite en MB resulta en una respuesta HTTP 400.
Realizar 40 peticiones por minuto a los endpoints rate-limitados resulta en respuestas HTTP 429.
Los límites son configurables mediante la API del Config Store (T-44) y se persisten en la base de datos. La UI para su gestión por un administrador se completará en T-37.

## Definición de Hecho (DoD)
Código revisado y aprobado.
Todos los tests (integration, performance) pasan.
Documentación de API completada.
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R1.WP1-T03-ST1"
- description: "Implementar middleware de rate-limiting (con Redis) para los endpoints críticos (/upload, /rewrite, /plan, /draft_section)."
- complejidad: 4
- entregable: "Test de carga que supera 30 req/min al endpoint /plan recibe respuestas HTTP 429."
- status: "pendiente"
### id: "R1.WP1-T03-ST2"
- description: "Desarrollar la lógica de backend para validar los límites de ingesta (Nº de documentos, tamaño total en MB) contra la configuración del admin."
- complejidad: 4
- entregable: "Test unitario que simula una carga que excede el límite de MB y recibe un error de validación HTTP 400."
- status: "pendiente"
### id: "R1.WP1-T03-ST3"
- description: "Crear la sección "Límites de Uso" en el panel de admin (usando el esqueleto de T-44) para configurar estos valores y persistirlos en la DB."
- complejidad: 3
- entregable: "Test Cypress donde un admin guarda nuevos límites y se verifica que se persisten en la DB."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:39:28 UTC*
*Validador: task-data-parser.sh v1.0*
