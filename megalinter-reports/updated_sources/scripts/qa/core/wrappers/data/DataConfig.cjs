/**
 * DataConfig.cjs - Data Validation Configuration Management
 * T-12: Configuration for Spectral and Django migration validators
 * 
 * Single Responsibility: Configuration management for data validation tools
 * Open/Closed: Extensible for new data validation tools
 * Dependencies: Inverted through constructor injection
 */

const path = require('path');
const fs = require('fs').promises;

class DataConfig {
  constructor(qaConfig, logger) {
    this.qaConfig = qaConfig;
    this.logger = logger;
    
    // Cache for tool configurations
    this.toolConfigs = new Map();
    this.projectRoot = process.cwd();
    
    // Data validation tool definitions
    this.dataTools = {
      spectral: {
        name: 'spectral',
        dimension: 'data',
        commands: {
          lint: 'yarn exec @stoplight/spectral-cli lint',
          validate: 'yarn exec @stoplight/spectral-cli lint --format json'
        },
        requiredFiles: [],
        optionalFiles: ['.spectral.yml', '.spectral.yaml', '.spectral.json'],
        patterns: ['**/openapi.{yaml,yml,json}', '**/swagger.{yaml,yml,json}', '**/api-spec.{yaml,yml,json}'],
        supportedFormats: ['yaml', 'yml', 'json'],
        timeout: 30000
      },
      'django-migrations': {
        name: 'django-migrations',
        dimension: 'data',
        commands: {
          check: 'python manage.py migrate --check',
          showmigrations: 'python manage.py showmigrations',
          makemigrations: 'python manage.py makemigrations --dry-run'
        },
        requiredFiles: ['manage.py'],
        optionalFiles: ['requirements.txt', 'pyproject.toml'],
        workingDirectory: 'backend',
        timeout: 60000
      }
    };
  }
  
  /**
   * Get configuration for specific data validation tool
   */
  async getToolConfig(toolName) {
    if (this.toolConfigs.has(toolName)) {
      return this.toolConfigs.get(toolName);
    }
    
    const baseTool = this.dataTools[toolName];
    if (!baseTool) {
      throw new Error(`Unknown data validation tool: ${toolName}`);
    }
    
    // Get configuration from qa-config.json
    const qaToolConfig = this.qaConfig.get(`toolConfigurations.${toolName}`, {});
    
    // Merge base configuration with QA config
    const config = {
      ...baseTool,
      ...qaToolConfig,
      commands: { ...baseTool.commands, ...(qaToolConfig.commands || {}) }
    };
    
    // Validate tool environment
    const validation = await this._validateToolEnvironment(config);
    config.validation = validation;
    
    // Cache the configuration
    this.toolConfigs.set(toolName, config);
    
    return config;
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
      optionalFiles: [],
      discoveredFiles: []
    };
    
    // Get working directory
    const workingDir = config.workingDirectory ? 
      path.join(this.projectRoot, config.workingDirectory) : 
      this.projectRoot;
    
    // Check required files
    for (const file of config.requiredFiles) {
      const filePath = path.join(workingDir, file);
      try {
        await fs.access(filePath);
        validation.requiredFiles.push({ file, exists: true, path: filePath });
      } catch (error) {
        validation.isValid = false;
        validation.errors.push(`Required file not found: ${file}`);
        validation.requiredFiles.push({ file, exists: false, path: filePath });
      }
    }
    
    // Check optional files
    for (const file of config.optionalFiles) {
      const filePath = path.join(workingDir, file);
      try {
        await fs.access(filePath);
        validation.optionalFiles.push({ file, exists: true, path: filePath });
      } catch (error) {
        validation.optionalFiles.push({ file, exists: false, path: filePath });
      }
    }
    
    // Discover files by patterns (for spectral)
    if (config.patterns) {
      validation.discoveredFiles = await this._discoverFilesByPatterns(config.patterns, workingDir);
      
      if (validation.discoveredFiles.length === 0) {
        validation.warnings.push(`No files found matching patterns: ${config.patterns.join(', ')}`);
      }
    }
    
    return validation;
  }
  
  async _discoverFilesByPatterns(patterns, workingDir) {
    // Simplified file discovery - basic implementation
    const discoveredFiles = [];
    const commonFiles = ['openapi.yaml', 'swagger.yaml', 'api-spec.json'];
    
    for (const file of commonFiles) {
      try {
        const filePath = path.join(workingDir, file);
        await fs.access(filePath);
        discoveredFiles.push(filePath);
      } catch (error) {
        // File doesn't exist, continue
      }
    }
    
    return discoveredFiles;
  }
  
  /**
   * Get command for specific tool and action
   */
  getCommand(toolName, action = 'check') {
    const config = this.dataTools[toolName];
    if (!config) {
      throw new Error(`Unknown data validation tool: ${toolName}`);
    }
    
    const command = config.commands[action];
    if (!command) {
      throw new Error(`Unknown action '${action}' for tool '${toolName}'`);
    }
    
    return command.split(' ');
  }
  
  /**
   * Get timeout for specific tool
   */
  getTimeout(toolName) {
    const config = this.dataTools[toolName];
    return config ? config.timeout : 30000;
  }
  
  /**
   * Get working directory for tool
   */
  getWorkingDirectory(toolName) {
    const config = this.dataTools[toolName];
    const workingDir = config.workingDirectory || '.';
    return path.resolve(this.projectRoot, workingDir);
  }
  
  /**
   * Get all available data validation tools
   */
  getAvailableTools() {
    return Object.keys(this.dataTools);
  }
  
  /**
   * Check if tool is applicable to current scope
   */
  isToolApplicable(toolName, scope) {
    const tools = this.qaConfig.get('tools.data', {});
    const scopeTools = tools[scope] || tools['all'] || [];
    return scopeTools.includes(toolName);
  }
  
  /**
   * Get discovered files for Spectral validation
   */
  getDiscoveredFiles(toolName) {
    const config = this.toolConfigs.get(toolName);
    return config?.validation?.discoveredFiles || [];
  }
}

module.exports = DataConfig;