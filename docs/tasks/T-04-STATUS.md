---
task_id: "T-04"
titulo: "File Ingesta RAG + Perf"
estado: "Pendiente"
dependencias: "T-12, T-41"
prioridad: "Crítica"
release_target: "Release 1"
complejidad: 18
descripcion: "Desarrollar el pipeline completo de ingesta de documentos para el sistema RAG. Esto implica recibir archivos, extraer su contenido, generar embeddings vectoriales y almacenarlos en una base de datos vectorial para su posterior recuperación. El rendimiento es un factor clave."

# Technical Details
detalles_tecnicos: |
  **Endpoint:** REST API POST /upload (multipart/form-data).
  **Extracción:** Librerías como pypdf, python-docx.
  **Embeddings:** Modelo text-embedding-3-small de OpenAI.
  **Vector Store:** ChromaDB.
  **Benchmarking:** JMeter/Locust.

# Test Strategy
estrategia_test: |
  **Unit Tests:** Para los módulos de extracción de texto y chunking.
  **Integration Tests:** Flujo completo desde la subida de un archivo hasta la verificación de su existencia en ChromaDB. Test de regresión para la lógica de upsert.
  **Performance Tests:** Medir la tasa de ingesta (MB/h) y la latencia de búsqueda p95.

# Documentation
documentacion: |
  Actualizar OpenAPI para el endpoint /upload.
  ADR sobre la elección de ChromaDB y la estrategia de chunking.
  **Acta de Certificación de KPI (según plantilla de T-17) firmada por el Tech Lead.**

# Acceptance Criteria
criterios_aceptacion: |
  Una suite de JMeter evidencia que se cumplen los objetivos de rendimiento (PERF-003, PERF-004).
  Un test de regresión verifica que un upsert de un documento existente actualiza los vectores y los antiguos no son recuperables.
  Los metadatos del documento (nombre, tipo) son visibles en la UI después de la carga.
  **Acta de Certificación de KPI (según plantilla de T-17) firmada por el Tech Lead.**

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  Todos los tests (unit, integration, performance) pasan.
  Documentación (API, ADR) completada.
  **Acta de Certificación de KPI (según plantilla de T-17) firmada por el Tech Lead.**
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R1.WP1-T04-ST1"
    description: "Implementar endpoint REST /upload con validación de archivos (MIME type, tamaño) y metadatos."
    complejidad: 4
    entregable: "Colección Postman que prueba subidas válidas (200 OK) e inválidas (400 Bad Request)."
    status: "completado"
  - id: "R1.WP1-T04-ST2"
    description: "Desarrollar el módulo de extracción de texto para PDF, DOCX y MD, incluyendo el chunking de texto."
    complejidad: 5
    entregable: "Tests unitarios que procesan ficheros de ejemplo y devuelven el texto extraído y chunked correctamente."
    status: "completado"
  - id: "R1.WP1-T04-ST3"
    description: "Integrar cliente OpenAI para generar embeddings (text-embedding-3-small)."
    complejidad: 2
    entregable: "Test de integración que invoca al cliente OpenAI y verifica que se reciben los vectores."
    status: "completado"
  - id: "R1.WP1-T04-ST4"
    description: "Implementar lógica de upsert en ChromaDB para indexar y actualizar vectores y metadatos."
    complejidad: 3
    entregable: "Test de integración que sube un documento, genera embeddings y verifica que los vectores existen en ChromaDB."
    status: "pendiente"
  - id: "R1.WP1-T04-ST5"
    description: "Crear script de benchmark (JMeter/Locust) para medir rendimiento de ingesta (PERF-003)."
    complejidad: 2
    entregable: "Reporte de JMeter/Locust que muestra las métricas de rendimiento de ingesta."
    status: "pendiente"
  - id: "R1.WP1-T04-ST6"
    description: "Crear script de benchmark para medir latencia de búsqueda vectorial (PERF-004)."
    complejidad: 2
    entregable: "Reporte de JMeter/Locust que muestra las métricas de latencia de búsqueda."
    status: "pendiente"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/Sub Tareas v2.md"
  extraction_date: "2025-09-24T22:36:05Z"
  checksum: "a70a4d07b7be394adfdba7850b76935751bce44bbb36601c0641a101c7b25f69"
  version: "1758753365"
  migration_phase: "Phase1-Foundation"
  validator: "task-data-parser.sh"
---

# Task T-04: File Ingesta RAG + Perf

## Estado Actual
**Estado:** Pendiente
**Prioridad:** Crítica
**Release Target:** Release 1
**Complejidad Total:** 18

## Descripción
Desarrollar el pipeline completo de ingesta de documentos para el sistema RAG. Esto implica recibir archivos, extraer su contenido, generar embeddings vectoriales y almacenarlos en una base de datos vectorial para su posterior recuperación. El rendimiento es un factor clave.

## Detalles Técnicos
**Endpoint:** REST API POST /upload (multipart/form-data).
**Extracción:** Librerías como pypdf, python-docx.
**Embeddings:** Modelo text-embedding-3-small de OpenAI.
**Vector Store:** ChromaDB.
**Benchmarking:** JMeter/Locust.

## Estrategia de Test
**Unit Tests:** Para los módulos de extracción de texto y chunking.
**Integration Tests:** Flujo completo desde la subida de un archivo hasta la verificación de su existencia en ChromaDB. Test de regresión para la lógica de upsert.
**Performance Tests:** Medir la tasa de ingesta (MB/h) y la latencia de búsqueda p95.

## Documentación Requerida
Actualizar OpenAPI para el endpoint /upload.
ADR sobre la elección de ChromaDB y la estrategia de chunking.
**Acta de Certificación de KPI (según plantilla de T-17) firmada por el Tech Lead.**

## Criterios de Aceptación
Una suite de JMeter evidencia que se cumplen los objetivos de rendimiento (PERF-003, PERF-004).
Un test de regresión verifica que un upsert de un documento existente actualiza los vectores y los antiguos no son recuperables.
Los metadatos del documento (nombre, tipo) son visibles en la UI después de la carga.
**Acta de Certificación de KPI (según plantilla de T-17) firmada por el Tech Lead.**

## Definición de Hecho (DoD)
Código revisado y aprobado.
Todos los tests (unit, integration, performance) pasan.
Documentación (API, ADR) completada.
**Acta de Certificación de KPI (según plantilla de T-17) firmada por el Tech Lead.**
Todas las subtareas verificadas como completas.

## Subtareas WII
### id: "R1.WP1-T04-ST1"
- description: "Implementar endpoint REST /upload con validación de archivos (MIME type, tamaño) y metadatos."
- complejidad: 4
- entregable: "Colección Postman que prueba subidas válidas (200 OK) e inválidas (400 Bad Request)."
- status: "completado"
### id: "R1.WP1-T04-ST2"
- description: "Desarrollar el módulo de extracción de texto para PDF, DOCX y MD, incluyendo el chunking de texto."
- complejidad: 5
- entregable: "Tests unitarios que procesan ficheros de ejemplo y devuelven el texto extraído y chunked correctamente."
- status: "pendiente"
### id: "R1.WP1-T04-ST3"
- description: "Integrar cliente OpenAI para generar embeddings (text-embedding-3-small)."
- complejidad: 2
- entregable: "Test de integración que invoca al cliente OpenAI y verifica que se reciben los vectores."
- status: "pendiente"
### id: "R1.WP1-T04-ST4"
- description: "Implementar lógica de upsert en ChromaDB para indexar y actualizar vectores y metadatos."
- complejidad: 3
- entregable: "Test de integración que sube un documento, genera embeddings y verifica que los vectores existen en ChromaDB."
- status: "pendiente"
### id: "R1.WP1-T04-ST5"
- description: "Crear script de benchmark (JMeter/Locust) para medir rendimiento de ingesta (PERF-003)."
- complejidad: 2
- entregable: "Reporte de JMeter/Locust que muestra las métricas de rendimiento de ingesta."
- status: "pendiente"
### id: "R1.WP1-T04-ST6"
- description: "Crear script de benchmark para medir latencia de búsqueda vectorial (PERF-004)."
- complejidad: 2
- entregable: "Reporte de JMeter/Locust que muestra las métricas de latencia de búsqueda."
- status: "pendiente"

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:36:05 UTC*
*Validador: task-data-parser.sh v1.0*
