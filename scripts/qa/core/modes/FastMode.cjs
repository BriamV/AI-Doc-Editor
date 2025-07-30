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
   */
  async selectDimensions(context, options) {
    // RF-005: Fast mode only includes Error Detection (linting/format) + Design Metrics (fast)
    // Migration: Direct linters (ESLint, Prettier, Black, Ruff) instead of MegaLinter
    
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
    const allowedTools = ['eslint', 'prettier', 'black', 'ruff', 'spectral'];
    plan.tools = plan.tools.filter(tool => {
      const isAllowed = allowedTools.includes(tool.name);
      
      if (!isAllowed) {
        this.logger.info(`Fast mode (RF-005): Excluding ${tool.name} - using direct linters for speed`);
      }
      
      return isAllowed;
    });
    
    // Ensure we have essential direct linters for fast mode
    this._ensureEssentialDirectLinters(plan);
    
    return plan;
  }
  
  /**
   * Ensure essential direct linters are present for fast mode
   */
  _ensureEssentialDirectLinters(plan) {
    const essentialLinters = [
      { name: 'prettier', dimension: 'format', scope: 'frontend' },
      { name: 'eslint', dimension: 'lint', scope: 'frontend' },
      { name: 'black', dimension: 'format', scope: 'backend' },
      { name: 'ruff', dimension: 'lint', scope: 'backend' }
    ];
    
    const existingTools = plan.tools.map(tool => tool.name);
    
    for (const linter of essentialLinters) {
      if (!existingTools.includes(linter.name)) {
        this.logger.info(`Fast mode: Adding essential direct linter: ${linter.name}`);
        
        const directLinterTool = {
          name: linter.name,
          dimension: linter.dimension,
          scope: linter.scope,
          config: {
            scope: linter.scope,
            dimension: linter.dimension,
            mode: 'fast',
            args: [],
            fastMode: true,
            timeout: this._getOptimalTimeout({ name: linter.name }),
            stagedFilesOnly: true
          }
        };
        
        plan.tools.push(directLinterTool);
      }
    }
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
}

module.exports = FastMode;