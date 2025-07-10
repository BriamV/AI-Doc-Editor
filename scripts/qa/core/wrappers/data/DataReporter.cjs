/**
 * DataReporter.cjs - Data Validation Results Processing (SOLID-Lean)
 * T-12: Core result processing for data validation
 * 
 * Single Responsibility: Result processing only
 * Lean: Focused on essential functionality
 */

class DataReporter {
  constructor(logger) {
    this.logger = logger;
  }
  
  /**
   * Process data validation execution results
   */
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
      metrics: { executionTime: result.executionTime, success: result.success, filesProcessed: result.filesProcessed?.length || 0 }
    }));
  }
  
  /**
   * Generate JSON report
   */
  generateJsonReport(processedResults) {
    return {
      timestamp: new Date().toISOString(),
      dimension: 'data',
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
    
    if (result.tool === 'spectral') {
      const filesCount = result.filesProcessed ? result.filesProcessed.length : 0;
      return `Validated ${filesCount} OpenAPI/Swagger files`;
    } else if (result.tool === 'django-migrations') {
      return 'Django migration status checked';
    }
    
    return 'Completed successfully';
  }
  
  _extractBasicDetails(result) {
    return {
      command: result.command,
      workingDirectory: result.workingDirectory,
      exitCode: result.exitCode,
      timedOut: result.timedOut || false,
      filesProcessed: result.filesProcessed || []
    };
  }
  
  _extractWarnings(result) {
    const warnings = [];
    
    if (result.tool === 'spectral' && result.stdout) {
      const lines = result.stdout.split('\n');
      warnings.push(...lines.filter(line => line.includes('warning')).map(line => line.trim()));
    } else if (result.tool === 'django-migrations' && result.stdout) {
      if (result.stdout.includes('unapplied migration')) {
        warnings.push('There are unapplied migrations');
      }
    }
    
    return warnings;
  }
  
  _extractErrors(result) {
    const errors = [];
    
    if (!result.success) {
      if (result.stderr) errors.push(result.stderr);
      
      if (result.tool === 'spectral' && result.stdout) {
        const lines = result.stdout.split('\n');
        errors.push(...lines.filter(line => line.includes('error')).map(line => line.trim()));
      } else if (result.tool === 'django-migrations' && result.stdout) {
        if (result.stdout.includes('conflicting migrations')) {
          errors.push('Conflicting migrations detected');
        }
      }
    }
    
    return errors;
  }
  
}

module.exports = DataReporter;