/**
 * Tool Configurator - Single Responsibility: Tool Configuration & Optimization
 * Extracted from PlanSelector to follow SRP
 */

const { getPackageManagerService } = require('../services/PackageManagerService.cjs');

class ToolConfigurator {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    // Tool timeout configurations (milliseconds)
    this.toolTimeouts = {
      prettier: 30000,
      black: 30000,
      eslint: 60000,
      pylint: 120000,
      jest: 300000,
      pytest: 300000,
      snyk: 180000,
      bandit: 60000,
      tsc: 120000,
      vite: 180000,
      'python-compile': 90000
    };
    
    // Tool-specific default arguments
    this.toolArgs = {
      prettier: ['--check', '--write'],
      black: ['--check', '--diff'],
      eslint: ['--ext', '.ts,.tsx,.js,.jsx'],
      pylint: ['--rcfile=pyproject.toml'],
      jest: ['--coverage', '--passWithNoTests'],
      pytest: ['--cov', '--cov-report=term'],
      snyk: ['test', '--severity-threshold=medium'],
      bandit: ['-r', '-f', 'json'],
      tsc: ['--noEmit'],
      vite: ['build', '--mode=production'],
      'python-compile': ['-m', 'py_compile']
    };
  }
  
  /**
   * Configure tools with their specific settings (ASYNC)
   */
  async configureTools(tools, mode = 'automatic') {
    const configuredTools = [];
    for (const tool of tools) {
      // Critical Fix: Replace generic "npm" with detected package manager
      const actualToolName = await this._getActualToolName(tool.name);
      
      const config = await this.getToolConfig(actualToolName, tool.scope, mode);
      configuredTools.push({
        ...tool,
        name: actualToolName,  // Update tool name to actual detected tool
        config: config
      });
    }
    return configuredTools;
  }
  
  /**
   * Get complete tool configuration (ASYNC)
   */
  async getToolConfig(toolName, scope, mode = 'automatic') {
    const config = {
      scope: scope,
      mode: mode,
      timeout: this.getToolTimeout(toolName, mode),
      args: await this.getToolArgs(toolName, scope, mode),
      env: this.getToolEnvironment(toolName),
      retries: this.getToolRetries(toolName, mode)
    };
    
    // Add dimension mode flag for dimension mode
    if (mode === 'dimension') {
      config.dimensionMode = true;
    }
    
    return config;
  }
  
  /**
   * Get tool timeout based on mode
   */
  getToolTimeout(toolName, mode = 'automatic') {
    const baseTimeout = this.toolTimeouts[toolName] || 60000;
    
    // Mode-specific timeout adjustments
    const modeMultipliers = {
      fast: 0.2,      // 20% of base timeout for fast mode
      automatic: 1.0, // Full timeout for automatic mode
      scope: 0.8,     // 80% for scope mode
      dod: 1.2,       // 120% for thorough DoD validation
      dimension: 0.7  // Fix 5.2: 70% timeout for dimension mode (optimized commands)
    };
    
    const multiplier = modeMultipliers[mode] || 1.0;
    return Math.round(baseTimeout * multiplier);
  }
  
  /**
   * Get tool-specific arguments (ASYNC)
   */
  async getToolArgs(toolName, scope, mode = 'automatic') {
    const baseArgs = [...(this.toolArgs[toolName] || [])];
    
    // Add mode-specific arguments
    return await this.applyModeSpecificArgs(baseArgs, toolName, mode);
  }
  
  /**
   * Apply mode-specific argument optimizations (ASYNC)
   */
  async applyModeSpecificArgs(args, toolName, mode) {
    const optimizedArgs = [...args];
    
    if (mode === 'fast') {
      switch (toolName) {
        case 'eslint':
          optimizedArgs.push('--cache', '--max-warnings', '0');
          break;
        case 'prettier':
          optimizedArgs.push('--cache');
          break;
        case 'pylint':
          optimizedArgs.push('--errors-only');
          break;
        case 'jest':
          optimizedArgs.push('--bail', '--maxWorkers=2');
          break;
        case 'pytest':
          optimizedArgs.push('--maxfail=1', '--tb=short');
          break;
      }
    } else if (mode === 'dimension') {
      // Fix 5.3: Dimension mode optimizations for validation efficiency
      switch (toolName) {
        case 'tsc':
          optimizedArgs.push('--pretty');
          break;
        case 'vite':
          optimizedArgs.push('--logLevel', 'warn');
          break;
        case 'npm':
          // Use package manager specific optimization args
          try {
            const service = getPackageManagerService();
            const pmOptimizations = await service.getOptimizationArgs('dimension');
            optimizedArgs.push(...pmOptimizations);
          } catch (error) {
            // Fallback to default npm args
            optimizedArgs.push('--silent', '--prefer-offline', '--no-audit');
          }
          break;
      }
    } else if (mode === 'dod') {
      switch (toolName) {
        case 'eslint':
          optimizedArgs.push('--max-warnings', '0');
          break;
        case 'jest':
          optimizedArgs.push('--coverage', '--coverageThreshold', '{"global":{"statements":80}}');
          break;
        case 'pytest':
          optimizedArgs.push('--cov-fail-under=80');
          break;
      }
    }
    
    return optimizedArgs;
  }
  
  /**
   * Get tool environment variables
   */
  getToolEnvironment(toolName) {
    const environments = {
      jest: { NODE_ENV: 'test' },
      pytest: { PYTHONPATH: '.', COVERAGE_PROCESS_START: '.coveragerc' },
      snyk: { SNYK_TOKEN: process.env.SNYK_TOKEN || '' },
      eslint: { NODE_OPTIONS: '--max-old-space-size=4096' },
      tsc: { NODE_OPTIONS: '--max-old-space-size=4096' }
    };
    
    return environments[toolName] || {};
  }
  
  /**
   * Get tool retry configuration
   */
  getToolRetries(toolName, mode = 'automatic') {
    const retryConfigs = {
      snyk: { count: 2, delay: 1000 }, // Network-dependent
      jest: { count: 1, delay: 0 },    // Usually deterministic
      pytest: { count: 1, delay: 0 },  // Usually deterministic
      eslint: { count: 0, delay: 0 },  // Fast, no retries needed
      prettier: { count: 0, delay: 0 } // Fast, no retries needed
    };
    
    const baseRetry = retryConfigs[toolName] || { count: 0, delay: 0 };
    
    // Reduce retries in fast mode
    if (mode === 'fast') {
      baseRetry.count = Math.max(0, baseRetry.count - 1);
    }
    
    return baseRetry;
  }
  
  /**
   * Estimate total execution duration for configured tools
   */
  estimateExecutionDuration(configuredTools) {
    const totalTimeout = configuredTools.reduce((total, tool) => {
      return total + tool.config.timeout;
    }, 0);
    
    // Account for parallel execution potential
    const parallelizableTools = configuredTools.filter(tool => 
      ['eslint', 'prettier', 'black'].includes(tool.name)
    );
    
    const sequentialTools = configuredTools.filter(tool => 
      !['eslint', 'prettier', 'black'].includes(tool.name)
    );
    
    const parallelDuration = parallelizableTools.length > 0 
      ? Math.max(...parallelizableTools.map(tool => tool.config.timeout))
      : 0;
    
    const sequentialDuration = sequentialTools.reduce((total, tool) => {
      return total + tool.config.timeout;
    }, 0);
    
    return parallelDuration + sequentialDuration;
  }
  
  /**
   * Get configuration summary for logging
   */
  getConfigurationSummary(configuredTools) {
    const totalDuration = this.estimateExecutionDuration(configuredTools);
    const toolsByDimension = configuredTools.reduce((acc, tool) => {
      acc[tool.dimension] = (acc[tool.dimension] || 0) + 1;
      return acc;
    }, {});
    
    return {
      totalTools: configuredTools.length,
      estimatedDuration: totalDuration,
      toolsByDimension,
      modes: [...new Set(configuredTools.map(tool => tool.config.mode))]
    };
  }

  /**
   * Get actual tool name (replaces generic npm with detected package manager)
   */
  async _getActualToolName(toolName) {
    if (toolName === 'npm') {
      try {
        const packageManagerService = getPackageManagerService();
        const detectedManager = await packageManagerService.getManager();
        
        this.logger.info(`Package manager detected: ${detectedManager} (replacing generic "npm")`);
        return detectedManager;
      } catch (error) {
        this.logger.warn(`Failed to detect package manager: ${error.message}. Using fallback: npm`);
        return 'npm'; // Fallback to npm if detection fails
      }
    }
    
    return toolName; // Return unchanged for non-npm tools
  }
}

module.exports = ToolConfigurator;