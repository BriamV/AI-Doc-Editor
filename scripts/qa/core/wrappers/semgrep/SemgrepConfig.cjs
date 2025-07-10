/**
 * Semgrep Configuration - Single Responsibility: Configuration management
 * Extracted from SemgrepWrapper for SOLID compliance
 */

class SemgrepConfig {
  constructor(config) {
    this.config = config;
    
    // Semgrep configuration
    this.settings = {
      timeout: config.get('security.timeout', 300000),
      severityThreshold: config.get('security.severity.threshold', 'WARNING'),
      failOnVulnerabilities: config.get('security.failOnVulnerabilities', true),
      reportPath: config.get('security.reportPath', 'semgrep-report.json'),
      rulesets: config.get('security.semgrep.rulesets', ['auto'])
    };
    
    // Severity levels for filtering
    this.severityLevels = {
      'INFO': 1,
      'WARNING': 2,
      'ERROR': 3,
      'CRITICAL': 4
    };
    
    // Scope patterns
    this.scopePatterns = {
      frontend: ['--include', '*.js', '--include', '*.ts', '--include', '*.jsx', '--include', '*.tsx'],
      backend: ['--include', '*.py', '--include', '*.js', '--include', '*.ts'],
      infrastructure: ['--include', '*.yml', '--include', '*.yaml', '--include', '*.json'],
      all: ['.']
    };
  }
  
  /**
   * Get scope-specific file patterns for Semgrep
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
   * Build Semgrep command based on tool configuration
   */
  buildCommand(tool) {
    const command = ['semgrep'];
    
    // Add JSON output for parsing
    command.push('--json');
    
    // Add rulesets
    const rulesets = tool.config.rulesets || this.settings.rulesets;
    for (const ruleset of rulesets) {
      command.push('--config', ruleset);
    }
    
    // Add severity threshold
    if (this.settings.severityThreshold) {
      command.push('--severity', this.settings.severityThreshold);
    }
    
    // Add scope-specific patterns
    if (tool.config.scope) {
      const scopePatterns = this.getScopePatterns(tool.config.scope);
      if (scopePatterns.length > 0) {
        command.push(...scopePatterns);
      }
    } else {
      command.push('.');
    }
    
    // Add tool-specific arguments
    if (tool.config?.args && tool.config.args.length > 0) {
      command.push(...tool.config.args);
    }
    
    // Add timeout
    command.push('--timeout', '300');
    
    return command;
  }
  
  /**
   * Determine if execution was successful
   */
  determineSuccess(results) {
    if (results.errors.length > 0) {
      return false;
    }
    
    const threshold = this.getSeverityLevel(this.settings.severityThreshold);
    const criticalCount = results.summary.critical + results.summary.error;
    
    if (this.settings.failOnVulnerabilities && criticalCount > 0) {
      return false;
    }
    
    return true;
  }
}

module.exports = SemgrepConfig;