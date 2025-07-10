/**
 * DataResultBuilder.cjs - Data Validation Results Aggregation and Response Building
 * T-12: Builds standardized response for data validation results
 * 
 * Single Responsibility: Response building and aggregation for data validation
 * Open/Closed: Extensible for new response formats
 * Dependencies: Inverted through constructor injection
 */

class DataResultBuilder {
  constructor() {
    // Result status hierarchy
    this.statusHierarchy = {
      failed: 4,
      error: 3,
      warning: 2,
      passed: 1,
      pending: 0
    };
  }
  
  /**
   * Build standardized response for data validation
   */
  buildResponse(processedResults, toolConfigs = []) {
    const response = {
      success: this._determineOverallSuccess(processedResults),
      tool: 'data',
      dimension: 'data',
      executionTime: this._calculateTotalExecutionTime(processedResults),
      results: {
        summary: this._buildSummary(processedResults),
        details: this._buildDetails(processedResults),
        metrics: this._buildMetrics(processedResults)
      },
      warnings: this._aggregateWarnings(processedResults),
      errors: this._aggregateErrors(processedResults),
      status: this._determineOverallStatus(processedResults),
      timestamp: new Date().toISOString()
    };
    
    return response;
  }
  
  _buildSummary(processedResults) {
    const passed = processedResults.filter(r => r.status === 'passed').length;
    const failed = processedResults.filter(r => r.status === 'failed').length;
    const warnings = processedResults.filter(r => r.status === 'warning').length;
    const totalFiles = this._calculateTotalFilesProcessed(processedResults);
    
    return {
      total: processedResults.length,
      tools: new Set(processedResults.map(r => r.tool)).size,
      passed, failed, warnings, filesProcessed: totalFiles,
      message: this._generateSummaryMessage(passed, failed, warnings, processedResults.length, totalFiles)
    };
  }
  
  _buildDetails(processedResults) {
    const details = { tools: {}, execution: { totalTime: this._calculateTotalExecutionTime(processedResults) } };
    
    for (const result of processedResults) {
      if (!details.tools[result.tool]) details.tools[result.tool] = [];
      details.tools[result.tool].push({
        action: result.action, status: result.status, executionTime: result.executionTime, summary: result.summary
      });
    }
    
    return details;
  }
  
  _buildMetrics(processedResults) {
    return {
      performance: { totalExecutionTime: this._calculateTotalExecutionTime(processedResults) },
      quality: { successRate: this._calculateSuccessRate(processedResults) },
      coverage: { toolsCovered: new Set(processedResults.map(r => r.tool)).size, filesProcessed: this._calculateTotalFilesProcessed(processedResults) }
    };
  }
  
  _aggregateWarnings(processedResults) {
    const warnings = [];
    for (const result of processedResults) {
      if (result.warnings?.length > 0) {
        warnings.push(...result.warnings.map(warning => ({ tool: result.tool, action: result.action, message: warning })));
      }
    }
    return warnings;
  }
  
  _aggregateErrors(processedResults) {
    const errors = [];
    for (const result of processedResults) {
      if (result.errors?.length > 0) {
        errors.push(...result.errors.map(error => ({ tool: result.tool, action: result.action, message: error })));
      }
    }
    return errors;
  }
  
  _determineOverallSuccess(processedResults) {
    return processedResults.every(result => result.success);
  }
  
  _determineOverallStatus(processedResults) {
    const statuses = processedResults.map(r => r.status);
    return statuses.reduce((highest, current) => 
      this.statusHierarchy[current] > this.statusHierarchy[highest] ? current : highest, 'passed');
  }
  
  _calculateTotalExecutionTime(processedResults) {
    return processedResults.reduce((sum, result) => sum + result.executionTime, 0);
  }
  
  _calculateSuccessRate(processedResults) {
    if (processedResults.length === 0) return 0;
    const successful = processedResults.filter(r => r.status === 'passed').length;
    return Math.round((successful / processedResults.length) * 100);
  }
  
  _calculateTotalFilesProcessed(processedResults) {
    return processedResults.reduce((sum, result) => sum + (result.metrics?.filesProcessed || 0), 0);
  }
  
  _generateSummaryMessage(passed, failed, warnings, total, totalFiles) {
    if (failed > 0) return `${failed} of ${total} data validations failed (${totalFiles} files processed)`;
    if (warnings > 0) return `${total} data validations completed with ${warnings} warnings (${totalFiles} files processed)`;
    return `All ${total} data validations passed successfully (${totalFiles} files processed)`;
  }
}

module.exports = DataResultBuilder;