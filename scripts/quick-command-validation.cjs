#!/usr/bin/env node

/**
 * Quick Command Validation Script
 *
 * Tests critical commands for immediate validation of the modernized structure.
 * Focuses on safe, non-destructive commands that validate core functionality.
 *
 * Usage:
 *   node scripts/quick-command-validation.cjs [--verbose]
 *
 * This script is designed to run in ~5 minutes and validate:
 * - Environment setup
 * - Command namespace accessibility
 * - Basic toolchain functionality
 * - Critical quality gates
 */

const { execSync } = require('child_process');
const chalk = require('chalk');

// Quick validation commands (safe, fast, non-destructive)
const QUICK_TESTS = [
  // Environment & Infrastructure (30s)
  {
    category: 'Environment',
    tests: [
      { cmd: 'yarn help', desc: 'Namespace help', timeout: 5 },
      { cmd: 'yarn repo:env:info', desc: 'Platform detection', timeout: 5 },
      { cmd: 'yarn repo:env:validate', desc: 'Environment validation', timeout: 10 },
    ],
  },

  // Frontend Toolchain (90s)
  {
    category: 'Frontend',
    tests: [
      { cmd: 'yarn fe:format:check', desc: 'Prettier check', timeout: 15 },
      { cmd: 'yarn fe:typecheck', desc: 'TypeScript compilation', timeout: 30 },
      { cmd: 'yarn fe:lint', desc: 'ESLint validation', timeout: 45 },
    ],
  },

  // Backend Toolchain (60s)
  {
    category: 'Backend',
    tests: [
      { cmd: 'yarn be:format:check', desc: 'Black format check', timeout: 10 },
      { cmd: 'yarn be:lint', desc: 'Ruff linting', timeout: 20 },
      { cmd: 'yarn be:complexity', desc: 'Complexity analysis', timeout: 30 },
    ],
  },

  // Documentation & Security (45s)
  {
    category: 'Docs & Security',
    tests: [
      { cmd: 'yarn docs:validate', desc: 'Document validation', timeout: 15 },
      { cmd: 'yarn docs:api:lint', desc: 'API spec linting', timeout: 10 },
      { cmd: 'yarn sec:deps:fe', desc: 'Frontend deps audit', timeout: 20 },
    ],
  },

  // Quality Gates (60s)
  {
    category: 'Quality Gates',
    tests: [
      { cmd: 'yarn qa:docs:validate', desc: 'QA document validation', timeout: 10 },
      { cmd: 'yarn repo:licenses', desc: 'License scanning', timeout: 20 },
      { cmd: 'yarn repo:integrity', desc: 'Repository integrity', timeout: 10 },
    ],
  },
];

class QuickValidator {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      startTime: Date.now(),
      details: [],
    };
  }

  log(level, message) {
    if (level === 'verbose' && !this.verbose) return;

    const colors = {
      info: chalk.blue,
      success: chalk.green,
      error: chalk.red,
      warn: chalk.yellow,
      verbose: chalk.gray,
    };

    console.log(colors[level] ? colors[level](message) : message);
  }

  async runCommand(cmd, timeout = 30) {
    return new Promise(resolve => {
      const start = Date.now();

      try {
        const output = execSync(cmd, {
          encoding: 'utf8',
          timeout: timeout * 1000,
          stdio: this.verbose ? 'inherit' : 'pipe',
        });

        const duration = Date.now() - start;
        resolve({ success: true, duration, output });
      } catch (error) {
        const duration = Date.now() - start;
        resolve({
          success: false,
          duration,
          error: error.message,
          output: error.stdout || '',
          stderr: error.stderr || '',
        });
      }
    });
  }

  async runCategory(category) {
    this.log('info', `\\n📋 Testing ${category.category}...`);

    const categoryResults = {
      name: category.category,
      tests: [],
      passed: 0,
      failed: 0,
    };

    for (const test of category.tests) {
      this.log('verbose', `  Running: ${test.cmd}`);

      const result = await this.runCommand(test.cmd, test.timeout);

      const testResult = {
        command: test.cmd,
        description: test.desc,
        ...result,
      };

      categoryResults.tests.push(testResult);
      this.results.total++;

      if (result.success) {
        categoryResults.passed++;
        this.results.passed++;
        this.log('success', `  ✅ ${test.desc} (${result.duration}ms)`);
      } else {
        categoryResults.failed++;
        this.results.failed++;
        this.log('error', `  ❌ ${test.desc} (${result.duration}ms)`);
        if (this.verbose) {
          this.log('verbose', `     Error: ${result.error}`);
        }
      }
    }

    this.results.details.push(categoryResults);

    const successRate = ((categoryResults.passed / category.tests.length) * 100).toFixed(1);
    this.log(
      'info',
      `   ${categoryResults.passed}/${category.tests.length} passed (${successRate}%)`
    );

    return categoryResults;
  }

  async validate() {
    this.log('info', '🚀 Quick Command Validation Starting...');
    this.log('info', '⚡ Testing critical commands for modernized structure');

    // Pre-validation checks
    this.log('verbose', '\\n🔍 Pre-validation checks...');
    try {
      execSync('node --version', { stdio: 'pipe' });
      execSync('yarn --version', { stdio: 'pipe' });
      this.log('verbose', '✅ Node.js and Yarn detected');
    } catch (error) {
      this.log('error', '❌ Missing Node.js or Yarn');
      return false;
    }

    // Run all categories
    for (const category of QUICK_TESTS) {
      await this.runCategory(category);
    }

    // Generate summary
    const duration = Date.now() - this.results.startTime;
    const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);

    this.log('info', '\\n📊 Validation Summary:');
    this.log('info', `   Total commands: ${this.results.total}`);
    this.log('info', `   Passed: ${this.results.passed}`);
    this.log('info', `   Failed: ${this.results.failed}`);
    this.log('info', `   Success rate: ${successRate}%`);
    this.log('info', `   Duration: ${(duration / 1000).toFixed(1)}s`);

    // Category breakdown
    this.log('verbose', '\\n📋 Category Breakdown:');
    for (const category of this.results.details) {
      const rate = ((category.passed / category.tests.length) * 100).toFixed(1);
      this.log(
        'verbose',
        `   ${category.name}: ${category.passed}/${category.tests.length} (${rate}%)`
      );
    }

    // Failed commands
    const failedCommands = this.results.details
      .flatMap(cat => cat.tests)
      .filter(test => !test.success);

    if (failedCommands.length > 0) {
      this.log('warn', '\\n⚠️  Failed Commands:');
      for (const cmd of failedCommands) {
        this.log('error', `   ❌ ${cmd.command} - ${cmd.description}`);
        if (this.verbose && cmd.error) {
          this.log('verbose', `      ${cmd.error}`);
        }
      }
    }

    // Recommendations
    this.log('info', '\\n💡 Recommendations:');
    if (successRate >= 90) {
      this.log('success', '   ✅ Excellent! Commands are working well');
      this.log('info', '   🚀 Ready to run comprehensive testing');
    } else if (successRate >= 75) {
      this.log('warn', '   ⚠️  Some issues detected');
      this.log('info', '   🔧 Fix failed commands before comprehensive testing');
    } else {
      this.log('error', '   ❌ Multiple issues detected');
      this.log('info', '   🛠️  Investigate environment and dependencies');
    }

    return successRate >= 75; // Success if 75%+ pass
  }
}

// CLI
async function main() {
  const verbose = process.argv.includes('--verbose') || process.argv.includes('-v');

  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
Quick Command Validation

Tests critical commands to validate the modernized package.json structure.

Usage: node quick-command-validation.cjs [options]

Options:
  --verbose, -v    Show detailed output
  --help, -h       Show this help

Duration: ~5 minutes
Commands tested: ${QUICK_TESTS.reduce((sum, cat) => sum + cat.tests.length, 0)} critical commands

Categories:
${QUICK_TESTS.map(cat => `  - ${cat.category} (${cat.tests.length} commands)`).join('\\n')}
        `);
    process.exit(0);
  }

  try {
    const validator = new QuickValidator({ verbose });
    const success = await validator.validate();

    console.log(
      '\\n' +
        (success
          ? chalk.green('✅ Quick validation completed successfully!')
          : chalk.red('❌ Quick validation detected issues'))
    );

    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error(chalk.red('💥 Validation failed:'), error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { QuickValidator, QUICK_TESTS };
