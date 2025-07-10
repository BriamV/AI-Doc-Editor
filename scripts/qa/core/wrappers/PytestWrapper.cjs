/**
 * Pytest Wrapper - T-08: Testing & Coverage for Python
 * SOLID-refactored coordinator using dependency injection
 */

const PytestConfig = require('./pytest/PytestConfig.cjs');
const PytestExecutor = require('./pytest/PytestExecutor.cjs');
const PytestReporter = require('./pytest/PytestReporter.cjs');
const PytestResultBuilder = require('./pytest/PytestResultBuilder.cjs');

class PytestWrapper {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    // SOLID: Dependency injection of specialized components
    this.pytestConfig = new PytestConfig(config);
    this.pytestExecutor = new PytestExecutor(config, logger);
    this.pytestReporter = new PytestReporter(config, logger);
    this.resultBuilder = new PytestResultBuilder();
  }
  
  /**
   * Execute pytest tests with coverage
   */
  async execute(tool) {
    const startTime = Date.now();
    
    try {
      this.logger.info(`Executing pytest for ${tool.name} (${tool.dimension})`);
      
      // SOLID: Use specialized components
      const command = this.pytestConfig.buildCommand(tool);
      const result = await this.pytestExecutor.executePytest(command, this.pytestConfig.settings.timeout);
      const processedResults = await this.pytestReporter.processResults(result, tool);
      
      const executionTime = Date.now() - startTime;
      this.logger.info(`Pytest execution completed for ${tool.name} in ${executionTime}ms`);
      
      // SOLID: Use ResultBuilder for consistent result structure
      return this.resultBuilder.build(result, processedResults, tool, executionTime);
      
    } catch (error) {
      this.logger.error(`Pytest execution failed for ${tool.name}: ${error.message}`);
      
      // SOLID: Use ResultBuilder for error handling
      return this.resultBuilder.build(null, null, tool, Date.now() - startTime, error);
    }
  }
  
  /**
   * Get wrapper capabilities
   */
  getCapabilities() {
    return {
      supportedTools: ['pytest'],
      supportedDimensions: ['test'],
      fastModeSupported: true,
      parallelExecutionSupported: true,
      reportFormats: ['console', 'json', 'coverage'],
      coverageSupported: true
    };
  }
}

module.exports = PytestWrapper;