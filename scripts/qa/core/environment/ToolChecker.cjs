/**
 * Tool Checker - Single Responsibility: Individual tool availability checking
 * Extracted from EnvironmentChecker for SOLID compliance
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

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
      timeout: 5000, // PERFORMANCE FIX: Reduced timeout from 8s to 5s for faster detection
      encoding: 'utf8',
      // ARCHITECTURAL FIX: Preserve original PATH for NPM commands
      env: { ...process.env, PATH: this._getCleanPath(toolName, toolConfig) }
    };
    
    try {
      // For Python tools, try VenvManager first, then fallback to system PATH
      const pythonTools = ['black', 'pylint', 'pytest'];
      if (pythonTools.includes(toolName) && this.venvManager) {
        try {
          const venvToolPath = this._getVenvToolPath(toolName);
          if (venvToolPath) {
            try {
              const venvCommand = command.replace(`${toolName} --version`, `"${venvToolPath}" --version`);
              
              const pythonExecOptions = {
                stdio: 'pipe',
                timeout: 5000, // PERFORMANCE FIX: Reduced Python tool timeout
                encoding: 'utf8',
                cwd: process.cwd(),
                shell: process.platform === 'win32' ? true : undefined
              };
              
              const output = execSync(venvCommand, pythonExecOptions);
              const versionMatch = output.match(/v?(\d+\.\d+\.\d+)/);
              const version = versionMatch ? versionMatch[1] : 'installed';
              
              return {
                available: true,
                version: version,
                command: venvCommand,
                description: toolConfig.description,
                detectionMethod: 'venv'
              };
            } catch (venvError) {
              // Venv tool failed, continue to system PATH fallback
              this.logger.debug(`Venv ${toolName} failed, trying system PATH: ${venvError.message}`);
            }
          }
        } catch (venvPathError) {
          this.logger.debug(`_getVenvToolPath failed for ${toolName}: ${venvPathError.message}`);
        }
        // Continue to system PATH for ALL Python tools (venv success already returned above)
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
      
      // Cache warming for NPM-based tools to improve reliability
      const npmTools = ['eslint', 'prettier', 'tsc'];
      if (npmTools.includes(toolName)) {
        try {
          // Pre-warm NPM cache with quick dependency check
          execSync('npm list --depth=0', { 
            stdio: 'pipe', 
            timeout: 3000, // PERFORMANCE FIX: Reduced cache warming timeout
            encoding: 'utf8',
            env: { ...process.env, PATH: this._getCleanPath(toolName, toolConfig) }
          });
        } catch (warmupError) {
          // Cache warming failed, but continue with main detection
          // This is non-critical as it's an optimization
        }
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
  
  /**
   * Get virtual environment tool path (delegates to VenvManager)
   * SOLID: Single Responsibility - eliminates duplicate venv detection
   */
  _getVenvToolPath(toolName) {
    if (!this.venvManager || !this.venvManager.venvPath) {
      return null;
    }
    
    const venvBinPath = process.platform === 'win32' 
      ? path.join(this.venvManager.venvPath, 'Scripts')
      : path.join(this.venvManager.venvPath, 'bin');
    
    const toolPath = process.platform === 'win32'
      ? path.join(venvBinPath, `${toolName}.exe`)
      : path.join(venvBinPath, toolName);
    
    return fs.existsSync(toolPath) ? toolPath : null;
  }
  
  /**
   * ARCHITECTURAL FIX: Get clean PATH for tool execution
   * Prevents venv PATH interference with NPM commands
   */
  _getCleanPath(toolName, toolConfig) {
    // For NPM-based tools, use original PATH to avoid venv interference
    const npmTools = ['eslint', 'prettier', 'tsc'];
    const npmCommands = ['npx', 'npm', 'yarn'];
    
    // Check if tool uses NPM commands
    const isNpmTool = npmTools.includes(toolName) || 
                      npmCommands.some(cmd => (toolConfig.command || '').includes(cmd));
    
    if (isNpmTool && this.venvManager && this.venvManager.originalPath) {
      // Return original PATH for NPM tools to avoid venv interference
      return this.venvManager.originalPath;
    }
    
    // For other tools, use current PATH (potentially venv-modified)
    return process.env.PATH;
  }
}

module.exports = ToolChecker;