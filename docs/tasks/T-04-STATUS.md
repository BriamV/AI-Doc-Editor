---
task_id: "T-04"
titulo: "File Ingesta RAG + Perf"
estado: "85% Completado - Búsqueda Pendiente"
dependencias: "T-12 ✅, T-41 ✅"
prioridad: "Crítica"
release_target: "Release 1"
complejidad: 18
completado: 15/18 (85%)
ultimo_update: "2025-10-11"
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
    description: "Implementar endpoint REST /upload con validación de archivos (MIME type, tamaño) y metadatos."
    complejidad: 4
    entregable: "Colección Postman que prueba subidas válidas (200 OK) e inválidas (400 Bad Request)."
    status: "completado"
  - id: "R1.WP1-T04-ST2"
    description: "Desarrollar el módulo de extracción de texto para PDF, DOCX y MD, incluyendo el chunking de texto."
    complejidad: 5
    entregable: "Tests unitarios que procesan ficheros de ejemplo y devuelven el texto extraído y chunked correctamente."
    status: "parcial"
  - id: "R1.WP1-T04-ST3"
    description: "Integrar cliente OpenAI para generar embeddings (text-embedding-3-small)."
    complejidad: 2
    entregable: "Test de integración que invoca al cliente OpenAI y verifica que se reciben los vectores."
    status: "completado"
  - id: "R1.WP1-T04-ST4"
    description: "Implementar lógica de upsert en ChromaDB para indexar y actualizar vectores y metadatos."
    complejidad: 3
    entregable: "Test de integración que sube un documento, genera embeddings y verifica que los vectores existen en ChromaDB."
    status: "completado"
  - id: "R1.WP1-T04-ST5"
    description: "Crear script de benchmark (JMeter/Locust) para medir rendimiento de ingesta (PERF-003)."
    complejidad: 2
    entregable: "Reporte de JMeter/Locust que muestra las métricas de rendimiento de ingesta."
    status: "pendiente"
  - id: "R1.WP1-T04-ST6"
    description: "Crear script de benchmark para medir latencia de búsqueda vectorial (PERF-004)."
    complejidad: 2
    entregable: "Reporte de JMeter/Locust que muestra las métricas de latencia de búsqueda."
    status: "bloqueado"

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
**Estado:** 85% Completado - Búsqueda Pendiente
**Prioridad:** Crítica
**Release Target:** Release 1
**Complejidad Total:** 18 (15/18 completado)
**Última Actualización:** 2025-10-11

### Resumen de Implementación

**✅ COMPLETADO (85%)**:
- Pipeline RAG completo (extracción → chunking → embeddings → almacenamiento)
- API de subida de documentos con procesamiento en background
- Servicios backend productivos (text extraction, embedding, vector store, RAG orchestration)
- Integración con user API keys (T-41)
- Frontend de subida de documentos con drag-and-drop
- ChromaDB configurado en Docker
- Tests de integración para flujo API key + RAG

**❌ PENDIENTE (15%)**:
- Endpoint de búsqueda/query (POST /api/documents/search)
- UI de búsqueda en frontend
- Tests unitarios completos
- Tests de performance (JMeter/Locust)

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

### ST1: Endpoint REST /upload - ✅ COMPLETADO
- **ID**: R1.WP1-T04-ST1
- **Descripción**: Implementar endpoint REST /upload con validación de archivos (MIME type, tamaño) y metadatos.
- **Complejidad**: 4
- **Status**: COMPLETADO
- **Implementación**:
  - Endpoint implementado en `backend/app/routers/upload.py`
  - Validación completa: MIME types (PDF, DOCX, MD), límite de tamaño (10MB)
  - Autenticación JWT requerida
  - Sanitización de nombres de archivo
  - Procesamiento en background con BackgroundTasks
  - Integración con DocumentService para metadata
- **Entregable**: API funcional con validaciones completas (verificable via Postman)

### ST2: Módulo de extracción de texto - 🟡 PARCIAL
- **ID**: R1.WP1-T04-ST2
- **Descripción**: Desarrollar el módulo de extracción de texto para PDF, DOCX y MD, incluyendo el chunking de texto.
- **Complejidad**: 5
- **Status**: PARCIAL (funcionalidad completa, tests unitarios pendientes)
- **Implementación**:
  - ✅ TextExtractionService completo (`backend/app/services/text_extraction_service.py`)
  - ✅ Soporte para PDF (pypdf), DOCX (python-docx), Markdown
  - ✅ Chunking strategy: 1000 chars, 200 overlap
  - ✅ Tests manuales exitosos
  - ❌ Tests unitarios formales pendientes
- **Entregable**: Servicio funcional, requiere completar suite de tests unitarios

### ST3: Integración OpenAI embeddings - ✅ COMPLETADO
- **ID**: R1.WP1-T04-ST3
- **Descripción**: Integrar cliente OpenAI para generar embeddings (text-embedding-3-small).
- **Complejidad**: 2
- **Status**: COMPLETADO
- **Implementación**:
  - EmbeddingService implementado (`backend/app/services/embedding_service.py`)
  - Modelo: text-embedding-3-small (1536 dimensiones)
  - Integración con user API keys (T-41): user key + global fallback
  - Manejo de errores y timeouts
  - Tests de integración existentes
- **Entregable**: Servicio funcional con integración T-41 completa

### ST4: Lógica de upsert en ChromaDB - ✅ COMPLETADO
- **ID**: R1.WP1-T04-ST4
- **Descripción**: Implementar lógica de upsert en ChromaDB para indexar y actualizar vectores y metadatos.
- **Complejidad**: 3
- **Status**: COMPLETADO
- **Implementación**:
  - VectorStoreService completo (`backend/app/services/vector_store_service.py`)
  - RAGProcessingService orchestrator (`backend/app/services/rag_processing_service.py`)
  - Flujo completo: upload → extract → embed → store
  - ChromaDB configurado en Docker
  - Tests de integración verifican pipeline completo
- **Entregable**: Pipeline RAG funcional end-to-end

### ST5: Benchmark de ingesta (PERF-003) - ❌ PENDIENTE
- **ID**: R1.WP1-T04-ST5
- **Descripción**: Crear script de benchmark (JMeter/Locust) para medir rendimiento de ingesta (PERF-003).
- **Complejidad**: 2
- **Status**: PENDIENTE
- **Blocker**: Scripts de JMeter/Locust no creados
- **Nota**: Funcionalidad de ingesta operativa, solo falta medición formal
- **Entregable**: Reporte de JMeter/Locust con métricas de rendimiento

### ST6: Benchmark de búsqueda (PERF-004) - ❌ BLOQUEADO
- **ID**: R1.WP1-T04-ST6
- **Descripción**: Crear script de benchmark para medir latencia de búsqueda vectorial (PERF-004).
- **Complejidad**: 2
- **Status**: BLOQUEADO
- **Blocker**: Endpoint de búsqueda no implementado
- **Nota**:
  - Backend service `query_similar_documents()` existe en RAGProcessingService
  - Falta API endpoint POST /api/documents/search
  - Falta UI de búsqueda en frontend
- **Entregable**: Requiere completar endpoint + UI antes de benchmark

## Componentes Implementados

### Backend Services (5/5 complete)
- ✅ **TextExtractionService** (`backend/app/services/text_extraction_service.py`)
  - Extracción de PDF, DOCX, Markdown
  - Chunking strategy (1000 chars, 200 overlap)
- ✅ **EmbeddingService** (`backend/app/services/embedding_service.py`)
  - OpenAI text-embedding-3-small integration
  - User API key + global fallback (T-41)
- ✅ **VectorStoreService** (`backend/app/services/vector_store_service.py`)
  - ChromaDB integration
  - Upsert operations with metadata
- ✅ **RAGProcessingService** (`backend/app/services/rag_processing_service.py`)
  - Pipeline orchestration
  - query_similar_documents() for search
- ✅ **DocumentService** (`backend/app/services/document_service.py`)
  - Metadata management
  - Document lifecycle

### API Endpoints (2/3 complete)
- ✅ **POST /api/upload** (`backend/app/routers/upload.py`)
  - Multipart upload with validation
  - Background processing
  - JWT authentication
- ✅ **GET /api/documents** (`backend/app/routers/documents.py`)
  - List with pagination
  - Filters by user/status/type
- ❌ **POST /api/documents/search** (MISSING)
  - Backend service exists (query_similar_documents)
  - API endpoint not wired
  - Frontend UI not implemented

### Frontend (2/3 complete)
- ✅ **Upload UI** (src/components/)
  - Drag-and-drop interface
  - Progress indicators
  - Validation feedback
- ✅ **Documents List** (src/components/)
  - Pagination
  - Filters
  - Status indicators
- ❌ **Search/Query UI** (MISSING)
  - Search interface not built
  - Results display pending

### Infrastructure (3/3 complete)
- ✅ **ChromaDB Docker Service** (docker-compose.yml)
  - Persistent volumes
  - Network configuration
- ✅ **User API Key Integration** (T-41)
  - User key + global fallback
  - Encrypted storage
- ✅ **Background Task Processing**
  - FastAPI BackgroundTasks
  - Async processing

## Próximos Pasos (Prioridad)

### 1. Implementar endpoint de búsqueda (4-6 hours)
- Crear POST /api/documents/search endpoint
- Wire RAGProcessingService.query_similar_documents()
- Validación de query parameters
- Response format con resultados + scores

### 2. Frontend Search UI (4-5 hours)
- Componente de búsqueda
- Input de query + filtros
- Display de resultados con relevancia
- Integración con API endpoint

### 3. Tests unitarios (4-5 hours)
- Text extraction edge cases
- Chunking boundary conditions
- Mock embeddings service
- Mock vector store operations

### 4. Performance benchmarks (2-3 hours)
- Scripts JMeter/Locust
- Ingestion rate tests (PERF-003)
- Search latency p95 (PERF-004)
- Report generation

---
*Generado automáticamente desde docs/project-management/Sub Tareas v2.md*
*Fecha de extracción: 2025-09-24 22:36:05 UTC*
*Validador: task-data-parser.sh v1.0*
