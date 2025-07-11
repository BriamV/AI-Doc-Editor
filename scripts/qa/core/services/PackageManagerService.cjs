/**
 * PackageManagerService.cjs - Robust Package Manager Detection Service
 * Singleton service with lazy initialization, error handling, and fallbacks
 * Replaces PackageManagerDetector for production-ready auto-detection
 */

const fs = require('fs');
const path = require('path');

class PackageManagerService {
  constructor(projectRoot = process.cwd(), logger = null) {
    this.projectRoot = projectRoot;
    this.logger = logger || { info: () => {}, warn: () => {}, error: () => {} };
    
    // Lazy initialization properties
    this._detectedManager = null;
    this._initialized = false;
    this._initializationError = null;
    this._initializationPromise = null; // Prevent concurrent initialization
    
    // Command cache
    this._commandCache = new Map();
    
    // Configuration
    this.config = {
      detectionPriority: ['yarn', 'pnpm', 'npm'],
      fallbackManager: 'npm',
      enableCache: true,
      validateCommands: true
    };
  }
  
  /**
   * Lazy initialization with robust error handling and concurrency protection
   */
  async _initialize() {
    if (this._initialized) {
      return;
    }
    
    // Prevent concurrent initialization
    if (this._initializationPromise) {
      return await this._initializationPromise;
    }
    
    this._initializationPromise = (async () => {
      try {
        this.logger.info('PackageManagerService: Initializing...');
        this._detectedManager = await this._detectPackageManager();
        this.logger.info(`PackageManagerService: Detected '${this._detectedManager}'`);
        this._initialized = true;
        this._initializationError = null;
      } catch (error) {
        this._initializationError = error;
        this._detectedManager = this.config.fallbackManager;
        this._initialized = true;
        this.logger.warn(`PackageManagerService: Detection failed, using fallback '${this._detectedManager}': ${error.message}`);
      } finally {
        this._initializationPromise = null; // Reset for future calls
      }
    })();
    
    return await this._initializationPromise;
  }
  
  /**
   * Robust package manager detection with fallbacks
   */
  async _detectPackageManager() {
    const lockFileChecks = {
      yarn: 'yarn.lock',
      pnpm: 'pnpm-lock.yaml', 
      npm: 'package-lock.json'
    };
    
    // Check in priority order
    for (const manager of this.config.detectionPriority) {
      const lockFile = lockFileChecks[manager];
      if (lockFile) {
        try {
          const lockFilePath = path.join(this.projectRoot, lockFile);
          await fs.promises.access(lockFilePath, fs.constants.F_OK);
          this.logger.info(`PackageManagerService: Found ${lockFile} -> ${manager}`);
          return manager;
        } catch (error) {
          // File doesn't exist, continue to next
        }
      }
    }
    
    // No lock files found, fallback to npm
    this.logger.info('PackageManagerService: No lock files found, using npm fallback');
    return this.config.fallbackManager;
  }
  
  /**
   * Get detected package manager (lazy initialized)
   */
  async getManager() {
    await this._initialize();
    
    if (this._initializationError) {
      throw new Error(`PackageManagerService initialization failed: ${this._initializationError.message}`);
    }
    
    return this._detectedManager;
  }
  
  /**
   * Get install command with caching and options
   */
  async getInstallCommand(options = {}) {
    const cacheKey = `install_${JSON.stringify(options)}`;
    
    if (this.config.enableCache && this._commandCache.has(cacheKey)) {
      return this._commandCache.get(cacheKey);
    }
    
    try {
      const manager = await this.getManager();
      const { silent = true, preferOffline = true, skipAudit = true } = options;
      
      let command;
      switch (manager) {
        case 'yarn':
          command = this._buildYarnInstallCommand({ silent, preferOffline });
          break;
        case 'pnpm':
          command = this._buildPnpmInstallCommand({ silent, preferOffline });
          break;
        default: // npm
          command = this._buildNpmInstallCommand({ silent, preferOffline, skipAudit });
          break;
      }
      
      if (this.config.enableCache) {
        this._commandCache.set(cacheKey, command);
      }
      
      return command;
    } catch (error) {
      this.logger.error(`PackageManagerService: Failed to get install command: ${error.message}`);
      // Fallback to npm
      return this._buildNpmInstallCommand(options);
    }
  }
  
  /**
   * Get audit command
   */
  async getAuditCommand(level = 'moderate') {
    const cacheKey = `audit_${level}`;
    
    if (this.config.enableCache && this._commandCache.has(cacheKey)) {
      return this._commandCache.get(cacheKey);
    }
    
    try {
      const manager = await this.getManager();
      
      let command;
      switch (manager) {
        case 'yarn':
          command = `yarn audit --level ${level}`;
          break;
        case 'pnpm':
          command = `pnpm audit --audit-level ${level}`;
          break;
        default: // npm
          command = `npm audit --audit-level ${level}`;
          break;
      }
      
      if (this.config.enableCache) {
        this._commandCache.set(cacheKey, command);
      }
      
      return command;
    } catch (error) {
      this.logger.error(`PackageManagerService: Failed to get audit command: ${error.message}`);
      return `npm audit --audit-level ${level}`;
    }
  }
  
  /**
   * Get outdated command
   */
  async getOutdatedCommand() {
    const cacheKey = 'outdated';
    
    if (this.config.enableCache && this._commandCache.has(cacheKey)) {
      return this._commandCache.get(cacheKey);
    }
    
    try {
      const manager = await this.getManager();
      
      let command;
      switch (manager) {
        case 'yarn':
          command = 'yarn outdated';
          break;
        case 'pnpm':
          command = 'pnpm outdated';
          break;
        default: // npm
          command = 'npm outdated';
          break;
      }
      
      if (this.config.enableCache) {
        this._commandCache.set(cacheKey, command);
      }
      
      return command;
    } catch (error) {
      this.logger.error(`PackageManagerService: Failed to get outdated command: ${error.message}`);
      return 'npm outdated';
    }
  }
  
  /**
   * Get valid arguments for package manager commands
   */
  async getValidArgs(action = 'install') {
    try {
      const manager = await this.getManager();
      
      const argRules = {
        yarn: {
          install: ['--prefer-offline', '--silent', '--frozen-lockfile', '--check-files', '--force'],
          audit: ['--level', '--json', '--groups']
        },
        pnpm: {
          install: ['--prefer-offline', '--reporter', '--frozen-lockfile', '--force'],
          audit: ['--audit-level', '--json', '--production']
        },
        npm: {
          install: ['--save', '--save-dev', '--no-save', '--production', '--verbose', '--silent', '--prefer-offline', '--no-audit'],
          audit: ['--audit-level', '--json', '--production']
        }
      };
      
      return argRules[manager]?.[action] || [];
    } catch (error) {
      this.logger.error(`PackageManagerService: Failed to get valid args: ${error.message}`);
      // Fallback to npm args
      const npmArgs = {
        install: ['--save', '--save-dev', '--no-save', '--production', '--verbose', '--silent', '--prefer-offline', '--no-audit'],
        audit: ['--audit-level', '--json', '--production']
      };
      return npmArgs[action] || [];
    }
  }
  
  /**
   * Get optimization args for specific mode
   */
  async getOptimizationArgs(mode = 'automatic') {
    try {
      const manager = await this.getManager();
      
      if (mode === 'fast' || mode === 'dimension') {
        switch (manager) {
          case 'yarn':
            return ['--silent', '--prefer-offline'];
          case 'pnpm':
            return ['--reporter=silent', '--prefer-offline'];
          default: // npm
            return ['--silent', '--prefer-offline', '--no-audit'];
        }
      }
      
      return [];
    } catch (error) {
      this.logger.error(`PackageManagerService: Failed to get optimization args: ${error.message}`);
      return ['--silent', '--prefer-offline', '--no-audit']; // npm fallback
    }
  }
  
  /**
   * Get install command for specific package (used in EnvironmentChecker)
   */
  async getInstallCommandForPackage(packageName) {
    try {
      const manager = await this.getManager();
      
      switch (manager) {
        case 'yarn':
          return `yarn add --dev ${packageName}`;
        case 'pnpm':
          return `pnpm add --save-dev ${packageName}`;
        default: // npm
          return `npm install --save-dev ${packageName}`;
      }
    } catch (error) {
      this.logger.error(`PackageManagerService: Failed to get install command for package: ${error.message}`);
      return `npm install --save-dev ${packageName}`;
    }
  }
  
  /**
   * Check if current project uses specific package manager
   */
  async isUsing(packageManager) {
    try {
      const manager = await this.getManager();
      return manager === packageManager;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get service info for debugging
   */
  async getInfo() {
    try {
      const manager = await this.getManager();
      const lockFiles = {
        yarn: 'yarn.lock',
        pnpm: 'pnpm-lock.yaml',
        npm: 'package-lock.json'
      };
      
      return {
        manager,
        lockFile: lockFiles[manager],
        initialized: this._initialized,
        hasError: !!this._initializationError,
        error: this._initializationError?.message,
        cacheSize: this._commandCache.size
      };
    } catch (error) {
      return {
        manager: 'unknown',
        initialized: false,
        hasError: true,
        error: error.message,
        cacheSize: 0
      };
    }
  }
  
  /**
   * Reset service state (useful for testing)
   */
  reset() {
    this._detectedManager = null;
    this._initialized = false;
    this._initializationError = null;
    this._initializationPromise = null;
    this._commandCache.clear();
  }
  
  /**
   * Clear command cache
   */
  clearCache() {
    this._commandCache.clear();
    this.logger.info('PackageManagerService: Cache cleared');
  }
  
  // Private command builders
  _buildYarnInstallCommand({ silent, preferOffline }) {
    let cmd = 'yarn install';
    if (preferOffline) cmd += ' --prefer-offline';
    if (silent) cmd += ' --silent';
    return cmd;
  }
  
  _buildPnpmInstallCommand({ silent, preferOffline }) {
    let cmd = 'pnpm install';
    if (preferOffline) cmd += ' --prefer-offline';
    if (silent) cmd += ' --reporter=silent';
    return cmd;
  }
  
  _buildNpmInstallCommand({ silent, preferOffline, skipAudit }) {
    let cmd = 'npm install';
    if (preferOffline) cmd += ' --prefer-offline';
    if (skipAudit) cmd += ' --no-audit';
    if (silent) cmd += ' --silent';
    return cmd;
  }
}

// Singleton instance management
let globalService = null;

/**
 * Get global package manager service instance (Singleton)
 */
function getPackageManagerService(projectRoot = process.cwd(), logger = null) {
  if (!globalService || globalService.projectRoot !== projectRoot) {
    globalService = new PackageManagerService(projectRoot, logger);
  }
  return globalService;
}

/**
 * Reset global service (useful for testing)
 */
function resetPackageManagerService() {
  if (globalService) {
    globalService.reset();
  }
  globalService = null;
}

module.exports = {
  PackageManagerService,
  getPackageManagerService,
  resetPackageManagerService
};