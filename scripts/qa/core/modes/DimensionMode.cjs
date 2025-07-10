/**
 * Dimension Mode Handler - Strategy Pattern
 * Executes only the specific dimension requested via --dimension flag
 */

class DimensionMode {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }
  
  /**
   * Select only the specific dimension requested
   */
  async selectDimensions(context, options) {
    const requestedDimension = options.dimension;
    
    if (!requestedDimension) {
      this.logger.warn('Dimension mode requires --dimension parameter');
      return [];
    }
    
    // Validate dimension exists
    const availableDimensions = ['format', 'lint', 'test', 'security', 'build', 'data'];
    if (!availableDimensions.includes(requestedDimension)) {
      this.logger.warn(`Unknown dimension: ${requestedDimension}. Available: ${availableDimensions.join(', ')}`);
      return [];
    }
    
    this.logger.info(`Dimension mode: Executing only '${requestedDimension}' dimension`);
    
    return [requestedDimension];
  }
  
  /**
   * Apply dimension mode optimizations to plan
   */
  applyOptimizations(plan) {
    // No additional optimizations needed for dimension mode
    // The dimension selection already filters the tools
    return plan;
  }
}

module.exports = DimensionMode;