/**
 * ReportQueryOperations.cjs - Report Query and Management Operations  
 * Extracted exactly from FeedbackReportService.cjs lines 97-383
 * Conservative refactoring without adding new functionality
 */

const fs = require('fs').promises;
const path = require('path');

class ReportQueryOperations {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger || { info: () => {}, warn: () => {}, error: () => {} };
    this.baseReportsDir = path.join(process.cwd(), 'qa-reports', 'feedback');
    this.retentionDays = 30;
  }

  /**
   * List all feedback reports
   */
  async listReports(filters = {}) {
    try {
      const reportsDir = await this._ensureReportsDirectory();
      const files = await fs.readdir(reportsDir);
      
      const reports = [];
      for (const file of files) {
        if (file.endsWith('.md')) {
          const reportId = path.parse(file).name;
          const filePath = path.join(reportsDir, file);
          const stats = await fs.stat(filePath);
          
          // Try to read summary if exists
          let summary = null;
          try {
            const summaryPath = path.join(reportsDir, `${reportId}.summary.json`);
            const summaryContent = await fs.readFile(summaryPath, 'utf8');
            summary = JSON.parse(summaryContent);
          } catch (error) {
            // Summary doesn't exist or is invalid
          }
          
          const report = {
            reportId,
            fileName: file,
            filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            summary
          };
          
          // Apply filters
          if (this._matchesFilters(report, filters)) {
            reports.push(report);
          }
        }
      }
      
      // Sort by creation date (newest first)
      reports.sort((a, b) => b.created - a.created);
      
      return { success: true, reports, count: reports.length };
      
    } catch (error) {
      this.logger.error(`FeedbackReportService: Failed to list reports: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get specific report content
   */
  async getReport(reportId) {
    try {
      const filePath = path.join(this.baseReportsDir, `${reportId}.md`);
      const content = await fs.readFile(filePath, 'utf8');
      
      // Try to get summary
      let summary = null;
      try {
        const summaryPath = path.join(this.baseReportsDir, `${reportId}.summary.json`);
        const summaryContent = await fs.readFile(summaryPath, 'utf8');
        summary = JSON.parse(summaryContent);
      } catch (error) {
        // Summary doesn't exist
      }
      
      return {
        success: true,
        reportId,
        content,
        summary,
        filePath
      };
      
    } catch (error) {
      this.logger.error(`FeedbackReportService: Report ${reportId} not found`);
      return {
        success: false,
        error: `Report ${reportId} not found`
      };
    }
  }
  
  /**
   * Delete report and its summary
   */
  async deleteReport(reportId) {
    try {
      const reportPath = path.join(this.baseReportsDir, `${reportId}.md`);
      const summaryPath = path.join(this.baseReportsDir, `${reportId}.summary.json`);
      
      await fs.unlink(reportPath);
      
      // Delete summary if exists
      try {
        await fs.unlink(summaryPath);
      } catch (error) {
        // Summary might not exist, not critical
      }
      
      // Update reports index
      await this._removeFromReportsIndex(reportId);
      
      this.logger.info(`FeedbackReportService: Report ${reportId} deleted`);
      return { success: true };
      
    } catch (error) {
      this.logger.error(`FeedbackReportService: Failed to delete report: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Cleanup old reports based on retention policy
   */
  async cleanupOldReports() {
    try {
      const { reports } = await this.listReports();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
      
      let deletedCount = 0;
      for (const report of reports) {
        if (report.created < cutoffDate) {
          const result = await this.deleteReport(report.reportId);
          if (result.success) {
            deletedCount++;
          }
        }
      }
      
      this.logger.info(`FeedbackReportService: Cleaned up ${deletedCount} old reports`);
      return { success: true, deletedCount };
      
    } catch (error) {
      this.logger.error(`FeedbackReportService: Cleanup failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get service statistics
   */
  async getStats() {
    try {
      const { reports } = await this.listReports();
      const totalSize = reports.reduce((sum, report) => sum + report.size, 0);
      
      const toolStats = {};
      const dimensionStats = {};
      
      for (const report of reports) {
        if (report.summary) {
          const tool = report.summary.tool || 'unknown';
          const dimension = report.summary.dimension || 'unknown';
          
          toolStats[tool] = (toolStats[tool] || 0) + 1;
          dimensionStats[dimension] = (dimensionStats[dimension] || 0) + 1;
        }
      }
      
      return {
        totalReports: reports.length,
        totalSizeBytes: totalSize,
        reportsDirectory: this.baseReportsDir,
        retentionDays: this.retentionDays,
        toolBreakdown: toolStats,
        dimensionBreakdown: dimensionStats
      };
      
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Ensure reports directory exists
   */
  async _ensureReportsDirectory() {
    await fs.mkdir(this.baseReportsDir, { recursive: true });
    return this.baseReportsDir;
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
  
  /**
   * Check if report matches filters
   */
  _matchesFilters(report, filters) {
    if (filters.tool && report.summary?.tool !== filters.tool) {
      return false;
    }
    
    if (filters.dimension && report.summary?.dimension !== filters.dimension) {
      return false;
    }
    
    if (filters.fromDate && report.created < new Date(filters.fromDate)) {
      return false;
    }
    
    if (filters.toDate && report.created > new Date(filters.toDate)) {
      return false;
    }
    
    return true;
  }
}

module.exports = ReportQueryOperations;