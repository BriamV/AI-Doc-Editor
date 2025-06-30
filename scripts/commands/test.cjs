/**
 * Comandos de pruebas para AI-Doc-Editor
 * Implementa funcionalidades para ejecutar pruebas unitarias y e2e
 * 
 * @module test
 */

const logger = require('../utils/logger.cjs');
const { execute } = require('../utils/executor.cjs');
const config = require('../utils/config.cjs');
const path = require('path');
const fs = require('fs');

/**
 * Ejecuta pruebas unitarias
 * @param {Array<string>} args - Argumentos adicionales para pasar al comando de prueba
 */
function runTests(args = []) {
  logger.title('Ejecutando Pruebas Unitarias');
  logger.task('Iniciando suite de pruebas...');
  
  // Construir comando con argumentos adicionales
  const testCommand = args.length > 0 
    ? `${config.commands.test} ${args.join(' ')}`
    : config.commands.test;
  
  execute(
    testCommand,
    { stdio: 'inherit' },
    'Pruebas unitarias completadas con éxito.',
    'Algunas pruebas han fallado. Revisa los errores para más detalles.'
  );
}

/**
 * Ejecuta pruebas unitarias en modo observador
 * @param {Array<string>} args - Argumentos adicionales
 */
function runTestsWatch(args = []) {
  logger.title('Ejecutando Pruebas en Modo Observador');
  logger.task('Iniciando suite de pruebas en modo watch...');
  logger.info('Las pruebas se ejecutarán automáticamente cuando cambien los archivos.');
  logger.info('Presiona "q" para salir del modo observador.');
  
  // Construir comando con argumentos adicionales
  const testCommand = args.length > 0 
    ? `${config.commands.testWatch} ${args.join(' ')}`
    : config.commands.testWatch;
  
  execute(
    testCommand,
    { stdio: 'inherit' },
    null, // No mostrar mensaje de éxito ya que el proceso sigue ejecutándose
    'Error al iniciar el modo observador de pruebas.'
  );
}

/**
 * Ejecuta pruebas unitarias con cobertura
 * @param {Array<string>} args - Argumentos adicionales
 */
function runTestCoverage(args = []) {
  logger.title('Ejecutando Pruebas con Cobertura');
  logger.task('Iniciando análisis de cobertura de código...');
  
  // Construir comando con argumentos adicionales
  const testCommand = args.length > 0 
    ? `${config.commands.testCoverage} ${args.join(' ')}`
    : config.commands.testCoverage;
  
  const success = execute(
    testCommand,
    { stdio: 'inherit' },
    'Análisis de cobertura completado.',
    'Error al ejecutar el análisis de cobertura.',
    false // No salir en caso de error
  );
  
  if (success) {
    const coveragePath = path.join(config.paths.root, 'coverage/lcov-report/index.html');
    if (fs.existsSync(coveragePath)) {
      logger.info(`Informe de cobertura generado en: ${coveragePath}`);
      logger.info('Puedes abrir este archivo en tu navegador para ver los detalles.');
    }
  }
}

/**
 * Ejecuta pruebas end-to-end
 * @param {Array<string>} args - Argumentos adicionales
 */
function runE2ETests(args = []) {
  logger.title('Ejecutando Pruebas End-to-End');
  logger.task('Iniciando pruebas E2E con Cypress...');
  
  // Verificar si el servidor de desarrollo está en ejecución
  logger.info('Nota: Asegúrate de que el servidor de desarrollo esté en ejecución.');
  
  // Construir comando con argumentos adicionales
  const testCommand = args.length > 0 
    ? `${config.commands.testE2E} ${args.join(' ')}`
    : config.commands.testE2E;
  
  execute(
    testCommand,
    { stdio: 'inherit' },
    'Pruebas E2E completadas con éxito.',
    'Algunas pruebas E2E han fallado. Revisa los errores para más detalles.'
  );
}

/**
 * Abre la interfaz gráfica de Cypress para pruebas E2E
 * @param {Array<string>} args - Argumentos adicionales
 */
function openE2ETests(args = []) {
  logger.title('Abriendo Interfaz de Cypress');
  logger.task('Iniciando interfaz gráfica de Cypress...');
  logger.info('Nota: Asegúrate de que el servidor de desarrollo esté en ejecución.');
  
  // Construir comando con argumentos adicionales
  const testCommand = args.length > 0 
    ? `${config.commands.testE2EOpen} ${args.join(' ')}`
    : config.commands.testE2EOpen;
  
  execute(
    testCommand,
    { stdio: 'inherit' },
    null, // No mostrar mensaje de éxito ya que la interfaz se abre
    'Error al abrir la interfaz de Cypress.'
  );
}

/**
 * Ejecuta todas las pruebas (unitarias y E2E)
 * @param {Array<string>} args - Argumentos adicionales
 */
function runAllTests(args = []) {
  logger.title('Ejecutando Todas las Pruebas');
  
  // Ejecutar pruebas unitarias
  logger.task('1/2 Ejecutando pruebas unitarias...');
  const unitTestsSuccess = execute(
    config.commands.test,
    { stdio: 'inherit' },
    'Pruebas unitarias completadas con éxito.',
    'Algunas pruebas unitarias han fallado.',
    false // No salir en caso de error
  );
  
  // Ejecutar pruebas E2E
  logger.task('2/2 Ejecutando pruebas E2E...');
  const e2eTestsSuccess = execute(
    config.commands.testE2E,
    { stdio: 'inherit' },
    'Pruebas E2E completadas con éxito.',
    'Algunas pruebas E2E han fallado.',
    false // No salir en caso de error
  );
  
  // Verificar si todas las pruebas fueron exitosas
  if (unitTestsSuccess && e2eTestsSuccess) {
    logger.complete('✅ Todas las pruebas completadas con éxito.');
  } else {
    logger.error('❌ Algunas pruebas han fallado. Revisa los errores anteriores.');
    process.exit(1);
  }
}

module.exports = {
  runTests,
  runTestsWatch,
  runTestCoverage,
  runE2ETests,
  openE2ETests,
  runAllTests
};
