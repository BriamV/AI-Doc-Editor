/**
 * Semgrep Wrapper - T-09: Static code analysis security scanner  
 * SOLID-compliant coordinator using specialized components
 */

const SemgrepConfig = require('./semgrep/SemgrepConfig.cjs');
const SemgrepExecutor = require('./semgrep/SemgrepExecutor.cjs');
const SemgrepReporter = require('./semgrep/SemgrepReporter.cjs');

class SemgrepWrapper {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    // Initialize SOLID components
    this.semgrepConfig = new SemgrepConfig(config);
    this.executor = new SemgrepExecutor(config, logger);
    this.reporter = new SemgrepReporter(config, logger);
  }
  
  /**
   * Execute Semgrep security scan
   */
  async execute(tool) {
    const startTime = Date.now();
    
    try {
      this.logger.info(`Executing Semgrep for ${tool.name} (${tool.dimension})`);
      
      // Check if Semgrep is available
      const availabilityCheck = await this.executor.checkAvailability();
      if (!availabilityCheck.success) {
        this.logger.warn('Semgrep not available - skipping security scan');
        return {
          success: true,
          tool: tool.name,
          dimension: tool.dimension,
          executionTime: Date.now() - startTime,
          results: { findings: [], summary: { total: 0 } },
          warnings: ['Semgrep not available'],
          errors: []
        };
      }
      
      // Build Semgrep command
      const command = this.semgrepConfig.buildCommand(tool);
      
      // Execute Semgrep scan
      const result = await this.executor.execute(command, this.semgrepConfig.settings.timeout);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Process Semgrep results
      const processedResults = this.reporter.processResults(result, tool);
      
      this.logger.info(`Semgrep execution completed for ${tool.name} in ${executionTime}ms`);
      
      return {
        success: this.semgrepConfig.determineSuccess(processedResults),
        tool: tool.name,
        dimension: tool.dimension,
        executionTime: executionTime,
        results: processedResults,
        warnings: processedResults.warnings || [],
        errors: processedResults.errors || []
      };
      
    } catch (error) {
      this.logger.error(`Semgrep execution failed for ${tool.name}: ${error.message}`);
      
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
   * Get wrapper capabilities
   */
  getCapabilities() {
    return {
      supportedTools: ['semgrep'],
      supportedDimensions: ['security'],
      fastModeSupported: true,
      parallelExecutionSupported: true,
      reportFormats: ['json', 'console'],
      staticAnalysis: true,
      rulesetSupported: true
    };
  }
}

module.exports = SemgrepWrapper;