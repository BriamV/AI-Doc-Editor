# Interface Contracts: scripts/ ↔ tools/ Integration

## ⚠️ Status Notice

**Current Status**: Critical cross-cutting architecture specification
**Purpose**: Define formal interface contracts between scripts/ and tools/ directories
**Role**: Strategic architecture documentation for directory-level integration patterns

## Overview

This document establishes formal interface contracts between the `scripts/` (infrastructure layer) and `tools/` (task management layer) directories. These contracts ensure reliable communication, consistent data exchange, and maintainable integration patterns across the project's utility ecosystem.

## 🏗️ Architecture Context

### **Directory Positioning**

| Directory | Role | Technology | Interface Layer |
|-----------|------|------------|----------------|
| **scripts/** | Infrastructure Services | Node.js (CJS) | Platform abstraction, quality gates |
| **tools/** | Task Management | Bash/Shell | Business logic, workflow orchestration |

### **Conway's Law Compliance**

- **Implementation Separation**: Infrastructure utilities separated from business logic
- **Technology Boundaries**: Clear technology stack separation (Node.js vs Bash)
- **Communication Protocols**: Standardized data exchange through defined interfaces
- **Organizational Alignment**: Directory structure mirrors team responsibilities

## 📋 Interface Contract Specification

### **Contract 1: Task Data Exchange Protocol**

#### **Interface Definition**
```bash
# Standard interface for task data queries
scripts/multiplatform.cjs → tools/database-abstraction.sh
```

#### **Data Exchange Format**
```yaml
# Task metadata structure (standardized across both directories)
task_metadata:
  task_id: string           # Format: T-XX
  estado: string           # Standard status values
  complejidad: number      # 1-10 complexity scale
  prioridad: string        # alta|media|baja
  release_target: string   # Release identifier
  created_date: ISO8601    # Creation timestamp
  modified_date: ISO8601   # Last modification
```

#### **Communication Pattern**
```bash
# Query interface (tools/ → scripts/)
DATABASE_MODE="hybrid" tools/database-abstraction.sh get_task_data T-XX metadata

# Status update interface (tools/ → scripts/)
tools/qa-workflow.sh T-XX dev-complete → calls scripts/multiplatform.cjs validation
```

#### **Error Handling Protocol**
```bash
# Standard error codes
EXIT_CODE_SUCCESS=0         # Operation completed successfully
EXIT_CODE_NOT_FOUND=1      # Task/resource not found
EXIT_CODE_INVALID_PARAM=2  # Invalid parameters provided
EXIT_CODE_SYSTEM_ERROR=3   # System/infrastructure error
EXIT_CODE_AUTH_ERROR=4     # Permission/authentication error
```

### **Contract 2: Platform Abstraction Interface**

#### **Interface Definition**
```bash
# Cross-platform execution interface
tools/* → scripts/multiplatform.cjs
```

#### **Standard Command Patterns**
```bash
# Python tool execution (tools/ calling scripts/)
scripts/multiplatform.cjs tool <tool_name> [args...]

# Environment validation (tools/ dependency on scripts/)
scripts/multiplatform.cjs validate → JSON diagnostics output

# Bootstrap operations (tools/ triggering scripts/)
scripts/multiplatform.cjs bootstrap → environment setup
```

#### **Response Format Specification**
```json
{
  "status": "success|error|warning",
  "exitCode": 0,
  "timestamp": "2024-01-01T00:00:00Z",
  "operation": "tool|validate|bootstrap",
  "data": {
    "platform": "win32|linux|darwin",
    "environment": "validated|needs_setup|error",
    "tools": {
      "python": { "available": true, "version": "3.11.0" },
      "venv": { "available": true, "path": "backend/.venv" }
    }
  },
  "errors": [],
  "warnings": []
}
```

### **Contract 3: Quality Gate Integration Protocol**

#### **Interface Definition**
```bash
# Quality validation interface
tools/qa-workflow.sh → scripts/merge-protection.cjs
tools/* → scripts/python-cc-gate.cjs
```

#### **Quality Gate Trigger Pattern**
```bash
# Sequential quality validation (tools/ orchestrating scripts/)
tools/qa-workflow.sh T-XX dev-complete
  ↓
scripts/multiplatform.cjs tool black backend/ --check
  ↓
scripts/multiplatform.cjs tool ruff check backend/
  ↓
scripts/python-cc-gate.cjs → complexity validation
  ↓
scripts/merge-protection.cjs validate-merge
```

#### **Quality Metrics Exchange**
```bash
# Standard quality metrics format
{
  "quality_score": 85,
  "complexity_average": 4.2,
  "test_coverage": 78.5,
  "lint_issues": 0,
  "security_warnings": 0,
  "merge_safety": "passed"
}
```

## 🔄 Communication Patterns

### **Pattern 1: Command Delegation**

#### **Implementation**
```bash
# tools/ scripts delegate platform-specific operations to scripts/
# Example: tools/progress-dashboard.sh
if command -v node >/dev/null 2>&1; then
    PYTHON_STATUS=$(node scripts/multiplatform.cjs validate 2>/dev/null | jq -r '.data.python.available')
else
    PYTHON_STATUS="unknown"
fi
```

#### **Contract Requirements**
- ✅ **Graceful Degradation**: tools/ must handle scripts/ unavailability
- ✅ **Standard Interfaces**: Use documented command patterns only
- ✅ **Error Propagation**: Preserve exit codes and error messages
- ✅ **Timeout Handling**: Implement reasonable timeouts for script calls

### **Pattern 2: Data Pipeline Integration**

#### **Implementation**
```bash
# Database abstraction layer calling platform utilities
# Example: tools/database-abstraction.sh
query_distributed() {
    local task_file="$DISTRIBUTED_DIR/${task_id}-STATUS.md"

    # Use scripts/multiplatform.cjs for YAML processing if available
    if command -v node >/dev/null 2>&1; then
        node scripts/multiplatform.cjs tool yq eval '.estado' "$task_file" 2>/dev/null
    else
        # Fallback to manual parsing
        parse_yaml_value "$task_file" "estado"
    fi
}
```

#### **Contract Requirements**
- ✅ **Fallback Mechanisms**: tools/ must provide fallback for scripts/ dependencies
- ✅ **Data Consistency**: Same data format regardless of processing method
- ✅ **Version Compatibility**: Interface contracts must be backward compatible
- ✅ **Performance Optimization**: Cache expensive operations where possible

### **Pattern 3: Event-Driven Integration**

#### **Implementation**
```bash
# Hook-based integration through package.json
# scripts/ components integrated into tools/ workflows
{
  "scripts": {
    "quality-gate": "yarn run validate-docs:strict && yarn run python-quality && yarn run test:backend",
    "python-quality": "node scripts/multiplatform.cjs tool black backend --check && node scripts/multiplatform.cjs tool ruff check backend",
    "validate-docs": "bash tools/validate-document-placement.sh"
  }
}
```

#### **Contract Requirements**
- ✅ **Atomic Operations**: Each interface call must be atomic and idempotent
- ✅ **State Management**: Clear state transitions and side effects
- ✅ **Rollback Capability**: Support for rollback on failure
- ✅ **Audit Trail**: Log all cross-directory interactions

## 🛡️ Error Handling Protocols

### **Standard Error Categories**

#### **Category 1: Infrastructure Errors**
```bash
# scripts/ infrastructure issues
INFRA_PYTHON_NOT_FOUND=10      # Python interpreter not available
INFRA_VENV_CORRUPTED=11        # Virtual environment corrupted
INFRA_PLATFORM_UNSUPPORTED=12 # Platform not supported
INFRA_PERMISSION_DENIED=13     # Insufficient permissions
```

#### **Category 2: Data Errors**
```bash
# tools/ data processing issues
DATA_TASK_NOT_FOUND=20         # Task ID not found in any system
DATA_INVALID_FORMAT=21         # Data format validation failed
DATA_MIGRATION_CONFLICT=22     # Monolith/distributed data conflict
DATA_CORRUPTION_DETECTED=23    # Data integrity check failed
```

#### **Category 3: Integration Errors**
```bash
# Cross-directory communication issues
INTEGRATION_TIMEOUT=30         # Operation exceeded timeout
INTEGRATION_VERSION_MISMATCH=31 # Incompatible interface versions
INTEGRATION_DEPENDENCY_MISSING=32 # Required dependency not available
INTEGRATION_CONTRACT_VIOLATION=33 # Interface contract violation
```

### **Error Propagation Protocol**

#### **Standard Error Response**
```bash
# Error response format (JSON when possible, structured text otherwise)
{
  "error": {
    "code": 23,
    "category": "DATA_CORRUPTION_DETECTED",
    "message": "Task T-12 data inconsistency between monolith and distributed systems",
    "details": {
      "monolith_status": "completed",
      "distributed_status": "in-progress",
      "resolution": "Use tools/migration-validator.sh to resolve conflicts"
    },
    "timestamp": "2024-01-01T00:00:00Z",
    "source": "tools/database-abstraction.sh:query_distributed"
  }
}
```

#### **Error Recovery Strategies**
```bash
# Graceful degradation patterns
case $ERROR_CODE in
    $INFRA_PYTHON_NOT_FOUND)
        echo "⚠️ Python not available, using manual processing"
        use_manual_processing
        ;;
    $DATA_MIGRATION_CONFLICT)
        echo "🔄 Data conflict detected, initiating hybrid mode"
        DATABASE_MODE="hybrid"
        retry_operation
        ;;
    $INTEGRATION_TIMEOUT)
        echo "⏱️ Operation timeout, using cached result"
        use_cached_result
        ;;
esac
```

## 🔧 Integration Points & Dependencies

### **Critical Integration Points**

#### **Point 1: Task Status Management**
```bash
# Bidirectional integration between task management and infrastructure
tools/qa-workflow.sh ←→ scripts/multiplatform.cjs
  ↕
tools/database-abstraction.sh ←→ scripts/merge-protection.cjs
```

**Dependencies:**
- scripts/multiplatform.cjs must be available for Python tool execution
- tools/database-abstraction.sh must handle both monolith and distributed modes
- All status updates must be atomic and logged

#### **Point 2: Quality Gate Orchestration**
```bash
# Complex workflow orchestration across directories
package.json:quality-gate
  ↓
tools/validate-document-placement.sh (bash)
  ↓
scripts/multiplatform.cjs tool black (python via node)
  ↓
scripts/python-cc-gate.cjs (node.js analysis)
  ↓
tools/qa-workflow.sh (bash orchestration)
```

**Dependencies:**
- Node.js runtime must be available for scripts/ execution
- Python virtual environment must be bootstrapped
- All tools must respect standardized exit codes
- Quality metrics must be aggregated consistently

#### **Point 3: Environment Validation**
```bash
# Cross-platform environment validation
scripts/multiplatform.cjs validate
  ↓
tools/* (all tools depend on validated environment)
  ↓
Integration success/failure propagation
```

**Dependencies:**
- Platform detection must be consistent across all components
- Virtual environment paths must be standardized
- Tool availability must be cached for performance
- Fallback mechanisms must be clearly defined

## 📊 API-Like Contracts

### **Contract Interface: Task Management API**

#### **Endpoint Pattern: `get_task_data(task_id, data_type)`**
```bash
# Function signature (tools/database-abstraction.sh)
get_task_data() {
    local task_id="$1"     # Required: T-XX format
    local data_type="${2:-full}"  # Optional: full|status|metadata|subtasks

    # Contract validation
    [[ "$task_id" =~ ^T-[0-9]{2}$ ]] || return $DATA_INVALID_FORMAT

    # Implementation delegates to appropriate system
    case "$DATABASE_MODE" in
        "monolith") query_monolith "$task_id" "$data_type" ;;
        "distributed") query_distributed "$task_id" "$data_type" ;;
        "hybrid") query_hybrid "$task_id" "$data_type" ;;
    esac
}
```

#### **Return Value Contract**
```bash
# Success case (exit code 0)
stdout: Requested data in specified format
stderr: (empty)

# Error cases
exit 1: Task not found
exit 2: Invalid parameters
exit 3: System error
stderr: Detailed error message in JSON format when possible
```

### **Contract Interface: Platform Execution API**

#### **Endpoint Pattern: `multiplatform.cjs <command> [args...]`**
```bash
# Command interface (scripts/multiplatform.cjs)
node scripts/multiplatform.cjs validate
  → Returns JSON diagnostics

node scripts/multiplatform.cjs tool <tool_name> [args...]
  → Executes tool through virtual environment

node scripts/multiplatform.cjs bootstrap
  → Sets up environment, returns success/failure
```

#### **Response Contract**
```json
{
  "command": "validate|tool|bootstrap",
  "status": "success|error|warning",
  "exitCode": 0,
  "platform": {
    "os": "win32|linux|darwin",
    "arch": "x64|arm64",
    "isWSL": false
  },
  "execution": {
    "duration": 1.234,
    "workingDir": "/path/to/project",
    "environment": "production|development"
  }
}
```

### **Contract Interface: Quality Gate API**

#### **Endpoint Pattern: `merge-protection.cjs <operation> [params...]`**
```bash
# Merge protection interface (scripts/merge-protection.cjs)
node scripts/merge-protection.cjs validate-merge --source HEAD --target main
  → Returns merge safety analysis

node scripts/merge-protection.cjs pre-merge-check
  → Returns pre-merge validation results
```

#### **Quality Metrics Contract**
```json
{
  "mergeValidation": {
    "safetyScore": 85,
    "fileCountDiff": 5,
    "criticalFileChanges": [],
    "qualityGates": {
      "linting": "passed",
      "testing": "passed",
      "complexity": "passed",
      "security": "passed"
    },
    "recommendations": []
  }
}
```

## 🧪 Testing Requirements for Interface Validation

### **Test Category 1: Contract Compliance Testing**

#### **Interface Contract Tests**
```bash
#!/bin/bash
# tests/integration/test_interface_contracts.sh

test_task_data_interface() {
    # Test standard task data query interface
    result=$(get_task_data "T-01" "metadata")
    exit_code=$?

    # Validate contract compliance
    assert_equals $exit_code 0 "Task data query should succeed"
    assert_contains "$result" "task_id:" "Result should include task_id"
    assert_contains "$result" "estado:" "Result should include estado"
    assert_contains "$result" "complejidad:" "Result should include complejidad"
}

test_multiplatform_validate_interface() {
    # Test platform validation interface
    result=$(node scripts/multiplatform.cjs validate 2>/dev/null)
    exit_code=$?

    # Validate JSON response contract
    assert_equals $exit_code 0 "Validation should succeed"
    assert_json_contains "$result" ".platform.os" "Response should include platform.os"
    assert_json_contains "$result" ".python.found" "Response should include python status"
}

test_error_code_propagation() {
    # Test error code contracts
    result=$(get_task_data "INVALID" "metadata")
    exit_code=$?

    assert_equals $exit_code $DATA_INVALID_FORMAT "Should return standard error code"
}
```

### **Test Category 2: Integration Flow Testing**

#### **Cross-Directory Integration Tests**
```bash
test_qa_workflow_integration() {
    # Test complete workflow: tools/ → scripts/ → tools/
    temp_task="T-99"

    # Step 1: Create test task (tools/)
    echo "Creating test task $temp_task"
    create_test_task "$temp_task"

    # Step 2: Update via QA workflow (tools/ → scripts/)
    tools/qa-workflow.sh "$temp_task" dev-complete
    assert_equals $? 0 "QA workflow should succeed"

    # Step 3: Validate status change (tools/ ← scripts/)
    status=$(get_task_data "$temp_task" "status")
    assert_contains "$status" "Desarrollo Completado" "Status should be updated"

    # Cleanup
    cleanup_test_task "$temp_task"
}

test_quality_gate_orchestration() {
    # Test quality gate coordination across directories

    # Mock quality gates
    mock_python_quality_success
    mock_merge_protection_success

    # Execute coordinated quality validation
    yarn qa:gate
    exit_code=$?

    assert_equals $exit_code 0 "Quality gate orchestration should succeed"
    assert_file_exists "logs/quality-gate.log" "Should log quality gate execution"
}
```

### **Test Category 3: Error Handling & Recovery Testing**

#### **Error Resilience Tests**
```bash
test_graceful_degradation() {
    # Test fallback when scripts/ not available

    # Temporarily disable Node.js
    PATH_BACKUP="$PATH"
    export PATH="/usr/bin:/bin"  # Remove Node.js from PATH

    # Test tools/ fallback mechanisms
    result=$(get_task_data "T-01" "status")
    exit_code=$?

    assert_equals $exit_code 0 "Should fallback gracefully"
    assert_not_empty "$result" "Should return result using fallback"

    # Restore environment
    export PATH="$PATH_BACKUP"
}

test_error_propagation_chain() {
    # Test error propagation through integration chain

    # Simulate Python environment failure
    mv backend/.venv backend/.venv.backup

    # Test error propagation: tools/ → scripts/ → error → tools/
    result=$(tools/qa-workflow.sh T-01 dev-complete)
    exit_code=$?

    assert_not_equals $exit_code 0 "Should propagate error"
    assert_contains "$result" "environment" "Should mention environment issue"

    # Restore environment
    mv backend/.venv.backup backend/.venv
}
```

### **Test Category 4: Performance & Scalability Testing**

#### **Interface Performance Tests**
```bash
test_interface_performance() {
    # Test interface call performance

    start_time=$(date +%s.%N)

    # Execute 10 interface calls
    for i in {1..10}; do
        get_task_data "T-01" "metadata" >/dev/null
    done

    end_time=$(date +%s.%N)
    duration=$(echo "$end_time - $start_time" | bc)

    # Performance threshold: <2 seconds for 10 calls
    assert_less_than "$duration" "2.0" "Interface calls should be performant"
}

test_concurrent_access() {
    # Test concurrent access to interfaces

    # Launch 5 concurrent processes
    for i in {1..5}; do
        (get_task_data "T-0$i" "status" > "test_output_$i.tmp") &
    done

    # Wait for all processes
    wait

    # Validate all succeeded
    for i in {1..5}; do
        assert_file_exists "test_output_$i.tmp" "Concurrent call $i should succeed"
        assert_not_empty "$(cat test_output_$i.tmp)" "Should return valid data"
        rm "test_output_$i.tmp"
    done
}
```

### **Automated Test Integration**

#### **package.json Integration**
```json
{
  "scripts": {
    "test:interfaces": "bash tests/integration/test_interface_contracts.sh",
    "test:cross-directory": "bash tests/integration/test_cross_directory_integration.sh",
    "test:error-handling": "bash tests/integration/test_error_handling.sh",
    "test:interface-performance": "bash tests/integration/test_interface_performance.sh",
    "test:contracts-full": "yarn test:interfaces && yarn test:cross-directory && yarn test:error-handling && yarn test:interface-performance"
  }
}
```

#### **CI/CD Integration Hooks**
```yaml
# .github/workflows/interface-contracts.yml
name: Interface Contracts Validation
on: [push, pull_request]

jobs:
  interface-contracts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup environment
        run: yarn install && yarn python:bootstrap
      - name: Validate interface contracts
        run: yarn test:contracts-full
      - name: Generate contract compliance report
        run: |
          echo "## Interface Contract Compliance" >> $GITHUB_STEP_SUMMARY
          echo "✅ All interface contracts validated successfully" >> $GITHUB_STEP_SUMMARY
```

## 📋 Maintenance & Evolution

### **Contract Versioning Strategy**

#### **Version Compatibility Matrix**
```bash
# Interface version compatibility
INTERFACE_VERSION="1.2.0"
MIN_SCRIPTS_VERSION="1.0.0"
MIN_TOOLS_VERSION="1.1.0"

# Backward compatibility requirements
verify_interface_compatibility() {
    local scripts_version=$(node scripts/multiplatform.cjs --version 2>/dev/null || echo "1.0.0")
    local tools_version=$(bash tools/database-abstraction.sh --version 2>/dev/null || echo "1.1.0")

    version_compare "$scripts_version" "$MIN_SCRIPTS_VERSION"
    version_compare "$tools_version" "$MIN_TOOLS_VERSION"
}
```

#### **Migration Protocol**
```bash
# Interface migration steps
migrate_interface_contracts() {
    echo "🔄 Migrating interface contracts to version $NEW_VERSION"

    # Step 1: Validate current contracts
    yarn test:contracts-full || exit 1

    # Step 2: Update interface implementations
    update_interface_implementations

    # Step 3: Run migration tests
    yarn test:migration-compatibility

    # Step 4: Update documentation
    update_contract_documentation

    echo "✅ Interface migration completed"
}
```

### **Monitoring & Health Checks**

#### **Interface Health Monitoring**
```bash
#!/bin/bash
# tools/interface-health-check.sh

check_interface_health() {
    local health_score=0
    local total_checks=0

    # Check 1: Task data interface
    if get_task_data "T-01" "status" >/dev/null 2>&1; then
        ((health_score++))
    fi
    ((total_checks++))

    # Check 2: Platform validation interface
    if node scripts/multiplatform.cjs validate >/dev/null 2>&1; then
        ((health_score++))
    fi
    ((total_checks++))

    # Check 3: Quality gate interface
    if node scripts/merge-protection.cjs pre-merge-check >/dev/null 2>&1; then
        ((health_score++))
    fi
    ((total_checks++))

    # Calculate health percentage
    local health_percent=$((health_score * 100 / total_checks))

    echo "Interface Health: $health_percent% ($health_score/$total_checks checks passed)"

    if [[ $health_percent -lt 80 ]]; then
        exit 1  # Unhealthy
    fi
}
```

### **Documentation Maintenance**

#### **Contract Documentation Updates**
```bash
# Automated documentation updates
update_contract_documentation() {
    echo "📝 Updating interface contract documentation"

    # Extract interface signatures from code
    extract_interface_signatures > docs/architecture/interface-signatures.md

    # Update contract examples
    generate_contract_examples > docs/architecture/interface-examples.md

    # Validate documentation accuracy
    validate_documentation_accuracy
}

extract_interface_signatures() {
    echo "# Interface Signatures (Auto-generated)"
    echo ""

    # Extract from database-abstraction.sh
    echo "## Task Management Interfaces"
    grep -A 5 "^[a-zA-Z_]*() {" tools/database-abstraction.sh | \
        sed 's/^/    /'

    # Extract from multiplatform.cjs
    echo "## Platform Abstraction Interfaces"
    grep -A 5 "async \|function " scripts/multiplatform.cjs | \
        sed 's/^/    /'
}
```

## 🎯 Success Metrics

### **Interface Reliability Metrics**

#### **Availability Targets**
- **Interface Uptime**: >99.5% (measured by health checks)
- **Error Rate**: <1% for standard operations
- **Response Time**: <500ms for data queries, <2s for complex operations
- **Recovery Time**: <5 minutes for interface failures

#### **Quality Metrics**
- **Contract Compliance**: 100% of interfaces must pass contract tests
- **Backward Compatibility**: Support N-1 version compatibility
- **Documentation Currency**: <24 hours lag between code and documentation updates
- **Test Coverage**: >90% coverage of interface interactions

### **Performance Benchmarks**

#### **Operation Performance Targets**
```bash
# Performance benchmarks (measured in CI/CD)
get_task_data_benchmark:
  target: <100ms average response time
  measurement: 10 consecutive calls, average latency

multiplatform_validate_benchmark:
  target: <1s complete environment validation
  measurement: Cold start validation time

quality_gate_orchestration_benchmark:
  target: <30s full quality gate execution
  measurement: End-to-end pipeline execution time
```

#### **Scalability Metrics**
```bash
# Scalability validation
concurrent_interface_calls:
  target: Support 10 concurrent interface calls without degradation
  measurement: Parallel execution without timeout or errors

large_dataset_handling:
  target: Handle repositories with 1000+ tasks efficiently
  measurement: Query performance with large task datasets
```

## 📄 License

This interface contracts specification is part of the AI-Doc-Editor project and is licensed under the terms of the project license.

---

**Last Updated**: 2024-01-01
**Version**: 1.0.0
**Maintainer**: Architecture Team
**Review Schedule**: Quarterly or when architectural changes occur