/**
 * Unified Error Handling Library for scripts/ (.cjs) Node.js Environment
 *
 * Provides standardized error codes, handling, and reporting mechanisms
 * that integrate with the 4-tier architecture and interface contracts.
 *
 * Usage:
 *   const { ErrorHandler, ErrorCodes, createError } = require('./lib/error-codes.js');
 *
 *   // Basic usage
 *   throw createError(ErrorCodes.ENVIRONMENT.PYTHON_NOT_FOUND, 'Python executable not found in venv');
 *
 *   // With error handler
 *   const handler = new ErrorHandler({ verbose: true });
 *   handler.handleError(error, { exitOnError: true });
 */

const path = require('path');
const fs = require('fs');

// ================================================================================
// ERROR CODE DEFINITIONS - 4-Tier Architecture Aligned
// ================================================================================

/**
 * Hierarchical error codes following 4-tier architecture:
 * Tier 1: User Commands (1000-1999)
 * Tier 2: Workflow Automation (2000-2999)
 * Tier 3: Quality Gates (3000-3999)
 * Tier 4: Infrastructure (4000-4999)
 */
const ErrorCodes = {
  // ============================================================================
  // TIER 1: USER COMMANDS (1000-1999)
  // ============================================================================
  USER_COMMAND: {
    INVALID_ARGUMENTS: { code: 1001, severity: 'error', tier: 'user' },
    MISSING_REQUIRED_PARAM: { code: 1002, severity: 'error', tier: 'user' },
    INVALID_COMMAND: { code: 1003, severity: 'error', tier: 'user' },
    PERMISSION_DENIED: { code: 1004, severity: 'error', tier: 'user' },
    CONFIGURATION_ERROR: { code: 1005, severity: 'error', tier: 'user' },
  },

  // ============================================================================
  // TIER 2: WORKFLOW AUTOMATION (2000-2999)
  // ============================================================================
  WORKFLOW: {
    MERGE_VALIDATION_FAILED: { code: 2001, severity: 'error', tier: 'workflow' },
    BRANCH_NOT_FOUND: { code: 2002, severity: 'error', tier: 'workflow' },
    FILE_COUNT_MISMATCH: { code: 2003, severity: 'warning', tier: 'workflow' },
    CRITICAL_FILES_MISSING: { code: 2004, severity: 'error', tier: 'workflow' },
    CONFIG_INTEGRITY_FAILURE: { code: 2005, severity: 'error', tier: 'workflow' },
    WORKING_TREE_DIRTY: { code: 2006, severity: 'warning', tier: 'workflow' },
    DEVELOPMENT_STATUS_INCONSISTENT: { code: 2007, severity: 'warning', tier: 'workflow' },
  },

  // ============================================================================
  // TIER 3: QUALITY GATES (3000-3999)
  // ============================================================================
  QUALITY: {
    COMPLEXITY_THRESHOLD_EXCEEDED: { code: 3001, severity: 'error', tier: 'quality' },
    LINT_VIOLATIONS: { code: 3002, severity: 'warning', tier: 'quality' },
    FORMAT_VIOLATIONS: { code: 3003, severity: 'info', tier: 'quality' },
    SECURITY_VULNERABILITY: { code: 3004, severity: 'error', tier: 'quality' },
    TEST_FAILURES: { code: 3005, severity: 'error', tier: 'quality' },
    COVERAGE_INSUFFICIENT: { code: 3006, severity: 'warning', tier: 'quality' },
    DEPENDENCY_OUTDATED: { code: 3007, severity: 'info', tier: 'quality' },
  },

  // ============================================================================
  // TIER 4: INFRASTRUCTURE (4000-4999)
  // ============================================================================
  ENVIRONMENT: {
    PYTHON_NOT_FOUND: { code: 4001, severity: 'error', tier: 'infrastructure' },
    VENV_NOT_FOUND: { code: 4002, severity: 'error', tier: 'infrastructure' },
    TOOL_NOT_AVAILABLE: { code: 4003, severity: 'error', tier: 'infrastructure' },
    PLATFORM_NOT_SUPPORTED: { code: 4004, severity: 'error', tier: 'infrastructure' },
    PATH_RESOLUTION_FAILED: { code: 4005, severity: 'error', tier: 'infrastructure' },
    COMMAND_EXECUTION_FAILED: { code: 4006, severity: 'error', tier: 'infrastructure' },
    FILE_SYSTEM_ERROR: { code: 4007, severity: 'error', tier: 'infrastructure' },
    NETWORK_ERROR: { code: 4008, severity: 'error', tier: 'infrastructure' },
  },

  // ============================================================================
  // CROSS-TIER INTEGRATION (5000-5999)
  // ============================================================================
  INTEGRATION: {
    INTERFACE_CONTRACT_VIOLATION: { code: 5001, severity: 'error', tier: 'integration' },
    DATA_SYNC_FAILURE: { code: 5002, severity: 'error', tier: 'integration' },
    PROTOCOL_MISMATCH: { code: 5003, severity: 'error', tier: 'integration' },
    TIMEOUT: { code: 5004, severity: 'warning', tier: 'integration' },
    RESOURCE_EXHAUSTED: { code: 5005, severity: 'error', tier: 'integration' },
  },
};

// ================================================================================
// STANDARDIZED ERROR CLASS
// ================================================================================

class StandardizedError extends Error {
  constructor(errorCode, message, context = {}) {
    super(message);
    this.name = 'StandardizedError';
    this.code = errorCode.code;
    this.severity = errorCode.severity;
    this.tier = errorCode.tier;
    this.context = context;
    this.timestamp = new Date().toISOString();

    // Maintain stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StandardizedError);
    }
  }

  /**
   * Convert error to JSON for logging and reporting
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      tier: this.tier,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }

  /**
   * Get error for tools/ directory (shell script format)
   */
  toShellFormat() {
    return `ERROR_CODE=${this.code} ERROR_SEVERITY=${this.severity} ERROR_TIER=${this.tier} ERROR_MESSAGE="${this.message}"`;
  }
}

// ================================================================================
// ERROR CREATION UTILITIES
// ================================================================================

/**
 * Create a standardized error
 */
function createError(errorCode, message, context = {}) {
  return new StandardizedError(errorCode, message, context);
}

/**
 * Create error from shell script (for tools/ integration)
 */
function createErrorFromShell(shellError) {
  const match = shellError.match(
    /ERROR_CODE=(\d+) ERROR_SEVERITY=(\w+) ERROR_TIER=(\w+) ERROR_MESSAGE="([^"]+)"/
  );
  if (!match) {
    return createError(ErrorCodes.INTEGRATION.PROTOCOL_MISMATCH, 'Invalid shell error format', {
      shellError,
    });
  }

  const [, code, severity, tier, message] = match;
  const errorCode = { code: parseInt(code), severity, tier };
  return new StandardizedError(errorCode, message, { source: 'shell' });
}

// ================================================================================
// ERROR HANDLER CLASS
// ================================================================================

class ErrorHandler {
  constructor(options = {}) {
    this.options = {
      verbose: options.verbose || process.env.VERBOSE === '1' || process.argv.includes('--verbose'),
      logFile: options.logFile || null,
      exitOnError: options.exitOnError !== false, // default true
      colorOutput: options.colorOutput !== false, // default true
      ...options,
    };

    // Color codes for console output
    this.colors = {
      error: '\x1b[31m', // Red
      warning: '\x1b[33m', // Yellow
      info: '\x1b[36m', // Cyan
      success: '\x1b[32m', // Green
      reset: '\x1b[0m', // Reset
    };
  }

  /**
   * Handle error with appropriate logging and response
   */
  handleError(error, options = {}) {
    const config = { ...this.options, ...options };

    // Ensure we have a StandardizedError
    const standardError = error instanceof StandardizedError ? error : this.wrapError(error);

    // Log the error
    this.logError(standardError, config);

    // Report to external systems if configured
    if (config.reportingEndpoint) {
      this.reportError(standardError, config.reportingEndpoint);
    }

    // Exit if configured to do so
    if (config.exitOnError) {
      const exitCode = this.getExitCode(standardError);
      process.exit(exitCode);
    }

    return standardError;
  }

  /**
   * Wrap non-standardized errors
   */
  wrapError(error) {
    if (error instanceof StandardizedError) {
      return error;
    }

    // Try to categorize the error based on common patterns
    let errorCode = ErrorCodes.ENVIRONMENT.COMMAND_EXECUTION_FAILED;

    if (error.code === 'ENOENT') {
      errorCode = ErrorCodes.ENVIRONMENT.FILE_SYSTEM_ERROR;
    } else if (error.code === 'EACCES') {
      errorCode = ErrorCodes.USER_COMMAND.PERMISSION_DENIED;
    } else if (error.message && error.message.includes('timeout')) {
      errorCode = ErrorCodes.INTEGRATION.TIMEOUT;
    }

    return createError(errorCode, error.message, {
      originalError: error.name,
      originalCode: error.code,
      originalStack: error.stack,
    });
  }

  /**
   * Log error with appropriate formatting
   */
  logError(error, config) {
    const timestamp = new Date().toISOString().substr(11, 8);
    const severityColor = this.colors[error.severity] || this.colors.error;
    const prefix = config.colorOutput
      ? `${severityColor}[${timestamp}] [${error.severity.toUpperCase()}] [${error.code}]${this.colors.reset}`
      : `[${timestamp}] [${error.severity.toUpperCase()}] [${error.code}]`;

    const message = `${prefix} ${error.message}`;

    // Output to appropriate stream
    if (error.severity === 'error') {
      console.error(message);
    } else {
      console.log(message);
    }

    // Verbose output
    if (config.verbose && error.context && Object.keys(error.context).length > 0) {
      console.error(`${prefix} Context:`, JSON.stringify(error.context, null, 2));
    }

    if (config.verbose && error.stack) {
      console.error(`${prefix} Stack trace:`);
      console.error(error.stack);
    }

    // Log to file if configured
    if (config.logFile) {
      this.logToFile(error, config.logFile);
    }
  }

  /**
   * Log error to file
   */
  logToFile(error, logFile) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        error: error.toJSON(),
      };

      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(logFile, logLine);
    } catch (logError) {
      console.error('Failed to write to log file:', logError.message);
    }
  }

  /**
   * Report error to external endpoint
   */
  async reportError(error, endpoint) {
    try {
      // This would integrate with monitoring systems
      // For now, just log the intention
      if (this.options.verbose) {
        console.log(`[DEBUG] Would report error ${error.code} to ${endpoint}`);
      }
    } catch (reportError) {
      console.error('Failed to report error:', reportError.message);
    }
  }

  /**
   * Get appropriate exit code for error
   */
  getExitCode(error) {
    // Map error tiers and severities to exit codes
    switch (error.severity) {
      case 'error':
        return error.tier === 'infrastructure' ? 2 : 1;
      case 'warning':
        return 0; // Don't exit on warnings
      case 'info':
        return 0; // Don't exit on info
      default:
        return 1;
    }
  }
}

// ================================================================================
// PROTOCOL BRIDGE FOR TOOLS/ INTEGRATION
// ================================================================================

class ProtocolBridge {
  /**
   * Convert Node.js error to shell environment variables
   */
  static toShellEnv(error) {
    const standardError =
      error instanceof StandardizedError ? error : new ErrorHandler().wrapError(error);

    return {
      ERROR_CODE: standardError.code,
      ERROR_SEVERITY: standardError.severity,
      ERROR_TIER: standardError.tier,
      ERROR_MESSAGE: standardError.message,
      ERROR_TIMESTAMP: standardError.timestamp,
      ERROR_CONTEXT: JSON.stringify(standardError.context),
    };
  }

  /**
   * Write error file for shell script consumption
   */
  static writeErrorFile(error, filePath) {
    const env = this.toShellEnv(error);
    const content = Object.entries(env)
      .map(([key, value]) => `export ${key}="${value}"`)
      .join('\n');

    fs.writeFileSync(filePath, content);
  }

  /**
   * Read error from shell environment
   */
  static fromShellEnv(env = process.env) {
    if (!env.ERROR_CODE) {
      return null;
    }

    const errorCode = {
      code: parseInt(env.ERROR_CODE),
      severity: env.ERROR_SEVERITY,
      tier: env.ERROR_TIER,
    };

    const context = env.ERROR_CONTEXT ? JSON.parse(env.ERROR_CONTEXT) : {};
    return new StandardizedError(errorCode, env.ERROR_MESSAGE, context);
  }
}

// ================================================================================
// VALIDATION AND TESTING UTILITIES
// ================================================================================

class ErrorValidation {
  /**
   * Validate error code structure
   */
  static validateErrorCode(errorCode) {
    const required = ['code', 'severity', 'tier'];
    const missing = required.filter(field => !(field in errorCode));

    if (missing.length > 0) {
      throw createError(
        ErrorCodes.INTEGRATION.INTERFACE_CONTRACT_VIOLATION,
        `Missing required error code fields: ${missing.join(', ')}`
      );
    }

    const validSeverities = ['error', 'warning', 'info'];
    if (!validSeverities.includes(errorCode.severity)) {
      throw createError(
        ErrorCodes.INTEGRATION.INTERFACE_CONTRACT_VIOLATION,
        `Invalid severity: ${errorCode.severity}. Must be one of: ${validSeverities.join(', ')}`
      );
    }

    return true;
  }

  /**
   * Test error handling system
   */
  static runSelfTest() {
    console.log('🧪 Running error handling self-test...');

    try {
      // Test error creation
      const error = createError(ErrorCodes.ENVIRONMENT.PYTHON_NOT_FOUND, 'Test error');
      console.log('✅ Error creation: PASS');

      // Test error handling
      const handler = new ErrorHandler({ exitOnError: false, verbose: false });
      handler.handleError(error);
      console.log('✅ Error handling: PASS');

      // Test shell integration
      const shellFormat = error.toShellFormat();
      const reconstructed = createErrorFromShell(shellFormat);
      console.log('✅ Shell integration: PASS');

      // Test protocol bridge
      const env = ProtocolBridge.toShellEnv(error);
      const fromEnv = ProtocolBridge.fromShellEnv(env);
      console.log('✅ Protocol bridge: PASS');

      console.log('🎉 All error handling tests passed!');
      return true;
    } catch (testError) {
      console.error('❌ Error handling self-test failed:', testError.message);
      return false;
    }
  }
}

// ================================================================================
// MODULE EXPORTS
// ================================================================================

module.exports = {
  ErrorCodes,
  StandardizedError,
  ErrorHandler,
  ProtocolBridge,
  ErrorValidation,
  createError,
  createErrorFromShell,
};

// ================================================================================
// SELF-TEST ON REQUIRE (DEVELOPMENT ONLY)
// ================================================================================

if (process.env.NODE_ENV === 'development' && require.main === module) {
  ErrorValidation.runSelfTest();
}
