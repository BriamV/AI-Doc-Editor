/**
 * Wrapper Manager - Single Responsibility: Wrapper loading and management
 * Extracted from WrapperCoordinator for SOLID compliance
 */

class WrapperManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    // Wrapper registry with lazy loading
    this.wrapperRegistry = new Map();
    this.wrapperCache = new Map();
    
    // Wrapper type mappings
    this.wrapperMappings = {
      'prettier': 'megalinter',
      'eslint': 'megalinter',
      'black': 'megalinter',
      'pylint': 'megalinter',
      'snyk': 'snyk',
      'semgrep': 'semgrep',
      'bandit': 'megalinter',
      'jest': 'jest',
      'pytest': 'pytest',
      'tsc': 'build',
      'npm': 'build',
      'pip': 'build',
      'spectral': 'data',
      'django-migrations': 'data',
      'vite': 'native'
    };
  }
  
  /**
   * Initialize wrappers for tools in plan
   */
  async initializeWrappers(tools) {
    // Fix 4.1: Deduplicate tools before wrapper initialization
    const deduplicatedTools = this._deduplicateTools(tools);
    const wrapperTypes = [...new Set(deduplicatedTools.map(tool => this.getWrapperType(tool)))];
    
    for (const wrapperType of wrapperTypes) {
      if (!this.wrapperCache.has(wrapperType)) {
        const wrapper = await this._loadWrapper(wrapperType);
        this.wrapperCache.set(wrapperType, wrapper);
      }
    }
    
    this.logger.info(`Initialized ${wrapperTypes.length} wrapper types`);
    
    // Store deduplicated tools for routing
    this.deduplicatedTools = deduplicatedTools;
  }
  
  /**
   * Get wrapper instance for tool
   */
  getWrapper(tool) {
    // Fix 4.2: Check if tool should be skipped due to deduplication
    if (this._isToolSkipped(tool)) {
      this.logger.info(`Tool ${tool.name} skipped - already handled by dimension wrapper`);
      return null;
    }
    
    const wrapperType = this.getWrapperType(tool);
    const wrapper = this.wrapperCache.get(wrapperType);
    
    if (!wrapper) {
      throw new Error(`Wrapper not found for tool: ${tool.name}`);
    }
    
    return wrapper;
  }
  
  /**
   * Determine wrapper type based on tool
   */
  getWrapperType(tool) {
    return this.wrapperMappings[tool.name] || 'native';
  }
  
  /**
   * Load wrapper instance with lazy initialization
   */
  async _loadWrapper(wrapperType) {
    try {
      let WrapperClass;
      
      switch (wrapperType) {
        case 'megalinter':
          WrapperClass = require('../wrappers/MegaLinterWrapper.cjs');
          break;
        case 'snyk':
          WrapperClass = require('../wrappers/SnykWrapper.cjs');
          break;
        case 'semgrep':
          WrapperClass = require('../wrappers/SemgrepWrapper.cjs');
          break;
        case 'jest':
          WrapperClass = require('../wrappers/JestWrapper.cjs');
          break;
        case 'pytest':
          WrapperClass = require('../wrappers/PytestWrapper.cjs');
          break;
        case 'native':
          WrapperClass = require('../wrappers/NativeWrapper.cjs');
          break;
        case 'build':
          WrapperClass = require('../wrappers/BuildWrapper.cjs');
          break;
        case 'data':
          WrapperClass = require('../wrappers/DataWrapper.cjs');
          break;
        default:
          throw new Error(`Unknown wrapper type: ${wrapperType}`);
      }
      
      const wrapper = new WrapperClass(this.config, this.logger);
      this.logger.info(`Loaded wrapper: ${wrapperType}`);
      return wrapper;
      
    } catch (error) {
      this.logger.error(`Failed to load wrapper ${wrapperType}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get all initialized wrappers
   */
  getInitializedWrappers() {
    return Array.from(this.wrapperCache.keys());
  }
  
  /**
   * Fix 4.1: Deduplicate tools to prevent double execution
   */
  _deduplicateTools(tools) {
    const processedTools = [];
    const toolsHandledByWrappers = new Set();
    
    // Identify tools that will be handled by dimension wrappers
    for (const tool of tools) {
      const wrapperType = this.getWrapperType(tool);
      
      // Fix 4.3: Build wrapper in dimension mode handles multiple tools
      if (wrapperType === 'build' && tool.config && tool.config.dimensionMode) {
        // Build wrapper will handle all build tools, mark them as handled
        const buildTools = ['npm', 'tsc', 'pip', 'vite'];
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
   * Fix 4.2: Check if tool should be skipped due to deduplication
   */
  _isToolSkipped(tool) {
    // Skip tools that are handled by build wrapper in dimension mode
    if (this.deduplicatedTools) {
      const buildToolsInDimensionMode = this.deduplicatedTools.filter(t => 
        this.getWrapperType(t) === 'build' && t.config && t.config.dimensionMode
      );
      
      if (buildToolsInDimensionMode.length > 0) {
        const buildTools = ['npm', 'tsc', 'pip', 'vite'];
        if (buildTools.includes(tool.name) && this.getWrapperType(tool) !== 'build') {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Clear wrapper cache
   */
  clearCache() {
    this.wrapperCache.clear();
    this.deduplicatedTools = null;
    this.logger.info('Wrapper cache cleared');
  }
}

module.exports = WrapperManager;