/**
 * Tool Executor - Single Responsibility: Individual tool execution
 * SOLID-Lean refactoring from ExecutionController
 */

class ToolExecutor {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    // Default timeout configuration
    this.defaultTimeout = this._getConfigValue(config, 'execution.defaultTimeout', 300000);
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
   * Execute individual tool with wrapper
   */
  async executeTool(tool, wrapper, files) {
    const { performance } = require('perf_hooks');
    const startTime = performance.now();
    
    try {
      this.logger.info(`Executing tool: ${tool.name}`);
      
      const actualTimeout = tool.config?.timeout || this.defaultTimeout;
      let result;
      
      // Handle different wrapper interfaces
      if (wrapper.getName() === 'direct-linters' || typeof wrapper.getFilesForTool === 'function') {
        // Orchestrator wrappers: use execute(tool) interface
        this.logger.debug(`Using orchestrator interface for ${tool.name}`);
        result = await this.executeWithTimeout(
          () => wrapper.execute(tool),
          actualTimeout
        );
      } else {
        // Individual wrappers: use execute(files, options) interface  
        this.logger.debug(`Using individual wrapper interface for ${tool.name}`);
        const options = tool.config || {};
        
        this.logger.info(`${tool.name}: Found ${files.length} files to process`);
        if (files.length > 0) {
          this.logger.debug(`${tool.name} files sample: ${files.slice(0, 3).join(', ')}`);
        }
        
        result = await this.executeWithTimeout(
          () => wrapper.execute(files, options),
          actualTimeout
        );
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      this.logger.info(`Tool execution completed: ${tool.name} in ${executionTime.toFixed(2)}ms`);
      
      return {
        tool: tool,
        success: result.success,
        result: result,
        executionTime: executionTime
      };
      
    } catch (error) {
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      this.logger.error(`Tool execution failed: ${tool.name} - ${error.message}`);
      
      return {
        tool: tool,
        success: false,
        error: error.message,
        executionTime: executionTime
      };
    }
  }
  
  /**
   * Execute function with timeout
   */
  async executeWithTimeout(fn, timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Tool execution timed out after ${timeout}ms`));
      }, timeout);
      
      fn().then(result => {
        clearTimeout(timer);
        resolve(result);
      }).catch(error => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }
  
  /**
   * Execute multiple tools with concurrency control
   */
  async executeToolsConcurrently(toolExecutions, maxConcurrency = 3) {
    const results = [];
    
    // Execute in batches to respect concurrency limit
    for (let i = 0; i < toolExecutions.length; i += maxConcurrency) {
      const batch = toolExecutions.slice(i, i + maxConcurrency);
      this.logger.info(`Executing batch of ${batch.length} tools`);
      
      const batchPromises = batch.map(execution => 
        this.executeTool(execution.tool, execution.wrapper, execution.files)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process settled promises
      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            tool: batch[j].tool,
            success: false,
            error: result.reason.message,
            critical: true
          });
        }
      }
    }
    
    return results;
  }
  
  /**
   * Get tool execution statistics
   */
  getExecutionStats(results) {
    const stats = {
      total: results.length,
      successful: 0,
      failed: 0,
      totalTime: 0,
      averageTime: 0
    };
    
    for (const result of results) {
      if (result.success) {
        stats.successful++;
      } else {
        stats.failed++;
      }
      
      if (result.executionTime) {
        stats.totalTime += result.executionTime;
      }
    }
    
    stats.averageTime = stats.total > 0 ? stats.totalTime / stats.total : 0;
    
    return stats;
  }
}

module.exports = ToolExecutor;