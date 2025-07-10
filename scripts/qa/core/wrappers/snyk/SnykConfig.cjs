/**
 * Snyk Configuration - Single Responsibility: Configuration management
 * Extracted from SnykWrapper for SOLID compliance
 */

class SnykConfig {
  constructor(config) {
    this.config = config;
    
    // Snyk configuration
    this.settings = {
      timeout: config.get('security.timeout', 300000),
      severityThreshold: config.get('security.severity.threshold', 'high'),
      failOnVulnerabilities: config.get('security.failOnVulnerabilities', true),
      reportPath: config.get('security.reportPath', 'snyk-report.json')
    };
    
    // Severity levels for filtering
    this.severityLevels = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'critical': 4
    };
    
    // Scope patterns
    this.scopePatterns = {
      frontend: ['package.json', 'yarn.lock', 'package-lock.json'],
      backend: ['requirements.txt', 'Pipfile', 'setup.py', 'pyproject.toml'],
      infrastructure: ['Dockerfile', 'docker-compose.yml'],
      all: ['package.json', 'requirements.txt', 'Pipfile']
    };
  }
  
  /**
   * Get scope-specific file patterns for Snyk
   */
  getScopePatterns(scope) {
    return this.scopePatterns[scope] || this.scopePatterns.all;
  }
  
  /**
   * Get severity level numeric value
   */
  getSeverityLevel(severity) {
    return this.severityLevels[severity] || 1;
  }
  
  /**
   * Build Snyk command based on tool configuration
   */
  buildCommand(tool) {
    const command = ['snyk'];
    
    // Determine scan type based on tool config
    const scanType = tool.config.scanType || 'test';
    command.push(scanType);
    
    // Add JSON output for parsing
    command.push('--json');
    
    // Add severity threshold
    if (this.settings.severityThreshold && scanType === 'test') {
      command.push(`--severity-threshold=${this.settings.severityThreshold}`);
    }
    
    // Add scope-specific patterns
    if (tool.config.scope) {
      const scopePatterns = this.getScopePatterns(tool.config.scope);
      if (scopePatterns.length > 0) {
        command.push('--file', scopePatterns[0]);
      }
    }
    
    // Add tool-specific arguments
    if (tool.config?.args && tool.config.args.length > 0) {
      command.push(...tool.config.args);
    }
    
    return command;
  }
  
  /**
   * Determine if execution was successful
   */
  determineSuccess(results) {
    // Success if no critical errors
    if (results.errors.length > 0) {
      return false;
    }
    
    // Check severity threshold
    const threshold = this.getSeverityLevel(this.settings.severityThreshold);
    const criticalCount = results.summary.critical + results.summary.high;
    
    if (this.settings.failOnVulnerabilities && criticalCount > 0) {
      return false;
    }
    
    return true;
  }
}

module.exports = SnykConfig;