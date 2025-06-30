/**
 * Utilidad de logging para scripts de AI-Doc-Editor
 * Proporciona un formato consistente para todos los mensajes de consola
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Formatea un mensaje con un emoji y color
 * @param {string} message - El mensaje a mostrar
 * @param {string} emoji - El emoji a mostrar antes del mensaje
 * @param {string} color - El color a usar (de la paleta definida)
 * @returns {void}
 */
function formatLog(message, emoji = '', color = colors.reset) {
  console.log(`${emoji ? emoji + ' ' : ''}${color}${message}${colors.reset}`);
}

const logger = {
  /**
   * Muestra un título de sección
   * @param {string} title - El título a mostrar
   */
  title: (title) => {
    console.log('\n' + colors.bright + colors.cyan + title + colors.reset);
    console.log('='.repeat(title.length));
  },

  /**
   * Muestra un mensaje informativo
   * @param {string} message - El mensaje a mostrar
   */
  info: (message) => formatLog(message, 'ℹ️', colors.blue),

  /**
   * Muestra un mensaje de éxito
   * @param {string} message - El mensaje a mostrar
   */
  success: (message) => formatLog(message, '✅', colors.green),

  /**
   * Muestra un mensaje de advertencia
   * @param {string} message - El mensaje a mostrar
   */
  warn: (message) => formatLog(message, '⚠️', colors.yellow),

  /**
   * Muestra un mensaje de error
   * @param {string} message - El mensaje a mostrar
   */
  error: (message) => formatLog(message, '❌', colors.red),

  /**
   * Muestra un mensaje de inicio de tarea
   * @param {string} message - El mensaje a mostrar
   */
  task: (message) => formatLog(message, '🔄', colors.magenta),

  /**
   * Muestra un mensaje de finalización
   * @param {string} message - El mensaje a mostrar
   */
  complete: (message) => formatLog(message, '🎉', colors.green),
};

module.exports = logger;
