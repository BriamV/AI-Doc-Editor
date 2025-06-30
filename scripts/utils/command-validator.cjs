/**
 * @file command-validator.cjs
 * @description Utilidad para validar y sanitizar comandos antes de su ejecución,
 * previniendo potenciales inyecciones de comando
 */

const { execSync } = require('child_process');
const logger = require('./logger.cjs');

/**
 * Lista de patrones peligrosos en comandos
 * @type {Array<RegExp>}
 */
const DANGEROUS_PATTERNS = [
  /[;&|`$]/,  // Operadores de encadenamiento y ejecución
  /\$\([^)]*\)/,  // Sustitución de comandos $(comando)
  /`[^`]*`/,  // Sustitución de comandos con backticks
  />\s*[^/]/,  // Redirección a archivos (exceptuando /dev)
  /\/dev\/tcp/,  // Conexiones de red vía /dev/tcp
  /eval\s*\(/,  // Eval y otras funciones peligrosas
];

/**
 * Patrones permitidos para casos legítimos que podrían marcar falsos positivos
 * @type {Array<RegExp>}
 */
const ALLOWED_EXCEPTIONS = [
  // Comandos típicos de npm/yarn que usan --flag=value
  /yarn\s+[a-zA-Z\-]+\s+--[a-zA-Z\-]+=[a-zA-Z0-9\-\.\/]+/,
  // Tuberías seguras comunes como "command | grep pattern"
  /\|\s*grep\s+[a-zA-Z0-9\-_]+/,
  // Operador AND para comandos seguros encadenados: "mkdir -p dir && cd dir"
  /mkdir\s+-p\s+[a-zA-Z0-9\-_\/]+\s+&&\s+cd\s+[a-zA-Z0-9\-_\/]+/,
];

/**
 * Verifica si un comando es potencialmente peligroso
 * @param {string} command - El comando a ejecutar
 * @returns {boolean} - true si es potencialmente peligroso, false en caso contrario
 */
function isDangerousCommand(command) {
  // Si no hay comando o no es string
  if (!command || typeof command !== 'string') {
    return true;
  }
  
  // Verificar patrones peligrosos
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      // Verificar si es una excepción permitida
      const isException = ALLOWED_EXCEPTIONS.some(exc => exc.test(command));
      if (!isException) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Sanea una dependencia de Python o NPM antes de instalarla
 * @param {string} dependency - Nombre de la dependencia a sanear
 * @returns {string|null} - Nombre saneado o null si es inválido
 */
function sanitizeDependency(dependency) {
  if (!dependency || typeof dependency !== 'string') {
    return null;
  }
  
  // Eliminar caracteres peligrosos y mantener solo caracteres válidos para nombres de paquetes
  const sanitized = dependency.trim()
    // Obtener el nombre base del paquete (antes de cualquier paréntesis o corchete)
    .split(/[\[\(]/)[0]
    .trim()
    // Mantener solo caracteres seguros para nombres de paquetes
    .replace(/[^a-zA-Z0-9\-_\.@/]/g, '');
    
  // Verificar que el resultado es un nombre de paquete válido
  if (/^[a-zA-Z0-9\-_\.@][a-zA-Z0-9\-_\.@/]*$/.test(sanitized)) {
    return sanitized;
  }
  
  return null;
}

/**
 * Ejecuta un comando de forma segura, con validación previa
 * @param {string} command - El comando a ejecutar
 * @param {Object} options - Opciones para execSync
 * @returns {Buffer|string} - El resultado de la ejecución
 * @throws {Error} - Si el comando es considerado peligroso
 */
function execSyncSafe(command, options = {}) {
  if (isDangerousCommand(command)) {
    const error = new Error(`Comando potencialmente peligroso rechazado: "${command}"`);
    logger.error('🛑 Error de seguridad: ' + error.message);
    throw error;
  }
  
  try {
    return execSync(command, options);
  } catch (error) {
    logger.error(`❌ Error al ejecutar: ${command}`);
    logger.error(error.message);
    throw error;
  }
}

/**
 * Ejecuta de forma segura un comando para verificar una dependencia de Python
 * @param {string} dependency - Nombre de la dependencia de Python
 * @param {Object} options - Opciones para execSync
 * @returns {boolean} - true si la importación es exitosa, false en caso contrario
 */
function checkPythonDependencySafe(dependency, options = {}) {
  const sanitized = sanitizeDependency(dependency);
  
  if (!sanitized) {
    logger.error(`🛑 Nombre de dependencia inválido: "${dependency}"`);
    return false;
  }
  
  try {
    execSync(`python -c "import ${sanitized}"`, { ...options, stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Ejecuta de forma segura un comando yarn para instalar dependencias
 * @param {Array<string>} dependencies - Lista de dependencias a instalar
 * @param {boolean} isDev - Si son dependencias de desarrollo
 * @param {Object} options - Opciones para execSync
 * @returns {boolean} - true si la instalación es exitosa
 */
function installYarnDependenciesSafe(dependencies, isDev = false, options = {}) {
  if (!dependencies || !Array.isArray(dependencies) || dependencies.length === 0) {
    return false;
  }
  
  const sanitizedDeps = dependencies
    .map(dep => sanitizeDependency(dep))
    .filter(Boolean); // Eliminar null/undefined
    
  if (sanitizedDeps.length === 0) {
    logger.error('🛑 No hay dependencias válidas para instalar');
    return false;
  }
  
  const devFlag = isDev ? '-D' : '';
  const command = `yarn add ${devFlag} ${sanitizedDeps.join(' ')}`;
  
  try {
    execSyncSafe(command, options);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Ejecuta un script git diff de forma segura
 * @param {string} baseBranch - Rama base para comparar
 * @param {Object} options - Opciones para execSync
 * @returns {string} - El resultado del comando git diff
 */
function gitDiffSafe(baseBranch, options = {}) {
  // Validar que baseBranch sea un nombre de rama válido
  if (!baseBranch || typeof baseBranch !== 'string') {
    baseBranch = 'main'; // Valor por defecto seguro
  }
  
  // Sanitizar el nombre de la rama
  const sanitizedBranch = baseBranch
    .trim()
    .replace(/[^a-zA-Z0-9\-_\/\.]/g, ''); // Solo caracteres válidos para ramas git
  
  // Comando seguro para git diff
  const command = `git diff --name-only ${sanitizedBranch}...HEAD`;
  
  return execSyncSafe(command, { ...options, encoding: 'utf8' });
}

module.exports = {
  isDangerousCommand,
  sanitizeDependency,
  execSyncSafe,
  checkPythonDependencySafe,
  installYarnDependenciesSafe,
  gitDiffSafe
};
