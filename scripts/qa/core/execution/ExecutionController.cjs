/**
 * Execution Controller - Single Responsibility: Control tool execution with timeouts
 * Extracted from WrapperCoordinator for SOLID compliance
 */

const { performance } = require('perf_hooks');

class ExecutionController {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    // Execution configuration with robust fallbacks
    this.executionConfig = {
      maxParallelWrappers: this._getConfigValue(config, 'execution.maxParallel', 3),
      defaultTimeout: this._getConfigValue(config, 'execution.defaultTimeout', 300000),
      retryAttempts: this._getConfigValue(config, 'execution.retryAttempts', 2),
      retryDelay: this._getConfigValue(config, 'execution.retryDelay', 1000)
    };
    
    // Ensure critical values are never undefined/NaN
    if (!this.executionConfig.maxParallelWrappers || isNaN(this.executionConfig.maxParallelWrappers)) {
      this.executionConfig.maxParallelWrappers = 3; // Safe fallback
    }
    if (!this.executionConfig.defaultTimeout || isNaN(this.executionConfig.defaultTimeout)) {
      this.executionConfig.defaultTimeout = 300000; // 5 minutes fallback
    }
    
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
   */
  async executeToolsInParallel(tools, wrapperManager) {
    this.logger.info(`🔧 ExecutionController: executeToolsInParallel called with ${tools.length} tools`);
    tools.forEach((tool, i) => {
      this.logger.info(`🔧 ExecutionController: Tool ${i + 1}: ${typeof tool === 'string' ? tool : tool.name}`);
    });
    
    this.logger.info(`🔧 ExecutionController: maxParallelWrappers = ${this.executionConfig.maxParallelWrappers}`);
    this.logger.info(`🔧 ExecutionController: tools.length = ${tools.length}`);
    const maxConcurrency = Math.min(this.executionConfig.maxParallelWrappers, tools.length);
    this.logger.info(`🔧 ExecutionController: maxConcurrency = ${maxConcurrency}`);
    const results = [];
    
    // Execute in batches to respect concurrency limit
    for (let i = 0; i < tools.length; i += maxConcurrency) {
      const batch = tools.slice(i, i + maxConcurrency);
      this.logger.info(`🔧 ExecutionController: Processing batch of ${batch.length} tools`);
      
      const batchPromises = batch.map(tool => {
        this.logger.info(`🔧 ExecutionController: Creating promise for tool ${typeof tool === 'string' ? tool : tool.name}`);
        return this._executeTool(tool, wrapperManager);
      });
      
      this.logger.info(`🔧 ExecutionController: Waiting for ${batchPromises.length} promises`);
      const batchResults = await Promise.allSettled(batchPromises);
      this.logger.info(`🔧 ExecutionController: Got ${batchResults.length} batch results`);
      
      // Process settled promises
      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        this.logger.info(`🔧 ExecutionController: Processing result ${j}: status=${result.status}`);
        
        if (result.status === 'fulfilled') {
          this.logger.info(`🔧 ExecutionController: Fulfilled result: ${JSON.stringify(result.value)}`);
          results.push(result.value);
        } else {
          this.logger.error(`🔧 ExecutionController: Rejected result: ${result.reason.message}`);
          results.push({
            tool: batch[j],
            success: false,
            error: result.reason.message,
            critical: true
          });
        }
      }
      
      this.logger.info(`🔧 ExecutionController: Batch processed, total results: ${results.length}`);
    }
    
    this.logger.info(`🔧 ExecutionController: executeToolsInParallel completed with ${results.length} results`);
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
    this.logger.info(`🔧 ExecutionController: Getting wrapper for tool "${toolName}"`);
    this.logger.info(`🔧 ExecutionController: Tool object: ${JSON.stringify(tool)}`);
    this.logger.info(`🔧 ExecutionController: Wrapper result: ${wrapper ? 'found - ' + wrapper.getName() : 'null'}`);
    
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
      
      // ARCHITECTURAL FIX: Handle different wrapper interfaces
      let result;
      
      if (wrapper.getName() === 'direct-linters' || typeof wrapper.getFilesForTool === 'function') {
        // Orchestrator wrappers: use execute(tool) interface
        this.logger.debug(`Using orchestrator interface for ${tool.name}`);
        result = await this._executeWithTimeout(
          () => wrapper.execute(tool),
          actualTimeout
        );
      } else {
        // Individual wrappers: use execute(files, options) interface  
        this.logger.debug(`Using individual wrapper interface for ${tool.name}`);
        const files = await this._getFilesForTool(tool);
        const options = tool.config || {};
        
        this.logger.info(`${tool.name}: Found ${files.length} files to process`);
        if (files.length > 0) {
          this.logger.debug(`${tool.name} files sample: ${files.slice(0, 3).join(', ')}`);
        }
        
        result = await this._executeWithTimeout(
          () => wrapper.execute(files, options),
          actualTimeout
        );
      }
      
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
   * Get files for tool execution (extracted from DirectLintersOrchestrator)
   */
  async _getFilesForTool(tool) {
    try {
      // If tool has specific files configured, use those
      if (tool.config && tool.config.files && Array.isArray(tool.config.files)) {
        return tool.config.files;
      }
      
      // If tool has scope configuration, use scope-based file discovery
      if (tool.config && tool.config.scope) {
        return await this._getFilesForScope(tool.config.scope);
      }
      
      // Default: auto-discovery based on common patterns
      return await this._getDefaultFiles();
      
    } catch (error) {
      this.logger.warn(`Error getting files for tool ${tool.name}: ${error.message}`);
      return await this._getDefaultFiles();
    }
  }

  /**
   * Get files for specific scope (extracted from DirectLintersOrchestrator)
   */
  async _getFilesForScope(scope) {
    const fs = require('fs');
    const path = require('path');
    
    // Support 5 scopes as per PRD-QA CLI specification
    const scopePatterns = {
      frontend: {
        dirs: ['src', 'components'],
        patterns: [/\.(js|jsx|ts|tsx)$/]
      },
      backend: {
        dirs: ['backend', 'api', 'server'],
        patterns: [/\.py$/]
      },
      docs: {
        dirs: ['docs', '.'],
        patterns: [/\.md$/],
        maxDepth: 2
      },
      config: {
        dirs: ['.', 'config', '.github'],
        patterns: [/\.(json|yml|yaml)$/],
        maxDepth: 1
      },
      tooling: {
        dirs: ['scripts', 'tools', '.'],
        patterns: [/\.(cjs|sh)$/],
        maxDepth: 2
      },
      all: {
        dirs: ['src', 'components', 'backend', 'api', 'server', 'docs', 'scripts', 'tools', '.'],
        patterns: [/\.(js|jsx|ts|tsx|py|md|json|yml|yaml|cjs|sh)$/],
        maxDepth: 3
      }
    };
    
    const scopeConfig = scopePatterns[scope] || scopePatterns.all;
    const files = [];
    
    // Use actual file discovery with scope-specific patterns
    for (const baseDir of scopeConfig.dirs) {
      for (const pattern of scopeConfig.patterns) {
        files.push(...this._expandPattern(baseDir, pattern, scopeConfig.maxDepth || 3));
      }
    }
    
    // Remove duplicates and non-existent files
    const uniqueFiles = [...new Set(files)].filter(file => {
      try {
        return fs.existsSync(file);
      } catch {
        return false;
      }
    });
    
    this.logger.debug(`Scope ${scope}: Found ${uniqueFiles.length} files`);
    if (uniqueFiles.length > 0) {
      this.logger.debug(`First 5 files: ${uniqueFiles.slice(0, 5).join(', ')}`);
    }
    
    return uniqueFiles.length > 0 ? uniqueFiles : await this._getDefaultFiles();
  }

  /**
   * Get default files for processing
   */
  async _getDefaultFiles() {
    const files = [];
    
    // JavaScript/TypeScript files
    files.push(...this._expandPattern('src', /\.(js|jsx|ts|tsx)$/));
    files.push(...this._expandPattern('components', /\.(js|jsx|ts|tsx)$/));
    
    // Python files
    files.push(...this._expandPattern('backend', /\.py$/));
    files.push(...this._expandPattern('api', /\.py$/));
    
    // Configuration files
    files.push(...this._expandPattern('.', /\.(json|yml|yaml)$/, 1)); // max depth 1 for config files
    
    return files;
  }

  /**
   * Simple file pattern expansion (replaces complex glob dependencies)
   */
  _expandPattern(baseDir, pattern, maxDepth = 3) {
    const fs = require('fs');
    const path = require('path');
    const results = [];
    
    // CRITICAL FIX: Add directory exclusions to prevent processing node_modules, .venv, etc.
    const excludedDirs = new Set([
      'node_modules',
      '.venv',
      'venv',
      '__pycache__',
      '.git',
      'dist',
      'build',
      'coverage',
      '.nyc_output',
      'megalinter-reports',
      'qa-reports',
      '.pytest_cache',
      '.coverage',
      'htmlcov',
      '.next',
      '.nuxt',
      'out'
    ]);
    
    const walkDir = (dir, currentDepth = 0) => {
      if (currentDepth > maxDepth) return;
      
      try {
        if (!fs.existsSync(dir)) return;
        
        const items = fs.readdirSync(dir);
        for (const item of items) {
          // Skip excluded directories
          if (excludedDirs.has(item)) {
            continue;
          }
          
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory() && currentDepth < maxDepth) {
            walkDir(fullPath, currentDepth + 1);
          } else if (stat.isFile() && pattern.test(item)) {
            // CRITICAL FIX: Normalize Windows paths to use forward slashes
            const normalizedPath = fullPath.replace(/\\/g, '/');
            results.push(normalizedPath);
          }
        }
      } catch (error) {
        // Silently ignore errors (permission issues, etc.)
      }
    };
    
    walkDir(baseDir);
    return results;
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