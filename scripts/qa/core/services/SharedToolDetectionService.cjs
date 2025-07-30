/**
 * SharedToolDetectionService - Minimal solution for eliminating double detection
 * Addresses architectural problem: EnvironmentChecker + ToolValidator both detect same tools
 * Simple delegation pattern - no over-engineering
 */

class SharedToolDetectionService {
  constructor(toolChecker, logger) {
    this.toolChecker = toolChecker;  // Reuse existing ToolChecker - NO duplication
    this.logger = logger;
    this.cache = new Map();          // Simple Map cache - no complex TTL
    this.isInitialized = false;
    
    this.logger.debug('SharedToolDetectionService initialized - elimination double detection');
  }

  /**
   * Detect all tools once and cache results
   * Uses existing ToolChecker logic - NO code duplication
   */
  async detectAllTools(requiredTools, optionalTools) {
    if (this.isInitialized) {
      this.logger.debug(`SharedService: returning cached results (${this.cache.size} tools)`);
      return this.cache;  // Return cached results - eliminate second detection
    }
    
    this.logger.debug('SharedService: performing initial tool detection');
    
    // Use existing ToolChecker methods - preserve all existing logic
    const criticalResults = await this.toolChecker.checkCriticalTools(requiredTools);
    const optionalResults = await this.toolChecker.checkTools(optionalTools);
    
    // Combine results
    for (const [toolName, result] of criticalResults) {
      this.cache.set(toolName, result);
    }
    for (const [toolName, result] of optionalResults) {
      this.cache.set(toolName, result);
    }
    
    this.isInitialized = true;
    this.logger.debug(`SharedService: cached ${this.cache.size} tool detection results`);
    
    return { critical: criticalResults, optional: optionalResults };
  }

  /**
   * Check if specific tool is available (used by ToolValidator)
   * Returns cached result - eliminates duplicate detection
   */
  isToolAvailable(toolName) {
    const result = this.cache.get(toolName);
    const available = result?.available || false;
    
    this.logger.debug(`SharedService: ${toolName} availability check from cache: ${available}`);
    return available;
  }

  /**
   * Get cached tool detection results
   */
  getCachedResults() {
    return {
      critical: new Map([...this.cache].filter(([name, result]) => result.critical)),
      optional: new Map([...this.cache].filter(([name, result]) => !result.critical)),
    };
  }

  /**
   * Reset cache (for testing or forced re-detection)
   */
  reset() {
    this.cache.clear();
    this.isInitialized = false;
    this.logger.debug('SharedService: cache reset');
  }
}

module.exports = SharedToolDetectionService;