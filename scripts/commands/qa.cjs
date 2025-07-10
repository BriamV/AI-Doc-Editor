#!/usr/bin/env node
/**
 * QA Command - Entry point for QA System
 * Implementation of T-01, T-02, T-05, T-19 (R0.WP1)
 * 
 * Delegates to the main QA CLI implementation
 */

const path = require('path');

/**
 * Run QA system
 * @param {string[]} args - Command arguments
 */
async function run(args = []) {
  try {
    // Import the QA CLI modules
    const QALogger = require('../qa/utils/QALogger.cjs');
    const QAConfig = require('../qa/config/QAConfig.cjs');
    const { runQAValidation, showDetailedHelp } = require('../qa/qa-cli.cjs');
    
    // Handle help command specially
    if (args.includes('--help') || args.includes('-h')) {
      const logger = new QALogger({ colors: true, timestamps: false });
      
      logger.info('Sistema de Automatización QA para Desarrollo con Agentes IA');
      logger.info('Usage: yarn qa [command] [options]');
      logger.info('');
      logger.info('Options:');
      logger.info('  -f, --fast       Modo rápido para pre-commit (T-07)');
      logger.info('  -s, --scope      Validar scope específico (frontend|backend|infrastructure)');
      logger.info('  -d, --dimension  Ejecutar dimensión específica');
      logger.info('  -c, --config     Archivo de configuración personalizado');
      logger.info('  -v, --verbose    Salida detallada');
      logger.info('  -r, --report     Generar reporte en formato específico');
      logger.info('  -h, --help       Show help');
      logger.info('');
      logger.info('Examples:');
      logger.info('  yarn qa                                   Ejecutar validación automática');
      logger.info('  yarn qa --fast                            Modo rápido para pre-commit');
      logger.info('  yarn qa --scope frontend                  Validar solo el frontend');
      logger.info('  yarn qa --dimension lint                  Ejecutar solo linting');
      logger.info('  yarn qa T-02                              Validar tarea específica');
      logger.info('');
      logger.info('For detailed help: node scripts/qa/qa-cli.cjs help <topic>');
      return;
    }
    
    // Parse arguments into argv format
    const argv = {
      _: [],
      fast: args.includes('--fast') || args.includes('-f'),
      verbose: args.includes('--verbose') || args.includes('-v'),
      scope: null,
      dimension: null,
      config: path.join(__dirname, '..', 'qa', 'qa-config.json')
    };
    
    // Parse scope
    const scopeIndex = args.findIndex(arg => arg === '--scope' || arg === '-s');
    if (scopeIndex !== -1 && args[scopeIndex + 1]) {
      argv.scope = args[scopeIndex + 1];
    }
    
    // Parse dimension
    const dimensionIndex = args.findIndex(arg => arg === '--dimension' || arg === '-d');
    if (dimensionIndex !== -1 && args[dimensionIndex + 1]) {
      argv.dimension = args[dimensionIndex + 1];
    }
    
    // Parse positional arguments (task)
    const positionals = args.filter(arg => !arg.startsWith('-') && 
      !['frontend', 'backend', 'infrastructure', 'all', 'format', 'lint', 'test', 'security', 'build'].includes(arg));
    if (positionals.length > 0) {
      argv.task = positionals[0];
    }
    
    // Run QA validation
    await runQAValidation(argv);
    
  } catch (error) {
    console.error('Failed to load QA CLI:', error.message);
    if (error.message.includes('yargs')) {
      console.error('Please ensure yargs is installed: yarn add yargs@17.7.2');
    }
    process.exit(1);
  }
}

module.exports = {
  run
};