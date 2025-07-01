/**
 * @file security.cjs
 * @description Comandos de seguridad para AI-Doc-Editor
 * Implementa funcionalidades de auditoría y escaneo de seguridad, incluyendo
 * integraciones con herramientas como Semgrep
 * @version 1.2.1
 * @lastUpdated 2025-06-30
 */

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger.cjs');
const { execute, executeAsync } = require('../utils/executor.cjs');
const config = require('../utils/config.cjs');
const { execSyncSafe } = require('../utils/command-validator.cjs');
const { safePathJoin } = require('../utils/path-sanitizer.cjs');

/**
 * Ejecuta una auditoría de seguridad con yarn audit
 * @param {Array<string>} args - Argumentos adicionales
 */
function runAudit(args = []) {
  logger.title('Auditoría de Seguridad');
  logger.task('Verificando vulnerabilidades en dependencias...');
  
  execute(
    config.commands.audit,
    { stdio: 'inherit' },
    'Auditoría de seguridad completada.',
    'La auditoría encontró vulnerabilidades. Revisa el informe para más detalles.',
    false // No salir en caso de error
  );
  
  logger.info('Nota: Para corregir vulnerabilidades automáticamente, ejecuta "yarn run cmd audit-fix"');
}

/**
 * Intenta corregir vulnerabilidades de seguridad
 * @param {Array<string>} args - Argumentos adicionales
 */
function runAuditFix(args = []) {
  logger.title('Corrección de Vulnerabilidades');
  logger.task('Intentando corregir vulnerabilidades en dependencias...');
  
  execute(
    config.commands.auditFix,
    { stdio: 'inherit' },
    'Corrección de vulnerabilidades completada.',
    'No se pudieron corregir todas las vulnerabilidades automáticamente.',
    false // No salir en caso de error
  );
  
  logger.info('Nota: Algunas vulnerabilidades pueden requerir actualización manual de dependencias.');
  logger.info('Ejecuta "yarn run cmd audit" para ver las vulnerabilidades restantes.');
}

/**
 * Ejecuta el escaneo completo de seguridad (T-43)
 * @param {Array<string>} args - Argumentos adicionales
 * @options
 *   --semgrep - Ejecuta solo Semgrep
 *   --sonar - Ejecuta solo SonarQube
 *   --vuln - Escanea solo vulnerabilidades
 *   --report=<path> - Ruta donde guardar el informe
 */
function runSecurityScan(args = []) {
  logger.title('Escaneo de Seguridad T-43');
  
  const options = parseOptions(args);
  const reportPath = options.report || './.taskmaster/reports/security';
  
  // Crear directorio si no existe
  const safeReportPath = safePathJoin(process.cwd(), reportPath);
  if (safeReportPath && !fs.existsSync(safeReportPath)) {
    fs.mkdirSync(safeReportPath, { recursive: true });
  }
  
  // Si no hay flags específicos, ejecutar todo
  if (!options.semgrep && !options.vuln) {
    logger.info('Ejecutando escaneo completo de seguridad...');
  }
  
  // Usar el script security-scan.cjs para vulnerabilidades
  if (!options.semgrep) {
    execute(
      'node scripts/security-scan.cjs',
      {},
      '🎉 Escaneo de seguridad completado con éxito.',
      'El escaneo de seguridad encontró problemas. Por favor, revisa los errores.'
    );
  }
  
  // Ejecutar Semgrep si se especifica o si es un escaneo completo
  if (options.semgrep || !options.vuln) {
    logger.task('🔍 Ejecutando análisis de Semgrep...');
    try {
      const semgrepConfig = ['--config', 'p/javascript', '--config', 'p/typescript', '--config', 'p/react', 
                              '--config', 'p/security-audit', '--config', 'p/owasp-top-ten'];
      
      const semgrepOutputFile = safePathJoin(safeReportPath, 'semgrep-results.json');
      if (semgrepOutputFile) {
        const semgrepCmd = `npx semgrep ${semgrepConfig.join(' ')} --json --output ${semgrepOutputFile} .`;
        
        // Ejecutar Semgrep de manera segura
        execSyncSafe(semgrepCmd, { stdio: 'pipe', encoding: 'utf8' });
        
        logger.success('Análisis de Semgrep completado. Resultados guardados en:', semgrepOutputFile);
        
        // Generar informe SARIF para SonarQube
        const sarifOutputFile = safePathJoin(safeReportPath, 'semgrep-results.sarif');
        if (sarifOutputFile) {
          const sarifCmd = `npx semgrep ${semgrepConfig.join(' ')} --sarif --output ${sarifOutputFile} .`;
          execSyncSafe(sarifCmd, { stdio: 'pipe', encoding: 'utf8' });
          logger.info('Informe SARIF generado en:', sarifOutputFile);
        }
      }
    } catch (error) {
      logger.error('Error durante el análisis de Semgrep:', error.message);
    }
  }
}

/**
 * Analiza los argumentos de la línea de comandos y extrae las opciones
 * @param {Array<string>} args - Argumentos de la línea de comandos
 * @returns {Object} - Objeto con las opciones parseadas
 */
function parseOptions(args) {
  const options = {};
  
  // Procesar cada argumento
  args.forEach(arg => {
    // Detectar argumentos con valor (--option=value)
    if (arg.includes('=')) {
      const [key, value] = arg.split('=');
      const cleanKey = key.replace(/^--/, '');
      
      // Sanitizar valor para prevenir inyecciones
      const safeValue = value.replace(/[;&|`$\"']/g, '');
      options[cleanKey] = safeValue;
    } 
    // Detectar flags (--option)
    else if (arg.startsWith('--')) {
      const cleanKey = arg.replace(/^--/, '');
      options[cleanKey] = true;
    }
  });
  
  return options;
}

/**
 * Genera informes de seguridad y licencias
 * @param {Array<string>} args - Argumentos adicionales
 */
function generateSecurityReports(args = []) {
  logger.title('Generación de Informes de Seguridad');
  logger.task('Generando informe de licencias...');
  
  // Generar informe de licencias
  execute(
    'yarn list --depth=0 --json > yarn-licenses.json',
    {},
    'Informe de licencias generado: yarn-licenses.json',
    'Error al generar informe de licencias',
    false // No salir en caso de error
  );
  
  // Verificar si pip está disponible para generar informe de dependencias Python
  logger.task('Verificando disponibilidad de pip para dependencias Python...');
  try {
    execute(
      'pip --version',
      { stdio: 'pipe' },
      'pip está disponible, generando informe de auditoría Python...',
      null,
      false
    );
    
    // Instalar pip-audit si pip está disponible
    execute(
      'pip install pip-audit > nul 2>&1',
      { stdio: 'pipe' },
      null,
      null,
      false
    );
    
    // Generar informe de auditoría Python
    execute(
      'pip-audit --format=json --output=pip-audit-report.json',
      {},
      'Informe de auditoría Python generado: pip-audit-report.json',
      'Error al generar informe de auditoría Python',
      false
    );
  } catch (error) {
    logger.info('pip no está disponible - omitiendo escaneo de dependencias Python');
  }
  
  logger.complete('Informes de seguridad generados correctamente');
logger.info('Ubicación de informes:');
execute('dir *-report.json *-licenses.json', { stdio: 'inherit' }, null, null, false);
}

/**
 * Ejecuta un análisis de código específico con Semgrep
 * @param {Array<string>} args - Argumentos adicionales
 * @options
 *   --ci - Ejecuta en modo CI (bloquea en hallazgos críticos)
 *   --report=<path> - Ruta donde guardar el informe
 */
function runSemgrepScan(args = []) {
  logger.title('🔍 Análisis de Seguridad con Semgrep');
  
  const options = parseOptions(args);
  const reportPath = options.report || './.taskmaster/reports/security';
  
  // Crear directorio si no existe
  const safeReportPath = safePathJoin(process.cwd(), reportPath);
  if (safeReportPath && !fs.existsSync(safeReportPath)) {
    fs.mkdirSync(safeReportPath, { recursive: true });
  }
  
  // Configurar Semgrep
  const semgrepConfig = ['--config', 'p/javascript', '--config', 'p/typescript',
                        '--config', 'p/react', '--config', 'p/security-audit',
                        '--config', 'p/owasp-top-ten'];
  
  // Añadir opciones de CI si es necesario
  if (options.ci) {
    semgrepConfig.push('--error', 'r/javascript.lang.security.audit.*');
    semgrepConfig.push('--error', 'r/typescript.react.security.audit.*');
    semgrepConfig.push('--error', 'r/typescript.express.security.audit.*');
    logger.info('Ejecutando en modo CI - bloqueando en hallazgos críticos');
  }
  
  try {
    // Preparar archivos de salida
    const semgrepOutputFile = safePathJoin(safeReportPath, 'semgrep-results.json');
    const sarifOutputFile = safePathJoin(safeReportPath, 'semgrep-results.sarif');
    
    if (semgrepOutputFile && sarifOutputFile) {
      // Ejecutar Semgrep con JSON output
      logger.task('Ejecutando análisis...');
      const semgrepJsonCmd = `npx semgrep ${semgrepConfig.join(' ')} --json --output ${semgrepOutputFile} .`;
      execSyncSafe(semgrepJsonCmd, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
      
      // Generar SARIF para integración con otros sistemas
      logger.task('Generando informe SARIF para integración con SonarQube...');
      const semgrepSarifCmd = `npx semgrep ${semgrepConfig.join(' ')} --sarif --output ${sarifOutputFile} .`;
      execSyncSafe(semgrepSarifCmd, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
      
      logger.success('Análisis completado con éxito');
      logger.info(`Resultados JSON: ${semgrepOutputFile}`);
      logger.info(`Resultados SARIF: ${sarifOutputFile}`);
    }
  } catch (error) {
    logger.error('Error durante el análisis de Semgrep:', error.message);
    if (options.ci) {
      process.exit(1); // Fallo en modo CI
    }
  }
}



module.exports = {
  runAudit,
  runAuditFix,
  runSecurityScan,
  generateSecurityReports,
  runSemgrepScan
};
