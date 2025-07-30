/**
 * PackageManagerService.cjs - Coordinating Service for Package Manager Operations
 * Refactored: Now coordinates Detector + Executor + Cache (SRP compliance)
 * Reduced from 414 to ~120 lines by extracting responsibilities
 */

const PackageManagerDetector = require('./PackageManagerDetector.cjs');
const PackageManagerExecutor = require('./PackageManagerExecutor.cjs');
const PackageManagerCache = require('./PackageManagerCache.cjs');

class PackageManagerService {
  constructor(projectRoot = process.cwd(), logger = null, cacheConfig = {}) {
    this.projectRoot = projectRoot;
    this.logger = logger || { info: () => {}, warn: () => {}, error: () => {} };
    
    // Compose services following Single Responsibility Principle
    this.detector = new PackageManagerDetector(projectRoot, logger);
    this.executor = new PackageManagerExecutor(this.detector, logger);
    this.cache = new PackageManagerCache(cacheConfig);
  }
  
  /**
   * Initialize the service (delegates to detector)
   */
  async initialize() {
    return await this.detector.initialize();
  }
  
  /**
   * Get detected package manager (delegates to detector)
   */
  async getManager() {
    return await this.detector.getDetectedManager();
  }
  
  /**
   * Get install command with caching (delegates to executor + cache)
   */
  async getInstallCommand(options = {}) {
    const cacheKey = this.cache.constructor.generateKey('install', options);
    
    let command = this.cache.get(cacheKey);
    if (command) {
      return command;
    }
    
    command = await this.executor.getInstallCommand(options);
    this.cache.set(cacheKey, command);
    
    return command;
  }
  
  /**
   * Get audit command with caching (delegates to executor + cache)
   */
  async getAuditCommand(level = 'moderate') {
    const cacheKey = this.cache.constructor.generateKey('audit', { level });
    
    let command = this.cache.get(cacheKey);
    if (command) {
      return command;
    }
    
    command = await this.executor.getAuditCommand(level);
    this.cache.set(cacheKey, command);
    
    return command;
  }
  
  /**
   * Get outdated command with caching (delegates to executor + cache)
   */
  async getOutdatedCommand() {
    const cacheKey = this.cache.constructor.generateKey('outdated', {});
    
    let command = this.cache.get(cacheKey);
    if (command) {
      return command;
    }
    
    command = await this.executor.getOutdatedCommand();
    this.cache.set(cacheKey, command);
    
    return command;
  }
  
  /**
   * Get valid arguments for package manager commands (delegates to executor)
   */
  async getValidArgs(action = 'install') {
    return await this.executor.getValidArgs(action);
  }
  
  /**
   * Get optimization args for specific mode (delegates to executor)
   */
  async getOptimizationArgs(mode = 'automatic') {
    return await this.executor.getOptimizationArgs(mode);
  }
  
  /**
   * Get install command for specific package (delegates to executor)
   */
  async getInstallCommandForPackage(packageName) {
    return await this.executor.getInstallCommandForPackage(packageName);
  }
  
  /**
   * Check if current project uses specific package manager (delegates to detector)
   */
  async isUsing(packageManager) {
    return await this.detector.isUsing(packageManager);
  }
  
  /**
   * Get service info for debugging (aggregates from all services)
   */
  async getInfo() {
    try {
      const detectionInfo = await this.detector.getDetectionInfo();
      const cacheStats = this.cache.getStats();
      
      return {
        detector: detectionInfo,
        cache: cacheStats,
        projectRoot: this.projectRoot
      };
    } catch (error) {
      return {
        detector: { error: error.message },
        cache: { error: 'Cache unavailable' },
        projectRoot: this.projectRoot
      };
    }
  }
  
  /**
   * Reset service state (delegates to all services)
   * MODERATE ISSUE FIX RF-003.4: Enhanced reset with selective cache invalidation
   */
  reset() {
    this.detector.reset();
    this.cache.clear();
  }
  
  /**
   * MODERATE ISSUE FIX RF-003.4: Selective cache invalidation
   * Only invalidate cache for specific package manager operations
   */
  invalidateCache(operation = null) {
    if (operation) {
      // Selective invalidation for specific operations
      const keysToRemove = [];
      for (const [key, value] of this.cache.cache || new Map()) {
        if (key.includes(operation)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        if (this.cache.cache && this.cache.cache.delete) {
          this.cache.cache.delete(key);
        }
      });
      
      this.logger.info(`PackageManagerService: Invalidated cache for operation: ${operation}`);
    } else {
      // Full cache invalidation
      this.cache.clear();
      this.logger.info('PackageManagerService: Full cache invalidation');
    }
  }
  
  /**
   * Clear command cache (delegates to cache service)
   * MODERATE ISSUE FIX RF-003.4: Enhanced cache clearing with statistics
   */
  clearCache() {
    const cacheStats = this.cache.getStats();
    this.cache.clear();
    this.logger.info(`PackageManagerService: Cache cleared (was: ${cacheStats.size} entries, ${cacheStats.hitRate}% hit rate)`);
  }
  
  /**
   * Validate project structure (delegates to detector)
   */
  async validateProjectStructure() {
    return await this.detector.validateProjectStructure();
  }
  
  /**
   * Get cache statistics (delegates to cache)
   */
  getCacheStats() {
    return this.cache.getStats();
  }
  
  /**
   * Clean expired cache entries (delegates to cache)
   */
  cleanupCache() {
    return this.cache.cleanup();
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
 * MODERATE ISSUE FIX RF-003.4: Enhanced reset with performance logging
 */
function resetPackageManagerService() {
  if (globalService) {
    const cacheStats = globalService.getCacheStats();
    globalService.reset();
    
    // Log cache performance before reset
    if (cacheStats.size > 0) {
      console.log(`[CACHE_PERFORMANCE] PackageManagerService reset - Cache had ${cacheStats.size} entries, ${cacheStats.hitRate}% hit rate`);
    }
  }
  globalService = null;
}

/**
 * MODERATE ISSUE FIX RF-003.4: Smart cache invalidation helper
 * Invalidates cache when package.json or requirements.txt changes
 */
function invalidatePackageManagerCache(trigger = 'manual') {
  if (globalService) {
    if (trigger === 'package.json') {
      globalService.invalidateCache('install');
      globalService.invalidateCache('audit');
    } else if (trigger === 'requirements.txt') {
      globalService.invalidateCache('install');
    } else {
      globalService.clearCache();
    }
  }
}

module.exports = {
  PackageManagerService,
  getPackageManagerService,
  resetPackageManagerService,
  invalidatePackageManagerCache
};