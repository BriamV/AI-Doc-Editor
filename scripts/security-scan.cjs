const { execSync } = require('child_process');
const config = require('./utils/config.cjs');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger.cjs');
// Importamos utilidades de seguridad
const { execSyncSafe } = require('./utils/command-validator.cjs');
const { safePathJoin } = require('./utils/path-sanitizer.cjs');

// Detectar si estamos en un entorno CI
const isCI = process.env.CI === 'true';

/**
 * Ejecuta el audit de seguridad con manejo adecuado de niveles de severidad
 * basado en la configuración centralizada
 */
function runSecurityAudit() {
    // Obtenemos el nivel de audit configurado (por defecto 'critical' si no está configurado)
    const auditLevel = config.securityConfig?.auditLevel || 'critical';
    console.log(`    -> Running yarn audit (blocking level: ${auditLevel})...`);

    try {
        // Configurar opciones adecuadas para CI o entorno local
        const auditOptions = isCI ? '--json --registry=https://registry.npmjs.org' : '--json';
        console.log(`    -> Using audit options: ${auditOptions}${isCI ? ' (CI environment detected)' : ''}`);        
        
        // Ejecutamos yarn audit de forma segura y capturamos la salida
        // Nota: yarn audit siempre devuelve código 1 si encuentra cualquier vulnerabilidad
        // Validación: auditOptions está limitado a valores seguros específicos
        const validOptions = ['--json', '--json --registry=https://registry.npmjs.org'];
        if (!validOptions.includes(auditOptions)) {
            throw new Error(`Opciones de audit no válidas: ${auditOptions}`);
        }
        
        // Uso de la versión segura de execSync
        const output = execSyncSafe(`yarn audit ${auditOptions}`, { stdio: 'pipe', encoding: 'utf8' });
        
        // Analizamos el resultado para verificar solo las vulnerabilidades del nivel configurado
        const auditResults = parseAuditOutput(output);
        const { critical, high, moderate, low } = auditResults;
        
        // Generamos un informe para futuras referencias
        generateAuditReport(auditResults);
        
        // Verificamos si hay vulnerabilidades del nivel configurado o superior
        let hasBlockingVulnerabilities = false;
        
        switch(auditLevel) {
            case 'critical':
                hasBlockingVulnerabilities = critical > 0;
                break;
            case 'high':
                hasBlockingVulnerabilities = critical > 0 || high > 0;
                break;
            case 'moderate':
                hasBlockingVulnerabilities = critical > 0 || high > 0 || moderate > 0;
                break;
            case 'low':
                hasBlockingVulnerabilities = critical > 0 || high > 0 || moderate > 0 || low > 0;
                break;
            default:
                hasBlockingVulnerabilities = critical > 0;
        }
        
        // Mostrar resumen de vulnerabilidades
        console.log('    -> Vulnerability summary:')
        console.log(`       Critical: ${critical}, High: ${high}, Moderate: ${moderate}, Low: ${low}`);
        
        // Si hay vulnerabilidades bloqueantes según el nivel configurado, fallamos
        if (hasBlockingVulnerabilities) {
            console.error(`\n    -> ❌ Found ${auditLevel} level vulnerabilities. See report at reports/security-audit.json`);
            console.error('       Run "yarn run cmd audit-fix" to attempt automatic fixes or update dependencies manually.');
            process.exit(1);
        } else {
            // Si hay vulnerabilidades pero no son del nivel configurado, mostramos advertencia
            if (critical > 0 || high > 0 || moderate > 0 || low > 0) {
                console.log(`\n    -> ⚠️ Found vulnerabilities below ${auditLevel} level. See report at reports/security-audit.json`);
            } else {
                console.log('    -> ✅ No vulnerabilities found.');
            }
        }
    } catch (error) {
        // Manejar el resultado de yarn audit, que puede fallar con código 1
        // Si llegamos aquí es porque hubo un error al ejecutar el comando, no por vulnerabilidades
        console.error('\n    -> ❌ Error running yarn audit:');
        console.error(error.message || error);
        process.exit(1);
    }
}

/**
 * Parsea la salida JSON de yarn audit para obtener el conteo de vulnerabilidades por nivel
 * @param {string} output - Salida JSON de yarn audit
 * @returns {Object} - Objeto con conteo de vulnerabilidades por nivel
 */
function parseAuditOutput(output) {
    const result = { critical: 0, high: 0, moderate: 0, low: 0, info: 0 };
    
    try {
        // Yarn audit --json produce líneas múltiples de JSON, necesitamos procesarlas
        const lines = output.split('\n').filter(line => line.trim().length > 0);
        
        for (const line of lines) {
            try {
                const data = JSON.parse(line);
                
                // Buscar vulnerabilidades en los diferentes tipos de datos
                if (data.type === 'auditAdvisory') {
                    const severity = data.data.advisory.severity;
                    if (severity in result) {
                        result[severity]++;
                    }
                } else if (data.type === 'auditSummary') {
                    // También podemos usar el resumen si está disponible
                    if (data.data && data.data.vulnerabilities) {
                        const vulns = data.data.vulnerabilities;
                        result.critical = vulns.critical || 0;
                        result.high = vulns.high || 0;
                        result.moderate = vulns.moderate || 0;
                        result.low = vulns.low || 0;
                        result.info = vulns.info || 0;
                    }
                }
            } catch (e) {
                // Si hay errores al parsear una línea individual, continuamos
                continue;
            }
        }
    } catch (e) {
        console.error('Error parsing yarn audit output:', e);
    }
    
    return result;
}

/**
 * Genera un informe de auditoría para referencia futura
 * @param {Object} results - Resultados del análisis de vulnerabilidades
 */
function generateAuditReport(results) {
    // Crear directorio de informes si no existe - usando rutas seguras
    const reportsDir = safePathJoin(__dirname, '..', 'reports');
    
    if (!reportsDir) {
        logger.error('🛑 Error al generar ruta segura para el directorio de informes');
        return;
    }
    
    try {
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
    } catch (error) {
        logger.error(`❌ Error al crear directorio de informes: ${error.message}`);
        return;
    }
    
    // Guardar informe en formato JSON - usando rutas seguras
    const reportPath = safePathJoin(reportsDir, 'security-audit.json');
    
    if (!reportPath) {
        logger.error('🛑 Error al generar ruta segura para el informe');
        return;
    }
    const reportData = {
        timestamp: new Date().toISOString(),
        vulnerabilities: results,
        summary: `Total vulnerabilities: ${results.critical + results.high + results.moderate + results.low + results.info}`,
        recommendations: [
            'Run "yarn audit fix" to attempt automatic fixes',
            'Review and update dependencies manually if automatic fixes fail',
            'Consider adding exceptions for false positives in package.json'
        ]
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
}

// Ejecutar la auditoría de seguridad
runSecurityAudit();

console.log('\n    -> Generating license report (this may take a minute)...');
try {
    // Ejecutamos license-checker, redirigiendo su salida (que es un JSON enorme) al archivo.
    // Usamos stdio: 'ignore' para no ensuciar la consola, ya que solo nos interesa el archivo de salida.
    execSync('npx license-checker --production --json > yarn-licenses.json', { stdio: 'ignore' });
    console.log('    -> ✅ License report generated successfully: yarn-licenses.json');
} catch (error) {
    console.error('\n    -> ❌ Failed to generate license report.');
    console.error(error);
    process.exit(1);
}