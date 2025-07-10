/**
 * MegaLinter Configuration - Single Responsibility: Configuration management
 * Extracted from MegaLinterWrapper for SOLID compliance
 */

class MegaLinterConfig {
  constructor(config) {
    this.config = config;
    
    // Core MegaLinter settings
    this.settings = {
      image: 'oxsecurity/megalinter:latest',
      configFile: '.mega-linter.yml',
      reportFolder: 'megalinter-reports',
      logLevel: 'INFO'
    };
    
    // Tool mappings
    this.toolMappings = {
      prettier: 'PRETTIER',
      eslint: 'ESLINT',
      black: 'BLACK',
      pylint: 'PYLINT',
      bandit: 'BANDIT'
    };
    
    // Flavors by scope
    this.flavors = {
      frontend: 'javascript',
      backend: 'python',
      infrastructure: 'terraform',
      all: 'all'
    };
  }
  
  /**
   * Get base environment variables
   */
  getBaseEnvVars() {
    return {
      MEGALINTER_RUNNER: 'claude-qa-system',
      MEGALINTER_CONFIG: this.settings.configFile,
      MEGALINTER_REPORTS_FOLDER: this.settings.reportFolder,
      LOG_LEVEL: this.settings.logLevel,
      PRINT_ALPACA: 'false',
      PRINT_ALL_FILES: 'false',
      SHOW_ELAPSED_TIME: 'true',
      FILEIO_REPORTER: 'true',
      JSON_REPORTER: 'true',
      SARIF_REPORTER: 'true'
    };
  }
  
  /**
   * Get fast mode configuration
   */
  getFastModeConfig() {
    return {
      VALIDATE_ALL_CODEBASE: 'false',
      FILTER_REGEX_INCLUDE: '',
      DISABLE_LINTERS: '',
      PARALLEL: 'true',
      LOG_LEVEL: 'WARNING'
    };
  }
  
  /**
   * Get tool-specific environment variables
   */
  getToolEnvVars(tool) {
    const toolEnvVar = this.toolMappings[tool.name];
    const envVars = {};
    
    if (toolEnvVar) {
      envVars[`${toolEnvVar}_ARGUMENTS`] = tool.config?.args?.join(' ') || '';
    }
    
    return envVars;
  }
  
  /**
   * Get dimension-specific configuration
   */
  getDimensionConfig(dimension) {
    switch (dimension) {
      case 'format':
        return {
          ENABLE_LINTERS: 'PRETTIER,BLACK',
          DISABLE_ERRORS: 'true'
        };
      case 'lint':
        return {
          ENABLE_LINTERS: 'ESLINT,PYLINT'
        };
      case 'security':
        return {
          ENABLE_LINTERS: 'BANDIT,SEMGREP'
        };
      default:
        return {};
    }
  }
  
  /**
   * Get scope flavor
   */
  getScopeFlavor(scope) {
    return this.flavors[scope] || 'all';
  }
}

module.exports = MegaLinterConfig;