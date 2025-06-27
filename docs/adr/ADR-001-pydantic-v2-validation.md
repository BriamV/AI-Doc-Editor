# ADR-001: Adoptar Pydantic v2 como capa de validación

## Status

Accepted

## Date

2025-06-24

## Context

El proyecto requerirá un sistema robusto de validación de datos para la implementación del backend en R1. FastAPI 3.11+ ya soporta Pydantic v2, que ofrece mejoras significativas en rendimiento comparado con v1.

### Requirements Analysis

- **Performance Requirements**: Los KPIs del proyecto requieren p95 ≤ 20s para generación de documentos
- **Validation Needs**: API endpoints, document schemas, user data validation
- **Integration Requirements**: Compatibilidad con FastAPI, Guardrails, e Instructor para AI workflows

### Current State

- **Frontend-only**: No backend validation implementado actualmente
- **Future Backend**: Python/FastAPI backend planificado para R1
- **AI Integration**: Necesidad de validación estructurada para AI outputs

## Decision

**Adoptar Pydantic v2 como capa de validación estándar** para el backend cuando se implemente en R1:

### Implementation Strategy

1. **Migration Approach**: Implementar directamente con Pydantic v2 (no migrar desde v1)
2. **Model Organization**: Centralizar todos los modelos en `models/*.py` modules
3. **Performance Validation**: Añadir benchmarks en CI que verifiquen mejora ≥3x vs alternativas
4. **Dependency Management**: Congelar versiones en `requirements-prod.txt`

### Technical Specifications

- **Version**: Pydantic v2.x (latest stable)
- **Integration**: Native FastAPI integration
- **Validation**: Declarative validation patterns
- **Serialization**: Leveraging v2 performance improvements

## Alternatives Considered

### A. Pydantic v1

- **Pros**: Más estable, amplia compatibilidad
- **Cons**: Performance 5-8x inferior, menos features
- **Decision**: Rejected - performance requirements

### B. Marshmallow

- **Pros**: Alternativa establecida, flexible
- **Cons**: Menos integración con FastAPI, performance inferior
- **Decision**: Rejected - ecosystem integration

### C. Manual validation

- **Pros**: Control completo, sin dependencias
- **Cons**: Código ad-hoc, maintenance overhead, error-prone
- **Decision**: Rejected - development velocity

## Consequences

### Positive

- **Performance**: 5-8x mejora en serialización respecto a v1
- **Development Velocity**: Menos código ad-hoc de validación
- **AI Integration**: Compatibilidad directa con Guardrails e Instructor
- **Type Safety**: Tipado estricto y validación declarativa
- **FastAPI Integration**: Compatibilidad nativa y automática

### Negative

- **Learning Curve**: Developers need to learn Pydantic v2 patterns
- **Dependency**: Additional dependency in backend stack
- **Migration Risk**: Si se requiere migration desde v1 en futuro

### Risk Mitigation

- **Performance Monitoring**: CI benchmarks para validar performance gains
- **Documentation**: Clear patterns and examples for team
- **Version Pinning**: Dependency freezing para evitar breaking changes

## Implementation Details

### Project Structure

```
backend/
├── models/
│   ├── user.py          # User-related schemas
│   ├── document.py      # Document schemas
│   ├── auth.py          # Authentication schemas
│   └── common.py        # Shared base models
├── api/
│   └── endpoints/       # FastAPI endpoints using models
└── requirements-prod.txt # Pinned dependencies
```

### Performance Requirements

- **Benchmark Target**: ≥3x performance improvement vs manual validation
- **CI Integration**: Automated performance tests in quality gate
- **Monitoring**: Production performance tracking

## Related Documents

- [T-01 Requirements](../WORK-PLAN%20v5.md) - Backend foundation task
- [ADR-004](ADR-004-pydantic-v2-deferral.md) - Deferral decision para T-01.6
- [Backend Architecture](../ARCH-GAP-ANALYSIS.md) - Technical gap analysis

## Related Tasks

- T-01: Baseline & CI/CD (validation infrastructure)
- Future R1 tasks: Backend implementation with Pydantic v2

## Notes

- **Implementation Timing**: Deferred to R1 backend phase per ADR-004
- **Team Decision**: Agreed 2025-06-24 durante planning phase
- **Review Trigger**: Re-evaluate if performance requirements change significantly
