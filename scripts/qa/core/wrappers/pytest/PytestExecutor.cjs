/**
 * Pytest Executor - Single Responsibility: Execution logic
 * Extracted from PytestWrapper for SOLID compliance
 */

const { spawn } = require('child_process');

class PytestExecutor {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }
  
  /**
   * Execute Pytest command
   */
  async executePytest(command, timeout) {
    return new Promise((resolve, reject) => {
      const childProcess = spawn(command[0], command.slice(1), {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: timeout,
        cwd: process.cwd()
      });
      
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      
      // Timeout handler
      const timeoutHandler = setTimeout(() => {
        timedOut = true;
        this.logger.warn(`Pytest exceeded timeout of ${timeout}ms, terminating...`);
        childProcess.kill('SIGTERM');
      }, timeout);
      
      childProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      childProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      childProcess.on('close', (code) => {
        clearTimeout(timeoutHandler);
        if (timedOut) {
          this.logger.error(`Pytest was terminated due to timeout (${timeout}ms)`);
          stderr = `${stderr}\nProcess terminated due to timeout`;
        }
        resolve({
          exitCode: timedOut ? 124 : code, // 124 is timeout exit code
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
      });
      
      childProcess.on('error', (error) => {
        clearTimeout(timeoutHandler);
        reject(error);
      });
    });
  }
}

module.exports = PytestExecutor;