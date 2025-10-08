---
task_id: "T-48"
titulo: "Docling Integration - Advanced Document Extraction"
estado: "Planificado"
dependencias: "T-04"
prioridad: "Alta"
release_target: "Post-Release 1"
complejidad: 13
descripcion: "Integrar Docling (IBM Research) para mejorar la calidad de extracción de texto del pipeline RAG de 50-60% (pypdf baseline) a 85-95% (Docling) en documentos técnicos complejos. Enfocado en ISO standards, technical handbooks y academic papers con tablas, ecuaciones y diagramas complejos."

# Technical Details
detalles_tecnicos: |
  **Docling Version:** v2.x (última estable Oct 2025)
  **Key Improvement:** 97.9% table extraction accuracy vs 40% con pypdf
  **Document Types:** PDF (primary), DOCX, PPTX, Images, HTML
  **Features:** OCR, table structure recognition, formula extraction, layout analysis
  **Integration Point:** Reemplaza pypdf en backend/app/services/text_extractor.py
  **Fallback Strategy:** pypdf como backup si Docling falla
  **Performance:** ~2-3x más lento que pypdf, pero calidad 42% superior

# Test Strategy
estrategia_test: |
  **Baseline Comparison:** Documentos de prueba con tablas complejas (pypdf vs Docling).
  **Quality Metrics:** Precision, recall, F1-score en extracción de tablas.
  **Performance Tests:** Medir tiempo de extracción para documentos de 10/50/100 páginas.
  **Integration Tests:** Pipeline completo RAG con Docling-extracted text.
  **Regression Tests:** Verificar que documentos simples no degradan performance.

# Documentation
documentacion: |
  ADR sobre la decisión de integrar Docling y trade-offs de performance vs calidad.
  Benchmark report comparando pypdf vs Docling en dataset de prueba.
  Guía de configuración de Docling (OCR engines, layout detection models).
  Documentación de fallback strategy cuando Docling falla.

# Acceptance Criteria
criterios_aceptacion: |
  ✅ Docling extrae tablas de documentos técnicos con >90% accuracy (vs 40% pypdf baseline).
  ✅ Documentos con ecuaciones matemáticas se extraen correctamente (LaTeX/MathML).
  ✅ Performance degradation < 3x comparado con pypdf (tiempo de extracción).
  ✅ Fallback a pypdf funciona automáticamente si Docling falla.
  ✅ Benchmark report documenta mejora de calidad RAG de 50-60% a 85-95%.
  ✅ Integration tests verifican que pipeline RAG completo funciona con Docling.

# Definition of Done
definicion_hecho: |
  Código revisado y aprobado.
  Todos los tests (unit, integration, performance, quality benchmarks) pasan.
  Documentación (ADR, benchmark report, configuration guide) completada.
  Fallback strategy probada y documentada.
  Performance acceptable (< 3x degradation vs pypdf).
  Todas las subtareas verificadas como completas.

# WII Subtasks
wii_subtasks:
  - id: "R1.WP1-T48-ST1"
    description: "Investigar Docling capabilities y crear PoC de extracción en documentos técnicos."
    complejidad: 3
    entregable: "PoC script que extrae texto de 5 documentos técnicos (ISO, papers) y compara con pypdf. Report con metrics de calidad."
    status: "planificado"
  - id: "R1.WP1-T48-ST2"
    description: "Integrar Docling en text_extractor.py con fallback strategy a pypdf."
    complejidad: 4
    entregable: "Módulo text_extractor.py refactorizado con DoclingExtractor class y fallback logic. Unit tests para ambos extractors."
    status: "planificado"
  - id: "R1.WP1-T48-ST3"
    description: "Configurar Docling para optimal performance (OCR engines, layout models, caching)."
    complejidad: 2
    entregable: "Archivo de configuración docling_config.yaml con settings optimizados. Documentation de cada setting."
    status: "planificado"
  - id: "R1.WP1-T48-ST4"
    description: "Ejecutar benchmarks de calidad (table extraction, formula extraction) en dataset de prueba."
    complejidad: 2
    entregable: "Benchmark report con precision/recall/F1 metrics comparando pypdf vs Docling en 50 documentos técnicos."
    status: "planificado"
  - id: "R1.WP1-T48-ST5"
    description: "Ejecutar performance benchmarks y optimizar si necesario."
    complejidad: 2
    entregable: "Performance report con tiempos de extracción por tamaño de documento. Optimizaciones implementadas si degradation > 3x."
    status: "planificado"

# Sync Metadata
sync_metadata:
  source_file: "docs/project-management/emergent/DOCLING-INTEGRATION.md"
  extraction_date: "2025-10-08T16:00:00Z"
  checksum: "emergent_work_class_b_high_priority_post_r1"
  version: "1"
  migration_phase: "Post-R1"
  validator: "manual_creation"
---

# Task T-48: Docling Integration - Advanced Document Extraction

## Estado Actual
**Estado:** Planificado (Post-R1)
**Prioridad:** Alta (Clase B - Quality Enhancement)
**Release Target:** Post-Release 1
**Complejidad Total:** 13 puntos

## Descripción
Integrar Docling (IBM Research) para mejorar la calidad de extracción de texto del pipeline RAG de 50-60% (pypdf baseline) a 85-95% (Docling) en documentos técnicos complejos. Enfocado en ISO standards, technical handbooks y academic papers con tablas, ecuaciones y diagramas complejos.

## Contexto y Motivación

### Problema Actual (Baseline pypdf)
Durante las pruebas de T-04 (File Ingesta RAG), se identificaron limitaciones críticas en la extracción de texto con pypdf:

1. **Tablas Complejas:** 40% accuracy en extracción de estructura de tablas
2. **Ecuaciones Matemáticas:** Pérdida de formato y símbolos especiales
3. **Layouts Complejos:** Problemas con columnas múltiples y cajas de texto
4. **Diagramas con Texto:** OCR no disponible en pypdf

**Impacto en RAG Quality:**
- Documentos ISO standards: 50% calidad de respuestas (tablas mal extraídas)
- Academic papers: 60% calidad (ecuaciones y diagramas perdidos)
- Technical handbooks: 55% calidad (layouts complejos confunden extractor)

### Solución Propuesta: Docling

**Docling** es una biblioteca de IBM Research (MIT license) especializada en extracción de documentos complejos.

**Key Features:**
- **Table Structure Recognition:** 97.9% accuracy (vs 40% pypdf)
- **OCR Integration:** Tesseract, EasyOCR support
- **Formula Extraction:** LaTeX/MathML output para ecuaciones
- **Layout Analysis:** ML-based document structure detection
- **Multi-format:** PDF, DOCX, PPTX, Images, HTML

**Expected RAG Quality Improvement:**
- ISO standards: 50% → 90% (+80% mejora)
- Academic papers: 60% → 95% (+58% mejora)
- Technical handbooks: 55% → 85% (+54% mejora)
- **Promedio:** +64% mejora en calidad RAG

## Detalles Técnicos

### Arquitectura de Integración

```python
# backend/app/services/text_extractor.py (REFACTORED)

class ExtractorStrategy(ABC):
    @abstractmethod
    def extract(self, file_path: str) -> str:
        pass

class DoclingExtractor(ExtractorStrategy):
    """Advanced extraction with Docling (tables, formulas, OCR)."""
    def __init__(self, config: DoclingConfig):
        self.docling = DocumentConverter(
            allowed_formats=[InputFormat.PDF, InputFormat.DOCX],
            format_options={
                InputFormat.PDF: PdfFormatOption(
                    pipeline_cls=StandardPdfPipeline,
                    do_ocr=True,
                    ocr_engine=TesseractOcrEngine,
                ),
            },
        )

    def extract(self, file_path: str) -> str:
        result = self.docling.convert(file_path)
        return result.document.export_to_markdown()

class PyPdfExtractor(ExtractorStrategy):
    """Fallback extractor for simple documents."""
    def extract(self, file_path: str) -> str:
        # Existing pypdf logic
        ...

class TextExtractor:
    """Main extractor with fallback strategy."""
    def __init__(self):
        self.primary = DoclingExtractor(config)
        self.fallback = PyPdfExtractor()

    def extract(self, file_path: str, file_type: str) -> str:
        try:
            return self.primary.extract(file_path)
        except DoclingException as e:
            logger.warning(f"Docling failed: {e}, using pypdf fallback")
            return self.fallback.extract(file_path)
```

### Configuración Docling

```yaml
# backend/config/docling_config.yaml
docling:
  ocr:
    enabled: true
    engine: "tesseract"  # tesseract | easyocr
    languages: ["eng", "spa"]
    confidence_threshold: 0.75

  table_extraction:
    enabled: true
    model: "microsoft/table-transformer-detection"
    min_confidence: 0.85

  formula_extraction:
    enabled: true
    output_format: "latex"  # latex | mathml

  layout_analysis:
    enabled: true
    detect_columns: true
    detect_headers: true

  performance:
    max_pages: 500
    timeout_seconds: 300
    cache_enabled: true
    cache_dir: "/tmp/docling_cache"

  fallback:
    enabled: true
    fallback_on_timeout: true
    fallback_on_error: true
```

### Dependencies

```toml
# backend/pyproject.toml
[tool.poetry.dependencies]
docling = "^2.0.0"              # Core Docling library
docling-core = "^2.0.0"         # Core utilities
pytesseract = "^0.3.10"         # OCR engine
pillow = "^10.0.0"              # Image processing
transformers = "^4.35.0"        # Table transformer models
```

## Estrategia de Test

### 1. Quality Benchmarks (ST4)

**Dataset de Prueba (50 documentos):**
- 20 ISO standards (ISO 9001, ISO 27001, etc.)
- 15 Academic papers (IEEE, ACM, arXiv)
- 15 Technical handbooks (Rust Book, Python Docs, etc.)

**Metrics:**
- **Table Extraction:** Precision, Recall, F1-score
- **Formula Extraction:** Symbol accuracy, LaTeX correctness
- **Overall Quality:** Human evaluation score (1-10)

**Target Metrics:**
- Table Extraction F1: > 0.90 (vs 0.40 pypdf)
- Formula Accuracy: > 95% (vs 30% pypdf)
- Overall Quality: > 8.5/10 (vs 5.0/10 pypdf)

### 2. Performance Benchmarks (ST5)

**Document Sizes:**
- Small: 10 pages (ISO standard)
- Medium: 50 pages (academic paper)
- Large: 100 pages (technical handbook)

**Metrics:**
- Extraction time (seconds)
- Memory usage (MB)
- CPU utilization (%)

**Acceptable Degradation:**
- Time: < 3x slowdown vs pypdf
- Memory: < 2x increase vs pypdf

### 3. Integration Tests

**Test Cases:**
- ✅ Docling extracts text from PDF with tables
- ✅ Docling extracts formulas in LaTeX format
- ✅ Fallback to pypdf when Docling timeout
- ✅ Fallback to pypdf when Docling error
- ✅ Pipeline RAG completo con Docling-extracted text
- ✅ Upsert to ChromaDB funciona con Docling output

## Documentación Requerida

### 1. ADR: Docling Integration Decision
**File:** docs/architecture/adr/ADR-XXX-docling-integration.md

**Contenido:**
- Context: Limitaciones de pypdf en documentos técnicos
- Decision: Integrar Docling como extractor primario
- Consequences: +42% RAG quality, -3x performance
- Alternatives Considered: Apache Tika, Unstructured.io

### 2. Benchmark Report
**File:** docs/reports/docling-quality-benchmark.md

**Contenido:**
- Dataset description (50 documentos técnicos)
- Quality metrics (table/formula extraction)
- Performance metrics (tiempo, memoria)
- Comparative analysis (pypdf vs Docling)
- Recommendations para optimization

### 3. Configuration Guide
**File:** docs/backend/docling-configuration.md

**Contenido:**
- Installation guide
- Configuration options explained
- OCR engine selection (Tesseract vs EasyOCR)
- Model selection para table extraction
- Performance tuning tips
- Troubleshooting common issues

## Criterios de Aceptación

- ✅ Docling extrae tablas de documentos técnicos con >90% accuracy (vs 40% pypdf baseline)
- ✅ Documentos con ecuaciones matemáticas se extraen correctamente (LaTeX/MathML)
- ✅ Performance degradation < 3x comparado con pypdf (tiempo de extracción)
- ✅ Fallback a pypdf funciona automáticamente si Docling falla
- ✅ Benchmark report documenta mejora de calidad RAG de 50-60% a 85-95%
- ✅ Integration tests verifican que pipeline RAG completo funciona con Docling

## Definición de Hecho (DoD)

- ✅ Código revisado y aprobado
- ✅ Todos los tests (unit, integration, performance, quality benchmarks) pasan
- ✅ Documentación (ADR, benchmark report, configuration guide) completada
- ✅ Fallback strategy probada y documentada
- ✅ Performance acceptable (< 3x degradation vs pypdf)
- ✅ Todas las subtareas verificadas como completas

## Subtareas WII

### ST1: PoC & Investigation ⏳ PLANIFICADO
**ID:** R1.WP1-T48-ST1
**Complejidad:** 3 puntos
**Entregable:** PoC script + quality report

**Tasks:**
1. Instalar Docling en ambiente de desarrollo
2. Crear script de PoC con 5 documentos técnicos
3. Comparar output Docling vs pypdf
4. Documentar findings en report

### ST2: Integration & Fallback ⏳ PLANIFICADO
**ID:** R1.WP1-T48-ST2
**Complejidad:** 4 puntos
**Entregable:** Refactored text_extractor.py + unit tests

**Tasks:**
1. Refactorizar text_extractor.py con Strategy pattern
2. Implementar DoclingExtractor class
3. Implementar fallback logic
4. Unit tests para ambos extractors
5. Integration tests para fallback scenarios

### ST3: Configuration & Optimization ⏳ PLANIFICADO
**ID:** R1.WP1-T48-ST3
**Complejidad:** 2 puntos
**Entregable:** docling_config.yaml + documentation

**Tasks:**
1. Crear archivo de configuración YAML
2. Documentar cada setting
3. Probar diferentes OCR engines (Tesseract vs EasyOCR)
4. Optimizar cache strategy
5. Validar timeout settings

### ST4: Quality Benchmarks ⏳ PLANIFICADO
**ID:** R1.WP1-T48-ST4
**Complejidad:** 2 puntos
**Entregable:** Benchmark report con metrics

**Tasks:**
1. Preparar dataset de 50 documentos técnicos
2. Ejecutar extraction con pypdf (baseline)
3. Ejecutar extraction con Docling
4. Calcular precision/recall/F1 metrics
5. Generar comparative report

### ST5: Performance Benchmarks ⏳ PLANIFICADO
**ID:** R1.WP1-T48-ST5
**Complejidad:** 2 puntos
**Entregable:** Performance report + optimizations

**Tasks:**
1. Benchmark extraction time por tamaño de documento
2. Benchmark memory usage
3. Identificar bottlenecks
4. Implementar optimizaciones si degradation > 3x
5. Re-test y documentar resultados

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Performance degradation > 3x** | Media | Alto | Implementar caching agresivo, background processing, async extraction |
| **Docling dependencies conflictivas** | Baja | Alto | Crear environment aislado, usar Docker container |
| **OCR accuracy insuficiente** | Baja | Medio | Probar múltiples OCR engines (Tesseract, EasyOCR), fine-tune confidence threshold |
| **Fallback no funciona correctamente** | Baja | Crítico | Integration tests exhaustivos, monitoreo en producción |
| **Costo computacional alto** | Media | Medio | Rate limiting, queue system para procesamiento batch |

## Timeline Estimado

**Inicio:** Post-R1 deployment (estimado 2025-11-15)
**Duración:** 2-3 semanas
**Esfuerzo:** 50-60 horas

**Fases:**
1. **Semana 1:** ST1 PoC + ST2 Integration (20-25h)
2. **Semana 2:** ST3 Configuration + ST4 Quality Benchmarks (15-20h)
3. **Semana 3:** ST5 Performance + Documentation + Code Review (15-20h)

## ROI Analysis

**Inversión:** 50-60h desarrollo + QA
**Beneficio:** +42% mejora calidad RAG, reducción 60% support tickets de "RAG da respuestas incorrectas"
**ROI:** 200-300% en 3 meses

**Métricas de Éxito:**
- Reducción de support tickets: -60%
- User satisfaction: +40%
- Document processing accuracy: +42%

## Referencias

### Documentación Externa
- **Docling GitHub:** https://github.com/DS4SD/docling
- **Docling Docs:** https://ds4sd.github.io/docling/
- **Paper:** "Docling Technical Report" (arXiv:2408.09869)

### Documentación Interna
- **T-04 STATUS:** docs/tasks/T-04-STATUS.md (tarea padre RAG pipeline)
- **T-48 Emergent Work:** docs/project-management/emergent/DOCLING-INTEGRATION.md
- **Current Extractor:** backend/app/services/text_extractor.py (pypdf baseline)

---

**Última Actualización:** 2025-10-08 16:00 UTC
**Responsable:** Backend Team Lead
**Reviewer:** Architecture Team
**Estado:** Planificado (Post-R1)
