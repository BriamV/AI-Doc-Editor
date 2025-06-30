/**
 * Utilidad para ejecutar comandos con manejo de errores consistente
 * Proporciona una interfaz unificada para ejecutar comandos del shell
 */

const { execSync } = require('child_process');
const logger = require('./logger.cjs');

/**
 * Ejecuta un comando y maneja posibles errores
 * @param {string} command - El comando a ejecutar
 * @param {Object} options - Opciones para execSync
 * @param {string} successMessage - Mensaje a mostrar en caso de éxito
 * @param {string} errorMessage - Mensaje a mostrar en caso de error
 * @param {boolean} exitOnError - Si debe terminar el proceso en caso de error
 * @returns {boolean} - true si el comando se ejecutó correctamente
 */
function execute(command, options = {}, successMessage = null, errorMessage = null, exitOnError = true) {
  try {
    // Configuración por defecto para mostrar la salida en tiempo real
    const defaultOptions = { stdio: 'inherit' };
    const mergedOptions = { ...defaultOptions, ...options };
    
    execSync(command, mergedOptions);
    
    if (successMessage) {
      logger.success(successMessage);
    }
    
    return true;
  } catch (error) {
    if (errorMessage) {
      logger.error(errorMessage);
    } else {
      logger.error(`Error al ejecutar: ${command}`);
    }
    
    // Mostrar detalles del error si están disponibles
    if (error.stdout) console.error(error.stdout.toString());
    if (error.stderr) console.error(error.stderr.toString());
    
    if (exitOnError) {
      process.exit(1);
    }
    
    return false;
  }
}

/**
 * Ejecuta una serie de comandos en secuencia
 * @param {Array<Object>} commands - Array de objetos con comandos y mensajes
 * @param {boolean} stopOnError - Si debe detenerse en el primer error
 * @returns {boolean} - true si todos los comandos se ejecutaron correctamente
 */
function executeSequence(commands, stopOnError = true) {
  let allSuccessful = true;
  
  for (const cmd of commands) {
    const { command, options, successMessage, errorMessage } = cmd;
    
    logger.task(cmd.taskMessage || `Ejecutando: ${command}`);
    
    const success = execute(
      command, 
      options || {}, 
      successMessage, 
      errorMessage, 
      stopOnError
    );
    
    if (!success) {
      allSuccessful = false;
      if (stopOnError) break;
    }
  }
  
  return allSuccessful;
}

module.exports = {
  execute,
  executeSequence
};
