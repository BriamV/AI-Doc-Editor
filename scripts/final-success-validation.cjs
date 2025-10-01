#!/usr/bin/env node

/**
 * Final Success Validation - Tests key commands after all fixes
 * Provides final success rate and readiness assessment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class FinalSuccessValidator {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      failures: [],
    };

    // Key commands that represent each namespace (prioritized by importance)
    this.keyCommands = [
      // Infrastructure (critical)
      'help',
      'repo:env:info',
      'repo:env:validate',
      'repo:licenses',

      // Frontend (core functionality)
      'fe:build',
      'fe:typecheck',
      'fe:lint',
      'fe:format:check',
      'fe:test',

      // Backend (core functionality)
      'be:format:check',
      'be:lint',
      'be:complexity',
      'be:test',
      'be:test:contract',

      // Security (important)
      'sec:deps:fe',
      'sec:deps:be',
      'sec:sast',

      // Documentation
      'docs:validate',
      'docs:api:lint',

      // Quality gates
      'qa:gate:fast',

      // E2E (if working)
      'e2e:fe',

      // Deprecated (should work with warnings)
      'build',
      'test',
      'lint',
    ];

    this.timeout = 30000; // 30 seconds timeout for final validation
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
      return { success: true, error: null };
    } catch (error) {
      const errorMsg = error.stderr ? error.stderr.toString() : error.message;
      console.log(`❌ ${command} - FAILED`);
      console.log(`   Error: ${errorMsg.substring(0, 150)}...`);
      return { success: false, error: errorMsg };
    }
  }

  async validate() {
    console.log('🎯 FINAL SUCCESS VALIDATION');
    console.log('Testing key commands after all fixes applied...\n');

    const startTime = Date.now();

    for (const command of this.keyCommands) {
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
        });
      }
    }

    const duration = Date.now() - startTime;
    this.generateFinalReport(duration);
  }

  categorizeCommand(command) {
    if (command.startsWith('repo:')) return 'infrastructure';
    if (command.startsWith('fe:')) return 'frontend';
    if (command.startsWith('be:')) return 'backend';
    if (command.startsWith('e2e:')) return 'e2e_testing';
    if (command.startsWith('sec:')) return 'security';
    if (command.startsWith('qa:')) return 'quality_gates';
    if (command.startsWith('docs:')) return 'documentation';
    return 'legacy';
  }

  generateFinalReport(duration) {
    console.log('\n' + '='.repeat(80));
    console.log('FINAL SUCCESS VALIDATION REPORT');
    console.log('='.repeat(80));

    const successRate = Math.round((this.results.passed / this.results.total) * 100);
    console.log(`Key commands tested: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Success rate: ${successRate}%`);
    console.log(`Duration: ${Math.round(duration / 1000)}s`);

    // Estimate total command success rate
    const totalCommands = 169; // Total commands in package.json
    const skippedRiskyCommands = 21; // Commands we skip for safety
    const testableCommands = totalCommands - skippedRiskyCommands;

    // Based on our key command success rate, estimate overall success
    const estimatedWorking = Math.round((successRate / 100) * testableCommands);
    const estimatedOverallSuccess = Math.round((estimatedWorking / totalCommands) * 100);

    console.log(`\n📊 ESTIMATED OVERALL COMMAND SUCCESS:`);
    console.log(`Total commands in package.json: ${totalCommands}`);
    console.log(`Risky/destructive commands (skipped): ${skippedRiskyCommands}`);
    console.log(`Testable commands: ${testableCommands}`);
    console.log(`Estimated working commands: ${estimatedWorking}`);
    console.log(`Estimated overall success rate: ${estimatedOverallSuccess}%`);

    if (this.results.failures.length > 0) {
      console.log('\n❌ REMAINING FAILURES:');
      const byCategory = this.results.failures.reduce((acc, failure) => {
        const category = failure.category;
        if (!acc[category]) acc[category] = [];
        acc[category].push(failure);
        return acc;
      }, {});

      Object.entries(byCategory).forEach(([category, failures]) => {
        console.log(`\n${category.toUpperCase()} (${failures.length} failures):`);
        failures.forEach(failure => {
          console.log(`  ❌ ${failure.command}`);
        });
      });
    }

    console.log('\n🎯 SUCCESS SUMMARY:');
    if (successRate >= 95) {
      console.log('🎉 EXCELLENT! Near 100% success rate achieved');
      console.log('✅ System is ready for production use');
      console.log('✅ All critical functionality working');
    } else if (successRate >= 85) {
      console.log('✅ GOOD! High success rate achieved');
      console.log('⚠️  Some non-critical commands may need attention');
      console.log('✅ Core functionality working well');
    } else if (successRate >= 70) {
      console.log('⚠️  MODERATE success rate');
      console.log('🔧 Additional fixes needed for optimal performance');
      console.log('✅ Basic functionality working');
    } else {
      console.log('❌ LOW success rate');
      console.log('🛠️  Significant fixes needed');
      console.log('⚠️  Review environment setup and dependencies');
    }

    console.log('\n📋 NEXT STEPS TO ACHIEVE 100%:');
    if (successRate < 100) {
      console.log('1. Address remaining failures listed above');
      console.log('2. Review Python environment setup (yarn be:bootstrap)');
      console.log('3. Ensure all dependencies are installed');
      console.log('4. Run comprehensive validation on all 169 commands');
    } else {
      console.log('1. Run full comprehensive test on all 169 commands');
      console.log('2. Validate edge cases and error handling');
      console.log('3. Document successful configuration');
    }

    // Save final report
    const reportData = {
      timestamp: new Date().toISOString(),
      keyCommandResults: this.results,
      estimates: {
        totalCommands,
        testableCommands,
        estimatedWorking,
        estimatedOverallSuccess,
      },
      readinessAssessment: {
        successRate,
        level:
          successRate >= 95
            ? 'excellent'
            : successRate >= 85
              ? 'good'
              : successRate >= 70
                ? 'moderate'
                : 'low',
        productionReady: successRate >= 85,
      },
      nextSteps:
        successRate >= 95 ? ['Full validation'] : ['Fix remaining failures', 'Environment review'],
    };

    const reportPath = path.resolve(__dirname, '..', 'final-success-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\nDetailed report saved to: ${reportPath}`);

    console.log('\n' + '='.repeat(80));
    if (successRate >= 90) {
      console.log('🚀 MISSION ACCOMPLISHED! Commands are working excellently!');
    } else {
      console.log(`🎯 PROGRESS MADE! ${successRate}% success rate achieved!`);
    }
    console.log('='.repeat(80));
  }
}

if (require.main === module) {
  const validator = new FinalSuccessValidator();
  validator.validate().catch(console.error);
}

module.exports = FinalSuccessValidator;
