/**
 * MegaLinter Executor - Single Responsibility: Command execution
 * Extracted from MegaLinterWrapper for SOLID compliance
 */

const { spawn } = require('child_process');
const { promises: fs } = require('fs');
const path = require('path');

class MegaLinterExecutor {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }
  
  /**
   * Execute MegaLinter command
   */
  async execute(command, envVars, workingDir) {
    return new Promise((resolve, reject) => {
      const childProcess = spawn(command[0], command.slice(1), {
        cwd: workingDir,
        env: { ...process.env, ...envVars },
        stdio: ['pipe', 'pipe', 'pipe']
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
          stdout: stdout,
          stderr: stderr
        });
      });
      
      childProcess.on('error', (error) => {
        reject(new Error(`MegaLinter process error: ${error.message}`));
      });
      
      // Handle timeout
      const timeout = setTimeout(() => {
        childProcess.kill('SIGTERM');
        reject(new Error('MegaLinter execution timed out'));
      }, 300000); // 5 minutes timeout
      
      childProcess.on('close', () => {
        clearTimeout(timeout);
      });
    });
  }
  
  /**
   * Build MegaLinter command
   */
  async buildCommand(tool, megalinterConfig) {
    const command = [];
    
    const hasLocalMegaLinter = await this._checkLocalMegaLinter();
    
    if (hasLocalMegaLinter) {
      command.push('megalinter');
    } else {
      // Use Docker version
      command.push('docker', 'run', '--rm');
      
      // Mount current directory
      command.push('-v', `${process.cwd()}:/tmp/lint`);
      
      // Mount reports directory
      const reportsDir = path.join(process.cwd(), megalinterConfig.settings.reportFolder);
      command.push('-v', `${reportsDir}:/tmp/lint/megalinter-reports`);
      
      // Use MegaLinter image
      command.push(megalinterConfig.settings.image);
    }
    
    // Add tool-specific arguments
    if (tool.config?.args && tool.config.args.length > 0) {
      command.push(...tool.config.args);
    }
    
    return command;
  }
  
  /**
   * Prepare working directory
   */
  async prepareWorkingDirectory(tool, megalinterConfig) {
    const workingDir = process.cwd();
    
    // Ensure reports directory exists
    const reportsDir = path.join(workingDir, megalinterConfig.settings.reportFolder);
    await fs.mkdir(reportsDir, { recursive: true });
    
    // Create tool-specific report subdirectory
    const toolReportDir = path.join(reportsDir, tool.name);
    await fs.mkdir(toolReportDir, { recursive: true });
    
    return workingDir;
  }
  
  /**
   * Check if MegaLinter is available locally
   */
  async _checkLocalMegaLinter() {
    try {
      const { execSync } = require('child_process');
      execSync('which megalinter', { stdio: 'ignore' });
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = MegaLinterExecutor;