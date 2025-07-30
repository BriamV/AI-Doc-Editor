/**
 * BuildConfig.cjs - Build Tool Configuration Management (Refactored)
 * T-11: Configuration for npm, tsc, pip build validators
 * 
 * Conservative refactoring: delegates to 4 specialized classes
 * Maintains exact same API as original 624-line version
 */

const BuildConfigManager = require('./BuildConfigManager.cjs');
const CommandResolver = require('./CommandResolver.cjs');
const EnvironmentValidator = require('./EnvironmentValidator.cjs');
const CommandExecutor = require('./CommandExecutor.cjs');

class BuildConfig {
  constructor(qaConfig, logger) {
    this.qaConfig = qaConfig;
    this.logger = logger;
    this.projectRoot = process.cwd();
    
    // Compose specialized components following Single Responsibility Principle
    this.configManager = new BuildConfigManager(qaConfig, logger);
    this.commandResolver = new CommandResolver(logger);
    this.environmentValidator = new EnvironmentValidator(this.projectRoot, logger);
    this.commandExecutor = new CommandExecutor(qaConfig, logger);
  }

  /**
   * Get tool configuration with lazy evaluation (delegates to ConfigManager)
   */
  async getToolConfig(toolName) {
    const config = await this.configManager.getToolConfig(toolName);
    
    // Resolve commands using CommandResolver
    const resolvedCommands = {};
    for (const [action, template] of Object.entries(config.commandTemplates)) {
      try {
        resolvedCommands[action] = await this.commandResolver.resolveCommandTemplate(template, toolName, action);
      } catch (error) {
        this.logger.error(`Failed to resolve command template for ${toolName}.${action}: ${error.message}`);
        resolvedCommands[action] = template;
      }
    }
    
    // Update config with resolved commands
    config.commands = resolvedCommands;
    
    // Validate environment using EnvironmentValidator
    const validation = await this.environmentValidator.validateEnvironment(config);
    config.validation = validation;
    
    return config;
  }

  /**
   * Get command for specific tool and action (delegates to CommandExecutor)
   */
  async getCommand(toolName, action = 'check') {
    const config = await this.getToolConfig(toolName);
    return await this.commandExecutor.getCommand(config, action);
  }

  /**
   * Get timeout for specific tool (delegates to CommandExecutor)
   */
  async getTimeout(toolName) {
    const config = await this.getToolConfig(toolName);
    return this.commandExecutor.getTimeout(config);
  }

  /**
   * Get working directory for tool (delegates to CommandExecutor)
   */
  getWorkingDirectory(toolName) {
    return this.commandExecutor.getWorkingDirectory(toolName);
  }

  /**
   * Get all available build tools (delegates to ConfigManager)
   */
  async getAvailableTools() {
    return await this.configManager.getAvailableTools();
  }

  /**
   * Check if tool is applicable to current scope (delegates to CommandExecutor)
   */
  async isToolApplicable(toolName, scope) {
    const packageManagerService = await this.configManager._getPackageManagerService();
    return await this.commandExecutor.isToolApplicable(toolName, scope, packageManagerService);
  }

  /**
   * Get package manager info for debugging (delegates to CommandExecutor)
   */
  async getPackageManagerInfo() {
    const packageManagerService = await this.configManager._getPackageManagerService();
    return await this.commandExecutor.getPackageManagerInfo(packageManagerService);
  }

  /**
   * Clear command cache (delegates to all components)
   */
  clearCache() {
    this.configManager.clearCache();
    this.commandResolver.clearCache();
    this.logger.info('BuildConfig: All caches cleared');
  }

  /**
   * Reset package manager service (delegates to ConfigManager)
   */
  resetPackageManagerService() {
    this.configManager.resetPackageManagerService();
  }
}

module.exports = BuildConfig;