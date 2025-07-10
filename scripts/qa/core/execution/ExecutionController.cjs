/**
 * Execution Controller - Single Responsibility: Control tool execution with timeouts
 * Extracted from WrapperCoordinator for SOLID compliance
 */

const { performance } = require('perf_hooks');

class ExecutionController {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    // Execution configuration
    this.executionConfig = {
      maxParallelWrappers: config.get('execution.maxParallel', 3),
      defaultTimeout: config.get('execution.defaultTimeout', 300000),
      retryAttempts: config.get('execution.retryAttempts', 2),
      retryDelay: config.get('execution.retryDelay', 1000)
    };
  }
  
  /**
   * Execute tools in parallel with concurrency limit
   */
  async executeToolsInParallel(tools, wrapperManager) {
    const maxConcurrency = Math.min(this.executionConfig.maxParallelWrappers, tools.length);
    const results = [];
    
    // Execute in batches to respect concurrency limit
    for (let i = 0; i < tools.length; i += maxConcurrency) {
      const batch = tools.slice(i, i + maxConcurrency);
      const batchPromises = batch.map(tool => this._executeTool(tool, wrapperManager));
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process settled promises
      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            tool: batch[j],
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
   * Execute tools sequentially
   */
  async executeToolsSequentially(tools, wrapperManager) {
    const results = [];
    
    for (const tool of tools) {
      try {
        const result = await this._executeTool(tool, wrapperManager);
        results.push(result);
      } catch (error) {
        results.push({
          tool: tool,
          success: false,
          error: error.message,
          critical: true
        });
      }
    }
    
    return results;
  }
  
  /**
   * Execute individual tool with wrapper
   */
  async _executeTool(tool, wrapperManager) {
    const wrapper = wrapperManager.getWrapper(tool);
    const startTime = performance.now();
    
    // Fix 4.2: Handle deduplicated tools that return null wrapper
    if (!wrapper) {
      return {
        tool: tool,
        success: true,
        result: { message: 'Tool skipped - handled by dimension wrapper' },
        executionTime: 0,
        skipped: true
      };
    }
    
    try {
      this.logger.info(`Executing tool: ${tool.name}`);
      
      const result = await this._executeWithTimeout(
        () => wrapper.execute(tool),
        tool.config.timeout || this.executionConfig.defaultTimeout
      );
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      return {
        tool: tool,
        success: true,
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
  async _executeWithTimeout(fn, timeout) {
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
   * Check for critical failures that should stop execution
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