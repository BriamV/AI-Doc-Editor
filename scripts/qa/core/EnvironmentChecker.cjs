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

const path = require('path');
const ToolChecker = require('./environment/ToolChecker.cjs');
const EnvironmentValidator = require('./environment/EnvironmentValidator.cjs');
const { getPackageManagerService } = require('./services/PackageManagerService.cjs');
const VenvManager = require('../utils/VenvManager.cjs');
const SharedToolDetectionService = require('./services/SharedToolDetectionService.cjs');

class EnvironmentChecker {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    // Initialize SOLID components
    this.venvManager = new VenvManager(process.cwd(), logger);
    this.toolChecker = new ToolChecker(logger, this.venvManager);
    this.environmentValidator = new EnvironmentValidator(logger);
    
    // Initialize SharedToolDetectionService to eliminate double detection
    this.sharedToolService = new SharedToolDetectionService(this.toolChecker, logger);
    
    // Tool definitions
    this.requiredTools = {
      git: { command: 'git --version', description: 'Git version control system', installUrl: 'https://git-scm.com/downloads', critical: true },
      node: { command: 'node --version', description: 'Node.js runtime', installUrl: 'https://nodejs.org/en/download/', critical: true },
      // npm will be replaced dynamically by detected package manager
      docker: { command: 'docker --version', description: 'Docker containerization platform', installUrl: 'https://docs.docker.com/get-docker/', critical: false }
    };
    
    this.optionalTools = {
      snyk: { command: 'snyk --version', description: 'Snyk security scanner', installUrl: 'https://docs.snyk.io/snyk-cli/install-the-snyk-cli', fallback: 'skip' },
      prettier: { command: 'yarn exec prettier --version', description: 'Prettier code formatter', installUrl: 'lazy:prettier', fallback: 'skip' },
      eslint: { command: 'node node_modules/eslint/bin/eslint.js --version', description: 'ESLint JavaScript linter', installUrl: 'lazy:eslint', fallback: 'skip' },
      jest: { command: 'node -e "console.log(require(\'jest/package.json\').version)"', description: 'Jest JavaScript test runner', installUrl: 'lazy:jest', fallback: 'skip' },
      black: { command: 'black --version', description: 'Black Python formatter', installUrl: 'pip install black', fallback: 'skip' },
      pylint: { command: 'pylint --version', description: 'Pylint Python linter', installUrl: 'pip install pylint', fallback: 'skip' },
      pytest: { command: 'pytest --version', description: 'Pytest Python test runner', installUrl: 'pip install pytest', fallback: 'skip' },
      ruff: { command: 'ruff --version', description: 'Ruff Python linter and formatter', installUrl: 'pip install ruff', fallback: 'skip' },
      tsc: { command: 'yarn exec tsc --version', description: 'TypeScript compiler', installUrl: 'lazy:typescript', fallback: 'skip' },
      pip: { command: 'pip --version', description: 'Python package installer', installUrl: 'https://pip.pypa.io/en/stable/installation/', fallback: 'skip' },
      spectral: { command: 'ls node_modules/@stoplight/spectral-cli/package.json', description: 'OpenAPI/JSON Schema linter', installUrl: 'lazy:@stoplight/spectral-cli', fallback: 'skip' }
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
   * @param {string} mode - execution mode ('fast', 'automatic', etc.)
   * @param {Array<string>} requiredToolNames - specific tools needed for this execution
   */
  async checkEnvironment(mode = 'automatic', requiredToolNames = null) {
    this.logger.info('🔍 Checking environment and dependencies...');
    
    // Initialize package manager service first
    const packageManagerService = getPackageManagerService();
    await packageManagerService.initialize();
    
    // Detect virtual environment for Python tools (but don't activate yet)
    const venvDetected = this.venvManager.detectVirtualEnvironment();
    if (venvDetected) {
      const venvPath = path.relative(process.cwd(), this.venvManager.venvPath);
      this.logger.info(`📦 Virtual environment detected: ${venvPath}`);
    } else {
      this.logger.info('🔍 No virtual environment detected - using system Python');
    }
    
    // Add detected package manager to required tools
    const detectedManager = await packageManagerService.getManager();
    this.requiredTools[detectedManager] = {
      command: `${detectedManager} --version`,
      description: `${detectedManager.charAt(0).toUpperCase() + detectedManager.slice(1)} Package Manager`,
      installUrl: 'https://nodejs.org/en/download/',
      critical: true
    };
    
    try {
      // ARCHITECTURAL FIX: Use SharedToolDetectionService for single detection
      // This eliminates duplicate tool detection in ToolValidator.validateAndFilterTools()
      
      // Separate NPM and Python tools for phased detection (preserve existing logic)
      const npmOptionalTools = {};
      const pythonOptionalTools = {};
      
      Object.entries(this.optionalTools).forEach(([name, config]) => {
        if (['black', 'pylint', 'pytest', 'ruff'].includes(name)) {
          pythonOptionalTools[name] = config;
        } else {
          npmOptionalTools[name] = config;
        }
      });
      
      // Get non-critical required tools
      const optionalRequired = Object.fromEntries(
        Object.entries(this.requiredTools).filter(([, config]) => !config.critical)
      );
      
      // Activate virtual environment for Python tools (preserve existing timing)
      if (venvDetected) {
        const venvActivated = this.venvManager.activateVenv();
        this.logger.info(`🔧 Virtual environment activation: ${venvActivated}`);
      }
      
      // CRITICAL FIX: Only check tools that are actually needed
      let toolsToCheck = { ...optionalRequired, ...npmOptionalTools, ...pythonOptionalTools };
      
      if (requiredToolNames && requiredToolNames.length > 0) {
        // TARGETED MODE: Only check the specific tools needed for this execution
        const targetedTools = {};
        for (const toolName of requiredToolNames) {
          if (this.optionalTools[toolName]) {
            targetedTools[toolName] = this.optionalTools[toolName];
          }
        }
        toolsToCheck = targetedTools;
        this.logger.info(`Targeted mode: Checking only required tools (${Object.keys(targetedTools).length} tools): ${requiredToolNames.join(', ')}`);
      } else if (mode === 'fast') {
        // FALLBACK: Fast mode checks essential tools when no specific tools provided
        const fastModeTools = {
          prettier: this.optionalTools.prettier,
          eslint: this.optionalTools.eslint,
          jest: this.optionalTools.jest,
          black: this.optionalTools.black,
          pytest: this.optionalTools.pytest,
          ruff: this.optionalTools.ruff,
          snyk: this.optionalTools.snyk
        };
        toolsToCheck = fastModeTools;
        this.logger.info(`Fast mode fallback: Checking direct linters for speed (${Object.keys(fastModeTools).length} tools)`);
      } else {
        this.logger.info(`Full mode: Checking all tools (${Object.keys(toolsToCheck).length} tools)`);
      }
      
      // Single detection via SharedService - eliminates duplicate detection later
      const detectionResults = await this.sharedToolService.detectAllTools(this.requiredTools, toolsToCheck);
      
      this.checkResults.critical = detectionResults.critical;
      this.checkResults.optional = detectionResults.optional;
      
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
    
    // Docker recommendation (for container-based development)
    const dockerResult = this.checkResults.optional.get('docker');
    if (!dockerResult?.available) {
      recommendations.push('Install Docker for container-based development workflows');
    }
    
    // Snyk recommendation (PRD RF-007: Standard installation methods)
    const snykResult = this.checkResults.optional.get('snyk');
    if (!snykResult?.available) {
      const snykInstallCmd = await this._getInstallCommand('snyk');
      recommendations.push(`Install Snyk CLI for security scanning capabilities: ${snykInstallCmd} OR npm install -g snyk`);
    }
    
    // TypeScript recommendation
    const tscResult = this.checkResults.optional.get('tsc');
    if (!tscResult?.available) {
      const typescriptInstallCmd = await this._getInstallCommand('typescript');
      recommendations.push(`Install TypeScript for build validation (${typescriptInstallCmd})`);
    }
    
    // Python pip recommendation (PRD RF-007: Standard installation)
    const pipResult = this.checkResults.optional.get('pip');
    if (!pipResult?.available) {
      recommendations.push('Install pip for Python dependency management: https://pip.pypa.io/en/stable/installation/');
    }
    
    // Spectral recommendation
    const spectralResult = this.checkResults.optional.get('spectral');
    if (!spectralResult?.available) {
      const spectralInstallCmd = await this._getInstallCommand('@stoplight/spectral-cli');
      recommendations.push(`Install Spectral for OpenAPI/JSON Schema validation (${spectralInstallCmd})`);
    }
    
    // Environment variables (PRD RF-007: Clear configuration instructions)
    const snykToken = this.checkResults.environment.get('SNYK_TOKEN');
    if (snykResult?.available && !snykToken?.available) {
      recommendations.push('Set SNYK_TOKEN environment variable for authenticated security scans: export SNYK_TOKEN=your_token_here');
    }
    
    
    // Virtual environment recommendations
    const venvInfo = this.venvManager.getVenvInfo();
    if (venvInfo.detected) {
      recommendations.push(`✅ Virtual environment detected at ${venvInfo.path} - Python tools will use isolated environment`);
    } else {
      recommendations.push('Consider creating a Python virtual environment (.venv) for isolated Python tool execution');
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
  
  /**
   * Get virtual environment manager
   */
  getVenvManager() {
    return this.venvManager;
  }
  
  /**
   * Get shared tool detection service (used by ToolValidator)
   */
  getSharedToolService() {
    return this.sharedToolService;
  }
}

module.exports = EnvironmentChecker;