# Error Handling Migration Guide - AI-Doc-Editor

## Overview

This guide provides step-by-step instructions for migrating existing scripts and tools to use the new unified error handling system. The migration is designed to be gradual and backward-compatible.

## Migration Strategy

### Phase-Based Approach

1. **Phase 1**: Library Integration (Non-breaking)
2. **Phase 2**: Basic Error Handling (Backward Compatible)
3. **Phase 3**: Cross-Tier Integration (Enhanced Features)
4. **Phase 4**: Advanced Monitoring (Optional)

### Compatibility Matrix

| Feature | scripts/*.cjs | tools/*.sh | Status |
|---------|---------------|------------|--------|
| Basic Error Codes | ✅ Available | ✅ Available | Complete |
| Structured Logging | ✅ Available | ✅ Available | Complete |
| Cross-Tier Propagation | ✅ Available | ✅ Available | Complete |
| Performance Monitoring | ✅ Available | 🔄 Partial | In Progress |
| Centralized Reporting | 🔄 Beta | ❌ Planned | In Development |

## Phase 1: Library Integration

### For scripts/*.cjs Files

#### Step 1: Add Error Handling Import

**Before:**
```javascript
#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');

// Direct error handling
if (result.status !== 0) {
    console.error('Command failed:', result.stderr);
    process.exit(1);
}
```

**After:**
```javascript
#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');
const { ErrorHandler, ErrorCodes, createError } = require('./lib/error-codes.js');

// Initialize error handler
const errorHandler = new ErrorHandler({
    verbose: process.env.VERBOSE === '1',
    exitOnError: true
});

// Enhanced error handling
if (result.status !== 0) {
    const error = createError(
        ErrorCodes.ENVIRONMENT.COMMAND_EXECUTION_FAILED,
        `Command failed: ${command} ${args.join(' ')}`,
        {
            exitCode: result.status,
            stderr: result.stderr,
            command: command,
            args: args
        }
    );
    errorHandler.handleError(error);
}
```

#### Step 2: Update Class-Based Scripts

**Before:**
```javascript
class MultiPlatformValidator {
    log(level, message) {
        console.log(`[${level.toUpperCase()}] ${message}`);
    }

    validatePythonVersion(pythonCmd) {
        try {
            // validation logic
        } catch (error) {
            throw new Error(`Python validation failed: ${error.message}`);
        }
    }
}
```

**After:**
```javascript
const { ErrorHandler, ErrorCodes, createError } = require('./lib/error-codes.js');

class MultiPlatformValidator {
    constructor() {
        this.errorHandler = new ErrorHandler({ verbose: this.verbose });
    }

    log(level, message, context = {}) {
        // Use standardized logging format
        const timestamp = new Date().toISOString().substr(11, 8);
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
        console.log(`${prefix} ${message}`);

        if (level === 'debug' && Object.keys(context).length > 0) {
            console.log(`${prefix} Context:`, JSON.stringify(context, null, 2));
        }
    }

    validatePythonVersion(pythonCmd) {
        try {
            // validation logic
        } catch (error) {
            const standardError = createError(
                ErrorCodes.ENVIRONMENT.PYTHON_NOT_FOUND,
                `Python validation failed: ${error.message}`,
                { pythonCmd, originalError: error.message }
            );
            this.errorHandler.handleError(standardError);
        }
    }
}
```

### For tools/*.sh Files

#### Step 1: Add Error Handling Source

**Before:**
```bash
#!/bin/bash
# Progress Dashboard Generator

if [[ -z "$TASK_ID" ]]; then
    echo "❌ Usage: $0 <TASK_ID>"
    exit 1
fi

if [[ ! -f "$FILE" ]]; then
    echo "❌ File not found: $FILE"
    exit 1
fi
```

**After:**
```bash
#!/bin/bash
# Progress Dashboard Generator

# Source error handling library
source "$(dirname "$0")/lib/error-codes.sh"

if [[ -z "$TASK_ID" ]]; then
    error_exit $ERROR_USER_MISSING_REQUIRED_PARAM \
        "Task ID is required" \
        "usage=$0 <TASK_ID>"
fi

if [[ ! -f "$FILE" ]]; then
    error_exit $ERROR_ENVIRONMENT_FILE_SYSTEM_ERROR \
        "Required file not found: $FILE" \
        "file=$FILE,operation=task_navigation"
fi
```

#### Step 2: Convert Existing Error Patterns

**Before:**
```bash
# Various error handling patterns
echo "❌ Task $TASK_ID not found"
exit 1

echo "⚠️  Warning: File count mismatch"

if ! command -v python >/dev/null 2>&1; then
    echo "Python not found"
    exit 1
fi
```

**After:**
```bash
# Standardized error handling
error_exit $ERROR_WORKFLOW_BRANCH_NOT_FOUND \
    "Task $TASK_ID not found" \
    "task_id=$TASK_ID,file=$FILE"

error_warn $ERROR_WORKFLOW_FILE_COUNT_MISMATCH \
    "File count mismatch detected" \
    "expected=$expected_count,actual=$actual_count"

if ! command -v python >/dev/null 2>&1; then
    error_exit $ERROR_ENVIRONMENT_PYTHON_NOT_FOUND \
        "Python executable not found in PATH" \
        "PATH=$PATH"
fi
```

## Phase 2: Basic Error Handling

### Convert Error Messages to Standardized Format

#### Step 1: Identify Error Categories

**Analysis of Existing Patterns:**
```bash
# Run this analysis script to identify error patterns
grep -r "echo.*❌\|console.error\|exit 1" scripts/ tools/ | \
    sed 's/.*://' | \
    sort | uniq -c | sort -nr > error_patterns.txt
```

**Common Patterns Found:**
- File not found errors → `ERROR_ENVIRONMENT_FILE_SYSTEM_ERROR`
- Command execution failures → `ERROR_ENVIRONMENT_COMMAND_EXECUTION_FAILED`
- Missing arguments → `ERROR_USER_MISSING_REQUIRED_PARAM`
- Validation failures → `ERROR_WORKFLOW_*` or `ERROR_QUALITY_*`

#### Step 2: Create Migration Mapping

**Migration Mapping Table:**
```javascript
// migration/error-mapping.js
const errorMigrationMap = {
    // File system errors
    'File not found': ErrorCodes.ENVIRONMENT.FILE_SYSTEM_ERROR,
    'Directory does not exist': ErrorCodes.ENVIRONMENT.FILE_SYSTEM_ERROR,
    'Permission denied': ErrorCodes.USER_COMMAND.PERMISSION_DENIED,

    // Command execution
    'Command failed': ErrorCodes.ENVIRONMENT.COMMAND_EXECUTION_FAILED,
    'Tool not available': ErrorCodes.ENVIRONMENT.TOOL_NOT_AVAILABLE,
    'Python not found': ErrorCodes.ENVIRONMENT.PYTHON_NOT_FOUND,

    // Workflow errors
    'Branch not found': ErrorCodes.WORKFLOW.BRANCH_NOT_FOUND,
    'Merge validation failed': ErrorCodes.WORKFLOW.MERGE_VALIDATION_FAILED,
    'Working tree dirty': ErrorCodes.WORKFLOW.WORKING_TREE_DIRTY,

    // Quality issues
    'Lint violations': ErrorCodes.QUALITY.LINT_VIOLATIONS,
    'Test failures': ErrorCodes.QUALITY.TEST_FAILURES,
    'Complexity exceeded': ErrorCodes.QUALITY.COMPLEXITY_THRESHOLD_EXCEEDED
};
```

### Example Migration: multiplatform.cjs

**Before (Current Implementation):**
```javascript
findSystemPython() {
    // ... search logic ...

    throw new Error(
        'No suitable Python interpreter found. Please ensure Python 3.8+ is installed and accessible.\n' +
        'Visit: https://python.org/downloads/ for installation instructions.'
    );
}

runCommand(cmd, args, options = {}) {
    const result = spawnSync(cmd, args, defaultOptions);

    if (result.error) {
        throw new Error(`Failed to execute command: ${result.error.message}`);
    }

    if (result.status !== 0) {
        const errorMsg = `Command failed with exit code ${result.status}: ${cmd} ${args.join(' ')}`;
        throw new Error(errorMsg);
    }

    return result;
}
```

**After (Migrated):**
```javascript
const { ErrorHandler, ErrorCodes, createError } = require('./lib/error-codes.js');

findSystemPython() {
    // ... search logic ...

    const error = createError(
        ErrorCodes.ENVIRONMENT.PYTHON_NOT_FOUND,
        'No suitable Python interpreter found. Please ensure Python 3.8+ is installed and accessible.',
        {
            searchPaths: fallbackPaths,
            platform: process.platform,
            helpUrl: 'https://python.org/downloads/'
        }
    );
    throw error;
}

runCommand(cmd, args, options = {}) {
    const result = spawnSync(cmd, args, defaultOptions);

    if (result.error) {
        const error = createError(
            ErrorCodes.ENVIRONMENT.COMMAND_EXECUTION_FAILED,
            `Failed to execute command: ${result.error.message}`,
            {
                command: cmd,
                args: args,
                error: result.error.code,
                options: defaultOptions
            }
        );
        throw error;
    }

    if (result.status !== 0) {
        const error = createError(
            ErrorCodes.ENVIRONMENT.COMMAND_EXECUTION_FAILED,
            `Command failed with exit code ${result.status}`,
            {
                command: cmd,
                args: args,
                exitCode: result.status,
                stderr: result.stderr,
                stdout: result.stdout
            }
        );
        throw error;
    }

    return result;
}
```

### Example Migration: progress-dashboard.sh

**Before (Current Implementation):**
```bash
if [[ ! -f "tools/database-abstraction.sh" ]]; then
    echo "❌ Database abstraction layer not found: tools/database-abstraction.sh"
    exit 1
fi

if ! init_abstraction_layer 2>/dev/null | grep -q "ready"; then
    echo "❌ Failed to initialize database abstraction layer"
    exit 1
fi
```

**After (Migrated):**
```bash
# Source error handling library
source "$(dirname "$0")/lib/error-codes.sh"

if [[ ! -f "tools/database-abstraction.sh" ]]; then
    error_exit $ERROR_ENVIRONMENT_FILE_SYSTEM_ERROR \
        "Database abstraction layer not found" \
        "file=tools/database-abstraction.sh,operation=dashboard_generation"
fi

if ! init_abstraction_layer 2>/dev/null | grep -q "ready"; then
    error_exit $ERROR_ENVIRONMENT_COMMAND_EXECUTION_FAILED \
        "Failed to initialize database abstraction layer" \
        "operation=init_abstraction_layer,dashboard_type=progress"
fi
```

## Phase 3: Cross-Tier Integration

### Enable Error Propagation Between scripts/ and tools/

#### Step 1: Add Protocol Bridge Support

**In scripts/*.cjs files:**
```javascript
const { ProtocolBridge } = require('./lib/error-codes.js');

class MultiPlatformValidator {
    async runTool(toolName, args) {
        try {
            return await this.executeCommand(toolName, args);
        } catch (error) {
            // Check if this is from tools/ integration
            if (this.needsToolsIntegration(toolName)) {
                // Write error for tools/ consumption
                ProtocolBridge.writeErrorFile(error, '/tmp/scripts_error.env');

                // Try to execute via tools/ wrapper
                const fallbackResult = await this.tryToolsFallback(toolName, args);
                if (fallbackResult.success) {
                    return fallbackResult;
                }
            }
            throw error;
        }
    }

    needsToolsIntegration(toolName) {
        const toolsIntegratedCommands = ['task-navigator', 'validate-dod', 'extract-subtasks'];
        return toolsIntegratedCommands.includes(toolName);
    }
}
```

**In tools/*.sh files:**
```bash
# Enhanced error handling with cross-tier support
handle_with_scripts_integration() {
    local error_code="$1"
    local message="$2"
    local context="$3"

    # Handle error locally
    handle_error "$error_code" "$message" "$context"

    # Check if this should propagate to scripts/
    if should_propagate_to_scripts "$error_code"; then
        write_error_file_for_scripts "$error_code" "$message" "$context"

        # Attempt recovery via scripts/ if possible
        if can_recover_via_scripts "$error_code"; then
            if attempt_scripts_recovery "$error_code" "$message"; then
                return 0  # Recovery successful
            fi
        fi
    fi

    return 1  # No recovery possible
}

should_propagate_to_scripts() {
    local error_code="$1"

    # Propagate infrastructure and integration errors
    case "$error_code" in
        4*|5*)  # Infrastructure and integration tiers
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}
```

#### Step 2: Implement Error Correlation

**Session Tracking:**
```javascript
// scripts/lib/session-tracker.js
class SessionTracker {
    constructor() {
        this.sessionId = process.env.SESSION_ID || this.generateSessionId();
        this.operations = new Map();
    }

    startOperation(operationName) {
        const correlationId = `${operationName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        this.operations.set(operationName, {
            correlationId,
            startTime: Date.now(),
            operationName
        });

        // Export for tools/ consumption
        process.env.CORRELATION_ID = correlationId;
        process.env.SESSION_ID = this.sessionId;
        process.env.OPERATION_NAME = operationName;

        return correlationId;
    }

    endOperation(operationName, success = true) {
        const operation = this.operations.get(operationName);
        if (!operation) return null;

        const endTime = Date.now();
        const duration = endTime - operation.startTime;

        this.operations.delete(operationName);

        return {
            ...operation,
            endTime,
            duration,
            success
        };
    }
}
```

**Correlation in Shell:**
```bash
# tools/lib/session-tracker.sh
setup_session_context() {
    local operation_name="$1"

    # Inherit or create session ID
    if [[ -z "$SESSION_ID" ]]; then
        export SESSION_ID="session_$(date +%s)_$$"
    fi

    # Create correlation ID for this operation
    export CORRELATION_ID="${operation_name}_$(date +%s)_$$"
    export OPERATION_NAME="$operation_name"
    export OPERATION_START_TIME=$(date +%s)

    if [[ "$ERROR_HANDLER_VERBOSE" == "1" ]]; then
        echo "[DEBUG] Session context: $SESSION_ID / $CORRELATION_ID" >&2
    fi
}

finish_session_context() {
    local success="${1:-1}"
    local end_time=$(date +%s)
    local duration=$((end_time - OPERATION_START_TIME))

    if [[ "$ERROR_HANDLER_VERBOSE" == "1" ]]; then
        echo "[DEBUG] Operation $OPERATION_NAME completed in ${duration}s (success=$success)" >&2
    fi

    # Clean up
    unset CORRELATION_ID OPERATION_NAME OPERATION_START_TIME
}
```

## Phase 4: Advanced Monitoring

### Add Performance Tracking

**Performance-Aware Error Handling:**
```javascript
// scripts/lib/error-codes.js - Enhanced ErrorHandler
class ErrorHandler {
    constructor(options = {}) {
        super(options);
        this.performanceTracker = new PerformanceTracker();
        this.sessionTracker = new SessionTracker();
    }

    async handleOperationWithTracking(operationName, operation) {
        const correlationId = this.sessionTracker.startOperation(operationName);
        this.performanceTracker.startTimer(operationName);

        try {
            const result = await operation();

            const timing = this.performanceTracker.endTimer(operationName);
            this.sessionTracker.endOperation(operationName, true);

            // Log successful operation with performance data
            if (timing && timing.duration > (timing.threshold || 0)) {
                this.logPerformanceWarning(operationName, timing);
            }

            return result;
        } catch (error) {
            this.performanceTracker.endTimer(operationName);
            this.sessionTracker.endOperation(operationName, false);

            // Enhance error with session context
            const enhancedError = this.sessionTracker.enhanceError(error, operationName);
            this.handleError(enhancedError);
        }
    }
}
```

### Enable Centralized Monitoring

**Configuration for Production:**
```javascript
// config/production.js
const productionConfig = {
    errorHandling: {
        centralized: {
            enabled: true,
            endpoint: process.env.ERROR_REPORTING_ENDPOINT,
            apiKey: process.env.ERROR_REPORTING_API_KEY,
            batchSize: 50,
            flushInterval: 10000 // 10 seconds
        },
        retention: {
            logRetentionDays: 90,
            metricsRetentionDays: 365
        },
        alerting: {
            errorRateThreshold: 5, // errors per minute
            timeWindow: 300, // 5 minutes
            channels: ['email', 'slack']
        }
    }
};
```

## Automated Migration Tools

### Migration Script for scripts/

```javascript
#!/usr/bin/env node
// migration/migrate-scripts.js

const fs = require('fs');
const path = require('path');

const migrationPatterns = [
    {
        pattern: /console\.error\(['"`]([^'"`]+)['"`]\)/g,
        replacement: (match, message) => {
            const errorCode = categorizeError(message);
            return `const error = createError(${errorCode}, '${message}'); errorHandler.handleError(error);`;
        }
    },
    {
        pattern: /throw new Error\(['"`]([^'"`]+)['"`]\)/g,
        replacement: (match, message) => {
            const errorCode = categorizeError(message);
            return `throw createError(${errorCode}, '${message}');`;
        }
    },
    {
        pattern: /process\.exit\((\d+)\)/g,
        replacement: 'errorHandler.handleError(error, { exitCode: $1 });'
    }
];

function categorizeError(message) {
    if (message.includes('not found') || message.includes('missing')) {
        return 'ErrorCodes.ENVIRONMENT.FILE_SYSTEM_ERROR';
    }
    if (message.includes('failed') || message.includes('error')) {
        return 'ErrorCodes.ENVIRONMENT.COMMAND_EXECUTION_FAILED';
    }
    return 'ErrorCodes.USER_COMMAND.INVALID_ARGUMENTS';
}

function migrateFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Add import if not present
    if (!content.includes('require(\'./lib/error-codes.js\')')) {
        const importLine = 'const { ErrorHandler, ErrorCodes, createError } = require(\'./lib/error-codes.js\');\n';
        content = content.replace(/^(.*require.*\n)/, `$1${importLine}`);
    }

    // Apply migration patterns
    migrationPatterns.forEach(({ pattern, replacement }) => {
        content = content.replace(pattern, replacement);
    });

    // Write backup and new file
    fs.writeFileSync(`${filePath}.backup`, fs.readFileSync(filePath));
    fs.writeFileSync(filePath, content);

    console.log(`✅ Migrated: ${filePath}`);
}

// Process all .cjs files in scripts/
const scriptsDir = 'scripts';
fs.readdirSync(scriptsDir)
    .filter(file => file.endsWith('.cjs'))
    .forEach(file => migrateFile(path.join(scriptsDir, file)));
```

### Migration Script for tools/

```bash
#!/bin/bash
# migration/migrate-tools.sh

migrate_shell_script() {
    local file="$1"
    local backup_file="${file}.backup"

    # Create backup
    cp "$file" "$backup_file"

    echo "🔄 Migrating $file..."

    # Add error handling source
    if ! grep -q "source.*error-codes.sh" "$file"; then
        sed -i '2i source "$(dirname "$0")/lib/error-codes.sh"' "$file"
    fi

    # Replace common error patterns
    sed -i 's/echo "❌ \([^"]*\)"; exit 1/error_exit $ERROR_USER_INVALID_ARGUMENTS "\1"/g' "$file"
    sed -i 's/echo "⚠️  \([^"]*\)"/error_warn $ERROR_WORKFLOW_FILE_COUNT_MISMATCH "\1"/g' "$file"

    # Replace file checks
    sed -i 's/if \[\[ ! -f "\([^"]*\)" \]\]; then/if [[ ! -f "\1" ]]; then/g' "$file"
    sed -i '/echo "❌.*not found.*"; exit 1/c\    error_exit $ERROR_ENVIRONMENT_FILE_SYSTEM_ERROR "Required file not found: \1" "file=\1"' "$file"

    echo "✅ Migrated: $file"
}

# Process all .sh files in tools/
find tools/ -name "*.sh" -type f | while read -r file; do
    migrate_shell_script "$file"
done
```

## Testing Migration

### Validation Scripts

```bash
#!/bin/bash
# test/migration/validate-migration.sh

test_error_handling_integration() {
    echo "🧪 Testing error handling integration..."

    # Test scripts/ error handling
    if node -e "
        const { ErrorHandler, createError, ErrorCodes } = require('./scripts/lib/error-codes.js');
        const handler = new ErrorHandler({ exitOnError: false });
        const error = createError(ErrorCodes.ENVIRONMENT.PYTHON_NOT_FOUND, 'Test error');
        handler.handleError(error);
        console.log('SUCCESS');
    " | grep -q "SUCCESS"; then
        echo "✅ Scripts error handling: PASS"
    else
        echo "❌ Scripts error handling: FAIL"
        return 1
    fi

    # Test tools/ error handling
    if bash -c "
        source tools/lib/error-codes.sh;
        ERROR_HANDLER_EXIT_ON_ERROR=0;
        handle_error \$ERROR_ENVIRONMENT_PYTHON_NOT_FOUND 'Test error' 'test=true';
        echo 'SUCCESS'
    " | grep -q "SUCCESS"; then
        echo "✅ Tools error handling: PASS"
    else
        echo "❌ Tools error handling: FAIL"
        return 1
    fi

    # Test cross-tier integration
    if test_cross_tier_integration; then
        echo "✅ Cross-tier integration: PASS"
    else
        echo "❌ Cross-tier integration: FAIL"
        return 1
    fi

    return 0
}

test_cross_tier_integration() {
    # Generate error in scripts and read in tools
    node -e "
        const { ProtocolBridge, createError, ErrorCodes } = require('./scripts/lib/error-codes.js');
        const error = createError(ErrorCodes.WORKFLOW.MERGE_VALIDATION_FAILED, 'Cross-tier test');
        ProtocolBridge.writeErrorFile(error, '/tmp/cross_tier_test.env');
    "

    # Read error in tools
    bash -c "
        source tools/lib/error-codes.sh;
        if read_error_from_scripts '/tmp/cross_tier_test.env'; then
            echo 'Cross-tier communication successful';
        fi
    " | grep -q "successful"
}
```

## Rollback Plan

### Automatic Rollback

```bash
#!/bin/bash
# migration/rollback.sh

rollback_migration() {
    echo "🔄 Rolling back error handling migration..."

    # Restore from backups
    find scripts/ tools/ -name "*.backup" | while read -r backup_file; do
        original_file="${backup_file%.backup}"
        echo "Restoring $original_file from backup"
        mv "$backup_file" "$original_file"
    done

    # Remove error handling libraries if they were added
    if [[ -f "scripts/lib/error-codes.js" ]] && [[ ! -f "scripts/lib/error-codes.js.keep" ]]; then
        rm "scripts/lib/error-codes.js"
    fi

    if [[ -f "tools/lib/error-codes.sh" ]] && [[ ! -f "tools/lib/error-codes.sh.keep" ]]; then
        rm "tools/lib/error-codes.sh"
    fi

    echo "✅ Rollback completed"
}

# Verify system still works after rollback
verify_rollback() {
    echo "🧪 Verifying system functionality after rollback..."

    # Test basic script functionality
    if node scripts/multiplatform.cjs validate >/dev/null 2>&1; then
        echo "✅ Scripts functionality: OK"
    else
        echo "❌ Scripts functionality: FAILED"
        return 1
    fi

    # Test basic tools functionality
    if bash tools/progress-dashboard.sh >/dev/null 2>&1; then
        echo "✅ Tools functionality: OK"
    else
        echo "❌ Tools functionality: FAILED"
        return 1
    fi

    return 0
}
```

## Best Practices for Migration

### Migration Checklist

- [ ] **Backup all files** before starting migration
- [ ] **Test in development environment** before production
- [ ] **Migrate incrementally** one script at a time
- [ ] **Validate functionality** after each migration step
- [ ] **Monitor error logs** for issues during migration
- [ ] **Have rollback plan ready** in case of issues
- [ ] **Update documentation** after successful migration
- [ ] **Train team members** on new error handling patterns

### Common Pitfalls to Avoid

1. **Don't migrate everything at once** - Use gradual migration
2. **Don't ignore context information** - Always include relevant context
3. **Don't forget cross-tier integration** - Test communication between scripts/ and tools/
4. **Don't skip testing** - Validate each migration step thoroughly
5. **Don't remove old error handling immediately** - Keep both during transition period

### Performance Considerations

1. **Monitor error handling overhead** - New system should not significantly impact performance
2. **Optimize log file I/O** - Use appropriate buffering and rotation
3. **Implement circuit breakers** - Prevent error handling from causing more errors
4. **Consider memory usage** - Error objects should not consume excessive memory

## Support and Resources

### Getting Help

- **Documentation**: Review error code definitions and examples
- **Testing**: Use provided test scripts to validate migration
- **Rollback**: Use rollback scripts if issues occur
- **Support**: Consult team members familiar with the error handling system

### Additional Resources

- [Error Code Reference](../scripts/lib/error-codes.js) - Complete list of available error codes
- [Shell Error Handling](../tools/lib/error-codes.sh) - Shell-specific error handling functions
- [Error Propagation Protocol](../architecture/error-propagation-protocol.md) - Cross-tier communication
- [Logging Standards](../standards/logging-error-reporting.md) - Logging format and best practices

## Conclusion

This migration guide provides a comprehensive approach to adopting the new unified error handling system. The migration is designed to be gradual, backward-compatible, and safe. Follow the phases in order, test thoroughly at each step, and don't hesitate to use the rollback procedures if needed.

Remember that the goal is to improve error handling consistency, debuggability, and maintainability across the entire codebase while maintaining the existing functionality and performance characteristics.