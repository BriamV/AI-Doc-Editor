/**
 * Gestión de dependencias para QA Gate
 * Responsabilidad única: Verificación e instalación de dependencias
 * 
 * Principios SOLID aplicados:
 * - SRP: Solo maneja dependencias, no otras responsabilidades
 * - OCP: Extensible para nuevos tipos de dependencias
 * - ISP: Interfaces específicas para frontend y backend
 * 
 * Métricas objetivo:
 * - LOC: <212 (🟢)
 * - Complejidad ciclomática: ≤10
 * - Líneas: ≤100 caracteres
 */

const fs = require('fs');
const path = require('path');
const { checkPythonDependencySafe, installYarnDependenciesSafe } = require('./command-validator.cjs');
const logger = require('./logger.cjs');

class QADependencies {
  constructor(rootDir, autoInstall = false) {
    this.rootDir = rootDir;
    this.autoInstall = autoInstall;
  }

  /**
   * Verifica si una dependencia Python está instalada
   * @param {string} dependency - Nombre de la dependencia
   * @returns {boolean}
   */
  isPythonPackageInstalled(dependency) {
    return checkPythonDependencySafe(dependency, { stdio: 'ignore' });
  }

  /**
   * Lee requirements.txt y extrae dependencias
   * @returns {Object} - Mapa de dependencias
   */
  getBackendRequirements() {
    const requirementsPath = path.join(this.rootDir, 'backend', 'requirements.txt');
    if (!fs.existsSync(requirementsPath)) {
      return {};
    }
    
    const content = fs.readFileSync(requirementsPath, 'utf8');
    const requirements = {};
    
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [name, version] = line.split('==');
        if (name) {
          const cleanName = name.split('[')[0].trim();
          requirements[cleanName] = { 
            original: name,
            version: version || 'latest'
          };
        }
      }
    });
    
    return requirements;
  }

  /**
   * Verifica dependencias de frontend
   * @returns {Object} - Estado de dependencias
   */
  checkFrontendDependencies() {
    const packageJsonPath = path.join(this.rootDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return { missing: [], missingDev: [] };
    }
    
    const packageJson = require(packageJsonPath);
    const deps = Object.keys(packageJson.dependencies || {});
    const devDeps = Object.keys(packageJson.devDependencies || {});
    
    const requiredDeps = ['react', 'vite']; 
    const requiredDevDeps = ['jest', 'vitest', 'eslint', 'prettier', 'typescript'];
    
    const missing = requiredDeps.filter(dep => !deps.includes(dep));
    const missingDev = requiredDevDeps.filter(dep => 
      !devDeps.includes(dep) && !deps.includes(dep)
    );
    
    return { missing, missingDev };
  }

  /**
   * Verifica dependencias de backend
   * @returns {Object} - Estado de dependencias
   */
  checkBackendDependencies() {
    const criticalDeps = [
      'email_validator', 'pydantic', 'aiosqlite', 'authlib', 
      'httpx', 'pytest', 'fastapi', 'pytest_asyncio'
    ];
    
    const missingDeps = [];
    const installedDeps = [];
    const requirements = this.getBackendRequirements();
    const hasRequirements = fs.existsSync(path.join(this.rootDir, 'backend', 'requirements.txt'));
    
    logger.task('Verificando dependencias Python para tests...');
    
    for (const dep of criticalDeps) {
      if (this.isPythonPackageInstalled(dep)) {
        installedDeps.push(dep);
      } else {
        let installCmd = `pip install ${dep}`;
        
        // Buscar versión en requirements.txt
        Object.entries(requirements).forEach(([name, info]) => {
          if (name.toLowerCase() === dep.toLowerCase() || 
              info.original.toLowerCase().includes(dep.toLowerCase())) {
            installCmd = info.version && info.version !== 'latest' 
              ? `pip install ${info.original}==${info.version}`
              : `pip install ${info.original}`;
          }
        });
        
        missingDeps.push({ name: dep, command: installCmd, inRequirements: hasRequirements });
      }
    }
    
    return { missing: missingDeps, installed: installedDeps };
  }

  /**
   * Instala dependencias de frontend si es necesario
   * @param {Object} deps - Estado de dependencias
   */
  installFrontendDependencies(deps) {
    if (!this.autoInstall) return;

    if (deps.missing.length > 0) {
      logger.task('Instalando dependencias de producción...');
      installYarnDependenciesSafe(deps.missing, false, { stdio: 'inherit', cwd: this.rootDir });
    }
    
    if (deps.missingDev.length > 0) {
      logger.task('Instalando dependencias de desarrollo...');
      installYarnDependenciesSafe(deps.missingDev, true, { 
        stdio: 'inherit', 
        cwd: this.rootDir 
      });
    }
  }

  /**
   * Instala dependencias de backend si es necesario
   * @param {Object} deps - Estado de dependencias
   */
  installBackendDependencies(deps) {
    if (!this.autoInstall || deps.missing.length === 0) return;

    if (deps.missing.some(dep => dep.inRequirements)) {
      logger.task('Instalando dependencias desde requirements.txt...');
      try {
        execSync('pip install -r backend/requirements.txt', { 
          stdio: 'inherit', 
          cwd: this.rootDir 
        });
        logger.success('Dependencias instaladas correctamente');
      } catch (error) {
        logger.error(`Error al instalar dependencias: ${error.message}`);
      }
    }
  }
}

module.exports = QADependencies;