#!/usr/bin/env node
/**
 * Cross-Platform Compatibility Test Suite
 *
 * Tests yarn commands in different environments to ensure true cross-platform compatibility
 */

const { spawnSync } = require('child_process');
const path = require('path');

class CrossPlatformTester {
  constructor() {
    this.repoRoot = process.cwd();
    this.testResults = [];
    this.verbose = process.argv.includes('--verbose');
  }

  log(message) {
    if (this.verbose) {
      console.log(`[TEST] ${message}`);
    }
  }

  runTest(testName, command, args = []) {
    this.log(`Running test: ${testName}`);
    this.log(`Command: ${command} ${args.join(' ')}`);

    const startTime = Date.now();
    const result = spawnSync(command, args, {
      cwd: this.repoRoot,
      stdio: 'pipe',
      encoding: 'utf8',
    });
    const duration = Date.now() - startTime;

    const testResult = {
      name: testName,
      command: `${command} ${args.join(' ')}`,
      success: result.status === 0,
      exitCode: result.status,
      duration,
      stdout: result.stdout?.substring(0, 500) || '',
      stderr: result.stderr?.substring(0, 500) || '',
      error: result.error?.message || null,
    };

    this.testResults.push(testResult);

    if (testResult.success) {
      this.log(`✅ ${testName} - PASSED (${duration}ms)`);
    } else {
      this.log(`❌ ${testName} - FAILED (${duration}ms)`);
      this.log(`Exit code: ${testResult.exitCode}`);
      if (testResult.stderr) {
        this.log(`Error: ${testResult.stderr}`);
      }
    }

    return testResult;
  }

  async runAllTests() {
    console.log('🧪 Cross-Platform Compatibility Test Suite');
    console.log('===========================================');

    // Test the problematic commands that were fixed
    const tests = [
      ['Document validation (basic)', 'yarn', ['validate-docs']],
      ['Document validation (strict)', 'yarn', ['validate-docs:strict']],
      ['Document validation (fix mode)', 'yarn', ['validate-docs:fix']],
      ['Document validation (report)', 'yarn', ['validate-docs:report']],
      ['Architecture validation', 'yarn', ['validate-architecture']],

      // Test other cross-platform commands
      ['Environment validation', 'yarn', ['env-validate']],
      ['Python format check', 'yarn', ['python-format:check']],
      ['TypeScript check', 'yarn', ['tsc-check']],

      // Test the wrapper directly
      [
        'Cross-platform wrapper direct',
        'node',
        ['scripts/cross-platform-wrapper.cjs', 'validate-docs'],
      ],
    ];

    for (const [testName, command, args] of tests) {
      this.runTest(testName, command, args);
    }

    // Generate summary
    const passed = this.testResults.filter(r => r.success).length;
    const failed = this.testResults.filter(r => !r.success).length;
    const total = this.testResults.length;

    console.log('\n📊 Test Results Summary');
    console.log('======================');
    console.log(`Total tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  - ${r.name}: ${r.command}`);
          console.log(`    Exit code: ${r.exitCode}`);
          if (r.error) {
            console.log(`    Error: ${r.error}`);
          }
        });
    }

    console.log('\n🏁 Test suite completed');
    return failed === 0;
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new CrossPlatformTester();
  tester
    .runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test suite failed:', error.message);
      process.exit(1);
    });
}

module.exports = CrossPlatformTester;
