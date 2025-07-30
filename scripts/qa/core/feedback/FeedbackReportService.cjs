/**
 * FeedbackReportService.cjs - Simple Coordinator for Report Operations
 * Conservative refactoring: only coordinates Storage + Query operations
 * Maintains exact same API as original 383-line version
 */

const ReportStorageOperations = require('./ReportStorageOperations.cjs');
const ReportQueryOperations = require('./ReportQueryOperations.cjs');

class FeedbackReportService {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger || { info: () => {}, warn: () => {}, error: () => {} };
    
    // Simple composition without over-engineering
    this.storageOps = new ReportStorageOperations(config, logger);
    this.queryOps = new ReportQueryOperations(config, logger);
  }
  
  /**
   * Save issue report locally (delegates to storage operations)
   */
  async saveIssueReportLocally(issueBody, context = {}) {
    return await this.storageOps.saveIssueReportLocally(issueBody, context);
  }
  
  /**
   * Create issue summary (delegates to storage operations)
   */
  async createIssueSummary(reportId, context) {
    return await this.storageOps.createIssueSummary(reportId, context);
  }
  
  /**
   * List all feedback reports (delegates to query operations)
   */
  async listReports(filters = {}) {
    return await this.queryOps.listReports(filters);
  }
  
  /**
   * Get specific report (delegates to query operations)
   */
  async getReport(reportId) {
    return await this.queryOps.getReport(reportId);
  }
  
  /**
   * Delete report (delegates to query operations)
   */
  async deleteReport(reportId) {
    return await this.queryOps.deleteReport(reportId);
  }
  
  /**
   * Cleanup old reports (delegates to query operations)
   */
  async cleanupOldReports() {
    return await this.queryOps.cleanupOldReports();
  }
  
  /**
   * Get service statistics (delegates to query operations)
   */
  async getStats() {
    return await this.queryOps.getStats();
  }
}

module.exports = FeedbackReportService;