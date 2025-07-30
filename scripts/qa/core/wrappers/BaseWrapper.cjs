/**
 * BaseWrapper - SOLID Base Implementation
 * SRP: Single responsibility - Common wrapper functionality
 * DIP: Depends on abstractions (injected dependencies)
 * No dead code - Only shared functionality
 */

const { IBaseLinterWrapper } = require('../interfaces/ILinterWrapper.cjs');

class BaseWrapper extends IBaseLinterWrapper {
  constructor(config, logger, processService) {
    super();
    this.config = config;
    this.logger = logger;
    this.processService = processService;
  }

  // Common availability check (reusable across wrappers)
  async isAvailable() {
    try {
      const result = await this.processService.execute(this.getName(), ['--version']);
      return result.success;
    } catch (error) {
      this.logger.warn(`${this.getName()} not available: ${error.message}`);
      return false;
    }
  }

  // Common error handling (DRY principle)
  handleExecutionError(error, toolName) {
    this.logger.error(`${toolName} execution failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
      violations: [],
      executionTime: 0
    };
  }

  // Common result formatting (reusable)
  formatResult(success, violations, executionTime, metadata = {}) {
    return {
      success,
      violations,
      executionTime,
      metadata,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = BaseWrapper;