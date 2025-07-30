/**
 * WrapperRegistry.cjs - Wrapper Instance Registry and Caching
 * Conservative extraction from WrapperManager.cjs lines 16-42 + caching logic
 * No new functionality added - exact mapping only
 */

const ToolTypeClassifier = require('../tools/ToolTypeClassifier.cjs');

class WrapperRegistry {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    // Modular component for systematic tool classification
    this.toolTypeClassifier = new ToolTypeClassifier(config, logger);
    
    // Wrapper registry with lazy loading
    this.wrapperRegistry = new Map();
    this.wrapperCache = new Map();
    
    // Base wrapper type mappings (tools → wrappers)
    this.baseWrapperMappings = {
      'prettier': 'direct-linters',
      'eslint': 'direct-linters',
      'black': 'direct-linters',
      'ruff': 'direct-linters',
      'spectral': 'direct-linters',
      'snyk': 'snyk',
      'semgrep': 'semgrep',
      'jest': 'jest',
      'pytest': 'pytest',
      'tsc': 'build',
      'npm': 'build',
      'pip': 'build',
      'vite': 'build',  // Critical Fix: vite should use build wrapper consistently
      'spectral': 'data',
      'django-migrations': 'data'
    };
    
    // SYSTEMATIC FIX: Build complete mappings including dimension tools
    this.wrapperMappings = this._buildSystematicMappings();
  }

  /**
   * SYSTEMATIC FIX: Build complete wrapper mappings including dimension tools
   * Avoids hardcoding by deriving dimension mappings from existing tool mappings
   */
  _buildSystematicMappings() {
    const completeMappings = { ...this.baseWrapperMappings };
    
    // Add dimension-level fallbacks by analyzing tool patterns
    const dimensionMappings = {
      'format': 'direct-linters',  // Direct Prettier + Black execution
      'lint': 'direct-linters',    // Direct ESLint + Ruff execution
      'test': 'jest',         // Default testing wrapper
      'security': 'snyk',     // Default security wrapper
      'build': 'build',       // Build operations
      'data': 'data'          // Data operations
    };
    
    return { ...completeMappings, ...dimensionMappings };
  }

  /**
   * Register a wrapper instance
   */
  registerWrapper(toolName, wrapper) {
    this.wrapperRegistry.set(toolName, wrapper);
    this.logger.debug(`Registered wrapper for tool: ${toolName}`);
  }

  /**
   * Get cached wrapper instance
   */
  getCachedWrapper(toolName) {
    return this.wrapperCache.get(toolName);
  }

  /**
   * Cache wrapper instance
   */
  cacheWrapper(toolName, wrapper) {
    this.wrapperCache.set(toolName, wrapper);
    this.logger.debug(`Cached wrapper for tool: ${toolName}`);
  }

  /**
   * Get wrapper type for tool (strategy pattern)
   */
  async getWrapperType(toolName) {
    // 1. Check direct mapping first
    if (this.wrapperMappings[toolName]) {
      return this.wrapperMappings[toolName];
    }
    
    // 2. Use ToolTypeClassifier for systematic resolution
    try {
      const toolType = await this.toolTypeClassifier.getToolType(toolName);
      
      // Map tool types to wrapper types
      const typeToWrapperMapping = {
        'linter': 'direct-linters',
        'formatter': 'direct-linters',
        'security-scanner': 'snyk',
        'test-runner': 'jest',
        'build-tool': 'build',
        'package-manager': 'build',
        'compiler': 'build',
        'bundler': 'build'
      };
      
      const wrapperType = typeToWrapperMapping[toolType];
      if (wrapperType) {
        this.logger.info(`Mapped tool '${toolName}' (type: ${toolType}) to wrapper: ${wrapperType}`);
        // Cache the mapping for future use
        this.wrapperMappings[toolName] = wrapperType;
        return wrapperType;
      }
    } catch (error) {
      this.logger.debug(`Could not classify tool '${toolName}': ${error.message}`);
    }
    
    // 3. Fallback to native wrapper
    this.logger.warn(`No specific wrapper found for tool '${toolName}', using native wrapper`);
    return 'native';
  }

  /**
   * Get all initialized wrappers
   */
  getInitializedWrappers() {
    return Array.from(this.wrapperCache.keys());
  }

  /**
   * Clear wrapper cache
   */
  clearCache() {
    this.wrapperCache.clear();
    this.wrapperRegistry.clear();
    this.logger.info('WrapperRegistry: Cache cleared');
  }

  /**
   * Get wrapper mappings (for debugging)
   */
  getWrapperMappings() {
    return { ...this.wrapperMappings };
  }
}

module.exports = WrapperRegistry;