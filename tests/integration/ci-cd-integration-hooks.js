/**
 * CI/CD Integration Hooks for Cross-System Validation
 *
 * Provides automated integration testing hooks for continuous integration
 * and deployment pipelines. Ensures dual directory architecture validation
 * runs automatically during development and deployment workflows.
 *
 * Features:
 * - GitHub Actions integration
 * - Pre-commit hooks validation
 * - Pre-push validation
 * - Pull request checks
 * - Deployment readiness validation
 * - Quality gate enforcement
 * - Performance regression detection
 * - Error handling verification
 *
 * @author Claude Code - CI/CD Integration Specialist
 * @version 1.0.0
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const os = require('os');

// Import validation suites
const DualSystemIntegrationValidator = require('./dual-system-integration-validator.js');
const PerformanceBenchmarkSuite = require('./performance-benchmark-suite.js');
const ErrorSimulationSuite = require('./error-simulation-suite.js');
const ContractComplianceValidator = require('./contract-compliance-validator.js');

const SAFE_CLI_COMMANDS = new Set(['bash', 'node', 'git']);

class CICDIntegrationHooks {
  constructor(options = {}) {
    this.options = {
      verbose: options.verbose || false,
      timeout: options.timeout || 300000, // 5 minutes for CI/CD
      failFast: options.failFast !== false, // Default true
      parallelExecution: options.parallelExecution !== false, // Default true
      environmentContext: options.environmentContext || this.detectEnvironment(),
      qualityGates: {
        contractCompliance: 90,      // 90% minimum contract compliance
        performanceBudget: 80,       // 80% minimum performance budget compliance
        errorHandlingRobustness: 75, // 75% minimum error handling success rate
        integrationStability: 85     // 85% minimum integration test pass rate
      },
      reportFormats: ['json', 'junit', 'console'],
      artifactDir: options.artifactDir || 'test-artifacts',
      ...options
    };

    this.results = {
      pipeline: {
        startTime: new Date().toISOString(),
        endTime: null,
        duration: 0,
        status: 'running'
      },
      gates: {
        contractCompliance: null,
        performanceBenchmark: null,
        errorSimulation: null,
        integrationValidation: null
      },
      artifacts: [],
      qualityMetrics: {},
      recommendations: []
    };
  }

  /**
   * Main CI/CD integration entry point
   */
  async runCICDValidationPipeline() {
    console.log('🚀 Starting CI/CD Integration Validation Pipeline\n');
    console.log(`🌍 Environment: ${this.options.environmentContext.type}`);
    console.log(`⚡ Parallel Execution: ${this.options.parallelExecution ? 'Enabled' : 'Disabled'}`);
    console.log(`🚨 Fail Fast: ${this.options.failFast ? 'Enabled' : 'Disabled'}\n`);

    try {
      // Setup CI/CD environment
      await this.setupCICDEnvironment();

      // Run validation pipeline based on context
      const pipelineResult = await this.executePipelineStages();

      // Generate CI/CD reports
      await this.generateCICDReports(pipelineResult);

      // Enforce quality gates
      const gateResults = await this.enforceQualityGates(pipelineResult);

      // Finalize pipeline
      await this.finalizePipeline(gateResults);

      return gateResults;

    } catch (error) {
      await this.handlePipelineFailure(error);
      throw error;
    }
  }

  /**
   * Detect CI/CD environment context
   */
  detectEnvironment() {
    const env = process.env;

    // GitHub Actions
    if (env.GITHUB_ACTIONS) {
      return {
        type: 'github-actions',
        provider: 'GitHub',
        workflow: env.GITHUB_WORKFLOW,
        runId: env.GITHUB_RUN_ID,
        actor: env.GITHUB_ACTOR,
        ref: env.GITHUB_REF,
        sha: env.GITHUB_SHA,
        event: env.GITHUB_EVENT_NAME
      };
    }

    // GitLab CI
    if (env.GITLAB_CI) {
      return {
        type: 'gitlab-ci',
        provider: 'GitLab',
        jobId: env.CI_JOB_ID,
        pipelineId: env.CI_PIPELINE_ID,
        commitSha: env.CI_COMMIT_SHA,
        ref: env.CI_COMMIT_REF_NAME
      };
    }

    // Azure DevOps
    if (env.TF_BUILD) {
      return {
        type: 'azure-devops',
        provider: 'Azure',
        buildId: env.BUILD_BUILDID,
        sourceBranch: env.BUILD_SOURCEBRANCH,
        sourceVersion: env.BUILD_SOURCEVERSION
      };
    }

    // Jenkins
    if (env.JENKINS_URL) {
      return {
        type: 'jenkins',
        provider: 'Jenkins',
        buildNumber: env.BUILD_NUMBER,
        jobName: env.JOB_NAME,
        gitCommit: env.GIT_COMMIT,
        gitBranch: env.GIT_BRANCH
      };
    }

    // Pre-commit hook
    if (env.PRE_COMMIT) {
      return {
        type: 'pre-commit',
        provider: 'Git Hook',
        stage: 'pre-commit'
      };
    }

    // Pre-push hook
    if (env.PRE_PUSH) {
      return {
        type: 'pre-push',
        provider: 'Git Hook',
        stage: 'pre-push'
      };
    }

    // Local development
    return {
      type: 'local',
      provider: 'Local Development',
      user: os.userInfo().username,
      platform: os.platform()
    };
  }

  /**
   * Setup CI/CD environment and artifacts
   */
  async setupCICDEnvironment() {
    console.log('🔧 Setting up CI/CD environment...');

    // Create artifacts directory
    await fs.mkdir(this.options.artifactDir, { recursive: true });

    // Setup environment-specific configuration
    await this.setupEnvironmentSpecificConfig();

    // Validate required dependencies
    await this.validateDependencies();

    // Initialize logging
    await this.initializeLogging();

    console.log('✅ CI/CD environment ready\n');
  }

  /**
   * Setup environment-specific configuration
   */
  async setupEnvironmentSpecificConfig() {
    const config = {
      environment: this.options.environmentContext,
      pipeline: {
        timeout: this.options.timeout,
        failFast: this.options.failFast,
        parallelExecution: this.options.parallelExecution
      },
      qualityGates: this.options.qualityGates,
      timestamp: new Date().toISOString()
    };

    // Adjust configuration based on environment
    switch (this.options.environmentContext.type) {
      case 'github-actions':
        config.pipeline.timeout = Math.min(this.options.timeout, 21600000); // 6 hours max for GitHub
        break;
      case 'gitlab-ci':
        config.pipeline.timeout = Math.min(this.options.timeout, 10800000); // 3 hours max for GitLab
        break;
      case 'pre-commit':
        config.pipeline.timeout = Math.min(this.options.timeout, 30000); // 30 seconds for pre-commit
        config.qualityGates.performanceBudget = 60; // Lower threshold for hooks
        break;
      case 'local':
        // No specific limits for local development
        break;
    }

    const configFile = path.join(this.options.artifactDir, 'ci-cd-config.json');
    await fs.writeFile(configFile, JSON.stringify(config, null, 2));
    this.results.artifacts.push(configFile);
  }

  /**
   * Validate required dependencies are available
   */
  async validateDependencies() {
    const dependencies = [
      { name: 'node', command: 'node', args: ['--version'] },
      { name: 'bash', command: 'bash', args: ['--version'] },
      { name: 'git', command: 'git', args: ['--version'] }
    ];

    const missingDependencies = [];

    for (const dep of dependencies) {
      try {
        const result = await this.executeCommand(dep.command, dep.args || []);
        if (result.exitCode !== 0) {
          missingDependencies.push(dep.name);
        }
      } catch (error) {
        missingDependencies.push(dep.name);
      }
    }

    if (missingDependencies.length > 0) {
      throw new Error(`Missing required dependencies: ${missingDependencies.join(', ')}`);
    }
  }

  /**
   * Initialize logging for CI/CD pipeline
   */
  async initializeLogging() {
    const logFile = path.join(this.options.artifactDir, 'ci-cd-pipeline.log');
    const logHeader = [
      `CI/CD Integration Validation Pipeline Log`,
      `Timestamp: ${new Date().toISOString()}`,
      `Environment: ${this.options.environmentContext.type}`,
      `Platform: ${os.platform()}`,
      `Node Version: ${process.version}`,
      `Working Directory: ${process.cwd()}`,
      ''.padEnd(80, '=')
    ].join('\n');

    await fs.writeFile(logFile, logHeader + '\n');
    this.results.artifacts.push(logFile);
  }

  /**
   * Execute pipeline stages
   */
  async executePipelineStages() {
    console.log('📋 Executing validation pipeline stages...\n');

    const stages = [
      {
        name: 'Contract Compliance',
        gate: 'contractCompliance',
        executor: () => this.runContractComplianceStage(),
        critical: true
      },
      {
        name: 'Integration Validation',
        gate: 'integrationValidation',
        executor: () => this.runIntegrationValidationStage(),
        critical: true
      },
      {
        name: 'Performance Benchmark',
        gate: 'performanceBenchmark',
        executor: () => this.runPerformanceBenchmarkStage(),
        critical: false
      },
      {
        name: 'Error Simulation',
        gate: 'errorSimulation',
        executor: () => this.runErrorSimulationStage(),
        critical: false
      }
    ];

    let pipelineResults;

    if (this.options.parallelExecution && this.options.environmentContext.type !== 'pre-commit') {
      // Run non-critical stages in parallel after critical stages
      pipelineResults = await this.executeStagesInParallel(stages);
    } else {
      // Run stages sequentially
      pipelineResults = await this.executeStagesSequentially(stages);
    }

    return pipelineResults;
  }

  /**
   * Execute stages sequentially
   */
  async executeStagesSequentially(stages) {
    const results = {};

    for (const stage of stages) {
      console.log(`🔍 Running ${stage.name} stage...`);

      try {
        const startTime = Date.now();
        const result = await stage.executor();
        const duration = Date.now() - startTime;

        results[stage.gate] = {
          ...result,
          duration,
          stage: stage.name,
          status: result.success ? 'passed' : 'failed'
        };

        this.results.gates[stage.gate] = results[stage.gate];

        if (result.success) {
          console.log(`  ✅ ${stage.name}: PASSED (${duration}ms)\n`);
        } else {
          console.log(`  ❌ ${stage.name}: FAILED (${duration}ms)\n`);

          if (this.options.failFast && stage.critical) {
            throw new Error(`Critical stage ${stage.name} failed - stopping pipeline`);
          }
        }

      } catch (error) {
        console.log(`  💥 ${stage.name}: ERROR - ${error.message}\n`);

        results[stage.gate] = {
          status: 'error',
          error: error.message,
          stage: stage.name,
          duration: 0
        };

        this.results.gates[stage.gate] = results[stage.gate];

        if (this.options.failFast && stage.critical) {
          throw error;
        }
      }
    }

    return results;
  }

  /**
   * Execute stages in parallel where possible
   */
  async executeStagesInParallel(stages) {
    const criticalStages = stages.filter(s => s.critical);
    const nonCriticalStages = stages.filter(s => !s.critical);

    // First, run critical stages sequentially
    const criticalResults = await this.executeStagesSequentially(criticalStages);

    // Check if critical stages passed
    const criticalPassed = Object.values(criticalResults).every(r => r.status === 'passed');

    if (!criticalPassed && this.options.failFast) {
      return criticalResults;
    }

    // Then run non-critical stages in parallel
    console.log('🔄 Running non-critical stages in parallel...');

    const nonCriticalPromises = nonCriticalStages.map(async (stage) => {
      try {
        const startTime = Date.now();
        const result = await stage.executor();
        const duration = Date.now() - startTime;

        return {
          gate: stage.gate,
          result: {
            ...result,
            duration,
            stage: stage.name,
            status: result.success ? 'passed' : 'failed'
          }
        };
      } catch (error) {
        return {
          gate: stage.gate,
          result: {
            status: 'error',
            error: error.message,
            stage: stage.name,
            duration: 0
          }
        };
      }
    });

    const nonCriticalResults = await Promise.all(nonCriticalPromises);

    // Combine results
    const allResults = { ...criticalResults };
    nonCriticalResults.forEach(({ gate, result }) => {
      allResults[gate] = result;
      this.results.gates[gate] = result;
    });

    return allResults;
  }

  /**
   * Run contract compliance validation stage
   */
  async runContractComplianceStage() {
    const validator = new ContractComplianceValidator({
      verbose: false, // Reduce verbosity for CI/CD
      timeout: Math.min(this.options.timeout / 4, 60000) // 25% of total timeout or 1 min
    });

    const result = await validator.validateAllContracts();

    // Save contract compliance report
    const reportFile = path.join(this.options.artifactDir, 'contract-compliance-report.json');
    await fs.writeFile(reportFile, JSON.stringify(result, null, 2));
    this.results.artifacts.push(reportFile);

    return {
      success: result.summary.passRate >= this.options.qualityGates.contractCompliance,
      passRate: result.summary.passRate,
      totalTests: result.summary.totalTests,
      passed: result.summary.passed,
      failed: result.summary.failed,
      details: result,
      qualityGate: this.options.qualityGates.contractCompliance
    };
  }

  /**
   * Run integration validation stage
   */
  async runIntegrationValidationStage() {
    const validator = new DualSystemIntegrationValidator({
      verbose: false,
      timeout: Math.min(this.options.timeout / 3, 120000) // 33% of total timeout or 2 min
    });

    const result = await validator.runComprehensiveValidation();

    // Save integration validation report
    const reportFile = path.join(this.options.artifactDir, 'integration-validation-report.json');
    await fs.writeFile(reportFile, JSON.stringify(result, null, 2));
    this.results.artifacts.push(reportFile);

    const passRate = (result.summary.passed / result.summary.totalTests) * 100;

    return {
      success: passRate >= this.options.qualityGates.integrationStability,
      passRate,
      totalTests: result.summary.totalTests,
      passed: result.summary.passed,
      failed: result.summary.failed,
      details: result,
      qualityGate: this.options.qualityGates.integrationStability
    };
  }

  /**
   * Run performance benchmark stage
   */
  async runPerformanceBenchmarkStage() {
    const suite = new PerformanceBenchmarkSuite({
      verbose: false,
      iterations: this.options.environmentContext.type === 'pre-commit' ? 3 : 5, // Fewer iterations for hooks
      timeout: Math.min(this.options.timeout / 4, 90000) // 25% of total timeout or 1.5 min
    });

    const result = await suite.runCompleteBenchmarkSuite();

    // Save performance benchmark report
    const reportFile = path.join(this.options.artifactDir, 'performance-benchmark-report.json');
    await fs.writeFile(reportFile, JSON.stringify(result, null, 2));
    this.results.artifacts.push(reportFile);

    return {
      success: result.performance.budgetCompliance >= this.options.qualityGates.performanceBudget,
      budgetCompliance: result.performance.budgetCompliance,
      totalBenchmarks: result.summary.totalBenchmarks,
      passed: result.summary.passed,
      failed: result.summary.failed,
      details: result,
      qualityGate: this.options.qualityGates.performanceBudget
    };
  }

  /**
   * Run error simulation stage
   */
  async runErrorSimulationStage() {
    const suite = new ErrorSimulationSuite({
      verbose: false,
      timeout: Math.min(this.options.timeout / 4, 60000), // 25% of total timeout or 1 min
      faultInjectionRate: 0.2 // Lower rate for CI/CD
    });

    const result = await suite.runComprehensiveErrorSimulation();

    // Save error simulation report
    const reportFile = path.join(this.options.artifactDir, 'error-simulation-report.json');
    await fs.writeFile(reportFile, JSON.stringify(result, null, 2));
    this.results.artifacts.push(reportFile);

    const robustnessScore = (
      (result.summary.successfulErrorCodes / result.summary.totalErrorCodes) * 0.6 +
      (result.summary.successfulScenarios / result.summary.totalScenarios) * 0.4
    ) * 100;

    return {
      success: robustnessScore >= this.options.qualityGates.errorHandlingRobustness,
      robustnessScore,
      totalErrorCodes: result.summary.totalErrorCodes,
      successfulErrorCodes: result.summary.successfulErrorCodes,
      totalScenarios: result.summary.totalScenarios,
      successfulScenarios: result.summary.successfulScenarios,
      details: result,
      qualityGate: this.options.qualityGates.errorHandlingRobustness
    };
  }

  /**
   * Enforce quality gates and determine pipeline success
   */
  async enforceQualityGates(pipelineResults) {
    console.log('🚦 Enforcing quality gates...\n');

    const gateResults = {
      passed: 0,
      failed: 0,
      gates: {},
      overallStatus: 'unknown',
      criticalFailures: [],
      recommendations: []
    };

    // Evaluate each quality gate
    Object.entries(this.options.qualityGates).forEach(([gateName, threshold]) => {
      const stageResult = pipelineResults[gateName];

      if (!stageResult) {
        gateResults.gates[gateName] = {
          status: 'skipped',
          reason: 'Stage not executed'
        };
        return;
      }

      const passed = stageResult.status === 'passed' && stageResult.success;

      gateResults.gates[gateName] = {
        status: passed ? 'passed' : 'failed',
        threshold,
        actual: this.getActualValue(stageResult, gateName),
        stage: stageResult.stage,
        critical: this.isCriticalGate(gateName)
      };

      if (passed) {
        gateResults.passed++;
      } else {
        gateResults.failed++;

        if (this.isCriticalGate(gateName)) {
          gateResults.criticalFailures.push({
            gate: gateName,
            stage: stageResult.stage,
            threshold,
            actual: this.getActualValue(stageResult, gateName),
            error: stageResult.error
          });
        }
      }
    });

    // Determine overall status
    const totalGates = Object.keys(this.options.qualityGates).length;
    const criticalGatesPassed = gateResults.criticalFailures.length === 0;
    const passRate = (gateResults.passed / totalGates) * 100;

    if (criticalGatesPassed && passRate >= 75) {
      gateResults.overallStatus = 'passed';
    } else if (criticalGatesPassed && passRate >= 50) {
      gateResults.overallStatus = 'passed-with-warnings';
    } else {
      gateResults.overallStatus = 'failed';
    }

    // Generate recommendations
    gateResults.recommendations = this.generateQualityGateRecommendations(gateResults, pipelineResults);

    // Log quality gate results
    this.logQualityGateResults(gateResults);

    return gateResults;
  }

  /**
   * Get actual value for quality gate comparison
   */
  getActualValue(stageResult, gateName) {
    switch (gateName) {
      case 'contractCompliance':
        return stageResult.passRate || 0;
      case 'performanceBudget':
        return stageResult.budgetCompliance || 0;
      case 'errorHandlingRobustness':
        return stageResult.robustnessScore || 0;
      case 'integrationStability':
        return stageResult.passRate || 0;
      default:
        return 0;
    }
  }

  /**
   * Check if quality gate is critical
   */
  isCriticalGate(gateName) {
    return ['contractCompliance', 'integrationStability'].includes(gateName);
  }

  /**
   * Generate recommendations based on quality gate results
   */
  generateQualityGateRecommendations(gateResults, pipelineResults) {
    const recommendations = [];

    // Critical failures
    gateResults.criticalFailures.forEach(failure => {
      recommendations.push({
        priority: 'CRITICAL',
        category: failure.gate,
        action: `Fix critical issues in ${failure.stage}`,
        details: `${failure.gate} is at ${failure.actual}% but requires ${failure.threshold}%`,
        impact: 'Pipeline failure - blocks deployment'
      });
    });

    // Performance issues
    const perfGate = gateResults.gates.performanceBudget;
    if (perfGate && perfGate.status === 'failed') {
      recommendations.push({
        priority: 'HIGH',
        category: 'Performance',
        action: 'Optimize performance bottlenecks',
        details: `Performance budget compliance at ${perfGate.actual}% (target: ${perfGate.threshold}%)`,
        impact: 'Deployment quality degradation'
      });
    }

    // Error handling issues
    const errorGate = gateResults.gates.errorHandlingRobustness;
    if (errorGate && errorGate.status === 'failed') {
      recommendations.push({
        priority: 'HIGH',
        category: 'Error Handling',
        action: 'Improve error handling robustness',
        details: `Error handling robustness at ${errorGate.actual}% (target: ${errorGate.threshold}%)`,
        impact: 'System reliability concerns'
      });
    }

    // General recommendations based on pass rate
    const passRate = (gateResults.passed / Object.keys(gateResults.gates).length) * 100;
    if (passRate < 75) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Overall Quality',
        action: 'Comprehensive quality review needed',
        details: `Only ${passRate.toFixed(1)}% of quality gates passed`,
        impact: 'Multiple quality concerns detected'
      });
    }

    return recommendations;
  }

  /**
   * Log quality gate results
   */
  logQualityGateResults(gateResults) {
    console.log('📊 QUALITY GATE RESULTS');
    console.log('-'.repeat(40));

    Object.entries(gateResults.gates).forEach(([gateName, result]) => {
      const status = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⚠️';
      const critical = result.critical ? ' (CRITICAL)' : '';
      console.log(`${status} ${gateName}${critical}: ${result.actual}% (threshold: ${result.threshold}%)`);
    });

    console.log(`\n🎯 Overall Status: ${gateResults.overallStatus.toUpperCase()}`);
    console.log(`📈 Gates Passed: ${gateResults.passed}/${Object.keys(gateResults.gates).length}`);

    if (gateResults.criticalFailures.length > 0) {
      console.log(`🚨 Critical Failures: ${gateResults.criticalFailures.length}`);
    }

    console.log();
  }

  /**
   * Generate comprehensive CI/CD reports
   */
  async generateCICDReports(pipelineResults) {
    console.log('📄 Generating CI/CD reports...');

    // Generate master report
    const masterReport = await this.generateMasterReport(pipelineResults);

    // Generate environment-specific reports
    await this.generateEnvironmentSpecificReports(masterReport);

    // Generate artifact summary
    await this.generateArtifactSummary();

    console.log(`✅ Reports generated in ${this.options.artifactDir}\n`);
  }

  /**
   * Generate master CI/CD report
   */
  async generateMasterReport(pipelineResults) {
    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        environment: this.options.environmentContext,
        pipeline: {
          ...this.results.pipeline,
          endTime: new Date().toISOString(),
          duration: Date.now() - new Date(this.results.pipeline.startTime).getTime()
        }
      },
      summary: {
        totalStages: Object.keys(pipelineResults).length,
        passedStages: Object.values(pipelineResults).filter(r => r.status === 'passed').length,
        failedStages: Object.values(pipelineResults).filter(r => r.status === 'failed').length,
        errorStages: Object.values(pipelineResults).filter(r => r.status === 'error').length
      },
      qualityGates: this.results.gates,
      stages: pipelineResults,
      artifacts: this.results.artifacts,
      recommendations: this.results.recommendations,
      qualityMetrics: this.calculateQualityMetrics(pipelineResults)
    };

    const reportFile = path.join(this.options.artifactDir, 'ci-cd-master-report.json');
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
    this.results.artifacts.push(reportFile);

    return report;
  }

  /**
   * Calculate quality metrics for the pipeline
   */
  calculateQualityMetrics(pipelineResults) {
    const metrics = {
      overallSuccessRate: 0,
      averageStagePerformance: 0,
      qualityGateCompliance: 0,
      pipelineEfficiency: 0
    };

    const stages = Object.values(pipelineResults);
    const successfulStages = stages.filter(s => s.status === 'passed').length;

    metrics.overallSuccessRate = (successfulStages / stages.length) * 100;

    // Average stage performance (based on duration and success)
    const stageDurations = stages.map(s => s.duration || 0);
    metrics.averageStagePerformance = stageDurations.reduce((sum, d) => sum + d, 0) / stageDurations.length;

    // Quality gate compliance
    const gates = Object.values(this.results.gates);
    const passedGates = gates.filter(g => g.status === 'passed').length;
    metrics.qualityGateCompliance = gates.length > 0 ? (passedGates / gates.length) * 100 : 0;

    // Pipeline efficiency (success rate vs time)
    const totalDuration = Date.now() - new Date(this.results.pipeline.startTime).getTime();
    metrics.pipelineEfficiency = (metrics.overallSuccessRate / Math.max(totalDuration / 1000, 1)) * 10;

    return metrics;
  }

  /**
   * Generate environment-specific reports
   */
  async generateEnvironmentSpecificReports(masterReport) {
    switch (this.options.environmentContext.type) {
      case 'github-actions':
        await this.generateGitHubActionsReport(masterReport);
        break;
      case 'gitlab-ci':
        await this.generateGitLabCIReport(masterReport);
        break;
      case 'jenkins':
        await this.generateJenkinsReport(masterReport);
        break;
      case 'pre-commit':
      case 'pre-push':
        await this.generateGitHookReport(masterReport);
        break;
    }

    // Always generate JUnit report for CI/CD systems
    await this.generateJUnitReport(masterReport);
  }

  /**
   * Generate GitHub Actions specific report
   */
  async generateGitHubActionsReport(masterReport) {
    const summary = this.generateGitHubActionsSummary(masterReport);

    const reportFile = path.join(this.options.artifactDir, 'github-actions-summary.md');
    await fs.writeFile(reportFile, summary);
    this.results.artifacts.push(reportFile);

    // Generate GitHub Actions annotations
    const annotations = this.generateGitHubActionsAnnotations(masterReport);
    const annotationFile = path.join(this.options.artifactDir, 'github-actions-annotations.json');
    await fs.writeFile(annotationFile, JSON.stringify(annotations, null, 2));
    this.results.artifacts.push(annotationFile);
  }

  /**
   * Generate GitHub Actions summary markdown
   */
  generateGitHubActionsSummary(masterReport) {
    const summary = [];

    summary.push('# 🚀 Cross-System Integration Validation Report\n');

    // Overview
    summary.push('## 📊 Overview\n');
    summary.push(`- **Environment**: ${masterReport.metadata.environment.type}`);
    summary.push(`- **Workflow**: ${masterReport.metadata.environment.workflow || 'N/A'}`);
    summary.push(`- **Duration**: ${(masterReport.metadata.pipeline.duration / 1000).toFixed(1)}s`);
    summary.push(`- **Status**: ${masterReport.summary.passedStages === masterReport.summary.totalStages ? '✅ SUCCESS' : '❌ FAILURE'}\n`);

    // Quality Gates
    summary.push('## 🚦 Quality Gates\n');
    summary.push('| Gate | Status | Actual | Threshold | Critical |');
    summary.push('|------|--------|---------|-----------|----------|');

    Object.entries(masterReport.qualityGates).forEach(([gateName, result]) => {
      if (!result) return;

      const status = result.status === 'passed' ? '✅' : '❌';
      const critical = this.isCriticalGate(gateName) ? '🔴' : '⚪';
      const actual = this.getActualValue(result, gateName);
      const threshold = this.options.qualityGates[gateName];

      summary.push(`| ${gateName} | ${status} | ${actual}% | ${threshold}% | ${critical} |`);
    });

    summary.push('');

    // Stage Results
    summary.push('## 📋 Stage Results\n');
    Object.entries(masterReport.stages).forEach(([stageName, result]) => {
      const status = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⚠️';
      const duration = (result.duration / 1000).toFixed(1);
      summary.push(`- ${status} **${result.stage}**: ${result.status.toUpperCase()} (${duration}s)`);
    });

    summary.push('');

    // Recommendations
    if (masterReport.recommendations.length > 0) {
      summary.push('## 💡 Recommendations\n');
      masterReport.recommendations.forEach(rec => {
        const priority = rec.priority === 'CRITICAL' ? '🔴' : rec.priority === 'HIGH' ? '🟡' : '🟢';
        summary.push(`${priority} **${rec.category}**: ${rec.action}`);
        summary.push(`   - ${rec.details}\n`);
      });
    }

    return summary.join('\n');
  }

  /**
   * Generate GitHub Actions annotations
   */
  generateGitHubActionsAnnotations(masterReport) {
    const annotations = [];

    // Add annotations for failed stages
    Object.entries(masterReport.stages).forEach(([stageName, result]) => {
      if (result.status === 'failed' || result.status === 'error') {
        annotations.push({
          level: 'error',
          title: `${result.stage} Failed`,
          message: result.error || `Stage ${result.stage} failed validation`,
          file: 'tests/integration/',
          line: 1
        });
      }
    });

    // Add annotations for quality gate failures
    Object.entries(masterReport.qualityGates).forEach(([gateName, result]) => {
      if (result && result.status === 'failed') {
        const level = this.isCriticalGate(gateName) ? 'error' : 'warning';
        annotations.push({
          level,
          title: `Quality Gate: ${gateName}`,
          message: `${gateName} quality gate failed: ${this.getActualValue(result, gateName)}% < ${this.options.qualityGates[gateName]}%`,
          file: 'tests/integration/',
          line: 1
        });
      }
    });

    return annotations;
  }

  /**
   * Generate JUnit XML report for CI/CD systems
   */
  async generateJUnitReport(masterReport) {
    const testSuites = [];

    // Create test suite for each stage
    Object.entries(masterReport.stages).forEach(([stageName, result]) => {
      const testCase = {
        name: result.stage,
        classname: 'CrossSystemIntegration',
        time: (result.duration / 1000).toFixed(3),
        status: result.status
      };

      if (result.status === 'failed' || result.status === 'error') {
        testCase.failure = {
          message: result.error || `${result.stage} validation failed`,
          type: result.status === 'error' ? 'Error' : 'Failure'
        };
      }

      testSuites.push(testCase);
    });

    // Generate XML
    const xml = this.generateJUnitXML(testSuites, masterReport);

    const reportFile = path.join(this.options.artifactDir, 'junit-report.xml');
    await fs.writeFile(reportFile, xml);
    this.results.artifacts.push(reportFile);
  }

  /**
   * Generate JUnit XML format
   */
  generateJUnitXML(testCases, masterReport) {
    const totalTests = testCases.length;
    const failures = testCases.filter(tc => tc.status === 'failed').length;
    const errors = testCases.filter(tc => tc.status === 'error').length;
    const time = (masterReport.metadata.pipeline.duration / 1000).toFixed(3);

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<testsuites name="CrossSystemIntegration" tests="${totalTests}" failures="${failures}" errors="${errors}" time="${time}">\n`;
    xml += `  <testsuite name="IntegrationValidation" tests="${totalTests}" failures="${failures}" errors="${errors}" time="${time}">\n`;

    testCases.forEach(testCase => {
      xml += `    <testcase name="${testCase.name}" classname="${testCase.classname}" time="${testCase.time}"`;

      if (testCase.failure) {
        xml += '>\n';
        xml += `      <${testCase.failure.type.toLowerCase()} message="${this.escapeXml(testCase.failure.message)}">${this.escapeXml(testCase.failure.message)}</${testCase.failure.type.toLowerCase()}>\n`;
        xml += '    </testcase>\n';
      } else {
        xml += ' />\n';
      }
    });

    xml += '  </testsuite>\n';
    xml += '</testsuites>\n';

    return xml;
  }

  /**
   * Escape XML special characters
   */
  escapeXml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Generate Git hook specific report
   */
  async generateGitHookReport(masterReport) {
    const hookType = this.options.environmentContext.stage;
    const summary = [];

    summary.push(`=== ${hookType.toUpperCase()} VALIDATION REPORT ===`);
    summary.push(`Timestamp: ${masterReport.metadata.timestamp}`);
    summary.push(`Duration: ${(masterReport.metadata.pipeline.duration / 1000).toFixed(1)}s`);
    summary.push('');

    // Results
    Object.entries(masterReport.stages).forEach(([stageName, result]) => {
      const status = result.status === 'passed' ? 'PASS' : 'FAIL';
      summary.push(`${status}: ${result.stage} (${(result.duration / 1000).toFixed(1)}s)`);
    });

    summary.push('');

    // Critical issues only for hooks
    const criticalIssues = masterReport.recommendations.filter(r => r.priority === 'CRITICAL');
    if (criticalIssues.length > 0) {
      summary.push('CRITICAL ISSUES:');
      criticalIssues.forEach(issue => {
        summary.push(`- ${issue.category}: ${issue.details}`);
      });
    }

    const reportFile = path.join(this.options.artifactDir, `${hookType}-report.txt`);
    await fs.writeFile(reportFile, summary.join('\n'));
    this.results.artifacts.push(reportFile);
  }

  /**
   * Generate artifact summary
   */
  async generateArtifactSummary() {
    const summary = {
      timestamp: new Date().toISOString(),
      environment: this.options.environmentContext.type,
      totalArtifacts: this.results.artifacts.length,
      artifacts: this.results.artifacts.map(artifact => ({
        name: path.basename(artifact),
        path: artifact,
        size: this.getFileSize(artifact),
        type: this.getArtifactType(artifact)
      }))
    };

    const summaryFile = path.join(this.options.artifactDir, 'artifact-summary.json');
    await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2));
  }

  /**
   * Get file size for artifact
   */
  getFileSize(filePath) {
    try {
      const stats = fsSync.statSync(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  /**
   * Get artifact type based on file extension
   */
  getArtifactType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.json': return 'report';
      case '.xml': return 'junit';
      case '.md': return 'markdown';
      case '.txt': return 'text';
      case '.log': return 'log';
      default: return 'unknown';
    }
  }

  /**
   * Finalize pipeline execution
   */
  async finalizePipeline(gateResults) {
    this.results.pipeline.endTime = new Date().toISOString();
    this.results.pipeline.duration = Date.now() - new Date(this.results.pipeline.startTime).getTime();
    this.results.pipeline.status = gateResults.overallStatus;

    // Log final results
    console.log('🏁 Pipeline Execution Complete\n');
    console.log('=' .repeat(50));
    console.log(`Status: ${gateResults.overallStatus.toUpperCase()}`);
    console.log(`Duration: ${(this.results.pipeline.duration / 1000).toFixed(1)}s`);
    console.log(`Quality Gates: ${gateResults.passed}/${Object.keys(gateResults.gates).length} passed`);
    console.log(`Artifacts: ${this.results.artifacts.length} generated`);

    if (gateResults.criticalFailures.length > 0) {
      console.log(`Critical Failures: ${gateResults.criticalFailures.length}`);
    }

    console.log('=' .repeat(50));

    // Set appropriate exit behavior for different environments
    if (this.options.environmentContext.type === 'local') {
      // Don't exit for local development
      return;
    }

    if (gateResults.overallStatus === 'failed') {
      process.exitCode = 1;
    } else if (gateResults.overallStatus === 'passed-with-warnings') {
      process.exitCode = 0; // Success but with warnings
    } else {
      process.exitCode = 0; // Success
    }
  }

  /**
   * Handle pipeline failure
   */
  async handlePipelineFailure(error) {
    console.error('💥 Pipeline Execution Failed');
    console.error('=' .repeat(50));
    console.error(`Error: ${error.message}`);
    console.error(`Timestamp: ${new Date().toISOString()}`);

    // Save failure report
    const failureReport = {
      timestamp: new Date().toISOString(),
      environment: this.options.environmentContext,
      error: {
        message: error.message,
        stack: error.stack
      },
      pipeline: this.results.pipeline,
      partialResults: this.results.gates
    };

    try {
      const failureFile = path.join(this.options.artifactDir, 'pipeline-failure.json');
      await fs.writeFile(failureFile, JSON.stringify(failureReport, null, 2));
      console.error(`Failure report saved: ${failureFile}`);
    } catch (saveError) {
      console.error(`Failed to save failure report: ${saveError.message}`);
    }

    console.error('=' .repeat(50));

    // Set exit code for CI/CD systems
    if (this.options.environmentContext.type !== 'local') {
      process.exitCode = 2; // Pipeline error
    }
  }

  /**
   * Execute command with proper error handling
   */
  async executeCommand(command, args = [], options = {}) {
    // Enhanced security validation
    if (!SAFE_CLI_COMMANDS.has(command)) {
      return Promise.reject(new Error(`Unsupported command: ${command}`));
    }

    if (!Array.isArray(args) || args.some(arg => typeof arg !== 'string')) {
      return Promise.reject(new Error('Command arguments must be provided as an array of strings'));
    }

    // Sanitize command arguments to prevent injection
    const sanitizedArgs = args.map(arg => {
      // Remove dangerous characters and escape sequences
      return arg.replace(/[;&|`$(){}[\]\\]/g, '').trim();
    });

    // Additional validation: reject arguments containing path traversal attempts
    const hasPathTraversal = sanitizedArgs.some(arg =>
      arg.includes('..') || arg.includes('~') || arg.startsWith('/')
    );

    if (hasPathTraversal) {
      return Promise.reject(new Error('Path traversal attempts detected in arguments'));
    }

    return new Promise((resolve) => {
      const proc = spawn(command, sanitizedArgs, {
        cwd: process.cwd(),
        timeout: this.options.timeout,
        stdio: ['pipe', 'pipe', 'pipe'],
        ...options,
        shell: false
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
}

module.exports = CICDIntegrationHooks;

// Allow direct execution for CI/CD environments
if (require.main === module) {
  const hooks = new CICDIntegrationHooks({
    verbose: process.argv.includes('--verbose'),
    failFast: !process.argv.includes('--no-fail-fast'),
    parallelExecution: !process.argv.includes('--sequential')
  });

  hooks.runCICDValidationPipeline()
    .then(result => {
      // Exit code is handled by finalizePipeline
    })
    .catch(error => {
      console.error('CI/CD Pipeline failed:', error.message);
      process.exit(2);
    });
}

