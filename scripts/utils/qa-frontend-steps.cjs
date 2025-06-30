/**
 * Pasos QA Gate específicos para Frontend
 * Responsabilidad única: Verificaciones de frontend (TypeScript, ESLint, etc.)
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

class QAFrontendSteps {
  constructor(rootDir, options = {}) {
    this.rootDir = rootDir;
    this.options = options;
    this.dependencies = new QADependencies(rootDir, options.autoInstall);
  }

  /**
   * Obtiene los pasos de verificación de frontend
   * @returns {Array} - Lista de pasos de frontend
   */
  getSteps() {
    return [
      {
        name: 'Frontend: TypeScript compilation',
        category: 'frontend',
        execute: () => this.checkTypeScript(),
        errorMessage: 'TypeScript failed'
      },
      {
        name: 'Frontend: ESLint (zero warnings)',
        category: 'frontend',
        execute: () => this.runESLint(),
        errorMessage: 'ESLint failed'
      },
      {
        name: 'Frontend: Prettier formatting',
        category: 'frontend',
        execute: () => this.checkPrettier(),
        errorMessage: 'Formatting failed'
      },
      {
        name: 'Frontend: Dependencies check',
        category: 'frontend',
        execute: () => this.checkDependencies(),
        errorMessage: 'Frontend dependencies check failed'
      },
      {
        name: 'Frontend: Unit tests',
        category: 'frontend',
        execute: () => this.runTests(),
        errorMessage: 'Frontend tests failed'
      },
      {
        name: 'Frontend: Build verification',
        category: 'frontend',
        execute: () => this.verifyBuild(),
        errorMessage: 'Frontend build failed'
      }
    ];
  }

  /**
   * Verifica compilación de TypeScript
   */
  checkTypeScript() {
    logger.task('Comprobando tipos y errores de TypeScript...');
    execSync('npx tsc --noEmit', { 
      cwd: this.rootDir, 
      stdio: 'inherit' 
    });
  }

  /**
   * Ejecuta ESLint con configuración estricta
   */
  runESLint() {
    logger.task('Ejecutando ESLint...');
    execSync('npx eslint "src/**/*.{js,jsx,ts,tsx}"', { 
      cwd: this.rootDir, 
      stdio: 'inherit' 
    });
  }

  /**
   * Verifica formato con Prettier
   */
  checkPrettier() {
    logger.task('Verificando formato con Prettier...');
    const prettierCmd = 'npx prettier --check ' +
      '"src/**/*.{js,jsx,ts,tsx,css,scss,html}"';
    
    execSync(prettierCmd, { 
      cwd: this.rootDir, 
      stdio: 'inherit' 
    });
  }

  /**
   * Verifica e instala dependencias de frontend
   */
  checkDependencies() {
    const deps = this.dependencies.checkFrontendDependencies();
    
    if (this._hasMissingDependencies(deps)) {
      this._reportMissingDependencies(deps);
      this.dependencies.installFrontendDependencies(deps);
    } else {
      logger.success('Todas las dependencias frontend están instaladas');
    }
  }

  /**
   * Ejecuta pruebas unitarias de frontend
   */
  runTests() {
    logger.task('Ejecutando pruebas unitarias frontend...');
    
    try {
      const testRunner = this._detectTestRunner();
      
      if (testRunner === 'vitest') {
        logger.task('Usando Vitest como test runner...');
        execSync('npx vitest run --passWithNoTests', { 
          cwd: this.rootDir, 
          stdio: 'inherit' 
        });
      } else if (testRunner === 'jest') {
        logger.task('Usando Jest como test runner...');
        execSync('npx jest --passWithNoTests', { 
          cwd: this.rootDir, 
          stdio: 'inherit' 
        });
      } else {
        this._handleNoTestRunner();
        return;
      }
      
      logger.success('Pruebas frontend completadas');
    } catch (error) {
      logger.error('Pruebas frontend fallidas');
      throw error;
    }
  }

  /**
   * Verifica build de producción
   */
  verifyBuild() {
    logger.task('Verificando build frontend (Vite)...');
    
    try {
      execSync('npx vite build', { 
        cwd: this.rootDir, 
        stdio: 'inherit' 
      });
    } catch (error) {
      if (this._isBuildDependencyError(error)) {
        logger.warn('Error de dependencias de build. ' +
          'Considera ejecutar: yarn install');
        throw new Error('Build falló debido a dependencias faltantes');
      }
      throw error;
    }
  }

  // === Métodos Privados === //

  _hasMissingDependencies(deps) {
    return deps.missing.length > 0 || deps.missingDev.length > 0;
  }

  _reportMissingDependencies(deps) {
    if (deps.missing.length > 0) {
      logger.task(
        `⚠️ Dependencias Frontend faltantes: ${deps.missing.join(', ')}`
      );
      logger.task(`💡 Ejecuta: yarn add ${deps.missing.join(' ')}`);
    }
    
    if (deps.missingDev.length > 0) {
      logger.task(
        `⚠️ Dependencias Dev faltantes: ${deps.missingDev.join(', ')}`
      );
      logger.task(`💡 Ejecuta: yarn add -D ${deps.missingDev.join(' ')}`);
    }
  }

  _detectTestRunner() {
    const hasVitest = fs.existsSync(
      path.join(this.rootDir, 'node_modules', 'vitest')
    );
    const hasJest = fs.existsSync(
      path.join(this.rootDir, 'node_modules', 'jest')
    );
    
    if (hasVitest) return 'vitest';
    if (hasJest) return 'jest';
    return null;
  }

  _handleNoTestRunner() {
    logger.task('No hay test runner instalado, saltando pruebas unitarias');
    logger.warn('Considera instalar jest o vitest para ejecutar pruebas');
  }

  _isBuildDependencyError(error) {
    return error.message.includes('rollup') || 
           error.message.includes('MODULE_NOT_FOUND');
  }
}

module.exports = QAFrontendSteps;