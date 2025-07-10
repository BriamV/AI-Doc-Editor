/**
 * Semgrep Executor - Single Responsibility: Command execution
 * Extracted from SemgrepWrapper for SOLID compliance
 */

const { spawn } = require('child_process');

class SemgrepExecutor {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }
  
  /**
   * Check if Semgrep is available
   */
  async checkAvailability() {
    try {
      const result = await this.executeCommand(['semgrep', '--version'], 10000);
      return {
        success: result.exitCode === 0,
        version: result.stdout
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  /**
   * Execute Semgrep command
   */
  async execute(command, timeout) {
    return new Promise((resolve, reject) => {
      const childProcess = spawn(command[0], command.slice(1), {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: timeout,
        cwd: process.cwd()
      });
      
      let stdout = '';
      let stderr = '';
      
      childProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      childProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      childProcess.on('close', (code) => {
        resolve({
          exitCode: code,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
      });
      
      childProcess.on('error', (error) => {
        reject(error);
      });
    });
  }
  
  /**
   * Execute simple command for checks
   */
  async executeCommand(command, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const childProcess = spawn(command[0], command.slice(1), {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: timeout
      });
      
      let stdout = '';
      let stderr = '';
      
      childProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      childProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      childProcess.on('close', (code) => {
        resolve({
          exitCode: code,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
      });
      
      childProcess.on('error', (error) => {
        reject(error);
      });
    });
  }
}

module.exports = SemgrepExecutor;