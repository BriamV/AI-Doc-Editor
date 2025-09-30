# ADR-004: Defer Pydantic v2 Migration to Backend Implementation Phase

## Status

Accepted

## Context

Task T-01.6 originally specified migrating existing Pydantic v1 code to v2 with performance benchmarks. However, comprehensive analysis reveals:

**Current Architecture**:

- Frontend-only application (React + TypeScript + Electron)
- No existing Python backend or FastAPI implementation
- No existing Pydantic models (v1 or v2)
- No requirements.txt or Python dependencies

**Original T-01.6 Requirements**:

- Migrate all models to `pydantic.BaseModel` v2
- Create `requirements-prod.txt` with frozen dependencies
- Add CI benchmark failing if improvement < 3x vs v1

**Problem**: Cannot migrate code that doesn't exist.

## Decision

**DEFER T-01.6** until backend implementation begins (R1 phase) and **start directly with Pydantic v2**.

### Rationale:

1. **No Migration Needed**: No existing Pydantic v1 code to migrate
2. **Start Clean**: Implement backend with Pydantic v2 from the beginning
3. **Avoid Premature Work**: Creating skeleton code now would be wasteful
4. **Align with Architecture**: PRD indicates backend development in R1-R2

### Implementation Strategy:

- **R0**: Complete remaining tasks (T-17, T-23, T-43) without backend
- **R1**: When implementing FastAPI backend (T-02, T-04, T-05), use Pydantic v2 directly
- **Performance**: Benchmark against theoretical v1 baseline during R1

## Consequences

### Positive:

- Avoids unnecessary migration work
- Ensures modern stack from day one
- Aligns with natural development progression
- Maintains focus on current priorities

### Trade-offs:

- T-01 shows 5/6 completion instead of 6/6
- Benchmark comparison will be theoretical vs actual migration
- Defers validation of ADR-001 assumptions

### Future Actions:

- Update backend tasks (T-02, T-04, T-05) to specify Pydantic v2
- Include performance validation in R1 acceptance criteria
- Document v2 readiness in backend implementation

## Related Decisions

- **ADR-001**: Adoptar Pydantic v2 (decision reinforced)
- **ADR-003**: Baseline CI/CD (foundation ready for backend integration)
- **WORK-PLAN v5**: R0.WP1 completion strategy

## Implementation Notes

- Backend placeholder in docker-compose.yml already prepared
- Future backend tasks assume Pydantic v2 from start
- CI/CD pipeline ready for Python backend integration

---

**Approved by**: Tech Lead  
**Date**: 2025-06-25  
**Related Tasks**: T-01.6 (deferred), T-02, T-04, T-05 (future backend)
