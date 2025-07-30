/**
 * Wrapper Manager - Refactored with DI+Strategy (Conservative)
 * Single Responsibility: Wrapper loading and management
 * 
 * Conservative refactoring: delegates to 2 specialized classes
 * Maintains exact same API as original 349-line version
 */

const WrapperFactory = require('./WrapperFactory.cjs');
const WrapperRegistry = require('./WrapperRegistry.cjs');

class WrapperManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    // Compose specialized components (DI+Strategy pattern)
    this.factory = new WrapperFactory();
    this.registry = new WrapperRegistry(config, logger);
    
    // Keep deduplication state for API compatibility
    this.deduplicatedTools = null;
  }

  /**
   * Get wrapper for tool (main API method)
   */
  async getWrapper(toolName) {
    // Check cache first
    const cachedWrapper = this.registry.getCachedWrapper(toolName);
    if (cachedWrapper) {
      return cachedWrapper;
    }
    
    // Determine wrapper type using registry strategy
    const wrapperType = await this.registry.getWrapperType(toolName);
    
    // Load wrapper using factory
    const wrapper = await this.factory.loadWrapper(wrapperType, this.config, this.logger);
    
    // Cache the wrapper
    this.registry.cacheWrapper(toolName, wrapper);
    
    return wrapper;
  }

  /**
   * Get wrapper type for tool (delegates to registry)
   */
  async getWrapperType(toolName) {
    return await this.registry.getWrapperType(toolName);
  }

  /**
   * Deduplicate tools to prevent double execution
   */
  _deduplicateTools(tools) {
    const processedTools = [];
    const toolsHandledByWrappers = new Set();
    
    // Identify tools that will be handled by dimension wrappers
    for (const tool of tools) {
      const wrapperType = this.registry.getWrapperType(tool);
      
      // Build wrapper in dimension mode handles multiple tools
      if (wrapperType === 'build' && tool.config && tool.config.dimensionMode) {
        // Build wrapper will handle all build tools, mark them as handled
        const buildTools = ['npm', 'yarn', 'pnpm', 'tsc', 'pip', 'vite'];
        buildTools.forEach(buildTool => toolsHandledByWrappers.add(buildTool));
        processedTools.push(tool);
      } else if (!toolsHandledByWrappers.has(tool.name)) {
        processedTools.push(tool);
      } else {
        this.logger.info(`Deduplicating tool ${tool.name} - already handled by dimension wrapper`);
      }
    }
    
    return processedTools;
  }

  /**
   * Check if tool should be skipped due to deduplication
   */
  async _isToolSkipped(tool) {
    // Dimension tools should never be skipped
    if (tool.config && tool.config.dimensionMode) {
      this.logger.info(`Dimension tool '${tool.name}' will execute (dimension tools never skipped)`);
      return false;
    }
    
    // Skip individual tools that are handled by dimension wrappers in dimension mode
    if (this.deduplicatedTools) {
      const dimensionToolsActive = this.deduplicatedTools.filter(t => 
        t.config && t.config.dimensionMode
      );
      
      if (dimensionToolsActive.length > 0) {
        // Check if this individual tool is covered by any active dimension tool
        for (const dimensionTool of dimensionToolsActive) {
          const isToolCovered = await this._isToolCoveredByDimension(tool.name, dimensionTool.name);
          if (isToolCovered) {
            this.logger.info(`Individual tool '${tool.name}' skipped - covered by dimension tool '${dimensionTool.name}'`);
            return true;
          }
        }
      }
    }
    
    return false;
  }

  /**
   * Check if tool is covered by dimension (delegates to registry)
   */
  async _isToolCoveredByDimension(toolName, dimensionName) {
    // Simple coverage check using wrapper mappings
    const toolWrapper = await this.registry.getWrapperType(toolName);
    const dimensionWrapper = await this.registry.getWrapperType(dimensionName);
    return toolWrapper === dimensionWrapper;
  }

  /**
   * Initialize wrappers for given tools (API compatibility)
   */
  async initializeWrappers(tools) {
    if (!Array.isArray(tools)) {
      throw new Error('Tools must be an array');
    }
    
    // Pre-load and validate all wrappers
    const results = [];
    for (const tool of tools) {
      try {
        // CRITICAL FIX: Use tool.name instead of tool object
        const toolName = typeof tool === 'string' ? tool : tool.name;
        const wrapper = await this.getWrapper(toolName);
        results.push({ tool, wrapper, status: 'initialized' });
      } catch (error) {
        const toolName = typeof tool === 'string' ? tool : tool.name;
        this.logger.warn(`Failed to initialize wrapper for ${toolName}: ${error.message}`);
        results.push({ tool, error: error.message, status: 'failed' });
      }
    }
    
    return results;
  }

  /**
   * Get all initialized wrappers (delegates to registry)
   */
  getInitializedWrappers() {
    return this.registry.getInitializedWrappers();
  }

  /**
   * Clear wrapper cache (delegates to components)
   */
  clearCache() {
    this.registry.clearCache();
    this.deduplicatedTools = null;
    this.logger.info('Wrapper cache cleared');
  }

  /**
   * Register custom wrapper (delegates to factory)
   */
  registerWrapper(wrapperType, wrapperClassFactory) {
    this.factory.registerWrapper(wrapperType, wrapperClassFactory);
  }

  /**
   * Get wrapper mappings (delegates to registry)
   */
  getWrapperMappings() {
    return this.registry.getWrapperMappings();
  }
}

module.exports = WrapperManager;