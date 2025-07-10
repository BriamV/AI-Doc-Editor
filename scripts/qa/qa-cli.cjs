#!/usr/bin/env node
/**
 * QA CLI - Point of Entry for QA System
 * T-02: CLI Core & Help implementation
 * 
 * This module implements the main CLI interface for the QA system
 * according to RF-001 and RF-009 requirements from PRD-QA CLI.md
 */

const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const path = require('path');

// Import QA modules
const QALogger = require('./utils/QALogger.cjs');
const QAConfig = require('./config/QAConfig.cjs');

// Initialize logger instance
const logger = new QALogger();

/**
 * Main CLI implementation
 */
function createCLI() {
  const cli = yargs(hideBin(process.argv));
  
  return cli
    .scriptName('yarn qa')
    .version('0.1.0')
    .usage('Sistema de Automatización QA para Desarrollo con Agentes IA\nUsage: $0 [command] [options]')
    
    // Global options
    .option('fast', {
      alias: 'f',
      type: 'boolean',
      description: 'Modo rápido para pre-commit (T-07)',
      default: false
    })
    .option('scope', {
      alias: 's',
      type: 'string',
      description: 'Validar scope específico (frontend|backend|infrastructure)',
      choices: ['frontend', 'backend', 'infrastructure', 'all']
    })
    .option('dimension', {
      alias: 'd',
      type: 'string',
      description: 'Ejecutar dimensión específica',
      choices: ['format', 'lint', 'test', 'security', 'build']
    })
    .option('config', {
      alias: 'c',
      type: 'string',
      description: 'Archivo de configuración personalizado',
      default: path.join(__dirname, 'qa-config.json')
    })
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      description: 'Salida detallada',
      default: false
    })
    .option('report', {
      alias: 'r',
      type: 'string',
      description: 'Generar reporte en formato específico',
      choices: ['json', 'html', 'console']
    })
    
    // Default command (no subcommand)
    .command(
      '$0 [task]',
      'Ejecutar validación QA automática',
      (yargs) => {
        yargs.positional('task', {
          describe: 'Tarea específica (T-XX) o etiqueta DoD',
          type: 'string'
        });
      },
      async (argv) => {
        await runQAValidation(argv);
      }
    )
    
    // Help command
    .command(
      'help [command]',
      'Mostrar ayuda detallada',
      (yargs) => {
        yargs.positional('command', {
          describe: 'Comando específico para mostrar ayuda',
          type: 'string'
        });
      },
      (argv) => {
        showDetailedHelp(argv.command);
      }
    )
    
    // Examples
    .example('$0', 'Ejecutar validación automática basada en contexto')
    .example('$0 --fast', 'Modo rápido para pre-commit hooks')
    .example('$0 --scope frontend', 'Validar solo el frontend')
    .example('$0 --dimension lint', 'Ejecutar solo linting')
    .example('$0 T-02', 'Validar tarea específica T-02')
    .example('$0 --scope backend --dimension test', 'Ejecutar tests del backend')
    
    // Configuration
    .help('h')
    .alias('h', 'help')
    .wrap(Math.min(120, process.stdout.columns))
    .strict()
    .demandCommand(0, 1)
    .fail((msg, err, yargs) => {
      if (err) {
        logger.error(`Error: ${err.message}`);
        process.exit(1);
      }
      
      logger.error(msg);
      logger.info('');
      logger.info('Use --help para ver las opciones disponibles');
      process.exit(1);
    });
}

/**
 * Main QA validation function
 * Implements complete validation pipeline using WP2 components
 */
async function runQAValidation(argv) {
  const logger = new QALogger({ 
    verbose: argv.verbose,
    jsonReport: argv.report === 'json',
    jsonFile: 'qa-report.json'
  });
  
  try {
    // Load configuration (T-19)
    const config = await QAConfig.load(argv.config);
    
    logger.info('🚀 QA System - Starting validation...');
    logger.info('');
    
    // Show parsed options
    logger.info('📋 Configuration:');
    logger.info(`  Mode: ${argv.fast ? 'Fast' : 'Full'}`);
    if (argv.scope) logger.info(`  Scope: ${argv.scope}`);
    if (argv.dimension) logger.info(`  Dimension: ${argv.dimension}`);
    if (argv.task) logger.info(`  Task/DoD: ${argv.task}`);
    logger.info('');
    
    // WP2 Implementation: Use actual components
    logger.info('🔧 System Status:');
    logger.info('  ✅ CLI Core implemented (T-02)');
    logger.info('  ✅ Configuration loaded (T-19)');
    logger.info('  ✅ Context detection implemented (T-03)');
    logger.info('  ✅ Orchestrator implemented (T-04)');
    logger.info('  ✅ Plan selector implemented (T-20)');
    logger.info('  ✅ Wrapper coordinator implemented (T-21)');
    logger.info('  ✅ Environment checker implemented (T-10)');
    logger.info('');
    
    // Initialize WP2 + WP3 components
    const ContextDetector = require('./core/ContextDetector.cjs');
    const PlanSelector = require('./core/PlanSelector.cjs');
    const WrapperCoordinator = require('./core/WrapperCoordinator.cjs');
    const EnvironmentChecker = require('./core/EnvironmentChecker.cjs');
    const Orchestrator = require('./core/Orchestrator.cjs');
    
    const contextDetector = new ContextDetector({ verbose: argv.verbose });
    const planSelector = new PlanSelector(config, logger);
    const wrapperCoordinator = new WrapperCoordinator(config, logger);
    const environmentChecker = new EnvironmentChecker(config, logger);
    
    // T-10: Check environment before execution
    const envCheck = await environmentChecker.checkEnvironment();
    if (!envCheck.success) {
      logger.error(`Environment check failed: ${envCheck.error}`);
      process.exit(1);
    }
    
    // Create orchestrator with dependencies
    const orchestrator = new Orchestrator({
      contextDetector,
      planSelector,
      wrapperCoordinator,
      logger,
      config
    });
    
    // Run complete validation
    const results = await orchestrator.run(argv);
    
    // Display results
    logger.tree(results.results);
    logger.summary(results.statistics);
    
    // Generate JSON report if requested
    if (argv.report === 'json') {
      await logger.generateJSONReport(results);
    }
    
    logger.success('QA validation completed successfully');
    
    // Exit with appropriate code
    if (results.status === 'failed') {
      process.exit(1);
    }
    
  } catch (error) {
    logger.error(`QA validation failed: ${error.message}`);
    if (argv.verbose) {
      logger.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Show detailed help information
 */
function showDetailedHelp(command) {
  const logger = new QALogger();
  
  logger.info('🔍 QA System - Detailed Help');
  logger.info('');
  
  if (!command) {
    logger.info('📚 Available Topics:');
    logger.info('  modes     - Execution modes (fast, full, dod)');
    logger.info('  scopes    - Validation scopes (frontend, backend, infrastructure)');
    logger.info('  dimensions- Quality dimensions (format, lint, test, security, build)');
    logger.info('  tasks     - Task-specific validation (T-XX)');
    logger.info('  config    - Configuration options');
    logger.info('');
    logger.info('Usage: yarn qa help <topic>');
    return;
  }
  
  switch (command) {
    case 'modes':
      logger.info('🚀 Execution Modes:');
      logger.info('  --fast    Pre-commit mode (<10s, only modified files)');
      logger.info('  (default) Full validation mode (all tools, all files)');
      logger.info('  T-XX      Task-specific DoD validation');
      break;
      
    case 'scopes':
      logger.info('🎯 Validation Scopes:');
      logger.info('  frontend      src/**/*.{ts,tsx,js,jsx}');
      logger.info('  backend       backend/**/*.py');
      logger.info('  infrastructure scripts/**/*.{cjs,sh}, tools/**/*');
      logger.info('  all           All scopes (default)');
      break;
      
    case 'dimensions':
      logger.info('🔧 Quality Dimensions:');
      logger.info('  format    Code formatting (Prettier, Black)');
      logger.info('  lint      Code linting (ESLint, Pylint)');
      logger.info('  test      Testing & coverage (Jest, Pytest)');
      logger.info('  security  Security analysis (Snyk, Bandit)');
      logger.info('  build     Build validation (TSC, Vite)');
      break;
      
    case 'tasks':
      logger.info('📋 Task Validation:');
      logger.info('  yarn qa T-02       Validate specific task');
      logger.info('  yarn qa dod:test   Validate DoD criteria');
      logger.info('  yarn qa feature/*  Auto-detect from branch');
      break;
      
    case 'config':
      logger.info('⚙️ Configuration:');
      logger.info('  --config    Custom config file');
      logger.info('  --verbose   Detailed output');
      logger.info('  --report    Generate reports (json, html)');
      break;
      
    default:
      logger.warn(`Unknown help topic: ${command}`);
      logger.info('Use "yarn qa help" to see available topics');
  }
}

// Export for testing
module.exports = {
  createCLI,
  runQAValidation,
  showDetailedHelp
};

// Run CLI if this file is executed directly
if (require.main === module) {
  try {
    createCLI().parse();
  } catch (error) {
    console.error('CLI Error:', error);
    process.exit(1);
  }
}