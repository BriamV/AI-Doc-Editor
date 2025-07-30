/**
 * VenvManager.cjs - Python Virtual Environment Management
 * Auto-detects and activates .venv for Python tool execution
 * Aligned with PRD-QA CLI.md best practices
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class VenvManager {
  constructor(projectRoot, logger) {
    // CROSS-PLATFORM FIX: Normalize path to handle WSL/Git Bash + Windows mixing
    this.projectRoot = path.resolve(projectRoot || process.cwd());
    this.logger = logger;
    this.venvPath = null;
    this.isActivated = false;
    this.originalPath = process.env.PATH;
    this.originalPythonPath = process.env.PYTHONPATH;
  }
  
  /**
   * Detect virtual environment in project
   */
  detectVirtualEnvironment() {
    const possibleVenvPaths = [
      path.resolve(this.projectRoot, '.venv'),
      path.resolve(this.projectRoot, 'venv'),
      path.resolve(this.projectRoot, '.virtualenv'),
      path.resolve(this.projectRoot, 'env')
    ];
    
    for (const venvPath of possibleVenvPaths) {
      if (this._isValidVenv(venvPath)) {
        // CROSS-PLATFORM FIX: Ensure normalized absolute path
        this.venvPath = path.resolve(venvPath);
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Activate virtual environment for Python command execution
   */
  activateVenv() {
    if (!this.venvPath || this.isActivated) {
      return false;
    }
    
    try {
      const binPath = this._getVenvBinPath();
      const activateScript = this._getActivateScript();
      
      if (!fs.existsSync(activateScript)) {
        this.logger.warn(`Virtual environment activate script not found: ${activateScript}`);
        return false;
      }
      
      // Update PATH to prioritize venv binaries
      process.env.PATH = `${binPath}${path.delimiter}${this.originalPath}`;
      
      // Set PYTHONPATH if not already set
      if (!process.env.PYTHONPATH) {
        process.env.PYTHONPATH = this.projectRoot;
      }
      
      // Set VIRTUAL_ENV environment variable
      process.env.VIRTUAL_ENV = this.venvPath;
      
      this.isActivated = true;
      this.logger.info(`✅ Virtual environment activated: ${path.relative(this.projectRoot, this.venvPath)}`);
      
      return true;
      
    } catch (error) {
      this.logger.error(`Failed to activate virtual environment: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Deactivate virtual environment and restore original environment
   */
  deactivateVenv() {
    if (!this.isActivated) {
      return false;
    }
    
    try {
      // Restore original PATH
      process.env.PATH = this.originalPath;
      
      // Restore original PYTHONPATH or remove if it wasn't set
      if (this.originalPythonPath) {
        process.env.PYTHONPATH = this.originalPythonPath;
      } else {
        delete process.env.PYTHONPATH;
      }
      
      // Remove VIRTUAL_ENV
      delete process.env.VIRTUAL_ENV;
      
      this.isActivated = false;
      this.logger.info('📤 Virtual environment deactivated');
      
      return true;
      
    } catch (error) {
      this.logger.error(`Failed to deactivate virtual environment: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Get Python executable path (with venv if activated)
   */
  getPythonExecutable() {
    if (this.isActivated && this.venvPath) {
      const venvPython = this._getVenvPythonPath();
      if (fs.existsSync(venvPython)) {
        return venvPython;
      }
    }
    
    // Fallback to system Python
    try {
      return execSync('which python3', { encoding: 'utf8' }).trim();
    } catch {
      try {
        return execSync('which python', { encoding: 'utf8' }).trim();
      } catch {
        return 'python'; // Last resort
      }
    }
  }
  
  /**
   * Get pip executable path (with venv if activated)
   */
  getPipExecutable() {
    if (this.isActivated && this.venvPath) {
      const venvPip = this._getVenvPipPath();
      if (fs.existsSync(venvPip)) {
        return venvPip;
      }
    }
    
    // Fallback to system pip
    try {
      return execSync('which pip3', { encoding: 'utf8' }).trim();
    } catch {
      try {
        return execSync('which pip', { encoding: 'utf8' }).trim();
      } catch {
        return 'pip'; // Last resort
      }
    }
  }
  
  /**
   * Execute Python command with proper environment
   */
  async executePythonCommand(command, options = {}) {
    const wasActivated = this.isActivated;
    
    try {
      // Auto-activate if not already activated
      if (!this.isActivated && this.detectVirtualEnvironment()) {
        this.activateVenv();
      }
      
      // Use venv Python if available
      const pythonCmd = command.replace(/^python3?/, this.getPythonExecutable());
      
      const { execSync } = require('child_process');
      return execSync(pythonCmd, {
        cwd: this.projectRoot,
        encoding: 'utf8',
        ...options
      });
      
    } finally {
      // Deactivate if we activated it
      if (!wasActivated && this.isActivated) {
        this.deactivateVenv();
      }
    }
  }
  
  /**
   * Get virtual environment information
   */
  getVenvInfo() {
    return {
      detected: !!this.venvPath,
      path: this.venvPath,
      activated: this.isActivated,
      pythonExecutable: this.isActivated ? this.getPythonExecutable() : null,
      pipExecutable: this.isActivated ? this.getPipExecutable() : null
    };
  }
  
  /**
   * Check if currently in virtual environment (for tool detection)
   */
  isInVirtualEnvironment() {
    return this.venvPath && this.isActivated;
  }
  
  /**
   * Private: Check if path is a valid virtual environment
   */
  _isValidVenv(venvPath) {
    // CROSS-PLATFORM FIX: Normalize path before validation
    const normalizedVenvPath = path.resolve(venvPath);
    
    if (!fs.existsSync(normalizedVenvPath)) {
      return false;
    }
    
    const pythonPath = this._getVenvPythonPath(normalizedVenvPath);
    const activateScript = this._getActivateScript(normalizedVenvPath);
    
    // Check both python executable AND activate script for robustness
    const hasPython = fs.existsSync(pythonPath);
    const hasActivate = fs.existsSync(activateScript);
    
    return hasPython || hasActivate;
  }
  
  /**
   * Private: Get virtual environment bin/Scripts path
   */
  _getVenvBinPath(venvPath = this.venvPath) {
    if (process.platform === 'win32') {
      return path.join(venvPath, 'Scripts');
    } else {
      return path.join(venvPath, 'bin');
    }
  }
  
  /**
   * Private: Get activate script path
   */
  _getActivateScript(venvPath = this.venvPath) {
    const binPath = this._getVenvBinPath(venvPath);
    if (process.platform === 'win32') {
      return path.join(binPath, 'activate.bat');
    } else {
      return path.join(binPath, 'activate');
    }
  }
  
  /**
   * Private: Get Python executable path in venv
   */
  _getVenvPythonPath(venvPath = this.venvPath) {
    const binPath = this._getVenvBinPath(venvPath);
    if (process.platform === 'win32') {
      return path.join(binPath, 'python.exe');
    } else {
      return path.join(binPath, 'python');
    }
  }
  
  /**
   * Private: Get pip executable path in venv
   */
  _getVenvPipPath(venvPath = this.venvPath) {
    const binPath = this._getVenvBinPath(venvPath);
    if (process.platform === 'win32') {
      return path.join(binPath, 'pip.exe');
    } else {
      return path.join(binPath, 'pip');
    }
  }
}

module.exports = VenvManager;