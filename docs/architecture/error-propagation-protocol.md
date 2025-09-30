# Error Propagation Protocol - AI-Doc-Editor

## Overview

This document defines the standardized error propagation protocols between the scripts/ (.cjs) and tools/ (.sh) directories, ensuring seamless error handling across the 4-tier architecture.

## Architecture Integration

### 4-Tier Error Flow

```
┌─────────────────┐    ┌─────────────────┐
│   Tier 1        │    │   Tier 2        │
│ User Commands   │◄──►│ Slash Commands  │
│ (yarn dev)      │    │ (/task-dev)     │
└─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Tier 4        │    │   Tier 4        │
│ scripts/*.cjs   │◄──►│ tools/*.sh      │
│ Infrastructure  │    │ Project Mgmt    │
└─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────┐
│          Tier 3 - Quality Gates         │
│     (.claude/hooks.json automation)     │
└─────────────────────────────────────────┘
```

## Error Code Standardization

### Hierarchical Error Codes

All error codes follow a 4-tier hierarchy aligned with the project architecture:

- **1000-1999**: User Commands (Tier 1)
- **2000-2999**: Workflow Automation (Tier 2)
- **3000-3999**: Quality Gates (Tier 3)
- **4000-4999**: Infrastructure (Tier 4)
- **5000-5999**: Cross-Tier Integration

### Error Structure

```javascript
// Node.js (scripts/)
{
  code: 4001,
  severity: "error",
  tier: "infrastructure",
  message: "Python executable not found",
  context: { path: "/path/to/venv", platform: "windows" },
  timestamp: "2025-01-26T10:30:00Z"
}
```

```bash
# Shell (tools/)
ERROR_CODE=4001
ERROR_SEVERITY=error
ERROR_TIER=infrastructure
ERROR_MESSAGE="Python executable not found"
ERROR_CONTEXT='{"path":"/path/to/venv","platform":"windows"}'
ERROR_TIMESTAMP="2025-01-26T10:30:00Z"
```

## Cross-Directory Communication

### Protocol Bridge Pattern

#### scripts/ → tools/ Error Propagation

1. **Error File Protocol**
   ```javascript
   // scripts/multiplatform.cjs
   const { ErrorHandler, ErrorCodes } = require('./lib/error-codes.js');

   const error = createError(ErrorCodes.ENVIRONMENT.PYTHON_NOT_FOUND, message);
   ProtocolBridge.writeErrorFile(error, '/tmp/scripts_error.env');
   ```

2. **Environment Variable Export**
   ```javascript
   // Export error as environment variables
   const env = ProtocolBridge.toShellEnv(error);
   process.env = { ...process.env, ...env };
   ```

#### tools/ → scripts/ Error Propagation

1. **Error Environment Reading**
   ```bash
   # tools/task-navigator.sh
   source tools/lib/error-codes.sh

   # Read error from scripts
   if read_error_from_scripts; then
       handle_error $ERROR_CODE "$ERROR_MESSAGE" "$ERROR_CONTEXT"
   fi
   ```

2. **Error File Writing**
   ```bash
   # Write error for scripts consumption
   write_error_file_for_scripts $ERROR_WORKFLOW_BRANCH_NOT_FOUND \
       "Branch T-01-feature not found" \
       "task_id=T-01,branch=T-01-feature"
   ```

### Bidirectional Integration Points

#### 1. Command Execution Chain

```
yarn dev (package.json)
    ↓
dev-runner.cjs (scripts/)
    ↓ [error file protocol]
task-navigator.sh (tools/)
    ↓ [environment variables]
multiplatform.cjs (scripts/)
```

#### 2. Quality Gate Integration

```
.claude/hooks.json
    ↓
scripts/python-cc-gate.cjs
    ↓ [protocol bridge]
tools/validate-dod.sh
    ↓ [error aggregation]
Unified Error Report
```

## Implementation Patterns

### Pattern 1: Command Chain Error Handling

```javascript
// scripts/dev-runner.cjs
const { ErrorHandler, ProtocolBridge } = require('./lib/error-codes.js');

async function executeWithErrorPropagation(command, args) {
    try {
        return await runCommand(command, args);
    } catch (error) {
        // Propagate to tools/ if needed
        if (needsToolsIntegration(command)) {
            ProtocolBridge.writeErrorFile(error, '/tmp/scripts_error.env');
        }
        throw error;
    }
}
```

```bash
# tools/extract-subtasks.sh
source tools/lib/error-codes.sh

# Check for errors from scripts/
if read_error_from_scripts; then
    if [[ "$ERROR_TIER" == "infrastructure" ]]; then
        error_exit $ERROR_INTEGRATION_DATA_SYNC_FAILURE \
            "Infrastructure error prevented task extraction: $ERROR_MESSAGE" \
            "source_error=$ERROR_CODE"
    fi
fi
```

### Pattern 2: Async Error Aggregation

```javascript
// scripts/merge-protection.cjs
class MergeProtectionSystem {
    async validateWithToolsIntegration() {
        const results = [];

        // Run tools/ validation
        const toolsValidation = await this.runToolsValidation();
        if (toolsValidation.error) {
            results.push(toolsValidation.error);
        }

        // Aggregate all errors
        return this.aggregateErrors(results);
    }

    aggregateErrors(errors) {
        if (errors.length === 0) return null;

        // Convert all to standardized format
        return errors.map(err =>
            err instanceof StandardizedError ? err : this.wrapError(err)
        );
    }
}
```

### Pattern 3: Event-Driven Error Handling

```bash
# tools/qa-workflow.sh
handle_workflow_error() {
    local error_code="$1"
    local message="$2"
    local context="$3"

    # Log locally
    handle_error "$error_code" "$message" "$context"

    # Notify scripts/ if it's a critical workflow error
    if [[ "$error_code" -ge 2000 ]] && [[ "$error_code" -lt 3000 ]]; then
        write_error_file_for_scripts "$error_code" "$message" "$context"

        # Trigger scripts/ error handler if available
        if command -v node >/dev/null 2>&1; then
            node -e "
                const { createErrorFromShell } = require('./scripts/lib/error-codes.js');
                const error = createErrorFromShell('ERROR_CODE=$error_code ERROR_SEVERITY=${ERROR_SEVERITY_MAP[$error_code]} ERROR_TIER=${ERROR_TIER_MAP[$error_code]} ERROR_MESSAGE=\"$message\"');
                console.error('Cross-tier error:', error.toJSON());
            " 2>/dev/null || true
        fi
    fi
}
```

## Error Recovery Patterns

### Graceful Degradation

```javascript
// scripts/multiplatform.cjs
async function executeWithFallback(command, args) {
    try {
        return await this.runCommand(command, args);
    } catch (error) {
        if (error.code === ErrorCodes.ENVIRONMENT.TOOL_NOT_AVAILABLE.code) {
            // Try tools/ alternative
            const fallbackResult = await this.tryToolsFallback(command, args);
            if (fallbackResult.success) {
                this.log('warn', `Used tools/ fallback for ${command}`);
                return fallbackResult;
            }
        }
        throw error;
    }
}
```

### Circuit Breaker Pattern

```bash
# tools/migration-validator.sh
check_circuit_breaker() {
    local error_count_file="/tmp/error_count_$$"
    local max_errors=5

    # Read current error count
    local current_errors=0
    if [[ -f "$error_count_file" ]]; then
        current_errors=$(cat "$error_count_file")
    fi

    # Check if circuit is open
    if [[ $current_errors -ge $max_errors ]]; then
        error_exit $ERROR_INTEGRATION_RESOURCE_EXHAUSTED \
            "Circuit breaker activated: too many errors ($current_errors/$max_errors)" \
            "error_count_file=$error_count_file"
    fi

    # Increment error count on failure
    trap 'echo $((current_errors + 1)) > "$error_count_file"' ERR
}
```

## Monitoring and Observability

### Error Metrics Collection

```javascript
// scripts/lib/error-codes.js - Enhanced ErrorHandler
class ErrorHandler {
    constructor(options = {}) {
        this.metrics = {
            errorCounts: new Map(),
            errorsByTier: new Map(),
            errorsBySeverity: new Map()
        };
    }

    handleError(error, options = {}) {
        // Track metrics
        this.recordMetrics(error);

        // Standard error handling
        return super.handleError(error, options);
    }

    recordMetrics(error) {
        const key = `${error.tier}-${error.code}`;
        this.metrics.errorCounts.set(key,
            (this.metrics.errorCounts.get(key) || 0) + 1);

        this.metrics.errorsByTier.set(error.tier,
            (this.metrics.errorsByTier.get(error.tier) || 0) + 1);

        this.metrics.errorsBySeverity.set(error.severity,
            (this.metrics.errorsBySeverity.get(error.severity) || 0) + 1);
    }

    getMetricsReport() {
        return {
            errorCounts: Object.fromEntries(this.metrics.errorCounts),
            errorsByTier: Object.fromEntries(this.metrics.errorsByTier),
            errorsBySeverity: Object.fromEntries(this.metrics.errorsBySeverity)
        };
    }
}
```

### Centralized Error Reporting

```bash
# tools/lib/error-codes.sh - Enhanced logging
log_to_centralized_system() {
    local error_code="$1"
    local message="$2"
    local context="$3"

    # Create unified error report
    local report_file="${TMPDIR:-/tmp}/unified_error_report.jsonl"
    local timestamp=$(date -Iseconds)
    local script_type="shell"
    local script_name=$(basename "$0")

    # JSON log entry compatible with scripts/ format
    local json_entry=$(cat <<EOF
{"timestamp":"$timestamp","source":"$script_type","script":"$script_name","tier":"${ERROR_TIER_MAP[$error_code]}","error":{"code":$error_code,"severity":"${ERROR_SEVERITY_MAP[$error_code]}","tier":"${ERROR_TIER_MAP[$error_code]}","message":"$message","context":"$context"}}
EOF
    )

    echo "$json_entry" >> "$report_file"

    # Rotate log if it gets too large
    if [[ -f "$report_file" ]] && [[ $(wc -l < "$report_file") -gt 1000 ]]; then
        mv "$report_file" "${report_file}.old"
    fi
}
```

## Testing and Validation

### Integration Testing

```bash
#!/bin/bash
# test/integration/error-propagation-test.sh

test_scripts_to_tools_propagation() {
    echo "🧪 Testing scripts/ → tools/ error propagation..."

    # Generate error in scripts/
    node -e "
        const { ProtocolBridge, createError, ErrorCodes } = require('./scripts/lib/error-codes.js');
        const error = createError(ErrorCodes.ENVIRONMENT.PYTHON_NOT_FOUND, 'Test error');
        ProtocolBridge.writeErrorFile(error, '/tmp/test_error.env');
    "

    # Read error in tools/
    source tools/lib/error-codes.sh
    if read_error_from_scripts "/tmp/test_error.env"; then
        if [[ "$ERROR_CODE" == "4001" ]]; then
            echo "✅ Scripts to tools propagation: PASS"
            return 0
        fi
    fi

    echo "❌ Scripts to tools propagation: FAIL"
    return 1
}

test_tools_to_scripts_propagation() {
    echo "🧪 Testing tools/ → scripts/ error propagation..."

    # Generate error in tools/
    source tools/lib/error-codes.sh
    write_error_file_for_scripts $ERROR_WORKFLOW_BRANCH_NOT_FOUND \
        "Test branch error" \
        "test=true"

    # Read error in scripts/
    local result=$(node -e "
        const { createErrorFromShell } = require('./scripts/lib/error-codes.js');
        const fs = require('fs');
        try {
            const errorFile = fs.readFileSync('/tmp/error_$$.env', 'utf8');
            const error = createErrorFromShell('ERROR_CODE=2002 ERROR_SEVERITY=error ERROR_TIER=workflow ERROR_MESSAGE=\"Test branch error\"');
            console.log(error.code);
        } catch (e) {
            console.log('ERROR');
        }
    ")

    if [[ "$result" == "2002" ]]; then
        echo "✅ Tools to scripts propagation: PASS"
        return 0
    fi

    echo "❌ Tools to scripts propagation: FAIL"
    return 1
}
```

## Configuration

### Environment Variables

```bash
# Global error handling configuration
export ERROR_HANDLER_VERBOSE=1                    # Enable verbose error output
export ERROR_HANDLER_LOG_FILE="/tmp/errors.log"   # Centralized error log
export ERROR_HANDLER_COLOR_OUTPUT=1               # Enable colored output
export ERROR_HANDLER_EXIT_ON_ERROR=1              # Exit on errors (default)

# Protocol bridge configuration
export ERROR_BRIDGE_TEMP_DIR="/tmp"               # Temporary directory for error files
export ERROR_BRIDGE_CLEANUP=1                     # Auto-cleanup error files
export ERROR_BRIDGE_TIMEOUT=30                    # Error file timeout (seconds)

# Monitoring configuration
export ERROR_METRICS_ENABLED=1                    # Enable error metrics collection
export ERROR_METRICS_REPORT_INTERVAL=3600         # Metrics report interval (seconds)
export ERROR_CENTRALIZED_REPORTING=0              # Disable by default
```

### Integration with package.json

```json
{
  "scripts": {
    "error-test": "bash tools/lib/error-codes.sh test && node scripts/lib/error-codes.js",
    "error-codes": "bash tools/lib/error-codes.sh codes",
    "error-metrics": "node -e 'const {ErrorHandler} = require(\"./scripts/lib/error-codes.js\"); console.log(JSON.stringify(new ErrorHandler().getMetricsReport(), null, 2))'"
  }
}
```

## Best Practices

### Error Handling Guidelines

1. **Always use standardized error codes** from the defined hierarchy
2. **Include contextual information** in error messages and context objects
3. **Propagate errors appropriately** between tiers based on error severity
4. **Log errors consistently** using the standardized format
5. **Handle cross-tier communication gracefully** with fallback mechanisms
6. **Test error propagation** as part of integration testing

### Performance Considerations

1. **Minimize error file I/O** by batching operations when possible
2. **Clean up temporary error files** to prevent disk space issues
3. **Use appropriate timeouts** for cross-tier communication
4. **Implement circuit breakers** for high-frequency error scenarios
5. **Monitor error rates** and implement alerting for anomalies

## Migration Path

### Existing Script Updates

1. **Phase 1**: Add error handling library imports
2. **Phase 2**: Replace `console.error()` with standardized error handling
3. **Phase 3**: Implement cross-tier error propagation
4. **Phase 4**: Add error metrics and monitoring
5. **Phase 5**: Enable centralized error reporting

### Compatibility

The error handling system is designed to be backward compatible:

- **Legacy scripts continue to work** without modification
- **Gradual migration** is supported through wrapper functions
- **Existing error patterns** are automatically detected and converted
- **No breaking changes** to current workflow automation

## Related Documentation

- [scripts/SCOPE-DEFINITION.md](../scripts/SCOPE-DEFINITION.md) - Infrastructure layer scope
- [tools/SCOPE-DEFINITION.md](../tools/SCOPE-DEFINITION.md) - Project management layer scope
- [ADR-011: Directory Architecture](./adr/ADR-011-scripts-tools-dual-directory-architecture.md) - Strategic separation rationale
- [CLAUDE.md](../CLAUDE.md) - Integration with workflow commands