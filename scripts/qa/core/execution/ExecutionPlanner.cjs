/**
 * Execution Planner - Single Responsibility: Plan execution strategy
 * Extracted from WrapperCoordinator for SOLID compliance
 */

class ExecutionPlanner {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    // Execution configuration
    this.executionConfig = {
      maxParallelWrappers: config.get('execution.maxParallel', 3),
      defaultTimeout: config.get('execution.defaultTimeout', 300000)
    };
  }
  
  /**
   * Plan execution strategy based on dependencies and parallelization
   */
  planExecutionStrategy(plan) {
    const groups = [];
    const toolsByDimension = this._groupToolsByDimension(plan.tools);
    
    // Define execution order: format → lint → test → security → data → build
    const executionOrder = ['format', 'lint', 'test', 'security', 'data', 'build'];
    
    for (const dimension of executionOrder) {
      const dimensionTools = toolsByDimension[dimension];
      if (dimensionTools && dimensionTools.length > 0) {
        groups.push({
          dimension: dimension,
          tools: dimensionTools,
          parallel: this._canRunInParallel(dimension, plan.mode),
          priority: executionOrder.indexOf(dimension)
        });
      }
    }
    
    this.logger.info(`Planned ${groups.length} execution groups`);
    return groups;
  }
  
  /**
   * Group tools by dimension
   */
  _groupToolsByDimension(tools) {
    const grouped = {};
    
    for (const tool of tools) {
      this.logger.info(`📋 ExecutionPlanner: Processing tool ${tool.name} (dimension: ${tool.dimension})`);
      if (!grouped[tool.dimension]) {
        grouped[tool.dimension] = [];
      }
      grouped[tool.dimension].push(tool);
    }
    
    this.logger.info(`📋 ExecutionPlanner: Grouped ${tools.length} tools into dimensions: ${Object.keys(grouped).join(', ')}`);
    return grouped;
  }
  
  /**
   * Determine if dimension can run in parallel
   */
  _canRunInParallel(dimension, mode) {
    // Fast mode: always try parallel for speed
    if (mode === 'fast') {
      return true;
    }
    
    // Parallel-safe dimensions
    const parallelSafeDimensions = ['format', 'lint'];
    return parallelSafeDimensions.includes(dimension);
  }
  
  /**
   * Calculate optimal batch size for parallel execution
   */
  calculateBatchSize(toolCount) {
    return Math.min(this.executionConfig.maxParallelWrappers, toolCount);
  }
  
  /**
   * Validate execution plan
   */
  validatePlan(plan) {
    if (!plan || !plan.tools || !Array.isArray(plan.tools)) {
      throw new Error('Invalid plan: missing tools array');
    }
    
    // Allow empty plans - system should handle gracefully
    if (plan.tools.length === 0) {
      this.logger.warn('Plan contains no tools - all tools may be unavailable');
      return true; // Allow execution to continue
    }
    
    // Validate each tool configuration
    for (const tool of plan.tools) {
      if (!tool.name || !tool.dimension || !tool.config) {
        throw new Error(`Invalid tool configuration: ${JSON.stringify(tool)}`);
      }
    }
    
    this.logger.info(`Plan validation passed: ${plan.tools.length} tools`);
    return true;
  }
}

module.exports = ExecutionPlanner;