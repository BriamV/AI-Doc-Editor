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
const ToolTypeClassifier = require('../tools/ToolTypeClassifier.cjs');

class BuildWrapper {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    // Initialize SOLID components
    this.buildConfig = new BuildConfig(config, logger);
    this.buildExecutor = new BuildExecutor(this.buildConfig, logger);
    this.buildReporter = new BuildReporter(logger);
    this.buildResultBuilder = new BuildResultBuilder();
    this.toolTypeClassifier = new ToolTypeClassifier(config, logger);
  }
  
  /**
   * Execute build validation for given tool configuration
   */
  async execute(tool) {
    const startTime = Date.now();
    
    try {
      this.logger.info(`Executing build validation for ${tool.name} (${tool.dimension})`);
      
      // Determine tools to execute based on tool configuration
      const toolsToExecute = await this._determineToolsToExecute(tool);
      
      // Execute build tools
      const executionResults = await this.buildExecutor.executeTools(toolsToExecute);
      
      // Process results
      const processedResults = this.buildReporter.processResults(executionResults);
      
      // Build final response
      const response = this.buildResultBuilder.buildResponse(processedResults, toolsToExecute);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      this.logger.info(`Build validation completed for ${tool.name} in ${executionTime}ms`);
      
      // Critical Fix: Extract individual tool result instead of aggregated result
      const individualToolResult = this._extractIndividualToolResult(response, tool.name);
      
      return {
        success: individualToolResult.success,
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
  async _determineToolsToExecute(tool) {
    const scope = tool.scope || 'all';
    const toolsToExecute = [];
    
    // In dimension mode, execute all applicable build tools
    if (tool.config && tool.config.dimensionMode) {
      // Dimension mode: execute all available build tools that are applicable
      const availableTools = await this.buildConfig.getAvailableTools();
      
      for (const toolName of availableTools) {
        if (await this.buildConfig.isToolApplicable(toolName, scope)) {
          toolsToExecute.push({
            name: toolName,
            action: await this._getDefaultAction(toolName),
            options: await this._getToolOptions(toolName, tool)
          });
        }
      }
    } else {
      // Standard mode: use the specific configured tool name (respecting package manager detection)
      // Critical Fix: Use the actual configured tool name instead of reading from static config
      toolsToExecute.push({
        name: tool.name,  // Use the actual tool name (e.g., "yarn" instead of "npm")
        action: await this._getDefaultAction(tool.name),
        options: await this._getToolOptions(tool.name, tool)
      });
    }
    
    return toolsToExecute;
  }
  
  /**
   * Get default action for tool (systematic classification)
   */
  async _getDefaultAction(toolName) {
    try {
      // Systematic approach: Use tool type classification
      const toolType = await this.toolTypeClassifier.getToolType(toolName);
      const action = this.toolTypeClassifier.getDefaultActionForType(toolType);
      
      return action;
      
    } catch (error) {
      // Robust fallback: Preserve existing behavior if classification fails
      this.logger.warn(`BuildWrapper: ToolTypeClassifier failed for '${toolName}', using fallback: ${error.message}`);
      
      const fallbackActions = {
        npm: 'install',
        yarn: 'install',
        pnpm: 'install',
        tsc: 'check',
        pip: 'install',
        vite: 'check'
      };
      
      return fallbackActions[toolName] || 'check';
    }
  }
  
  /**
   * Get tool-specific options (systematic by type)
   */
  async _getToolOptions(toolName, tool) {
    const options = {};
    
    // Pass through any tool-specific configuration
    if (tool.config && tool.config.args) {
      options.args = tool.config.args;
    }
    
    try {
      // Systematic approach: Use tool type for options
      const toolType = await this.toolTypeClassifier.getToolType(toolName);
      
      switch (toolType) {
        case 'package-manager':
          options.level = 'moderate'; // Default audit level
          break;
        case 'compiler':
          if (toolName === 'tsc') {
            options.project = '.'; // Default project
          }
          break;
        case 'dependency-manager':
          if (toolName === 'pip') {
            options.requirements = 'requirements.txt';
          }
          break;
        default:
          // No specific options for other types
          break;
      }
    } catch (error) {
      // Fallback to hardcoded logic if classification fails
      if (toolName === 'npm' || toolName === 'yarn' || toolName === 'pnpm') {
        options.level = 'moderate';
      } else if (toolName === 'tsc') {
        options.project = '.';
      } else if (toolName === 'pip') {
        options.requirements = 'requirements.txt';
      }
    }
    
    return options;
  }
  
  /**
   * Get wrapper name (required by IBaseLinterWrapper interface)
   */
  getName() {
    return 'BuildWrapper';
  }
  
  /**
   * Get wrapper version
   */
  getVersion() {
    return '1.0.0';
  }
  
  /**
   * Check if build tools are available
   */
  async isAvailable() {
    try {
      const availableTools = await this.buildConfig.getAvailableTools();
      return availableTools.length > 0;
    } catch (error) {
      return false;
    }
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
   * Extract individual tool result from aggregated response
   */
  _extractIndividualToolResult(response, toolName) {
    // Check if we have individual tool results in details
    if (response.results && response.results.details && response.results.details.tools) {
      const toolResults = response.results.details.tools[toolName];
      
      if (toolResults && toolResults.length > 0) {
        // Use the first action result for this tool
        const toolResult = toolResults[0];
        return {
          success: toolResult.status === 'passed' || toolResult.status === 'completed',
          status: toolResult.status,
          summary: toolResult.summary,
          executionTime: toolResult.executionTime || 0
        };
      }
    }
    
    // Fallback to aggregated result if individual not found
    return {
      success: response.success,
      status: response.success ? 'passed' : 'failed',
      summary: response.success ? 'Completed successfully' : 'Failed',
      executionTime: 0
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