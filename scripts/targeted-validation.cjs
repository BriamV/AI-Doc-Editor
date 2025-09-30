#!/usr/bin/env node

/**
 * Targeted Validation - Tests specific commands that were previously failing
 * Focuses on validating fixes and identifying remaining issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TargetedValidator {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      failures: [],
    };

    // High-priority commands that were failing in previous scans
    this.targetCommands = [
      // Repository infrastructure
      'repo:licenses',
      'repo:integrity',
      'repo:merge:precheck',
      'repo:merge:validate',

      // Frontend build and test
      'fe:build',
      'fe:build:dev',
      'fe:build:prod',
      'fe:preview',
      'fe:format:check',
      'fe:test',
      'fe:test:coverage',
      'fe:quality',
      'fe:check',

      // Backend testing
      'be:test:coverage',
      'be:test:t12',
      'be:test:contract',
      'be:quality:monitored',
      'be:check',

      // E2E and integration
      'e2e:fe',
      'e2e:fe:headed',
      'e2e:report',
      'e2e:be',
      'e2e:all',
      'e2e:integration',

      // Security scanning
      'sec:sast',
      'sec:sast:full',
      'sec:deps:fe',
      'sec:deps:be',

      // Quality gates
      'qa:gate',
      'qa:gate:fast',
      'qa:coverage',

      // Deprecated but should work
      'e2e:cypress:run',
      'e2e:cypress:open',
    ];

    this.timeout = 45000; // 45 seconds timeout
  }

  testCommand(command) {
    try {
      console.log(`Testing: ${command}`);

      const result = execSync(`yarn ${command}`, {
        stdio: 'pipe',
        timeout: this.timeout,
        cwd: path.resolve(__dirname, '..'),
      });

      console.log(`✅ ${command} - PASSED`);
      return { success: true, error: null, output: result.toString() };
    } catch (error) {
      const errorMsg = error.stderr ? error.stderr.toString() : error.message;
      console.log(`❌ ${command} - FAILED`);
      console.log(`   Error: ${errorMsg.substring(0, 200)}...`);
      return { success: false, error: errorMsg };
    }
  }

  async validate() {
    console.log('🎯 Running targeted validation on previously failing commands...\n');
    console.log(`Testing ${this.targetCommands.length} target commands\n`);

    const startTime = Date.now();

    for (const command of this.targetCommands) {
      this.results.total++;
      const result = this.testCommand(command);

      if (result.success) {
        this.results.passed++;
      } else {
        this.results.failed++;
        this.results.failures.push({
          command,
          error: result.error,
          category: this.categorizeCommand(command),
          failureType: this.categorizeFailure(result.error),
        });
      }
    }

    const duration = Date.now() - startTime;
    this.generateReport(duration);
  }

  categorizeCommand(command) {
    if (command.startsWith('repo:')) return 'infrastructure';
    if (command.startsWith('fe:')) return 'frontend';
    if (command.startsWith('be:')) return 'backend';
    if (command.startsWith('e2e:')) return 'e2e_testing';
    if (command.startsWith('sec:')) return 'security';
    if (command.startsWith('qa:')) return 'quality_gates';
    return 'other';
  }

  categorizeFailure(errorMsg) {
    if (!errorMsg) return 'unknown';

    const error = errorMsg.toLowerCase();

    if (error.includes('command not found') || error.includes('not recognized')) {
      return 'missing_dependency';
    }
    if (error.includes('enoent') || error.includes('no such file')) {
      return 'missing_file';
    }
    if (error.includes('port') && error.includes('already in use')) {
      return 'port_conflict';
    }
    if (error.includes('timeout') || error.includes('etimedout')) {
      return 'timeout';
    }
    if (error.includes('python') || error.includes('pip')) {
      return 'python_environment';
    }
    if (error.includes('vite') || error.includes('build')) {
      return 'build_error';
    }
    if (error.includes('test') && error.includes('fail')) {
      return 'test_failure';
    }
    if (error.includes('prettier') || error.includes('format')) {
      return 'formatting_error';
    }

    return 'unknown';
  }

  generateReport(duration) {
    console.log('\n' + '='.repeat(70));
    console.log('TARGETED VALIDATION REPORT');
    console.log('='.repeat(70));

    const successRate = Math.round((this.results.passed / this.results.total) * 100);
    console.log(`Commands tested: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Success rate: ${successRate}%`);
    console.log(`Duration: ${Math.round(duration / 1000)}s`);

    if (this.results.failures.length > 0) {
      // Group by category
      const byCategory = this.results.failures.reduce((acc, failure) => {
        const category = failure.category;
        if (!acc[category]) acc[category] = [];
        acc[category].push(failure);
        return acc;
      }, {});

      console.log('\n❌ FAILURES BY CATEGORY:');
      Object.entries(byCategory).forEach(([category, failures]) => {
        console.log(`\n${category.toUpperCase()} (${failures.length} failures):`);
        failures.forEach(failure => {
          console.log(`  ❌ ${failure.command}`);
        });
      });

      // Group by failure type
      const byFailureType = this.results.failures.reduce((acc, failure) => {
        const type = failure.failureType;
        if (!acc[type]) acc[type] = [];
        acc[type].push(failure);
        return acc;
      }, {});

      console.log('\n🔍 FAILURES BY TYPE:');
      Object.entries(byFailureType).forEach(([type, failures]) => {
        console.log(`\n${type.toUpperCase().replace('_', ' ')} (${failures.length} failures):`);
        failures.forEach(failure => {
          console.log(`  ❌ ${failure.command}`);
        });
      });

      console.log('\n📋 RECOMMENDED ACTIONS:');
      Object.keys(byFailureType).forEach(type => {
        switch (type) {
          case 'missing_dependency':
            console.log('• Install missing dependencies');
            break;
          case 'port_conflict':
            console.log('• Kill processes occupying required ports');
            break;
          case 'python_environment':
            console.log('• Run: yarn be:install to fix Python environment');
            break;
          case 'build_error':
            console.log('• Check Vite configuration and dependencies');
            break;
          case 'test_failure':
            console.log('• Review and fix failing tests');
            break;
          case 'formatting_error':
            console.log('• Run: yarn fe:format to fix formatting');
            break;
          default:
            console.log(`• Investigate ${type} issues`);
        }
      });
    }

    // Save detailed results
    const reportPath = path.resolve(__dirname, '..', 'targeted-validation-results.json');
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          summary: this.results,
          duration,
          remainingIssues: this.results.failures.length,
          estimatedFixesNeeded: this.results.failed,
        },
        null,
        2
      )
    );

    console.log(`\nDetailed report saved to: ${reportPath}`);

    if (this.results.failed === 0) {
      console.log('\n🎉 ALL TARGET COMMANDS WORKING!');
      console.log('✅ Ready to test full command suite for 100% success rate');
    } else {
      console.log(`\n🚨 ${this.results.failed} commands still need fixes`);
      console.log('📋 Focus on the recommended actions above');
    }
  }
}

if (require.main === module) {
  const validator = new TargetedValidator();
  validator.validate().catch(console.error);
}

module.exports = TargetedValidator;
