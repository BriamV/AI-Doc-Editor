/**
 * Comandos de mantenimiento para AI-Doc-Editor
 * Implementa funcionalidades para limpieza y mantenimiento del proyecto
 * 
 * @module maintenance
 */

const logger = require('../utils/logger.cjs');
const { execute } = require('../utils/executor.cjs');
const config = require('../utils/config.cjs');
const path = require('path');
const fs = require('fs');

/**
 * Limpia los directorios de construcción y caché
 * @param {Array<string>} args - Argumentos adicionales
 */
function cleanBuild(args = []) {
  logger.title('Limpieza de Directorios de Construcción');
  logger.task('Eliminando directorios de construcción y caché...');
  
  execute(
    config.commands.clean,
    { stdio: 'inherit' },
    'Directorios de construcción y caché eliminados correctamente.',
    'Error al limpiar los directorios de construcción.'
  );
}

/**
 * Limpia los módulos de Node y reinstala las dependencias
 * @param {Array<string>} args - Argumentos adicionales
 */
function cleanModules(args = []) {
  logger.title('Limpieza de Módulos de Node');
  
  // Eliminar node_modules
  logger.task('Eliminando directorio node_modules...');
  execute(
    'rimraf node_modules',
    { stdio: 'inherit' },
    'Directorio node_modules eliminado correctamente.',
    'Error al eliminar el directorio node_modules.',
    false // No salir en caso de error
  );
  
  // Eliminar yarn.lock si existe
  const yarnLockPath = path.join(config.paths.root, 'yarn.lock');
  if (fs.existsSync(yarnLockPath)) {
    logger.task('Eliminando yarn.lock...');
    try {
      fs.unlinkSync(yarnLockPath);
      logger.success('Archivo yarn.lock eliminado correctamente.');
    } catch (error) {
      logger.error('Error al eliminar el archivo yarn.lock.');
    }
  }
  
  // Reinstalar dependencias
  logger.task('Reinstalando dependencias...');
  execute(
    'yarn install',
    { stdio: 'inherit' },
    'Dependencias reinstaladas correctamente.',
    'Error al reinstalar las dependencias.'
  );
}

/**
 * Actualiza las dependencias a sus últimas versiones
 * @param {Array<string>} args - Argumentos adicionales
 */
function updateDependencies(args = []) {
  logger.title('Actualización de Dependencias');
  logger.task('Verificando actualizaciones disponibles...');
  
  // Mostrar actualizaciones disponibles
  execute(
    'yarn outdated',
    { stdio: 'inherit' },
    null,
    null,
    false // No salir en caso de error
  );
  
  // Preguntar si se desea actualizar
  logger.info('');
  logger.info('Para actualizar todas las dependencias, ejecuta:');
  logger.info('  yarn upgrade-interactive --latest');
  logger.info('');
  logger.info('Para actualizar una dependencia específica, ejecuta:');
  logger.info('  yarn upgrade [package] --latest');
  logger.info('');
  logger.warn('Nota: Actualizar dependencias puede introducir cambios incompatibles.');
  logger.warn('      Asegúrate de revisar los cambios y ejecutar las pruebas después.');
}

/**
 * Verifica la salud del proyecto
 * @param {Array<string>} args - Argumentos adicionales
 */
function checkHealth(args = []) {
  logger.title('Verificación de Salud del Proyecto');
  
  // Verificar dependencias
  logger.task('Verificando integridad de dependencias...');
  const depsSuccess = execute(
    'yarn check --integrity',
    { stdio: 'inherit' },
    'Integridad de dependencias verificada correctamente.',
    'Problemas de integridad detectados en las dependencias.',
    false // No salir en caso de error
  );
  
  // Verificar TypeScript
  logger.task('Verificando compilación de TypeScript...');
  const tscSuccess = execute(
    config.commands.tscCheck,
    { stdio: 'inherit' },
    'Compilación de TypeScript verificada correctamente.',
    'Errores de TypeScript detectados.',
    false // No salir en caso de error
  );
  
  // Verificar ESLint
  logger.task('Verificando reglas de ESLint...');
  const lintSuccess = execute(
    config.commands.lint,
    { stdio: 'inherit' },
    'Reglas de ESLint verificadas correctamente.',
    'Problemas de ESLint detectados.',
    false // No salir en caso de error
  );
  
  // Verificar pruebas
  logger.task('Ejecutando pruebas unitarias...');
  const testSuccess = execute(
    config.commands.test,
    { stdio: 'inherit' },
    'Pruebas unitarias ejecutadas correctamente.',
    'Algunas pruebas unitarias han fallado.',
    false // No salir en caso de error
  );
  
  // Mostrar resumen
  logger.info('');
  logger.info('Resumen de salud del proyecto:');
  logger.info('------------------------------');
  logger.info(`Integridad de dependencias: ${depsSuccess ? '✅ OK' : '❌ Problemas detectados'}`);
  logger.info(`Compilación de TypeScript: ${tscSuccess ? '✅ OK' : '❌ Problemas detectados'}`);
  logger.info(`Reglas de ESLint: ${lintSuccess ? '✅ OK' : '❌ Problemas detectados'}`);
  logger.info(`Pruebas unitarias: ${testSuccess ? '✅ OK' : '❌ Problemas detectados'}`);
  logger.info('');
  
  if (depsSuccess && tscSuccess && lintSuccess && testSuccess) {
    logger.complete('✅ El proyecto está en buen estado.');
  } else {
    logger.warn('⚠️ Se han detectado problemas en el proyecto.');
    logger.info('Revisa los detalles anteriores para más información.');
  }
}

/**
 * Optimiza el proyecto para producción
 * @param {Array<string>} args - Argumentos adicionales
 */
function optimizeProject(args = []) {
  logger.title('Optimización del Proyecto para Producción');
  
  // Limpiar caché y construcciones anteriores
  logger.task('Limpiando caché y construcciones anteriores...');
  execute(
    config.commands.clean,
    { stdio: 'inherit' },
    'Caché y construcciones anteriores eliminadas correctamente.',
    'Error al limpiar caché y construcciones anteriores.',
    false // No salir en caso de error
  );
  
  // Instalar dependencias en modo producción
  logger.task('Instalando dependencias en modo producción...');
  execute(
    'yarn install --production',
    { stdio: 'inherit' },
    'Dependencias instaladas en modo producción correctamente.',
    'Error al instalar dependencias en modo producción.',
    false // No salir en caso de error
  );
  
  // Construir para producción
  logger.task('Construyendo para producción...');
  execute(
    config.commands.build,
    { stdio: 'inherit' },
    'Construcción para producción completada correctamente.',
    'Error al construir para producción.',
    false // No salir en caso de error
  );
  
  logger.complete('✅ Proyecto optimizado para producción.');
  logger.info('Los archivos de construcción están disponibles en el directorio "dist".');
}

module.exports = {
  cleanBuild,
  cleanModules,
  updateDependencies,
  checkHealth,
  optimizeProject
};
