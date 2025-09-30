# Logging Standards and Error Reporting - AI-Doc-Editor

## Overview

This document defines the standardized logging formats, error reporting mechanisms, and observability patterns for both the scripts/ (Node.js) and tools/ (Shell) environments.

## Logging Standards

### Log Levels and Severity Mapping

| Level | Severity | Purpose | Example Use Case |
|-------|----------|---------|------------------|
| `error` | High | System failures, critical errors | Python not found, merge validation failed |
| `warning` | Medium | Non-critical issues, degraded performance | File count mismatch, lint violations |
| `info` | Low | General information, status updates | Task completion, successful operations |
| `debug` | Trace | Detailed diagnostic information | Variable values, execution flow |

### Structured Log Format

#### JSON Format (Primary)

```json
{
  "timestamp": "2025-01-26T10:30:00.123Z",
  "level": "error",
  "source": "scripts",
  "script": "multiplatform.cjs",
  "tier": "infrastructure",
  "error": {
    "code": 4001,
    "severity": "error",
    "tier": "infrastructure",
    "message": "Python executable not found in virtual environment",
    "context": {
      "path": "/d/Projects/DEV/AI-Doc-Editor/backend/.venv",
      "platform": "win32",
      "command": "python",
      "searchPaths": [
        "/d/Projects/DEV/AI-Doc-Editor/backend/.venv/Scripts/python.exe",
        "/d/Projects/DEV/AI-Doc-Editor/backend/.venv/bin/python"
      ]
    }
  },
  "stack": "Error: Python executable not found\n    at MultiPlatformValidator.findSystemPython...",
  "session_id": "session_1706262600123",
  "correlation_id": "req_abc123def456"
}
```

#### Human-Readable Format (Console)

```
[10:30:00] [ERROR] [4001] Python executable not found in virtual environment
   Context: {"path":"/d/Projects/DEV/AI-Doc-Editor/backend/.venv","platform":"win32"}
   Source: scripts/multiplatform.cjs (infrastructure tier)
```

### Log File Organization

```
logs/
├── unified_error_report.jsonl         # Primary error log (JSON Lines)
├── daily/
│   ├── 2025-01-26_errors.log         # Daily error aggregation
│   ├── 2025-01-26_warnings.log       # Daily warning aggregation
│   └── 2025-01-26_info.log           # Daily info aggregation
├── by_tier/
│   ├── infrastructure.log            # Tier 4 (scripts/) logs
│   ├── project_management.log        # Tier 4 (tools/) logs
│   ├── workflow.log                  # Tier 2 (workflow automation) logs
│   └── quality.log                   # Tier 3 (quality gates) logs
└── archive/
    ├── 2025-01-25_complete.log.gz    # Compressed historical logs
    └── metrics/
        └── 2025-01-26_metrics.json   # Daily metrics summary
```

## Error Reporting Framework

### Reporting Targets

#### 1. Local File System (Primary)

```javascript
// scripts/lib/error-codes.js
class FileSystemReporter {
    constructor(baseDir = 'logs') {
        this.baseDir = baseDir;
        this.ensureDirectories();
    }

    async reportError(error) {
        const timestamp = new Date();
        const dateStr = timestamp.toISOString().split('T')[0];

        // Write to unified log
        await this.writeToUnifiedLog(error);

        // Write to tier-specific log
        await this.writeToTierLog(error, error.tier);

        // Write to daily log
        await this.writeToDailyLog(error, dateStr);

        // Update metrics
        await this.updateMetrics(error);
    }

    async writeToUnifiedLog(error) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            ...error.toJSON()
        };

        const logLine = JSON.stringify(logEntry) + '\n';
        await fs.appendFile(
            path.join(this.baseDir, 'unified_error_report.jsonl'),
            logLine
        );
    }
}
```

#### 2. Console Output (Development)

```bash
# tools/lib/error-codes.sh
format_console_output() {
    local error_code="$1"
    local severity="$2"
    local tier="$3"
    local message="$4"
    local context="$5"

    local timestamp=$(date '+%H:%M:%S')
    local script_name=$(basename "$0")

    # Color mapping
    local color
    case "$severity" in
        "error")   color="$COLOR_ERROR" ;;
        "warning") color="$COLOR_WARNING" ;;
        "info")    color="$COLOR_INFO" ;;
        *)         color="" ;;
    esac

    # Primary log line
    echo -e "${color}[${timestamp}] [${severity^^}] [${error_code}]${COLOR_RESET} ${message}"

    # Context (if verbose)
    if [[ "$ERROR_HANDLER_VERBOSE" == "1" ]] && [[ -n "$context" ]]; then
        echo -e "   Context: $context"
    fi

    # Source information
    echo -e "   Source: tools/${script_name} (${tier} tier)"
}
```

#### 3. Centralized Monitoring (Production)

```javascript
// scripts/lib/error-codes.js
class CentralizedReporter {
    constructor(config) {
        this.endpoint = config.endpoint;
        this.apiKey = config.apiKey;
        this.batchSize = config.batchSize || 10;
        this.batchTimeout = config.batchTimeout || 5000;
        this.errorQueue = [];
    }

    async reportError(error) {
        this.errorQueue.push(error);

        if (this.errorQueue.length >= this.batchSize) {
            await this.flushBatch();
        }
    }

    async flushBatch() {
        if (this.errorQueue.length === 0) return;

        const batch = this.errorQueue.splice(0, this.batchSize);

        try {
            await this.sendToEndpoint(batch);
        } catch (sendError) {
            // Fallback to local logging
            console.error('Failed to send errors to centralized system:', sendError.message);
            batch.forEach(error => this.fallbackToLocal(error));
        }
    }

    async sendToEndpoint(errors) {
        const payload = {
            timestamp: new Date().toISOString(),
            source: 'ai-doc-editor',
            environment: process.env.NODE_ENV || 'development',
            errors: errors.map(error => error.toJSON())
        };

        // Implementation would depend on monitoring system
        // (Datadog, New Relic, ELK Stack, etc.)
    }
}
```

### Metrics and Observability

#### Error Rate Tracking

```javascript
// scripts/lib/error-codes.js
class ErrorMetrics {
    constructor() {
        this.metrics = {
            totalErrors: 0,
            errorsByTier: new Map(),
            errorsBySeverity: new Map(),
            errorsByCode: new Map(),
            errorRate: new Map(), // errors per time window
            windowSize: 5 * 60 * 1000, // 5 minutes
            windows: []
        };
    }

    recordError(error) {
        const now = Date.now();

        // Update counters
        this.metrics.totalErrors++;
        this.incrementMap(this.metrics.errorsByTier, error.tier);
        this.incrementMap(this.metrics.errorsBySeverity, error.severity);
        this.incrementMap(this.metrics.errorsByCode, error.code);

        // Update rate tracking
        this.updateErrorRate(now);
    }

    updateErrorRate(timestamp) {
        // Clean old windows
        const cutoff = timestamp - this.metrics.windowSize;
        this.metrics.windows = this.metrics.windows.filter(w => w > cutoff);

        // Add current error
        this.metrics.windows.push(timestamp);

        // Calculate current rate (errors per minute)
        const errorsPerMinute = (this.metrics.windows.length / this.metrics.windowSize) * 60 * 1000;
        this.metrics.errorRate.set(timestamp, errorsPerMinute);
    }

    generateReport() {
        return {
            summary: {
                totalErrors: this.metrics.totalErrors,
                currentErrorRate: this.getCurrentErrorRate(),
                topErrorCodes: this.getTopErrorCodes(5),
                errorDistribution: this.getErrorDistribution()
            },
            detailed: {
                errorsByTier: Object.fromEntries(this.metrics.errorsByTier),
                errorsBySeverity: Object.fromEntries(this.metrics.errorsBySeverity),
                errorsByCode: Object.fromEntries(this.metrics.errorsByCode)
            },
            timestamp: new Date().toISOString()
        };
    }
}
```

#### Health Checks and Alerting

```bash
# tools/lib/error-codes.sh
check_error_health() {
    local error_log="${ERROR_HANDLER_LOG_FILE:-logs/unified_error_report.jsonl}"
    local alert_threshold="${ERROR_ALERT_THRESHOLD:-10}"
    local time_window="${ERROR_TIME_WINDOW:-300}" # 5 minutes

    if [[ ! -f "$error_log" ]]; then
        return 0  # No errors logged yet
    fi

    # Count errors in the last time window
    local cutoff_time=$(date -d "${time_window} seconds ago" -Iseconds)
    local recent_errors=0

    while IFS= read -r line; do
        local error_time=$(echo "$line" | jq -r '.timestamp // empty' 2>/dev/null)
        if [[ -n "$error_time" ]] && [[ "$error_time" > "$cutoff_time" ]]; then
            ((recent_errors++))
        fi
    done < "$error_log"

    # Alert if threshold exceeded
    if [[ $recent_errors -ge $alert_threshold ]]; then
        error_warn $ERROR_QUALITY_COVERAGE_INSUFFICIENT \
            "High error rate detected: $recent_errors errors in ${time_window}s" \
            "threshold=$alert_threshold,window=${time_window}s,log=$error_log"
        return 1
    fi

    return 0
}
```

## Integration Patterns

### Error Correlation

#### Session and Request Tracking

```javascript
// scripts/lib/error-codes.js
class SessionTracker {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.correlationIds = new Map();
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    createCorrelationId(operation) {
        const correlationId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.correlationIds.set(operation, correlationId);
        return correlationId;
    }

    enhanceError(error, operation) {
        error.context = {
            ...error.context,
            sessionId: this.sessionId,
            correlationId: this.correlationIds.get(operation) || this.createCorrelationId(operation),
            operation: operation
        };
        return error;
    }
}

// Usage
const sessionTracker = new SessionTracker();
const error = createError(ErrorCodes.ENVIRONMENT.PYTHON_NOT_FOUND, message);
const correlatedError = sessionTracker.enhanceError(error, 'python_discovery');
```

#### Cross-Tier Correlation

```bash
# tools/lib/error-codes.sh
setup_correlation_context() {
    local operation="$1"
    local parent_correlation_id="${2:-}"

    # Generate or inherit correlation ID
    if [[ -n "$parent_correlation_id" ]]; then
        export CORRELATION_ID="$parent_correlation_id"
    else
        export CORRELATION_ID="${operation}_$(date +%s)_$$"
    fi

    # Set session context
    export SESSION_ID="${SESSION_ID:-session_$(date +%s)}"
    export OPERATION_NAME="$operation"

    if [[ "$ERROR_HANDLER_VERBOSE" == "1" ]]; then
        echo "[DEBUG] Correlation context: SESSION_ID=$SESSION_ID CORRELATION_ID=$CORRELATION_ID" >&2
    fi
}

# Enhanced error handling with correlation
handle_correlated_error() {
    local error_code="$1"
    local message="$2"
    local context="${3:-}"

    # Add correlation context
    local enhanced_context="session_id=${SESSION_ID:-unknown},correlation_id=${CORRELATION_ID:-unknown},operation=${OPERATION_NAME:-unknown}"
    if [[ -n "$context" ]]; then
        enhanced_context="$enhanced_context,$context"
    fi

    handle_error "$error_code" "$message" "$enhanced_context"
}
```

### Performance Monitoring

#### Execution Time Tracking

```javascript
// scripts/lib/error-codes.js
class PerformanceTracker {
    constructor() {
        this.timings = new Map();
        this.thresholds = new Map([
            ['python_discovery', 5000],      // 5 seconds
            ['environment_validation', 10000], // 10 seconds
            ['merge_validation', 30000]       // 30 seconds
        ]);
    }

    startTimer(operation) {
        this.timings.set(operation, {
            startTime: process.hrtime.bigint(),
            operation: operation
        });
    }

    endTimer(operation) {
        const timing = this.timings.get(operation);
        if (!timing) return null;

        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - timing.startTime) / 1000000; // Convert to milliseconds

        this.timings.delete(operation);

        // Check if operation exceeded threshold
        const threshold = this.thresholds.get(operation);
        if (threshold && duration > threshold) {
            const error = createError(
                ErrorCodes.INTEGRATION.TIMEOUT,
                `Operation ${operation} exceeded threshold: ${duration}ms > ${threshold}ms`,
                { operation, duration, threshold }
            );

            // Log performance issue
            new ErrorHandler().handleError(error, { exitOnError: false });
        }

        return { operation, duration, threshold };
    }
}
```

### Automated Error Recovery

#### Retry Mechanisms

```bash
# tools/lib/error-codes.sh
retry_with_backoff() {
    local max_attempts="${1:-3}"
    local backoff_base="${2:-2}"
    local max_delay="${3:-30}"
    shift 3
    local command=("$@")

    local attempt=1
    local delay=1

    while [[ $attempt -le $max_attempts ]]; do
        if [[ "$ERROR_HANDLER_VERBOSE" == "1" ]]; then
            echo "[DEBUG] Attempt $attempt/$max_attempts: ${command[*]}" >&2
        fi

        # Execute command and capture exit code
        if "${command[@]}"; then
            return 0  # Success
        fi

        local exit_code=$?

        # Check if error is retryable
        if ! is_retryable_error "$exit_code"; then
            error_exit $ERROR_ENVIRONMENT_COMMAND_EXECUTION_FAILED \
                "Command failed with non-retryable error" \
                "command=${command[*]},exit_code=$exit_code,attempt=$attempt"
        fi

        # Calculate backoff delay
        if [[ $attempt -lt $max_attempts ]]; then
            delay=$((delay * backoff_base))
            if [[ $delay -gt $max_delay ]]; then
                delay=$max_delay
            fi

            error_warn $ERROR_INTEGRATION_TIMEOUT \
                "Command failed, retrying in ${delay}s (attempt $attempt/$max_attempts)" \
                "command=${command[*]},exit_code=$exit_code"

            sleep "$delay"
        fi

        ((attempt++))
    done

    # All attempts failed
    error_exit $ERROR_ENVIRONMENT_COMMAND_EXECUTION_FAILED \
        "Command failed after $max_attempts attempts" \
        "command=${command[*]},max_attempts=$max_attempts"
}

is_retryable_error() {
    local exit_code="$1"

    # Define retryable error codes
    case "$exit_code" in
        1|2|130)  # General errors, can be retried
            return 0
            ;;
        126|127)  # Permission denied, command not found - not retryable
            return 1
            ;;
        *)        # Unknown, assume retryable
            return 0
            ;;
    esac
}
```

## Configuration and Environment

### Environment Variables

```bash
# Logging configuration
export ERROR_HANDLER_VERBOSE=1                    # Enable verbose logging
export ERROR_HANDLER_LOG_FILE="logs/unified_error_report.jsonl"
export ERROR_HANDLER_COLOR_OUTPUT=1               # Enable colored console output
export ERROR_LOG_LEVEL="info"                     # Minimum log level (error|warning|info|debug)

# Error reporting configuration
export ERROR_CENTRALIZED_REPORTING=0              # Disable centralized reporting by default
export ERROR_REPORTING_ENDPOINT=""                # Centralized reporting endpoint
export ERROR_REPORTING_API_KEY=""                 # API key for centralized reporting
export ERROR_REPORTING_BATCH_SIZE=10              # Batch size for centralized reporting

# Performance monitoring
export ERROR_PERFORMANCE_TRACKING=1               # Enable performance tracking
export ERROR_ALERT_THRESHOLD=10                   # Error count threshold for alerts
export ERROR_TIME_WINDOW=300                      # Time window for error rate calculation (seconds)

# Retention and cleanup
export ERROR_LOG_RETENTION_DAYS=30                # Keep logs for 30 days
export ERROR_LOG_MAX_SIZE="100M"                  # Maximum log file size before rotation
export ERROR_CLEANUP_INTERVAL=86400               # Cleanup interval (seconds)
```

### Configuration Files

```json
// logs/config/logging.json
{
  "version": "1.0",
  "levels": {
    "error": { "priority": 1, "color": "red", "destinations": ["console", "file", "centralized"] },
    "warning": { "priority": 2, "color": "yellow", "destinations": ["console", "file"] },
    "info": { "priority": 3, "color": "cyan", "destinations": ["console", "file"] },
    "debug": { "priority": 4, "color": "gray", "destinations": ["file"] }
  },
  "destinations": {
    "console": {
      "enabled": true,
      "format": "human-readable",
      "colors": true
    },
    "file": {
      "enabled": true,
      "format": "json",
      "rotation": {
        "maxSize": "100M",
        "maxFiles": 10,
        "compress": true
      }
    },
    "centralized": {
      "enabled": false,
      "endpoint": "${ERROR_REPORTING_ENDPOINT}",
      "apiKey": "${ERROR_REPORTING_API_KEY}",
      "batchSize": 10,
      "timeout": 30000
    }
  },
  "correlation": {
    "enableSessionTracking": true,
    "enableOperationTracking": true,
    "sessionIdLength": 16,
    "correlationIdLength": 16
  },
  "performance": {
    "enableTracking": true,
    "thresholds": {
      "python_discovery": 5000,
      "environment_validation": 10000,
      "merge_validation": 30000,
      "task_navigation": 2000,
      "dod_validation": 5000
    }
  },
  "alerting": {
    "errorRateThreshold": 10,
    "timeWindow": 300,
    "channels": ["console", "file"]
  }
}
```

## Testing and Validation

### Log Format Validation

```bash
#!/bin/bash
# test/logging/validate-log-format.sh

validate_json_logs() {
    local log_file="$1"

    echo "🧪 Validating JSON log format in $log_file..."

    local line_count=0
    local error_count=0

    while IFS= read -r line; do
        ((line_count++))

        # Validate JSON structure
        if ! echo "$line" | jq empty 2>/dev/null; then
            echo "❌ Line $line_count: Invalid JSON format"
            ((error_count++))
            continue
        fi

        # Validate required fields
        local required_fields=("timestamp" "level" "source" "script")
        for field in "${required_fields[@]}"; do
            if ! echo "$line" | jq -e ".$field" >/dev/null 2>&1; then
                echo "❌ Line $line_count: Missing required field '$field'"
                ((error_count++))
            fi
        done

        # Validate error structure if present
        if echo "$line" | jq -e '.error' >/dev/null 2>&1; then
            local error_fields=("code" "severity" "tier" "message")
            for field in "${error_fields[@]}"; do
                if ! echo "$line" | jq -e ".error.$field" >/dev/null 2>&1; then
                    echo "❌ Line $line_count: Missing error field '$field'"
                    ((error_count++))
                fi
            done
        fi
    done < "$log_file"

    if [[ $error_count -eq 0 ]]; then
        echo "✅ All $line_count log entries are valid"
        return 0
    else
        echo "❌ Found $error_count errors in $line_count log entries"
        return 1
    fi
}
```

### Error Reporting Integration Test

```javascript
// test/integration/error-reporting-test.js
const { ErrorHandler, createError, ErrorCodes } = require('../../scripts/lib/error-codes.js');

async function testErrorReportingPipeline() {
    console.log('🧪 Testing error reporting pipeline...');

    const handler = new ErrorHandler({
        verbose: true,
        exitOnError: false,
        logFile: 'test/logs/test_errors.log'
    });

    // Test different error types
    const testErrors = [
        createError(ErrorCodes.ENVIRONMENT.PYTHON_NOT_FOUND, 'Test Python error'),
        createError(ErrorCodes.WORKFLOW.MERGE_VALIDATION_FAILED, 'Test merge error'),
        createError(ErrorCodes.QUALITY.LINT_VIOLATIONS, 'Test quality error')
    ];

    let allPassed = true;

    for (const error of testErrors) {
        try {
            handler.handleError(error);
            console.log(`✅ Successfully handled error ${error.code}`);
        } catch (e) {
            console.log(`❌ Failed to handle error ${error.code}: ${e.message}`);
            allPassed = false;
        }
    }

    // Validate log file was created and contains valid entries
    const fs = require('fs');
    if (fs.existsSync('test/logs/test_errors.log')) {
        console.log('✅ Log file created successfully');
    } else {
        console.log('❌ Log file not created');
        allPassed = false;
    }

    return allPassed;
}

if (require.main === module) {
    testErrorReportingPipeline().then(passed => {
        process.exit(passed ? 0 : 1);
    });
}
```

## Best Practices

### Logging Guidelines

1. **Use structured logging** (JSON) for machine processing
2. **Include contextual information** in all log entries
3. **Implement log rotation** to prevent disk space issues
4. **Use appropriate log levels** based on severity
5. **Correlate related log entries** using session and correlation IDs
6. **Monitor error rates** and set up alerting
7. **Sanitize sensitive data** before logging
8. **Test log parsing** and analysis tools regularly

### Error Reporting Guidelines

1. **Report errors as soon as possible** after they occur
2. **Include full context** for debugging
3. **Implement retry mechanisms** for transient failures
4. **Use circuit breakers** to prevent cascading failures
5. **Aggregate related errors** to reduce noise
6. **Provide actionable error messages** for users
7. **Implement graceful degradation** when possible
8. **Monitor and alert** on error rate spikes

## Related Documentation

- [Error Propagation Protocol](../architecture/error-propagation-protocol.md) - Cross-tier error handling
- [scripts/lib/error-codes.js](../../scripts/lib/error-codes.js) - Node.js error handling implementation
- [tools/lib/error-codes.sh](../../tools/lib/error-codes.sh) - Shell error handling implementation
- [ADR-011: Directory Architecture](../architecture/adr/ADR-011-scripts-tools-dual-directory-architecture.md) - Strategic separation rationale