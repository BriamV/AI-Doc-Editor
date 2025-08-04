/**
 * Fast Mode Handler - Strategy Pattern
 * RF-005: Fast mode + T-07 absorbed logic
 * Optimized for pre-commit hooks (<5s execution) using direct linters
 * Migration: FROM MegaLinter TO Direct Linters for performance
 */

class FastMode {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.fastConfig = config.get('modes.fast') || {};
  }
  
  /**
   * Select minimal dimensions for fast execution (RF-005)
   * Fast mode uses direct linters for Error Detection + Design Metrics (<5s target)
   * FIXED: Respect explicit --dimension argument override
   */
  async selectDimensions(context, options) {
    // CRITICAL FIX: If user specifies --dimension, respect that instead of fast mode defaults
    if (options.dimension) {
      this.logger.info(`Fast mode: Respecting explicit dimension override: ${options.dimension}`);
      
      // Validate the dimension is supported
      const supportedDimensions = ['format', 'lint', 'test', 'security', 'build', 'data'];
      if (!supportedDimensions.includes(options.dimension)) {
        this.logger.warn(`Unsupported dimension: ${options.dimension}, falling back to fast mode defaults`);
        return this._getDefaultFastDimensions(context);
      }
      
      return [options.dimension];
    }
    
    // RF-005: Fast mode only includes Error Detection (linting/format) + Design Metrics (fast)
    // Migration: Direct linters (ESLint, Prettier, Black, Ruff) instead of MegaLinter
    return this._getDefaultFastDimensions(context);
  }
  
  /**
   * Get default dimensions for fast mode when no explicit override
   */
  _getDefaultFastDimensions(context) {
    // SYSTEMATIC FIX: Fast mode should validate modified files, not just staged
    // PRD RNF-002: Fast mode targets modified files for pre-commit scenarios
    const hasModifiedOrStagedFiles = this._hasModifiedOrStagedFiles(context);
    
    if (!hasModifiedOrStagedFiles) {
      this.logger.info('Fast mode: No modified or staged files detected, executing basic validation');
      // Allow basic validation even without changes for CI/CD scenarios
    } else {
      this.logger.info(`Fast mode: Processing ${hasModifiedOrStagedFiles.type} files for validation`);
    }
    
    // RF-005 specification: Only Error Detection + Design Metrics (fast)
    // Migration: Direct linters replace MegaLinter for <5s performance
    const dimensions = ['format', 'lint']; // Direct linters handle both
    
    this.logger.info(`Fast mode (RF-005): Error Detection + Design Metrics via direct linters`);
    this.logger.info(`Target: <5s execution with ESLint, Prettier, Black, Ruff`);
    this.logger.info(`Excluded: Testing & Coverage, Security & Audit, Build validations`);
    
    return dimensions;
  }
  
  /**
   * Apply fast mode optimizations to plan (RF-005)
   * Configure direct linters for optimized speed with staged files only
   * FIXED: Pass plan scope to _ensureEssentialDirectLinters
   */
  applyOptimizations(plan) {
    // Migration: Use direct linters for <5s performance target
    plan.tools = plan.tools.map(tool => {
      const optimizedTool = {
        ...tool,
        config: {
          ...(tool.config || {}),
          args: (tool.config?.args || []), // Preserve args array
          fastMode: true,
          timeout: this._getOptimalTimeout(tool), // RF-005: Tool-specific timeouts
          stagedFilesOnly: true, // Only process modified/staged files
        }
      };
      
      // Configure specific direct linters for fast mode
      if (tool.name === 'eslint') {
        optimizedTool.config.args.push('--cache'); // Use ESLint cache for speed
        optimizedTool.config.args.push('--ext', '.js,.jsx,.ts,.tsx'); // Limit extensions
      }
      
      if (tool.name === 'prettier') {
        optimizedTool.config.args.push('--cache'); // Use Prettier cache
        optimizedTool.config.args.push('--ignore-unknown'); // Skip unknown files
      }
      
      if (tool.name === 'black') {
        optimizedTool.config.args.push('--fast'); // Use Black fast mode
        optimizedTool.config.args.push('--quiet'); // Reduce verbosity
      }
      
      if (tool.name === 'ruff') {
        optimizedTool.config.args.push('--fix'); // Auto-fix for speed
        optimizedTool.config.args.push('--quiet'); // Reduce verbosity
      }
      
      return optimizedTool;
    });
    
    // RF-005: Fast mode should use direct linters (ESLint, Prettier, Black, Ruff)
    // FIXED: Filter tools based on scope compatibility, not just tool names
    // DIMENSION OVERRIDE FIX: Allow dimension-specific tools when explicitly requested
    const actualScope = plan.scope || 'all';
    const hasSecurityDimension = plan.tools.some(tool => tool.dimension === 'security');
    const hasTestDimension = plan.tools.some(tool => tool.dimension === 'test');
    const hasBuildDimension = plan.tools.some(tool => tool.dimension === 'build');
    
    plan.tools = plan.tools.filter(tool => {
      const baseAllowedTools = ['eslint', 'prettier', 'black', 'ruff', 'spectral'];
      const securityTools = ['snyk', 'semgrep'];
      const testTools = ['jest', 'pytest'];
      const buildTools = ['yarn', 'npm', 'tsc', 'vite', 'webpack'];
      
      // Allow dimension-specific tools if dimension is present (explicit override)
      const isAllowed = baseAllowedTools.includes(tool.name) || 
                       (hasSecurityDimension && securityTools.includes(tool.name)) ||
                       (hasTestDimension && testTools.includes(tool.name)) ||
                       (hasBuildDimension && buildTools.includes(tool.name));
      
      const isRelevantForScope = this._isToolRelevantForScope(tool.name, actualScope);
      
      if (!isAllowed) {
        this.logger.info(`Fast mode (RF-005): Excluding ${tool.name} - using direct linters for speed`);
        return false;
      }
      
      if (!isRelevantForScope) {
        this.logger.info(`Fast mode: Excluding ${tool.name} - not relevant for scope: ${actualScope}`);
        return false;
      }
      
      return true;
    });
    
    // Ensure we have essential direct linters for fast mode
    this._ensureEssentialDirectLinters(plan);
    
    return plan;
  }
  
  /**
   * Ensure essential direct linters are present for fast mode
   * CRITICAL FIX: Respect explicit dimension constraints from user
   */
  _ensureEssentialDirectLinters(plan) {
    // SURGICAL FIX: Check for explicit dimension constraint from CLI options
    // If user specified --dimension, respect ONLY that dimension
    const explicitDimension = this._getExplicitDimension();
    
    if (explicitDimension) {
      this.logger.info(`Fast mode: Respecting explicit dimension constraint '${explicitDimension}' - not adding cross-dimension tools`);
      return; // Do not add any tools outside the requested dimension
    }
    
    // Legacy check for existing tools (fallback)
    const existingDimensions = [...new Set(plan.tools.map(tool => tool.dimension))];
    const hasExplicitDimensionConstraint = existingDimensions.length === 1 && plan.options && plan.options.dimension;
    
    if (hasExplicitDimensionConstraint) {
      this.logger.info(`Fast mode: Respecting existing dimension constraint '${plan.options.dimension}' - not adding cross-dimension tools`);
      return; // Do not add any tools outside the requested dimension
    }
    
    // Get the actual scope from plan or existing tools
    const actualScope = plan.scope || (plan.tools.length > 0 ? plan.tools[0].scope : 'all');
    
    // Define tools by their primary technology, but respect the user's chosen scope
    const availableLinters = {
      'prettier': { dimension: 'format', technology: 'frontend' },
      'eslint': { dimension: 'lint', technology: 'frontend' },
      'black': { dimension: 'format', technology: 'backend' },
      'ruff': { dimension: 'lint', technology: 'backend' }
    };
    
    const existingTools = plan.tools.map(tool => tool.name);
    
    // Only add tools that are relevant to the selected scope AND allowed dimensions
    for (const [linterName, linterInfo] of Object.entries(availableLinters)) {
      const isToolMissing = !existingTools.includes(linterName);
      const isRelevantForScope = this._isToolRelevantForScope(linterName, actualScope);
      const isDimensionAllowed = existingDimensions.length === 0 || existingDimensions.includes(linterInfo.dimension);
      
      if (isToolMissing && isRelevantForScope && isDimensionAllowed) {
        this.logger.info(`Fast mode: Adding essential direct linter: ${linterName}`);
        
        const directLinterTool = {
          name: linterName,
          dimension: linterInfo.dimension,
          scope: actualScope, // FIXED: Use actual scope, not hardcoded scope
          config: {
            scope: actualScope, // FIXED: Use actual scope, not hardcoded scope
            dimension: linterInfo.dimension,
            mode: 'fast',
            args: [],
            fastMode: true,
            timeout: this._getOptimalTimeout({ name: linterName }),
            stagedFilesOnly: true
          }
        };
        
        plan.tools.push(directLinterTool);
      }
    }
  }
  
  /**
   * Check if a tool is relevant for the selected scope
   * FIXED: Implement proper scope-to-tool mapping logic
   */
  _isToolRelevantForScope(toolName, scope) {
    // Scope-to-tool compatibility mapping
    const scopeCompatibility = {
      'frontend': ['prettier', 'eslint', 'snyk', 'jest', 'yarn', 'npm', 'tsc', 'vite', 'webpack'],
      'backend': ['black', 'ruff', 'pytest'],
      'tooling': ['prettier', 'eslint'], // Tooling uses JS/TS tools for .cjs/.sh files
      'docs': ['prettier'],
      'config': ['prettier'],
      'infrastructure': ['prettier', 'eslint'],
      'all': ['prettier', 'eslint', 'black', 'ruff', 'snyk', 'jest', 'pytest', 'yarn', 'npm', 'tsc', 'vite', 'webpack']
    };
    
    const compatibleTools = scopeCompatibility[scope] || scopeCompatibility['all'];
    return compatibleTools.includes(toolName);
  }
  
  /**
   * SYSTEMATIC FIX: Check for modified OR staged files (holistic approach)
   * Supports both pre-commit (staged) and CI/CD (modified) scenarios
   */
  _hasModifiedOrStagedFiles(context) {
    const stagedFiles = context.files?.modified?.staged?.length || 0;
    const modifiedFiles = context.files?.modified?.all?.length || 0;
    const unstagedFiles = context.files?.modified?.unstaged?.length || 0;
    
    if (stagedFiles > 0) {
      return { type: 'staged', count: stagedFiles };
    }
    
    if (unstagedFiles > 0) {
      return { type: 'unstaged', count: unstagedFiles };
    }
    
    if (modifiedFiles > 0) {
      return { type: 'modified', count: modifiedFiles };
    }
    
    return false;
  }
  
  /**
   * DEPRECATED: Check if there are no staged changes (RF-005: git diff --cached)
   * Kept for backward compatibility
   */
  _hasNoStagedChanges(context) {
    // RF-005: Fast mode focuses on staged files (git diff --cached)
    return (context.files?.modified?.staged?.length || 0) === 0;
  }
  
  /**
   * Check if changes are minimal (small scope)
   */
  _isMinimalChange(context) {
    const total = context.files?.summary?.total || 0;
    const threshold = this.fastConfig.minimalChangeThreshold || 3;
    return total <= threshold;
  }
  
  /**
   * Check if only staging files should be analyzed
   */
  shouldOnlyAnalyzeStaged(context) {
    return this.fastConfig.onlyModified && context.files?.modified?.staged?.length > 0;
  }
  
  /**
   * REMOVED: File analysis delegated to ScopeMode to avoid architectural duplication
   * Fast mode focuses on dimension selection and optimizations only
   */

  /**
   * Get optimal timeout for tool in fast mode
   * Direct linters optimized for <5s total execution time
   */
  _getOptimalTimeout(tool) {
    // Direct linter timeout configuration for <5s total target
    const timeouts = {
      // Direct linters - optimized for speed (<2s each)
      'prettier': 15000,      // 15 seconds (with cache)
      'eslint': 20000,        // 20 seconds (with cache)  
      'black': 10000,         // 10 seconds (fast mode)
      'ruff': 10000,          // 10 seconds (fastest Python linter)
      'spectral': 15000,      // 15 seconds (OpenAPI linting)
      
      // Fallback for other tools (not used in fast mode)
      'snyk': 120000,         // 2 minutes (security scanning)
      'jest': 60000,          // 1 minute (test execution)
      'pytest': 60000,        // 1 minute (Python tests)
      'tsc': 45000,           // 45 seconds (TypeScript compilation)
    };

    // Return tool-specific timeout or default fast mode timeout
    return timeouts[tool.name] || 15000; // Default: 15s for unknown tools
  }
  
  /**
   * Get explicit dimension from CLI options
   * SURGICAL FIX: Access global CLI options to check for --dimension flag
   */
  _getExplicitDimension() {
    // Check global process.argv for --dimension flag
    const args = process.argv;
    const dimensionIndex = args.findIndex(arg => arg === '--dimension');
    
    if (dimensionIndex !== -1 && dimensionIndex < args.length - 1) {
      const dimension = args[dimensionIndex + 1];
      this.logger.debug(`Detected explicit dimension from CLI: ${dimension}`);
      return dimension;
    }
    
    // Check for --dimension=value format
    const dimensionArg = args.find(arg => arg.startsWith('--dimension='));
    if (dimensionArg) {
      const dimension = dimensionArg.split('=')[1];
      this.logger.debug(`Detected explicit dimension from CLI (equals format): ${dimension}`);
      return dimension;
    }
    
    return null;
  }
}

module.exports = FastMode;