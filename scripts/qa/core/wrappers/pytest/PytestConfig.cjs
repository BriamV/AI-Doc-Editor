/**
 * Pytest Configuration - Single Responsibility: Configuration management
 * Extracted from PytestWrapper for SOLID compliance
 */

const BaseTestConfig = require('../shared/BaseTestConfig.cjs');

class PytestConfig extends BaseTestConfig {
  constructor(config) {
    super(config, 'pytest');
    
    // Pytest-specific settings
    this.settings = {
      ...this.commonSettings,
      testMatch: config.get('testing.pytest.testMatch', ['**/*test*.py', '**/test_*.py']),
      pytestArgs: config.get('testing.pytest.args', [])
    };
  }
  
  /**
   * Build Pytest command with appropriate flags
   */
  buildCommand(tool) {
    const command = ['pytest'];
    
    // Add coverage flags if enabled
    if (this.isCoverageEnabled()) {
      const coverageConfig = this.getCoverageConfig();
      command.push('--cov=.', '--cov-report=json', '--cov-report=term');
    }
    
    // Add scope-specific patterns
    if (tool.config.scope) {
      const scopePatterns = this._getScopePatterns(tool.config.scope);
      if (scopePatterns.length > 0) {
        command.push(...scopePatterns);
      }
    }
    
    // Add configuration file if exists
    const configFile = this._findPytestConfig();
    if (configFile) {
      command.push('-c', configFile);
    }
    
    // Add tool-specific arguments
    if (tool.config?.args && tool.config.args.length > 0) {
      command.push(...tool.config.args);
    }
    
    // Add pytest-specific arguments
    if (this.settings.pytestArgs.length > 0) {
      command.push(...this.settings.pytestArgs);
    }
    
    // Add verbose output for better parsing
    command.push('-v');
    
    return command;
  }
  
  /**
   * Get test patterns for specific scope
   */
  _getScopePatterns(scope) {
    const basePatterns = this.getBaseScopePatterns();
    
    // Pytest-specific patterns (remove frontend since pytest is for Python)
    const pytestPatterns = {
      ...basePatterns,
      frontend: [] // Pytest not used for frontend
    };
    
    return pytestPatterns[scope] || pytestPatterns.all;
  }
  
  /**
   * Find Pytest configuration file
   */
  _findPytestConfig() {
    const fs = require('fs');
    const path = require('path');
    
    const configFiles = [
      'pytest.ini',
      'pyproject.toml',
      'setup.cfg'
    ];
    
    for (const file of configFiles) {
      const filePath = path.join(process.cwd(), file);
      try {
        fs.accessSync(filePath, fs.constants.F_OK);
        return filePath;
      } catch (error) {
        // File doesn't exist, continue
      }
    }
    
    return null;
  }
}

module.exports = PytestConfig;