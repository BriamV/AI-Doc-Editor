/**
 * Performance Benchmarking Suite for Cross-System Integration
 *
 * Provides comprehensive performance testing and regression detection for:
 * - Script execution times
 * - Cross-system call latency
 * - Error propagation performance
 * - Memory usage patterns
 * - Throughput under load
 * - Resource utilization
 *
 * Features:
 * - Baseline establishment and comparison
 * - Statistical analysis with confidence intervals
 * - Performance regression detection
 * - Resource monitoring
 * - Bottleneck identification
 * - Trend analysis
 *
 * @author Claude Code - Performance Test Specialist
 * @version 1.0.0
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const os = require('os');
const { performance } = require('perf_hooks');

class PerformanceBenchmarkSuite {
  constructor(options = {}) {
    this.options = {
      verbose: options.verbose || false,
      iterations: options.iterations || 10,
      warmupRounds: options.warmupRounds || 3,
      timeout: options.timeout || 30000,
      confidenceLevel: options.confidenceLevel || 0.95,
      regressionThreshold: options.regressionThreshold || 0.15, // 15% regression threshold
      baselineFile: options.baselineFile || 'tests/integration/performance-baseline.json',
      reportDir: options.reportDir || 'tests/integration/reports',
      budgets: {
        scriptExecution: 5000,      // 5s max for script execution
        crossSystemCall: 2000,     // 2s max for cross-system calls
        errorPropagation: 500,     // 500ms max for error propagation
        dataExchange: 1000,        // 1s max for data exchange
        memoryUsage: 100 * 1024 * 1024  // 100MB max memory usage
      },
      ...options
    };

    this.results = {
      benchmarks: [],
      regressions: [],
      improvements: [],
      budgetViolations: [],
      systemMetrics: {}
    };

    this.baseline = null;
  }

  /**
   * Run complete performance benchmark suite
   */
  async runCompleteBenchmarkSuite() {
    console.log('⚡ Starting Performance Benchmark Suite\n');

    try {
      // Load existing baseline if available
      await this.loadBaseline();

      // Setup performance monitoring
      await this.setupPerformanceMonitoring();

      // Phase 1: Script Execution Benchmarks
      await this.benchmarkScriptExecution();

      // Phase 2: Cross-System Call Performance
      await this.benchmarkCrossSystemCalls();

      // Phase 3: Error Propagation Performance
      await this.benchmarkErrorPropagation();

      // Phase 4: Data Exchange Performance
      await this.benchmarkDataExchange();

      // Phase 5: Memory Usage Patterns
      await this.benchmarkMemoryUsage();

      // Phase 6: Load Testing Performance
      await this.benchmarkUnderLoad();

      // Phase 7: Resource Utilization Analysis
      await this.analyzeResourceUtilization();

      // Analysis and reporting
      await this.analyzePerformanceResults();
      const report = await this.generatePerformanceReport();

      // Update baseline if this is a good run
      await this.updateBaseline();

      return report;

    } catch (error) {
      console.error('❌ Performance benchmark suite failed:', error.message);
      throw error;
    }
  }

  /**
   * Load existing performance baseline
   */
  async loadBaseline() {
    try {
      if (fsSync.existsSync(this.options.baselineFile)) {
        const baselineData = await fs.readFile(this.options.baselineFile, 'utf8');
        this.baseline = JSON.parse(baselineData);
        console.log(`📊 Loaded performance baseline from ${this.options.baselineFile}`);
      } else {
        console.log('📊 No existing baseline found - will establish new baseline');
        this.baseline = null;
      }
    } catch (error) {
      console.log(`⚠️ Failed to load baseline: ${error.message}`);
      this.baseline = null;
    }
  }

  /**
   * Setup performance monitoring infrastructure
   */
  async setupPerformanceMonitoring() {
    // Ensure report directory exists
    await fs.mkdir(this.options.reportDir, { recursive: true });

    // Initialize system metrics collection
    this.results.systemMetrics = {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      cpuCount: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      loadAverage: os.loadavg(),
      startTime: performance.now()
    };

    console.log('🔧 Performance monitoring setup complete');
  }

  /**
   * Phase 1: Benchmark script execution performance
   */
  async benchmarkScriptExecution() {
    console.log('📜 Phase 1: Script Execution Benchmarks...');

    const scriptsToTest = [
      {
        name: 'multiplatform-validate',
        command: 'node',
        args: ['scripts/multiplatform.cjs', 'validate'],
        budget: this.options.budgets.scriptExecution
      },
      {
        name: 'merge-protection-check',
        command: 'node',
        args: ['scripts/merge-protection.cjs', 'pre-merge-check'],
        budget: this.options.budgets.scriptExecution
      },
      {
        name: 'python-quality-gate',
        command: 'node',
        args: ['scripts/python-cc-gate.cjs'],
        budget: this.options.budgets.scriptExecution
      },
      {
        name: 'error-handling-test',
        command: 'bash',
        args: ['-c', 'source tools/lib/error-codes.sh && run_self_test'],
        budget: this.options.budgets.scriptExecution
      }
    ];

    for (const script of scriptsToTest) {
      await this.benchmarkOperation(
        'Script Execution',
        script.name,
        async () => {
          const result = await this.executeCommand(script.command, script.args);
          return {
            exitCode: result.exitCode,
            outputSize: result.stdout.length + result.stderr.length
          };
        },
        script.budget
      );
    }

    console.log('✅ Script execution benchmarks completed\n');
  }

  /**
   * Phase 2: Benchmark cross-system call performance
   */
  async benchmarkCrossSystemCalls() {
    console.log('🔄 Phase 2: Cross-System Call Benchmarks...');

    // Scripts → Tools calls
    await this.benchmarkOperation(
      'Cross-System Calls',
      'scripts-to-tools',
      async () => {
        const result = await this.executeCommand('node', ['-e', `
          const { spawn } = require('child_process');
          const start = performance.now();

          const proc = spawn('bash', ['-c', 'source tools/lib/error-codes.sh && echo "SUCCESS"']);

          return new Promise((resolve) => {
            let output = '';
            proc.stdout.on('data', (data) => output += data.toString());
            proc.on('close', (code) => {
              const duration = performance.now() - start;
              console.log(JSON.stringify({ duration, exitCode: code, success: output.includes('SUCCESS') }));
              resolve();
            });
          });
        `]);

        if (result.exitCode === 0 && result.stdout) {
          const data = JSON.parse(result.stdout);
          return { callDuration: data.duration, success: data.success };
        }
        throw new Error('Cross-system call failed');
      },
      this.options.budgets.crossSystemCall
    );

    // Tools → Scripts calls
    await this.benchmarkOperation(
      'Cross-System Calls',
      'tools-to-scripts',
      async () => {
        const result = await this.executeCommand('bash', ['-c', `
          start_time=$(node -e "console.log(Date.now())")

          if command -v node >/dev/null 2>&1; then
            result=$(node -e "console.log('SUCCESS')")
            end_time=$(node -e "console.log(Date.now())")

            if [[ "$result" == "SUCCESS" ]]; then
              duration=$((end_time - start_time))
              echo "{\\"duration\\": $duration, \\"success\\": true}"
            else
              echo "{\\"duration\\": 0, \\"success\\": false}"
            fi
          else
            echo "{\\"duration\\": 0, \\"success\\": false}"
          fi
        `]);

        if (result.exitCode === 0 && result.stdout) {
          const data = JSON.parse(result.stdout);
          return { callDuration: data.duration, success: data.success };
        }
        throw new Error('Reverse cross-system call failed');
      },
      this.options.budgets.crossSystemCall
    );

    console.log('✅ Cross-system call benchmarks completed\n');
  }

  /**
   * Phase 3: Benchmark error propagation performance
   */
  async benchmarkErrorPropagation() {
    console.log('🚨 Phase 3: Error Propagation Benchmarks...');

    await this.benchmarkOperation(
      'Error Propagation',
      'scripts-to-tools-error',
      async () => {
        const errorFile = path.join(os.tmpdir(), `perf_error_${Date.now()}.env`);

        const start = performance.now();

        // Create error in scripts/
        await this.executeCommand('node', ['-e', `
          const { createError, ErrorCodes, ProtocolBridge } = require('./scripts/lib/error-codes.cjs');
          const error = createError(ErrorCodes.INTEGRATION.TIMEOUT, 'Performance test error');
          ProtocolBridge.writeErrorFile(error, '${errorFile}');
        `]);

        // Read error in tools/
        const result = await this.executeCommand('bash', ['-c', `
          source tools/lib/error-codes.sh
          read_error_from_scripts '${errorFile}'
          echo "ERROR_CODE=\${ERROR_CODE}"
        `]);

        const propagationTime = performance.now() - start;

        // Cleanup
        try {
          await fs.unlink(errorFile);
        } catch {}

        if (result.exitCode === 0 && result.stdout.includes('ERROR_CODE=5004')) {
          return { propagationTime, errorCode: 5004, success: true };
        }
        throw new Error('Error propagation failed');
      },
      this.options.budgets.errorPropagation
    );

    console.log('✅ Error propagation benchmarks completed\n');
  }

  /**
   * Phase 4: Benchmark data exchange performance
   */
  async benchmarkDataExchange() {
    console.log('📊 Phase 4: Data Exchange Benchmarks...');

    // JSON data exchange benchmark
    await this.benchmarkOperation(
      'Data Exchange',
      'json-exchange',
      async () => {
        const testData = {
          taskId: 'T-PERF-TEST',
          metadata: { complexity: 5, priority: 'high' },
          subtasks: Array.from({ length: 100 }, (_, i) => `ST-${i.toString().padStart(3, '0')}`),
          timestamp: new Date().toISOString()
        };

        const jsonFile = path.join(os.tmpdir(), `perf_data_${Date.now()}.json`);
        const dataSize = JSON.stringify(testData).length;

        const start = performance.now();

        // Write JSON data
        await fs.writeFile(jsonFile, JSON.stringify(testData));

        // Read and validate in both environments
        const nodeResult = await this.executeCommand('node', ['-e', `
          const fs = require('fs');
          const data = JSON.parse(fs.readFileSync('${jsonFile}', 'utf8'));
          console.log('VALIDATION=' + (data.taskId === 'T-PERF-TEST' ? 'success' : 'failed'));
        `]);

        const bashResult = await this.executeCommand('bash', ['-c', `
          task_id=$(node -e "console.log(JSON.parse(require('fs').readFileSync('${jsonFile}', 'utf8')).taskId)")
          echo "TASK_ID=$task_id"
        `]);

        const exchangeTime = performance.now() - start;

        // Cleanup
        try {
          await fs.unlink(jsonFile);
        } catch {}

        if (nodeResult.exitCode === 0 && bashResult.exitCode === 0) {
          return {
            exchangeTime,
            dataSize,
            throughput: dataSize / (exchangeTime / 1000), // bytes per second
            success: true
          };
        }
        throw new Error('Data exchange failed');
      },
      this.options.budgets.dataExchange
    );

    console.log('✅ Data exchange benchmarks completed\n');
  }

  /**
   * Phase 5: Benchmark memory usage patterns
   */
  async benchmarkMemoryUsage() {
    console.log('💾 Phase 5: Memory Usage Benchmarks...');

    await this.benchmarkOperation(
      'Memory Usage',
      'script-memory-usage',
      async () => {
        const beforeMemory = process.memoryUsage();

        // Execute memory-intensive operations
        const result = await this.executeCommand('node', ['-e', `
          const { ErrorCodes } = require('./scripts/lib/error-codes.cjs');

          // Create multiple error objects to test memory usage
          const errors = [];
          for (let i = 0; i < 1000; i++) {
            errors.push({
              code: ErrorCodes.INTEGRATION.TIMEOUT,
              message: 'Memory test error ' + i,
              timestamp: new Date().toISOString()
            });
          }

          console.log('OBJECTS_CREATED=' + errors.length);
          console.log('MEMORY_USAGE=' + JSON.stringify(process.memoryUsage()));
        `]);

        const afterMemory = process.memoryUsage();

        if (result.exitCode === 0) {
          const memoryDelta = {
            rss: afterMemory.rss - beforeMemory.rss,
            heapUsed: afterMemory.heapUsed - beforeMemory.heapUsed,
            heapTotal: afterMemory.heapTotal - beforeMemory.heapTotal,
            external: afterMemory.external - beforeMemory.external
          };

          return {
            memoryDelta,
            peakMemory: Math.max(beforeMemory.rss, afterMemory.rss),
            withinBudget: memoryDelta.rss < this.options.budgets.memoryUsage
          };
        }
        throw new Error('Memory usage test failed');
      },
      this.options.budgets.memoryUsage
    );

    console.log('✅ Memory usage benchmarks completed\n');
  }

  /**
   * Phase 6: Benchmark performance under load
   */
  async benchmarkUnderLoad() {
    console.log('🔥 Phase 6: Load Testing Benchmarks...');

    await this.benchmarkOperation(
      'Load Testing',
      'concurrent-operations',
      async () => {
        const concurrentOps = 5;
        const operations = [];

        const start = performance.now();

        // Launch concurrent operations
        for (let i = 0; i < concurrentOps; i++) {
          const operation = this.executeCommand('bash', ['-c', `
            source tools/lib/error-codes.sh

            # Simulate concurrent load
            if command -v node >/dev/null 2>&1; then
              node -e "
                const start = Date.now();
                setTimeout(() => {
                  console.log('OP_${i}_DURATION=' + (Date.now() - start));
                }, Math.random() * 500 + 100);
              "
            else
              echo "OP_${i}_DURATION=failed"
            fi
          `]);

          operations.push(operation);
        }

        // Wait for all operations
        const results = await Promise.all(operations);
        const totalTime = performance.now() - start;

        const successfulOps = results.filter(r => r.exitCode === 0).length;
        const avgOpTime = results
          .map(r => {
            const match = r.stdout.match(/OP_\d+_DURATION=(\d+)/);
            return match ? parseInt(match[1]) : 0;
          })
          .reduce((sum, time) => sum + time, 0) / results.length;

        return {
          totalTime,
          concurrentOps,
          successfulOps,
          avgOpTime,
          throughput: successfulOps / (totalTime / 1000), // ops per second
          efficiency: successfulOps / concurrentOps
        };
      },
      this.options.budgets.scriptExecution * 2 // Allow more time for concurrent ops
    );

    console.log('✅ Load testing benchmarks completed\n');
  }

  /**
   * Phase 7: Analyze resource utilization
   */
  async analyzeResourceUtilization() {
    console.log('📈 Phase 7: Resource Utilization Analysis...');

    const endMetrics = {
      freeMemory: os.freemem(),
      loadAverage: os.loadavg(),
      endTime: performance.now()
    };

    const totalTestTime = endMetrics.endTime - this.results.systemMetrics.startTime;
    const memoryUsed = this.results.systemMetrics.totalMemory - endMetrics.freeMemory;
    const memoryUsedDelta = endMetrics.freeMemory - this.results.systemMetrics.freeMemory;

    this.results.systemMetrics.summary = {
      totalTestTime,
      memoryUsed,
      memoryUsedDelta,
      avgLoadIncrease: endMetrics.loadAverage[0] - this.results.systemMetrics.loadAverage[0],
      resourceEfficiency: {
        memory: (memoryUsed / this.results.systemMetrics.totalMemory) * 100,
        cpu: endMetrics.loadAverage[0] / this.results.systemMetrics.cpuCount * 100
      }
    };

    console.log('✅ Resource utilization analysis completed\n');
  }

  /**
   * Core benchmarking function with statistical analysis
   */
  async benchmarkOperation(category, name, operation, budget) {
    console.log(`  🔍 Benchmarking ${name}...`);

    const measurements = [];
    const errors = [];

    // Warmup rounds
    for (let i = 0; i < this.options.warmupRounds; i++) {
      try {
        await operation();
      } catch (error) {
        // Ignore warmup errors
      }
    }

    // Actual measurements
    for (let i = 0; i < this.options.iterations; i++) {
      try {
        const start = performance.now();
        const result = await operation();
        const duration = performance.now() - start;

        measurements.push({
          duration,
          iteration: i + 1,
          timestamp: new Date().toISOString(),
          result
        });

      } catch (error) {
        errors.push({
          iteration: i + 1,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Statistical analysis
    const stats = this.calculateStatistics(measurements, budget);

    // Check for regressions
    const regression = this.checkForRegression(category, name, stats);

    const benchmark = {
      category,
      name,
      fullName: `${category} - ${name}`,
      measurements: measurements.length,
      errors: errors.length,
      stats,
      budget,
      regression,
      timestamp: new Date().toISOString()
    };

    this.results.benchmarks.push(benchmark);

    // Log results
    if (stats.withinBudget) {
      console.log(`    ✅ ${name}: ${stats.mean.toFixed(0)}ms (±${stats.stdDev.toFixed(0)}ms)`);
    } else {
      console.log(`    ⚠️ ${name}: ${stats.mean.toFixed(0)}ms (±${stats.stdDev.toFixed(0)}ms) - BUDGET EXCEEDED`);
      this.results.budgetViolations.push(benchmark);
    }

    if (regression.detected) {
      console.log(`    📉 Regression detected: ${regression.change.toFixed(1)}% slower than baseline`);
      this.results.regressions.push(benchmark);
    } else if (regression.improvement) {
      console.log(`    📈 Improvement detected: ${Math.abs(regression.change).toFixed(1)}% faster than baseline`);
      this.results.improvements.push(benchmark);
    }

    if (errors.length > 0) {
      console.log(`    ⚠️ ${errors.length} errors occurred during benchmarking`);
    }

    return benchmark;
  }

  /**
   * Calculate statistical metrics
   */
  calculateStatistics(measurements, budget) {
    if (measurements.length === 0) {
      return {
        count: 0,
        mean: 0,
        median: 0,
        min: 0,
        max: 0,
        stdDev: 0,
        confidenceInterval: { lower: 0, upper: 0 },
        withinBudget: false,
        budgetCompliance: 0
      };
    }

    const durations = measurements.map(m => m.duration);
    const sorted = durations.slice().sort((a, b) => a - b);

    const count = durations.length;
    const mean = durations.reduce((sum, d) => sum + d, 0) / count;
    const median = sorted[Math.floor(count / 2)];
    const min = sorted[0];
    const max = sorted[count - 1];

    // Standard deviation
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / count;
    const stdDev = Math.sqrt(variance);

    // Confidence interval (assuming t-distribution for small samples)
    const tValue = this.getTValue(count - 1, this.options.confidenceLevel);
    const marginOfError = tValue * (stdDev / Math.sqrt(count));
    const confidenceInterval = {
      lower: mean - marginOfError,
      upper: mean + marginOfError
    };

    // Budget compliance
    const withinBudget = mean <= budget;
    const budgetCompliance = Math.min(100, (budget / mean) * 100);

    return {
      count,
      mean,
      median,
      min,
      max,
      stdDev,
      confidenceInterval,
      withinBudget,
      budgetCompliance,
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)]
    };
  }

  /**
   * Check for performance regression
   */
  checkForRegression(category, name, currentStats) {
    if (!this.baseline || !this.baseline.benchmarks) {
      return { detected: false, improvement: false, change: 0, baseline: null };
    }

    const baselineBenchmark = this.baseline.benchmarks.find(b =>
      b.category === category && b.name === name
    );

    if (!baselineBenchmark) {
      return { detected: false, improvement: false, change: 0, baseline: null };
    }

    const baselineMean = baselineBenchmark.stats.mean;
    const currentMean = currentStats.mean;
    const change = ((currentMean - baselineMean) / baselineMean) * 100;

    const regressionDetected = change > (this.options.regressionThreshold * 100);
    const improvementDetected = change < -(this.options.regressionThreshold * 100);

    return {
      detected: regressionDetected,
      improvement: improvementDetected,
      change,
      baseline: baselineMean,
      current: currentMean,
      threshold: this.options.regressionThreshold * 100
    };
  }

  /**
   * Get t-value for confidence interval calculation
   */
  getTValue(degreesOfFreedom, confidenceLevel) {
    // Simplified t-values for common cases
    const tTable = {
      0.90: { 9: 1.833, 19: 1.729, 29: 1.699, 'inf': 1.645 },
      0.95: { 9: 2.262, 19: 2.093, 29: 2.045, 'inf': 1.960 },
      0.99: { 9: 3.250, 19: 2.861, 29: 2.756, 'inf': 2.576 }
    };

    const table = tTable[confidenceLevel] || tTable[0.95];

    if (degreesOfFreedom < 10) return table[9];
    if (degreesOfFreedom < 20) return table[19];
    if (degreesOfFreedom < 30) return table[29];
    return table['inf'];
  }

  /**
   * Execute command with timeout
   */
  async executeCommand(command, args, options = {}) {
    return new Promise((resolve) => {
      const proc = spawn(command, args, {
        cwd: process.cwd(),
        timeout: this.options.timeout,
        stdio: ['pipe', 'pipe', 'pipe'],
        ...options
      });

      let stdout = '';
      let stderr = '';

      if (proc.stdout) {
        proc.stdout.on('data', (data) => stdout += data.toString());
      }
      if (proc.stderr) {
        proc.stderr.on('data', (data) => stderr += data.toString());
      }

      proc.on('close', (exitCode) => {
        resolve({ exitCode: exitCode || 0, stdout: stdout.trim(), stderr: stderr.trim() });
      });

      proc.on('error', (error) => {
        resolve({ exitCode: -1, stdout: '', stderr: error.message });
      });
    });
  }

  /**
   * Analyze all performance results
   */
  async analyzePerformanceResults() {
    console.log('📊 Analyzing performance results...');

    // Performance trends
    const trends = this.analyzeTrends();

    // Bottleneck identification
    const bottlenecks = this.identifyBottlenecks();

    // Resource efficiency
    const efficiency = this.calculateEfficiencyMetrics();

    this.results.analysis = {
      trends,
      bottlenecks,
      efficiency,
      summary: {
        totalBenchmarks: this.results.benchmarks.length,
        budgetViolations: this.results.budgetViolations.length,
        regressions: this.results.regressions.length,
        improvements: this.results.improvements.length
      }
    };
  }

  /**
   * Analyze performance trends
   */
  analyzeTrends() {
    const trends = {
      categories: {},
      overall: {}
    };

    // Group by category
    const categories = [...new Set(this.results.benchmarks.map(b => b.category))];

    categories.forEach(category => {
      const categoryBenchmarks = this.results.benchmarks.filter(b => b.category === category);
      const avgDuration = categoryBenchmarks.reduce((sum, b) => sum + b.stats.mean, 0) / categoryBenchmarks.length;
      const budgetCompliance = categoryBenchmarks.reduce((sum, b) => sum + b.stats.budgetCompliance, 0) / categoryBenchmarks.length;

      trends.categories[category] = {
        avgDuration,
        budgetCompliance,
        benchmarkCount: categoryBenchmarks.length,
        status: budgetCompliance >= 90 ? 'excellent' : budgetCompliance >= 75 ? 'good' : 'poor'
      };
    });

    // Overall trends
    const allDurations = this.results.benchmarks.map(b => b.stats.mean);
    trends.overall = {
      avgDuration: allDurations.reduce((sum, d) => sum + d, 0) / allDurations.length,
      medianDuration: allDurations.sort((a, b) => a - b)[Math.floor(allDurations.length / 2)],
      maxDuration: Math.max(...allDurations),
      minDuration: Math.min(...allDurations)
    };

    return trends;
  }

  /**
   * Identify performance bottlenecks
   */
  identifyBottlenecks() {
    const bottlenecks = [];

    // Slow operations (top 20% by duration)
    const sortedBenchmarks = this.results.benchmarks
      .slice()
      .sort((a, b) => b.stats.mean - a.stats.mean);

    const slowestCount = Math.ceil(sortedBenchmarks.length * 0.2);
    const slowest = sortedBenchmarks.slice(0, slowestCount);

    slowest.forEach(benchmark => {
      bottlenecks.push({
        type: 'slow_operation',
        benchmark: benchmark.fullName,
        duration: benchmark.stats.mean,
        impact: 'high',
        recommendation: `Optimize ${benchmark.name} - currently taking ${benchmark.stats.mean.toFixed(0)}ms`
      });
    });

    // High variance operations (inconsistent performance)
    const highVariance = this.results.benchmarks.filter(b =>
      b.stats.stdDev > b.stats.mean * 0.3 // Coefficient of variation > 30%
    );

    highVariance.forEach(benchmark => {
      bottlenecks.push({
        type: 'high_variance',
        benchmark: benchmark.fullName,
        variance: benchmark.stats.stdDev,
        impact: 'medium',
        recommendation: `Investigate inconsistent performance in ${benchmark.name} (σ=${benchmark.stats.stdDev.toFixed(0)}ms)`
      });
    });

    // Budget violations
    this.results.budgetViolations.forEach(benchmark => {
      bottlenecks.push({
        type: 'budget_violation',
        benchmark: benchmark.fullName,
        duration: benchmark.stats.mean,
        budget: benchmark.budget,
        impact: 'high',
        recommendation: `Critical: ${benchmark.name} exceeds budget by ${((benchmark.stats.mean / benchmark.budget - 1) * 100).toFixed(1)}%`
      });
    });

    return bottlenecks;
  }

  /**
   * Calculate efficiency metrics
   */
  calculateEfficiencyMetrics() {
    const totalBenchmarks = this.results.benchmarks.length;
    const withinBudget = this.results.benchmarks.filter(b => b.stats.withinBudget).length;

    return {
      budgetCompliance: (withinBudget / totalBenchmarks) * 100,
      avgBudgetUtilization: this.results.benchmarks.reduce((sum, b) =>
        sum + (b.stats.mean / b.budget), 0) / totalBenchmarks * 100,
      performanceStability: this.results.benchmarks.reduce((sum, b) =>
        sum + (1 - Math.min(1, b.stats.stdDev / b.stats.mean)), 0) / totalBenchmarks * 100,
      resourceEfficiency: this.results.systemMetrics.summary?.resourceEfficiency || {}
    };
  }

  /**
   * Generate comprehensive performance report
   */
  async generatePerformanceReport() {
    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        platform: this.results.systemMetrics.platform,
        nodeVersion: this.results.systemMetrics.nodeVersion,
        testDuration: this.results.systemMetrics.summary?.totalTestTime || 0,
        iterations: this.options.iterations
      },
      summary: {
        totalBenchmarks: this.results.benchmarks.length,
        passed: this.results.benchmarks.filter(b => b.stats.withinBudget).length,
        failed: this.results.budgetViolations.length,
        regressions: this.results.regressions.length,
        improvements: this.results.improvements.length
      },
      performance: {
        budgetCompliance: this.results.analysis.efficiency.budgetCompliance,
        avgPerformance: this.results.analysis.trends.overall.avgDuration,
        stability: this.results.analysis.efficiency.performanceStability
      },
      benchmarks: this.results.benchmarks,
      analysis: this.results.analysis,
      systemMetrics: this.results.systemMetrics,
      recommendations: this.generatePerformanceRecommendations()
    };

    // Save detailed report
    const reportFile = path.join(
      this.options.reportDir,
      `performance-report-${new Date().toISOString().slice(0, 10)}.json`
    );
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));

    this.printPerformanceReport(report);
    return report;
  }

  /**
   * Generate performance improvement recommendations
   */
  generatePerformanceRecommendations() {
    const recommendations = [];

    // Budget violations
    if (this.results.budgetViolations.length > 0) {
      recommendations.push({
        category: 'Budget Compliance',
        priority: 'HIGH',
        action: 'Address budget violations immediately',
        details: `${this.results.budgetViolations.length} operations exceed performance budgets`,
        items: this.results.budgetViolations.map(b => `${b.name}: ${b.stats.mean.toFixed(0)}ms > ${b.budget}ms`)
      });
    }

    // Regressions
    if (this.results.regressions.length > 0) {
      recommendations.push({
        category: 'Performance Regression',
        priority: 'HIGH',
        action: 'Investigate and fix performance regressions',
        details: `${this.results.regressions.length} operations showing performance degradation`,
        items: this.results.regressions.map(b =>
          `${b.name}: ${b.regression.change.toFixed(1)}% slower than baseline`
        )
      });
    }

    // Bottlenecks
    const criticalBottlenecks = this.results.analysis.bottlenecks.filter(b => b.impact === 'high');
    if (criticalBottlenecks.length > 0) {
      recommendations.push({
        category: 'Performance Bottlenecks',
        priority: 'MEDIUM',
        action: 'Optimize identified bottlenecks',
        details: `${criticalBottlenecks.length} critical performance bottlenecks identified`,
        items: criticalBottlenecks.map(b => b.recommendation)
      });
    }

    // Resource efficiency
    const efficiency = this.results.analysis.efficiency;
    if (efficiency.budgetCompliance < 80) {
      recommendations.push({
        category: 'Resource Efficiency',
        priority: 'MEDIUM',
        action: 'Improve overall resource efficiency',
        details: `Budget compliance at ${efficiency.budgetCompliance.toFixed(1)}% (target: >80%)`,
        items: ['Review resource allocation and optimization opportunities']
      });
    }

    return recommendations;
  }

  /**
   * Update performance baseline
   */
  async updateBaseline() {
    // Only update baseline if current run is good (>80% budget compliance)
    const budgetCompliance = this.results.analysis.efficiency.budgetCompliance;

    if (budgetCompliance >= 80 && this.results.regressions.length === 0) {
      const newBaseline = {
        timestamp: new Date().toISOString(),
        platform: this.results.systemMetrics.platform,
        nodeVersion: this.results.systemMetrics.nodeVersion,
        benchmarks: this.results.benchmarks.map(b => ({
          category: b.category,
          name: b.name,
          stats: b.stats
        })),
        metadata: {
          iterations: this.options.iterations,
          budgetCompliance,
          totalBenchmarks: this.results.benchmarks.length
        }
      };

      await fs.writeFile(this.options.baselineFile, JSON.stringify(newBaseline, null, 2));
      console.log(`📊 Performance baseline updated (compliance: ${budgetCompliance.toFixed(1)}%)`);
    } else {
      console.log(`📊 Baseline not updated (compliance: ${budgetCompliance.toFixed(1)}%, regressions: ${this.results.regressions.length})`);
    }
  }

  /**
   * Print performance report to console
   */
  printPerformanceReport(report) {
    console.log('\n' + '='.repeat(80));
    console.log('⚡ PERFORMANCE BENCHMARK REPORT');
    console.log('='.repeat(80));

    // Summary
    console.log('\n📊 PERFORMANCE SUMMARY');
    console.log('-'.repeat(40));
    console.log(`Total Benchmarks: ${report.summary.totalBenchmarks}`);
    console.log(`Within Budget: ${report.summary.passed} ✅`);
    console.log(`Budget Violations: ${report.summary.failed} ❌`);
    console.log(`Regressions: ${report.summary.regressions} 📉`);
    console.log(`Improvements: ${report.summary.improvements} 📈`);
    console.log(`Budget Compliance: ${report.performance.budgetCompliance.toFixed(1)}%`);
    console.log(`Performance Stability: ${report.performance.stability.toFixed(1)}%`);

    // Category breakdown
    console.log('\n📋 CATEGORY BREAKDOWN');
    console.log('-'.repeat(40));
    Object.entries(report.analysis.trends.categories).forEach(([category, data]) => {
      const status = data.status === 'excellent' ? '✅' : data.status === 'good' ? '⚠️' : '❌';
      console.log(`${status} ${category}: ${data.avgDuration.toFixed(0)}ms avg (${data.budgetCompliance.toFixed(1)}% compliance)`);
    });

    // Top performers and bottlenecks
    const fastest = report.benchmarks
      .slice()
      .sort((a, b) => a.stats.mean - b.stats.mean)
      .slice(0, 3);

    const slowest = report.benchmarks
      .slice()
      .sort((a, b) => b.stats.mean - a.stats.mean)
      .slice(0, 3);

    console.log('\n🏃 FASTEST OPERATIONS');
    console.log('-'.repeat(40));
    fastest.forEach((b, i) => {
      console.log(`${i + 1}. ${b.name}: ${b.stats.mean.toFixed(0)}ms (±${b.stats.stdDev.toFixed(0)}ms)`);
    });

    console.log('\n🐌 SLOWEST OPERATIONS');
    console.log('-'.repeat(40));
    slowest.forEach((b, i) => {
      const status = b.stats.withinBudget ? '⚠️' : '❌';
      console.log(`${i + 1}. ${status} ${b.name}: ${b.stats.mean.toFixed(0)}ms (budget: ${b.budget}ms)`);
    });

    // Recommendations
    if (report.recommendations.length > 0) {
      console.log('\n💡 PERFORMANCE RECOMMENDATIONS');
      console.log('-'.repeat(40));
      report.recommendations.forEach(rec => {
        const priority = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢';
        console.log(`${priority} ${rec.category}: ${rec.action}`);
        console.log(`   └─ ${rec.details}`);
      });
    }

    // Overall assessment
    console.log('\n🎯 PERFORMANCE ASSESSMENT');
    console.log('-'.repeat(40));
    const overallStatus = report.performance.budgetCompliance >= 90 ? '✅ EXCELLENT' :
                         report.performance.budgetCompliance >= 75 ? '⚠️ GOOD' :
                         report.performance.budgetCompliance >= 60 ? '⚠️ NEEDS IMPROVEMENT' : '❌ POOR';
    console.log(`Overall Performance: ${overallStatus}`);
    console.log(`System Stability: ${report.performance.stability >= 80 ? 'STABLE' : 'UNSTABLE'}`);
    console.log(`Production Readiness: ${report.performance.budgetCompliance >= 80 && report.summary.regressions === 0 ? 'READY' : 'NOT READY'}`);

    console.log('\n' + '='.repeat(80));
    console.log('End of Performance Benchmark Report');
    console.log('='.repeat(80));
  }
}

module.exports = PerformanceBenchmarkSuite;

// Allow direct execution
if (require.main === module) {
  const suite = new PerformanceBenchmarkSuite({
    verbose: process.argv.includes('--verbose'),
    iterations: process.argv.includes('--quick') ? 5 : 10
  });

  suite.runCompleteBenchmarkSuite()
    .then(report => {
      const exitCode = report.summary.failed > 0 || report.summary.regressions > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('❌ Performance benchmark failed:', error.message);
      process.exit(1);
    });
}