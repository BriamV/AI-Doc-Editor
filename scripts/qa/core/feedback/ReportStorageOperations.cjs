/**
 * ReportStorageOperations.cjs - Report Storage Operations
 * Extracted exactly from FeedbackReportService.cjs lines 24-92 + helpers
 * Conservative refactoring without adding new functionality
 */

const fs = require('fs').promises;
const path = require('path');

class ReportStorageOperations {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger || { info: () => {}, warn: () => {}, error: () => {} };
    this.baseReportsDir = path.join(process.cwd(), 'qa-reports', 'feedback');
  }

  /**
   * Save issue report locally with systematic organization
   */
  async saveIssueReportLocally(issueBody, context = {}) {
    try {
      this.logger.info('FeedbackReportService: Saving issue report locally...');
      
      // Generate unique report ID
      const reportId = this._generateReportId(context);
      
      // Ensure reports directory exists
      const reportsDir = await this._ensureReportsDirectory();
      
      // Generate report file path
      const fileName = `${reportId}.md`;
      const filePath = path.join(reportsDir, fileName);
      
      // Prepare report content with metadata
      const reportContent = this._prepareReportContent(issueBody, context, reportId);
      
      // Save report to file
      await fs.writeFile(filePath, reportContent, 'utf8');
      
      // Update reports index
      await this._updateReportsIndex(reportId, context, filePath);
      
      this.logger.info(`FeedbackReportService: Report saved as ${fileName}`);
      
      return {
        success: true,
        reportId,
        filePath,
        reportsDir,
        fileName
      };
      
    } catch (error) {
      this.logger.error(`FeedbackReportService: Failed to save report: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Create issue summary for quick reference
   */
  async createIssueSummary(reportId, context) {
    try {
      const summary = {
        reportId,
        timestamp: new Date().toISOString(),
        tool: context.failedTool || 'unknown',
        dimension: context.toolDimension || 'general',
        mode: context.mode || 'automatic',
        platform: context.platform || process.platform,
        errorType: context.errorType || 'unknown',
        status: 'generated'
      };
      
      const summaryPath = path.join(this.baseReportsDir, `${reportId}.summary.json`);
      await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
      
      this.logger.info(`FeedbackReportService: Summary created for ${reportId}`);
      return { success: true, summary, summaryPath };
      
    } catch (error) {
      this.logger.error(`FeedbackReportService: Failed to create summary: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate unique report ID
   */
  _generateReportId(context) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const tool = (context.failedTool || 'qa').toLowerCase().replace(/[^a-z0-9]/g, '');
    const random = Math.random().toString(36).substring(2, 6);
    
    return `${timestamp}-${tool}-${random}`;
  }
  
  /**
   * Ensure reports directory exists
   */
  async _ensureReportsDirectory() {
    await fs.mkdir(this.baseReportsDir, { recursive: true });
    return this.baseReportsDir;
  }
  
  /**
   * Prepare report content with metadata
   */
  _prepareReportContent(issueBody, context, reportId) {
    const metadata = `---
Report ID: ${reportId}
Generated: ${new Date().toISOString()}
Tool: ${context.failedTool || 'unknown'}
Dimension: ${context.toolDimension || 'general'}
Mode: ${context.mode || 'automatic'}
Platform: ${context.platform || process.platform}
QA Version: ${context.qaVersion || '0.1.0'}
---

`;
    
    return metadata + issueBody;
  }
  
  /**
   * Update reports index file
   */
  async _updateReportsIndex(reportId, context, filePath) {
    try {
      const indexPath = path.join(this.baseReportsDir, 'reports-index.json');
      
      let index = { reports: [], lastUpdated: null };
      try {
        const indexContent = await fs.readFile(indexPath, 'utf8');
        index = JSON.parse(indexContent);
      } catch (error) {
        // Index doesn't exist yet
      }
      
      index.reports.push({
        reportId,
        timestamp: new Date().toISOString(),
        tool: context.failedTool || 'unknown',
        filePath
      });
      
      index.lastUpdated = new Date().toISOString();
      
      await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf8');
    } catch (error) {
      this.logger.warn(`FeedbackReportService: Failed to update index: ${error.message}`);
    }
  }

  /**
   * Remove report from index
   */
  async _removeFromReportsIndex(reportId) {
    try {
      const indexPath = path.join(this.baseReportsDir, 'reports-index.json');
      const indexContent = await fs.readFile(indexPath, 'utf8');
      const index = JSON.parse(indexContent);
      
      index.reports = index.reports.filter(report => report.reportId !== reportId);
      index.lastUpdated = new Date().toISOString();
      
      await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf8');
    } catch (error) {
      this.logger.warn(`FeedbackReportService: Failed to remove from index: ${error.message}`);
    }
  }
}

module.exports = ReportStorageOperations;