/**
 * PackageManagerDetector.cjs - Package Manager Detection Service
 * Single Responsibility: Only detect which package manager is used in project
 * Extracted from PackageManagerService.cjs for better modularity (RNF-001: ≤212 lines)
 */

const fs = require('fs');
const path = require('path');

class PackageManagerDetector {
  constructor(projectRoot = process.cwd(), logger = null) {
    this.projectRoot = projectRoot;
    this.logger = logger || { info: () => {}, warn: () => {}, error: () => {} };
    
    // Detection configuration
    this.config = {
      detectionPriority: ['yarn', 'pnpm', 'npm'],
      fallbackManager: 'npm',
      lockFileMap: {
        yarn: 'yarn.lock',
        pnpm: 'pnpm-lock.yaml',
        npm: 'package-lock.json'
      }
    };
    
    // State for lazy initialization
    this._detectedManager = null;
    this._initialized = false;
    this._initializationError = null;
    this._initializationPromise = null;
  }
  
  /**
   * Lazy initialization with robust error handling and concurrency protection
   */
  async initialize() {
    if (this._initialized) {
      return this._detectedManager;
    }
    
    // Prevent concurrent initialization
    if (this._initializationPromise) {
      return await this._initializationPromise;
    }
    
    this._initializationPromise = this._performDetection();
    return await this._initializationPromise;
  }
  
  /**
   * Internal detection logic
   */
  async _performDetection() {
    try {
      this.logger.info('PackageManagerDetector: Starting detection...');
      this._detectedManager = await this._detectPackageManager();
      this.logger.info(`PackageManagerDetector: Detected '${this._detectedManager}'`);
      this._initialized = true;
      this._initializationError = null;
      return this._detectedManager;
    } catch (error) {
      this._initializationError = error;
      this._detectedManager = this.config.fallbackManager;
      this._initialized = true;
      this.logger.warn(`PackageManagerDetector: Detection failed, using fallback '${this._detectedManager}': ${error.message}`);
      return this._detectedManager;
    } finally {
      this._initializationPromise = null;
    }
  }
  
  /**
   * Core detection algorithm based on lock files
   */
  async _detectPackageManager() {
    // Check in priority order
    for (const manager of this.config.detectionPriority) {
      const lockFile = this.config.lockFileMap[manager];
      if (await this._lockFileExists(lockFile)) {
        this.logger.info(`PackageManagerDetector: Found ${lockFile} -> ${manager}`);
        return manager;
      }
    }
    
    // No lock files found, use fallback
    this.logger.info('PackageManagerDetector: No lock files found, using npm fallback');
    return this.config.fallbackManager;
  }
  
  /**
   * Check if lock file exists
   */
  async _lockFileExists(lockFile) {
    try {
      const lockFilePath = path.join(this.projectRoot, lockFile);
      await fs.promises.access(lockFilePath, fs.constants.F_OK);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get detected package manager (public API)
   */
  async getDetectedManager() {
    await this.initialize();
    
    if (this._initializationError && !this._detectedManager) {
      throw new Error(`PackageManagerDetector initialization failed: ${this._initializationError.message}`);
    }
    
    return this._detectedManager;
  }
  
  /**
   * Check if current project uses specific package manager
   */
  async isUsing(packageManager) {
    try {
      const detected = await this.getDetectedManager();
      return detected === packageManager;
    } catch (error) {
      this.logger.error(`PackageManagerDetector: Error checking manager: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Get detection info for debugging
   */
  async getDetectionInfo() {
    try {
      const manager = await this.getDetectedManager();
      return {
        detectedManager: manager,
        lockFile: this.config.lockFileMap[manager],
        projectRoot: this.projectRoot,
        initialized: this._initialized,
        hasError: !!this._initializationError,
        error: this._initializationError?.message
      };
    } catch (error) {
      return {
        detectedManager: 'unknown',
        projectRoot: this.projectRoot,
        initialized: false,
        hasError: true,
        error: error.message
      };
    }
  }
  
  /**
   * Reset detector state (useful for testing)
   */
  reset() {
    this._detectedManager = null;
    this._initialized = false;
    this._initializationError = null;
    this._initializationPromise = null;
    this.logger.info('PackageManagerDetector: State reset');
  }
  
  /**
   * Validate project structure for package manager detection
   */
  async validateProjectStructure() {
    try {
      // Check if package.json exists
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      await fs.promises.access(packageJsonPath, fs.constants.F_OK);
      
      // Check if node_modules exists (optional)
      const nodeModulesPath = path.join(this.projectRoot, 'node_modules');
      let hasNodeModules = false;
      try {
        await fs.promises.access(nodeModulesPath, fs.constants.F_OK);
        hasNodeModules = true;
      } catch (error) {
        // node_modules not required for validation
      }
      
      return {
        isValid: true,
        hasPackageJson: true,
        hasNodeModules,
        projectRoot: this.projectRoot
      };
    } catch (error) {
      return {
        isValid: false,
        hasPackageJson: false,
        hasNodeModules: false,
        projectRoot: this.projectRoot,
        error: error.message
      };
    }
  }
}

module.exports = PackageManagerDetector;