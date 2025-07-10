/**
 * MegaLinter Wrapper - SOLID Refactored
 * T-06: Lean orchestrator for MegaLinter execution with correct env vars and flags
 * 
 * Orchestrates specialized components:
 * - MegaLinterConfig: Configuration management
 * - MegaLinterExecutor: Command execution
 * - MegaLinterReporter: Result processing and RF-006 formatting
 * 
 * Requirements: RF-003, RF-004, RF-006
 * Dependencies: T-21, T-05
 */

const MegaLinterConfig = require('./megalinter/MegaLinterConfig.cjs');
const MegaLinterExecutor = require('./megalinter/MegaLinterExecutor.cjs');
const MegaLinterReporter = require('./megalinter/MegaLinterReporter.cjs');

class MegaLinterWrapper {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    // Initialize SOLID components
    this.megalinterConfig = new MegaLinterConfig(config);
    this.executor = new MegaLinterExecutor(config, logger);
    this.reporter = new MegaLinterReporter(config, logger);
  }
  
  /**
   * Execute MegaLinter for given tool configuration
   */
  async execute(tool) {
    const startTime = Date.now();
    
    try {
      this.logger.info(`Executing MegaLinter for ${tool.name} (${tool.dimension})`);
      
      // Prepare execution environment
      const envVars = await this._prepareEnvironment(tool);
      const command = await this.executor.buildCommand(tool, this.megalinterConfig);
      const workingDir = await this.executor.prepareWorkingDirectory(tool, this.megalinterConfig);
      
      // Execute MegaLinter
      const execution = await this.executor.execute(command, envVars, workingDir);
      
      // Process results
      const results = await this.reporter.processResults(execution, tool, this.megalinterConfig);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      this.logger.info(`MegaLinter execution completed for ${tool.name} in ${executionTime}ms`);
      
      return {
        success: results.success,
        tool: tool.name,
        dimension: tool.dimension,
        executionTime: executionTime,
        results: results.data,
        reports: results.reports,
        metrics: results.metrics,
        warnings: results.warnings || [],
        errors: results.errors || []
      };
      
    } catch (error) {
      this.logger.error(`MegaLinter execution failed for ${tool.name}: ${error.message}`);
      
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
   * Prepare environment variables for MegaLinter execution
   */
  async _prepareEnvironment(tool) {
    const envVars = { ...this.megalinterConfig.getBaseEnvVars() };
    
    // Apply tool-specific configuration
    Object.assign(envVars, this.megalinterConfig.getToolEnvVars(tool));
    
    // Apply scope-specific configuration
    if (tool.scope && tool.scope !== 'all') {
      envVars.MEGALINTER_FLAVOR = this.megalinterConfig.getScopeFlavor(tool.scope);
    }
    
    // Apply fast mode optimizations
    if (tool.config.mode === 'fast') {
      Object.assign(envVars, this.megalinterConfig.getFastModeConfig());
      
      // Only validate changed files in fast mode
      const changedFiles = await this._getChangedFiles();
      if (changedFiles.length > 0) {
        envVars.FILTER_REGEX_INCLUDE = changedFiles
          .map(file => file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
          .join('|');
      }
    }
    
    // Apply dimension-specific configuration
    Object.assign(envVars, this.megalinterConfig.getDimensionConfig(tool.dimension));
    
    return envVars;
  }
  
  /**
   * Get changed files for fast mode
   */
  async _getChangedFiles() {
    try {
      const { execSync } = require('child_process');
      const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
      return output.trim().split('\n').filter(file => file.length > 0);
    } catch (error) {
      this.logger.warn(`Failed to get changed files: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Get wrapper capabilities
   */
  getCapabilities() {
    return {
      supportedTools: Object.keys(this.megalinterConfig.toolMappings),
      supportedDimensions: ['format', 'lint', 'security'],
      fastModeSupported: true,
      parallelExecutionSupported: true,
      reportFormats: ['json', 'sarif', 'console']
    };
  }
  
  /**
   * Validate tool compatibility
   */
  validateTool(tool) {
    if (!this.megalinterConfig.toolMappings[tool.name]) {
      throw new Error(`Tool ${tool.name} not supported by MegaLinter wrapper`);
    }
    
    const supportedDimensions = ['format', 'lint', 'security'];
    if (!supportedDimensions.includes(tool.dimension)) {
      throw new Error(`Dimension ${tool.dimension} not supported by MegaLinter wrapper`);
    }
    
    return true;
  }
}

module.exports = MegaLinterWrapper;