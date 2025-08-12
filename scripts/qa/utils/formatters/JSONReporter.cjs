/**
 * JSONReporter - Single Responsibility: JSON report generation
 * Extracted from QALogger for SOLID compliance (RNF-001 ≤212 LOC)
 * 
 * Responsibilities:
 * - JSON report generation for CI/CD integration
 * - Structured report formatting
 * - File I/O operations for reports
 * - CI/CD compatible report structure
 */

const fs = require('fs');

class JSONReporter {
  constructor() {
    this.reportVersion = '0.1.0';
  }

  /**
   * Generate JSON report for CI/CD integration
   */
  async generateJSONReport(results, context = {}, startTime = Date.now()) {
    const timestamp = new Date().toISOString();
    
    const report = {
      metadata: {
        version: this.reportVersion,
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
        completionRate: this._calculateCompletionRate(results.summary),
        duration: Date.now() - startTime
      },
      dimensions: this._groupResultsByDimension(results.details || []),
      tools: this._groupResultsByTool(results.details || []),
      failures: this._extractFailures(results.details || []),
      warnings: this._extractWarnings(results.details || []),
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
   * Write JSON report to file
   */
  async writeJSONReport(report, filename = 'qa-report.json') {
    try {
      await fs.promises.writeFile(filename, JSON.stringify(report, null, 2));
      return { success: true, filename };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate and write JSON report in one operation
   */
  async generateAndWriteReport(results, filename, context = {}, startTime = Date.now()) {
    const report = await this.generateJSONReport(results, context, startTime);
    const writeResult = await this.writeJSONReport(report, filename);
    
    return {
      report,
      writeResult
    };
  }

  /**
   * Get overall status from summary
   */
  _getOverallStatus(summary) {
    if (summary.failed > 0) return 'failed';
    if (summary.warnings > 0) return 'warning';
    if (summary.passed > 0) return 'passed';
    return 'unknown';
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

module.exports = JSONReporter;