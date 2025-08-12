/**
 * Snyk Executor - Single Responsibility: Command execution
 * Extracted from SnykWrapper for SOLID compliance
 */

const { spawn } = require('child_process');

class SnykExecutor {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }
  
  /**
   * Check if Snyk is authenticated
   */
  async checkAuth() {
    try {
      const result = await this.executeCommand(['snyk', 'auth', '--check'], 10000);
      return {
        success: result.exitCode === 0,
        message: result.stdout
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  /**
   * Execute Snyk command
   */
  async execute(command, timeout) {
    return new Promise((resolve, reject) => {
      const childProcess = spawn(command[0], command.slice(1), {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: timeout,
        cwd: process.cwd(),
        shell: process.platform === 'win32' ? true : undefined
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
        timeout: timeout,
        shell: process.platform === 'win32' ? true : undefined
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

module.exports = SnykExecutor;