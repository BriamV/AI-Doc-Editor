# ADR-009: QA CLI Direct Linters Architecture

## Status

Proposed

## Context

El análisis exhaustivo documentado en `qa-analysis-logs/MEGALINTER-vs-DIRECT-LINTERS-UNIFIED-ANALYSIS.md` reveló problemas críticos con la arquitectura inicial del QA CLI basada en MegaLinter:

1. **Performance Issues**: MegaLinter requiere 4GB Docker overhead vs 80MB herramientas nativas
2. **Startup Latency**: 30-60s inicialización Docker vs 2-5s ejecución directa 
3. **Hardcoded Bugs**: MegaLinter 8.8.0 tiene bug confirmado con ESLint flat config (GitHub Issue #3570)
4. **Debugging Complexity**: 3-layer abstraction (MegaLinterWrapper → MegaLinterExecutor → Docker) vs ejecución directa
5. **Resource Consumption**: 50x mayor uso de recursos sin beneficio técnico demostrable

El análisis de stack composition del proyecto (610 archivos fuente):
- JavaScript/TypeScript: 55.1% (336 archivos)
- Python: 4.1% (25 archivos) 
- Documentation: 16.7% (102 archivos)
- Configuration: 5.7% (35 archivos)

## Decision

Migrar la arquitectura del QA CLI de **MegaLinter Orchestration** a **Direct Linters Orchestration**:

### Stack-Specific Tools:
- **JavaScript/TypeScript**: ESLint flat config + Prettier
- **Python**: Ruff (10-100x más rápido que Pylint) + Black
- **Documentation**: markdownlint-cli2 (usa mismo engine que MegaLinter internamente)
- **Configuration**: yamllint + jsonlint
- **Tooling Scripts**: ESLint flat config para .cjs files + ShellCheck para .sh files

### Architecture:
- Orquestador inteligente nativo en Node.js
- Auto-detección de stacks por proyecto
- Configuración nativa por herramienta (no Docker wrapper)
- Ejecución paralela con control de concurrencia

## Consequences

### Beneficios:
- **Performance**: 50x reducción en uso de recursos (4GB → 80MB)
- **Speed**: 10x más rápido (30-60s → 2-5s startup)
- **Reliability**: Eliminación de bugs hardcoded de MegaLinter
- **Maintainability**: Debugging directo sin capas de abstracción
- **Coverage**: Mejor soporte para .cjs files con ESLint flat config

### Riesgos:
- **Migration Effort**: Refactoring de wrappers existentes
- **Configuration Management**: Múltiples archivos de config vs uno centralizado
- **Tool Version Management**: Sincronización manual vs orquestación automática

### Mitigación de Riesgos:
- Mantener interface común para todos los wrappers
- **Reutilizar configuraciones existentes**: Migrar directrices de `.mega-linter.yml` a archivos nativos
- Usar package.json para version pinning

### Configuration Migration Strategy:
- **Legacy Artifacts**: `.mega-linter.yml` y `.mega-linter.yml.backup` serán **descontinuados** post-migración
- **Migration Path**: Extraer reglas de `.mega-linter.yml` (complexity:10, max-lines:212, max-len:100) hacia configs nativos
- **Target Configs**: `eslint.config.js`, `pyproject.toml`, `.pylintrc` (existentes) + configs nuevos según necesidad
- **Cleanup**: Remover `.mega-linter.yml` una vez validada la migración completa

### Governance & Validation:
- **Single Source of Truth**: PRD v2.0 es la fuente de verdad final para todos los requisitos
- **Validation Priority**: Toda implementación debe validarse contra PRD, no contra artefactos técnicos intermedios
- **Document Hierarchy**: PRD → ADR → Configs técnicos → Implementación

## Alternatives Considered

1. **Hybrid Approach**: MegaLinter para Python/Docs, Direct para JS/TS
   - Rechazado: Mantiene overhead Docker sin beneficios
   - Score: 4.60/5 vs 4.75/5 Direct Linters

2. **MegaLinter Fix**: Intentar resolver bugs hardcoded
   - Rechazado: Problema upstream fuera de control del proyecto
   - Overhead fundamental Docker persiste

3. **Status Quo**: Mantener MegaLinter actual
   - Rechazado: RF-003 moderate issues no resolubles con arquitectura actual

## Related Decisions

- Links to related ADRs: ADR-008 (QA Workflow Enhancement)
- Links to PRD requirements addressed: RF-003 (Error Detection), RF-004 (Stack Validation)
- Links to tasks in WORK-PLAN: T-13 (Definition of Done), T-14 (CI/CD Integration), T-15 (Feedback System)

---

**Evidence Documentation:**
- Forensic Analysis: `qa-analysis-logs/eslint-cjs-forensic-investigation/`
- Unified Analysis: `qa-analysis-logs/MEGALINTER-vs-DIRECT-LINTERS-UNIFIED-ANALYSIS.md`
- Performance Benchmarks: Documented in unified analysis with specific metrics
- Industry Validation: 2024 tooling standards research confirming direct linter superiority