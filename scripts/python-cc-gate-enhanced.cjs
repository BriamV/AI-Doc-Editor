#!/usr/bin/env node
/**
 * Python Cyclomatic Complexity Gate - Enhanced with Unified Error Handling
 *
 * Runs Radon CC in JSON mode against the backend and fails if any block
 * has a rank worse than the configured threshold (default: B).
 * Uses the unified error handling system for consistent error reporting.
 *
 * Example of migrated script using new error handling patterns.
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Import unified error handling system
const {
  ErrorHandler,
  ErrorCodes,
  createError,
  ProtocolBridge,
  ErrorValidation,
} = require('./lib/error-codes.cjs');

class PythonComplexityGate {
  constructor(options = {}) {
    this.options = {
      verbose: options.verbose || process.env.VERBOSE === '1' || process.argv.includes('--verbose'),
      maxRank: options.maxRank || (process.env.CC_MAX_RANK || 'B').toUpperCase(),
      target: options.target || process.env.CC_TARGET,
      exitOnError: options.exitOnError !== false,
      ...options,
    };

    // Initialize error handler with project-specific configuration
    this.errorHandler = new ErrorHandler({
      verbose: this.options.verbose,
      exitOnError: this.options.exitOnError,
      logFile: 'logs/python-cc-gate.log',
      colorOutput: true,
    });

    // Initialize performance tracking
    this.startTime = Date.now();
    this.operationName = 'python_complexity_analysis';
  }

  /**
   * Get repository root directory
   */
  getRepoRoot() {
    try {
      return process.cwd();
    } catch (error) {
      const enhancedError = createError(
        ErrorCodes.ENVIRONMENT.PATH_RESOLUTION_FAILED,
        'Failed to determine repository root directory',
        { originalError: error.message }
      );
      this.errorHandler.handleError(enhancedError);
    }
  }

  /**
   * Check if running on Windows platform
   */
  isWindows() {
    return process.platform === 'win32';
  }

  /**
   * Get virtual environment path
   */
  getVenvPath(repoRoot) {
    return path.join(repoRoot, 'backend', '.venv');
  }

  /**
   * Get tool path in virtual environment
   */
  getToolPath(repoRoot, toolName) {
    const venv = this.getVenvPath(repoRoot);
    const executable = this.isWindows() ? `${toolName}.exe` : toolName;

    return this.isWindows()
      ? path.join(venv, 'Scripts', executable)
      : path.join(venv, 'bin', executable);
  }

  /**
   * Ensure required tool exists with enhanced error handling
   */
  ensureToolExists(toolPath, toolName = 'tool') {
    if (!fs.existsSync(toolPath)) {
      const error = createError(
        ErrorCodes.ENVIRONMENT.TOOL_NOT_AVAILABLE,
        `${toolName} not found in virtual environment`,
        {
          toolPath: toolPath,
          toolName: toolName,
          platform: process.platform,
          venvPath: path.dirname(path.dirname(toolPath)),
          suggestion: 'Try: yarn python:install',
          helpUrl: 'https://radon.readthedocs.io/en/latest/intro.html',
        }
      );
      this.errorHandler.handleError(error);
    }
  }

  /**
   * Compare complexity ranks
   */
  rankWorseThan(rankA, rankB) {
    const order = ['A', 'B', 'C', 'D', 'E', 'F'];
    return order.indexOf(rankA) > order.indexOf(rankB);
  }

  /**
   * Load approved security complexity exceptions
   */
  loadApprovedExceptions() {
    try {
      // Load approved security complexity exceptions for T-12
      const approvedFunctions = new Set([
        'analyze_access_pattern',
        '_validate_hostname',
        'get_system_dashboard',
        'validate_certificate_chain',
        'get_security_grade',
        '_validate_policy_request',
        '_is_rotation_due',
        'get_certificate_info',
        'get_cipher_suites_for_security_level',
        'get_compliance_report',
        'get_system_health',
      ]);

      const approvedFiles = new Set([
        'credential_monitoring_week4.py',
        'certificate_manager.py',
        'monitoring.py',
        'cipher_suites.py',
        'policy_engine.py',
        'rotation_scheduler.py',
        'tls_config.py',
        'key_management.py',
      ]);

      return { approvedFunctions, approvedFiles };
    } catch (error) {
      const enhancedError = createError(
        ErrorCodes.USER_COMMAND.CONFIGURATION_ERROR,
        'Failed to load approved complexity exceptions',
        {
          originalError: error.message,
          configType: 'security_exceptions',
          task: 'T-12',
        }
      );
      this.errorHandler.handleError(enhancedError, { exitOnError: false });

      // Return empty sets as fallback
      return {
        approvedFunctions: new Set(),
        approvedFiles: new Set(),
      };
    }
  }

  /**
   * Check if file is a test file
   */
  isTestFile(filePath) {
    return (
      filePath.includes('/tests/') || filePath.includes('\\tests\\') || filePath.includes('test_')
    );
  }

  /**
   * Check if function is an approved security exception
   */
  isApprovedSecurityException(filePath, functionName, exceptions) {
    const fileName = path.basename(filePath);

    // Test files are automatically allowed higher complexity
    if (this.isTestFile(filePath)) {
      return true;
    }

    return exceptions.approvedFiles.has(fileName) && exceptions.approvedFunctions.has(functionName);
  }

  /**
   * Execute radon command with enhanced error handling
   */
  executeRadon(radonPath, target) {
    const args = ['cc', target, '-j'];

    if (this.options.verbose) {
      console.log(`[DEBUG] Executing: ${radonPath} ${args.join(' ')}`);
      console.log(`[DEBUG] Working directory: ${process.cwd()}`);
    }

    try {
      const result = spawnSync(radonPath, args, {
        cwd: process.cwd(),
        encoding: 'utf8',
        timeout: 30000, // 30 second timeout
      });

      if (result.error) {
        const error = createError(
          ErrorCodes.ENVIRONMENT.COMMAND_EXECUTION_FAILED,
          `Failed to execute radon: ${result.error.message}`,
          {
            command: radonPath,
            args: args,
            workingDirectory: process.cwd(),
            error: result.error.code,
            timeout: 30000,
          }
        );
        this.errorHandler.handleError(error);
      }

      if (result.status !== 0) {
        const error = createError(
          ErrorCodes.QUALITY.COMPLEXITY_THRESHOLD_EXCEEDED,
          `Radon command failed with exit code ${result.status}`,
          {
            command: radonPath,
            args: args,
            exitCode: result.status,
            stderr: result.stderr,
            stdout: result.stdout,
          }
        );
        this.errorHandler.handleError(error);
      }

      return result;
    } catch (error) {
      const enhancedError = createError(
        ErrorCodes.ENVIRONMENT.COMMAND_EXECUTION_FAILED,
        `Unexpected error during radon execution: ${error.message}`,
        {
          command: radonPath,
          args: args,
          originalError: error.message,
          stack: error.stack,
        }
      );
      this.errorHandler.handleError(enhancedError);
    }
  }

  /**
   * Parse radon JSON output with error handling
   */
  parseRadonOutput(stdout) {
    try {
      return JSON.parse(stdout || '{}');
    } catch (parseError) {
      const error = createError(
        ErrorCodes.INTEGRATION.PROTOCOL_MISMATCH,
        'Failed to parse radon JSON output',
        {
          stdout: stdout,
          parseError: parseError.message,
          expectedFormat: 'JSON',
        }
      );
      this.errorHandler.handleError(error);
    }
  }

  /**
   * Analyze complexity data and generate report
   */
  analyzeComplexity(data, maxRank, exceptions) {
    const offenders = [];
    const approvedExceptions = [];
    const counts = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };

    try {
      for (const [filePath, items] of Object.entries(data)) {
        for (const item of items) {
          const rank = (item.rank || '').toUpperCase();

          if (!counts.hasOwnProperty(rank)) {
            if (this.options.verbose) {
              console.warn(`[WARN] Unknown complexity rank: ${rank} in ${filePath}:${item.lineno}`);
            }
            continue;
          }

          counts[rank] += 1;

          if (this.rankWorseThan(rank, maxRank)) {
            const complexityIssue = {
              file: filePath,
              name: item.name,
              line: item.lineno,
              rank: rank,
              complexity: item.complexity,
            };

            // Check if this is an approved security exception
            if (this.isApprovedSecurityException(filePath, item.name, exceptions)) {
              approvedExceptions.push(complexityIssue);
            } else {
              offenders.push(complexityIssue);
            }
          }
        }
      }

      return { offenders, approvedExceptions, counts };
    } catch (error) {
      const enhancedError = createError(
        ErrorCodes.QUALITY.COMPLEXITY_THRESHOLD_EXCEEDED,
        `Failed to analyze complexity data: ${error.message}`,
        {
          dataKeys: Object.keys(data),
          maxRank: maxRank,
          originalError: error.message,
        }
      );
      this.errorHandler.handleError(enhancedError);
    }
  }

  /**
   * Generate complexity summary report
   */
  generateReport(analysis, maxRank) {
    const { offenders, approvedExceptions, counts } = analysis;

    const summary = `Complexity summary: A=${counts.A} B=${counts.B} C=${counts.C} D=${counts.D} E=${counts.E} F=${counts.F}`;
    console.log(summary);

    // Log performance metrics
    const duration = Date.now() - this.startTime;
    if (this.options.verbose) {
      console.log(`[DEBUG] Analysis completed in ${duration}ms`);
    }

    if (approvedExceptions.length > 0) {
      console.log(`\n✅ Approved security exceptions (${approvedExceptions.length}):`);
      approvedExceptions.forEach(({ file, name, line, rank, complexity }) => {
        console.log(
          `  - [${rank}] ${path.basename(file)}:${line} ${name} (T-12 security, CC=${complexity})`
        );
      });
    }

    if (offenders.length > 0) {
      const error = createError(
        ErrorCodes.QUALITY.COMPLEXITY_THRESHOLD_EXCEEDED,
        `Complexity gate failed (max allowed: ${maxRank}). Found ${offenders.length} violations.`,
        {
          maxAllowed: maxRank,
          violationCount: offenders.length,
          offenders: offenders.map(o => ({
            file: o.file,
            function: o.name,
            line: o.line,
            rank: o.rank,
            complexity: o.complexity,
          })),
          approvedExceptions: approvedExceptions.length,
          totalFunctions: Object.values(counts).reduce((a, b) => a + b, 0),
        }
      );

      console.error(`\n❌ Complexity gate failed (max allowed: ${maxRank}). Offenders:`);
      offenders
        .sort((a, b) => (a.rank > b.rank ? -1 : a.rank < b.rank ? 1 : 0))
        .forEach(({ file, name, line, rank, complexity }) => {
          console.error(`  - [${rank}] ${file}:${line} ${name} (CC=${complexity})`);
        });

      this.errorHandler.handleError(error);
    }

    console.log(`\n✅ Complexity gate passed (max allowed: ${maxRank})`);

    if (this.options.verbose) {
      console.log(`[DEBUG] Total analysis time: ${duration}ms`);
      console.log(
        `[DEBUG] Functions analyzed: ${Object.values(counts).reduce((a, b) => a + b, 0)}`
      );
    }
  }

  /**
   * Write cross-tier error information for tools/ integration
   */
  writeErrorForTools(error) {
    try {
      ProtocolBridge.writeErrorFile(error, '/tmp/python_cc_gate_error.env');

      if (this.options.verbose) {
        console.log('[DEBUG] Error information written for tools/ integration');
      }
    } catch (bridgeError) {
      // Don't fail the main operation if bridge fails
      console.warn('[WARN] Failed to write error for tools/ integration:', bridgeError.message);
    }
  }

  /**
   * Main execution method
   */
  async execute() {
    try {
      if (this.options.verbose) {
        console.log(
          `[DEBUG] Starting Python complexity analysis (operation: ${this.operationName})`
        );
      }

      const repoRoot = this.getRepoRoot();
      const backendDir = path.join(repoRoot, 'backend');
      const radonPath = this.getToolPath(repoRoot, 'radon');
      const target = this.options.target || backendDir;

      // Validate environment
      this.ensureToolExists(radonPath, 'Radon');

      if (!fs.existsSync(target)) {
        const error = createError(
          ErrorCodes.ENVIRONMENT.FILE_SYSTEM_ERROR,
          `Target directory not found: ${target}`,
          {
            target: target,
            repoRoot: repoRoot,
            expectedPath: backendDir,
          }
        );
        this.errorHandler.handleError(error);
      }

      // Load configuration
      const exceptions = this.loadApprovedExceptions();

      if (this.options.verbose) {
        console.log(`[DEBUG] Loaded ${exceptions.approvedFunctions.size} approved functions`);
        console.log(`[DEBUG] Loaded ${exceptions.approvedFiles.size} approved files`);
      }

      // Execute radon analysis
      const result = this.executeRadon(radonPath, target);
      const data = this.parseRadonOutput(result.stdout);

      // Analyze results
      const analysis = this.analyzeComplexity(data, this.options.maxRank, exceptions);

      // Generate report
      this.generateReport(analysis, this.options.maxRank);

      return {
        success: true,
        analysis: analysis,
        duration: Date.now() - this.startTime,
      };
    } catch (error) {
      // Ensure all errors go through our error handling system
      if (error.name !== 'StandardizedError') {
        const wrappedError = createError(
          ErrorCodes.INTEGRATION.INTERFACE_CONTRACT_VIOLATION,
          `Unhandled error in Python complexity gate: ${error.message}`,
          {
            originalError: error.message,
            stack: error.stack,
            operation: this.operationName,
          }
        );
        this.writeErrorForTools(wrappedError);
        this.errorHandler.handleError(wrappedError);
      } else {
        this.writeErrorForTools(error);
        throw error; // Re-throw standardized errors
      }
    }
  }
}

// Self-test functionality
function runSelfTest() {
  console.log('🧪 Running Python Complexity Gate self-test...');

  try {
    // Test error handling system
    if (!ErrorValidation.runSelfTest()) {
      throw new Error('Error handling self-test failed');
    }

    // Test gate initialization
    const gate = new PythonComplexityGate({
      verbose: true,
      exitOnError: false,
    });

    console.log('✅ Gate initialization: PASS');

    // Test utility functions
    const repoRoot = gate.getRepoRoot();
    if (!repoRoot) {
      throw new Error('Failed to get repo root');
    }
    console.log('✅ Repository detection: PASS');

    const toolPath = gate.getToolPath(repoRoot, 'radon');
    if (!toolPath.includes('radon')) {
      throw new Error('Tool path generation failed');
    }
    console.log('✅ Tool path generation: PASS');

    console.log('🎉 All self-tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Self-test failed:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  // Check for self-test mode
  if (process.argv.includes('--self-test')) {
    const success = runSelfTest();
    process.exit(success ? 0 : 1);
  }

  // Parse command line options
  const options = {
    verbose: process.argv.includes('--verbose'),
    maxRank: process.env.CC_MAX_RANK || 'B',
    target: process.env.CC_TARGET,
  };

  // Execute complexity gate
  const gate = new PythonComplexityGate(options);
  await gate.execute();
}

// Execute if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error.message);
    process.exit(1);
  });
}

module.exports = PythonComplexityGate;
