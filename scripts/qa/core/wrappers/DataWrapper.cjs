/**
 * DataWrapper.cjs - Data Validation Coordinator
 * T-12: Orchestrates Spectral and Django migration validation using SOLID components
 * 
 * Single Responsibility: Coordination of data validation components
 * Open/Closed: Extensible for new data validation tools
 * Dependencies: Inverted through constructor injection
 */

const DataConfig = require('./data/DataConfig.cjs');
const DataExecutor = require('./data/DataExecutor.cjs');
const DataReporter = require('./data/DataReporter.cjs');
const DataResultBuilder = require('./data/DataResultBuilder.cjs');

class DataWrapper {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    // Initialize SOLID components
    this.dataConfig = new DataConfig(config, logger);
    this.dataExecutor = new DataExecutor(this.dataConfig, logger);
    this.dataReporter = new DataReporter(logger);
    this.dataResultBuilder = new DataResultBuilder();
  }
  
  /**
   * Execute data validation for given tool configuration
   */
  async execute(tool) {
    const startTime = Date.now();
    
    try {
      this.logger.info(`Executing data validation for ${tool.name} (${tool.dimension})`);
      
      // Determine tools to execute based on tool configuration
      const toolsToExecute = this._determineToolsToExecute(tool);
      
      // Execute data validation tools
      const executionResults = await this.dataExecutor.executeTools(toolsToExecute);
      
      // Process results
      const processedResults = this.dataReporter.processResults(executionResults);
      
      // Build final response
      const response = this.dataResultBuilder.buildResponse(processedResults, toolsToExecute);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      this.logger.info(`Data validation completed for ${tool.name} in ${executionTime}ms`);
      
      return {
        success: response.success,
        tool: tool.name,
        dimension: tool.dimension,
        executionTime: executionTime,
        results: response.results,
        warnings: response.warnings,
        errors: response.errors
      };
      
    } catch (error) {
      this.logger.error(`Data validation failed for ${tool.name}: ${error.message}`);
      
      return {
        success: false,
        tool: tool.name,
        dimension: tool.dimension,
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * Determine which data validation tools to execute based on configuration
   */
  _determineToolsToExecute(tool) {
    const scope = tool.scope || 'all';
    const dataTools = this.config.get('tools.data', {});
    const scopeTools = dataTools[scope] || dataTools['all'] || [];
    
    const toolsToExecute = [];
    
    for (const toolName of scopeTools) {
      if (this.dataConfig.isToolApplicable(toolName, scope)) {
        toolsToExecute.push({
          name: toolName,
          action: this._getDefaultAction(toolName),
          options: this._getToolOptions(toolName, tool)
        });
      }
    }
    
    return toolsToExecute;
  }
  
  /**
   * Get default action for tool
   */
  _getDefaultAction(toolName) {
    const defaultActions = {
      'spectral': 'validate',
      'django-migrations': 'check'
    };
    
    return defaultActions[toolName] || 'check';
  }
  
  /**
   * Get tool-specific options
   */
  _getToolOptions(toolName, tool) {
    const options = {};
    
    // Pass through any tool-specific configuration
    if (tool.config && tool.config.args) {
      options.args = tool.config.args;
    }
    
    // Tool-specific option handling
    if (toolName === 'spectral') {
      options.format = 'stylish'; // Default output format
      options.ruleset = null; // Use default ruleset
    } else if (toolName === 'django-migrations') {
      options.verbosity = '1'; // Default verbosity level
      options.database = 'default'; // Default database
    }
    
    return options;
  }
  
  /**
   * Get wrapper name (required by IBaseLinterWrapper interface)
   */
  getName() {
    return 'DataWrapper';
  }
  
  /**
   * Get wrapper version
   */
  getVersion() {
    return '1.0.0';
  }
  
  /**
   * Check if data validation tools are available
   */
  async isAvailable() {
    try {
      const availableTools = await this.dataConfig.getAvailableTools();
      return availableTools.length > 0;
    } catch (error) {
      this.logger.warn(`Data validation tools availability check failed: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Get wrapper capabilities
   */
  getCapabilities() {
    return {
      supportedTools: this.dataConfig.getAvailableTools(),
      supportedDimensions: ['data'],
      fastModeSupported: true,
      parallelExecutionSupported: false, // Data validation is sequential
      reportFormats: ['console', 'json', 'tree'],
      supportedScopes: ['api', 'backend', 'infrastructure', 'all'],
      validationTypes: ['OpenAPI/Swagger', 'Django Migrations']
    };
  }
  
  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.dataExecutor) {
      this.dataExecutor.cleanup();
    }
  }
}

module.exports = DataWrapper;