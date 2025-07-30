/**
 * Tool Mapper - Single Responsibility: Dimension-to-Tool Mapping
 * Extracted from PlanSelector to follow SRP
 */

class ToolMapper {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    // Initialize tool mappings from config
    this._initializeToolMappings();
  }
  
  /**
   * Initialize tool mappings from configuration
   */
  _initializeToolMappings() {
    const tools = this.config.get('tools', {});
    
    // Build dimension mappings from config
    this.dimensionMappings = {};
    this.toolScopeMap = {};
    
    for (const [dimension, scopeTools] of Object.entries(tools)) {
      // Collect all tools for this dimension
      const allTools = new Set();
      
      for (const [scope, toolList] of Object.entries(scopeTools)) {
        if (Array.isArray(toolList)) {
          toolList.forEach(tool => {
            allTools.add(tool);
            
            // Build scope compatibility map
            if (!this.toolScopeMap[tool]) {
              this.toolScopeMap[tool] = [];
            }
            if (!this.toolScopeMap[tool].includes(scope)) {
              this.toolScopeMap[tool].push(scope);
            }
          });
        }
      }
      
      this.dimensionMappings[dimension] = Array.from(allTools);
    }
    
    this.logger.info(`Initialized tool mappings for ${Object.keys(this.dimensionMappings).length} dimensions`);
  }
  
  /**
   * Map dimensions to specific tools based on scope
   */
  mapDimensionsToTools(dimensions, scope, mode = 'automatic') {
    const tools = [];
    const configTools = this.config.get('tools', {});
    
    for (const dimension of dimensions) {
      const dimensionConfig = configTools[dimension];
      if (!dimensionConfig) {
        this.logger.warn(`No tools configured for dimension: ${dimension}`);
        continue;
      }
      
      // MODULAR FIX: In dimension mode, create dimension-level tools instead of individual tools
      if (mode === 'dimension') {
        const dimensionTool = {
          name: dimension,
          dimension: dimension,
          scope: scope,
          config: {
            scope: scope,
            dimension: dimension,
            dimensionMode: true, // Critical: Flag to indicate this represents entire dimension
            timeout: this.config.get(`toolConfig.${dimension}.timeout`, 44000), // OPTIMIZATION: Reduced from 120s to 44s (+25% over 35s baseline)
            args: this._getDimensionArgs(dimension, scope)
          }
        };
        
        tools.push(dimensionTool);
        this.logger.info(`Dimension mode: Created dimension tool '${dimension}' for scope: ${scope}`);
        continue;
      }
      
      // STANDARD MODE: Map to individual tools
      // Get tools for specific scope, fallback to 'all'
      let scopeTools = dimensionConfig[scope] || dimensionConfig['all'] || [];
      
      // Ensure it's an array
      if (!Array.isArray(scopeTools)) {
        scopeTools = [];
      }
      
      for (const tool of scopeTools) {
        const toolConfig = {
          scope: scope,
          dimension: dimension,
          args: this._getToolArgs(tool, dimension, scope),
          timeout: this.config.get(`toolConfig.${tool}.timeout`, 60000)
        };
        
        const toolObj = {
          name: tool,
          dimension: dimension,
          scope: scope,
          config: toolConfig
        };
        
        tools.push(toolObj);
      }
    }
    
    this.logger.info(`Mapped ${dimensions.length} dimensions to ${tools.length} tools for scope: ${scope} (mode: ${mode})`);
    return tools;
  }
  
  /**
   * Get tool-specific arguments
   */
  _getToolArgs(tool, dimension, scope) {
    // PHASE 2 FIX: Robust null/undefined handling
    const toolConfig = this.config.get(`toolConfig.${tool}`, {}) || {};
    const args = (toolConfig && toolConfig.args) ? toolConfig.args : [];
    
    // Ensure args is always an array
    return Array.isArray(args) ? args : [];
  }
  
  /**
   * Get dimension-specific arguments (for dimension mode)
   */
  _getDimensionArgs(dimension, scope) {
    const dimensionConfig = this.config.get(`toolConfig.${dimension}`, {}) || {};
    const args = (dimensionConfig && dimensionConfig.args) ? dimensionConfig.args : [];
    
    // Add scope-specific args if available
    const scopeArgs = this.config.get(`toolConfig.${dimension}.${scope}`, {}) || {};
    const scopeArgsArray = (scopeArgs && scopeArgs.args) ? scopeArgs.args : [];
    
    // Combine dimension and scope args
    const combinedArgs = [...(Array.isArray(args) ? args : []), ...(Array.isArray(scopeArgsArray) ? scopeArgsArray : [])];
    
    return combinedArgs;
  }
  
  /**
   * Check if tool is applicable to scope
   */
  isToolApplicableToScope(tool, scope) {
    const applicableScopes = this.toolScopeMap[tool] || ['all'];
    return applicableScopes.includes(scope) || applicableScopes.includes('all');
  }
  
  /**
   * Get tools for specific dimension
   */
  getToolsForDimension(dimension, scope = 'all') {
    const tools = this.dimensionMappings[dimension] || [];
    return tools.filter(tool => this.isToolApplicableToScope(tool, scope));
  }
  
  /**
   * Get available dimensions for scope
   */
  getAvailableDimensionsForScope(scope) {
    const availableDimensions = [];
    
    for (const [dimension, tools] of Object.entries(this.dimensionMappings)) {
      const hasApplicableTools = tools.some(tool => 
        this.isToolApplicableToScope(tool, scope)
      );
      
      if (hasApplicableTools) {
        availableDimensions.push(dimension);
      }
    }
    
    return availableDimensions;
  }
  
  /**
   * Validate dimension compatibility with scope
   */
  validateDimensionScopeCompatibility(dimensions, scope) {
    const availableDimensions = this.getAvailableDimensionsForScope(scope);
    const incompatible = dimensions.filter(dim => !availableDimensions.includes(dim));
    
    if (incompatible.length > 0) {
      this.logger.warn(`Incompatible dimensions for scope ${scope}: ${incompatible.join(', ')}`);
    }
    
    return {
      compatible: incompatible.length === 0,
      incompatible,
      available: availableDimensions
    };
  }
}

module.exports = ToolMapper;