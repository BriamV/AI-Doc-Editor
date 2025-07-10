/**
 * Result Aggregator - Single Responsibility: Aggregate and format results
 * Extracted from WrapperCoordinator for SOLID compliance
 */

class ResultAggregator {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }
  
  /**
   * Aggregate results from all tools
   */
  aggregateResults(results, executionTime) {
    const aggregated = {
      summary: {
        total: results.length,
        passed: 0,
        failed: 0,
        warnings: 0,
        executionTime: executionTime
      },
      details: [],
      metrics: {},
      recommendations: []
    };
    
    for (const result of results) {
      this._processResult(result, aggregated);
    }
    
    // Generate recommendations
    aggregated.recommendations = this._generateRecommendations(aggregated);
    
    return aggregated;
  }
  
  /**
   * Process individual result
   */
  _processResult(result, aggregated) {
    if (result.success) {
      aggregated.summary.passed++;
      
      // Process successful result
      if (result.result && result.result.warnings) {
        aggregated.summary.warnings += result.result.warnings.length;
      }
      
      if (result.result && result.result.metrics) {
        aggregated.metrics[result.tool.name] = result.result.metrics;
      }
      
    } else {
      aggregated.summary.failed++;
    }
    
    aggregated.details.push({
      tool: result.tool.name,
      dimension: result.tool.dimension,
      success: result.success,
      error: result.error,
      executionTime: result.executionTime,
      result: result.result
    });
  }
  
  /**
   * Generate recommendations based on results
   */
  _generateRecommendations(results) {
    const recommendations = [];
    
    if (results.summary.failed > 0) {
      recommendations.push(`${results.summary.failed} tools failed - review error details`);
    }
    
    if (results.summary.warnings > 0) {
      recommendations.push(`${results.summary.warnings} warnings found - consider addressing`);
    }
    
    if (results.summary.executionTime > 60000) { // > 1 minute
      recommendations.push('Consider using --fast mode for quicker feedback');
    }
    
    return recommendations;
  }
  
  /**
   * Format results for specific output format
   */
  formatResults(results, format = 'json') {
    switch (format) {
      case 'json':
        return JSON.stringify(results, null, 2);
      case 'summary':
        return this._formatSummary(results);
      case 'detailed':
        return this._formatDetailed(results);
      default:
        return results;
    }
  }
  
  /**
   * Format summary output
   */
  _formatSummary(results) {
    const { summary } = results;
    return `Summary: ${summary.passed}/${summary.total} passed, ${summary.warnings} warnings, ${Math.round(summary.executionTime)}ms`;
  }
  
  /**
   * Format detailed output
   */
  _formatDetailed(results) {
    const lines = [`Summary: ${results.summary.passed}/${results.summary.total} passed`];
    
    for (const detail of results.details) {
      const status = detail.success ? '✅' : '❌';
      lines.push(`${status} ${detail.tool} (${detail.dimension}): ${Math.round(detail.executionTime)}ms`);
    }
    
    return lines.join('\n');
  }
}

module.exports = ResultAggregator;