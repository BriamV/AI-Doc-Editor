#!/usr/bin/env node
/**
 * Python Timeout Monitor and Optimizer
 *
 * Monitors Python test execution times and provides optimization recommendations
 * for achieving 100% be:* namespace reliability.
 *
 * Features:
 * - Real-time timeout monitoring
 * - Performance metrics collection
 * - Automatic timeout adjustment recommendations
 * - Development vs production mode optimization
 * - Parallel execution management
 */

const { spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

class PythonTimeoutMonitor {
  constructor() {
    this.isWin = process.platform === 'win32';
    this.repoRoot = process.cwd();
    this.backendDir = path.join(this.repoRoot, 'backend');
    this.venvDir = path.join(this.backendDir, '.venv');

    // Performance thresholds
    this.thresholds = {
      unit: 30, // Unit tests: 30 seconds
      integration: 120, // Integration tests: 2 minutes
      security: 180, // Security tests: 3 minutes
      performance: 300, // Performance tests: 5 minutes
      coverage: 90, // Coverage tests: 1.5 minutes
    };

    // Monitoring data
    this.metrics = {
      executions: [],
      failures: [],
      timeouts: [],
      recommendations: [],
    };
  }

  log(level, message, ...args) {
    const timestamp = new Date().toISOString().substr(11, 8);
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'error':
        console.error(`${prefix} ${message}`, ...args);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`, ...args);
        break;
      case 'info':
        console.log(`${prefix} ${message}`, ...args);
        break;
      default:
        console.log(`${prefix} ${message}`, ...args);
    }
  }

  getVenvPython() {
    return this.isWin
      ? path.join(this.venvDir, 'Scripts', 'python.exe')
      : path.join(this.venvDir, 'bin', 'python');
  }

  getVenvTool(toolName) {
    const executable = this.isWin ? `${toolName}.exe` : toolName;
    return this.isWin
      ? path.join(this.venvDir, 'Scripts', executable)
      : path.join(this.venvDir, 'bin', executable);
  }

  determineTestType(args) {
    const argsStr = args.join(' ');

    if (argsStr.includes('--cov')) return 'coverage';
    if (argsStr.includes('security')) return 'security';
    if (argsStr.includes('performance')) return 'performance';
    if (argsStr.includes('integration')) return 'integration';
    return 'unit';
  }

  async runMonitoredCommand(command, args, options = {}) {
    const testType = this.determineTestType(args);
    const timeout = options.timeout || this.thresholds[testType] * 1000;
    const startTime = Date.now();

    this.log('info', `Starting ${testType} tests with ${timeout / 1000}s timeout`);
    this.log('info', `Command: ${command} ${args.join(' ')}`);

    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: 'inherit',
        cwd: this.repoRoot,
        env: { ...process.env, PYTHONPATH: this.backendDir },
        ...options,
      });

      // Timeout handler
      const timeoutId = setTimeout(() => {
        this.log('error', `Test execution timed out after ${timeout / 1000}s`);
        child.kill('SIGTERM');

        this.metrics.timeouts.push({
          testType,
          duration: timeout,
          command: `${command} ${args.join(' ')}`,
          timestamp: new Date().toISOString(),
        });

        // Try graceful kill first, then force kill
        setTimeout(() => {
          if (!child.killed) {
            this.log('warn', 'Force killing hanging process...');
            child.kill('SIGKILL');
          }
        }, 5000);

        reject(new Error(`Timeout after ${timeout / 1000}s`));
      }, timeout);

      child.on('exit', (code, signal) => {
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        this.metrics.executions.push({
          testType,
          duration,
          exitCode: code,
          signal,
          command: `${command} ${args.join(' ')}`,
          timestamp: new Date().toISOString(),
        });

        if (code === 0) {
          this.log('info', `Tests completed successfully in ${duration / 1000}s`);
          resolve({ code, duration, signal });
        } else {
          this.log('error', `Tests failed with exit code ${code} after ${duration / 1000}s`);
          this.metrics.failures.push({
            testType,
            duration,
            exitCode: code,
            signal,
            command: `${command} ${args.join(' ')}`,
            timestamp: new Date().toISOString(),
          });

          if (signal) {
            reject(new Error(`Process terminated by signal ${signal}`));
          } else {
            reject(new Error(`Exit code ${code}`));
          }
        }
      });

      child.on('error', error => {
        clearTimeout(timeoutId);
        this.log('error', `Process error: ${error.message}`);
        reject(error);
      });
    });
  }

  generateRecommendations() {
    const recommendations = [];

    // Analyze timeout patterns
    const timeoutsByType = {};
    this.metrics.timeouts.forEach(timeout => {
      timeoutsByType[timeout.testType] = (timeoutsByType[timeout.testType] || 0) + 1;
    });

    Object.entries(timeoutsByType).forEach(([testType, count]) => {
      if (count > 0) {
        recommendations.push({
          type: 'timeout',
          testType,
          issue: `${count} timeout(s) in ${testType} tests`,
          suggestion: `Consider increasing ${testType} timeout from ${this.thresholds[testType]}s to ${this.thresholds[testType] * 1.5}s`,
        });
      }
    });

    // Analyze performance patterns
    const avgDurations = {};
    const executionsByType = {};

    this.metrics.executions.forEach(exec => {
      if (!executionsByType[exec.testType]) {
        executionsByType[exec.testType] = [];
      }
      executionsByType[exec.testType].push(exec.duration);
    });

    Object.entries(executionsByType).forEach(([testType, durations]) => {
      if (durations.length > 0) {
        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
        const max = Math.max(...durations);
        avgDurations[testType] = { avg: avg / 1000, max: max / 1000 };

        if (avg / 1000 > this.thresholds[testType] * 0.8) {
          recommendations.push({
            type: 'performance',
            testType,
            issue: `${testType} tests averaging ${(avg / 1000).toFixed(1)}s (threshold: ${this.thresholds[testType]}s)`,
            suggestion: `Optimize ${testType} test performance or increase timeout`,
          });
        }
      }
    });

    return { recommendations, avgDurations, timeoutsByType };
  }

  async runOptimizedTests(testType = 'unit') {
    const pytestPath = this.getVenvTool('pytest');
    const pythonPath = this.getVenvPython();

    let command, args;

    // Choose optimal command and arguments based on test type
    if (fs.existsSync(pytestPath)) {
      command = pytestPath;
      args = this.getOptimizedArgs(testType);
    } else {
      command = pythonPath;
      args = ['-m', 'pytest', ...this.getOptimizedArgs(testType)];
    }

    try {
      const result = await this.runMonitoredCommand(command, args, {
        timeout: this.thresholds[testType] * 1000,
      });
      return result;
    } catch (error) {
      throw error;
    }
  }

  getOptimizedArgs(testType) {
    const baseArgs = ['backend/tests', '--tb=short', '--no-header', '-v'];

    switch (testType) {
      case 'unit':
        return [
          ...baseArgs,
          '--timeout=30',
          '--maxfail=5',
          '-x',
          '-m',
          'not slow and not security and not performance',
        ];

      case 'integration':
        return [...baseArgs, 'backend/tests/integration', '--timeout=120', '--maxfail=3'];

      case 'security':
        return [...baseArgs, 'backend/tests/security', '--timeout=180', '--maxfail=3'];

      case 'coverage':
        return [
          ...baseArgs,
          '--timeout=90',
          '--maxfail=3',
          '--cov=backend',
          '--cov-report=term-missing',
          '--cov-fail-under=60',
        ];

      case 'quick':
        return [
          'backend/tests/integration/test_backend.py',
          'backend/tests/integration/test_credentials.py',
          '--tb=short',
          '--no-header',
          '-v',
          '--timeout=30',
          '-x',
        ];

      default:
        return baseArgs;
    }
  }

  printMetricsReport() {
    console.log('\n=== Python Test Performance Report ===');

    if (this.metrics.executions.length === 0) {
      console.log('No test executions recorded.');
      return;
    }

    const analysis = this.generateRecommendations();

    console.log('\n--- Execution Summary ---');
    console.log(`Total executions: ${this.metrics.executions.length}`);
    console.log(`Failures: ${this.metrics.failures.length}`);
    console.log(`Timeouts: ${this.metrics.timeouts.length}`);

    if (Object.keys(analysis.avgDurations).length > 0) {
      console.log('\n--- Average Durations by Test Type ---');
      Object.entries(analysis.avgDurations).forEach(([type, stats]) => {
        const status = stats.avg < this.thresholds[type] ? '✅' : '⚠️';
        console.log(
          `${status} ${type}: avg ${stats.avg.toFixed(1)}s, max ${stats.max.toFixed(1)}s (threshold: ${this.thresholds[type]}s)`
        );
      });
    }

    if (analysis.recommendations.length > 0) {
      console.log('\n--- Optimization Recommendations ---');
      analysis.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.type.toUpperCase()}] ${rec.issue}`);
        console.log(`   → ${rec.suggestion}`);
      });
    } else {
      console.log('\n✅ All tests performing within acceptable thresholds');
    }

    console.log('=====================================\n');
  }

  async execute() {
    const [, , command, ...args] = process.argv;

    if (!command) {
      console.log('Usage: node scripts/python-timeout-monitor.cjs <command> [args...]');
      console.log('Commands:');
      console.log(
        '  test [type]     - Run monitored tests (unit|integration|security|coverage|quick)'
      );
      console.log('  monitor         - Start continuous monitoring');
      console.log('  report          - Show performance report');
      console.log('  optimize        - Run optimization analysis');
      process.exit(1);
    }

    try {
      switch (command) {
        case 'test': {
          const testType = args[0] || 'unit';
          this.log('info', `Running ${testType} tests with monitoring...`);
          await this.runOptimizedTests(testType);
          this.printMetricsReport();
          break;
        }

        case 'monitor': {
          this.log('info', 'Starting continuous monitoring mode...');
          // In a real implementation, this would watch for test executions
          console.log('Monitoring mode not yet implemented');
          break;
        }

        case 'report': {
          this.printMetricsReport();
          break;
        }

        case 'optimize': {
          this.log('info', 'Running optimization analysis...');

          // Run different test types and collect metrics
          for (const testType of ['unit', 'quick']) {
            try {
              this.log('info', `Testing ${testType} performance...`);
              await this.runOptimizedTests(testType);
            } catch (error) {
              this.log('warn', `${testType} tests failed: ${error.message}`);
            }
          }

          this.printMetricsReport();
          break;
        }

        default:
          console.error(`Unknown command: ${command}`);
          process.exit(1);
      }
    } catch (error) {
      this.log('error', error.message);
      process.exit(1);
    }
  }
}

// Execute if called directly
if (require.main === module) {
  const monitor = new PythonTimeoutMonitor();
  monitor.execute().catch(error => {
    console.error('Unhandled error:', error.message);
    process.exit(1);
  });
}

module.exports = PythonTimeoutMonitor;
