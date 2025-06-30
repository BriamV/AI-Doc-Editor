/**
 * Comandos de gobernanza para AI-Doc-Editor
 * Implementa funcionalidades de validación de API y generación de trazabilidad
 */

const logger = require('../utils/logger.cjs');
const { execute } = require('../utils/executor.cjs');
const config = require('../utils/config.cjs');

/**
 * Valida la especificación OpenAPI
 * @param {Array<string>} args - Argumentos adicionales
 */
function validateApiSpec(args = []) {
  logger.title('Validación de Especificación OpenAPI');
  logger.task('Verificando conformidad con OpenAPI 3.1...');
  
  execute(
    config.commands.apiSpec,
    { stdio: 'inherit' },
    'Especificación OpenAPI validada correctamente.',
    'La especificación OpenAPI contiene errores. Por favor, corrígelos antes de continuar.'
  );
}

/**
 * Genera la matriz de trazabilidad en formatos útiles para desarrollo
 * @param {Array<string>} args - Argumentos adicionales
 *   - --format=<xlsx|json|md|all> - Formato de salida (por defecto: all)
 *   - --output=<ruta> - Directorio de salida (por defecto: docs/)
 */
function generateTraceability(args = []) {
  logger.title('Generación de Matriz de Trazabilidad');
  
  // Analizar argumentos
  const format = args.find(arg => arg.startsWith('--format='))?.split('=')[1] || 'all';
  const outputArg = args.find(arg => arg.startsWith('--output='))?.split('=')[1];
  const outputDir = outputArg || 'docs';
  
  // Construir el comando con los argumentos correspondientes
  let command = '';
  
  // Seleccionar el comando adecuado según el formato solicitado
  switch (format) {
    case 'xlsx':
      command = config.commands.traceabilityXlsx;
      break;
    case 'json':
      command = config.commands.traceabilityJson;
      break;
    case 'md':
      command = config.commands.traceabilityMd;
      break;
    case 'all':
    default:
      command = config.commands.traceability;
      break;
  }
  
  // Añadir el parámetro de directorio de salida si se especificó
  if (outputArg) {
    command += ` --output=${outputDir}`;
  }
  
  // Ejecutar el comando para generar la matriz de trazabilidad
  logger.task(`Generando matriz de trazabilidad en formato${format === 'all' ? 's' : ' ' + format.toUpperCase()}...`);
  
  execute(
    command,
    { stdio: 'inherit' },
    `Matriz de trazabilidad ${format === 'all' ? 'en múltiples formatos' : format.toUpperCase()} generada correctamente.`,
    `Error al generar la matriz de trazabilidad ${format === 'all' ? 'en múltiples formatos' : format.toUpperCase()}.`
  );
  
  // Mensaje informativo sobre los formatos generados
  if (format === 'all') {
    logger.info('Se han generado los siguientes formatos:');
    logger.info('- XLSX: Formato Excel para reportes y presentaciones');
    logger.info('- JSON: Formato para integración con herramientas y scripts');
    logger.info('- Markdown: Formato para visualización en IDEs y documentación');
  }
  
  logger.info('La matriz de trazabilidad ayuda a verificar que todos los requisitos están implementados y probados.');
}

/**
 * Ejecuta todas las verificaciones de gobernanza (T-17)
 * @param {Array<string>} args - Argumentos adicionales
 */
function runGovernance(args = []) {
  logger.title('Verificaciones de Gobernanza T-17');
  logger.info('Ejecutando todas las verificaciones de gobernanza...');
  
  // Extraer el formato solicitado para la matriz de trazabilidad
  const format = args.find(arg => arg.startsWith('--format='))?.split('=')[1] || 'all';
  
  // Ejecutar validación de API
  logger.task('1/2 Validando especificación OpenAPI...');
  const apiSpecSuccess = execute(
    config.commands.apiSpec,
    { stdio: 'inherit' },
    'Especificación OpenAPI validada correctamente.',
    'La especificación OpenAPI contiene errores.',
    false // No salir en caso de error
  );
  
  // Ejecutar generación de trazabilidad
  logger.task('2/2 Generando matriz de trazabilidad...');
  
  // Seleccionar el comando adecuado según el formato
  let traceabilityCommand;
  switch (format) {
    case 'xlsx':
      traceabilityCommand = config.commands.traceabilityXlsx;
      break;
    case 'json':
      traceabilityCommand = config.commands.traceabilityJson;
      break;
    case 'md':
      traceabilityCommand = config.commands.traceabilityMd;
      break;
    case 'all':
    default:
      traceabilityCommand = config.commands.traceability;
      break;
  }
  
  const traceabilitySuccess = execute(
    traceabilityCommand,
    { stdio: 'inherit' },
    `Matriz de trazabilidad ${format === 'all' ? 'en múltiples formatos' : format.toUpperCase()} generada correctamente.`,
    `Error al generar la matriz de trazabilidad ${format === 'all' ? 'en múltiples formatos' : format.toUpperCase()}.`,
    false // No salir en caso de error
  );
  
  // Verificar si todas las comprobaciones fueron exitosas
  if (apiSpecSuccess && traceabilitySuccess) {
    logger.complete('Todas las verificaciones de gobernanza completadas con éxito.');
  } else {
    logger.error('Algunas verificaciones de gobernanza fallaron. Revisa los errores anteriores.');
    process.exit(1);
  }
}

/**
 * Muestra el estado de las tareas (T-01, R0.WP1)
 * @param {Array<string>} args - Argumentos adicionales
 */
function showTaskStatus(args = []) {
  const taskId = args[0] || 't01';
  
  if (taskId.toLowerCase() === 't01') {
    logger.title('T-01: Baseline & CI/CD Status');
    logger.info('================================');
    logger.success('T-01.1: GitHub Actions CI/CD pipeline');
    logger.success('T-01.2: ADR template structure + CODEOWNERS');
    logger.success('T-01.3: Quality gates (ESLint, Prettier, TypeScript)');
    logger.success('T-01.4: Makefile for development commands');
    logger.success('T-01.5: Docker-compose setup (Docker files ready)');
    logger.warn('T-01.6: Pydantic v2 migration (DEFERRED - backend phase)');
    logger.info('');
    logger.info('📊 Overall Progress: 5/6 components completed (83%)');
    logger.info('🐳 Docker Status: ✅ FULLY FUNCTIONAL (use \'sg docker -c\' prefix)');
  } else if (taskId.toLowerCase() === 'r0wp1') {
    logger.title('R0.WP1: Core Backend & Security Foundation Status');
    logger.info('==================================================');
    logger.success('T-01: Baseline & CI/CD (83% - T-01.6 deferred)');
    logger.success('T-17: API-SPEC & ADR Governance');
    logger.success('T-23: Health-check API (/healthz endpoint)');
    logger.success('T-43: Implementar Escaneo de Dependencias');
    logger.info('');
    logger.info('📊 R0.WP1 Progress: 4/4 tasks completed (100%)');
    logger.info('🎯 Ready to proceed to R0.WP2 (T-02, T-41, T-44)');
  } else {
    logger.error(`Estado de tarea desconocido: ${taskId}`);
    logger.info('Opciones disponibles: t01, r0wp1');
  }
}

module.exports = {
  validateApiSpec,
  generateTraceability,
  runGovernance,
  showTaskStatus
};
