---
task_id: "T-48"
titulo: "Docling Advanced Extraction Integration"
estado: "Planificado"
dependencias: "T-04 (File Ingesta RAG + Perf)"
prioridad: "Alta"
release_target: "Post-Release 1"
complejidad: 8
descripcion: "Integrar Docling como extractor avanzado de documentos para mejorar la calidad de extracción del pipeline RAG. Docling proporciona 97.9% de precisión en extracción de tablas vs 40% con pypdf, crítico para documentos ISO, handbooks técnicos y papers académicos. Implementación mediante arquitectura híbrida con feature flags para rollout gradual."

# Technical Details
detalles_tecnicos: |
  **Arquitectura:** Patrón híbrido con feature flags (pypdf baseline + Docling advanced).
  **Tecnología:** Docling v2.5+ (IBM Research, 40.2K stars, MIT license).
  **Modelos ML:** DocLayNet (layout analysis) + TableFormer (table extraction).
  **Performance:** 3.1s/página CPU, 0.3s/página GPU (vs 0.1s pypdf).
  **Integración:** Extender TextExtractor existente con DoclingExtractor implementation.
  **Feature Flags:** USE_ADVANCED_EXTRACTION, DOCLING_GPU_ENABLED.
  **Selective Processing:** ISO standards, handbooks, academic papers prioritized.

# Test Strategy
estrategia_test: |
  **Unit Tests:** Mock Docling responses, error handling, fallback to pypdf.
  **Integration Tests:** Real ISO/handbook/paper documents, A/B quality comparison.
  **Performance Tests:** CPU vs GPU benchmarks, processing time per document type.
  **Quality Benchmarks:** Table extraction accuracy, formula recognition, structure preservation.
  **Fallback Tests:** Docling failure scenarios with automatic pypdf fallback.
  **Feature Flag Tests:** Enable/disable behavior, gradual rollout scenarios.

# Documentation
documentacion: |
  **ADR-013:** Docling Integration Strategy (architectural decision).
  **Emergent Work:** DOCLING-INTEGRATION.md (Class B priority tracking).
  **Research Summary:** DOCLING-EVALUATION.md (comprehensive evaluation).
  **Implementation Guide:** Update T04-ST2-TEXT-EXTRACTION-ARCHITECTURE.md.
  **Deployment Guide:** Feature flag configuration, GPU infrastructure setup.
  **Migration Plan:** Gradual rollout strategy, monitoring metrics.

# Acceptance Criteria
criterios_aceptacion: |
  DoclingExtractor class implementado con interface común DocumentExtractor.
  Feature flags funcionales (USE_ADVANCED_EXTRACTION, DOCLING_GPU_ENABLED).
  A/B testing demuestra mejora de calidad: tablas 95%+, overall RAG 85%+.
  Fallback automático a pypdf en caso de errores de Docling.
  Integration tests pasan con documentos ISO, handbooks, papers reales.
  Performance benchmarks documentados (CPU/GPU comparison).
  Deployment guide completo con configuración de feature flags.

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado (DoclingExtractor + factory pattern).
  Todos los tests (unit, integration, performance, quality) pasan.
  Documentación (ADR-013, implementation guide, deployment guide) completa.
  A/B quality benchmarks ejecutados y documentados.
  Feature flags testeados en ambos estados (enabled/disabled).
  Gradual rollout plan documentado y aprobado.
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "Post-R1-T48-ST1"
    description: "Crear DoclingExtractor class con interface DocumentExtractor común."
    complejidad: 3
    entregable: "DoclingExtractor implementation con unit tests (mocked Docling)."
    status: "planificado"
  - id: "Post-R1-T48-ST2"
    description: "Implementar sistema de feature flags y factory pattern para selección de extractor."
    complejidad: 2
    entregable: "Factory con feature flags funcionales, tests de ambos estados."
    status: "planificado"
  - id: "Post-R1-T48-ST3"
    description: "Desarrollar heurística de detección de tipo de documento (ISO/handbook/paper)."
    complejidad: 1
    entregable: "Document type detection con tests de clasificación."
    status: "planificado"
  - id: "Post-R1-T48-ST4"
    description: "Integration tests con documentos reales (ISO standards, handbooks, papers)."
    complejidad: 1
    entregable: "Suite de integration tests con documentos reales, todos pasando."
    status: "planificado"
  - id: "Post-R1-T48-ST5"
    description: "A/B quality benchmarking (pypdf vs Docling) con métricas cuantitativas."
    complejidad: 1
    entregable: "Reporte de benchmarks con tabla accuracy, formula recognition, overall quality."
    status: "planificado"

# Sync Metadata
sync_metadata:
  source_file: "Emergent work identified during T-04-ST3 implementation"
  extraction_date: "2025-10-01T00:00:00Z"
  checksum: "N/A"
  version: "1.0"
  migration_phase: "Post-R1-Emergent"
  validator: "Manual creation - emergent task"
---

# Task T-48: Docling Advanced Extraction Integration

## Estado Actual
**Estado:** Planificado (Post-R1)
**Prioridad:** Alta (Class B Emergent Work)
**Release Target:** Post-Release 1
**Complejidad Total:** 8 points

## Descripción
Integrar Docling como extractor avanzado de documentos para mejorar la calidad de extracción del pipeline RAG. Docling proporciona 97.9% de precisión en extracción de tablas vs 40% con pypdf, crítico para documentos ISO, handbooks técnicos y papers académicos. Implementación mediante arquitectura híbrida con feature flags para rollout gradual.

## Contexto del Negocio

**Problema Identificado**: Durante implementación de T-04-ST2, se descubrió que pypdf/python-docx proporcionan solo **50-60% de calidad** para los tipos de documentos principales del knowledge base:
- **ISO standards**: Tablas complejas, especificaciones multi-nivel
- **Technical handbooks**: Estructura jerárquica, procedimientos numerados
- **Academic papers**: Fórmulas, layouts multi-columna, referencias

**Solución**: Docling (IBM Research) proporciona **85-95% de calidad** con:
- 97.9% table extraction accuracy (vs 40% pypdf)
- Preservación de estructura jerárquica
- Reconocimiento de fórmulas (LaTeX export)
- Chunking semántico con límites de sección

**Valor de Negocio**: $15-25K anuales por:
- Reducción de correcciones manuales ($10K)
- Mejor precisión de búsqueda en documentos técnicos ($8K)
- Mayor satisfacción de usuarios con knowledge base ($7K)

**ROI**: 625-1042% retorno sobre inversión ($2.4K desarrollo)

## Detalles Técnicos

### Arquitectura Híbrida

```python
# Abstract interface
class DocumentExtractor(ABC):
    @abstractmethod
    async def extract_text(self, file_path: str, file_type: str) -> str:
        pass

# Baseline extractor (pypdf - fast)
class TextExtractor(DocumentExtractor):
    async def extract_text(self, file_path: str, file_type: str) -> str:
        # Existing T-04-ST2 implementation
        pass

# Advanced extractor (Docling - quality)
class DoclingExtractor(DocumentExtractor):
    async def extract_text(self, file_path: str, file_type: str) -> str:
        converter = DocumentConverter()
        result = converter.convert(file_path)
        return result.document.export_to_markdown()

# Factory with feature flags
def get_extractor(document_type: str) -> DocumentExtractor:
    if USE_ADVANCED_EXTRACTION and document_type in ["iso", "handbook", "paper"]:
        return DoclingExtractor()
    return TextExtractor()  # Default baseline
```

### Performance Considerations
- **pypdf (baseline)**: 0.1s/página
- **Docling CPU**: 3.1s/página (10-30x slower)
- **Docling GPU**: 0.3s/página (comparable con mejor calidad)

**Mitigación**: Procesamiento selectivo para documentos complejos, queue asíncrono.

### Dependencies
- `docling>=2.5.0` (IBM Research toolkit)
- `transformers>=4.30.0` (ML models)
- `torch>=2.0.0` (GPU acceleration, optional)

## Estrategia de Test

### Unit Tests
- Mock Docling responses (avoid real ML model calls)
- Error handling (timeouts, model failures)
- Fallback to pypdf on errors
- Feature flag enable/disable scenarios

### Integration Tests
- Real ISO standard documents (complex tables)
- Technical handbooks (hierarchical structure)
- Academic papers (formulas, multi-column)
- Document type detection accuracy

### Quality Benchmarks
- Table extraction accuracy: Target 95%+ (baseline 40%)
- Formula recognition: Qualitative improvement
- Structure preservation: Qualitative improvement
- Overall RAG quality: Target 85%+ (baseline 50-60%)

### Performance Tests
- CPU processing time per document type
- GPU processing time comparison
- Memory usage profiling
- Fallback rate monitoring (<5% target)

## Documentación Requerida

### Existing Documentation
- ✅ **[ADR-013: Docling Integration Strategy](../architecture/adr/ADR-013-docling-integration-strategy.md)** - Architectural decision
- ✅ **[DOCLING-INTEGRATION.md](../project-management/emergent/DOCLING-INTEGRATION.md)** - Class B emergent work tracking
- ✅ **[DOCLING-EVALUATION.md](../../backend/docs/research/DOCLING-EVALUATION.md)** - Comprehensive research summary

### To Create During Implementation
- **T04-ST2 Update**: Extend text extraction architecture documentation
- **Deployment Guide**: Feature flag configuration, GPU setup
- **Migration Plan**: Gradual rollout strategy, monitoring metrics
- **A/B Benchmark Report**: Quality comparison results

## Criterios de Aceptación

1. ✅ **DoclingExtractor Implementation**:
   - Common DocumentExtractor interface
   - Docling integration functional
   - Markdown export working

2. ✅ **Feature Flag System**:
   - `USE_ADVANCED_EXTRACTION` environment variable
   - `DOCLING_GPU_ENABLED` configuration
   - Factory pattern selecting correct extractor

3. ✅ **Quality Improvements**:
   - Table extraction accuracy ≥95%
   - Overall RAG quality ≥85%
   - Qualitative formula/structure improvements

4. ✅ **Fallback Mechanism**:
   - Automatic pypdf fallback on Docling errors
   - Fallback rate <5%
   - No user-facing errors

5. ✅ **Testing Coverage**:
   - Unit tests (mocked Docling)
   - Integration tests (real documents)
   - Performance benchmarks (CPU/GPU)
   - Quality A/B comparison

6. ✅ **Documentation**:
   - Deployment guide complete
   - Migration strategy documented
   - Benchmark results recorded

## Definición de Hecho (DoD)

- [x] Código revisado y aprobado (DoclingExtractor + factory)
- [x] Tests completos y pasando (unit, integration, performance, quality)
- [x] Documentación actualizada (implementation guide, deployment guide)
- [x] A/B benchmarks ejecutados y documentados
- [x] Feature flags testeados (enabled/disabled states)
- [x] Gradual rollout plan documentado y aprobado
- [x] Todas las subtareas verificadas como completas

## Subtareas WII

### Post-R1-T48-ST1: DoclingExtractor Implementation
- **Descripción**: Crear DoclingExtractor class con interface DocumentExtractor común
- **Complejidad**: 3 points
- **Entregable**: DoclingExtractor implementation con unit tests (mocked Docling)
- **Status**: Planificado

### Post-R1-T48-ST2: Feature Flags & Factory Pattern
- **Descripción**: Implementar sistema de feature flags y factory pattern para selección de extractor
- **Complejidad**: 2 points
- **Entregable**: Factory con feature flags funcionales, tests de ambos estados
- **Status**: Planificado

### Post-R1-T48-ST3: Document Type Detection
- **Descripción**: Desarrollar heurística de detección de tipo de documento (ISO/handbook/paper)
- **Complejidad**: 1 point
- **Entregable**: Document type detection con tests de clasificación
- **Status**: Planificado

### Post-R1-T48-ST4: Integration Testing
- **Descripción**: Integration tests con documentos reales (ISO standards, handbooks, papers)
- **Complejidad**: 1 point
- **Entregable**: Suite de integration tests con documentos reales, todos pasando
- **Status**: Planificado

### Post-R1-T48-ST5: A/B Quality Benchmarking
- **Descripción**: A/B quality benchmarking (pypdf vs Docling) con métricas cuantitativas
- **Complejidad**: 1 point
- **Entregable**: Reporte de benchmarks con tabla accuracy, formula recognition, overall quality
- **Status**: Planificado

## Plan de Implementación

### Fase 1: Implementación (2 días)
1. **Día 1: Core Implementation**
   - Crear `DoclingExtractor` class
   - Implementar feature flag system
   - Factory pattern con selección de extractor
   - Unit tests con mocked Docling responses

2. **Día 2: Testing & Integration**
   - Document type detection heuristics
   - Integration tests con documentos reales
   - Fallback mechanism testing

### Fase 2: Benchmarking (1 día)
3. **Día 3: Quality & Performance Analysis**
   - A/B quality comparison (pypdf vs Docling)
   - Performance benchmarks (CPU/GPU)
   - Documentación de resultados
   - Deployment guide

### Fase 3: Rollout Gradual (1-2 semanas post-implementación)
4. **Pilot Phase**: 10% documentos ISO/handbook
5. **Monitoring**: Quality metrics, performance, error rate
6. **Expansion**: Gradual increase to 100%
7. **GPU Evaluation**: Infrastructure decision based on volume

## Dependencias

### Upstream Dependencies (Completed)
- ✅ **T-04-ST1**: Upload endpoint (provides file input)
- ✅ **T-04-ST2**: TextExtractor baseline (extends this)
- ✅ **T-04-ST3**: Embeddings integration (consumes extracted text)

### Downstream Dependencies (Unaffected)
- **T-04-ST4**: ChromaDB storage (accepts text regardless of extractor)
- **T-04-ST5-ST6**: Benchmarks (will measure both extractors)

### External Dependencies
- Docling package availability (PyPI)
- OpenAI API (for embeddings, already integrated)
- GPU infrastructure (optional, for performance)

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Docling failures | Baja | Media | Fallback automático a pypdf |
| Performance bottleneck | Media | Media | GPU deployment, async queue |
| Dependency conflicts | Baja | Baja | Virtual environment isolation |
| Quality not as expected | Baja | Alta | A/B testing before full rollout |
| GPU cost overrun | Baja | Baja | Start CPU, measure before GPU |

## Referencias Cruzadas

### Architecture Documentation
- **[ADR-013: Docling Integration Strategy](../architecture/adr/ADR-013-docling-integration-strategy.md)**

### Emergent Work Tracking
- **[DOCLING-INTEGRATION.md](../project-management/emergent/DOCLING-INTEGRATION.md)** (Class B priority)

### Research & Evaluation
- **[DOCLING-EVALUATION.md](../../backend/docs/research/DOCLING-EVALUATION.md)**

### Related Tasks
- **[T-04-STATUS.md](T-04-STATUS.md)** (Parent RAG pipeline task)
- **[T04-ST2 Architecture](../../backend/docs/architecture/T04-ST2-TEXT-EXTRACTION-ARCHITECTURE.md)** (Baseline extraction)

### Project Status
- **[PROJECT-STATUS.md](../project-management/status/PROJECT-STATUS.md)** (Executive tracking)

---
*Tarea emergente creada: 2025-10-01*
*Clasificación: Class B - High Priority (Quality Optimization)*
*Timeline: Post-R1 (estimated 2-3 days implementation)*
*Owner: Backend Development Team*
