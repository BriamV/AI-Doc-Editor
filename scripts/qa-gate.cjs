#!/usr/bin/env node

/**
 * QA-Gate script refactorizado - Arquitectura modular
 * 
 * Refactorizado para mejorar mantenibilidad usando la arquitectura existente.
 * Utiliza módulos especializados para cada responsabilidad.
 * 
 * Este script implementa verificaciones de calidad para:
 * 1. Frontend (TypeScript, ESLint, Jest/Vitest)
 * 2. Backend (Python, FastAPI, pytest)
 * 3. Seguridad y compatibilidad
 * 
 * Autor: AI-Doc-Editor Team
 * Versión: 4.0.0
 */

const logger = require('./utils/logger.cjs');
const QASteps = require('./utils/qa-steps.cjs');
const QARunner = require('./utils/qa-runner.cjs');

// Determinar el directorio raíz del proyecto
const rootDir = process.cwd();

// Procesar argumentos de línea de comandos
const args = process.argv.slice(2);
const options = {
  autoInstall: args.includes('--install') || args.includes('-i'),
  skipFrontend: args.includes('--skip-frontend') || args.includes('--backend-only'),
  skipBackend: args.includes('--skip-backend') || args.includes('--frontend-only'),
  showHelp: args.includes('--help') || args.includes('-h'),
  verbose: args.includes('--verbose') || args.includes('-v'),
  parallel: args.includes('--parallel') || args.includes('-p')
};

/**
 * Muestra la ayuda del comando
 */
function showHelp() {
  console.log('');
  console.log('QA-Gate - Verificación de calidad para AI-Doc-Editor (Frontend + Backend)');
  console.log('');
  console.log('Uso:');
  console.log('  node qa-gate.cjs [opciones]');
  console.log('');
  console.log('Opciones:');
  console.log('  --install, -i            Instalar dependencias faltantes automáticamente');
  console.log('  --skip-frontend          Omitir verificaciones de frontend');
  console.log('  --skip-backend           Omitir verificaciones de backend');
  console.log('  --frontend-only          Solo ejecutar verificaciones de frontend');
  console.log('  --backend-only           Solo ejecutar verificaciones de backend');
  console.log('  --verbose, -v            Salida detallada');
  console.log('  --parallel, -p           Ejecutar pasos en paralelo cuando sea posible');
  console.log('  --help, -h               Mostrar esta ayuda');
  console.log('');
  console.log('Ejemplos:');
  console.log('  node qa-gate.cjs                         # Todas las verificaciones');
  console.log('  node qa-gate.cjs --frontend-only         # Solo frontend');
  console.log('  node qa-gate.cjs --design-guidelines-only # Solo validar DESIGN_GUIDELINES');
  console.log('  node qa-gate.cjs --install               # Con instalación automática');
  console.log('');
}

/**
 * Filtra los pasos según las opciones de CLI
 * @param {Array} allSteps - Todos los pasos disponibles
 * @returns {Array} - Lista de pasos a ejecutar
 */
function filterSteps(allSteps) {
  return allSteps.filter(step => {
    // Si solo queremos Design Guidelines
    if (options.designGuidelinesOnly) {
      return step.category === 'design-guidelines';
    }
    
    // Filtros de exclusión
    if (options.skipFrontend && step.category === 'frontend') return false;
    if (options.skipBackend && step.category === 'backend') return false;
    if (options.skipDesignGuidelines && step.category === 'design-guidelines') return false;
    
    return true;
  });
}

/**
 * Muestra información sobre la ejecución
 */
function logExecutionInfo() {
  console.log('===============================================');
  
  if (options.autoInstall) {
    logger.task('Modo de instalación automática activado');
  }
  if (options.skipFrontend) {
    logger.task('Verificaciones de frontend desactivadas');
  }
  if (options.skipBackend) {
    logger.task('Verificaciones de backend desactivadas');
  }
  if (options.skipDesignGuidelines) {
    logger.task('Validaciones de DESIGN_GUIDELINES desactivadas');
  }
  if (options.designGuidelinesOnly) {
    logger.task('Solo ejecutando validaciones de DESIGN_GUIDELINES');
  }
  if (options.parallel) {
    logger.task('Ejecución en paralelo habilitada');
  }
}

/**
 * Configuración del QA Gate refactorizado
 */
const config = {
  title: 'Enhanced Quality Gate (Frontend + Backend) v4.0'
};

// Comprobar si se solicita ayuda
if (options.showHelp) {
  showHelp();
  process.exit(0);
}

/**
 * Función principal que ejecuta todo el QA gate
 */
async function runQAGate() {
  const startTime = Date.now();
  
  logger.title(`Running ${config.title}`);
  logExecutionInfo();
  
  try {
    // Inicializar componentes
    const qaSteps = new QASteps(rootDir, options);
    const qaRunner = new QARunner(options);
    
    // Obtener y filtrar pasos
    const allSteps = qaSteps.getSteps();
    const stepsToRun = filterSteps(allSteps);
    
    logger.info(`Ejecutando ${stepsToRun.length} pasos de verificación...`);
    
    // Ejecutar pasos (secuencial o paralelo según configuración)
    let allPassed;
    if (options.parallel) {
      // Ejecutar ciertos pasos en paralelo (solo los que son independientes)
      const parallelSteps = stepsToRun.filter(step => 
        step.category === 'frontend' || step.category === 'backend'
      );
      const sequentialSteps = stepsToRun.filter(step => 
        step.category !== 'frontend' && step.category !== 'backend'
      );
      
      // Primero ejecutar pasos paralelos, luego secuenciales
      if (parallelSteps.length > 0) {
        logger.info('Ejecutando verificaciones de frontend y backend en paralelo...');
        allPassed = await qaRunner.runStepsParallel(parallelSteps);
      }
      
      if (allPassed && sequentialSteps.length > 0) {
        logger.info('Ejecutando verificaciones de seguridad y compatibilidad...');
        allPassed = await qaRunner.runSteps(sequentialSteps);
      }
    } else {
      // Ejecución secuencial tradicional
      allPassed = await qaRunner.runSteps(stepsToRun);
    }
    
    // Resultado final
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('===============================================');
    
    if (allPassed) {
      console.log(`🎉 ALL QUALITY GATES PASSED! (${duration}s)`);
      process.exit(0);
    } else {
      console.error(`❌ QUALITY GATE FAILED (${duration}s)`);
      process.exit(1);
    }
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.error(`Error crítico en QA Gate: ${error.message}`);
    console.error(`❌ QUALITY GATE FAILED (${duration}s)`);
    process.exit(1);
  }
}

// Ejecutar el QA Gate
if (require.main === module) {
  runQAGate();
}

module.exports = { runQAGate };