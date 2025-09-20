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
    console.log("\n    -> Running security audit...");
    let output = "";
    try {
        output = execSync('yarn npm audit --all --recursive --json', { encoding: 'utf8', stdio: ['inherit', 'pipe', 'pipe'] });
    } catch (error) {
        if (error.stdout) {
            output = error.stdout.toString();
        } else {
            throw error;
        }
    }

    const advisories = [];
    output.split(/\r?\n/).forEach(line => {
        if (!line.trim()) {
            return;
        }
        try {
            advisories.push(JSON.parse(line));
        } catch (parseError) {
            console.warn('    -> Unable to parse npm audit line:', line);
        }
    });

    const blocking = [];
    const deprecations = [];
    for (const advisory of advisories) {
        const issue = advisory?.children?.Issue || '';
        if (/deprecation/i.test(issue)) {
            deprecations.push(advisory);
        } else {
            blocking.push(advisory);
        }
    }

    if (deprecations.length > 0) {
        console.log('\n    -> Ignoring npm audit deprecation notices (not security vulnerabilities):');
        for (const { value, children } of deprecations) {
            console.log(`      - ${value}: ${children?.Issue || 'see npm audit output'}`);
        }
    }

    if (blocking.length > 0) {
        console.error('\n    -> Blocking vulnerabilities detected by npm audit:');
        for (const { value, children } of blocking) {
            const severity = children?.Severity ? ` [${children.Severity}]` : '';
            console.error(`      - ${value}${severity}: ${children?.Issue || 'see npm audit output'}`);
        }
        throw new Error('Security audit failed');
    }

    console.log('    -> npm audit passed (no blocking vulnerabilities found).');
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
    // Ejecutamos license-checker-rseidelsohn, redirigiendo su salida (que es un JSON enorme) al archivo.
    // Usamos stdio: 'ignore' para no ensuciar la consola, ya que solo nos interesa el archivo de salida.
    execSync('npx license-checker-rseidelsohn --production --json > yarn-licenses.json', { stdio: 'ignore' });
    console.log('    -> ✅ License report generated successfully: yarn-licenses.json');
} catch (error) {
    console.error('\n    -> ❌ Failed to generate license report.');
    console.error(error);
    process.exit(1);
}
