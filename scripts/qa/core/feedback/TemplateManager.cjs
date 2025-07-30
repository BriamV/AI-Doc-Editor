/**
 * Template Manager - SOLID Template Processing
 * RF-008: Manages issue report templates and variable substitution
 * 
 * Single Responsibility: Template loading and variable replacement
 * Open/Closed: Extensible for new template types
 * Dependencies: File system abstraction
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class TemplateManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.templatesDir = path.join(__dirname, '../../templates');
  }

  /**
   * Load and process issue report template (RF-008)
   */
  async generateIssueReport(context = {}) {
    try {
      const templatePath = path.join(this.templatesDir, 'report-issue.md');
      const template = await this._loadTemplate(templatePath);
      
      const variables = this._prepareTemplateVariables(context);
      const processedTemplate = this._replaceVariables(template, variables);
      
      return processedTemplate;
      
    } catch (error) {
      this.logger.error(`Failed to generate issue report: ${error.message}`);
      throw new Error(`Template processing failed: ${error.message}`);
    }
  }

  /**
   * Load template from file system
   */
  async _loadTemplate(templatePath) {
    try {
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templatePath}`);
      }
      
      return fs.readFileSync(templatePath, 'utf8');
      
    } catch (error) {
      throw new Error(`Failed to load template: ${error.message}`);
    }
  }

  /**
   * Prepare template variables from context
   */
  _prepareTemplateVariables(context) {
    const timestamp = new Date().toISOString();
    const reportId = this._generateReportId();
    
    return {
      // System information
      QA_VERSION: context.qaVersion || this.config?.get('version') || '0.1.0',
      TIMESTAMP: timestamp,
      OS_INFO: `${os.platform()} ${os.release()} (${os.arch()})`,
      NODE_VERSION: process.version,
      REPORT_ID: reportId,

      // Git context
      BRANCH_NAME: context.branch || 'unknown',
      COMMIT_HASH: context.commit || 'unknown',

      // Execution context
      COMMAND_EXECUTED: context.command || 'yarn run cmd qa',
      EXECUTION_MODE: context.mode || 'automatic',
      EXECUTION_SCOPE: context.scope || 'all',
      EXECUTION_DIMENSION: context.dimension || 'all',
      DOD_TAG: context.dodTag || 'none',

      // Error context
      FAILED_TOOL: context.failedTool || 'unknown',
      TOOL_DIMENSION: context.toolDimension || 'unknown',
      EXECUTION_TIME: context.executionTime || 0,
      ERROR_MESSAGE: context.errorMessage || 'No error message provided',
      FULL_ERROR_OUTPUT: context.fullErrorOutput || 'No detailed output available',

      // Files and configuration
      AFFECTED_FILES: this._formatAffectedFiles(context.affectedFiles),
      CONFIG_FILE: context.configFile || 'qa-config.json',
      CUSTOM_ARGS: context.customArgs || 'none',
      LOG_FILE: context.logFile || 'qa-system.log',
      REPORT_PATH: context.reportPath || 'qa-report.json',
      MEGALINTER_REPORTS: context.megalinterReports || 'megalinter-reports/',

      // System capabilities and recommendations
      SYSTEM_CAPABILITIES: this._formatCapabilities(context.capabilities),
      SYSTEM_RECOMMENDATIONS: this._formatRecommendations(context.recommendations)
    };
  }

  /**
   * Replace template variables with actual values
   */
  _replaceVariables(template, variables) {
    let processed = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      // Handle arrays and objects by converting to string
      const stringValue = this._convertToString(value);
      processed = processed.replace(new RegExp(placeholder, 'g'), stringValue);
    }
    
    return processed;
  }

  /**
   * Convert value to appropriate string representation
   */
  _convertToString(value) {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'None';
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    
    return String(value);
  }

  /**
   * Format affected files list
   */
  _formatAffectedFiles(files) {
    if (!files || !Array.isArray(files) || files.length === 0) {
      return 'No specific files identified';
    }
    
    return files.map(file => `- ${file}`).join('\n');
  }

  /**
   * Format system capabilities
   */
  _formatCapabilities(capabilities) {
    if (!capabilities || typeof capabilities !== 'object') {
      return 'System capabilities not available';
    }
    
    const lines = [];
    for (const [key, value] of Object.entries(capabilities)) {
      lines.push(`**${key}:** ${this._convertToString(value)}`);
    }
    
    return lines.join('\n');
  }

  /**
   * Format recommendations
   */
  _formatRecommendations(recommendations) {
    if (!recommendations || !Array.isArray(recommendations) || recommendations.length === 0) {
      return 'No recommendations provided';
    }
    
    return recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n');
  }

  /**
   * Generate unique report ID
   */
  _generateReportId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `QA-${timestamp}-${random}`;
  }

  /**
   * Get available templates
   */
  async getAvailableTemplates() {
    try {
      const files = fs.readdirSync(this.templatesDir);
      return files.filter(file => file.endsWith('.md'));
    } catch (error) {
      this.logger.warn(`Could not read templates directory: ${error.message}`);
      return [];
    }
  }

  /**
   * Validate template exists
   */
  templateExists(templateName) {
    const templatePath = path.join(this.templatesDir, templateName);
    return fs.existsSync(templatePath);
  }
}

module.exports = TemplateManager;