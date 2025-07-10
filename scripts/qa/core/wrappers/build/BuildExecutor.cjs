/**
 * BuildExecutor.cjs - Build Command Execution Engine
 * T-11: Executes npm, tsc, pip build commands with timeout and error handling
 * 
 * Single Responsibility: Command execution for build tools
 * Open/Closed: Extensible for new build commands
 * Dependencies: Inverted through constructor injection
 */

const { spawn } = require('child_process');
const path = require('path');
const { getPackageManagerService } = require('../../services/PackageManagerService.cjs');

class BuildExecutor {
  constructor(buildConfig, logger) {
    this.buildConfig = buildConfig;
    this.logger = logger;
    
    // Execution context
    this.activeProcesses = new Map();
    this.executionResults = new Map();
  }
  
  /**
   * Execute build command for specific tool
   */
  async executeTool(toolName, action = 'check', options = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.info(`Executing ${toolName} ${action}...`);
      
      // Get tool configuration
      const toolConfig = await this.buildConfig.getToolConfig(toolName);
      
      // Validate tool environment
      if (!toolConfig.validation.isValid) {
        return this._createErrorResult(toolName, action, 'Environment validation failed', toolConfig.validation.errors, startTime);
      }
      
      // Build command (now async)
      const command = await this._buildCommand(toolName, action, options);
      const workingDir = this.buildConfig.getWorkingDirectory(toolName);
      const timeout = this.buildConfig.getTimeout(toolName);
      
      // Execute command
      const result = await this._executeCommand(command, workingDir, timeout);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Create execution result
      const executionResult = {
        success: result.exitCode === 0,
        tool: toolName,
        action: action,
        executionTime: executionTime,
        command: command.join(' '),
        workingDirectory: workingDir,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        timedOut: result.timedOut || false
      };
      
      this.executionResults.set(`${toolName}_${action}`, executionResult);
      
      this.logger.info(`${toolName} ${action} completed in ${executionTime}ms (exit code: ${result.exitCode})`);
      
      return executionResult;
      
    } catch (error) {
      return this._createErrorResult(toolName, action, error.message, [error.message], startTime);
    }
  }
  
  /**
   * Execute multiple tools in sequence
   */
  async executeTools(toolConfigs) {
    const results = [];
    
    for (const config of toolConfigs) {
      const result = await this.executeTool(config.name, config.action || 'check', config.options || {});
      results.push(result);
      
      // Stop on first failure if configured
      if (!result.success && config.stopOnFailure) {
        this.logger.warn(`Stopping execution due to failure in ${config.name}`);
        break;
      }
    }
    
    return results;
  }
  
  /**
   * Execute tools in parallel (for compatible tools)
   */
  async executeToolsParallel(toolConfigs) {
    const promises = toolConfigs.map(config => 
      this.executeTool(config.name, config.action || 'check', config.options || {})
    );
    
    try {
      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      this.logger.error(`Parallel execution failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Build command array for execution (ASYNC - now supports lazy evaluation)
   */
  async _buildCommand(toolName, action, options) {
    const baseCommand = await this.buildConfig.getCommand(toolName, action);
    
    // Fix 2.1: Separate tool-specific argument handling
    const validatedArgs = await this._validateAndFilterArgs(toolName, action, options.args || []);
    
    // Fix 2.2: Add validated arguments without duplicates
    baseCommand.push(...validatedArgs);
    
    // Fix 2.3: Tool-specific argument handling with validation
    const specificArgs = await this._getToolSpecificArgs(toolName, action, options);
    baseCommand.push(...specificArgs);
    
    return baseCommand;
  }
  
  /**
   * Fix 2.1: Validate and filter arguments for specific tool (ASYNC)
   */
  async _validateAndFilterArgs(toolName, action, args) {
    if (!Array.isArray(args)) {
      return [];
    }
    
    // Get base command to check for existing flags
    const baseCommand = await this.buildConfig.getCommand(toolName, action);
    const baseFlags = baseCommand.filter(arg => arg.startsWith('--'));
    
    // Filter out arguments that are not valid for this tool/action
    const validArgs = [];
    for (const arg of args) {
      // Fix 2.2: Prevent duplicate flags
      if (arg.startsWith('--') && baseFlags.includes(arg)) {
        this.logger.warn(`Skipping duplicate flag '${arg}' for ${toolName} ${action}`);
        continue;
      }
      
      // Fix 2.3: Tool-specific argument validation
      const isValid = await this._isValidArgForTool(toolName, action, arg);
      if (isValid) {
        validArgs.push(arg);
      }
    }
    
    return validArgs;
  }
  
  /**
   * Fix 2.3: Check if argument is valid for specific tool/action
   */
  async _isValidArgForTool(toolName, action, arg) {
    // Use package manager detector for npm/yarn/pnpm validation
    if (toolName === 'npm') {
      const service = getPackageManagerService();
      const validArgs = await service.getValidArgs(action);
      
      if (arg.startsWith('--')) {
        const flagName = arg.split('=')[0];
        return validArgs.some(validArg => flagName.startsWith(validArg));
      }
      return true;
    }
    
    // Static rules for other tools
    const toolArgRules = {
      tsc: {
        check: ['--project', '--noEmit', '--incremental', '--tsBuildInfoFile', '--pretty'],
        build: ['--project', '--incremental', '--tsBuildInfoFile', '--pretty']
      },
      pip: {
        install: ['-r', '--requirement', '--upgrade', '--user', '--target', '--verbose'],
        check: ['--verbose']
      },
      vite: {
        check: ['--mode', '--config', '--logLevel'],
        build: ['--mode', '--config', '--logLevel', '--outDir', '--emptyOutDir']
      }
    };
    
    const validArgs = toolArgRules[toolName]?.[action] || [];
    
    // Allow flag if it starts with any valid prefix
    if (arg.startsWith('--')) {
      const flagName = arg.split('=')[0]; // Handle --flag=value format
      return validArgs.some(validArg => flagName.startsWith(validArg));
    }
    
    // Allow non-flag arguments (values)
    return true;
  }
  
  /**
   * Fix 2.3: Get tool-specific arguments with validation (ASYNC)
   */
  async _getToolSpecificArgs(toolName, action, options) {
    const args = [];
    
    // Handle package manager (npm/yarn/pnpm) dynamically
    if (toolName === 'npm') {
      const service = getPackageManagerService();
      
      if (action === 'audit' && options.level) {
        // Get appropriate audit flag for detected package manager
        const manager = await service.getManager();
        if (manager === 'yarn') {
          args.push('--level', options.level);
        } else if (manager === 'pnpm') {
          args.push('--audit-level', options.level);
        } else {
          args.push('--audit-level', options.level);
        }
      }
    } else if (toolName === 'tsc' && action === 'check') {
      if (options.project && options.project !== '.') {
        args.push('--project', options.project);
      }
    } else if (toolName === 'pip' && action === 'install') {
      if (options.requirements && options.requirements !== 'requirements.txt') {
        args.push('-r', options.requirements);
      }
    } else if (toolName === 'vite') {
      if (options.mode) {
        args.push('--mode', options.mode);
      }
      if (options.config) {
        args.push('--config', options.config);
      }
    }
    
    return args;
  }
  
  /**
   * Execute command with timeout and process management
   */
  async _executeCommand(command, workingDir, timeout) {
    return new Promise((resolve, reject) => {
      const processKey = `${command[0]}_${Date.now()}`;
      
      const childProcess = spawn(command[0], command.slice(1), {
        cwd: workingDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: timeout
      });
      
      this.activeProcesses.set(processKey, childProcess);
      
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      
      // Set up timeout handler
      const timeoutHandler = setTimeout(() => {
        timedOut = true;
        this.logger.warn(`Command ${command.join(' ')} timed out after ${timeout}ms`);
        childProcess.kill('SIGTERM');
      }, timeout);
      
      // Collect stdout
      childProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      // Collect stderr
      childProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      // Handle process completion
      childProcess.on('close', (code) => {
        clearTimeout(timeoutHandler);
        this.activeProcesses.delete(processKey);
        
        resolve({
          exitCode: timedOut ? 124 : code, // 124 is timeout exit code
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          timedOut: timedOut
        });
      });
      
      // Handle process errors
      childProcess.on('error', (error) => {
        clearTimeout(timeoutHandler);
        this.activeProcesses.delete(processKey);
        reject(error);
      });
    });
  }
  
  /**
   * Create error result structure
   */
  _createErrorResult(toolName, action, message, errors, startTime) {
    return {
      success: false,
      tool: toolName,
      action: action,
      executionTime: Date.now() - startTime,
      error: message,
      errors: errors,
      exitCode: 1,
      stdout: '',
      stderr: message
    };
  }
  
  /**
   * Get execution result for specific tool
   */
  getExecutionResult(toolName, action = 'check') {
    return this.executionResults.get(`${toolName}_${action}`);
  }
  
  /**
   * Cleanup - kill all active processes
   */
  cleanup() {
    for (const [key, process] of this.activeProcesses) {
      this.logger.warn(`Killing active process: ${key}`);
      process.kill('SIGTERM');
    }
    this.activeProcesses.clear();
  }
}

module.exports = BuildExecutor;