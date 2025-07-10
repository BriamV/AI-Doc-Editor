#!/usr/bin/env node
/**
 * CLI principal para AI-Doc-Editor
 * Reemplaza completamente al Makefile con una interfaz moderna y multiplataforma
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const logger = require('./utils/logger.cjs');
const config = require('./utils/config.cjs');
const { validateScriptPath, safePathJoin } = require('./utils/path-sanitizer.cjs');
const { execSyncSafe } = require('./utils/command-validator.cjs');

// Versión del CLI
const CLI_VERSION = '1.0.0';

// Obtener los argumentos de la línea de comandos
const args = process.argv.slice(2);
const command = args[0] || 'help';

/**
 * Muestra la ayuda general del CLI
 */
function showHelp() {
  // Leer la versión del proyecto desde package.json en lugar de usar config.getVersion()
  let version = '0.0.0';
  try {
    const packageJson = require(path.join(__dirname, '../package.json'));
    version = packageJson.version || '0.0.0';
  } catch (error) {
    logger.warn('No se pudo leer la versión del proyecto desde package.json');
  }
  
  logger.title(`AI-Doc-Editor CLI v${CLI_VERSION} (Project v${version})`);
  logger.info('Uso: yarn run cmd <comando> [opciones]');
  logger.info('');
  logger.info('Comandos disponibles:');
  
  // Categorías de comandos
  const categories = {
    'Desarrollo': ['dev', 'build', 'build-analyze', 'build-dev', 'build-docs', 'build-env', 'preview'],
    'Pruebas': ['test', 'test-watch', 'test-coverage', 'test-e2e', 'test-e2e-open', 'test-all'],
    'Calidad': ['qa', 'lint', 'lint-fix', 'format', 'format-check', 'tsc-check', 'qa-gate', 'validate-design-guidelines'],
    'Validación Modular': ['validate-file', 'validate-dir', 'validate-frontend', 'validate-backend', 'validate-store', 'validate-types', 'validate-modified', 'validate-all'],
    'Validación Rápida': ['validate-frontend-fast', 'validate-backend-fast', 'validate-all-fast'],
    'Validación Completa': ['validate-frontend-full', 'validate-backend-full', 'validate-all-full'],
    'Contexto de Flujo': ['validate-task', 'validate-workpackage', 'validate-release', 'validate-staged', 'validate-diff', 'workflow-context'],
    'Seguridad': ['security-scan', 'audit', 'audit-fix'],
    'Gobernanza': ['api-spec', 'traceability', 'governance', 'task-status'],
    'Electron': ['electron', 'electron-pack', 'electron-dist', 'electron-build'],
    'Docker': ['docker-dev', 'docker-prod', 'docker-backend', 'docker-stop', 'docker-logs'],
    'Mantenimiento': ['clean', 'clean-modules', 'update-deps', 'health-check', 'optimize', 'help']
  };
  
  // Mostrar comandos por categoría
  Object.entries(categories).forEach(([category, cmds]) => {
    logger.info(`\n${category}:`);
    cmds.forEach(cmd => {
      const description = getCommandDescription(cmd);
      console.log(`  ${cmd.padEnd(15)} ${description}`);
    });
  });
  
  logger.info('\nEjemplos:');
  logger.info('  yarn run cmd dev         # Inicia el servidor de desarrollo');
  logger.info('  yarn run cmd qa-gate     # Ejecuta todas las verificaciones de calidad');
  logger.info('  yarn run cmd help test   # Muestra ayuda específica para el comando test');
}

/**
 * Obtiene la descripción de un comando
 * @param {string} cmd - El comando
 * @returns {string} - La descripción del comando
 */
function getCommandDescription(cmd) {
  const descriptions = {
    // Desarrollo
    'dev': 'Inicia el servidor de desarrollo',
    'build': 'Construye la aplicación para producción',
    'build-analyze': 'Construye la aplicación con análisis de bundle',
    'build-dev': 'Construye la aplicación para desarrollo',
    'build-docs': 'Construye la documentación del proyecto',
    'build-env': 'Construye la aplicación para un entorno específico',
    'preview': 'Previsualiza la construcción de producción',
    
    // Pruebas
    'test': 'Ejecuta pruebas unitarias',
    'test-watch': 'Ejecuta pruebas en modo observador',
    'test-coverage': 'Ejecuta pruebas con cobertura',
    'test-e2e': 'Ejecuta pruebas end-to-end',
    'test-e2e-open': 'Abre la interfaz de Cypress',
    'test-all': 'Ejecuta todas las pruebas (unitarias y E2E)',
    
    // Calidad
    'qa': 'QA Híbrido - Auto-detección de contexto + validación inteligente',
    'lint': 'Ejecuta ESLint',
    'lint-fix': 'Ejecuta ESLint con auto-corrección',
    'format': 'Formatea el código con Prettier',
    'format-check': 'Verifica el formato del código',
    'tsc-check': 'Verifica la compilación de TypeScript',
    'qa-gate': 'Ejecuta todas las verificaciones de calidad',
    'validate-design-guidelines': 'Valida métricas de DESIGN_GUIDELINES.md',
    
    // Validación Modular (Fase 1)
    'validate-file': 'Valida un archivo específico [--file=ruta] [--tools=format,lint]',
    'validate-dir': 'Valida un directorio específico [--dir=ruta] [--tools=format,lint]',
    'validate-frontend': 'Valida archivos frontend (React/TypeScript)',
    'validate-backend': 'Valida archivos backend (Python/FastAPI)',
    'validate-store': 'Valida state management (Zustand/TypeScript)',
    'validate-types': 'Valida archivos de tipos y constantes',
    'validate-modified': 'Valida solo archivos modificados (git)',
    'validate-all': 'Valida todo el proyecto (multi-tecnología)',
    
    // Contexto de Flujo de Trabajo
    'validate-task': 'Valida según tarea actual detectada o --task=T-XX específica',
    'validate-workpackage': 'Valida según work package actual (WP)',
    'validate-release': 'Valida según release actual (R#)',
    'validate-staged': 'Valida solo archivos staged (pre-commit)',
    'validate-diff': 'Valida diferencias vs branch base [--base=main]',
    'workflow-context': 'Muestra contexto actual del flujo de trabajo',
    
    // Validación Rápida (Desarrollo Iterativo)
    'validate-frontend-fast': 'Validación ultra-rápida frontend (solo formato + sintaxis)',
    'validate-backend-fast': 'Validación ultra-rápida backend (solo formato + sintaxis)', 
    'validate-all-fast': 'Validación ultra-rápida todo el proyecto (solo formato)',
    
    // Validación Completa (Design Guidelines)
    'validate-frontend-full': 'Validación completa frontend (format + lint + types + loc)',
    'validate-backend-full': 'Validación completa backend (format + lint + types + loc)', 
    'validate-all-full': 'Validación completa proyecto (format + lint + types + loc)',
    
    // Seguridad
    'security-scan': 'Ejecuta escaneo de dependencias (T-43)',
    'audit': 'Verifica vulnerabilidades de seguridad',
    'audit-fix': 'Corrige vulnerabilidades de seguridad',
    
    // Gobernanza
    'api-spec': 'Valida la especificación OpenAPI',
    'traceability': 'Genera matriz de trazabilidad',
    'governance': 'Ejecuta todas las verificaciones de gobernanza',
    'task-status': 'Muestra el estado de las tareas del proyecto',
    
    // Electron
    'electron': 'Ejecuta como aplicación de escritorio',
    'electron-pack': 'Empaqueta la aplicación Electron',
    'electron-dist': 'Construye y empaqueta para distribución',
    'electron-build': 'Construye y empaqueta la aplicación Electron',
    
    // Docker
    'docker-dev': 'Inicia entorno de desarrollo con Docker',
    'docker-prod': 'Inicia entorno de producción con Docker',
    'docker-backend': 'Inicia stack completo con backend',
    'docker-stop': 'Detiene todos los servicios Docker',
    'docker-logs': 'Muestra logs de Docker',
    
    // Mantenimiento
    'clean': 'Limpia artefactos de construcción y caché',
    'clean-modules': 'Limpia node_modules y reinstala dependencias',
    'update-deps': 'Actualiza las dependencias a sus últimas versiones',
    'health-check': 'Verifica la salud del proyecto',
    'optimize': 'Optimiza el proyecto para producción',
    'help': 'Muestra esta ayuda'
  };
  
  return descriptions[cmd] || 'Sin descripción disponible';
}

/**
 * Maneja comandos de validación modular
 * @param {Object} script - El script importado
 * @param {string} fn - Nombre de la función
 * @param {string} command - Comando ejecutado
 * @param {Array<string>} args - Argumentos del usuario
 * @param {Array<string>} predefinedArgs - Argumentos predefinidos
 */
async function _handleModularValidation(script, fn, command, args, predefinedArgs) {
  // Parser simple de argumentos --key=value
  const parseArgs = (args) => {
    const parsed = {};
    args.forEach(arg => {
      if (arg.startsWith('--')) {
        const [key, value] = arg.substring(2).split('=');
        if (value) {
          parsed[key] = value.includes(',') ? value.split(',') : [value];
        } else {
          parsed[key] = true;
        }
      }
    });
    return parsed;
  };

  const parsedArgs = parseArgs(args);

  try {
    switch (command) {
      case 'validate-file':
        if (!parsedArgs.file) {
          logger.error('validate-file requiere --file=ruta');
          logger.info('Ejemplo: yarn run cmd validate-file --file=src/main.tsx --tools=format,lint');
          process.exit(1);
        }
        await script[fn](parsedArgs.file, parsedArgs.tools || ['format', 'lint']);
        break;

      case 'validate-dir':
        if (!parsedArgs.dir) {
          logger.error('validate-dir requiere --dir=ruta');
          logger.info('Ejemplo: yarn run cmd validate-dir --dir=src/components --tools=format,lint');
          process.exit(1);
        }
        await script[fn](parsedArgs.dir, parsedArgs.tools || ['format', 'lint']);
        break;

      case 'validate-frontend':
      case 'validate-backend':
      case 'validate-store':
      case 'validate-types':
        const scope = predefinedArgs[0];
        const options = {
          tools: parsedArgs.tools || ['format', 'lint'],
          context: parsedArgs.context || 'dev'
        };
        await script[fn](scope, options);
        break;

      case 'validate-frontend-fast':
      case 'validate-backend-fast':
      case 'validate-all-fast':
        const fastScope = predefinedArgs[0];
        const fastOptions = predefinedArgs[1] || { tools: ['format'], context: 'fast' };
        await script[fn](fastScope, fastOptions);
        break;

      case 'validate-frontend-full':
      case 'validate-backend-full':
      case 'validate-all-full':
        const fullScope = predefinedArgs[0];
        const fullOptions = predefinedArgs[1] || { tools: ['format', 'lint', 'types', 'loc'], context: 'pre-commit' };
        await script[fn](fullScope, fullOptions);
        break;

      case 'validate-modified':
        await script[fn](parsedArgs.tools || ['format', 'lint']);
        break;

      case 'validate-diff':
        if (!parsedArgs.base) {
          logger.error('validate-diff requiere --base=branch');
          logger.info('Ejemplo: yarn run cmd validate-diff --base=main --tools=format,lint');
          process.exit(1);
        }
        await script[fn](parsedArgs.base, parsedArgs.tools || ['format', 'lint']);
        break;

      case 'validate-task':
        const contextType = predefinedArgs[0];
        // Soportar --task=T-XX para forzar una tarea específica
        const taskOverride = parsedArgs.task ? parsedArgs.task[0] : null;
        await script[fn](contextType, parsedArgs.tools || ['format', 'lint'], { taskOverride });
        break;
        
      case 'validate-workpackage':
      case 'validate-release':
        const contextTypeOther = predefinedArgs[0];
        await script[fn](contextTypeOther, parsedArgs.tools || ['format', 'lint']);
        break;

      default:
        await script[fn](args);
    }
  } catch (error) {
    logger.error(`Error en ${command}: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Ejecuta un comando específico
 * @param {string} command - El comando a ejecutar
 * @param {Array<string>} args - Argumentos adicionales
 */
async function executeCommand(command, args) {
  try {
    // Si es ayuda específica para un comando
    if (command === 'help' && args.length > 0) {
      const specificCommand = args[0];
      logger.title(`Ayuda para el comando: ${specificCommand}`);
      logger.info(getCommandDescription(specificCommand));
      return;
    }
    
    // Verificar si existe un script específico para el comando
    const commandsDir = path.join(__dirname, 'commands');
    
    // Mapeo de comandos a archivos de script
    const commandMapping = {
      // Desarrollo
      'dev': { file: 'dev.cjs', fn: 'startDev' },
      'build': { file: 'build.cjs', fn: 'buildApp' },
      'build-analyze': { file: 'build.cjs', fn: 'buildWithAnalyze' },
      'build-dev': { file: 'build.cjs', fn: 'buildDev' },
      'build-docs': { file: 'build.cjs', fn: 'buildDocs' },
      'build-env': { file: 'build.cjs', fn: 'buildEnv' },
      'preview': { file: 'dev.cjs', fn: 'previewBuild' },
      
      // Pruebas
      'test': { file: 'test.cjs', fn: 'runTests' },
      'test-watch': { file: 'test.cjs', fn: 'runTestsWatch' },
      'test-coverage': { file: 'test.cjs', fn: 'runTestCoverage' },
      'test-e2e': { file: 'test.cjs', fn: 'runE2ETests' },
      'test-e2e-open': { file: 'test.cjs', fn: 'openE2ETests' },
      'test-all': { file: 'test.cjs', fn: 'runAllTests' },
      
      // Calidad
      'qa': { file: 'qa.cjs', fn: 'run' },

      // Validación Modular (Fase 1)  

      // Validación Rápida
      'validate-frontend-fast': { file: 'qa.cjs', fn: 'validateScope', args: ['frontend', { tools: ['format'], context: 'fast' }] },
      'validate-backend-fast': { file: 'qa.cjs', fn: 'validateScope', args: ['backend', { tools: ['format'], context: 'fast' }] },
      'validate-all-fast': { file: 'qa.cjs', fn: 'validateScope', args: ['all', { tools: ['format'], context: 'fast' }] },
      
      // Validación Completa (Design Guidelines)
      'validate-all': { file: 'qa.cjs', fn: 'validateScope', args: ['all'] },
      'validate-frontend-full': { file: 'qa.cjs', fn: 'validateScope', args: ['frontend', { tools: ['format', 'lint', 'types', 'loc'], context: 'pre-commit' }] },
      'validate-backend-full': { file: 'qa.cjs', fn: 'validateScope', args: ['backend', { tools: ['format', 'lint', 'types', 'loc'], context: 'pre-commit' }] },
      'validate-all-full': { file: 'qa.cjs', fn: 'validateScope', args: ['all', { tools: ['format', 'lint', 'types', 'loc'], context: 'pre-commit' }] },
      
      // Contexto de Flujo de Trabajo

      // Seguridad
      'security-scan': { file: '../security-scan.cjs', fn: null },
      'audit': { file: 'security.cjs', fn: 'runAudit' },
      'audit-fix': { file: 'security.cjs', fn: 'runAuditFix' },
      
      // Gobernanza
      'api-spec': { file: 'governance.cjs', fn: 'validateApiSpec' },
      'traceability': { file: 'governance.cjs', fn: 'generateTraceability' },
      'governance': { file: 'governance.cjs', fn: 'runGovernance' },
      'task-status': { file: 'governance.cjs', fn: 'showTaskStatus' },
      
      // Electron
      'electron': { file: 'dev.cjs', fn: 'runElectron' },
      'electron-pack': { file: 'dev.cjs', fn: 'packElectron' },
      'electron-dist': { file: 'dev.cjs', fn: 'makeDistribution' },
      'electron-build': { file: 'build.cjs', fn: 'buildElectron' },
      
      // Docker
      'docker-dev': { file: 'docker.cjs', fn: 'startDevDocker' },
      'docker-prod': { file: 'docker.cjs', fn: 'startProdDocker' },
      'docker-backend': { file: 'docker.cjs', fn: 'startBackendDocker' },
      'docker-stop': { file: 'docker.cjs', fn: 'stopDocker' },
      'docker-logs': { file: 'docker.cjs', fn: 'showDockerLogs' },
      
      // Mantenimiento
      'clean': { file: 'maintenance.cjs', fn: 'cleanBuild' },
      'clean-modules': { file: 'maintenance.cjs', fn: 'cleanModules' },
      'update-deps': { file: 'maintenance.cjs', fn: 'updateDependencies' },
      'health-check': { file: 'maintenance.cjs', fn: 'checkHealth' },
      'optimize': { file: 'maintenance.cjs', fn: 'optimizeProject' }
    };
    
    // Verificar si el comando existe en el mapeo
    if (!commandMapping[command]) {
      logger.error(`Comando desconocido: ${command}`);
      logger.info('Ejecute "yarn run cmd help" para ver la lista de comandos disponibles.');
      process.exit(1);
    }
    
    const { file, fn, needsArgs, args: predefinedArgs } = commandMapping[command];
    
    // Validar y obtener la ruta segura del script (previene path traversal)
    let scriptPath;
    
    // Lista de archivos especiales permitidos en el directorio scripts/
    const allowedSpecialFiles = {

      '../security-scan.cjs': 'security-scan.cjs', 
      '../generate-traceability.cjs': 'generate-traceability.cjs',
      '../generate-traceability-data.cjs': 'generate-traceability-data.cjs'
    };
    
    if (allowedSpecialFiles[file]) {
      // Para archivos especiales permitidos, construir ruta segura
      scriptPath = path.join(__dirname, allowedSpecialFiles[file]);
    } else if (file.startsWith('../') || file.startsWith('./')) {
      // Rechazar otras rutas relativas que no están en la lista de permitidos
      logger.error(`❌ Ruta de script no autorizada: ${file}`);
      process.exit(1);
    } else {
      // Para comandos normales en el directorio commands/
      scriptPath = safePathJoin(__dirname, 'commands', file);
      if (!scriptPath) {
        logger.error(`❌ Ruta de script inválida: ${file}`);
        process.exit(1);
      }
    }
    
    // Verificar si el archivo existe
    if (!fs.existsSync(scriptPath)) {
      // Manejo especial para archivos especiales en el directorio scripts/
      // Lista de comandos con sus propios archivos en el directorio scripts/
      const specialCommands = {

        'security-scan': './security-scan.cjs',
        'traceability': './generate-traceability.cjs'
      };
      
      if (specialCommands[command]) {
        // Validar ruta especial de forma segura
        const specialScriptPath = safePathJoin(__dirname, specialCommands[command]);
        if (!specialScriptPath) {
          logger.error(`❌ Ruta de script especial inválida para: ${command}`);
          process.exit(1);
        }
        
        if (fs.existsSync(specialScriptPath)) {
          logger.info(`Ejecutando ${command}...`);
          try {
            require(specialCommands[command]);
            return;
          } catch (error) {
            logger.error(`Error al ejecutar el comando '${command}': ${error.message}`);
            console.error(error);
            process.exit(1);
          }
        }
      }
      
      // Si el archivo no existe pero es un comando simple, ejecutarlo directamente
      logger.info(`Ejecutando comando: ${command}`);
      const { execute } = require('./utils/executor.cjs');
      
      // Mapeo de comandos a comandos yarn
      // Mapeo de comandos a comandos de config
      const yarnCommands = {};
      
      // Añadir todos los comandos disponibles en config.commands
      Object.entries(config.commands).forEach(([key, value]) => {
        // Convertir camelCase a kebab-case para los comandos
        const kebabKey = key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
        yarnCommands[kebabKey] = value;
      });
      
      if (yarnCommands[command]) {
        execute(yarnCommands[command], {}, `✅ Comando '${command}' completado con éxito`);
      } else {
        logger.error(`El script para el comando '${command}' no está implementado aún.`);
        logger.info('Estamos en proceso de migración. Por favor, utilice el comando equivalente en package.json por ahora.');
      }
      return;
    }
    
    // Importar y ejecutar el script
    const script = require(scriptPath);
    
    // Manejo especial para QA Híbrido CLI (antes de verificar script[fn])
    if (commandMapping[command].isHybridCLI) {
      const QAHybridSystem = script;
      const qaSystem = new QAHybridSystem();
      await qaSystem.run(args);
      return;
    }
    
    if (fn && typeof script[fn] === 'function') {
      // Manejo especial para comandos modulares
      if (command.startsWith('validate-')) {
        await _handleModularValidation(script, fn, command, args, predefinedArgs);
      } else {
        await script[fn](args);
      }
    } else if (typeof script === 'function') {
      await script(args);
    } else if (fn === null) {
      // Script se auto-ejecuta (no necesita función específica)
      // El script ya se ejecutó al hacer require(), no necesitamos hacer nada más
      return;
    } else {
      // Try to handle as class constructor
      if (typeof script === 'function' && script.prototype && script.prototype.constructor === script) {
        // This is a class, create instance and call run method
        const instance = new script();
        if (typeof instance.run === 'function') {
          await instance.run(args);
        } else {
          logger.error(`La clase '${script.name}' no tiene un método 'run'`);
          process.exit(1);
        }
      } else {
        logger.error(`La función '${fn}' no está definida en el script '${file}'`);
        process.exit(1);
      }
    }
  } catch (error) {
    logger.error(`Error al ejecutar el comando '${command}': ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Punto de entrada principal
if (command === 'help') {
  showHelp();
} else {
  executeCommand(command, args.slice(1));
}
