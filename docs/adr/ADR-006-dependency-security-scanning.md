# ADR-006: Dependency Security Scanning Implementation

## Status

Accepted

## Date

2025-06-25

## Context

Task T-43 "Implementar Escaneo de Dependencias" requires implementing Software Composition Analysis (SCA) tools to automatically detect and prevent known vulnerabilities (CVEs) and license conflicts in open-source dependencies as part of the CI pipeline.

### Requirements (from WORK-PLAN v5.md)

- **Objective**: Integrate SCA tools into CI pipeline to detect/prevent CVEs and license conflicts
- **Security Requirement SEC-005**: Maintain ≤ 25 production dependencies with 0 critical CVEs in CI pipeline
- **Critical Priority**: Part of Release 0 foundational security

### Current State

- Frontend-only React/TypeScript application with Node.js dependencies
- No Python backend currently exists (may be added in R1)
- GitHub Actions CI/CD pipeline established (T-01)
- No dependency vulnerability scanning in place

## Decision

**Implement comprehensive dependency security scanning with the following approach:**

### 1. Tools Selection

- **yarn audit**: Built-in Node.js vulnerability scanner (audit-level=high)
- **pip-audit**: Python dependency scanner (conditional - only if pip available)
- **License reporting**: Generate yarn dependency license inventory

### 2. CI/CD Integration

- Integrate security scanning into existing GitHub Actions quality-gate job
- **Blocking Policy**: Fail build on HIGH or CRITICAL severity vulnerabilities
- Generate security reports as CI artifacts with 30-day retention

### 3. Implementation Phases

1. **Immediate (R0)**: yarn audit integration with build-blocking policy
2. **Conditional**: pip-audit for future Python backend dependencies
3. **Reporting**: Automated license compatibility reports

### 4. Quality Gate Enhancement

- Extend existing qa-gate Makefile target to include security scanning
- Add dedicated `security-scan` and `security-report` Makefile targets
- Maintain T-01 quality gate structure while adding T-43 security layer

## Alternatives Considered

### A. Third-party SCA tools (Snyk, FOSSA)

- **Pros**: More advanced features, better reporting
- **Cons**: External dependencies, potential costs, complexity for R0 phase
- **Decision**: Defer to R1, use built-in tools for foundation

### B. Dependency pinning without scanning

- **Pros**: Simple, deterministic builds
- **Cons**: Doesn't detect vulnerabilities in pinned versions
- **Decision**: Rejected - doesn't meet SEC-005 requirements

### C. Manual dependency reviews

- **Pros**: Human oversight
- **Cons**: Not scalable, error-prone, doesn't integrate with CI
- **Decision**: Rejected - doesn't provide automated protection

## Consequences

### Positive

- **Security Foundation**: Establishes automated vulnerability detection for R0
- **CI Integration**: Seamlessly extends existing quality gate (T-01)
- **SEC-005 Compliance**: Addresses critical security gap in architecture
- **Progressive Enhancement**: Ready for advanced SCA tools in future releases
- **Zero Critical CVEs**: Enforces security policy automatically

### Negative

- **Build Fragility**: May break builds when new vulnerabilities are disclosed
- **Limited Python Coverage**: pip-audit conditional on Python presence
- **Tool Limitations**: Built-in tools less comprehensive than commercial alternatives

### Mitigation Strategies

- **Emergency Override**: Document process for critical vulnerability exceptions
- **Monitoring**: Regular dependency updates to minimize vulnerability exposure
- **Documentation**: Clear troubleshooting guides for security scan failures

## Implementation Details

### GitHub Actions Integration

```yaml
- name: Run yarn audit (Node.js dependencies)
  run: yarn audit --audit-level=high || exit 1

- name: Run pip-audit (Python dependencies)
  run: pip-audit --format=json --output=pip-audit-report.json || exit 1
```

### Makefile Targets

- `make security-scan`: Run all dependency scans with build-fail policy
- `make security-report`: Generate reports without failing build
- `make qa-gate`: Enhanced to include T-43 security scanning

### Artifact Generation

- `yarn-licenses.json`: Node.js dependency license inventory
- `pip-audit-report.json`: Python vulnerability scan results (if applicable)

## Related Documents

- [T-43 Requirements](../WORK-PLAN%20v5.md) - Task specification and acceptance criteria
- [SEC-005](../PRD%20v2.md) - Security requirement for dependency management
- [ADR-003](ADR-003-baseline-ci-cd.md) - Baseline CI/CD pipeline this extends

## Related Tasks

- T-01: Baseline & CI/CD (dependency)
- T-43: Implementar Escaneo de Dependencias (this ADR)
- Future R1 tasks: Backend implementation with Python dependencies
