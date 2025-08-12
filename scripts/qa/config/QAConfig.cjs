/**
 * QA Configuration - Dynamic Configuration System
 * T-19: QAConfig & Dynamic Configuration implementation
 * 
 * Loads configurations, thresholds, and DoD mappings
 * Supports dynamic tool configuration at runtime
 */

const fs = require('fs');
const path = require('path');

class QAConfig {
  constructor(configData = {}) {
    this.data = {
      version: '0.1.0',
      system: {
        name: 'QA System',
        description: 'Sistema de Automatización QA para Desarrollo con Agentes IA'
      },
      limits: {
        maxLinesOfCode: 212,
        testCoverageThreshold: 80,
        maxComplexity: 10,
        maxFileSize: '1MB'
      },
      paths: {
        frontend: ['src/**/*.{ts,tsx,js,jsx}'],
        backend: ['backend/**/*.py'],
        infrastructure: ['scripts/**/*.{cjs,sh}', 'tools/**/*.{cjs,sh}'],
        tests: ['src/**/*.test.{ts,tsx}', 'backend/**/*test*.py'],
        docs: ['docs/**/*.md', '*.md']
      },
      tools: {
        format: {
          frontend: ['prettier'],
          backend: ['black'],
          infrastructure: ['prettier'],
          all: ['prettier', 'black']
        },
        lint: {
          frontend: ['eslint'],
          backend: ['ruff'],
          infrastructure: ['eslint'],
          all: ['eslint', 'ruff']
        },
        test: {
          frontend: ['jest'],
          backend: ['pytest'],
          e2e: ['cypress'],
          all: ['jest', 'pytest']
        },
        security: {
          frontend: ['snyk'],
          backend: ['snyk'],
          general: ['semgrep'],
          all: ['snyk', 'semgrep']
        },
        build: {
          frontend: ['tsc', 'vite'],
          backend: ['python', 'pip'],
          all: ['tsc', 'vite', 'python', 'pip']
        },
        data: {
          all: ['spectral']
        }
      },
      modes: {
        fast: {
          description: 'Pre-commit validation mode',
          timeLimit: 10,
          onlyModified: true,
          skipTests: true,
          tools: ['format', 'lint']
        },
        full: {
          description: 'Complete validation mode',
          timeLimit: 300,
          onlyModified: false,
          skipTests: false,
          tools: ['format', 'lint', 'test', 'security', 'build']
        },
        dod: {
          description: 'Definition of Done validation',
          timeLimit: 180,
          onlyModified: true,
          skipTests: false,
          tools: ['format', 'lint', 'test', 'security']
        }
      },
      dodMappings: {
        'code-review': ['format', 'lint', 'security'],
        'testing': ['test', 'coverage'],
        'integration': ['build', 'test', 'security'],
        'deployment': ['build', 'test', 'security', 'audit']
      },
      reporting: {
        console: {
          enabled: true,
          format: 'tree',
          colors: true,
          timestamps: true
        },
        json: {
          enabled: true,
          file: 'qa-report.json',
          includeDetails: true
        }
      },
      ...configData
    };
  }
  
  /**
   * Load configuration from file
   */
  static async load(configPath) {
    try {
      // Default config path
      if (!configPath) {
        configPath = path.join(__dirname, '..', 'qa-config.json');
      }
      
      // Check if file exists
      if (!fs.existsSync(configPath)) {
        console.warn(`Config file not found: ${configPath}, using defaults`);
        return new QAConfig();
      }
      
      // Read and parse config file
      const configContent = await fs.promises.readFile(configPath, 'utf8');
      const configData = JSON.parse(configContent);
      
      return new QAConfig(configData);
      
    } catch (error) {
      console.error(`Failed to load config from ${configPath}: ${error.message}`);
      console.warn('Using default configuration');
      return new QAConfig();
    }
  }
  
  /**
   * Get configuration value by path (dot notation)
   */
  get(keyPath) {
    const keys = keyPath.split('.');
    let current = this.data;
    
    for (const key of keys) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = current[key];
    }
    
    return current;
  }
  
  /**
   * Set configuration value by path (dot notation)
   */
  set(keyPath, value) {
    const keys = keyPath.split('.');
    const lastKey = keys.pop();
    let current = this.data;
    
    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[lastKey] = value;
  }
  
  /**
   * Get tools for specific scope and dimension
   */
  getToolsForScope(scope, dimension) {
    const tools = this.get(`tools.${dimension}.${scope}`);
    return tools || this.get(`tools.${dimension}.general`) || [];
  }
  
  /**
   * Get paths for specific scope
   */
  getPathsForScope(scope) {
    return this.get(`paths.${scope}`) || [];
  }
  
  /**
   * Get mode configuration
   */
  getModeConfig(mode) {
    return this.get(`modes.${mode}`) || this.get('modes.full');
  }
  
  /**
   * Get DoD mapping for specific tag
   */
  getDoDMapping(dodTag) {
    return this.get(`dodMappings.${dodTag}`) || [];
  }
  
  /**
   * Get all available tools for a dimension
   */
  getAvailableTools(dimension) {
    const toolsConfig = this.get(`tools.${dimension}`) || {};
    const allTools = new Set();
    
    Object.values(toolsConfig).forEach(scopeTools => {
      if (Array.isArray(scopeTools)) {
        scopeTools.forEach(tool => allTools.add(tool));
      }
    });
    
    return Array.from(allTools);
  }
  
  /**
   * Validate configuration
   */
  validate() {
    const errors = [];
    
    // Check required fields
    const requiredFields = [
      'version',
      'system.name',
      'limits.maxLinesOfCode',
      'limits.testCoverageThreshold',
      'paths',
      'tools',
      'modes'
    ];
    
    for (const field of requiredFields) {
      if (this.get(field) === undefined) {
        errors.push(`Missing required field: ${field}`);
      }
    }
    
    // Check limits are numbers
    const numericLimits = ['maxLinesOfCode', 'testCoverageThreshold', 'maxComplexity'];
    for (const limit of numericLimits) {
      const value = this.get(`limits.${limit}`);
      if (value !== undefined && typeof value !== 'number') {
        errors.push(`Limit ${limit} must be a number, got: ${typeof value}`);
      }
    }
    
    // Check test coverage threshold is between 0 and 100
    const coverageThreshold = this.get('limits.testCoverageThreshold');
    if (coverageThreshold !== undefined && (coverageThreshold < 0 || coverageThreshold > 100)) {
      errors.push(`Test coverage threshold must be between 0 and 100, got: ${coverageThreshold}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Save configuration to file
   */
  async save(filePath) {
    try {
      const configJson = JSON.stringify(this.data, null, 2);
      await fs.promises.writeFile(filePath, configJson, 'utf8');
      return true;
    } catch (error) {
      console.error(`Failed to save config to ${filePath}: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Merge with another configuration
   */
  merge(otherConfig) {
    if (otherConfig instanceof QAConfig) {
      this.data = this.deepMerge(this.data, otherConfig.data);
    } else if (typeof otherConfig === 'object') {
      this.data = this.deepMerge(this.data, otherConfig);
    }
  }
  
  /**
   * Deep merge two objects
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }
  
  /**
   * Get environment-specific overrides
   */
  getEnvironmentOverrides() {
    const env = process.env.NODE_ENV || 'development';
    const envOverrides = {};
    
    // CI/CD environment adjustments
    if (process.env.CI === 'true') {
      envOverrides.reporting = {
        ...this.get('reporting'),
        console: {
          ...this.get('reporting.console'),
          colors: false // Disable colors in CI
        }
      };
    }
    
    // Development environment adjustments
    if (env === 'development') {
      envOverrides.modes = {
        ...this.get('modes'),
        fast: {
          ...this.get('modes.fast'),
          timeLimit: 15 // More time in development
        }
      };
    }
    
    return envOverrides;
  }
  
  /**
   * Apply environment-specific configuration
   */
  applyEnvironmentOverrides() {
    const overrides = this.getEnvironmentOverrides();
    this.merge(overrides);
  }
  
  /**
   * Get complete configuration data
   */
  getAll() {
    return { ...this.data };
  }
  
  /**
   * Create a copy of the configuration
   */
  clone() {
    return new QAConfig(JSON.parse(JSON.stringify(this.data)));
  }
}

module.exports = QAConfig;