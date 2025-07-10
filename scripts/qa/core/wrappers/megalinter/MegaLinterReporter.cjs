/**
 * MegaLinter Reporter - Single Responsibility: Result processing and RF-006 formatting
 * Extracted from MegaLinterWrapper for SOLID compliance
 */

const { promises: fs } = require('fs');
const path = require('path');

class MegaLinterReporter {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }
  
  /**
   * Process MegaLinter results according to RF-006
   */
  async processResults(execution, tool, megalinterConfig) {
    const { exitCode, stdout, stderr } = execution;
    
    const results = {
      success: exitCode === 0,
      data: {},
      reports: [],
      metrics: {},
      warnings: [],
      errors: []
    };
    
    // Process stdout
    if (stdout) {
      results.data.stdout = stdout;
      this._extractMetrics(stdout, results);
      this._extractWarnings(stdout, results);
    }
    
    // Process stderr
    if (stderr && stderr.trim()) {
      results.data.stderr = stderr;
      results.errors.push(stderr);
    }
    
    // Read reports
    await this._readJsonReport(results, megalinterConfig);
    await this._readSarifReport(results, megalinterConfig);
    
    // Apply RF-006 formatting
    results.formatted = this._formatResults(results, tool);
    
    return results;
  }
  
  /**
   * Extract metrics from stdout
   */
  _extractMetrics(stdout, results) {
    const metricsMatch = stdout.match(/║\s*(\d+)\s*linter\(s\)\s*found\s*(\d+)\s*error\(s\)/);
    if (metricsMatch) {
      results.metrics.linters = parseInt(metricsMatch[1]);
      results.metrics.errors = parseInt(metricsMatch[2]);
    }
  }
  
  /**
   * Extract warnings from stdout
   */
  _extractWarnings(stdout, results) {
    const warningMatches = stdout.match(/⚠️[^\n]+/g);
    if (warningMatches) {
      results.warnings = warningMatches.map(w => w.replace(/⚠️\s*/, ''));
    }
  }
  
  /**
   * Read JSON report
   */
  async _readJsonReport(results, megalinterConfig) {
    try {
      const jsonReportPath = path.join(
        process.cwd(),
        megalinterConfig.settings.reportFolder,
        'megalinter-report.json'
      );
      
      if (await this._fileExists(jsonReportPath)) {
        const jsonReport = JSON.parse(await fs.readFile(jsonReportPath, 'utf8'));
        results.data.jsonReport = jsonReport;
        results.reports.push({
          type: 'json',
          path: jsonReportPath,
          data: jsonReport
        });
        
        // Extract detailed metrics
        if (jsonReport.summary) {
          results.metrics = { ...results.metrics, ...jsonReport.summary };
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to read JSON report: ${error.message}`);
    }
  }
  
  /**
   * Read SARIF report
   */
  async _readSarifReport(results, megalinterConfig) {
    try {
      const sarifReportPath = path.join(
        process.cwd(),
        megalinterConfig.settings.reportFolder,
        'megalinter-report.sarif'
      );
      
      if (await this._fileExists(sarifReportPath)) {
        const sarifReport = JSON.parse(await fs.readFile(sarifReportPath, 'utf8'));
        results.reports.push({
          type: 'sarif',
          path: sarifReportPath,
          data: sarifReport
        });
      }
    } catch (error) {
      this.logger.warn(`Failed to read SARIF report: ${error.message}`);
    }
  }
  
  /**
   * Format results according to RF-006
   */
  _formatResults(results, tool) {
    return {
      tool: tool.name,
      dimension: tool.dimension,
      status: results.success ? 'PASSED' : 'FAILED',
      summary: {
        errors: results.metrics.errors || 0,
        warnings: results.warnings.length || 0,
        linters: results.metrics.linters || 0
      },
      details: this._buildDetails(results),
      metrics: results.metrics
    };
  }
  
  /**
   * Build details section
   */
  _buildDetails(results) {
    const details = [];
    
    if (results.errors.length > 0) {
      details.push({
        level: 'error',
        items: results.errors
      });
    }
    
    if (results.warnings.length > 0) {
      details.push({
        level: 'warning',
        items: results.warnings
      });
    }
    
    return details;
  }
  
  /**
   * Check if file exists
   */
  async _fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = MegaLinterReporter;