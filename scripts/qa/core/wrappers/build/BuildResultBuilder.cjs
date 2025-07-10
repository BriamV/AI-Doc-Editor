/**
 * BuildResultBuilder.cjs - Build Results Aggregation and Response Building
 * T-11: Builds standardized response for build validation results
 * 
 * Single Responsibility: Response building and aggregation
 * Open/Closed: Extensible for new response formats
 * Dependencies: Inverted through constructor injection
 */

class BuildResultBuilder {
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
   * Build standardized response for build validation
   */
  buildResponse(processedResults, toolConfigs = []) {
    // Fix 3.1: Enhanced aggregation logic with clear tool separation
    const toolNames = [...new Set(processedResults.map(r => r.tool))].join(', ');
    
    const response = {
      success: this._determineOverallSuccess(processedResults),
      tool: toolNames.length > 10 ? 'build-multi' : toolNames, // Fix 3.1: Indicate multiple tools
      dimension: 'build',
      executionTime: this._calculateTotalExecutionTime(processedResults),
      results: {
        summary: this._buildSummary(processedResults),
        details: this._buildDetails(processedResults),
        metrics: this._buildMetrics(processedResults)
      },
      warnings: this._aggregateWarnings(processedResults),
      errors: this._aggregateErrors(processedResults),
      status: this._determineOverallStatus(processedResults),
      timestamp: new Date().toISOString(),
      // Fix 3.1: Add metadata for clarity
      metadata: {
        toolsExecuted: [...new Set(processedResults.map(r => r.tool))],
        totalTools: new Set(processedResults.map(r => r.tool)).size,
        aggregationType: 'multi-tool-wrapper'
      }
    };
    
    return response;
  }
  
  /**
   * Build summary section
   */
  _buildSummary(processedResults) {
    // Fix 3.1: Store current results for message generation
    this.currentResults = processedResults;
    
    const toolCount = new Set(processedResults.map(r => r.tool)).size;
    const passed = processedResults.filter(r => r.status === 'passed').length;
    const failed = processedResults.filter(r => r.status === 'failed').length;
    const warnings = processedResults.filter(r => r.status === 'warning').length;
    
    // Fix 3.1: Enhanced summary with per-tool breakdown
    const toolBreakdown = {};
    for (const result of processedResults) {
      if (!toolBreakdown[result.tool]) {
        toolBreakdown[result.tool] = { passed: 0, failed: 0, warnings: 0 };
      }
      if (result.status === 'passed') toolBreakdown[result.tool].passed++;
      else if (result.status === 'failed') toolBreakdown[result.tool].failed++;
      else if (result.status === 'warning') toolBreakdown[result.tool].warnings++;
    }
    
    return {
      total: processedResults.length,
      tools: toolCount,
      passed: passed,
      failed: failed,
      warnings: warnings,
      message: this._generateSummaryMessage(passed, failed, warnings, processedResults.length),
      // Fix 3.1: Add per-tool breakdown for clarity
      toolBreakdown: toolBreakdown
    };
  }
  
  /**
   * Build details section
   */
  _buildDetails(processedResults) {
    const details = {
      tools: {},
      execution: {
        totalTime: this._calculateTotalExecutionTime(processedResults),
        averageTime: this._calculateAverageExecutionTime(processedResults),
        slowestTool: this._findSlowestTool(processedResults),
        fastestTool: this._findFastestTool(processedResults)
      }
    };
    
    // Group results by tool
    for (const result of processedResults) {
      if (!details.tools[result.tool]) {
        details.tools[result.tool] = [];
      }
      
      details.tools[result.tool].push({
        action: result.action,
        status: result.status,
        executionTime: result.executionTime,
        summary: result.summary,
        details: result.details
      });
    }
    
    return details;
  }
  
  /**
   * Build metrics section
   */
  _buildMetrics(processedResults) {
    const metrics = {
      performance: {
        totalExecutionTime: this._calculateTotalExecutionTime(processedResults),
        averageExecutionTime: this._calculateAverageExecutionTime(processedResults),
        executionTimeByTool: this._calculateExecutionTimeByTool(processedResults)
      },
      quality: {
        successRate: this._calculateSuccessRate(processedResults),
        warningRate: this._calculateWarningRate(processedResults),
        errorRate: this._calculateErrorRate(processedResults)
      },
      coverage: {
        toolsCovered: new Set(processedResults.map(r => r.tool)).size,
        actionsCovered: processedResults.length,
        scopesCovered: this._calculateScopesCovered(processedResults)
      }
    };
    
    return metrics;
  }
  
  /**
   * Aggregate warnings from all results
   */
  _aggregateWarnings(processedResults) {
    const warnings = [];
    
    for (const result of processedResults) {
      if (result.warnings && result.warnings.length > 0) {
        warnings.push(...result.warnings.map(warning => ({
          tool: result.tool,
          action: result.action,
          message: warning
        })));
      }
    }
    
    return warnings;
  }
  
  /**
   * Aggregate errors from all results
   */
  _aggregateErrors(processedResults) {
    const errors = [];
    
    for (const result of processedResults) {
      if (result.errors && result.errors.length > 0) {
        errors.push(...result.errors.map(error => ({
          tool: result.tool,
          action: result.action,
          message: error
        })));
      }
    }
    
    return errors;
  }
  
  /**
   * Helper methods
   */
  _determineOverallSuccess(processedResults) {
    // Align with status determination logic: success if no failures or errors
    const overallStatus = this._determineOverallStatus(processedResults);
    return overallStatus === 'passed' || overallStatus === 'warning';
  }
  
  _determineOverallStatus(processedResults) {
    const statuses = processedResults.map(r => r.status);
    return statuses.reduce((highest, current) => {
      return this.statusHierarchy[current] > this.statusHierarchy[highest] ? current : highest;
    }, 'passed');
  }
  
  _calculateTotalExecutionTime(processedResults) {
    return processedResults.reduce((sum, result) => sum + result.executionTime, 0);
  }
  
  _calculateAverageExecutionTime(processedResults) {
    if (processedResults.length === 0) return 0;
    return Math.round(this._calculateTotalExecutionTime(processedResults) / processedResults.length);
  }
  
  _findSlowestTool(processedResults) {
    if (processedResults.length === 0) return null;
    return processedResults.reduce((slowest, current) => 
      current.executionTime > slowest.executionTime ? current : slowest
    );
  }
  
  _findFastestTool(processedResults) {
    if (processedResults.length === 0) return null;
    return processedResults.reduce((fastest, current) => 
      current.executionTime < fastest.executionTime ? current : fastest
    );
  }
  
  _calculateExecutionTimeByTool(processedResults) {
    const timeByTool = {};
    
    for (const result of processedResults) {
      if (!timeByTool[result.tool]) {
        timeByTool[result.tool] = 0;
      }
      timeByTool[result.tool] += result.executionTime;
    }
    
    return timeByTool;
  }
  
  _calculateSuccessRate(processedResults) {
    if (processedResults.length === 0) return 0;
    const successful = processedResults.filter(r => r.status === 'passed').length;
    return Math.round((successful / processedResults.length) * 100);
  }
  
  _calculateWarningRate(processedResults) {
    if (processedResults.length === 0) return 0;
    const warnings = processedResults.filter(r => r.status === 'warning').length;
    return Math.round((warnings / processedResults.length) * 100);
  }
  
  _calculateErrorRate(processedResults) {
    if (processedResults.length === 0) return 0;
    const errors = processedResults.filter(r => r.status === 'failed').length;
    return Math.round((errors / processedResults.length) * 100);
  }
  
  _calculateScopesCovered(processedResults) {
    // This would need scope information from the processed results
    return 1; // Default to 1 scope for now
  }
  
  _generateSummaryMessage(passed, failed, warnings, total) {
    // Fix 3.3: Enhanced summary messages with tool awareness
    const toolCount = new Set(this.currentResults?.map(r => r.tool) || []).size;
    const toolText = toolCount > 1 ? `${toolCount} tools` : 'tool';
    
    if (failed > 0) {
      return `${failed} of ${total} validations failed across ${toolText}`;
    } else if (warnings > 0) {
      return `${total} validations completed with ${warnings} warnings across ${toolText}`;
    } else {
      return `All ${total} validations passed successfully across ${toolText}`;
    }
  }
}

module.exports = BuildResultBuilder;