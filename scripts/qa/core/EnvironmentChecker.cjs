/**
 * Environment & Dependency Checker - SOLID Refactored
 * T-10: Lean orchestrator for environment verification before QA execution
 * 
 * Orchestrates specialized components:
 * - ToolChecker: Tool availability verification
 * - EnvironmentValidator: Environment variables and permissions
 * 
 * Requirements: RF-007
 * Dependencies: T-01
 */

const ToolChecker = require('./environment/ToolChecker.cjs');
const EnvironmentValidator = require('./environment/EnvironmentValidator.cjs');
const { getPackageManagerService } = require('./services/PackageManagerService.cjs');

class EnvironmentChecker {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    // Initialize SOLID components
    this.toolChecker = new ToolChecker(logger);
    this.environmentValidator = new EnvironmentValidator(logger);
    
    // Tool definitions
    this.requiredTools = {
      git: { command: 'git --version', description: 'Git version control system', installUrl: 'https://git-scm.com/downloads', critical: true },
      node: { command: 'node --version', description: 'Node.js runtime', installUrl: 'https://nodejs.org/en/download/', critical: true },
      // npm will be replaced dynamically by detected package manager
      docker: { command: 'docker --version', description: 'Docker containerization platform', installUrl: 'https://docs.docker.com/get-docker/', critical: false }
    };
    
    this.optionalTools = {
      megalinter: { command: 'megalinter --version', description: 'MegaLinter (local installation)', installUrl: 'https://megalinter.github.io/latest/installation/', fallback: 'docker' },
      snyk: { command: 'snyk --version', description: 'Snyk security scanner', installUrl: 'https://docs.snyk.io/snyk-cli/install-the-snyk-cli', fallback: 'skip' },
      prettier: { command: 'npx prettier --version', description: 'Prettier code formatter', installUrl: 'lazy:prettier', fallback: 'megalinter' },
      eslint: { command: 'npx eslint --version', description: 'ESLint JavaScript linter', installUrl: 'lazy:eslint', fallback: 'megalinter' },
      black: { command: 'black --version', description: 'Black Python formatter', installUrl: 'pip install black', fallback: 'megalinter' },
      pylint: { command: 'pylint --version', description: 'Pylint Python linter', installUrl: 'pip install pylint', fallback: 'megalinter' },
      tsc: { command: 'npx tsc --version', description: 'TypeScript compiler', installUrl: 'lazy:typescript', fallback: 'skip' },
      pip: { command: 'pip --version', description: 'Python package installer', installUrl: 'https://pip.pypa.io/en/stable/installation/', fallback: 'skip' },
      spectral: { command: 'npx @stoplight/spectral-cli --version', description: 'OpenAPI/JSON Schema linter', installUrl: 'lazy:@stoplight/spectral-cli', fallback: 'skip' }
    };
    
    this.checkResults = {
      critical: new Map(),
      optional: new Map(),
      environment: new Map(),
      recommendations: []
    };
  }
  
  /**
   * Main environment check - called once at Orchestrator startup
   */
  async checkEnvironment() {
    this.logger.info('🔍 Checking environment and dependencies...');
    
    // Initialize package manager service first
    const packageManagerService = getPackageManagerService();
    await packageManagerService._initialize();
    
    // Add detected package manager to required tools
    const detectedManager = await packageManagerService.getManager();
    this.requiredTools[detectedManager] = {
      command: `${detectedManager} --version`,
      description: `${detectedManager.charAt(0).toUpperCase() + detectedManager.slice(1)} Package Manager`,
      installUrl: 'https://nodejs.org/en/download/',
      critical: true
    };
    
    try {
      // Check critical tools first
      this.checkResults.critical = await this.toolChecker.checkCriticalTools(this.requiredTools);
      
      // Check optional tools
      const optionalRequired = Object.fromEntries(
        Object.entries(this.requiredTools).filter(([, config]) => !config.critical)
      );
      const optionalResults1 = await this.toolChecker.checkTools(optionalRequired);
      const optionalResults2 = await this.toolChecker.checkTools(this.optionalTools);
      this.checkResults.optional = new Map([...optionalResults1, ...optionalResults2]);
      
      // Check environment variables
      this.checkResults.environment = await this.environmentValidator.checkEnvironmentVariables();
      
      // Check file system permissions
      await this.environmentValidator.checkFileSystemPermissions();
      
      // Generate recommendations
      await this._generateRecommendations();
      
      // Report results
      const summary = this._generateSummary();
      this.logger.info('✅ Environment check completed');
      
      return {
        success: true,
        summary: summary,
        details: this.checkResults,
        recommendations: this.checkResults.recommendations
      };
      
    } catch (error) {
      this.logger.error(`❌ Environment check failed: ${error.message}`);
      
      return {
        success: false,
        error: error.message,
        details: this.checkResults,
        recommendations: this.checkResults.recommendations
      };
    }
  }
  
  /**
   * Generate recommendations based on check results (ASYNC)
   */
  async _generateRecommendations() {
    const recommendations = [];
    
    // Docker recommendation
    const dockerResult = this.checkResults.optional.get('docker');
    if (!dockerResult?.available) {
      recommendations.push('Install Docker for optimal MegaLinter performance');
    }
    
    // MegaLinter recommendation
    const megalinterResult = this.checkResults.optional.get('megalinter');
    if (!megalinterResult?.available && dockerResult?.available) {
      recommendations.push('MegaLinter will run via Docker (slower than local installation)');
    }
    
    // Snyk recommendation
    const snykResult = this.checkResults.optional.get('snyk');
    if (!snykResult?.available) {
      recommendations.push('Install Snyk CLI for security scanning capabilities');
    }
    
    // TypeScript recommendation
    const tscResult = this.checkResults.optional.get('tsc');
    if (!tscResult?.available) {
      const typescriptInstallCmd = await this._getInstallCommand('typescript');
      recommendations.push(`Install TypeScript for build validation (${typescriptInstallCmd})`);
    }
    
    // Python pip recommendation
    const pipResult = this.checkResults.optional.get('pip');
    if (!pipResult?.available) {
      recommendations.push('Install pip for Python dependency management');
    }
    
    // Spectral recommendation
    const spectralResult = this.checkResults.optional.get('spectral');
    if (!spectralResult?.available) {
      const spectralInstallCmd = await this._getInstallCommand('@stoplight/spectral-cli');
      recommendations.push(`Install Spectral for OpenAPI/JSON Schema validation (${spectralInstallCmd})`);
    }
    
    // Environment variables
    const snykToken = this.checkResults.environment.get('SNYK_TOKEN');
    if (snykResult?.available && !snykToken?.available) {
      recommendations.push('Set SNYK_TOKEN environment variable for authenticated security scans');
    }
    
    this.checkResults.recommendations = recommendations;
  }
  
  /**
   * Generate environment check summary
   */
  _generateSummary() {
    const criticalCount = this.checkResults.critical.size;
    const criticalAvailable = Array.from(this.checkResults.critical.values())
      .filter(result => result.available).length;
    
    const optionalCount = this.checkResults.optional.size;
    const optionalAvailable = Array.from(this.checkResults.optional.values())
      .filter(result => result.available).length;
    
    return {
      critical: {
        total: criticalCount,
        available: criticalAvailable,
        missing: criticalCount - criticalAvailable
      },
      optional: {
        total: optionalCount,
        available: optionalAvailable,
        missing: optionalCount - optionalAvailable
      },
      recommendations: this.checkResults.recommendations.length,
      status: criticalAvailable === criticalCount ? 'ready' : 'blocked'
    };
  }
  
  /**
   * Get environment check results
   */
  getResults() {
    return {
      critical: Object.fromEntries(this.checkResults.critical),
      optional: Object.fromEntries(this.checkResults.optional),
      environment: Object.fromEntries(this.checkResults.environment),
      recommendations: this.checkResults.recommendations
    };
  }
  
  /**
   * Check if specific tool is available
   */
  isToolAvailable(toolName) {
    const criticalResult = this.checkResults.critical.get(toolName);
    const optionalResult = this.checkResults.optional.get(toolName);
    
    return (criticalResult?.available || optionalResult?.available) || false;
  }
  
  /**
   * Get tool fallback if main tool is not available
   */
  getToolFallback(toolName) {
    const optionalResult = this.checkResults.optional.get(toolName);
    return optionalResult?.fallback || null;
  }
  
  /**
   * Get package manager appropriate install command (ASYNC)
   */
  async _getInstallCommand(packageName) {
    try {
      const service = getPackageManagerService(this.projectRoot, this.logger);
      return await service.getInstallCommandForPackage(packageName);
    } catch (error) {
      this.logger.error(`Failed to get install command for ${packageName}: ${error.message}`);
      // Fallback to npm
      return `npm install --save-dev ${packageName}`;
    }
  }
}

module.exports = EnvironmentChecker;