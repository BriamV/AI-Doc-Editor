/**
 * ToolTypeClassifier - Systematic Tool Type Classification
 * Single Responsibility: Classify tools by type instead of hardcoding
 * Open/Closed: Extensible for new tool types without code modification
 * Modular: Uses existing services (PackageManagerService) and configuration
 */

const { getPackageManagerService } = require('../services/PackageManagerService.cjs');

class ToolTypeClassifier {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    // Type classification cache
    this.typeCache = new Map();
    
    // Extensible type definitions via configuration
    this.toolTypePatterns = {
      'compiler': {
        patterns: ['tsc', 'gcc', 'javac', 'rustc'],
        extensions: ['.ts', '.tsx'],
        configFiles: ['tsconfig.json'],
        description: 'Code compilation tools'
      },
      'bundler': {
        patterns: ['vite', 'webpack', 'rollup', 'parcel', 'esbuild'],
        extensions: ['.js', '.ts', '.vue', '.svelte'],
        configFiles: ['vite.config.*', 'webpack.config.*'],
        description: 'Module bundling tools'
      },
      'dependency-manager': {
        patterns: ['pip', 'composer', 'cargo', 'go mod'],
        extensions: ['.py', '.php', '.rs', '.go'],
        configFiles: ['requirements.txt', 'composer.json', 'Cargo.toml', 'go.mod'],
        description: 'Language-specific dependency managers'
      },
      'linter': {
        patterns: ['eslint', 'pylint', 'rubocop', 'clippy'],
        extensions: ['.js', '.ts', '.py', '.rb', '.rs'],
        configFiles: ['.eslintrc.*', 'pylintrc', '.rubocop.yml'],
        description: 'Code quality and style checkers'
      },
      'formatter': {
        patterns: ['prettier', 'black', 'rustfmt', 'gofmt'],
        extensions: ['.*'],
        configFiles: ['.prettierrc.*', 'pyproject.toml'],
        description: 'Code formatting tools'
      },
      'test-runner': {
        patterns: ['jest', 'pytest', 'mocha', 'vitest', 'cargo test'],
        extensions: ['.test.*', '.spec.*'],
        configFiles: ['jest.config.*', 'pytest.ini', 'vitest.config.*'],
        description: 'Test execution frameworks'
      },
      'security-scanner': {
        patterns: ['snyk', 'semgrep', 'bandit', 'safety'],
        extensions: ['.*'],
        configFiles: ['.snyk', '.semgrep.yml'],
        description: 'Security vulnerability scanners'
      }
    };
  }
  
  /**
   * Get tool type with caching and fallback logic
   */
  async getToolType(toolName) {
    // Use cache to avoid repeated classification
    if (this.typeCache.has(toolName)) {
      return this.typeCache.get(toolName);
    }
    
    let toolType;
    
    try {
      // Step 1: Check if it's a package manager (dynamic detection)
      toolType = await this._classifyPackageManager(toolName);
      
      if (!toolType) {
        // Step 2: Classify by patterns and context
        toolType = await this._classifyByPatterns(toolName);
      }
      
      if (!toolType) {
        // Step 3: Fallback to generic classification
        toolType = 'generic';
        this.logger.warn(`ToolTypeClassifier: Unknown tool type for '${toolName}', using generic`);
      }
      
      this.typeCache.set(toolName, toolType);
      this.logger.info(`ToolTypeClassifier: '${toolName}' classified as '${toolType}'`);
      return toolType;
      
    } catch (error) {
      this.logger.error(`ToolTypeClassifier: Classification failed for '${toolName}': ${error.message}`);
      this.typeCache.set(toolName, 'generic');
      return 'generic';
    }
  }
  
  /**
   * Classify package managers using existing PackageManagerService
   */
  async _classifyPackageManager(toolName) {
    try {
      const service = getPackageManagerService();
      const detectedManager = await service.getManager();
      
      // Check if this tool matches detected package manager
      if (toolName === detectedManager) {
        return 'package-manager';
      }
      
      // Check if it's any known package manager
      const knownPackageManagers = ['npm', 'yarn', 'pnpm', 'bun'];
      if (knownPackageManagers.includes(toolName)) {
        return 'package-manager';
      }
      
      return null; // Not a package manager
    } catch (error) {
      return null; // Continue with other classification methods
    }
  }
  
  /**
   * Classify by patterns and project context
   */
  async _classifyByPatterns(toolName) {
    // MODULAR FIX: Classify dimension tools systematically
    const knownDimensions = ['build', 'test', 'lint', 'format', 'security', 'data'];
    if (knownDimensions.includes(toolName)) {
      return 'dimension';
    }
    
    // Direct pattern matching
    for (const [type, definition] of Object.entries(this.toolTypePatterns)) {
      if (definition.patterns.some(pattern => toolName.includes(pattern))) {
        return type;
      }
    }
    
    // Context-based classification (future enhancement)
    // Could analyze project files, package.json dependencies, etc.
    
    return null;
  }
  
  /**
   * Get default action for tool type (systematic approach)
   */
  getDefaultActionForType(toolType) {
    const actionsByType = {
      'package-manager': 'install',
      'compiler': 'check',
      'bundler': 'build',
      'dependency-manager': 'install',
      'linter': 'lint',
      'formatter': 'format',
      'test-runner': 'test',
      'security-scanner': 'scan',
      'dimension': 'validate', // MODULAR FIX: Dimension tools validate entire dimensions
      'generic': 'check'
    };
    
    return actionsByType[toolType] || 'check';
  }
  
  /**
   * Get all supported tool types
   */
  getSupportedTypes() {
    return ['package-manager', ...Object.keys(this.toolTypePatterns), 'generic'];
  }
  
  /**
   * Get tool type definition (for debugging/extension)
   */
  getTypeDefinition(toolType) {
    if (toolType === 'package-manager') {
      return {
        description: 'Package managers for project dependencies',
        dynamicDetection: true,
        service: 'PackageManagerService'
      };
    }
    
    return this.toolTypePatterns[toolType] || null;
  }
  
  /**
   * Clear classification cache
   */
  clearCache() {
    this.typeCache.clear();
    this.logger.info('ToolTypeClassifier: Cache cleared');
  }
  
  /**
   * Add custom tool type (extensibility)
   */
  addToolType(typeName, definition) {
    this.toolTypePatterns[typeName] = definition;
    this.logger.info(`ToolTypeClassifier: Added custom tool type '${typeName}'`);
  }
}

module.exports = ToolTypeClassifier;