#!/usr/bin/env node

/**
 * Fast Command Scan - Quick identification of failing commands
 * Uses minimal timeouts and focuses on quick command validation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class FastCommandScanner {
  constructor() {
    this.packageJsonPath = path.resolve(__dirname, '..', 'package.json');
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      failures: [],
      skipped: 0,
    };

    // Quick timeout for fast scanning
    this.timeout = 10000; // 10 seconds

    // Commands to skip (risky/destructive)
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
      'fe:test:watch',
      'be:test:watch',
      'e2e:fe:debug',
      'e2e:fe:ui',
    ]);
  }

  loadCommands() {
    const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
    const scripts = packageJson.scripts;
    return Object.keys(scripts).filter(key => !key.startsWith('//'));
  }

  testCommand(command) {
    try {
      console.log(`Testing: ${command}`);

      execSync(`yarn ${command}`, {
        stdio: 'pipe',
        timeout: this.timeout,
        cwd: path.resolve(__dirname, '..'),
      });

      console.log(`✅ ${command}`);
      return { success: true, error: null };
    } catch (error) {
      const errorMsg = error.stderr ? error.stderr.toString() : error.message;
      console.log(`❌ ${command} - ${errorMsg.substring(0, 100)}...`);
      return { success: false, error: errorMsg };
    }
  }

  scan() {
    const commands = this.loadCommands();
    console.log(
      `Scanning ${commands.length} commands with ${this.timeout / 1000}s timeout each...\n`
    );

    for (const command of commands) {
      this.results.total++;

      if (this.skipCommands.has(command)) {
        console.log(`⏭️  ${command} - SKIPPED`);
        this.results.skipped++;
        continue;
      }

      const result = this.testCommand(command);

      if (result.success) {
        this.results.passed++;
      } else {
        this.results.failed++;
        this.results.failures.push({
          command,
          error: result.error,
        });
      }
    }

    this.generateReport();
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('FAST COMMAND SCAN REPORT');
    console.log('='.repeat(60));

    const tested = this.results.total - this.results.skipped;
    console.log(`Commands tested: ${tested}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Skipped: ${this.results.skipped}`);

    const successRate = Math.round((this.results.passed / tested) * 100);
    console.log(`Success rate: ${successRate}%`);

    if (this.results.failures.length > 0) {
      console.log('\n❌ FAILED COMMANDS:');
      this.results.failures.forEach((failure, i) => {
        console.log(`${i + 1}. ${failure.command}`);
        if (failure.error && failure.error.length < 200) {
          console.log(`   Error: ${failure.error.trim()}`);
        }
      });
    }

    // Save results
    const reportPath = path.resolve(__dirname, '..', 'fast-scan-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\nResults saved to: ${reportPath}`);

    if (this.results.failed === 0) {
      console.log('\n🎉 ALL TESTABLE COMMANDS WORKING!');
    } else {
      console.log(`\n🚨 ${this.results.failed} commands need fixing`);
    }
  }
}

if (require.main === module) {
  const scanner = new FastCommandScanner();
  scanner.scan();
}

module.exports = FastCommandScanner;
