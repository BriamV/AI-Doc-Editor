/**
 * CLIRunner.cjs - CLI Execution Runner and Help System
 * Conservative extraction from qa-cli.cjs lines 20-49 + 504-584
 * No new functionality added - exact mapping only
 */

const QALogger = require('../utils/QALogger.cjs');
const ArgumentParser = require('./ArgumentParser.cjs');
const QAOrchestrator = require('./QAOrchestrator.cjs');
const ErrorHandler = require('./ErrorHandler.cjs');

class CLIRunner {
  constructor() {
    this.argumentParser = new ArgumentParser();
    this.orchestrator = new QAOrchestrator();
    this.errorHandler = new ErrorHandler();
    this.logger = new QALogger();
  }

  /**
   * Get dynamic package manager command for help text
   * Falls back to 'npm run cmd qa' if detection fails
   */
  async getQACommand() {
    try {
      const { getPackageManagerService } = require('../core/services/PackageManagerService.cjs');
      const packageManagerService = getPackageManagerService();
      await packageManagerService.initialize();
      const manager = packageManagerService.getManager();
      
      // Map package manager to appropriate command
      const commandMap = {
        'yarn': 'yarn run cmd qa',
        'npm': 'npm run cmd qa', 
        'pnpm': 'pnpm run cmd qa'
      };
      
      return commandMap[manager] || 'npm run cmd qa';
    } catch (error) {
      // Fallback if detection fails
      return 'npm run cmd qa';
    }
  }

  /**
   * Get short command name for script name
   */
  getShortQACommand() {
    // For now, use generic command since scriptName needs to be synchronous
    return 'qa';
  }

  /**
   * Create and configure CLI
   */
  async createCLI() {
    // Set dynamic QA command
    const qaCommand = await this.getQACommand();
    this.argumentParser.setQACommand(qaCommand);
    
    // Create CLI with all commands
    const cli = this.argumentParser.createCLI();
    
    // Set up command handlers
    cli.command(
      '$0 [task]',
      'Ejecutar validación QA automática',
      (yargs) => {
        yargs.positional('task', {
          describe: 'Tarea específica (T-XX) o etiqueta DoD',
          type: 'string'
        });
      },
      async (argv) => {
        await this.handleMainCommand(argv);
      }
    );
    
    cli.command(
      'report-issue',
      'Reportar problema con el sistema QA (RF-008)',
      () => {},
      async (argv) => {
        await this.errorHandler.reportIssue(argv);
      }
    );
    
    cli.command(
      'list-issues',
      'Listar reportes de issues locales',
      () => {},
      async (argv) => {
        await this.errorHandler.listIssues(argv);
      }
    );
    
    cli.command(
      'help [command]',
      'Mostrar ayuda detallada',
      () => {},
      async (argv) => {
        await this.showDetailedHelp(argv.command);
      }
    );
    
    // Set up error handling
    this.errorHandler.setupCliErrorHandling(cli);
    
    return cli;
  }

  /**
   * Handle main command execution
   */
  async handleMainCommand(argv) {
    try {
      // Run QA validation
      const results = await this.orchestrator.runQAValidation(argv);
      
      // Handle any errors or issue reporting
      await this.errorHandler.handleValidationError(results, argv);
      
    } catch (error) {
      // Handle --report-issue flag on error (RF-008)
      if (argv['report-issue']) {
        await this.errorHandler.handleReportIssue({ error: error.message }, argv);
      }
      
      process.exit(1);
    }
  }

  /**
   * Show detailed help information
   */
  async showDetailedHelp(command) {
    this.logger.info('🔍 QA System - Detailed Help');
    this.logger.info('');
    
    if (!command) {
      this.logger.info('📚 Available Topics:');
      this.logger.info('  modes     - Execution modes (fast, full, dod)');
      this.logger.info('  scopes    - Validation scopes (frontend, backend, infrastructure)');
      this.logger.info('  dimensions- Quality dimensions (format, lint, test, security, build)');
      this.logger.info('  tasks     - Task-specific validation (T-XX)');
      this.logger.info('  config    - Configuration options');
      this.logger.info('');
      const qaCommand = await this.getQACommand();
      this.logger.info(`Usage: ${qaCommand} help <topic>`);
      return;
    }
    
    switch (command) {
      case 'modes':
        this.logger.info('🚀 Execution Modes:');
        this.logger.info('  --fast    Pre-commit mode (<10s, only modified files)');
        this.logger.info('  (default) Full validation mode (all tools, all files)');
        this.logger.info('  T-XX      Task-specific DoD validation');
        break;
        
      case 'scopes':
        this.logger.info('🎯 Validation Scopes:');
        this.logger.info('  frontend      src/**/*.{ts,tsx,js,jsx}');
        this.logger.info('  backend       backend/**/*.py');
        this.logger.info('  infrastructure scripts/**/*.{cjs,sh}, tools/**/*');
        this.logger.info('  all           All scopes (default)');
        break;
        
      case 'dimensions':
        this.logger.info('🔧 Quality Dimensions:');
        this.logger.info('  format    Code formatting (Prettier, Black)');
        this.logger.info('  lint      Code linting (ESLint, Pylint)');
        this.logger.info('  test      Testing & coverage (Jest, Pytest)');
        this.logger.info('  security  Security analysis (Snyk, Bandit)');
        this.logger.info('  build     Build validation (TSC, Vite)');
        break;
        
      case 'tasks':
        this.logger.info('📋 Task Validation:');
        const qaCommand = await this.getQACommand();
        this.logger.info(`  ${qaCommand} T-02       Validate specific task`);
        this.logger.info(`  ${qaCommand} dod:test   Validate DoD criteria`);
        this.logger.info(`  ${qaCommand} feature/*  Auto-detect from branch`);
        break;
        
      case 'config':
        this.logger.info('⚙️ Configuration:');
        this.logger.info('  --config    Custom config file');
        this.logger.info('  --verbose   Detailed output');
        this.logger.info('  --report    Generate reports (json, html)');
        break;
        
      default:
        this.logger.warn(`Unknown help topic: ${command}`);
        const qaCommandDefault = await this.getQACommand();
        this.logger.info(`Use "${qaCommandDefault} help" to see available topics`);
    }
  }

  /**
   * Run CLI if this file is executed directly
   */
  async run() {
    try {
      const cli = await this.createCLI();
      cli.parse();
    } catch (error) {
      console.error('CLI Error:', error);
      process.exit(1);
    }
  }
}

module.exports = CLIRunner;