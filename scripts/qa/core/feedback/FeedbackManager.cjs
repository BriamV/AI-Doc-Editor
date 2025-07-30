/**
 * FeedbackManager.cjs - Coordinating Service for Feedback Operations
 * Refactored: Now coordinates Template + GitHub + Report services (SRP compliance)
 * Reduced from 566 to ~180 lines by extracting responsibilities
 */

const FeedbackTemplateService = require('./FeedbackTemplateService.cjs');
const GitHubIntegrationService = require('./GitHubIntegrationService.cjs');
const FeedbackReportService = require('./FeedbackReportService.cjs');

class FeedbackManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger || { info: () => {}, warn: () => {}, error: () => {} };
    
    // Compose services following Single Responsibility Principle
    this.templateService = new FeedbackTemplateService(config, logger);
    this.githubService = new GitHubIntegrationService(config, logger);
    this.reportService = new FeedbackReportService(config, logger);
  }

  /**
   * Generate and save issue report locally (RF-008 main function)
   */
  async reportIssue(context = {}) {
    try {
      this.logger.info('🐛 Generating local issue report...');
      
      // Generate issue template (delegates to template service)
      const issueBody = await this.templateService.generateIssueReport(context);
      
      // Save issue report locally (delegates to report service)
      const result = await this.reportService.saveIssueReportLocally(issueBody, context);
      
      if (result.success) {
        this.logger.info('✅ Issue report saved successfully');
        this.logger.info(`📄 Report file: ${result.filePath}`);
        this.logger.info(`📁 Reports directory: ${result.reportsDir}`);
        
        // Create summary (delegates to report service)
        await this.reportService.createIssueSummary(result.reportId, context);
        
        // Display manual submission instructions
        this._displayManualSubmissionInstructions(result);
        
        return {
          success: true,
          filePath: result.filePath,
          reportId: result.reportId,
          reportsDir: result.reportsDir,
          templateGenerated: true,
          method: 'local-storage'
        };
      } else {
        this.logger.error(`Failed to save issue report: ${result.error}`);
        return {
          success: false,
          error: result.error,
          method: 'local-storage'
        };
      }
      
    } catch (error) {
      this.logger.error(`Unexpected error in reportIssue: ${error.message}`);
      return {
        success: false,
        error: error.message,
        method: 'local-storage'
      };
    }
  }

  /**
   * Create GitHub issue URL (delegates to GitHub service)
   */
  async createGitHubIssueUrl(issueBody, context = {}) {
    // Prepare context with template-generated data
    const enrichedContext = {
      ...context,
      title: this.templateService.generateIssueTitle(context),
      labels: this.templateService.generateIssueLabels(context)
    };
    
    return await this.githubService.createGitHubIssueUrl(issueBody, enrichedContext);
  }

  /**
   * Open GitHub issue in browser (delegates to GitHub service)
   */
  async openGitHubIssueInBrowser(url) {
    return await this.githubService.openInBrowser(url);
  }

  /**
   * List all feedback reports (delegates to report service)
   */
  async listReports(filters = {}) {
    return await this.reportService.listReports(filters);
  }

  /**
   * Get specific report (delegates to report service)
   */
  async getReport(reportId) {
    return await this.reportService.getReport(reportId);
  }

  /**
   * Delete specific report (delegates to report service)
   */
  async deleteReport(reportId) {
    return await this.reportService.deleteReport(reportId);
  }

  /**
   * Cleanup old reports (delegates to report service)
   */
  async cleanupOldReports() {
    return await this.reportService.cleanupOldReports();
  }

  /**
   * Get comprehensive service information (aggregates from all services)
   */
  async getServiceInfo() {
    try {
      const templateStats = this.templateService.getTemplateStats('sample');
      const githubStats = this.githubService.getStats();
      const reportStats = await this.reportService.getStats();
      
      return {
        templateService: templateStats,
        githubService: githubStats,
        reportService: reportStats,
        coordinator: {
          configKeys: Object.keys(this.config || {}),
          servicesLoaded: 3
        }
      };
    } catch (error) {
      return {
        error: error.message,
        coordinator: { servicesLoaded: 3 }
      };
    }
  }

  /**
   * Generate issue template only (delegates to template service)
   */
  async generateTemplate(context = {}) {
    return await this.templateService.generateIssueReport(context);
  }

  /**
   * Validate template content (delegates to template service)
   */
  validateTemplate(template) {
    return this.templateService.validateTemplate(template);
  }

  /**
   * Update GitHub repository configuration (delegates to GitHub service)
   */
  updateGitHubRepository(owner, name) {
    this.githubService.updateRepositoryConfig(owner, name);
    this.logger.info(`FeedbackManager: GitHub repository updated to ${owner}/${name}`);
  }

  /**
   * Get repository information (delegates to GitHub service)
   */
  getRepositoryInfo() {
    return this.githubService.getRepositoryInfo();
  }

  /**
   * Display manual submission instructions (private helper)
   */
  _displayManualSubmissionInstructions(result) {
    this.logger.info('');
    this.logger.info('📋 Manual submission options:');
    this.logger.info(`1. 📄 Open report file: ${result.filePath}`);
    this.logger.info('2. 🌐 Create GitHub issue manually');
    this.logger.info('3. 📧 Share with development team');
    this.logger.info('');
    this.logger.info('💡 Tip: Use createGitHubIssueUrl() to generate GitHub URL');
  }

  /**
   * Reset all services (useful for testing)
   */
  reset() {
    // Services don't have reset methods, but can be recreated if needed
    this.logger.info('FeedbackManager: Service reset requested');
  }

  /**
   * Check service health (validates all composed services)
   */
  async checkHealth() {
    const health = {
      templateService: true,
      githubService: true,
      reportService: true,
      errors: []
    };

    try {
      // Test template service
      const testTemplate = this.templateService.generateMinimalTemplate({ failedTool: 'test' });
      if (!testTemplate || testTemplate.length < 10) {
        health.templateService = false;
        health.errors.push('Template service not generating content');
      }
    } catch (error) {
      health.templateService = false;
      health.errors.push(`Template service error: ${error.message}`);
    }

    try {
      // Test GitHub service
      const repoInfo = this.githubService.getRepositoryInfo();
      if (!repoInfo.baseUrl) {
        health.githubService = false;
        health.errors.push('GitHub service not configured');
      }
    } catch (error) {
      health.githubService = false;
      health.errors.push(`GitHub service error: ${error.message}`);
    }

    try {
      // Test report service
      const stats = await this.reportService.getStats();
      if (stats.error) {
        health.reportService = false;
        health.errors.push(`Report service error: ${stats.error}`);
      }
    } catch (error) {
      health.reportService = false;
      health.errors.push(`Report service error: ${error.message}`);
    }

    health.overall = health.templateService && health.githubService && health.reportService;
    return health;
  }
}

module.exports = FeedbackManager;