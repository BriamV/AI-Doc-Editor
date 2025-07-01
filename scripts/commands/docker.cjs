/**
 * Comandos de Docker para AI-Doc-Editor
 * Implementa funcionalidades para gestionar entornos Docker
 * 
 * @module docker
 */

const logger = require('../utils/logger.cjs');
const { execute } = require('../utils/executor.cjs');
const config = require('../utils/config.cjs');
const os = require('os');

/**
 * Verifica la disponibilidad de Docker
 * @returns {boolean} - true si Docker está disponible
 */
function checkDocker() {
  logger.task('Verificando instalación de Docker...');
  
  try {
    // Usar comando diferente según plataforma
    const isWindows = os.platform() === 'win32';
    const dockerCmd = isWindows ? 'docker --version' : 'docker --version';
    
    execute(
      dockerCmd,
      { stdio: 'pipe' },
      '✅ Docker está disponible',
      null,
      false
    );
    
    // En sistemas Linux, verificar si se necesita sg docker
    if (os.platform() === 'linux') {
      try {
        execute('sg docker -c "docker ps"', { stdio: 'pipe' }, null, null, false);
        logger.info('Usando "sg docker -c" para comandos Docker');
      } catch (error) {
        // Intentar sin sg docker
        try {
          execute('docker ps', { stdio: 'pipe' }, null, null, false);
        } catch (innerError) {
          logger.warn('⚠️ Usa "sg docker -c" para comandos Docker');
        }
      }
    }
    
    return true;
  } catch (error) {
    logger.error('❌ Docker no está disponible o no está en ejecución');
    logger.info('Por favor, instala Docker o asegúrate de que esté en ejecución');
    return false;
  }
}

/**
 * Prepara el comando Docker según la plataforma
 * @param {string} cmd - El comando Docker a ejecutar
 * @returns {string} - El comando preparado
 */
function prepareDockerCommand(cmd) {
  // En Linux, usar sg docker si es necesario
  if (os.platform() === 'linux') {
    try {
      execute('docker ps', { stdio: 'pipe' }, null, null, false);
      return cmd;
    } catch (error) {
      return `sg docker -c "${cmd}"`;
    }
  }
  
  return cmd;
}

/**
 * Inicia el entorno de desarrollo con Docker
 * @param {Array<string>} args - Argumentos adicionales
 */
function startDevDocker(args = []) {
  logger.title('Iniciando Entorno de Desarrollo Docker');
  
  if (!checkDocker()) {
    process.exit(1);
  }
  
  logger.task('Iniciando contenedores de desarrollo...');
  
  const dockerCmd = prepareDockerCommand('docker-compose up app-dev');
  
  execute(
    dockerCmd,
    { stdio: 'inherit' },
    null, // No mostrar mensaje de éxito ya que los contenedores siguen ejecutándose
    'Error al iniciar los contenedores de desarrollo.'
  );
}

/**
 * Inicia el entorno de producción con Docker
 * @param {Array<string>} args - Argumentos adicionales
 */
function startProdDocker(args = []) {
  logger.title('Iniciando Entorno de Producción Docker');
  
  if (!checkDocker()) {
    process.exit(1);
  }
  
  logger.task('Iniciando contenedores de producción...');
  
  const dockerCmd = prepareDockerCommand('docker-compose --profile production up app-prod');
  
  execute(
    dockerCmd,
    { stdio: 'inherit' },
    null, // No mostrar mensaje de éxito ya que los contenedores siguen ejecutándose
    'Error al iniciar los contenedores de producción.'
  );
}

/**
 * Inicia el stack completo con backend
 * @param {Array<string>} args - Argumentos adicionales
 */
function startBackendDocker(args = []) {
  logger.title('Iniciando Stack Completo con Backend');
  
  if (!checkDocker()) {
    process.exit(1);
  }
  
  logger.task('Iniciando contenedores con servicios de backend...');
  
  const dockerCmd = prepareDockerCommand('docker-compose --profile backend up');
  
  execute(
    dockerCmd,
    { stdio: 'inherit' },
    null, // No mostrar mensaje de éxito ya que los contenedores siguen ejecutándose
    'Error al iniciar los contenedores con backend.'
  );
}

/**
 * Detiene todos los servicios Docker
 * @param {Array<string>} args - Argumentos adicionales
 */
function stopDocker(args = []) {
  logger.title('Deteniendo Servicios Docker');
  
  if (!checkDocker()) {
    process.exit(1);
  }
  
  logger.task('Deteniendo todos los contenedores...');
  
  const dockerCmd = prepareDockerCommand('docker-compose down');
  
  execute(
    dockerCmd,
    { stdio: 'inherit' },
    'Todos los contenedores han sido detenidos correctamente.',
    'Error al detener los contenedores.'
  );
}

/**
 * Muestra logs de Docker
 * @param {Array<string>} args - Argumentos adicionales
 */
function showDockerLogs(args = []) {
  logger.title('Logs de Docker');
  
  if (!checkDocker()) {
    process.exit(1);
  }
  
  logger.task('Mostrando logs de contenedores...');
  
  const dockerCmd = prepareDockerCommand('docker-compose logs -f');
  
  execute(
    dockerCmd,
    { stdio: 'inherit' },
    null, // No mostrar mensaje de éxito ya que los logs siguen mostrándose
    'Error al mostrar los logs de Docker.'
  );
}

module.exports = {
  startDevDocker,
  startProdDocker,
  startBackendDocker,
  stopDocker,
  showDockerLogs
};
