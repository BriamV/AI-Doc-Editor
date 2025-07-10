/**
 * Pytest Reporter - Single Responsibility: Result processing
 * Extracted from PytestWrapper for SOLID compliance
 */

const path = require('path');
const fs = require('fs').promises;

class PytestReporter {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.coverageThreshold = config.get('testing.coverage.threshold', 80);
  }
  
  /**
   * Process Pytest results and extract coverage info
   */
  async processResults(result, tool) {
    const processed = {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      tests: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      },
      coverage: {
        overall: 0,
        statements: 0,
        lines: 0
      },
      warnings: [],
      errors: []
    };
    
    // Parse Pytest output for test results
    this._parseTestResults(result.stdout, processed);
    
    // Try to read coverage report
    await this._processCoverageReport(processed);
    
    // Check coverage threshold
    if (processed.coverage.overall < this.coverageThreshold) {
      processed.warnings.push(`Coverage ${processed.coverage.overall}% below threshold ${this.coverageThreshold}%`);
    }
    
    // Add errors if tests failed
    if (result.exitCode !== 0) {
      processed.errors.push(result.stderr || 'Pytest tests failed');
    }
    
    return processed;
  }
  
  /**
   * Parse Pytest console output for test statistics
   */
  _parseTestResults(stdout, processed) {
    // Parse pytest output patterns
    const testPattern = /(\d+) passed/;
    const failedPattern = /(\d+) failed/;
    const skippedPattern = /(\d+) skipped/;
    
    const passedMatch = stdout.match(testPattern);
    const failedMatch = stdout.match(failedPattern);
    const skippedMatch = stdout.match(skippedPattern);
    
    if (passedMatch) processed.tests.passed = parseInt(passedMatch[1]);
    if (failedMatch) processed.tests.failed = parseInt(failedMatch[1]);
    if (skippedMatch) processed.tests.skipped = parseInt(skippedMatch[1]);
    
    processed.tests.total = processed.tests.passed + processed.tests.failed + processed.tests.skipped;
  }
  
  /**
   * Process coverage report if available
   */
  async _processCoverageReport(processed) {
    try {
      const coveragePath = path.join(process.cwd(), 'coverage.json');
      const coverageData = await fs.readFile(coveragePath, 'utf8');
      const coverage = JSON.parse(coverageData);
      
      if (coverage.totals) {
        processed.coverage.statements = coverage.totals.percent_covered || 0;
        processed.coverage.lines = coverage.totals.percent_covered || 0;
        processed.coverage.overall = Math.round(processed.coverage.statements);
      }
    } catch (error) {
      processed.warnings.push('Could not read coverage report');
    }
  }
}

module.exports = PytestReporter;