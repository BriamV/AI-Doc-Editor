#!/usr/bin/env node

/**
 * Comprehensive Command Testing Script
 *
 * Tests all modernized package.json commands in optimal order
 * with safety checks and detailed reporting.
 *
 * Usage:
 *   node scripts/comprehensive-command-test.cjs [--phase=1-6] [--dry-run] [--continue-on-failure]
 *
 * Environment:
 *   - Requires Node.js 18+ and Yarn 4+
 *   - Validates environment before testing
 *   - Creates detailed logs and JSON results
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const CONFIG = {
  maxTimeout: 300000, // 5 minutes per command
  logLevel: 'verbose',
  resultsDir: path.join(__dirname, '..', 'test-results'),
  backupDir: path.join(__dirname, '..', '.test-backup'),
};

// Command definitions with phases and expected execution times
const TEST_PHASES = {
  1: {
    name: 'Infrastructure Validation',
    description: 'Platform detection, environment validation, and repository integrity',
    expectedTime: 5,
    commands: [
      { cmd: 'yarn repo:env:info', time: 5, risk: 'low' },
      { cmd: 'yarn repo:env:validate', time: 10, risk: 'low' },
      { cmd: 'yarn help', time: 1, risk: 'low' },
      { cmd: 'yarn repo:licenses', time: 15, risk: 'low' },
      { cmd: 'yarn repo:integrity', time: 10, risk: 'low' },
      { cmd: 'yarn docs:validate', time: 20, risk: 'low' },
      { cmd: 'yarn docs:api:lint', time: 5, risk: 'low' },
    ],
  },
  2: {
    name: 'Frontend Core',
    description: 'TypeScript, React, Vite toolchain validation',
    expectedTime: 8,
    commands: [
      { cmd: 'yarn fe:format:check', time: 30, risk: 'low' },
      { cmd: 'yarn fe:lint', time: 45, risk: 'medium' },
      { cmd: 'yarn fe:typecheck', time: 20, risk: 'medium' },
      { cmd: 'yarn fe:test', time: 60, risk: 'medium' },
      { cmd: 'yarn fe:test:coverage', time: 90, risk: 'medium' },
      { cmd: 'yarn fe:build:dev', time: 45, risk: 'medium' },
    ],
  },
  3: {
    name: 'Backend Core',
    description: 'Python, FastAPI toolchain validation',
    expectedTime: 10,
    commands: [
      { cmd: 'yarn be:format:check', time: 15, risk: 'low' },
      { cmd: 'yarn be:lint', time: 30, risk: 'medium' },
      { cmd: 'yarn be:complexity', time: 20, risk: 'low' },
      { cmd: 'yarn be:test', time: 120, risk: 'medium' },
      { cmd: 'yarn be:test:integration', time: 180, risk: 'medium' },
      { cmd: 'yarn be:test:security', time: 60, risk: 'medium' },
    ],
  },
  4: {
    name: 'Security & Quality Gates',
    description: 'Security scanning and quality enforcement',
    expectedTime: 12,
    commands: [
      { cmd: 'yarn sec:deps:fe', time: 30, risk: 'low' },
      { cmd: 'yarn sec:deps:be', time: 45, risk: 'low' },
      { cmd: 'yarn sec:sast', time: 120, risk: 'medium' },
      { cmd: 'yarn sec:secrets', time: 30, risk: 'low' },
      { cmd: 'yarn qa:gate:fast', time: 180, risk: 'medium' },
      { cmd: 'yarn qa:docs:validate', time: 20, risk: 'low' },
    ],
  },
  5: {
    name: 'End-to-End Testing',
    description: 'Complete system integration validation',
    expectedTime: 15,
    commands: [
      { cmd: 'yarn e2e:fe', time: 300, risk: 'high' },
      { cmd: 'yarn e2e:report', time: 5, risk: 'low' },
      { cmd: 'yarn e2e:be', time: 180, risk: 'high' },
      { cmd: 'yarn e2e:integration', time: 120, risk: 'high' },
    ],
  },
  6: {
    name: 'Aggregators & Build',
    description: 'Complete workflows and build validation',
    expectedTime: 8,
    commands: [
      { cmd: 'yarn all:lint', time: 60, risk: 'medium' },
      { cmd: 'yarn all:test', time: 240, risk: 'high' },
      { cmd: 'yarn all:security', time: 180, risk: 'medium' },
      { cmd: 'yarn fe:build:prod', time: 60, risk: 'medium' },
    ],
  },
};

// Skipped commands (too risky or destructive)
const SKIPPED_COMMANDS = [
  'yarn repo:install',
  'yarn repo:clean',
  'yarn be:install',
  'yarn be:bootstrap',
  'yarn fe:dev',
  'yarn be:dev',
  'yarn all:dev',
  'yarn docker:dev',
  'yarn docker:prod',
  'yarn desk:run',
  'yarn repo:merge:precheck',
  'yarn repo:merge:validate',
  'yarn repo:merge:hooks:install',
  'yarn fe:format',
  'yarn fe:lint:fix',
  'yarn be:format',
  'yarn be:lint:fix',
  'yarn docs:validate:fix',
];

class CommandTester {
  constructor(options = {}) {
    this.options = {
      phase: options.phase || null,
      dryRun: options.dryRun || false,
      continueOnFailure: options.continueOnFailure || false,
      logLevel: options.logLevel || 'verbose',
    };

    this.results = {
      startTime: new Date().toISOString(),
      phases: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
      },
    };

    this.setupDirectories();
    this.setupLogging();
  }

  setupDirectories() {
    // Create results directory
    if (!fs.existsSync(CONFIG.resultsDir)) {
      fs.mkdirSync(CONFIG.resultsDir, { recursive: true });
    }

    // Create backup directory
    if (!fs.existsSync(CONFIG.backupDir)) {
      fs.mkdirSync(CONFIG.backupDir, { recursive: true });
    }

    this.logFile = path.join(CONFIG.resultsDir, `test-log-${Date.now()}.txt`);
    this.resultsFile = path.join(CONFIG.resultsDir, `test-results-${Date.now()}.json`);
  }

  setupLogging() {
    this.log = (level, message, data = null) => {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

      console.log(logEntry);
      fs.appendFileSync(this.logFile, logEntry + '\\n');

      if (data) {
        const dataEntry = `[${timestamp}] [DATA] ${JSON.stringify(data, null, 2)}`;
        fs.appendFileSync(this.logFile, dataEntry + '\\n');
      }
    };
  }

  async validateEnvironment() {
    this.log('info', 'Validating environment prerequisites...');

    try {
      // Check Node.js version
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      this.log('info', `Node.js version: ${nodeVersion}`);

      // Check Yarn version
      const yarnVersion = execSync('yarn --version', { encoding: 'utf8' }).trim();
      this.log('info', `Yarn version: ${yarnVersion}`);

      // Check Git status
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
      if (gitStatus) {
        this.log('warn', 'Working directory has uncommitted changes');
        this.log('info', 'Git status output:', gitStatus);
      } else {
        this.log('info', 'Working directory is clean');
      }

      // Check system resources
      const totalMem = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
      const freeMem = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);
      this.log('info', `System memory: ${freeMem}GB free of ${totalMem}GB total`);

      return true;
    } catch (error) {
      this.log('error', 'Environment validation failed', error.message);
      return false;
    }
  }

  async backupPackageJson() {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const backupPath = path.join(CONFIG.backupDir, `package.json.backup.${Date.now()}`);

      fs.copyFileSync(packageJsonPath, backupPath);
      this.log('info', `Package.json backed up to: ${backupPath}`);

      return backupPath;
    } catch (error) {
      this.log('error', 'Failed to backup package.json', error.message);
      throw error;
    }
  }

  async runCommand(command, expectedTime, risk) {
    const startTime = Date.now();

    if (this.options.dryRun) {
      this.log(
        'info',
        `[DRY RUN] Would execute: ${command} (expected: ${expectedTime}s, risk: ${risk})`
      );
      return { success: true, duration: 0, output: '[DRY RUN]' };
    }

    this.log('info', `Executing: ${command} (expected: ${expectedTime}s, risk: ${risk})`);

    return new Promise(resolve => {
      const timeout = Math.max(expectedTime * 1000 * 2, CONFIG.maxTimeout); // 2x expected time or max timeout
      let timedOut = false;

      const child = spawn('yarn', command.replace('yarn ', '').split(' '), {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        cwd: process.cwd(),
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', data => {
        output += data.toString();
      });

      child.stderr.on('data', data => {
        errorOutput += data.toString();
      });

      const timeoutId = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
        this.log('error', `Command timed out after ${timeout}ms: ${command}`);
      }, timeout);

      child.on('close', code => {
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        if (timedOut) {
          resolve({
            success: false,
            duration,
            output,
            error: 'Command timed out',
            exitCode: -1,
          });
        } else {
          const success = code === 0;
          this.log(
            success ? 'info' : 'error',
            `Command ${success ? 'succeeded' : 'failed'}: ${command} (${duration}ms, exit code: ${code})`
          );

          if (!success && errorOutput) {
            this.log('error', 'Error output:', errorOutput);
          }

          resolve({
            success,
            duration,
            output,
            error: errorOutput,
            exitCode: code,
          });
        }
      });

      child.on('error', error => {
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;
        this.log('error', `Command error: ${command}`, error.message);

        resolve({
          success: false,
          duration,
          output,
          error: error.message,
          exitCode: -1,
        });
      });
    });
  }

  async runPhase(phaseNumber) {
    const phase = TEST_PHASES[phaseNumber];
    if (!phase) {
      throw new Error(`Invalid phase number: ${phaseNumber}`);
    }

    this.log('info', `\\n=== Phase ${phaseNumber}: ${phase.name} ===`);
    this.log('info', phase.description);
    this.log('info', `Expected duration: ${phase.expectedTime} minutes`);

    const phaseStart = Date.now();
    const phaseResults = {
      name: phase.name,
      description: phase.description,
      startTime: new Date().toISOString(),
      commands: [],
      summary: {
        total: phase.commands.length,
        passed: 0,
        failed: 0,
        duration: 0,
      },
    };

    for (const { cmd, time, risk } of phase.commands) {
      const result = await this.runCommand(cmd, time, risk);

      const commandResult = {
        command: cmd,
        expectedTime: time,
        risk: risk,
        ...result,
        timestamp: new Date().toISOString(),
      };

      phaseResults.commands.push(commandResult);

      if (result.success) {
        phaseResults.summary.passed++;
        this.results.summary.passed++;
        this.log('info', `✅ ${cmd} (${result.duration}ms)`);
      } else {
        phaseResults.summary.failed++;
        this.results.summary.failed++;
        this.log('error', `❌ ${cmd} (${result.duration}ms)`);

        if (!this.options.continueOnFailure && risk === 'high') {
          this.log('error', 'Critical failure detected, stopping execution');
          break;
        }
      }

      this.results.summary.total++;
    }

    const phaseDuration = Date.now() - phaseStart;
    phaseResults.duration = phaseDuration;
    phaseResults.summary.duration = phaseDuration;
    phaseResults.endTime = new Date().toISOString();

    this.results.phases[phaseNumber] = phaseResults;
    this.results.summary.duration += phaseDuration;

    const successRate = ((phaseResults.summary.passed / phaseResults.summary.total) * 100).toFixed(
      1
    );
    this.log(
      'info',
      `Phase ${phaseNumber} completed: ${phaseResults.summary.passed}/${phaseResults.summary.total} commands passed (${successRate}%)`
    );

    return phaseResults;
  }

  async run() {
    this.log('info', 'Starting comprehensive command testing...');
    this.log('info', 'Options:', this.options);

    // Environment validation
    if (!(await this.validateEnvironment())) {
      throw new Error('Environment validation failed');
    }

    // Backup package.json
    const backupPath = await this.backupPackageJson();

    try {
      const startTime = Date.now();

      // Determine which phases to run
      const phasesToRun = this.options.phase
        ? [parseInt(this.options.phase)]
        : Object.keys(TEST_PHASES).map(Number);

      this.log('info', `Running phases: ${phasesToRun.join(', ')}`);

      // Execute phases
      for (const phaseNumber of phasesToRun) {
        await this.runPhase(phaseNumber);

        // Save intermediate results
        this.saveResults();
      }

      // Final summary
      const totalDuration = Date.now() - startTime;
      this.results.endTime = new Date().toISOString();
      this.results.summary.duration = totalDuration;

      this.generateSummaryReport();
      this.saveResults();

      this.log('info', '\\n=== Testing Completed ===');
      this.log('info', `Total commands: ${this.results.summary.total}`);
      this.log('info', `Passed: ${this.results.summary.passed}`);
      this.log('info', `Failed: ${this.results.summary.failed}`);
      this.log(
        'info',
        `Success rate: ${((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1)}%`
      );
      this.log('info', `Total duration: ${(totalDuration / 1000 / 60).toFixed(1)} minutes`);
      this.log('info', `Results saved to: ${this.resultsFile}`);
    } catch (error) {
      this.log('error', 'Testing failed', error.message);
      throw error;
    }
  }

  generateSummaryReport() {
    const report = [];
    report.push('# Command Testing Summary Report\\n');
    report.push(`**Generated**: ${new Date().toISOString()}\\n`);
    report.push(
      `**Total Duration**: ${(this.results.summary.duration / 1000 / 60).toFixed(1)} minutes\\n`
    );
    report.push(
      `**Success Rate**: ${((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1)}%\\n`
    );

    report.push('## Phase Results\\n');
    for (const [phaseNum, phase] of Object.entries(this.results.phases)) {
      const successRate = ((phase.summary.passed / phase.summary.total) * 100).toFixed(1);
      report.push(`### Phase ${phaseNum}: ${phase.name}`);
      report.push(
        `- **Commands**: ${phase.summary.passed}/${phase.summary.total} passed (${successRate}%)`
      );
      report.push(`- **Duration**: ${(phase.summary.duration / 1000 / 60).toFixed(1)} minutes`);
      report.push('');
    }

    report.push('## Failed Commands\\n');
    for (const [phaseNum, phase] of Object.entries(this.results.phases)) {
      const failedCommands = phase.commands.filter(cmd => !cmd.success);
      if (failedCommands.length > 0) {
        report.push(`### Phase ${phaseNum}: ${phase.name}`);
        for (const cmd of failedCommands) {
          report.push(
            `- ❌ \`${cmd.command}\` (${cmd.risk} risk) - ${cmd.error || 'Unknown error'}`
          );
        }
        report.push('');
      }
    }

    const reportPath = path.join(CONFIG.resultsDir, `summary-report-${Date.now()}.md`);
    fs.writeFileSync(reportPath, report.join('\\n'));
    this.log('info', `Summary report saved to: ${reportPath}`);
  }

  saveResults() {
    fs.writeFileSync(this.resultsFile, JSON.stringify(this.results, null, 2));
  }
}

// CLI Interface
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (const arg of args) {
    if (arg.startsWith('--phase=')) {
      options.phase = arg.split('=')[1];
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--continue-on-failure') {
      options.continueOnFailure = true;
    } else if (arg === '--help') {
      console.log(`
Comprehensive Command Testing Script

Usage: node comprehensive-command-test.cjs [options]

Options:
  --phase=N              Run specific phase (1-6)
  --dry-run             Show what would be executed without running
  --continue-on-failure  Continue testing even after critical failures
  --help                Show this help message

Phases:
  1. Infrastructure Validation (5 min)
  2. Frontend Core (8 min)
  3. Backend Core (10 min)
  4. Security & Quality Gates (12 min)
  5. End-to-End Testing (15 min)
  6. Aggregators & Build (8 min)

Examples:
  node comprehensive-command-test.cjs                    # Run all phases
  node comprehensive-command-test.cjs --phase=1          # Run infrastructure only
  node comprehensive-command-test.cjs --dry-run          # Show commands without executing
            `);
      process.exit(0);
    }
  }

  return options;
}

// Main execution
async function main() {
  try {
    const options = parseArgs();
    const tester = new CommandTester(options);
    await tester.run();

    const successRate = (tester.results.summary.passed / tester.results.summary.total) * 100;
    process.exit(successRate >= 85 ? 0 : 1); // Success if 85%+ commands pass
  } catch (error) {
    console.error('Testing failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { CommandTester, TEST_PHASES, CONFIG };
