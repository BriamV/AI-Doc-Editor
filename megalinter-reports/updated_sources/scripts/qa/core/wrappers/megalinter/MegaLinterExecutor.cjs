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
   * Build MegaLinter command with systematic fallback logic
   * Enhanced error handling according to PRD architecture
   */
  async buildCommand(tool, megalinterConfig) {
    const command = [];
    
    const hasLocalMegaLinter = await this._checkLocalMegaLinter();
    
    // Removed temporary debug logging - investigation complete
    
    if (hasLocalMegaLinter) {
      // Use local MegaLinter installation with Windows-optimized command resolution
      if (process.platform === 'win32') {
        // Windows environments (CMD, PowerShell, Git Bash) - use cmd wrapper for npx
        // This fixes spawn npx ENOENT issues across all Windows environments
        command.push('cmd', '/c', 'npx', 'mega-linter-runner');
      } else {
        // Unix-like environments (WSL, Linux, macOS) - use direct npx
        command.push('npx', 'mega-linter-runner');
      }
    } else {
      // SYSTEMATIC ENHANCEMENT: Check Docker availability before using it
      const hasDocker = await this._checkDockerAvailability();
      
      if (hasDocker) {
        // Use Docker version - existing logic preserved
        command.push('docker', 'run', '--rm');
        
        // Mount current directory
        command.push('-v', `${process.cwd()}:/tmp/lint`);
        
        // Mount reports directory
        const reportsDir = path.join(process.cwd(), megalinterConfig.settings.reportFolder);
        command.push('-v', `${reportsDir}:/tmp/lint/megalinter-reports`);
        
        // Use MegaLinter image
        command.push(megalinterConfig.settings.image);
      } else {
        // SYSTEMATIC ENHANCEMENT: Actionable error instead of cryptic failure
        throw new Error(this._generateInstallationGuidance());
      }
    }
    
    // Add tool-specific arguments - existing logic preserved
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
   * CRITICAL FIX RF-003.3: Unified detection with EnvironmentChecker method
   * 
   * IMPORTANT EXCEPTION: MegaLinter requires special handling:
   * - Detection: Use 'npm list -g mega-linter-runner --depth=0' (not yarn)
   * - Execution: Use 'npx mega-linter-runner' (not yarn exec)
   * - Reason: mega-linter-runner --version has known issues, npm list is more reliable
   * - Reference: https://github.com/oxsecurity/megalinter/issues/2733
   */
  async _checkLocalMegaLinter() {
    try {
      const { execSync } = require('child_process');
      // Use same detection method as EnvironmentChecker for consistency
      execSync('npm list -g mega-linter-runner --depth=0', { stdio: 'ignore' });
      return true;
    } catch (error) {
      // Fallback to original method if npm list fails
      try {
        execSync('which megalinter', { stdio: 'ignore' });
        return true;
      } catch (fallbackError) {
        return false;
      }
    }
  }
  
  /**
   * SYSTEMATIC ENHANCEMENT: Check Docker availability
   * Cross-platform compatible check for Docker installation
   */
  async _checkDockerAvailability() {
    try {
      const { execSync } = require('child_process');
      execSync('docker --version', { stdio: 'ignore' });
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * SYSTEMATIC ENHANCEMENT: Generate actionable installation guidance
   * Platform-aware error messaging for better UX
   */
  _generateInstallationGuidance() {
    const platform = process.platform;
    const isWSL = process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP;
    
    if (isWSL) {
      return `MegaLinter requires either:
1. Docker Desktop with WSL2 integration: https://docs.docker.com/go/wsl2/
2. Local MegaLinter: npm install -g mega-linter-runner

Current environment: WSL2 (${process.env.WSL_DISTRO_NAME || 'detected'})
Missing: Both Docker and local MegaLinter installations`;
    }
    
    const installGuides = {
      'linux': 'https://docs.docker.com/engine/install/ubuntu/',
      'darwin': 'https://docs.docker.com/desktop/mac/',
      'win32': 'https://docs.docker.com/desktop/windows/'
    };
    
    const dockerGuide = installGuides[platform] || 'https://docs.docker.com/get-docker/';
    
    return `MegaLinter requires either:
1. Docker: ${dockerGuide}
2. Local MegaLinter: npm install -g mega-linter-runner

Current platform: ${platform}
Missing: Both Docker and local MegaLinter installations`;
  }
}

module.exports = MegaLinterExecutor;