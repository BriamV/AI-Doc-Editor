/**
 * ErrorHandler.cjs - CLI Error Handling and Issue Reporting
 * Conservative extraction from qa-cli.cjs lines 302-428 + error handling
 * No new functionality added - exact mapping only
 */

const QALogger = require('../utils/QALogger.cjs');
const QAConfig = require('../config/QAConfig.cjs');

class ErrorHandler {
  constructor() {
    this.logger = null;
  }

  /**
   * Set up CLI error handling
   */
  setupCliErrorHandling(cli) {
    cli.fail((msg, err, yargs) => {
      if (err) {
        this.logger = this.logger || new QALogger();
        this.logger.error(`Error: ${err.message}`);
        process.exit(1);
      }
      
      this.logger = this.logger || new QALogger();
      this.logger.error(msg);
      
      // Mensaje específico para flags inválidos
      if (msg.includes('Unknown flag') || msg.includes('Unknown arguments')) {
        this.logger.info('💡 Use --help to see all available options');
      } else {
        this.logger.info('');
        this.logger.info('Use --help para ver las opciones disponibles');
      }
      process.exit(1);
    });
  }

  /**
   * Handle validation errors and issue reporting
   */
  async handleValidationError(results, argv, error = null) {
    this.logger = this.logger || new QALogger({ verbose: argv.verbose });

    try {
      // Handle --report-issue flag (RF-008)
      if (argv['report-issue'] && (results.status === 'failed' || error)) {
        await this.handleReportIssue(results, argv);
      }
      
      // Exit with appropriate code
      if (error || results.status === 'failed' || (results.statistics && results.statistics.failed > 0)) {
        process.exit(1);
      }
      
    } catch (reportError) {
      this.logger.warn(`Issue reporting failed: ${reportError.message}`);
      process.exit(1);
    }
  }

  /**
   * Handle automatic issue reporting after validation failure (RF-008)
   */
  async handleReportIssue(results, argv) {
    try {
      this.logger.info('');
      this.logger.info('🐛 Generating issue report due to validation failure...');
      
      // Load configuration
      const config = await QAConfig.load(argv.config);
      
      // Initialize feedback manager
      const FeedbackManager = require('../core/feedback/FeedbackManager.cjs');
      const feedbackManager = new FeedbackManager(config, this.logger);
      
      // Extract failure information
      const failures = results.results?.filter(r => !r.success) || [];
      const firstFailure = failures[0] || {};
      
      // Prepare context from validation results
      const context = {
        failedTool: firstFailure.tool || 'unknown',
        toolDimension: firstFailure.dimension || 'unknown',
        mode: argv.fast ? 'fast' : (argv.task ? 'dod' : 'automatic'),
        scope: argv.scope || 'all',
        dimension: argv.dimension || 'all',
        dodTag: argv.task || 'none',
        errorMessage: firstFailure.error || results.error || 'Validation failed',
        fullErrorOutput: JSON.stringify(failures, null, 2),
        command: process.argv.join(' '),
        executionTime: results.statistics?.executionTime || 0,
        affectedFiles: results.affectedFiles || [],
        recommendations: results.recommendations || [],
        qaVersion: '0.1.0',
        branch: 'unknown', // Will be detected by git in actual implementation
        commit: 'unknown'
      };
      
      // Generate and open issue report
      const result = await feedbackManager.reportIssue(context);
      
      if (result.success) {
        this.logger.info('📋 Issue report ready for submission');
      } else {
        this.logger.warn(`Could not generate issue report: ${result.error}`);
      }
      
    } catch (error) {
      this.logger.warn(`Issue reporting failed: ${error.message}`);
    }
  }

  /**
   * Report issue command handler (RF-008)
   */
  async reportIssue(argv) {
    this.logger = new QALogger({ verbose: argv.verbose });
    
    try {
      this.logger.info('🐛 QA System - Issue Reporting (RF-008)');
      this.logger.info('');
      
      // Load configuration
      const config = await QAConfig.load(argv.config);
      
      // Initialize feedback manager
      const FeedbackManager = require('../core/feedback/FeedbackManager.cjs');
      const feedbackManager = new FeedbackManager(config, this.logger);
      
      // Prepare context from command line arguments
      const context = {
        failedTool: argv.tool || 'manual-report',
        toolDimension: argv.dimension || 'general',
        mode: 'manual',
        errorMessage: argv.error || 'Manual issue report',
        command: process.argv.join(' '),
        additionalContext: argv.context,
        branch: 'unknown', // Will be detected by git in actual implementation
        qaVersion: '0.1.0'
      };
      
      // Generate and open issue report
      const result = await feedbackManager.reportIssue(context);
      
      if (result.success) {
        this.logger.success('Issue report generated successfully');
        this.logger.info(`🔗 GitHub URL: ${result.url}`);
      } else {
        this.logger.error(`Failed to generate issue report: ${result.error}`);
        process.exit(1);
      }
      
    } catch (error) {
      this.logger.error(`Issue reporting failed: ${error.message}`);
      if (argv.verbose) {
        this.logger.error(error.stack);
      }
      process.exit(1);
    }
  }

  /**
   * List local issue reports (RF-008 extension)
   */
  async listIssues(argv) {
    this.logger = new QALogger({ verbose: argv.verbose });
    
    try {
      this.logger.info('📋 QA System - Local Issue Reports');
      this.logger.info('');
      
      // Load configuration
      const config = await QAConfig.load(argv.config);
      
      // Initialize feedback manager
      const FeedbackManager = require('../core/feedback/FeedbackManager.cjs');
      const feedbackManager = new FeedbackManager(config, this.logger);
      
      // Get local issues
      const issues = await feedbackManager.getLocalIssues(argv.limit, argv.status);
      
      if (issues.length === 0) {
        this.logger.info('No local issue reports found.');
        this.logger.info('💡 Run "yarn run cmd qa report-issue" to create a new report');
        return;
      }
      
      // Display issues in organized format
      this.logger.info(`Found ${issues.length} issue reports:`);
      this.logger.info('');
      
      for (let i = 0; i < issues.length; i++) {
        const issue = issues[i];
        const status = issue.status === 'open' ? '🔴' : '✅';
        const timeAgo = this.formatTimeAgo(new Date(issue.timestamp));
        
        this.logger.info(`${i + 1}. ${status} ${issue.reportId}`);
        this.logger.info(`   Tool: ${issue.tool} (${issue.dimension})`);
        this.logger.info(`   Error: ${issue.error.substring(0, 80)}${issue.error.length > 80 ? '...' : ''}`);
        this.logger.info(`   Created: ${timeAgo} (${issue.mode} mode)`);
        this.logger.info('');
      }
      
      this.logger.info('💡 Commands:');
      this.logger.info('  - yarn run cmd qa list-issues --status all    (show all)');
      this.logger.info('  - yarn run cmd qa list-issues --limit 20      (show more)');
      
    } catch (error) {
      this.logger.error(`Failed to list issues: ${error.message}`);
      if (argv.verbose) {
        this.logger.error(error.stack);
      }
      process.exit(1);
    }
  }

  /**
   * Format time ago helper
   */
  formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  }
}

module.exports = ErrorHandler;