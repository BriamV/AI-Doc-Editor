/**
 * BuildWrapper.cjs - Build Validation Coordinator
 * T-11: Orchestrates npm, tsc, pip build validation using SOLID components
 * 
 * Single Responsibility: Coordination of build validation components
 * Open/Closed: Extensible for new build tools
 * Dependencies: Inverted through constructor injection
 */

const BuildConfig = require('./build/BuildConfig.cjs');
const BuildExecutor = require('./build/BuildExecutor.cjs');
const BuildReporter = require('./build/BuildReporter.cjs');
const BuildResultBuilder = require('./build/BuildResultBuilder.cjs');

class BuildWrapper {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    // Initialize SOLID components
    this.buildConfig = new BuildConfig(config, logger);
    this.buildExecutor = new BuildExecutor(this.buildConfig, logger);
    this.buildReporter = new BuildReporter(logger);
    this.buildResultBuilder = new BuildResultBuilder();
  }
  
  /**
   * Execute build validation for given tool configuration
   */
  async execute(tool) {
    const startTime = Date.now();
    
    try {
      this.logger.info(`Executing build validation for ${tool.name} (${tool.dimension})`);
      
      // Determine tools to execute based on tool configuration
      const toolsToExecute = this._determineToolsToExecute(tool);
      
      // Execute build tools
      const executionResults = await this.buildExecutor.executeTools(toolsToExecute);
      
      // Process results
      const processedResults = this.buildReporter.processResults(executionResults);
      
      // Build final response
      const response = this.buildResultBuilder.buildResponse(processedResults, toolsToExecute);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      this.logger.info(`Build validation completed for ${tool.name} in ${executionTime}ms`);
      
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
      this.logger.error(`Build validation failed for ${tool.name}: ${error.message}`);
      
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
   * Determine which build tools to execute based on configuration
   */
  _determineToolsToExecute(tool) {
    const scope = tool.scope || 'all';
    const toolsToExecute = [];
    
    // In dimension mode, execute all applicable build tools
    if (tool.config && tool.config.dimensionMode) {
      // Dimension mode: execute all available build tools that are applicable
      const availableTools = this.buildConfig.getAvailableTools();
      
      for (const toolName of availableTools) {
        if (this.buildConfig.isToolApplicable(toolName, scope)) {
          toolsToExecute.push({
            name: toolName,
            action: this._getDefaultAction(toolName),
            options: this._getToolOptions(toolName, tool)
          });
        }
      }
    } else {
      // Standard mode: use scope-based tool selection
      const buildTools = this.config.get('tools.build', {});
      const scopeTools = buildTools[scope] || buildTools['all'] || [];
      
      for (const toolName of scopeTools) {
        if (this.buildConfig.isToolApplicable(toolName, scope)) {
          toolsToExecute.push({
            name: toolName,
            action: this._getDefaultAction(toolName),
            options: this._getToolOptions(toolName, tool)
          });
        }
      }
    }
    
    return toolsToExecute;
  }
  
  /**
   * Get default action for tool
   */
  _getDefaultAction(toolName) {
    const defaultActions = {
      npm: 'install',
      tsc: 'check',
      pip: 'install',
      vite: 'check'
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
    if (toolName === 'npm') {
      options.level = 'moderate'; // Default audit level
    } else if (toolName === 'tsc') {
      options.project = '.'; // Default project
    } else if (toolName === 'pip') {
      options.requirements = 'requirements.txt'; // Default requirements file
    }
    
    return options;
  }
  
  /**
   * Get wrapper capabilities
   */
  getCapabilities() {
    return {
      supportedTools: this.buildConfig.getAvailableTools(),
      supportedDimensions: ['build'],
      fastModeSupported: true,
      parallelExecutionSupported: true,
      reportFormats: ['console', 'json', 'tree'],
      supportedScopes: ['frontend', 'backend', 'infrastructure', 'all']
    };
  }
  
  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.buildExecutor) {
      this.buildExecutor.cleanup();
    }
  }
}

module.exports = BuildWrapper;