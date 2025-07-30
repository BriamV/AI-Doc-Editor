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
    
    // Ensure defaultTimeout is never undefined
    if (!this.executionConfig.defaultTimeout) {
      this.executionConfig.defaultTimeout = 300000; // 5 minutes fallback
    }
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
    // CRITICAL FIX: Use tool.name instead of tool object
    const toolName = typeof tool === 'string' ? tool : tool.name;
    const wrapper = await wrapperManager.getWrapper(toolName);
    const startTime = performance.now();
    
    // CRITICAL DEBUG: Log wrapper acquisition
    this.logger.info(`ExecutionController: Getting wrapper for tool "${toolName}"`);
    this.logger.info(`ExecutionController: Wrapper result: ${wrapper ? 'found' : 'null'}`);
    
    // Fix 4.2: Handle deduplicated tools that return null wrapper
    if (!wrapper) {
      this.logger.warn(`ExecutionController: No wrapper found for ${toolName}, using dimension wrapper path`);
      // Get meaningful status from the dimension wrapper execution
      const dimensionResult = await this._getDimensionWrapperStatus(tool);
      
      return {
        tool: tool,
        success: dimensionResult.success,
        result: dimensionResult.result,
        executionTime: dimensionResult.executionTime || 0,
        skipped: false, // Not really skipped, executed in dimension wrapper
        error: dimensionResult.error
      };
    }
    
    try {
      this.logger.info(`Executing tool: ${tool.name}`);
      
      const actualTimeout = tool.config.timeout || this.executionConfig.defaultTimeout;
      
      const result = await this._executeWithTimeout(
        () => wrapper.execute(tool),
        actualTimeout
      );
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      return {
        tool: tool,
        success: result.success,  // Critical Fix: Use wrapper's success value, not hardcoded true
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
   * Get meaningful status from dimension wrapper for user-friendly reporting
   */
  async _getDimensionWrapperStatus(tool) {
    // Modular approach: Create clear, user-friendly messages 
    // without complex result extraction that might fail
    
    const toolType = await this._getToolTypeDescription(tool.name);
    
    return {
      success: null, // Unknown until build dimension completes
      result: {
        message: `🔄 ${tool.name} (${toolType}) is being validated within the build dimension`,
        status: 'included-in-build',
        action: 'dimension-validation',
        summary: `This tool is part of the comprehensive build validation. Check the build dimension results for specific ${tool.name} status.`,
        userGuidance: `To see detailed ${tool.name} results, look for the build dimension output above.`
      },
      executionTime: 0,
      error: null // No error, just different execution model
    };
  }
  
  /**
   * Get user-friendly tool type description (scalable)
   */
  async _getToolTypeDescription(toolName) {
    // Use ToolTypeClassifier if available, fallback to simple mapping
    try {
      const ToolTypeClassifier = require('../tools/ToolTypeClassifier.cjs');
      const classifier = new ToolTypeClassifier(this.config, this.logger);
      const toolType = await classifier.getToolType(toolName);
      
      const typeDescriptions = {
        'package-manager': 'dependency installer',
        'compiler': 'code compiler',
        'bundler': 'asset bundler',
        'dependency-manager': 'dependency manager',
        'linter': 'code linter',
        'formatter': 'code formatter',
        'test-runner': 'test runner',
        'security-scanner': 'security scanner'
      };
      
      return typeDescriptions[toolType] || toolType;
    } catch (error) {
      // Fallback to simple tool descriptions
      const simpleDescriptions = {
        yarn: 'dependency installer',
        npm: 'dependency installer', 
        pnpm: 'dependency installer',
        tsc: 'TypeScript compiler',
        vite: 'build tool',
        eslint: 'code linter',
        prettier: 'code formatter'
      };
      
      return simpleDescriptions[toolName] || 'development tool';
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