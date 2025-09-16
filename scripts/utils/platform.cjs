/**
 * Utilidad multiplataforma para comandos y rutas
 * Detecta automáticamente el sistema operativo y proporciona rutas correctas
 */

const os = require('os');
const path = require('path');
const fs = require('fs');

class PlatformUtils {
  constructor() {
    this.platform = os.platform();
    this.isWindows = this.platform === 'win32';
    this.isLinux = this.platform === 'linux';
    this.isMacOS = this.platform === 'darwin';
    this.isWSL = this._detectWSL();
  }

  /**
   * Detecta si estamos en WSL (Windows Subsystem for Linux)
   * @returns {boolean}
   */
  _detectWSL() {
    if (!this.isLinux) return false;
    
    try {
      const releaseFile = fs.readFileSync('/proc/version', 'utf8');
      return releaseFile.toLowerCase().includes('microsoft') || 
             releaseFile.toLowerCase().includes('wsl');
    } catch {
      return false;
    }
  }

  /**
   * Obtiene la ruta correcta del ejecutable Python en el virtual environment
   * @param {string} venvPath - Ruta al virtual environment (default: '.venv')
   * @returns {string} - Ruta completa al ejecutable Python
   */
  getPythonExecutable(venvPath = '.venv') {
    if (this.isWindows || this.isWSL) {
      // En Windows y WSL, usar Scripts/
      return path.join(venvPath, 'Scripts', 'python.exe');
    } else {
      // En Linux/macOS nativos, usar bin/
      return path.join(venvPath, 'bin', 'python');
    }
  }

  /**
   * Obtiene la ruta correcta del ejecutable pytest en el virtual environment
   * @param {string} venvPath - Ruta al virtual environment (default: '.venv')
   * @returns {string} - Ruta completa al ejecutable pytest
   */
  getPytestExecutable(venvPath = '.venv') {
    if (this.isWindows || this.isWSL) {
      // En Windows y WSL, usar Scripts/
      return path.join(venvPath, 'Scripts', 'pytest.exe');
    } else {
      // En Linux/macOS nativos, usar bin/
      return path.join(venvPath, 'bin', 'pytest');
    }
  }

  /**
   * Obtiene la ruta correcta del ejecutable pip en el virtual environment
   * @param {string} venvPath - Ruta al virtual environment (default: '.venv')
   * @returns {string} - Ruta completa al ejecutable pip
   */
  getPipExecutable(venvPath = '.venv') {
    if (this.isWindows || this.isWSL) {
      // En Windows y WSL, usar Scripts/
      return path.join(venvPath, 'Scripts', 'pip.exe');
    } else {
      // En Linux/macOS nativos, usar bin/
      return path.join(venvPath, 'bin', 'pip');
    }
  }

  /**
   * Verifica si el virtual environment existe y está configurado correctamente
   * @param {string} venvPath - Ruta al virtual environment
   * @returns {boolean}
   */
  isVirtualEnvironmentValid(venvPath = '.venv') {
    const pythonPath = this.getPythonExecutable(venvPath);
    return fs.existsSync(pythonPath);
  }

  /**
   * Obtiene información del entorno para debugging
   * @returns {Object}
   */
  getEnvironmentInfo() {
    return {
      platform: this.platform,
      isWindows: this.isWindows,
      isLinux: this.isLinux,
      isMacOS: this.isMacOS,
      isWSL: this.isWSL,
      nodeVersion: process.version,
      architecture: os.arch(),
      pythonPath: this.getPythonExecutable(),
      pytestPath: this.getPytestExecutable(),
      pipPath: this.getPipExecutable(),
      venvValid: this.isVirtualEnvironmentValid()
    };
  }

  /**
   * Obtiene el comando correcto para activar el virtual environment
   * @param {string} venvPath - Ruta al virtual environment
   * @returns {string}
   */
  getActivateCommand(venvPath = '.venv') {
    if (this.isWindows) {
      return `${venvPath}\\Scripts\\activate.bat`;
    } else {
      return `source ${venvPath}/bin/activate`;
    }
  }

  /**
   * Construye un comando completo usando el virtual environment
   * @param {string} command - Comando base (ej: 'python -m pytest')
   * @param {string} venvPath - Ruta al virtual environment
   * @returns {string}
   */
  buildVenvCommand(command, venvPath = '.venv') {
    const pythonExe = this.getPythonExecutable(venvPath);
    
    // Reemplazar 'python' por la ruta completa al ejecutable
    if (command.startsWith('python ')) {
      return command.replace('python ', `"${pythonExe}" `);
    } else if (command === 'python') {
      return `"${pythonExe}"`;
    } else if (command.startsWith('pytest')) {
      const pytestExe = this.getPytestExecutable(venvPath);
      return command.replace('pytest', `"${pytestExe}"`);
    } else if (command.startsWith('pip ')) {
      const pipExe = this.getPipExecutable(venvPath);
      return command.replace('pip ', `"${pipExe}" `);
    }
    
    return command;
  }
}

// Instancia singleton
const platformUtils = new PlatformUtils();

module.exports = platformUtils;