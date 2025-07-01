/**
 * Pasos QA Gate específicos para Seguridad y Compatibilidad
 * Responsabilidad única: Verificaciones de seguridad y compatibilidad
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

class QASecuritySteps {
  constructor(rootDir, options = {}) {
    this.rootDir = rootDir;
    this.options = options;
  }

  /**
   * Obtiene los pasos de verificación de seguridad y compatibilidad
   * @returns {Array} - Lista de pasos de seguridad
   */
  getSteps() {
    return [
      {
        name: 'Security scanning (T-43)',
        category: 'security',
        execute: () => this.runSecurityScan(),
        errorMessage: 'Security scanning failed'
      },
      {
        name: 'Cross-platform compatibility',
        category: 'compatibility',
        execute: () => this.checkCrossPlatform(),
        errorMessage: 'Cross-platform compatibility check failed'
      }
    ];
  }

  /**
   * Ejecuta escaneo de seguridad del proyecto
   * Utiliza el script security-scan.cjs para análisis de vulnerabilidades
   */
  runSecurityScan() {
    logger.task('Ejecutando escaneo de seguridad (T-43)...');
    
    const securityScanPath = path.join(__dirname, '../security-scan.cjs');
    
    if (!this._securityScanExists(securityScanPath)) {
      logger.warn('Script de seguridad no encontrado, saltando escaneo');
      return;
    }
    
    execSync(`node ${securityScanPath}`, { 
      cwd: this.rootDir, 
      stdio: 'inherit' 
    });
  }

  /**
   * Verifica compatibilidad multiplataforma
   * Analiza scripts de package.json para rutas absolutas incompatibles
   */
  checkCrossPlatform() {
    logger.task('Verificando compatibilidad multiplataforma...');
    
    const packageJsonPath = path.join(this.rootDir, 'package.json');
    
    if (!this._packageJsonExists(packageJsonPath)) {
      logger.warn('package.json no encontrado, saltando verificación');
      return;
    }
    
    const compatibilityIssues = this._analyzePackageJsonScripts(
      packageJsonPath
    );
    
    if (compatibilityIssues.length > 0) {
      this._reportCompatibilityIssues(compatibilityIssues);
    } else {
      logger.success('Scripts en package.json son multiplataforma');
    }
  }

  // === Métodos Privados de Utilidad === //

  /**
   * Verifica si existe el script de seguridad
   * @param {string} securityScanPath - Ruta al script de seguridad
   * @returns {boolean}
   */
  _securityScanExists(securityScanPath) {
    return fs.existsSync(securityScanPath);
  }

  /**
   * Verifica si existe package.json
   * @param {string} packageJsonPath - Ruta a package.json
   * @returns {boolean}
   */
  _packageJsonExists(packageJsonPath) {
    return fs.existsSync(packageJsonPath);
  }

  /**
   * Analiza scripts de package.json para problemas de compatibilidad
   * @param {string} packageJsonPath - Ruta a package.json
   * @returns {Array} - Lista de problemas encontrados
   */
  _analyzePackageJsonScripts(packageJsonPath) {
    logger.task('Verificando package.json para compatibilidad de rutas...');
    
    try {
      const packageJson = require(packageJsonPath);
      const scripts = packageJson.scripts || {};
      const issues = [];
      
      Object.entries(scripts).forEach(([name, script]) => {
        const platformIssues = this._detectPlatformIssues(name, script);
        issues.push(...platformIssues);
      });
      
      return issues;
    } catch (error) {
      logger.error(`Error al leer package.json: ${error.message}`);
      return [];
    }
  }

  /**
   * Detecta problemas de compatibilidad de plataforma en un script
   * @param {string} scriptName - Nombre del script
   * @param {string} scriptContent - Contenido del script
   * @returns {Array} - Lista de problemas encontrados
   */
  _detectPlatformIssues(scriptName, scriptContent) {
    const issues = [];
    
    // Detectar rutas absolutas de Windows (C:\, D:\, etc.)
    if (/[A-Z]:\\/i.test(scriptContent)) {
      issues.push({
        script: scriptName,
        content: scriptContent,
        issue: 'Contiene rutas absolutas de Windows no portátiles'
      });
    }
    
    // Detectar rutas absolutas de Unix (/usr/, /opt/, etc.)
    if (/\/usr\//i.test(scriptContent) || /\/opt\//i.test(scriptContent)) {
      issues.push({
        script: scriptName,
        content: scriptContent,
        issue: 'Contiene rutas absolutas de Unix no portátiles'
      });
    }
    
    return issues;
  }

  /**
   * Reporta problemas de compatibilidad encontrados
   * @param {Array} issues - Lista de problemas de compatibilidad
   */
  _reportCompatibilityIssues(issues) {
    logger.error('Se encontraron problemas de compatibilidad:');
    
    issues.forEach(issue => {
      logger.error(
        `Script '${issue.script}' ${issue.issue}: ${issue.content}`
      );
    });
    
    this._suggestCompatibilityFixes();
  }

  /**
   * Sugiere soluciones para problemas de compatibilidad
   */
  _suggestCompatibilityFixes() {
    logger.task('💡 Sugerencias:');
    logger.task('- Usa rutas relativas en lugar de absolutas');
    logger.task('- Utiliza path.join() para construir rutas');
    logger.task('- Considera variables de entorno para rutas específicas');
  }
}

module.exports = QASecuritySteps;