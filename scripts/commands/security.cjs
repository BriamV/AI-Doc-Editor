/**
 * Comandos de seguridad para AI-Doc-Editor
 * Implementa funcionalidades de auditoría y escaneo de seguridad
 */

const logger = require('../utils/logger.cjs');
const { execute } = require('../utils/executor.cjs');
const config = require('../utils/config.cjs');

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
 */
function runSecurityScan(args = []) {
  logger.title('Escaneo de Seguridad T-43');
  logger.info('Ejecutando escaneo completo de seguridad...');
  
  // Usar el script security-scan.cjs que ya está implementado
  execute(
    'node scripts/security-scan.cjs',
    {},
    '🎉 Escaneo de seguridad completado con éxito.',
    'El escaneo de seguridad encontró problemas. Por favor, revisa los errores.'
  );
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

module.exports = {
  runAudit,
  runAuditFix,
  runSecurityScan,
  generateSecurityReports
};
