/**
 * Native Wrapper - Direct tool execution
 * T-06 dependency: Executes tools directly without intermediary
 */

const { spawn } = require('child_process');

class NativeWrapper {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }
  
  async execute(tool) {
    const startTime = Date.now();
    
    try {
      this.logger.info(`Executing native tool: ${tool.name}`);
      
      const result = await this._executeNativeTool(tool);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      return {
        success: result.exitCode === 0,
        tool: tool.name,
        dimension: tool.dimension,
        executionTime: executionTime,
        results: {
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode
        },
        warnings: result.exitCode !== 0 ? [result.stderr] : [],
        errors: result.exitCode !== 0 ? [result.stderr] : []
      };
      
    } catch (error) {
      return {
        success: false,
        tool: tool.name,
        dimension: tool.dimension,
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }
  
  async _executeNativeTool(tool) {
    const command = this._buildCommand(tool);
    const timeout = tool.config.timeout || 60000;
    
    return new Promise((resolve, reject) => {
      const process = spawn(command[0], command.slice(1), {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: timeout
      });
      
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      
      // Timeout handler
      const timeoutHandler = setTimeout(() => {
        timedOut = true;
        this.logger.warn(`Tool ${tool.name} exceeded timeout of ${timeout}ms, terminating...`);
        process.kill('SIGTERM');
      }, timeout);
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        clearTimeout(timeoutHandler);
        if (timedOut) {
          this.logger.error(`Tool ${tool.name} was terminated due to timeout (${timeout}ms)`);
          stderr = `${stderr}\nProcess terminated due to timeout`;
        }
        resolve({
          exitCode: timedOut ? 124 : code, // 124 is timeout exit code
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
      });
      
      process.on('error', (error) => {
        clearTimeout(timeoutHandler);
        reject(error);
      });
    });
  }
  
  _buildCommand(tool) {
    const baseCommands = {
      jest: ['yarn', 'exec', 'jest'],
      pytest: ['pytest'],
      tsc: ['yarn', 'exec', 'tsc'],
      vite: ['yarn', 'exec', 'vite']
    };
    
    const command = baseCommands[tool.name] || [tool.name];
    
    if (tool.config?.args && tool.config.args.length > 0) {
      command.push(...tool.config.args);
    }
    
    return command;
  }
  
  getCapabilities() {
    return {
      supportedTools: ['jest', 'pytest', 'tsc', 'vite'],
      supportedDimensions: ['test', 'build'],
      fastModeSupported: true,
      parallelExecutionSupported: true,
      reportFormats: ['console']
    };
  }
}

module.exports = NativeWrapper;