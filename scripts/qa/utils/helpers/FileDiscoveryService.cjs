/**
 * File Discovery Service - Single Responsibility: File discovery and filtering
 * SOLID-Lean refactoring from ExecutionController
 */

class FileDiscoveryService {
  constructor(logger) {
    this.logger = logger;
  }
  
  /**
   * Get files for specific scope
   */
  async getFilesForScope(scope) {
    const fs = require('fs');
    
    // Support 5 scopes as per PRD-QA CLI specification
    const scopePatterns = {
      frontend: {
        dirs: ['src', 'components'],
        patterns: [/\.(js|jsx|ts|tsx)$/]
      },
      backend: {
        dirs: ['backend', 'api', 'server'],
        patterns: [/\.py$/]
      },
      docs: {
        dirs: ['docs', '.'],
        patterns: [/\.md$/],
        maxDepth: 2
      },
      config: {
        dirs: ['.', 'config', '.github'],
        patterns: [/\.(json|yml|yaml)$/],
        maxDepth: 1
      },
      tooling: {
        dirs: ['scripts', 'tools', '.'],
        patterns: [/\.(cjs|sh)$/],
        maxDepth: 2
      },
      all: {
        dirs: ['src', 'components', 'backend', 'api', 'server', 'docs', 'scripts', 'tools', '.'],
        patterns: [/\.(js|jsx|ts|tsx|py|md|json|yml|yaml|cjs|sh)$/],
        maxDepth: 3
      }
    };
    
    const scopeConfig = scopePatterns[scope] || scopePatterns.all;
    const files = [];
    
    // Use actual file discovery with scope-specific patterns
    for (const baseDir of scopeConfig.dirs) {
      for (const pattern of scopeConfig.patterns) {
        files.push(...this.expandPattern(baseDir, pattern, scopeConfig.maxDepth || 3));
      }
    }
    
    // Remove duplicates and non-existent files
    const uniqueFiles = [...new Set(files)].filter(file => {
      try {
        return fs.existsSync(file);
      } catch {
        return false;
      }
    });
    
    this.logger.debug(`Scope ${scope}: Found ${uniqueFiles.length} files`);
    if (uniqueFiles.length > 0) {
      this.logger.debug(`First 5 files: ${uniqueFiles.slice(0, 5).join(', ')}`);
    }
    
    return uniqueFiles.length > 0 ? uniqueFiles : await this.getDefaultFiles();
  }

  /**
   * Get default files for processing
   */
  async getDefaultFiles() {
    const files = [];
    
    // JavaScript/TypeScript files
    files.push(...this.expandPattern('src', /\.(js|jsx|ts|tsx)$/));
    files.push(...this.expandPattern('components', /\.(js|jsx|ts|tsx)$/));
    
    // Python files
    files.push(...this.expandPattern('backend', /\.py$/));
    files.push(...this.expandPattern('api', /\.py$/));
    
    // Configuration files
    files.push(...this.expandPattern('.', /\.(json|yml|yaml)$/, 1));
    
    return files;
  }

  /**
   * Filter files for tool compatibility
   */
  filterFilesForTool(files, tool) {
    const toolPatterns = {
      prettier: /\.(js|jsx|ts|tsx|json|md|css|scss|html|yml|yaml)$/,
      eslint: /\.(js|jsx|ts|tsx|cjs|mjs)$/,
      black: /\.py$/,
      ruff: /\.py$/,
      jest: /\.(js|jsx|ts|tsx|test\.|spec\.)$/,
      snyk: /\.(js|jsx|ts|tsx|py|json)$/
    };

    const pattern = toolPatterns[tool.name] || /\./; // Default: all files with extensions
    return files.filter(file => pattern.test(file) && !file.includes('node_modules'));
  }

  /**
   * Simple file pattern expansion (replaces complex glob dependencies)
   */
  expandPattern(baseDir, pattern, maxDepth = 3) {
    const fs = require('fs');
    const path = require('path');
    const results = [];
    
    const excludedDirs = new Set([
      'node_modules',
      '.venv',
      'venv',
      '__pycache__',
      '.git',
      'dist',
      'build',
      'coverage',
      '.nyc_output',
      'megalinter-reports',
      'qa-reports',
      '.pytest_cache',
      '.coverage',
      'htmlcov',
      '.next',
      '.nuxt',
      'out'
    ]);
    
    const walkDir = (dir, currentDepth = 0) => {
      if (currentDepth > maxDepth) return;
      
      try {
        if (!fs.existsSync(dir)) return;
        
        const items = fs.readdirSync(dir);
        for (const item of items) {
          // Skip excluded directories
          if (excludedDirs.has(item)) {
            continue;
          }
          
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory() && currentDepth < maxDepth) {
            walkDir(fullPath, currentDepth + 1);
          } else if (stat.isFile() && pattern.test(item)) {
            // Normalize Windows paths to use forward slashes
            const normalizedPath = fullPath.replace(/\\/g, '/');
            results.push(normalizedPath);
          }
        }
      } catch (error) {
        // Silently ignore errors (permission issues, etc.)
      }
    };
    
    walkDir(baseDir);
    return results;
  }
  
  /**
   * Get files with multiple criteria
   */
  async getFilesWithCriteria(criteria) {
    const {
      scope,
      patterns,
      excludePatterns = [],
      maxFiles,
      toolCompatibility
    } = criteria;
    
    let files = [];
    
    if (scope) {
      files = await this.getFilesForScope(scope);
    } else {
      files = await this.getDefaultFiles();
    }
    
    // Apply additional patterns if specified
    if (patterns && patterns.length > 0) {
      files = files.filter(file => 
        patterns.some(pattern => pattern.test(file))
      );
    }
    
    // Apply exclusion patterns
    if (excludePatterns.length > 0) {
      files = files.filter(file => 
        !excludePatterns.some(pattern => pattern.test(file))
      );
    }
    
    // Apply tool compatibility filter
    if (toolCompatibility) {
      files = this.filterFilesForTool(files, toolCompatibility);
    }
    
    // Limit number of files if specified
    if (maxFiles && files.length > maxFiles) {
      files = files.slice(0, maxFiles);
      this.logger.debug(`Limited files to ${maxFiles} for performance`);
    }
    
    return files;
  }
}

module.exports = FileDiscoveryService;