/**
 * Snyk Wrapper - T-09: Security & Audit scanner
 * SOLID-compliant coordinator using specialized components
 */

const SnykConfig = require('./snyk/SnykConfig.cjs');
const SnykExecutor = require('./snyk/SnykExecutor.cjs');
const SnykReporter = require('./snyk/SnykReporter.cjs');

class SnykWrapper {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    // Initialize SOLID components
    this.snykConfig = new SnykConfig(config);
    this.executor = new SnykExecutor(config, logger);
    this.reporter = new SnykReporter(config, logger);
  }
  
  /**
   * Mark this as an orchestrator wrapper that expects execute(tool) interface
   */
  getFilesForTool() {
    // This method exists to signal ExecutionController to use execute(tool) interface
    return [];
  }

  /**
   * Execute Snyk security scan
   */
  async execute(tool) {
    const startTime = Date.now();
    
    try {
      this.logger.info(`Executing Snyk for ${tool.name} (${tool.dimension})`);
      
      // Check if Snyk is authenticated
      const authCheck = await this.executor.checkAuth();
      if (!authCheck.success) {
        this.logger.warn('Snyk authentication required - some features may be limited');
      }
      
      // Build Snyk command
      const command = this.snykConfig.buildCommand(tool);
      
      // Execute Snyk scan
      const result = await this.executor.execute(command, this.snykConfig.settings.timeout);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Process Snyk results
      const processedResults = this.reporter.processResults(result, tool);
      
      this.logger.info(`Snyk execution completed for ${tool.name} in ${executionTime}ms`);
      
      return {
        success: this.snykConfig.determineSuccess(processedResults),
        tool: tool.name,
        dimension: tool.dimension,
        executionTime: executionTime,
        results: processedResults,
        warnings: processedResults.warnings || [],
        errors: processedResults.errors || []
      };
      
    } catch (error) {
      this.logger.error(`Snyk execution failed for ${tool.name}: ${error.message}`);
      
      return {
        success: false,
        tool: tool.name,
        dimension: tool.dimension,
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * Get wrapper name (required by IBaseLinterWrapper interface)
   */
  getName() {
    return 'SnykWrapper';
  }
  
  /**
   * Get wrapper version
   */
  getVersion() {
    return '1.0.0';
  }
  
  /**
   * Check if Snyk is available
   */
  async isAvailable() {
    try {
      const availabilityCheck = await this.executor.checkAuth();
      return availabilityCheck !== null;
    } catch (error) {
      this.logger.warn(`Snyk availability check failed: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Get wrapper capabilities
   */
  getCapabilities() {
    return {
      supportedTools: ['snyk'],
      supportedDimensions: ['security'],
      fastModeSupported: true,
      parallelExecutionSupported: true,
      reportFormats: ['json', 'console'],
      vulnerabilityScanning: true
    };
  }
}

module.exports = SnykWrapper;