/**
 * QAOrchestrator.cjs - Main QA Validation Orchestration Logic
 * Conservative extraction from qa-cli.cjs lines 217-327
 * No new functionality added - exact mapping only
 */

const QALogger = require('../utils/QALogger.cjs');
const QAConfig = require('../config/QAConfig.cjs');
const { resetPackageManagerService } = require('../core/services/PackageManagerService.cjs');

class QAOrchestrator {
  constructor() {
    this.logger = null;
    this.config = null;
  }

  /**
   * Main QA validation function
   * Implements complete validation pipeline using WP2 components
   */
  async runQAValidation(argv) {
    this.logger = new QALogger({ 
      verbose: argv.verbose,
      jsonReport: argv.report === 'json',
      jsonFile: 'qa-report.json'
    });
    
    try {
      // CRITICAL FIX RF-003.1: Reset PackageManagerService cache/singleton to prevent detection inconsistencies
      resetPackageManagerService();
      
      // Load configuration (T-19)
      this.config = await QAConfig.load(argv.config);
      
      this.logger.info('🚀 QA System - Starting validation...');
      this.logger.info('');
      
      // Show parsed options
      this.logger.info('📋 Configuration:');
      this.logger.info(`  Mode: ${argv.fast ? 'Fast' : 'Full'}`);
      if (argv.scope) this.logger.info(`  Scope: ${argv.scope}`);
      if (argv.dimension) this.logger.info(`  Dimension: ${argv.dimension}`);
      if (argv.task) this.logger.info(`  Task/DoD: ${argv.task}`);
      this.logger.info('');
      
      // WP2 Implementation: Use actual components
      this.logger.info('🔧 System Status:');
      this.logger.info('  ✅ CLI Core implemented (T-02)');
      this.logger.info('  ✅ Configuration loaded (T-19)');
      this.logger.info('  ✅ Context detection implemented (T-03)');
      this.logger.info('  ✅ Orchestrator implemented (T-04)');
      this.logger.info('  ✅ Plan selector implemented (T-20)');
      this.logger.info('  ✅ Wrapper coordinator implemented (T-21)');
      this.logger.info('  ✅ Environment checker implemented (T-10)');
      this.logger.info('');
      
      // Initialize WP2 + WP3 components
      const ContextDetector = require('../core/ContextDetector.cjs');
      const PlanSelector = require('../core/PlanSelector.cjs');
      const WrapperCoordinator = require('../core/WrapperCoordinator.cjs');
      const EnvironmentChecker = require('../core/EnvironmentChecker.cjs');
      const Orchestrator = require('../core/Orchestrator.cjs');
      
      const contextDetector = new ContextDetector({ verbose: argv.verbose });
      const environmentChecker = new EnvironmentChecker(this.config, this.logger);
      const planSelector = new PlanSelector(this.config, this.logger, environmentChecker);
      const wrapperCoordinator = new WrapperCoordinator(this.config, this.logger);
      
      // T-10: Check environment before execution (pass mode for optimization)
      const mode = argv.fast ? 'fast' : 'automatic';
      const envCheck = await environmentChecker.checkEnvironment(mode);
      if (!envCheck.success) {
        this.logger.error(`Environment check failed: ${envCheck.error}`);
        process.exit(1);
      }
      
      // Create orchestrator with dependencies
      const orchestrator = new Orchestrator({
        contextDetector,
        planSelector,
        wrapperCoordinator,
        logger: this.logger,
        config: this.config
      });
      
      // Run complete validation
      const results = await orchestrator.run(argv);
      
      // Display results
      this.logger.tree(results.results);
      this.logger.summary(results.statistics);
      
      // Generate JSON report if requested
      if (argv.report === 'json' || argv.report === 'ci-json') {
        // Ensure we have valid results structure
        const reportResults = {
          summary: results.statistics || { passed: 0, failed: 0, warnings: 0, total: 0 },
          details: results.results || [],
          recommendations: results.recommendations || [],
          mode: argv.fast ? 'fast' : (argv.task ? 'dod' : 'automatic'),
          scope: argv.scope || 'all'
        };
        await this.logger.generateJSONReport(reportResults, argv.report);
      }
      
      this.logger.success('QA validation completed successfully');
      
      // Return results for error handling
      return results;
      
    } catch (error) {
      this.logger.error(`QA validation failed: ${error.message}`);
      if (argv.verbose) {
        this.logger.error(error.stack);
      }
      
      // Re-throw for error handler
      throw error;
    }
  }
}

module.exports = QAOrchestrator;