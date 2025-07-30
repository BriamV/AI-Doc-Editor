/**
 * BuildConfigManager.cjs - Build Configuration Manager
 * Conservative extraction from BuildConfig.cjs lines 1-162
 * No new functionality added - exact mapping only
 */

const path = require('path');
const fs = require('fs');
const { getPackageManagerService } = require('../../services/PackageManagerService.cjs');
const ToolTypeClassifier = require('../../tools/ToolTypeClassifier.cjs');

class BuildConfigManager {
  constructor(qaConfig, logger) {
    this.qaConfig = qaConfig;
    this.logger = logger;
    
    // Cache for tool configurations
    this.toolConfigs = new Map();
    this.projectRoot = process.cwd();
    
    // Lazy initialization of package manager service
    this._packageManagerService = null;
    this._commandCache = new Map();
    
    // Modular components
    this.toolTypeClassifier = new ToolTypeClassifier(qaConfig, logger);
    
    // Build tool definitions (NO COMMANDS EVALUATED HERE)
    this.buildTools = {
      npm: {
        name: 'npm',
        dimension: 'build',
        // Commands are now evaluated lazily via getCommand()
        commandTemplates: {
          install: 'package-manager-install',
          audit: 'package-manager-audit',
          outdated: 'package-manager-outdated'
        },
        requiredFiles: ['package.json'],
        optionalFiles: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'],
        timeout: 90000
      },
      tsc: {
        name: 'tsc',
        dimension: 'build',
        commandTemplates: {
          check: 'yarn exec tsc --noEmit',
          build: 'yarn exec tsc'
        },
        requiredFiles: ['tsconfig.json'],
        alternativeFiles: [['tsconfig.json', 'jsconfig.json']],
        timeout: 60000
      },
      vite: {
        name: 'vite',
        dimension: 'build',
        commandTemplates: {
          build: 'yarn exec vite build',
          check: 'yarn exec vite build --mode development'
        },
        requiredFiles: ['vite.config.ts', 'vite.config.js'],
        alternativeFiles: [['vite.config.ts', 'vite.config.js', 'vite.config.mjs']],
        timeout: 120000
      },
      pip: {
        name: 'pip',
        dimension: 'build',
        commandTemplates: {
          install: 'pip install -r requirements.txt',
          check: 'pip check',
          list: 'pip list'
        },
        requiredFiles: ['requirements.txt'],
        optionalFiles: ['setup.py', 'pyproject.toml'],
        timeout: 90000
      }
    };
  }

  /**
   * Get package manager service (lazy initialization)
   */
  async _getPackageManagerService() {
    if (!this._packageManagerService) {
      this._packageManagerService = getPackageManagerService();
      await this._packageManagerService.initialize();
    }
    return this._packageManagerService;
  }

  /**
   * Get tool configuration with lazy evaluation
   */
  async getToolConfig(toolName) {
    // Return cached config if available
    if (this.toolConfigs.has(toolName)) {
      return this.toolConfigs.get(toolName);
    }
    
    // Modular fix: Use ToolTypeClassifier for scalable tool resolution
    let baseTool = this.buildTools[toolName];
    
    // If tool not found, try to resolve using systematic tool type classification
    if (!baseTool) {
      try {
        const toolType = await this.toolTypeClassifier.getToolType(toolName);
        baseTool = await this._getTemplateForToolType(toolType, toolName);
        
        if (baseTool) {
          this.logger.info(`BuildConfig: Using '${toolType}' template for tool '${toolName}'`);
        }
      } catch (error) {
        this.logger.debug(`BuildConfig: Could not classify tool '${toolName}': ${error.message}`);
      }
    }
    
    // Final validation
    if (!baseTool) {
      const availableTools = await this.getAvailableTools(); // Use dynamic available tools
      throw new Error(`Unknown build tool: ${toolName}. Available tools: ${availableTools.join(', ')}`);
    }
    
    // Validate base tool structure
    if (!baseTool.commandTemplates || typeof baseTool.commandTemplates !== 'object') {
      throw new Error(`Invalid base tool configuration for '${toolName}': missing or invalid commandTemplates object`);
    }
    
    // Get configuration from qa-config.json
    const qaToolConfig = this.qaConfig.get(`toolConfigurations.${toolName}`, {});
    
    // Convert commandTemplates to actual commands (LAZY EVALUATION)
    const resolvedCommands = {};
    for (const [action, template] of Object.entries(baseTool.commandTemplates)) {
      try {
        resolvedCommands[action] = await this._resolveCommandTemplate(template, toolName, action);
      } catch (error) {
        this.logger.error(`Failed to resolve command template for ${toolName}.${action}: ${error.message}`);
        // Use template as fallback command
        resolvedCommands[action] = template;
      }
    }
    
    // Safe merge with validation
    const config = {
      ...baseTool,
      ...qaToolConfig,
      commands: resolvedCommands,
      commandTemplates: baseTool.commandTemplates // Keep templates for reference
    };
    
    // Validate tool environment
    const validation = await this._validateToolEnvironment(config);
    config.validation = validation;
    
    // Cache the configuration
    this.toolConfigs.set(toolName, config);
    
    return config;
  }

  /**
   * Get all available build tools (with dynamic package manager detection)
   */
  async getAvailableTools() {
    try {
      const service = await this._getPackageManagerService();
      const detectedManager = await service.getManager();
      
      // Modular solution: Use package manager service instead of hardcoded mapping
      const packageManagerTool = detectedManager; // Dynamic, not hardcoded
      const staticNonPackageManagerTools = Object.keys(this.buildTools).filter(tool => tool !== 'npm');
      
      this.logger.info(`BuildConfig: Using detected package manager '${detectedManager}'`);
      return [packageManagerTool, ...staticNonPackageManagerTools];
    } catch (error) {
      this.logger.warn(`BuildConfig: Failed to detect package manager, using npm fallback: ${error.message}`);
      return Object.keys(this.buildTools); // Fallback to static list
    }
  }

  /**
   * Get template configuration for tool type (scalable approach)
   */
  async _getTemplateForToolType(toolType, toolName) {
    const typeTemplates = {
      'package-manager': () => this._getPackageManagerTemplate(),
      'compiler': () => this._getCompilerTemplate(toolName),
      'bundler': () => this._getBundlerTemplate(toolName),
      'dependency-manager': () => this._getDependencyManagerTemplate(toolName)
    };
    
    const templateFn = typeTemplates[toolType];
    if (templateFn) {
      return await templateFn();
    }
    
    return null; // No template available for this type
  }

  /**
   * Get package manager template (dynamic, not hardcoded)
   */
  async _getPackageManagerTemplate() {
    // Use npm as base template for all package managers (modular approach)
    const npmTemplate = this.buildTools['npm'];
    if (npmTemplate) {
      return { ...npmTemplate }; // Return copy to avoid mutation
    }
    
    // Fallback: create generic package manager template
    return {
      name: 'package-manager',
      dimension: 'build',
      commandTemplates: {
        install: 'package-manager-install',
        audit: 'package-manager-audit',
        outdated: 'package-manager-outdated'
      },
      requiredFiles: ['package.json'],
      optionalFiles: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'],
      timeout: 90000
    };
  }

  /**
   * Get compiler template (extensible for new compilers)
   */
  async _getCompilerTemplate(toolName) {
    if (toolName === 'tsc') {
      return this.buildTools['tsc'];
    }
    
    // Generic compiler template for future compilers
    return {
      name: toolName,
      dimension: 'build',
      commandTemplates: {
        check: `yarn exec ${toolName} --check`,
        build: `yarn exec ${toolName} --build`
      },
      requiredFiles: [],
      timeout: 60000
    };
  }

  /**
   * Get bundler template (extensible for new bundlers) 
   */
  async _getBundlerTemplate(toolName) {
    if (toolName === 'vite') {
      return this.buildTools['vite'];
    }
    
    // Generic bundler template for future bundlers
    return {
      name: toolName,
      dimension: 'build',
      commandTemplates: {
        build: `yarn exec ${toolName} build`,
        check: `yarn exec ${toolName} build --mode development`
      },
      requiredFiles: [],
      timeout: 60000
    };
  }

  /**
   * Get dependency manager template (extensible for new languages)
   */
  async _getDependencyManagerTemplate(toolName) {
    if (toolName === 'pip') {
      return this.buildTools['pip'];
    }
    
    // Generic dependency manager template
    return {
      name: toolName,
      dimension: 'build',
      commandTemplates: {
        install: `${toolName} install`,
        check: `${toolName} check`
      },
      requiredFiles: [],
      timeout: 90000
    };
  }

  /**
   * Clear command cache (useful for testing or when package manager changes)
   */
  clearCache() {
    this._commandCache.clear();
    this.toolConfigs.clear();
    if (this._packageManagerService) {
      this._packageManagerService.clearCache();
    }
    this.logger.info('BuildConfig: All caches cleared');
  }

  /**
   * Reset package manager service (useful for testing)
   */
  resetPackageManagerService() {
    if (this._packageManagerService) {
      this._packageManagerService.reset();
    }
    this._packageManagerService = null;
    this.clearCache();
  }
}

module.exports = BuildConfigManager;