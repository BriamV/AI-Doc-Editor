/**
 * Scope Mode Handler - Strategy Pattern
 * RF-005: Validate specific paths or predefined scopes (--scope <path>)
 */

class ScopeMode {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.fullConfig = config.get('modes.full') || {};
  }
  
  /**
   * Select dimensions based on specific scope (RF-005)
   */
  async selectDimensions(context, options) {
    const scope = options.scope;
    
    // RF-005: Determine if scope is a path or predefined scope
    const isPathScope = this._isPathScope(scope);
    
    if (isPathScope) {
      // RF-005: For path scopes, use all dimensions but filter tools later
      const dimensions = this.fullConfig.tools || ['format', 'lint', 'test', 'security', 'build'];
      this.logger.info(`Scope mode (RF-003) path "${scope}": ${dimensions.join(', ')}`);
      return dimensions;
    } else {
      // Predefined scope (frontend|backend|infrastructure)
      let dimensions = this.fullConfig.tools || ['format', 'lint', 'test', 'security', 'build'];
      dimensions = this._filterDimensionsForScope(dimensions, scope);
      this.logger.info(`Scope mode (RF-003) predefined "${scope}": ${dimensions.join(', ')}`);
      return dimensions;
    }
  }
  
  /**
   * Determine if scope is a path or predefined scope (RF-005)
   */
  _isPathScope(scope) {
    // RF-005: Path scopes contain directory separators or file extensions
    return scope && (
      scope.includes('/') || 
      scope.includes('\\') || 
      scope.includes('.') ||
      scope.startsWith('./') ||
      scope.startsWith('../')
    );
  }
  
  /**
   * Filter dimensions based on scope-specific capabilities
   */
  _filterDimensionsForScope(dimensions, scope) {
    const scopeCapabilities = {
      frontend: ['format', 'lint', 'test', 'build', 'security'],
      backend: ['format', 'lint', 'test', 'security'],
      infrastructure: ['format', 'lint', 'security'],
      testing: ['format', 'lint', 'test'],
      docs: ['format', 'lint'],
      all: dimensions // No filtering for 'all'
    };
    
    const allowedDimensions = scopeCapabilities[scope] || scopeCapabilities.all;
    return dimensions.filter(dimension => allowedDimensions.includes(dimension));
  }
  
  /**
   * Get scope-specific file patterns
   */
  getFilesToAnalyze(context, scope) {
    const scopePaths = this.config.getPathsForScope(scope);
    
    if (!scopePaths || scopePaths.length === 0) {
      // Fallback to all modified files
      return context.files?.modified?.all || [];
    }
    
    // Filter modified files by scope patterns
    const modifiedFiles = context.files?.modified?.all || [];
    return modifiedFiles.filter(file => 
      scopePaths.some(pattern => this._matchesPattern(file, pattern))
    );
  }
  
  /**
   * Check if file matches scope pattern
   */
  _matchesPattern(file, pattern) {
    // Simple glob-like matching
    const regex = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\./g, '\\.');
    
    return new RegExp(`^${regex}$`).test(file);
  }
  
  /**
   * Get scope-specific optimization hints
   */
  getScopeOptimizations(scope) {
    const optimizations = {
      frontend: {
        prioritize: ['eslint', 'prettier', 'tsc'],
        parallel: true,
        cacheEnabled: true
      },
      backend: {
        prioritize: ['pylint', 'black', 'pytest'],
        parallel: true,
        cacheEnabled: false // Python tools typically don't cache well
      },
      infrastructure: {
        prioritize: ['shellcheck', 'yamllint'],
        parallel: false, // Infrastructure files often interdependent
        cacheEnabled: true
      },
      testing: {
        prioritize: ['jest', 'pytest'],
        parallel: true,
        cacheEnabled: true
      }
    };
    
    return optimizations[scope] || optimizations.frontend;
  }
  
  /**
   * Get path arguments for tools (RF-005)
   * RF-005: "El Orquestador pasará el <path> proporcionado a cada wrapper de herramienta"
   */
  getPathArgsForTools(scope) {
    if (!this._isPathScope(scope)) {
      return {}; // No path args for predefined scopes
    }
    
    // RF-005: Return path arguments for each tool type
    return {
      jest: [`--testPathPattern=${scope}`],
      pytest: [scope],
      snyk: [`--file=${scope}`],
      eslint: [scope],
      prettier: [scope],
      pylint: [scope],
      black: [scope]
    };
  }
  
  /**
   * Configure tools with scope path (RF-005)
   */
  configureScopeForTools(tools, scope) {
    if (!this._isPathScope(scope)) {
      return tools; // No changes for predefined scopes
    }
    
    const pathArgs = this.getPathArgsForTools(scope);
    
    return tools.map(tool => ({
      ...tool,
      config: {
        ...tool.config,
        scopePath: scope,
        args: [
          ...(tool.config.args || []),
          ...(pathArgs[tool.name] || [])
        ]
      }
    }));
  }
}

module.exports = ScopeMode;