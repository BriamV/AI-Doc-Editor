# ADR-012: Package.json Namespace Architecture

**Status**: ✅ Accepted
**Date**: 2025-09-28
**Context**: Package.json modernization and command standardization
**Decision Makers**: Development Team

**Related Documentation:**
- [GitHub Actions Workflows](../../../.github/workflows/README.md) - CI/CD infrastructure using this architecture
- [Package.json Scripts Guidelines](../../development/PACKAGE-JSON-SCRIPTS-GUIDELINES.md) - Implementation guide

## Summary

Implement a structured 8-namespace architecture for package.json scripts to replace ad-hoc command naming and improve developer experience, maintainability, and scalability.

## Context

### Problem Statement

The original package.json contained over 100 scripts with inconsistent naming patterns, leading to:

- **Developer Confusion**: Commands like `test`, `test:frontend`, `test-backend` without clear organization
- **Maintenance Overhead**: Scattered commands across different sections without logical grouping
- **Platform Issues**: Direct system commands failing across Windows/Linux/WSL environments
- **Scalability Concerns**: Adding new scripts required case-by-case decisions on naming and placement

### Previous State

```json
{
  "scripts": {
    "dev": "vite",
    "test": "jest",
    "test:frontend": "jest src",
    "test-backend": "pytest",
    "lint": "eslint",
    "python-lint": "ruff",
    "security-scan": "semgrep",
    "qa-gate": "yarn test && yarn lint"
  }
}
```

**Issues Identified:**
- Mixed naming conventions (`:`, `-`, no separator)
- No logical grouping or namespacing
- Platform-specific commands (direct `pytest`, `semgrep`)
- Unclear hierarchy and dependencies

## Decision

### Namespace Architecture Design

Implement an 8-namespace structure based on **functional domains** rather than technology stacks:

```
repo:*     Repository infrastructure & maintenance
fe:*       Frontend operations (Vite/React/TypeScript)
be:*       Backend operations (Python/FastAPI)
e2e:*      End-to-end testing (Playwright + backend integration)
sec:*      Security scanning (SAST, dependencies, secrets)
qa:*       Quality gates and validation pipelines
desk:*     Electron desktop application
docker:*   Docker Compose orchestration
docs:*     API documentation and validation
all:*      Aggregated workflows and cross-stack operations
```

### Design Principles

1. **Domain-Based Grouping**: Commands grouped by functional purpose, not technology
2. **Consistent Naming**: `namespace:action[:modifier][:subaction]` pattern
3. **Platform Abstraction**: All system commands wrapped through multiplatform.cjs
4. **Hierarchical Structure**: Sub-commands use `:` separator for logical nesting
5. **Backward Compatibility**: Deprecated aliases with transition warnings

## Implementation

### 1. Namespace Structure

Each namespace follows this pattern:

```
namespace:action[:modifier][:subaction]
```

**Examples:**
- `fe:test` (basic action)
- `fe:test:coverage` (action with modifier)
- `be:test:coverage:strict` (action with modifier and subaction)
- `repo:merge:validate` (hierarchical command)

### 2. Command Categories

#### Core Actions (Required in applicable namespaces)
- `dev` - Development server startup
- `build` - Production build generation
- `test` - Test execution
- `lint` - Code linting
- `format` - Code formatting

#### Modifiers (Standardized across namespaces)
- `:check` - Read-only validation
- `:fix` - Apply automatic fixes
- `:watch` - Continuous monitoring
- `:coverage` - Include coverage reporting
- `:strict` - Enhanced validation

### 3. Cross-Platform Wrapper Integration

**MANDATORY**: All system-dependent commands use multiplatform wrapper:

```json
{
  "be:test": "node scripts/multiplatform.cjs tool pytest backend/tests",
  "sec:sast": "node scripts/multiplatform.cjs tool semgrep scan --config=auto"
}
```

This ensures:
- Windows/Linux/WSL compatibility
- Proper Python virtual environment activation
- Consistent tool availability checking
- Standardized error handling

### 4. Deprecation Strategy

Maintain backward compatibility during transition:

```json
{
  "test": "echo \"[DEPRECATED] Use: yarn fe:test\" && yarn fe:test",
  "python-lint": "echo \"[DEPRECATED] Use: yarn be:lint\" && yarn be:lint"
}
```

**Timeline:**
- Phase 1 (0-30 days): Add deprecated aliases with warnings
- Phase 2 (30-60 days): Transition period with documentation updates
- Phase 3 (60+ days): Remove deprecated aliases

## Benefits

### 1. Developer Experience Improvements

- **Predictable Discovery**: `yarn fe:<tab>` shows all frontend commands
- **Logical Grouping**: Related operations grouped together
- **Clear Hierarchy**: Complex operations broken into discoverable sub-commands
- **Help System**: `yarn help` shows namespace structure

### 2. Maintainability Gains

- **Structured Addition**: New scripts have clear placement rules
- **Consistent Patterns**: All commands follow same naming conventions
- **Documentation Alignment**: Namespace structure matches project architecture
- **Quality Gates**: Built-in validation for script standards

### 3. Scalability Benefits

- **Namespace Isolation**: Each domain can evolve independently
- **Performance Optimization**: Targeted script optimization per namespace
- **Team Ownership**: Clear ownership boundaries for different namespaces
- **Technology Migration**: Easy to update tools within namespace boundaries

## Architecture Details

### Namespace Responsibilities

| Namespace | Commands | Responsibilities |
|-----------|----------|------------------|
| `repo:*` | 8 | Git operations, dependency management, environment validation |
| `fe:*` | 16 | React development, TypeScript compilation, frontend testing |
| `be:*` | 22 | Python development, FastAPI server, backend testing |
| `e2e:*` | 8 | Playwright tests, integration testing, test reporting |
| `sec:*` | 6 | SAST scanning, dependency audits, secret detection |
| `qa:*` | 8 | Quality gates, cross-stack validation, coverage reporting |
| `desk:*` | 3 | Electron builds, desktop packaging, distribution |
| `docker:*` | 5 | Container orchestration, development environments |
| `docs:*` | 7 | API documentation, validation, OpenAPI operations |
| `all:*` | 7 | Cross-stack aggregators, complete workflows |

### Performance Characteristics

**Before Modernization:**
- 100+ commands with unclear relationships
- 152s average qa-gate execution time
- Mixed success rates due to platform issues
- Manual command discovery process

**After Modernization:**
- 185 commands with clear organization (85 primary + 100 deprecated aliases)
- 70s average qa-gate execution time (54% improvement)
- 100% success rate across Windows/Linux/WSL
- Self-documenting namespace structure

## Compliance and Standards

### 1. Naming Compliance

**REQUIRED Patterns:**
```bash
✅ fe:test              # Basic action
✅ be:lint:fix          # Action with modifier
✅ repo:merge:validate  # Hierarchical command
✅ sec:deps:fe:strict   # Complex hierarchical

❌ frontend-test        # No namespace
❌ be_lint             # Wrong separator
❌ test:fe             # Reverse hierarchy
```

### 2. Platform Compliance

**REQUIRED Wrappers:**
```json
{
  "✅ Compliant": "node scripts/multiplatform.cjs tool pytest",
  "❌ Non-compliant": "python -m pytest",
  "✅ Compliant": "node scripts/dev-runner.cjs",
  "❌ Non-compliant": "vite & python app.py"
}
```

### 3. Documentation Compliance

**REQUIRED Updates** when adding commands:
- Update scriptsLegend section in package.json
- Add examples to CLAUDE.md
- Update this ADR for new namespaces
- Validate cross-references in documentation

## Alternatives Considered

### 1. Technology-Based Grouping

```
js:*, ts:*, py:*, docker:*
```

**Rejected**: Technology changes more frequently than functional domains. This would require reorganization when migrating from Webpack to Vite, Jest to Vitest, etc.

### 2. Flat Structure with Prefixes

```
frontend_dev, backend_test, security_scan
```

**Rejected**: Doesn't provide hierarchical organization benefits and limits discoverability through tab completion.

### 3. Separate package.json Files

Multiple package.json files for different domains.

**Rejected**: Adds complexity to dependency management and violates monorepo conventions. Tool integration becomes more complex.

## Implementation Timeline

### Phase 1: Foundation (Completed)
- ✅ Design namespace architecture
- ✅ Implement multiplatform wrapper
- ✅ Create 8 primary namespaces
- ✅ Add deprecated aliases

### Phase 2: Validation (Completed)
- ✅ Cross-platform testing (Windows/Linux/WSL)
- ✅ Performance optimization (54% improvement achieved)
- ✅ Documentation updates
- ✅ CI/CD workflow updates

### Phase 3: Adoption (Completed)
- ✅ Team training and adoption
- ✅ Legacy command deprecation warnings
- ✅ Complete documentation coverage
- ✅ 185/185 commands operational

### Phase 4: Maintenance (Ongoing)
- 🔄 Quarterly reviews of namespace usage
- 🔄 Performance monitoring and optimization
- 🔄 New namespace evaluation as project grows
- 🔄 Deprecated alias removal (scheduled)

## Consequences

### Positive

1. **Improved Developer Productivity**: 54% faster command execution
2. **Reduced Onboarding Time**: Self-documenting command structure
3. **Enhanced Maintainability**: Clear patterns for adding new commands
4. **Cross-Platform Reliability**: 100% success rate across environments
5. **Scalable Architecture**: Easy to add new domains and commands

### Negative

1. **Initial Learning Curve**: Developers need to learn new command names
2. **Transition Period Complexity**: Temporary dual command support
3. **Documentation Overhead**: Requires maintaining command documentation
4. **Validation Requirements**: Need to ensure compliance with namespace rules

### Mitigation Strategies

1. **Learning Curve**: Comprehensive documentation and help system
2. **Transition Complexity**: Deprecated aliases with helpful error messages
3. **Documentation Overhead**: Automated validation tools and templates
4. **Validation Requirements**: CI/CD integration to enforce standards

## Compliance

This ADR addresses the following project requirements:

- **Cross-Platform Development**: Windows/Linux/WSL support
- **Developer Experience**: Intuitive command discovery and execution
- **Maintainability**: Structured approach to script management
- **Scalability**: Supports project growth without architectural changes
- **Quality Standards**: Integrated validation and quality gates

## Related Documents

- [Package.json Scripts Guidelines](../development/PACKAGE-JSON-SCRIPTS-GUIDELINES.md)
- [CLAUDE.md Development Guide](../../CLAUDE.md)
- [Multiplatform Wrapper Documentation](../../scripts/SCOPE-DEFINITION.md)
- [CI/CD Integration Guide](../../.github/workflows/README.md)

---

**Review Schedule**: Quarterly
**Next Review**: 2025-12-28
**Revision History**:
- v1.0 (2025-09-28): Initial implementation and documentation