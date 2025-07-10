/**
 * Tool Checker - Single Responsibility: Individual tool availability checking
 * Extracted from EnvironmentChecker for SOLID compliance
 */

const { execSync } = require('child_process');

class ToolChecker {
  constructor(logger) {
    this.logger = logger;
  }
  
  /**
   * Check individual tool availability
   */
  async checkTool(toolName, toolConfig) {
    try {
      const output = execSync(toolConfig.command, { 
        stdio: 'pipe',
        timeout: 5000,
        encoding: 'utf8'
      });
      
      // Extract version from output
      const versionMatch = output.match(/v?(\d+\.\d+\.\d+)/);
      const version = versionMatch ? versionMatch[1] : 'installed';
      
      return {
        available: true,
        version: version,
        command: toolConfig.command,
        description: toolConfig.description
      };
      
    } catch (error) {
      return {
        available: false,
        error: error.message,
        command: toolConfig.command,
        description: toolConfig.description,
        installUrl: toolConfig.installUrl,
        fallback: toolConfig.fallback
      };
    }
  }
  
  /**
   * Check multiple tools in parallel
   */
  async checkTools(tools) {
    const results = new Map();
    
    for (const [toolName, toolConfig] of Object.entries(tools)) {
      const result = await this.checkTool(toolName, toolConfig);
      results.set(toolName, result);
      
      if (result.available) {
        this.logger.info(`✅ ${toolName}: ${result.version || 'available'}`);
      } else {
        this.logger.warn(`🟡 ${toolName} not available: ${toolConfig.description}`);
      }
    }
    
    return results;
  }
  
  /**
   * Check critical tools - throws on failure
   */
  async checkCriticalTools(tools) {
    const results = new Map();
    
    for (const [toolName, toolConfig] of Object.entries(tools)) {
      if (!toolConfig.critical) continue;
      
      const result = await this.checkTool(toolName, toolConfig);
      results.set(toolName, result);
      
      if (!result.available) {
        throw new Error(`Critical tool missing: ${toolName}. ${toolConfig.description} is required. Install from: ${toolConfig.installUrl}`);
      }
      
      this.logger.info(`✅ ${toolName}: ${result.version || 'available'}`);
    }
    
    return results;
  }
}

module.exports = ToolChecker;