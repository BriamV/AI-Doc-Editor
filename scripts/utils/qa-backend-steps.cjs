/**
 * Pasos QA Gate específicos para Backend
 * Responsabilidad única: Verificaciones de backend (Python, FastAPI, etc.)
 * 
 * Métricas objetivo:
 * - LOC: <212 (🟢)
 * - Complejidad ciclomática: ≤10
 * - Líneas: ≤100 caracteres
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const logger = require('./logger.cjs');
const QADependencies = require('./qa-dependencies.cjs');
const platformUtils = require('./platform.cjs');

class QABackendSteps {
  constructor(rootDir, options = {}) {
    this.rootDir = rootDir;
    this.options = options;
    this.dependencies = new QADependencies(rootDir, options.autoInstall);
  }

  /**
   * Obtiene los pasos de verificación de backend
   * @returns {Array} - Lista de pasos de backend
   */
  getSteps() {
    return [
      {
        name: 'Backend: Python syntax check',
        category: 'backend',
        execute: () => this.checkPythonSyntax(),
        errorMessage: 'Python syntax check failed'
      },
      {
        name: 'Backend: Dependencies check',
        category: 'backend',
        execute: () => this.checkDependencies(),
        errorMessage: 'Python dependencies check failed'
      },
      {
        name: 'Backend: Unit tests',
        category: 'backend',
        execute: () => this.runTests(),
        errorMessage: 'Backend tests failed'
      },
      {
        name: 'Backend: API validation',
        category: 'backend',
        execute: () => this.validateAPI(),
        errorMessage: 'Backend API validation failed'
      }
    ];
  }

  /**
   * Verifica sintaxis de archivos Python
   */
  checkPythonSyntax() {
    if (!this._hasBackendDirectory()) {
      logger.task('Backend no encontrado, saltando verificación sintaxis');
      return;
    }

    logger.task('Verificando sintaxis de archivos Python...');
    const pythonCmd = platformUtils.buildVenvCommand('python -m compileall backend');
    execSync(pythonCmd, { 
      cwd: this.rootDir, 
      stdio: 'inherit' 
    });
  }

  /**
   * Verifica e instala dependencias de backend
   */
  checkDependencies() {
    if (!this._hasBackendDirectory()) {
      logger.task('Backend no encontrado, saltando dependencias');
      return;
    }

    const deps = this.dependencies.checkBackendDependencies();
    
    if (deps.missing.length > 0) {
      this._reportMissingDependencies(deps);
      this.dependencies.installBackendDependencies(deps);
    } else {
      logger.success(
        `Dependencias Python OK (${deps.installed.length})`
      );
    }
  }

  /**
   * Ejecuta pruebas unitarias de backend
   */
  runTests() {
    if (!this._hasBackendDirectory()) {
      logger.task('Backend no encontrado, saltando pruebas');
      return;
    }
    
    logger.task('Ejecutando pruebas backend (Python)...');
    
    try {
      this._validateCriticalDependencies();
      const success = this._executeAllTests();
      
      if (!success) {
        throw new Error('Una o más pruebas de backend fallaron');
      }
      
      logger.success('Pruebas backend completadas correctamente');
    } catch (error) {
      logger.error(`Error en pruebas backend: ${error.message}`);
      throw error;
    }
  }

  /**
   * Valida estructura de la API FastAPI
   */
  validateAPI() {
    if (!this._hasBackendDirectory()) {
      logger.task('Backend no encontrado, saltando validación API');
      return;
    }
    
    logger.task('Validando estructura API FastAPI...');
    
    const requiredFiles = ['app/main.py', 'app/routers'];
    const missing = this._checkRequiredFiles(requiredFiles);
    
    if (missing.length > 0) {
      throw new Error('Archivos API requeridos faltantes');
    }
  }

  // === Métodos Privados === //

  _hasBackendDirectory() {
    return fs.existsSync(path.join(this.rootDir, 'backend'));
  }

  _reportMissingDependencies(deps) {
    logger.task(`⚠️ Dependencias Python faltantes: ${deps.missing.length}`);
    deps.missing.forEach(dep => {
      logger.task(`💡 ${dep.name}: ${dep.command}`);
    });
  }

  _validateCriticalDependencies() {
    const criticalDeps = ['pytest', 'fastapi'];
    
    for (const dep of criticalDeps) {
      if (!this.dependencies.isPythonPackageInstalled(dep)) {
        logger.error(
          `Dependencia crítica faltante: ${dep}. ` +
          `Instala: pip install ${dep}`
        );
      }
    }
  }

  _executeAllTests() {
    const testFiles = this._findAllTestFiles();
    
    if (testFiles.length === 0) {
      logger.task('No se encontraron archivos de test Python');
      return true;
    }

    let allPassed = true;
    for (const testFile of testFiles) {
      try {
        logger.task(`Ejecutando ${testFile.name}...`);
        execSync(testFile.command, { 
          cwd: this.rootDir, 
          stdio: 'inherit' 
        });
        logger.success(`${testFile.name} OK`);
      } catch (error) {
        logger.error(`Error en ${testFile.name}`);
        allPassed = false;
      }
    }

    return allPassed;
  }

  _findAllTestFiles() {
    const testFiles = [];
    
    // Tests directos en /backend
    const backendDir = path.join(this.rootDir, 'backend');
    if (fs.existsSync(backendDir)) {
      const directTests = fs.readdirSync(backendDir)
        .filter(file => file.startsWith('test_') && file.endsWith('.py'))
        .map(file => ({
          name: file,
          command: platformUtils.buildVenvCommand(`python backend/${file}`)
        }));
      testFiles.push(...directTests);
    }
    
    // Tests en /backend/tests
    const testsDir = path.join(this.rootDir, 'backend', 'tests');
    if (fs.existsSync(testsDir)) {
      const testsDirTests = fs.readdirSync(testsDir)
        .filter(file => file.startsWith('test_') && file.endsWith('.py'))
        .map(file => ({
          name: file,
          command: platformUtils.buildVenvCommand(`python -m backend.tests.${file.replace('.py', '')}`)
        }));
      testFiles.push(...testsDirTests);
    }
    
    return testFiles;
  }

  _checkRequiredFiles(requiredFiles) {
    const missing = [];
    
    for (const file of requiredFiles) {
      const fullPath = path.join(this.rootDir, 'backend', file);
      
      if (fs.existsSync(fullPath)) {
        logger.success(`API file ${file} encontrado`);
      } else {
        logger.error(`API file ${file} no encontrado`);
        missing.push(file);
      }
    }
    
    return missing;
  }
}

module.exports = QABackendSteps;