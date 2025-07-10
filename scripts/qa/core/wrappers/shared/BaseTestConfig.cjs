/**
 * Base Test Configuration - Shared configuration for all test wrappers
 * SOLID: Single Responsibility for common test configuration management
 */

class BaseTestConfig {
  constructor(config, testType) {
    this.config = config;
    this.testType = testType;
    
    // Common test settings
    this.commonSettings = {
      timeout: config.get(`testing.${testType}.timeout`, 300000), // 5 minutes
      coverageThreshold: config.get('testing.coverage.threshold', 80),
      coverageDirectory: config.get('testing.coverage.directory', 'coverage'),
      reportFormats: config.get('testing.reportFormats', ['console', 'json'])
    };
  }
  
  /**
   * Get common scope patterns for test execution
   */
  getBaseScopePatterns() {
    return {
      backend: ['backend/', 'api/', 'server/'],
      frontend: ['src/', 'components/', 'pages/'],
      infrastructure: ['scripts/', 'tools/'],
      all: []
    };
  }
  
  /**
   * Get common coverage configuration
   */
  getCoverageConfig() {
    return {
      threshold: this.commonSettings.coverageThreshold,
      directory: this.commonSettings.coverageDirectory,
      formats: ['json', 'text', 'html']
    };
  }
  
  /**
   * Get timeout value
   */
  getTimeout() {
    return this.commonSettings.timeout;
  }
  
  /**
   * Check if coverage is enabled
   */
  isCoverageEnabled() {
    return this.config.get('testing.coverage.enabled', true);
  }
  
  /**
   * Get test match patterns
   */
  getTestMatchPatterns() {
    return this.config.get(`testing.${this.testType}.testMatch`, []);
  }
}

module.exports = BaseTestConfig;