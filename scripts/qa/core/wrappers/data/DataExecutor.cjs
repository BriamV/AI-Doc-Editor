/**
 * DataExecutor.cjs - Data Validation Command Execution Engine
 * T-12: Executes Spectral and Django migration validation commands
 * 
 * Single Responsibility: Command execution for data validation tools
 * Open/Closed: Extensible for new data validation commands
 * Dependencies: Inverted through constructor injection
 */

const { spawn } = require('child_process');
const path = require('path');

class DataExecutor {
  constructor(dataConfig, logger) {
    this.dataConfig = dataConfig;
    this.logger = logger;
    
    // Execution context
    this.activeProcesses = new Map();
    this.executionResults = new Map();
  }
  
  /**
   * Execute data validation command for specific tool
   */
  async executeTool(toolName, action = 'check', options = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.info(`Executing ${toolName} ${action}...`);
      
      // Get tool configuration
      const toolConfig = await this.dataConfig.getToolConfig(toolName);
      
      // Validate tool environment
      if (!toolConfig.validation.isValid) {
        return this._createErrorResult(toolName, action, 'Environment validation failed', toolConfig.validation.errors, startTime);
      }
      
      // Handle tool-specific execution
      let result;
      if (toolName === 'spectral') {
        result = await this._executeSpectral(toolConfig, action, options);
      } else if (toolName === 'django-migrations') {
        result = await this._executeDjangoMigrations(toolConfig, action, options);
      } else {
        throw new Error(`Unsupported tool: ${toolName}`);
      }
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Create execution result
      const executionResult = {
        success: result.success,
        tool: toolName,
        action: action,
        executionTime: executionTime,
        command: result.command,
        workingDirectory: result.workingDirectory,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        timedOut: result.timedOut || false,
        filesProcessed: result.filesProcessed || []
      };
      
      this.executionResults.set(`${toolName}_${action}`, executionResult);
      
      this.logger.info(`${toolName} ${action} completed in ${executionTime}ms (exit code: ${result.exitCode})`);
      
      return executionResult;
      
    } catch (error) {
      return this._createErrorResult(toolName, action, error.message, [error.message], startTime);
    }
  }
  
  async _executeSpectral(toolConfig, action, options) {
    const workingDir = this.dataConfig.getWorkingDirectory('spectral');
    const timeout = this.dataConfig.getTimeout('spectral');
    const filesToValidate = options.files || this.dataConfig.getDiscoveredFiles('spectral');
    
    if (filesToValidate.length === 0) {
      return { success: true, command: 'spectral (no files)', workingDirectory: workingDir, exitCode: 0, 
               stdout: 'No OpenAPI/Swagger files found', stderr: '', filesProcessed: [] };
    }
    
    const results = [];
    for (const file of filesToValidate) {
      const command = this._buildCommand('spectral', action, file, options);
      const result = await this._executeCommand(command, workingDir, timeout);
      results.push({ file, result });
    }
    
    const aggregated = this._aggregateResults(results);
    aggregated.filesProcessed = filesToValidate;
    return aggregated;
  }
  
  async _executeDjangoMigrations(toolConfig, action, options) {
    const workingDir = this.dataConfig.getWorkingDirectory('django-migrations');
    const timeout = this.dataConfig.getTimeout('django-migrations');
    const command = this._buildCommand('django-migrations', action, null, options);
    const result = await this._executeCommand(command, workingDir, timeout);
    
    return {
      success: result.exitCode === 0, command: command.join(' '), workingDirectory: workingDir,
      exitCode: result.exitCode, stdout: result.stdout, stderr: result.stderr,
      timedOut: result.timedOut || false, filesProcessed: ['manage.py']
    };
  }
  
  _buildCommand(toolName, action, file, options) {
    const baseCommand = this.dataConfig.getCommand(toolName, action);
    
    if (toolName === 'spectral') {
      if (file) baseCommand.push(file);
      if (options.format) baseCommand.push('--format', options.format);
      if (options.ruleset) baseCommand.push('--ruleset', options.ruleset);
    } else if (toolName === 'django-migrations') {
      if (options.verbosity) baseCommand.push('--verbosity', options.verbosity);
      if (options.database) baseCommand.push('--database', options.database);
    }
    
    return baseCommand;
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
          exitCode: timedOut ? 124 : code,
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
  
  _aggregateResults(results) {
    let overallSuccess = true;
    let aggregatedStdout = '';
    let aggregatedStderr = '';
    let lastExitCode = 0;
    
    for (const { file, result } of results) {
      if (result.exitCode !== 0) {
        overallSuccess = false;
        lastExitCode = result.exitCode;
      }
      
      if (result.stdout) aggregatedStdout += `\n=== ${file} ===\n${result.stdout}`;
      if (result.stderr) aggregatedStderr += `\n=== ${file} ===\n${result.stderr}`;
    }
    
    return {
      success: overallSuccess, command: `spectral (${results.length} files)`,
      workingDirectory: this.dataConfig.getWorkingDirectory('spectral'), exitCode: lastExitCode,
      stdout: aggregatedStdout.trim(), stderr: aggregatedStderr.trim(), timedOut: false
    };
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
      stderr: message,
      filesProcessed: []
    };
  }
  
  async executeTools(toolConfigs) {
    const results = [];
    for (const config of toolConfigs) {
      const result = await this.executeTool(config.name, config.action || 'check', config.options || {});
      results.push(result);
      if (!result.success && config.stopOnFailure) break;
    }
    return results;
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

module.exports = DataExecutor;