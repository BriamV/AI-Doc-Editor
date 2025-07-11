/**
 * Tool Checker - Single Responsibility: Individual tool availability checking
 * Extracted from EnvironmentChecker for SOLID compliance
 */

const { execSync } = require('child_process');

class ToolChecker {
  constructor(logger, venvManager = null) {
    this.logger = logger;
    this.venvManager = venvManager;
  }
  
  /**
   * Check individual tool availability with comprehensive cross-platform support
   */
  async checkTool(toolName, toolConfig) {
    // Enhanced tool detection with multiple fallback strategies  
    const result = await this._checkToolWithFallbacks(toolName, toolConfig);
    
    // Unified logging - single format for all tools
    this._logToolResult(toolName, toolConfig, result);
    
    return result;
  }
  
  /**
   * Unified tool logging - consistent format for all tools
   */
  _logToolResult(toolName, toolConfig, result) {
    if (result.available) {
      // Standard success format
      const versionInfo = result.version || 'available';
      const method = result.detectionMethod || 'standard';
      
      if (method === 'standard') {
        this.logger.info(`✅ ${toolName}: ${versionInfo}`);
      } else {
        // Show detection method for special cases (Docker fallback, Spectral file-based, etc.)
        this.logger.info(`✅ ${toolName}: ${versionInfo} (${method})`);
      }
    } else {
      // Standard failure format
      this.logger.warn(`🔶 ${toolName}: not available`);
      
      // Show error details only in verbose mode or for critical tools
      if (toolConfig.critical || this.logger.level === 'debug') {
        this.logger.warn(`   └─ ${result.error || toolConfig.description}`);
        if (result.installUrl) {
          this.logger.warn(`   └─ Install: ${result.installUrl}`);
        }
      }
    }
  }
  
  /**
   * Internal method with comprehensive fallback detection
   */
  async _checkToolWithFallbacks(toolName, toolConfig) {
    const { execSync } = require('child_process');
    const fs = require('fs');
    let command = toolConfig.command;
    
    const execOptions = { 
      stdio: 'pipe',
      timeout: 10000,
      encoding: 'utf8'
    };
    
    try {
      // For Python tools, use direct venv detection
      const pythonTools = ['black', 'pylint', 'pytest'];
      if (pythonTools.includes(toolName)) {
        let venvExecutable = null;
        
        // Check Windows-style venv structure first
        const windowsPath = `.venv/Scripts/${toolName}.exe`;
        if (fs.existsSync(windowsPath)) {
          venvExecutable = windowsPath;
        } else {
          // Check Unix-style venv structure
          const unixPath = `.venv/bin/${toolName}`;
          if (fs.existsSync(unixPath)) {
            venvExecutable = unixPath;
          }
        }
        
        if (venvExecutable) {
          command = command.replace(`${toolName} --version`, `${venvExecutable} --version`);
          const output = execSync(command, execOptions);
          const versionMatch = output.match(/v?(\d+\.\d+\.\d+)/);
          const version = versionMatch ? versionMatch[1] : 'installed';
          
          return {
            available: true,
            version: version,
            command: command,
            description: toolConfig.description,
            detectionMethod: 'venv'
          };
        }
      }
      
      // Special handling for spectral - check file existence and get version
      if (toolName === 'spectral' && command.includes('node_modules')) {
        const packagePath = 'node_modules/@stoplight/spectral-cli/package.json';
        if (fs.existsSync(packagePath)) {
          const packageInfo = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
          return {
            available: true,
            version: packageInfo.version,
            command: command,
            description: toolConfig.description,
            detectionMethod: 'file-based'
          };
        } else {
          throw new Error('Spectral package.json not found');
        }
      }
      
      // Special handling for Docker in WSL with broken integration
      if (toolName === 'docker' && command.includes('docker --version')) {
        // Try multiple Docker detection methods
        const dockerCommands = [
          'docker --version',
          'docker.exe --version'
        ];
        
        for (const dockerCmd of dockerCommands) {
          try {
            const output = execSync(dockerCmd, execOptions);
            const versionMatch = output.match(/Docker version (\d+\.\d+\.\d+)/);
            const version = versionMatch ? versionMatch[1] : 'installed';
            
            return {
              available: true,
              version: version,
              command: dockerCmd,
              description: toolConfig.description,
              detectionMethod: dockerCmd === 'docker.exe --version' ? 'wsl-fallback' : 'standard'
            };
          } catch (dockerError) {
            continue;
          }
        }
        
        // If all Docker commands failed, throw error to trigger main catch
        throw new Error('All Docker detection methods failed');
      }
      
      // Regular command execution for all other tools
      const output = execSync(command, execOptions);
      
      // Extract version from output
      const versionMatch = output.match(/v?(\d+\.\d+\.\d+)/);
      const version = versionMatch ? versionMatch[1] : 'installed';
      
      return {
        available: true,
        version: version,
        command: toolConfig.command,
        description: toolConfig.description,
        detectionMethod: 'standard'
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
      // Note: logging is handled by checkTool -> _logToolResult, no duplication here
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
      // Note: logging is handled by checkTool -> _logToolResult, no duplication here
    }
    
    return results;
  }
}

module.exports = ToolChecker;