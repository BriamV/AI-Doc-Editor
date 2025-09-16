/**
 * Comandos de desarrollo para AI-Doc-Editor
 * Implementa funcionalidades de servidor de desarrollo y construcción
 * 
 * @module dev
 */

const logger = require('../utils/logger.cjs');
const { execute } = require('../utils/executor.cjs');
const config = require('../utils/config.cjs');

/**
 * Inicia el servidor de desarrollo
 * @param {Array<string>} args - Argumentos adicionales
 */
function startDev(args = []) {
  logger.title('Iniciando Servidor de Desarrollo');
  logger.task('Arrancando servidor en modo desarrollo...');
  
  execute(
    config.commands.dev,
    { stdio: 'inherit' },
    null, // No mostrar mensaje de éxito ya que el servidor sigue ejecutándose
    'Error al iniciar el servidor de desarrollo.'
  );
}

/**
 * Construye la aplicación para producción
 * @param {Array<string>} args - Argumentos adicionales
 */
function buildApp(args = []) {
  const startTime = Date.now();
  logger.title('Construcción de la Aplicación');
  logger.task('Generando build de producción optimizado...');
  
  execute(
    config.commands.build,
    { stdio: 'inherit' },
    null,
    'Error al construir la aplicación.'
  );
  
  const endTime = Date.now();
  const buildTime = ((endTime - startTime) / 1000).toFixed(2);
  
  logger.success(`Construcción completada en ${buildTime} segundos.`);
  logger.info('Los archivos de construcción están disponibles en el directorio "dist".');
}

/**
 * Previsualiza la construcción de producción
 * @param {Array<string>} args - Argumentos adicionales
 */
function previewBuild(args = []) {
  logger.title('Previsualización de Construcción');
  logger.task('Iniciando servidor de previsualización...');
  
  // Verificar si existe el directorio dist
  const fs = require('fs');
  const path = require('path');
  const distPath = path.join(config.paths.root, 'dist');
  
  if (!fs.existsSync(distPath)) {
    logger.warn('El directorio "dist" no existe. Ejecutando construcción primero...');
    buildApp();
  }
  
  execute(
    config.commands.preview,
    { stdio: 'inherit' },
    null, // No mostrar mensaje de éxito ya que el servidor sigue ejecutándose
    'Error al iniciar el servidor de previsualización.'
  );
}

/**
 * Ejecuta la aplicación en modo Electron
 * @param {Array<string>} args - Argumentos adicionales
 */
function runElectron(args = []) {
  logger.title('Iniciando Aplicación Electron');
  logger.task('Arrancando en modo aplicación de escritorio...');
  
  execute(
    'yarn electron',
    { stdio: 'inherit' },
    null, // No mostrar mensaje de éxito ya que la aplicación sigue ejecutándose
    'Error al iniciar la aplicación Electron.'
  );
}

/**
 * Empaqueta la aplicación Electron
 * @param {Array<string>} args - Argumentos adicionales
 */
function packElectron(args = []) {
  logger.title('Empaquetando Aplicación Electron');
  logger.task('Generando paquete para desarrollo...');
  
  execute(
    'yarn electron:pack',
    { stdio: 'inherit' },
    'Aplicación empaquetada correctamente para desarrollo.',
    'Error al empaquetar la aplicación Electron.'
  );
  
  logger.info('El paquete está disponible en el directorio "release".');
}

/**
 * Construye y empaqueta la aplicación para distribución
 * @param {Array<string>} args - Argumentos adicionales
 */
function makeDistribution(args = []) {
  logger.title('Generando Distribución');
  logger.task('Construyendo y empaquetando para distribución...');
  
  execute(
    'yarn electron:make',
    { stdio: 'inherit' },
    'Distribución generada correctamente.',
    'Error al generar la distribución.'
  );
  
  logger.info('Los archivos de distribución están disponibles en el directorio "release".');
  logger.info('Nota: La distribución incluye instaladores según la plataforma actual.');
}

module.exports = {
  startDev,
  buildApp,
  previewBuild,
  runElectron,
  packElectron,
  makeDistribution
};
