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
   * Aggregate results from all tools (RF-006 Enhanced)
   */
  aggregateResults(results, executionTime) {
    const aggregated = {
      summary: {
        total: 0, // CRITICAL FIX: Will be calculated from actual checks
        passed: 0,
        failed: 0,
        warnings: 0,
        executionTime: executionTime,
        filesWithProblems: [] // NEW: Track files with specific problems for actionable summary
      },
      details: [],
      metrics: {},
      recommendations: []
    };
    
    // Track files with violations across all tools
    const fileViolations = new Map(); // filePath -> { errors: count, warnings: count }
    
    for (const result of results) {
      this._processResult(result, aggregated, fileViolations);
    }
    
    // CRITICAL FIX: Calculate total from actual file checks, not just tool count
    aggregated.summary.total = results.reduce((sum, result) => {
      // Count files processed by each tool as individual checks
      const filesProcessed = result.result?.metadata?.filesProcessed || 
                            result.metadata?.filesProcessed || 
                            (result.result?.violations?.length > 0 ? 1 : 0);
      return sum + filesProcessed;
    }, 0);
    
    // Convert file violations map to array for summary display
    aggregated.summary.filesWithProblems = Array.from(fileViolations.entries())
      .filter(([file, stats]) => stats.errors > 0 || stats.warnings > 0)
      .map(([file, stats]) => ({ file, ...stats }))
      .sort((a, b) => {
        // Sort by errors first (desc), then warnings (desc), then filename
        if (a.errors !== b.errors) return b.errors - a.errors;
        if (a.warnings !== b.warnings) return b.warnings - a.warnings;
        return a.file.localeCompare(b.file);
      });
    
    // Generate recommendations
    aggregated.recommendations = this._generateRecommendations(aggregated);
    
    return aggregated;
  }
  
  /**
   * Process individual result (RF-006 Enhanced)
   * CRITICAL FIX RF-003: Remove double-counting, properly handle success/failure states
   */
  _processResult(result, aggregated, fileViolations) {
    // Handle tri-state model: SUCCESS, SUCCESS+WARNING, FAILED
    const isEmptyTestSuite = result.emptyTestSuite || false;
    const hasWarningLevel = result.level === 'WARNING';
    
    if (result.success) {
      // SUCCESS: Tool executed without errors
      aggregated.summary.passed++;
      
      // Process warnings from successful executions
      if (result.result && result.result.violations) {
        // Count violations by severity - but only warnings for successful results
        for (const violation of result.result.violations) {
          if (violation.severity === 'warning') {
            aggregated.summary.warnings++;
            // Track file-level violations for detailed summary
            this._trackFileViolation(violation, 'warning', fileViolations);
          }
          // NOTE: severity "error" violations should not occur in successful results
          // If they do, it indicates a bug in the wrapper's success determination
        }
      }
      
      // Legacy support: Process warnings array
      if (result.result && result.result.warnings) {
        aggregated.summary.warnings += result.result.warnings.length;
      }
      
      // Count empty test suites as warnings
      if (isEmptyTestSuite || hasWarningLevel) {
        aggregated.summary.warnings++;
      }
      
    } else {
      // FAILED: Tool failed or found critical errors
      aggregated.summary.failed++;
      
      // Failed results can still have detailed violation information
      if (result.result && result.result.violations) {
        // Count additional warnings from failed results (for metrics)
        for (const violation of result.result.violations) {
          if (violation.severity === 'warning') {
            aggregated.summary.warnings++;
            this._trackFileViolation(violation, 'warning', fileViolations);
          } else if (violation.severity === 'error') {
            // Track error-level violations for detailed summary
            this._trackFileViolation(violation, 'error', fileViolations);
          }
        }
      }
    }
    
    // Fix: Handle both string and object formats for tool and dimension
    const toolName = typeof result.tool === 'string' ? result.tool : result.tool?.name;
    const dimensionName = typeof result.dimension === 'string' ? result.dimension : result.tool?.dimension;
    
    // Handle metrics from both successful and failed results
    if (result.result && result.result.metrics && toolName) {
      aggregated.metrics[toolName] = result.result.metrics;
    }
    
    aggregated.details.push({
      tool: toolName,
      dimension: dimensionName,
      success: result.success,
      error: result.error,
      executionTime: result.executionTime,
      result: result.result,
      // MODERATE ISSUE FIX RF-003.5: Include enhanced status information
      status: result.status || (result.success ? 'SUCCESS' : 'FAILED'),
      level: result.level || 'INFO',
      emptyTestSuite: result.emptyTestSuite || false
    });
  }
  
  /**
   * Track file-level violations for detailed summary
   */
  _trackFileViolation(violation, severity, fileViolations) {
    const filePath = violation.file || 'unknown';
    if (!fileViolations.has(filePath)) {
      fileViolations.set(filePath, { errors: 0, warnings: 0 });
    }
    
    const fileStats = fileViolations.get(filePath);
    if (severity === 'error') {
      fileStats.errors++;
    } else if (severity === 'warning') {
      fileStats.warnings++;
    }
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
   * Generate JSON report for CI/CD integration (RF-006, Release 0.4.0)
   * Creates structured report compatible with GitHub Actions and other CI systems
   */
  generateJSONReport(results, context = {}) {
    const timestamp = new Date().toISOString();
    const report = {
      metadata: {
        version: "0.1.0",
        timestamp: timestamp,
        system: "QA System - AI-Doc-Editor",
        context: {
          branch: context.branch || 'unknown',
          commit: context.commit || 'unknown',
          environment: context.environment || 'unknown',
          mode: context.mode || 'automatic',
          scope: context.scope || 'all'
        }
      },
      summary: {
        ...results.summary,
        status: this._getOverallStatus(results.summary),
        completionRate: this._calculateCompletionRate(results.summary)
      },
      dimensions: this._groupResultsByDimension(results.details),
      tools: this._groupResultsByTool(results.details),
      failures: this._extractFailures(results.details),
      warnings: this._extractWarnings(results.details),
      recommendations: results.recommendations || [],
      artifacts: {
        logFile: context.logFile || null,
        reportPath: context.reportPath || null,
        reportsDir: context.reportsDir || null
      }
    };
    
    return report;
  }

  /**
   * Format results for specific output format
   */
  formatResults(results, format = 'json') {
    switch (format) {
      case 'json':
        return JSON.stringify(results, null, 2);
      case 'ci-json':
        return JSON.stringify(this.generateJSONReport(results), null, 2);
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

  /**
   * Get overall status from summary
   * MODERATE ISSUE FIX RF-003.5: Enhanced status logic with proper exit codes
   */
  _getOverallStatus(summary) {
    if (summary.failed > 0) return 'failed';
    if (summary.warnings > 0) return 'warning';
    if (summary.passed > 0) return 'passed';
    return 'unknown';
  }
  
  /**
   * MODERATE ISSUE FIX RF-003.5: Get exit code for CI/CD integration
   * Industry standard: 0 for success/warnings, 1 for failures
   */
  getExitCode(summary) {
    // Exit code 0: Success or warnings (empty test suites)
    // Exit code 1: Failures or errors
    return summary.failed > 0 ? 1 : 0;
  }

  /**
   * Calculate completion rate
   */
  _calculateCompletionRate(summary) {
    if (summary.total === 0) return 0;
    return Math.round((summary.passed / summary.total) * 100);
  }

  /**
   * Group results by dimension
   */
  _groupResultsByDimension(details) {
    const grouped = {};
    for (const detail of details) {
      const dimension = detail.dimension || 'unknown';
      if (!grouped[dimension]) {
        grouped[dimension] = {
          tools: [],
          passed: 0,
          failed: 0,
          totalTime: 0
        };
      }
      
      grouped[dimension].tools.push({
        name: detail.tool,
        success: detail.success,
        executionTime: detail.executionTime || 0,
        error: detail.error
      });
      
      if (detail.success) {
        grouped[dimension].passed++;
      } else {
        grouped[dimension].failed++;
      }
      
      grouped[dimension].totalTime += detail.executionTime || 0;
    }
    
    return grouped;
  }

  /**
   * Group results by tool
   */
  _groupResultsByTool(details) {
    const grouped = {};
    for (const detail of details) {
      const tool = detail.tool || 'unknown';
      if (!grouped[tool]) {
        grouped[tool] = {
          dimension: detail.dimension,
          success: detail.success,
          executionTime: detail.executionTime || 0,
          error: detail.error,
          result: detail.result
        };
      }
    }
    
    return grouped;
  }

  /**
   * Extract failures for detailed reporting
   */
  _extractFailures(details) {
    return details
      .filter(detail => !detail.success)
      .map(detail => ({
        tool: detail.tool,
        dimension: detail.dimension,
        error: detail.error,
        executionTime: detail.executionTime
      }));
  }

  /**
   * Extract warnings for detailed reporting
   */
  _extractWarnings(details) {
    const warnings = [];
    for (const detail of details) {
      if (detail.result && detail.result.warnings) {
        for (const warning of detail.result.warnings) {
          warnings.push({
            tool: detail.tool,
            dimension: detail.dimension,
            message: warning.message || warning,
            file: warning.file,
            line: warning.line
          });
        }
      }
    }
    
    return warnings;
  }
}

module.exports = ResultAggregator;