/**
 * BuildConfig.cjs - Build Tool Configuration Management (REDESIGNED)
 * T-11: Configuration for npm, tsc, pip build validators
 * 
 * REDESIGN: Lazy evaluation of commands with robust error handling
 * Single Responsibility: Configuration management for build tools
 * Open/Closed: Extensible for new build tools
 * Dependencies: Inverted through constructor injection
 */

const path = require('path');
const fs = require('fs');
const { getPackageManagerService } = require('../../services/PackageManagerService.cjs');

class BuildConfig {
  constructor(qaConfig, logger) {
    this.qaConfig = qaConfig;
    this.logger = logger;
    
    // Cache for tool configurations
    this.toolConfigs = new Map();
    this.projectRoot = process.cwd();
    
    // Lazy initialization of package manager service
    this._packageManagerService = null;
    this._commandCache = new Map();
    
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
          check: 'npx tsc --noEmit --incremental --tsBuildInfoFile .tsbuildinfo-check',
          build: 'npx tsc --build'
        },
        requiredFiles: ['tsconfig.json'],
        optionalFiles: ['tsconfig.build.json'],
        timeout: 60000
      },
      pip: {
        name: 'pip',
        dimension: 'build',
        commandTemplates: {
          install: 'pip install -r requirements.txt',
          check: 'pip check',
          outdated: 'pip list --outdated'
        },
        requiredFiles: ['requirements.txt'],
        optionalFiles: ['requirements-dev.txt', 'pyproject.toml'],
        timeout: 180000
      },
      vite: {
        name: 'vite',
        dimension: 'build',
        commandTemplates: {
          check: 'npx vite build --mode development --emptyOutDir false --minify false --sourcemap false',
          build: 'npx vite build'
        },
        requiredFiles: [],
        alternativeFiles: [['vite.config.js', 'vite.config.ts']], // At least one must exist
        optionalFiles: ['package.json'],
        timeout: 60000
      }
    };
  }
  
  /**
   * Lazy initialization of package manager service
   */
  async _getPackageManagerService() {
    if (!this._packageManagerService) {
      this._packageManagerService = getPackageManagerService(this.projectRoot, this.logger);
    }
    return this._packageManagerService;
  }
  
  /**
   * Get configuration for specific build tool
   */
  async getToolConfig(toolName) {
    if (this.toolConfigs.has(toolName)) {
      return this.toolConfigs.get(toolName);
    }
    
    // Enhanced validation before accessing configuration
    const baseTool = this.buildTools[toolName];
    if (!baseTool) {
      const availableTools = Object.keys(this.buildTools).join(', ');
      throw new Error(`Unknown build tool: ${toolName}. Available tools: ${availableTools}`);
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
   * Resolve command template to actual command (LAZY EVALUATION)
   */
  async _resolveCommandTemplate(template, toolName, action) {
    // Check cache first
    const cacheKey = `${toolName}_${action}_${template}`;
    if (this._commandCache.has(cacheKey)) {
      return this._commandCache.get(cacheKey);
    }
    
    let resolvedCommand;
    
    try {
      // Handle package manager templates
      if (template === 'package-manager-install') {
        const service = await this._getPackageManagerService();
        resolvedCommand = await service.getInstallCommand();
      } else if (template === 'package-manager-audit') {
        const service = await this._getPackageManagerService();
        resolvedCommand = await service.getAuditCommand();
      } else if (template === 'package-manager-outdated') {
        const service = await this._getPackageManagerService();
        resolvedCommand = await service.getOutdatedCommand();
      } else {
        // Static template - use as is
        resolvedCommand = template;
      }
      
      // Cache the resolved command
      this._commandCache.set(cacheKey, resolvedCommand);
      
      this.logger.info(`Resolved command for ${toolName}.${action}: ${resolvedCommand}`);
      return resolvedCommand;
      
    } catch (error) {
      this.logger.error(`Failed to resolve command template '${template}' for ${toolName}.${action}: ${error.message}`);
      
      // Fallback logic with PackageManagerService
      if (template.startsWith('package-manager-')) {
        try {
          const packageManagerService = getPackageManagerService();
          await packageManagerService.initialize();
          
          const manager = packageManagerService.getManager();
          const fallbackCommands = {
            'package-manager-install': packageManagerService.getInstallCommand() + ' --prefer-offline --no-audit --silent',
            'package-manager-audit': `${manager} audit --audit-level moderate`,
            'package-manager-outdated': `${manager} outdated`
          };
          resolvedCommand = fallbackCommands[template] || template;
          this.logger.info(`Using package manager command for ${toolName}.${action}: ${resolvedCommand}`);
        } catch (error) {
          // Emergency fallback with intelligent package manager detection
          this.logger.warn(`PackageManagerService failed: ${error.message}`);
          
          const emergencyManager = this._detectEmergencyPackageManager();
          const fallbackCommands = {
            'package-manager-install': `${emergencyManager} install --prefer-offline --silent`,
            'package-manager-audit': `${emergencyManager} audit --audit-level moderate`,
            'package-manager-outdated': `${emergencyManager} outdated`
          };
          
          resolvedCommand = fallbackCommands[template] || template;
          this.logger.warn(`Using emergency ${emergencyManager} fallback for ${toolName}.${action}: ${resolvedCommand}`);
        }
      } else {
        resolvedCommand = template;
      }
      
      // Cache the fallback
      this._commandCache.set(cacheKey, resolvedCommand);
      return resolvedCommand;
    }
  }
  
  /**
   * Validate tool environment and dependencies
   */
  async _validateToolEnvironment(config) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      requiredFiles: [],
      optionalFiles: []
    };
    
    // Check required files
    for (const file of config.requiredFiles) {
      const filePath = path.join(this.projectRoot, file);
      try {
        await fs.access(filePath);
        validation.requiredFiles.push({ file, exists: true, path: filePath });
      } catch (error) {
        validation.isValid = false;
        validation.errors.push(`Required file not found: ${file}`);
        validation.requiredFiles.push({ file, exists: false, path: filePath });
      }
    }
    
    // Check alternative files (at least one from each group must exist)
    if (config.alternativeFiles && config.alternativeFiles.length > 0) {
      validation.alternativeFiles = [];
      for (const fileGroup of config.alternativeFiles) {
        let groupHasValidFile = false;
        const groupValidation = { files: [], hasValidFile: false };
        
        for (const file of fileGroup) {
          const filePath = path.join(this.projectRoot, file);
          try {
            await fs.access(filePath);
            groupValidation.files.push({ file, exists: true, path: filePath });
            groupHasValidFile = true;
          } catch (error) {
            groupValidation.files.push({ file, exists: false, path: filePath });
          }
        }
        
        groupValidation.hasValidFile = groupHasValidFile;
        validation.alternativeFiles.push(groupValidation);
        
        if (!groupHasValidFile) {
          validation.isValid = false;
          validation.errors.push(`None of the required alternative files found: ${fileGroup.join(', ')}`);
        }
      }
    }
    
    // Check optional files
    for (const file of config.optionalFiles || []) {
      const filePath = path.join(this.projectRoot, file);
      try {
        await fs.access(filePath);
        validation.optionalFiles.push({ file, exists: true, path: filePath });
      } catch (error) {
        validation.optionalFiles.push({ file, exists: false, path: filePath });
      }
    }
    
    return validation;
  }
  
  /**
   * Get command for specific tool and action (LAZY EVALUATION)
   */
  async getCommand(toolName, action = 'check') {
    // Get tool config (which resolves commands lazily)
    const config = await this.getToolConfig(toolName);
    
    // Validate commands object exists
    if (!config.commands || typeof config.commands !== 'object') {
      throw new Error(`Invalid commands configuration for tool '${toolName}'`);
    }
    
    const command = config.commands[action];
    if (!command) {
      const availableActions = Object.keys(config.commands).join(', ');
      throw new Error(`Unknown action '${action}' for tool '${toolName}'. Available actions: ${availableActions}`);
    }
    
    // Validate command is string before splitting
    if (typeof command !== 'string') {
      throw new Error(`Invalid command configuration for tool '${toolName}', action '${action}': expected string, got ${typeof command}`);
    }
    
    // Smart command parsing that preserves arguments properly
    return this._parseCommand(command);
  }
  
  /**
   * Get timeout for specific tool
   */
  getTimeout(toolName) {
    const config = this.buildTools[toolName];
    return config ? config.timeout : 60000;
  }
  
  /**
   * Get working directory for tool
   */
  getWorkingDirectory(toolName) {
    const qaConfig = this.qaConfig.get(`toolConfigurations.${toolName}.workingDirectory`, '.');
    return path.resolve(this.projectRoot, qaConfig);
  }
  
  /**
   * Get all available build tools
   */
  getAvailableTools() {
    return Object.keys(this.buildTools);
  }
  
  /**
   * Check if tool is applicable to current scope
   */
  isToolApplicable(toolName, scope) {
    const tools = this.qaConfig.get('tools.build', {});
    const scopeTools = tools[scope] || tools['all'] || [];
    return scopeTools.includes(toolName);
  }
  
  /**
   * Get package manager info for debugging
   */
  async getPackageManagerInfo() {
    try {
      const service = await this._getPackageManagerService();
      return await service.getInfo();
    } catch (error) {
      return {
        manager: 'unknown',
        error: error.message,
        initialized: false
      };
    }
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
  
  /**
   * Smart command parsing that handles quoted arguments and boolean values correctly
   */
  _parseCommand(commandString) {
    const args = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < commandString.length; i++) {
      const char = commandString[i];
      
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
      } else if (char === ' ' && !inQuotes) {
        if (current.trim()) {
          args.push(current.trim());
          current = '';
        }
      } else {
        current += char;
      }
    }
    
    if (current.trim()) {
      args.push(current.trim());
    }
    
    return args;
  }

  /**
   * Emergency package manager detection when PackageManagerService fails
   * Uses simple file-based detection and system availability checks
   */
  _detectEmergencyPackageManager() {
    try {
      // 1. Check for lock files in current directory (most reliable)
      if (fs.existsSync('yarn.lock')) {
        this.logger.info('Emergency detection: Found yarn.lock, using yarn');
        return 'yarn';
      }
      
      if (fs.existsSync('pnpm-lock.yaml')) {
        this.logger.info('Emergency detection: Found pnpm-lock.yaml, using pnpm');
        return 'pnpm';
      }
      
      if (fs.existsSync('package-lock.json')) {
        this.logger.info('Emergency detection: Found package-lock.json, using npm');
        return 'npm';
      }

      // 2. If no lock files, check what's available in system PATH
      // This is a basic check - in emergency we can't do complex detection
      try {
        require('child_process').execSync('yarn --version', { stdio: 'ignore' });
        this.logger.info('Emergency detection: yarn available in PATH, using yarn');
        return 'yarn';
      } catch (e) {
        // yarn not available
      }

      try {
        require('child_process').execSync('pnpm --version', { stdio: 'ignore' });
        this.logger.info('Emergency detection: pnpm available in PATH, using pnpm');
        return 'pnpm';
      } catch (e) {
        // pnpm not available
      }

      // 3. Final fallback to npm (most universally available)
      this.logger.warn('Emergency detection: No lock files or alternative package managers found, using npm');
      return 'npm';
      
    } catch (error) {
      // If everything fails, use npm as last resort
      this.logger.error(`Emergency package manager detection failed: ${error.message}, using npm`);
      return 'npm';
    }
  }
}

module.exports = BuildConfig;