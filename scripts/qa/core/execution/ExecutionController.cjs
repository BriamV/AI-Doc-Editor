/**
 * Execution Controller - SOLID-Lean Implementation
 * Single Responsibility: Coordinate tool execution workflow
 * 
 * Features:
 * - Dependency injection for testability
 * - Separation of concerns following SOLID principles
 * - Optimized file discovery and execution coordination
 */

class ExecutionController {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    // Dependency injection - SOLID Dependency Inversion Principle
    const CLIOptionsDetector = require('../../utils/helpers/CLIOptionsDetector.cjs');
    const GitFileService = require('../../utils/helpers/GitFileService.cjs');
    const FileDiscoveryService = require('../../utils/helpers/FileDiscoveryService.cjs');
    const ToolExecutor = require('../../utils/helpers/ToolExecutor.cjs');
    
    this.cliDetector = new CLIOptionsDetector(logger);
    this.gitService = new GitFileService(logger);
    this.fileService = new FileDiscoveryService(logger);
    this.toolExecutor = new ToolExecutor(config, logger);
    
    // Execution configuration with robust fallbacks
    this.executionConfig = {
      maxParallelWrappers: this._getConfigValue(config, 'execution.maxParallel', 3),
      defaultTimeout: this._getConfigValue(config, 'execution.defaultTimeout', 300000),
      retryAttempts: this._getConfigValue(config, 'execution.retryAttempts', 2),
      retryDelay: this._getConfigValue(config, 'execution.retryDelay', 1000)
    };
    
    this.logger.debug(`ExecutionController config: maxParallel=${this.executionConfig.maxParallelWrappers}, timeout=${this.executionConfig.defaultTimeout}`);
  }
  
  /**
   * Safe config value getter with fallbacks
   */
  _getConfigValue(config, key, defaultValue) {
    try {
      const value = config.get ? config.get(key, defaultValue) : defaultValue;
      return value !== undefined && value !== null ? value : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }
  
  /**
   * Execute tools in parallel with concurrency limit
   * SOLID: Single responsibility - only coordinates parallel execution
   */
  async executeToolsInParallel(tools, wrapperManager) {
    this.logger.info(`ExecutionController: Starting parallel execution of ${tools.length} tools`);
    
    // Prepare tool executions
    const toolExecutions = [];
    
    for (const tool of tools) {
      const wrapper = await wrapperManager.getWrapper(tool.name);
      
      if (!wrapper) {
        this.logger.warn(`No wrapper found for ${tool.name}`);
        continue;
      }
      
      // Get files for this tool
      const files = await this._getFilesForTool(tool);
      
      toolExecutions.push({
        tool,
        wrapper,
        files
      });
    }
    
    // Execute with concurrency control
    const results = await this.toolExecutor.executeToolsConcurrently(
      toolExecutions,
      this.executionConfig.maxParallelWrappers
    );
    
    // Log execution statistics
    const stats = this.toolExecutor.getExecutionStats(results);
    this.logger.info(`Parallel execution completed: ${stats.successful}/${stats.total} successful in ${stats.totalTime.toFixed(2)}ms`);
    
    return results;
  }
  
  /**
   * Execute tools sequentially
   * SOLID: Single responsibility - only coordinates sequential execution
   */
  async executeToolsSequentially(tools, wrapperManager) {
    this.logger.info(`ExecutionController: Starting sequential execution of ${tools.length} tools`);
    const results = [];
    
    for (const tool of tools) {
      const wrapper = await wrapperManager.getWrapper(tool.name);
      
      if (!wrapper) {
        this.logger.warn(`No wrapper found for ${tool.name}`);
        results.push({
          tool: tool,
          success: false,
          error: 'No wrapper found',
          critical: true
        });
        continue;
      }
      
      // Get files for this tool
      const files = await this._getFilesForTool(tool);
      
      // Execute tool
      const result = await this.toolExecutor.executeTool(tool, wrapper, files);
      results.push(result);
    }
    
    return results;
  }
  
  /**
   * Get files for tool execution
   * SOLID: Delegates to specialized services
   */
  async _getFilesForTool(tool) {
    try {
      // Check if explicit scope takes precedence over fast mode
      const hasExplicitScope = this.cliDetector.hasExplicitScope();
      
      // Fast mode optimization (only if no explicit scope)
      if (tool.config?.stagedFilesOnly && !hasExplicitScope) {
        const changedFiles = await this.gitService.getAllChangedFiles();
        
        if (changedFiles.staged.length > 0) {
          const filteredFiles = this.fileService.filterFilesForTool(changedFiles.staged, tool);
          this.logger.debug(`Fast mode: Found ${filteredFiles.length} staged files for ${tool.name}`);
          return filteredFiles;
        }
        
        if (changedFiles.modified.length > 0) {
          const filteredFiles = this.fileService.filterFilesForTool(changedFiles.modified, tool);
          this.logger.debug(`Fast mode: Found ${filteredFiles.length} modified files for ${tool.name}`);
          return filteredFiles;
        }
      }
      
      // Explicit files configuration
      if (tool.config?.files && Array.isArray(tool.config.files)) {
        return tool.config.files;
      }
      
      // Scope-based discovery
      if (tool.config?.scope) {
        return await this.fileService.getFilesForScope(tool.config.scope);
      }
      
      // Default discovery
      return await this.fileService.getDefaultFiles();
      
    } catch (error) {
      this.logger.warn(`Error getting files for tool ${tool.name}: ${error.message}`);
      return await this.fileService.getDefaultFiles();
    }
  }
  
  /**
   * Check for critical failures that should stop execution
   * SOLID: Single responsibility - only validates critical failures
   */
  checkCriticalFailures(results) {
    const criticalFailures = results.filter(result => 
      !result.success && result.critical
    );
    
    if (criticalFailures.length > 0) {
      const errors = criticalFailures.map(f => f.error).join(', ');
      throw new Error(`Critical failures: ${errors}`);
    }
    
    return false;
  }
}

module.exports = ExecutionController;