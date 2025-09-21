# ADR-008: QA Workflow Enhancement and DoD Validation

## Status

Accepted

## Context

The project's task management tools in the `tools/` directory were functional for basic status tracking but lacked proper Quality Assurance (QA) validation mechanisms. This created a critical gap where tasks could be marked as "Completado 100%" without actually satisfying their Definition of Done (DoD) criteria.

### Problems Identified

1. **No QA Gate Enforcement**: Tasks marked complete without validating DoD requirements
2. **Binary Status Model**: Only "Pendiente", "En progreso", and "Completado" states
3. **Missing Validation**: No automated checks for qa-gate, tests, security, build status
4. **Integrity Issues**: "Complete" status didn't guarantee actual completion quality

### Business Impact

- **Risk**: Features shipped without proper testing/validation
- **Quality**: Potential regressions and security vulnerabilities
- **Trust**: Development team couldn't rely on task completion status
- **Efficiency**: Manual verification required for every "completed" task

## Decision

Implement an enhanced QA workflow system with multi-state task progression and automated Definition of Done (DoD) validation.

### Implementation Components

#### 1. Enhanced State Model

Replace the 3-state model with an 8-state model:

```
⏳ Pendiente
🔄 En progreso
🚧 Desarrollo Completado - Listo para QA
🧪 En QA/Testing
❌ QA Failed - Requiere correcciones
✅ QA Passed - Listo para Review
📋 En Review
✅ Completado 100% - DoD Satisfied
```

#### 2. New Tools Implementation

- **`qa-workflow.sh`**: Multi-state workflow management
- **`validate-dod.sh`**: Automated DoD criteria validation

#### 3. Automated DoD Validation

The system now validates:
- Code Quality (yarn run cmd qa-gate)
- Tests Status (yarn run cmd test)
- Security Scan (yarn run cmd security-scan)
- Build Status (yarn run cmd build)
- Subtasks Completion (visual ✅ tracking)

#### 4. Integration with Existing Tools

- Enhanced `extract-subtasks.sh` with visual progress (✅/⏳)
- Updated `mark-subtask-complete.sh` with automatic progress calculation
- Maintained backward compatibility with existing `status-updater.sh`

### Workflow Integration

```bash
# Development Phase
tools/qa-workflow.sh T-02 dev-complete

# QA Phase with Automated Validation
tools/validate-dod.sh T-02

# Only if all validations pass:
tools/qa-workflow.sh T-02 mark-complete
```

## Consequences

### Positive Outcomes

1. **Quality Assurance**: Guaranteed DoD satisfaction before task completion
2. **Process Integrity**: Impossible to mark tasks complete without validation
3. **Automated Validation**: Reduces manual verification overhead
4. **Better Visibility**: Clear distinction between "coded" and "complete"
5. **Risk Mitigation**: Prevents shipping unvalidated features

### Potential Challenges

1. **Learning Curve**: Developers need to adopt new workflow commands
2. **Process Overhead**: Additional steps before marking tasks complete
3. **Tool Dependency**: Validation depends on qa-gate, test, and security commands
4. **Backward Compatibility**: Need to maintain existing simple status updates

### Trade-offs Accepted

- **More Steps**: Accept additional workflow complexity for quality assurance
- **Tool Dependencies**: Accept dependency on yarn commands for comprehensive validation
- **Documentation Overhead**: Additional ADR and documentation maintenance

## Alternatives Considered

### Option 1: Manual QA Checklist
- **Pros**: Simple, no tooling required
- **Cons**: Error-prone, not enforced, manual verification burden
- **Rejected**: Doesn't solve automation requirement

### Option 2: Git Hook Integration
- **Pros**: Automatic validation on commits
- **Cons**: Too rigid, doesn't match task-based workflow
- **Rejected**: Mismatch with current development process

### Option 3: CI/CD Integration Only
- **Pros**: Leverages existing CI pipeline
- **Cons**: No task-level validation, binary pass/fail
- **Rejected**: Insufficient granularity for task management

## Related Decisions

### Requirements Addressed
- **PRD v2.md**: Quality assurance and development process improvements
- **WORK-PLAN v5.md**: Task T-01 baseline CI/CD enhancement scope expansion

### Tasks Impacted
- **T-01**: Baseline & CI/CD (Enhanced with QA workflow)
- **All Future Tasks**: Now follow enhanced QA validation process

### Documentation Updates
- **CLAUDE.md**: Updated with new QA workflow commands
- **tools/README.md**: Enhanced with QA workflow documentation
- **DEVELOPMENT-STATUS.md**: Updated with current workflow status

### Related ADRs
- **ADR-003**: Baseline CI/CD (Foundation for this enhancement)
- **ADR-006**: Security (Security validation integration)

---

**Decision Date**: 2025-06-30  
**Affected Components**: tools/, docs/, development workflow  
**Implementation Status**: Complete  
**Review Date**: Post R0.WP2 completion