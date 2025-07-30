/**
 * PackageManagerCache.cjs - Package Manager Cache Service
 * Single Responsibility: Only manage caching for package manager commands
 * Extracted from PackageManagerService.cjs for better modularity (RNF-001: ≤212 lines)
 */

class PackageManagerCache {
  constructor(config = {}) {
    this.config = {
      enableCache: config.enableCache !== false, // enabled by default
      maxSize: config.maxSize || 100,
      ttlMs: config.ttlMs || 300000 // 5 minutes default TTL
    };
    
    // Cache storage with timestamp tracking
    this._cache = new Map();
    this._timestamps = new Map();
  }
  
  /**
   * Get cached value if exists and not expired
   */
  get(key) {
    if (!this.config.enableCache) {
      return null;
    }
    
    if (!this._cache.has(key)) {
      return null;
    }
    
    // Check TTL
    const timestamp = this._timestamps.get(key);
    if (timestamp && Date.now() - timestamp > this.config.ttlMs) {
      this._cache.delete(key);
      this._timestamps.delete(key);
      return null;
    }
    
    return this._cache.get(key);
  }
  
  /**
   * Set cached value with timestamp
   */
  set(key, value) {
    if (!this.config.enableCache) {
      return;
    }
    
    // Check cache size limit
    if (this._cache.size >= this.config.maxSize) {
      this._evictOldest();
    }
    
    this._cache.set(key, value);
    this._timestamps.set(key, Date.now());
  }
  
  /**
   * Check if key exists in cache and is valid
   */
  has(key) {
    return this.get(key) !== null;
  }
  
  /**
   * Delete specific key from cache
   */
  delete(key) {
    this._cache.delete(key);
    this._timestamps.delete(key);
  }
  
  /**
   * Clear entire cache
   */
  clear() {
    this._cache.clear();
    this._timestamps.clear();
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let validCount = 0;
    
    for (const [key, timestamp] of this._timestamps.entries()) {
      if (now - timestamp > this.config.ttlMs) {
        expiredCount++;
      } else {
        validCount++;
      }
    }
    
    return {
      totalSize: this._cache.size,
      validEntries: validCount,
      expiredEntries: expiredCount,
      maxSize: this.config.maxSize,
      ttlMs: this.config.ttlMs,
      enabled: this.config.enableCache
    };
  }
  
  /**
   * Clean expired entries from cache
   */
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];
    
    for (const [key, timestamp] of this._timestamps.entries()) {
      if (now - timestamp > this.config.ttlMs) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      this._cache.delete(key);
      this._timestamps.delete(key);
    }
    
    return keysToDelete.length;
  }
  
  /**
   * Enable/disable cache
   */
  setEnabled(enabled) {
    this.config.enableCache = enabled;
    if (!enabled) {
      this.clear();
    }
  }
  
  /**
   * Update cache configuration
   */
  updateConfig(newConfig) {
    if (newConfig.maxSize && newConfig.maxSize !== this.config.maxSize) {
      this.config.maxSize = newConfig.maxSize;
      // Trim cache if necessary
      while (this._cache.size > this.config.maxSize) {
        this._evictOldest();
      }
    }
    
    if (newConfig.ttlMs !== undefined) {
      this.config.ttlMs = newConfig.ttlMs;
    }
    
    if (newConfig.enableCache !== undefined) {
      this.setEnabled(newConfig.enableCache);
    }
  }
  
  /**
   * Generate cache key for command with options
   */
  static generateKey(command, options = {}) {
    return `${command}_${JSON.stringify(options)}`;
  }
  
  /**
   * Private method to evict oldest entry when cache is full
   */
  _evictOldest() {
    if (this._timestamps.size === 0) {
      return;
    }
    
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, timestamp] of this._timestamps.entries()) {
      if (timestamp < oldestTime) {
        oldestTime = timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this._cache.delete(oldestKey);
      this._timestamps.delete(oldestKey);
    }
  }
  
  /**
   * Get all cache keys (for debugging)
   */
  keys() {
    return Array.from(this._cache.keys());
  }
  
  /**
   * Get cache size
   */
  size() {
    return this._cache.size;
  }
  
  /**
   * Check if cache is empty
   */
  isEmpty() {
    return this._cache.size === 0;
  }
}

module.exports = PackageManagerCache;