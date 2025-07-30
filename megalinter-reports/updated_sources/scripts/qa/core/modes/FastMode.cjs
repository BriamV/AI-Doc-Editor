/**
 * Fast Mode Handler - Strategy Pattern
 * RF-005: Fast mode + T-07 absorbed logic
 * Optimized for pre-commit hooks (<10s execution)
 */

class FastMode {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.fastConfig = config.get('modes.fast') || {};
  }
  
  /**
   * Select minimal dimensions for fast execution (RF-005)
   * Fast mode ONLY executes MegaLinter for Error Detection + Design Metrics
   */
  async selectDimensions(context, options) {
    // RF-005: Fast mode only includes Error Detection (linting/format) + Design Metrics (fast)
    // Implementation: Only invoke MegaLinter wrapper, no Snyk/Jest/Pytest/Build
    
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
    // This translates to MegaLinter execution only
    const dimensions = ['format', 'lint']; // MegaLinter handles both
    
    this.logger.info(`Fast mode (RF-005): Error Detection + Design Metrics via MegaLinter only`);
    this.logger.info(`Excluded: Testing & Coverage, Security & Audit, Build validations`);
    
    return dimensions;
  }
  
  /**
   * Apply fast mode optimizations to plan (RF-005)
   * Configure MegaLinter for optimized speed with staged files only
   */
  applyOptimizations(plan) {
    // RF-005: Fast mode should only have MegaLinter execution
    plan.tools = plan.tools.map(tool => {
      const optimizedTool = {
        ...tool,
        config: {
          ...(tool.config || {}),
          args: (tool.config?.args || []), // Preserve args array
          fastMode: true,
          timeout: this._getOptimalTimeout(tool), // RF-005: Tool-specific timeouts
        }
      };
      
      // RF-005: Configure MegaLinter with speed optimizations
      if (tool.name === 'megalinter') {
        optimizedTool.config.env = {
          ...optimizedTool.config.env,
          VALIDATE_ONLY_CHANGED_FILES: 'true',
          DISABLE_LINTERS: 'SPELL_CSPELL,COPYPASTE_JSCPD', // Disable slow linters
          LOG_LEVEL: 'WARNING', // Reduce log verbosity
          MEGALINTER_CONFIG: '.megalinter-fast.yml'
        };
        optimizedTool.config.stagedFilesOnly = true;
      }
      
      return optimizedTool;
    });
    
    // RF-005: Fast mode should ONLY execute MegaLinter - no individual tools
    plan.tools = plan.tools.filter(tool => {
      const isAllowed = tool.name === 'megalinter';
      
      if (!isAllowed) {
        this.logger.info(`Fast mode (RF-005): Excluding ${tool.name} - only MegaLinter allowed`);
      }
      
      return isAllowed;
    });
    
    // RF-005: If no MegaLinter tool exists, create one
    if (plan.tools.length === 0) {
      this.logger.info('Fast mode (RF-005): Adding MegaLinter tool for Error Detection + Design Metrics');
      const megalinterTool = {
        name: 'megalinter',
        dimension: 'format', // Primary dimension for MegaLinter in fast mode
        scope: plan.scope || 'all',
        config: {
          scope: plan.scope || 'all',
          dimension: 'format',
          mode: 'fast',
          args: [],
          fastMode: true,
          timeout: this._getOptimalTimeout({ name: 'megalinter' }), // Use tool-specific timeout
          env: {
            VALIDATE_ONLY_CHANGED_FILES: 'true',
            DISABLE_LINTERS: 'SPELL_CSPELL,COPYPASTE_JSCPD',
            LOG_LEVEL: 'WARNING',
            MEGALINTER_CONFIG: '.megalinter-fast.yml'
          },
          stagedFilesOnly: true
        }
      };
      plan.tools.push(megalinterTool);
    }
    
    return plan;
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
   * Get files to analyze based on fast mode config (RF-005)
   * Fast mode ONLY analyzes staged files (git diff --cached)
   */
  getFilesToAnalyze(context) {
    // RF-005: Fast mode focuses on staged files, ignores deleted files
    const stagedFiles = context.files?.modified?.staged || [];
    
    // Filter out deleted files as per RF-005 specification
    const nonDeletedStaged = stagedFiles.filter(file => 
      file.status !== 'deleted' && file.status !== 'D'
    );
    
    this.logger.info(`Fast mode (RF-005): Analyzing ${nonDeletedStaged.length} staged files (excluding deleted)`);
    
    return nonDeletedStaged;
  }

  /**
   * Get optimal timeout for tool in fast mode
   * Balance between speed and tool execution requirements
   */
  _getOptimalTimeout(tool) {
    // Tool-specific timeout configuration for fast mode
    const timeouts = {
      // Heavy analysis tools - need more time even in fast mode
      'megalinter': 360000,    // 6 minutes (MegaLinter with Docker)
      'snyk': 120000,         // 2 minutes (security scanning)
      'semgrep': 90000,       // 1.5 minutes (SAST analysis)
      
      // Build tools - moderate time
      'jest': 60000,          // 1 minute (test execution)
      'pytest': 60000,        // 1 minute (Python tests)
      
      // Fast formatting/linting tools
      'prettier': 30000,      // 30 seconds
      'eslint': 30000,        // 30 seconds  
      'pylint': 45000,        // 45 seconds
      'black': 30000,         // 30 seconds
      'tsc': 45000,           // 45 seconds (TypeScript compilation)
    };

    // Return tool-specific timeout or default fast mode timeout
    return timeouts[tool.name] || 30000; // Default: 30s for unknown tools
  }
}

module.exports = FastMode;