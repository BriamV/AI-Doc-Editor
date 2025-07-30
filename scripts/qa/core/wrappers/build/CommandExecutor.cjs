/**
 * CommandExecutor.cjs - Command Execution and Parsing Logic
 * Conservative extraction from BuildConfig.cjs lines 307-406 + 540-572
 * No new functionality added - exact mapping only
 */

const path = require('path');

class CommandExecutor {
  constructor(qaConfig, logger) {
    this.qaConfig = qaConfig;
    this.logger = logger;
    this.projectRoot = process.cwd();
  }

  /**
   * Get command for specific tool and action (LAZY EVALUATION)
   */
  async getCommand(toolConfig, action = 'check') {
    // Validate commands object exists
    if (!toolConfig.commands || typeof toolConfig.commands !== 'object') {
      throw new Error(`Invalid commands configuration for tool '${toolConfig.name}'`);
    }
    
    const command = toolConfig.commands[action];
    if (!command) {
      const availableActions = Object.keys(toolConfig.commands).join(', ');
      throw new Error(`Unknown action '${action}' for tool '${toolConfig.name}'. Available actions: ${availableActions}`);
    }
    
    // Validate command is string before splitting
    if (typeof command !== 'string') {
      throw new Error(`Invalid command configuration for tool '${toolConfig.name}', action '${action}': expected string, got ${typeof command}`);
    }
    
    // Smart command parsing that preserves arguments properly
    return this._parseCommand(command);
  }

  /**
   * Get timeout for specific tool
   */
  getTimeout(toolConfig) {
    return toolConfig.timeout || 60000;
  }

  /**
   * Get working directory for tool
   */
  getWorkingDirectory(toolName) {
    const qaConfig = this.qaConfig.get(`toolConfigurations.${toolName}.workingDirectory`, '.');
    return path.resolve(this.projectRoot, qaConfig);
  }

  /**
   * Check if tool is applicable to current scope (with package manager support)
   */
  async isToolApplicable(toolName, scope, packageManagerService) {
    const tools = this.qaConfig.get('tools.build', {});
    const scopeTools = tools[scope] || tools['all'] || [];
    
    // Modular solution: Check if toolName is a detected package manager
    try {
      const detectedManager = await packageManagerService.getManager();
      
      // If this tool is the detected package manager and npm is in scope, it's applicable
      if (toolName === detectedManager && scopeTools.includes('npm')) {
        return true;
      }
    } catch (error) {
      // If detection fails, continue with standard check
    }
    
    return scopeTools.includes(toolName);
  }

  /**
   * Get package manager info for debugging
   */
  async getPackageManagerInfo(packageManagerService) {
    try {
      return await packageManagerService.getInfo();
    } catch (error) {
      return {
        manager: 'unknown',
        error: error.message,
        initialized: false
      };
    }
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
}

module.exports = CommandExecutor;