/**
 * Pytest Result Builder - Single Responsibility: Result object construction
 * Extracted from PytestWrapper for SOLID compliance
 */

class PytestResultBuilder {
  constructor() {
    // No dependencies - pure result builder
  }
  
  /**
   * Build success result object
   */
  buildSuccess(executionResult, processedResults, tool, executionTime) {
    return {
      success: executionResult.exitCode === 0,
      tool: tool.name,
      dimension: tool.dimension,
      executionTime: executionTime,
      results: processedResults,
      warnings: processedResults.warnings || [],
      errors: processedResults.errors || []
    };
  }
  
  /**
   * Build error result object
   */
  buildError(error, tool, executionTime) {
    return {
      success: false,
      tool: tool.name,
      dimension: tool.dimension,
      error: error.message,
      executionTime: executionTime,
      warnings: [],
      errors: [error.message]
    };
  }
  
  /**
   * Build result based on execution outcome
   */
  build(executionResult, processedResults, tool, executionTime, error = null) {
    if (error) {
      return this.buildError(error, tool, executionTime);
    }
    
    return this.buildSuccess(executionResult, processedResults, tool, executionTime);
  }
}

module.exports = PytestResultBuilder;