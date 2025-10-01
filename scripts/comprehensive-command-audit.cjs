#!/usr/bin/env node

/**
 * Comprehensive Command Audit - Tests ALL 169 commands in package.json
 * Identifies exactly which commands are failing to achieve 100% success rate
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ComprehensiveAuditor {
  constructor() {
    this.packageJsonPath = path.resolve(__dirname, '..', 'package.json');
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      failures: [],
      deprecated: 0,
      skipped: 0,
    };
    this.timeout = 45000; // 45 seconds timeout for comprehensive testing

    // Commands to skip (too risky/destructive for automated testing)
    this.skipCommands = new Set([
      'repo:install',
      'repo:clean',
      'be:install',
      'be:bootstrap',
      'fe:dev',
      'be:dev',
      'all:dev',
      'all:setup',
      'docker:dev',
      'docker:prod',
      'docker:backend',
      'docker:stop',
      'docker:logs',
      'desk:run',
      'desk:pack',
      'desk:make',
      'fe:format',
      'fe:lint:fix',
      'be:format',
      'be:lint:fix',
      'docs:validate:fix',
    ]);
  }

  loadAllCommands() {
    const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
    const scripts = packageJson.scripts;

    // Filter out comments (keys starting with //)
    const commands = Object.keys(scripts).filter(key => !key.startsWith('//'));

    console.log(`Found ${commands.length} total commands in package.json`);
    console.log(`Will skip ${this.skipCommands.size} risky/destructive commands`);

    return commands;
  }

  isDeprecatedCommand(command) {
    const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
    const script = packageJson.scripts[command];
    return script && script.includes('[DEPRECATED]');
  }

  shouldSkipCommand(command) {
    return this.skipCommands.has(command);
  }

  async testCommand(command) {
    return new Promise(resolve => {
      // Check if should be skipped
      if (this.shouldSkipCommand(command)) {
        console.log(`⏭️  ${command} - SKIPPED (destructive/risky)`);
        this.results.skipped++;
        resolve({
          command,
          success: true,
          skipped: true,
          exitCode: 0,
          stdout: '[SKIPPED]',
          stderr: '',
          duration: 0,
        });
        return;
      }

      // Check if deprecated
      if (this.isDeprecatedCommand(command)) {
        console.log(`📋 ${command} - DEPRECATED (testing functionality)`);
        this.results.deprecated++;
      }

      console.log(`Testing: yarn ${command}`);

      const child = spawn('yarn', [command], {
        stdio: 'pipe',
        shell: true,
        cwd: path.resolve(__dirname, '..'),
      });

      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
        setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGKILL');
          }
        }, 5000);
      }, this.timeout);

      child.stdout?.on('data', data => {
        stdout += data.toString();
      });

      child.stderr?.on('data', data => {
        stderr += data.toString();
      });

      child.on('close', code => {
        clearTimeout(timer);

        const result = {
          command,
          success: !timedOut && code === 0,
          exitCode: code,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          timedOut,
          duration: Date.now() - start,
          deprecated: this.isDeprecatedCommand(command),
        };

        if (result.success) {
          console.log(`✅ ${command} - PASSED${result.deprecated ? ' (deprecated)' : ''}`);
        } else {
          console.log(`❌ ${command} - FAILED (exit: ${code}, timeout: ${timedOut})`);
          if (stderr && stderr.length < 200) {
            console.log(`   Error: ${stderr}`);
          }
        }

        resolve(result);
      });

      child.on('error', error => {
        clearTimeout(timer);
        console.log(`💥 ${command} - ERROR: ${error.message}`);
        resolve({
          command,
          success: false,
          exitCode: -1,
          stdout: '',
          stderr: error.message,
          timedOut: false,
          duration: Date.now() - start,
          deprecated: this.isDeprecatedCommand(command),
        });
      });

      const start = Date.now();
    });
  }

  categorizeCommand(command) {
    // Categorize by namespace
    if (command.startsWith('repo:')) return 'repo_infrastructure';
    if (command.startsWith('fe:')) return 'frontend';
    if (command.startsWith('be:')) return 'backend';
    if (command.startsWith('e2e:')) return 'e2e_testing';
    if (command.startsWith('sec:')) return 'security';
    if (command.startsWith('qa:')) return 'quality_gates';
    if (command.startsWith('desk:')) return 'electron_desktop';
    if (command.startsWith('docker:')) return 'docker';
    if (command.startsWith('docs:')) return 'documentation';
    if (command.startsWith('all:')) return 'aggregators';

    // Legacy commands
    if (this.isDeprecatedCommand(command)) return 'deprecated';

    return 'utility';
  }

  categorizeFailure(result) {
    const { command, stderr, exitCode, timedOut } = result;

    if (timedOut) return 'timeout';

    // Categorize by error type
    if (
      stderr.includes('command not found') ||
      stderr.includes('not recognized') ||
      stderr.includes('is not recognized as an internal or external command')
    ) {
      return 'missing_dependency';
    }
    if (
      stderr.includes('ENOENT') ||
      stderr.includes('No such file') ||
      stderr.includes('cannot find module')
    ) {
      return 'missing_file';
    }
    if (stderr.includes('permission denied') || stderr.includes('EACCES')) {
      return 'permission_error';
    }
    if (stderr.includes('network') || stderr.includes('timeout') || stderr.includes('ETIMEDOUT')) {
      return 'network_error';
    }
    if (stderr.includes('python') || stderr.includes('pip') || stderr.includes('pytest')) {
      return 'python_environment';
    }
    if (stderr.includes('node') || stderr.includes('npm') || stderr.includes('yarn')) {
      return 'node_environment';
    }

    return 'unknown_error';
  }

  async auditAllCommands() {
    const commands = this.loadAllCommands();
    this.results.total = commands.length;

    console.log('Starting comprehensive audit of ALL commands...\n');

    const startTime = Date.now();

    for (const command of commands) {
      try {
        const result = await this.testCommand(command);

        if (result.skipped) {
          // Skipped commands are not counted in pass/fail
          this.results.total--;
          continue;
        }

        if (result.success) {
          this.results.passed++;
        } else {
          this.results.failed++;
          this.results.failures.push({
            command: result.command,
            exitCode: result.exitCode,
            stderr: result.stderr,
            timedOut: result.timedOut,
            category: this.categorizeCommand(result.command),
            failureType: this.categorizeFailure(result),
            deprecated: result.deprecated,
          });
        }
      } catch (error) {
        console.error(`Error testing ${command}:`, error.message);
        this.results.failed++;
        this.results.failures.push({
          command,
          error: error.message,
          category: this.categorizeCommand(command),
          failureType: 'execution_error',
        });
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`\nAudit completed in ${Math.round(totalTime / 1000)}s`);

    this.generateReport();
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('COMPREHENSIVE COMMAND AUDIT REPORT');
    console.log('='.repeat(80));

    console.log(`Total commands tested: ${this.results.total}`);
    console.log(
      `Passed: ${this.results.passed} (${Math.round((this.results.passed / this.results.total) * 100)}%)`
    );
    console.log(
      `Failed: ${this.results.failed} (${Math.round((this.results.failed / this.results.total) * 100)}%)`
    );
    console.log(`Deprecated: ${this.results.deprecated} (functional but deprecated)`);
    console.log(`Skipped: ${this.results.skipped} (too risky for automated testing)`);

    const functionalTotal = this.results.total;
    const functionalPassed = this.results.passed;
    console.log(
      `\n🎯 SUCCESS RATE: ${functionalPassed}/${functionalTotal} working (${Math.round((functionalPassed / functionalTotal) * 100)}%)`
    );

    if (this.results.failed === 0) {
      console.log(`🎉 ALL TESTABLE COMMANDS WORKING! (100% success rate achieved)`);
    } else {
      console.log(`🚨 NEED TO FIX: ${this.results.failed} commands to achieve 100% success rate`);
    }

    if (this.results.failures.length > 0) {
      console.log('\n❌ FAILED COMMANDS ANALYSIS:');

      // Group by namespace
      const byNamespace = this.results.failures.reduce((acc, failure) => {
        const category = failure.category;
        if (!acc[category]) acc[category] = [];
        acc[category].push(failure);
        return acc;
      }, {});

      console.log('\n📋 BY NAMESPACE:');
      Object.entries(byNamespace).forEach(([category, failures]) => {
        console.log(`\n${category.toUpperCase().replace('_', ' ')} (${failures.length} failures):`);
        failures.forEach(failure => {
          console.log(`  ❌ ${failure.command}${failure.deprecated ? ' [DEPRECATED]' : ''}`);
          if (failure.stderr && failure.stderr.length < 150) {
            console.log(`     Error: ${failure.stderr.substring(0, 150)}...`);
          }
          if (failure.timedOut) {
            console.log(`     Reason: Command timed out (>${this.timeout / 1000}s)`);
          }
        });
      });

      // Group by failure type
      const byFailureType = this.results.failures.reduce((acc, failure) => {
        const type = failure.failureType;
        if (!acc[type]) acc[type] = [];
        acc[type].push(failure);
        return acc;
      }, {});

      console.log('\n🔍 BY FAILURE TYPE:');
      Object.entries(byFailureType).forEach(([type, failures]) => {
        console.log(`\n${type.toUpperCase().replace('_', ' ')} (${failures.length} failures):`);
        failures.forEach(failure => {
          console.log(`  ❌ ${failure.command}`);
        });
      });
    }

    // Save detailed report to file
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: this.results,
      detailedFailures: this.results.failures,
      recommendations: this.generateRecommendations(),
    };

    const reportPath = path.resolve(__dirname, '..', 'comprehensive-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\nDetailed report saved to: ${reportPath}`);

    console.log(`\n📋 NEXT STEPS:`);
    if (this.results.failed === 0) {
      console.log(`✅ All commands working! Ready for production use.`);
    } else {
      console.log(`1. Fix ${this.results.failed} failing commands based on failure types above`);
      console.log(`2. Run this audit again to validate fixes`);
      console.log(
        `3. Achieve ${this.results.total}/${this.results.total} commands working (100% success rate)`
      );
    }
  }

  generateRecommendations() {
    const recommendations = [];

    // Analyze failure patterns
    const failureTypes = this.results.failures.reduce((acc, failure) => {
      acc[failure.failureType] = (acc[failure.failureType] || 0) + 1;
      return acc;
    }, {});

    Object.entries(failureTypes).forEach(([type, count]) => {
      switch (type) {
        case 'missing_dependency':
          recommendations.push(`Install missing dependencies for ${count} commands`);
          break;
        case 'missing_file':
          recommendations.push(
            `Check file paths and ensure required files exist for ${count} commands`
          );
          break;
        case 'python_environment':
          recommendations.push(`Fix Python environment setup for ${count} commands`);
          break;
        case 'node_environment':
          recommendations.push(`Fix Node.js environment setup for ${count} commands`);
          break;
        case 'timeout':
          recommendations.push(`Investigate timeout issues for ${count} commands`);
          break;
        default:
          recommendations.push(`Investigate ${type} issues for ${count} commands`);
      }
    });

    return recommendations;
  }
}

// Run the audit
if (require.main === module) {
  const auditor = new ComprehensiveAuditor();
  auditor.auditAllCommands().catch(console.error);
}

module.exports = ComprehensiveAuditor;
