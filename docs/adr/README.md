# Architecture Decision Records (ADR)

This directory contains Architecture Decision Records (ADRs) for the AI-Doc-Editor project.

## Current ADRs

| ID | Title | Status | Date | Related Tasks |
|----|-------|--------|------|---------------|
| [ADR-000](ADR-000-template.md) | Template for ADRs | Template | - | - |
| [ADR-001](ADR-001-pydantic-v2-validation.md) | Adoptar Pydantic v2 como capa de validación | Accepted | 2025-06-24 | T-01 |
| [ADR-002](ADR-002-defer-orchestrators.md) | Posponer adopción de orquestadores | Accepted | 2025-06-24 | T-47 |
| [ADR-003](ADR-003-baseline-ci-cd.md) | Baseline CI/CD Pipeline Implementation | Accepted | 2025-06-25 | T-01 |
| [ADR-004](ADR-004-pydantic-v2-deferral.md) | Defer Pydantic v2 Migration to Backend Phase | Accepted | 2025-06-25 | T-01.6 |
| [ADR-005](ADR-005-api-key-model.md) | API Key Model Architecture | Proposed | 2025-06-25 | T-02, T-12, T-41 |
| [ADR-006](ADR-006-dependency-security-scanning.md) | Dependency Security Scanning Implementation | Accepted | 2025-06-25 | T-43 |

## Process

1. **Creating a new ADR**: Copy `ADR-000-template.md` to `ADR-XXX-descriptive-title.md`
2. **Numbering**: Use sequential numbering based on creation date (ADR-001, ADR-002, etc.)
3. **Status**: Start with "Proposed", move to "Accepted" after approval
4. **Review**: All ADRs must be reviewed by Tech Lead before acceptance
5. **Linking**: Always link to related PRD requirements and WORK-PLAN tasks

## Guidelines

- Use clear, concise language
- Include context and alternatives considered
- Document consequences and trade-offs
- Update this README when adding new ADRs
- Reference relevant tasks from WORK-PLAN v5.md
- Link to PRD v2.md requirements where applicable

## ADR Chronological Order

The ADRs are numbered in **chronological order** based on creation date:

1. **ADR-001 & ADR-002** (2025-06-24): Initial architectural decisions created during project planning
2. **ADR-003** (2025-06-25): CI/CD foundation implementation 
3. **ADR-004** (2025-06-25): Pydantic v2 migration deferral decision
4. **ADR-005** (2025-06-25): API key management architecture (proposed)
5. **ADR-006** (2025-06-25): Security scanning implementation

## Related Documentation

- [PRD v2.md](../PRD%20v2.md) - Product requirements
- [WORK-PLAN v5.md](../WORK-PLAN%20v5.md) - Task breakdown and dependencies
- [DESIGN_GUIDELINES.md](../DESIGN_GUIDELINES.md) - Technical standards

## Next ADR Number

The next ADR should be numbered **ADR-007** following the chronological sequence.