/**
 * BuildReporter.cjs - Build Results Processing (SOLID-Lean)
 * T-11: Core result processing for build validation
 * 
 * Single Responsibility: Result processing only
 * Lean: Focused on essential functionality
 */

class BuildReporter {
  constructor(logger) {
    this.logger = logger;
  }
  
  processResults(executionResults) {
    return executionResults.map(result => ({
      tool: result.tool,
      action: result.action,
      success: result.success,
      executionTime: result.executionTime,
      status: this._determineStatus(result),
      summary: this._generateSummary(result),
      details: this._extractBasicDetails(result),
      warnings: this._extractWarnings(result),
      errors: this._extractErrors(result),
      metrics: { executionTime: result.executionTime, success: result.success }
    }));
  }
  
  generateJsonReport(processedResults) {
    return {
      timestamp: new Date().toISOString(),
      dimension: 'build',
      results: processedResults,
      summary: {
        total: processedResults.length,
        passed: processedResults.filter(r => r.status === 'passed').length,
        failed: processedResults.filter(r => r.status === 'failed').length,
        warnings: processedResults.filter(r => r.status === 'warning').length,
        totalDuration: processedResults.reduce((sum, r) => sum + r.executionTime, 0)
      }
    };
  }
  
  _determineStatus(result) {
    if (!result.success) return 'failed';
    const warnings = this._extractWarnings(result);
    return warnings.length > 0 ? 'warning' : 'passed';
  }
  
  _generateSummary(result) {
    if (!result.success) return `Failed with exit code ${result.exitCode}`;
    const warnings = this._extractWarnings(result);
    return warnings.length > 0 ? `Completed with ${warnings.length} warning(s)` : 'Completed successfully';
  }
  
  _extractBasicDetails(result) {
    return {
      command: result.command,
      workingDirectory: result.workingDirectory,
      exitCode: result.exitCode,
      timedOut: result.timedOut || false
    };
  }
  
  _extractWarnings(result) {
    const warnings = [];
    if (result.stdout) {
      const lines = result.stdout.split('\n');
      if (result.tool === 'npm') {
        warnings.push(...lines.filter(line => line.includes('moderate') || line.includes('low')).map(line => line.trim()));
      } else if (result.tool === 'tsc') {
        warnings.push(...lines.filter(line => line.includes('warning TS')).map(line => line.trim()));
      }
    }
    return warnings;
  }
  
  _extractErrors(result) {
    const errors = [];
    if (!result.success) {
      if (result.stderr) errors.push(result.stderr);
      if (result.stdout) {
        const lines = result.stdout.split('\n');
        if (result.tool === 'npm') {
          errors.push(...lines.filter(line => line.includes('npm ERR!')).map(line => line.trim()));
        } else if (result.tool === 'tsc') {
          errors.push(...lines.filter(line => line.includes('error TS')).map(line => line.trim()));
        } else if (result.tool === 'pip') {
          errors.push(...lines.filter(line => line.includes('ERROR:')).map(line => line.trim()));
        }
      }
    }
    return errors;
  }
  
}

module.exports = BuildReporter;