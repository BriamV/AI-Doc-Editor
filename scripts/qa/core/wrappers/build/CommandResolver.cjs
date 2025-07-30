/**
 * CommandResolver.cjs - Command Template Resolution and Caching
 * Conservative extraction from BuildConfig.cjs lines 164-237
 * No new functionality added - exact mapping only
 */

const fs = require('fs');
const { getPackageManagerService } = require('../../services/PackageManagerService.cjs');

class CommandResolver {
  constructor(logger) {
    this.logger = logger;
    this._commandCache = new Map();
  }

  /**
   * Resolve command template to actual command (LAZY EVALUATION)
   * CRITICAL FIX RF-003.2: Changed from private to public method
   */
  async resolveCommandTemplate(template, toolName, action) {
    // Check cache first
    const cacheKey = `${toolName}_${action}_${template}`;
    if (this._commandCache.has(cacheKey)) {
      return this._commandCache.get(cacheKey);
    }
    
    let resolvedCommand;
    
    try {
      // Handle package manager templates
      if (template === 'package-manager-install') {
        const service = await this._getPackageManagerService();
        resolvedCommand = await service.getInstallCommand();
      } else if (template === 'package-manager-audit') {
        const service = await this._getPackageManagerService();
        resolvedCommand = await service.getAuditCommand();
      } else if (template === 'package-manager-outdated') {
        const service = await this._getPackageManagerService();
        resolvedCommand = await service.getOutdatedCommand();
      } else {
        // Static template - use as is
        resolvedCommand = template;
      }
      
      // Cache the resolved command
      this._commandCache.set(cacheKey, resolvedCommand);
      
      this.logger.info(`Resolved command for ${toolName}.${action}: ${resolvedCommand}`);
      return resolvedCommand;
      
    } catch (error) {
      this.logger.error(`Failed to resolve command template '${template}' for ${toolName}.${action}: ${error.message}`);
      
      // Fallback logic with PackageManagerService
      if (template.startsWith('package-manager-')) {
        try {
          const packageManagerService = getPackageManagerService();
          await packageManagerService.initialize();
          
          const manager = packageManagerService.getManager();
          const fallbackCommands = {
            'package-manager-install': packageManagerService.getInstallCommand() + ' --prefer-offline --no-audit --silent',
            'package-manager-audit': `${manager} audit --audit-level moderate`,
            'package-manager-outdated': `${manager} outdated`
          };
          resolvedCommand = fallbackCommands[template] || template;
          this.logger.info(`Using package manager command for ${toolName}.${action}: ${resolvedCommand}`);
        } catch (error) {
          // Emergency fallback with intelligent package manager detection
          this.logger.warn(`PackageManagerService failed: ${error.message}`);
          
          const emergencyManager = this._detectEmergencyPackageManager();
          const fallbackCommands = {
            'package-manager-install': `${emergencyManager} install --prefer-offline --silent`,
            'package-manager-audit': `${emergencyManager} audit --audit-level moderate`,
            'package-manager-outdated': `${emergencyManager} outdated`
          };
          
          resolvedCommand = fallbackCommands[template] || template;
          this.logger.warn(`Using emergency ${emergencyManager} fallback for ${toolName}.${action}: ${resolvedCommand}`);
        }
      } else {
        resolvedCommand = template;
      }
      
      // Cache the fallback
      this._commandCache.set(cacheKey, resolvedCommand);
      return resolvedCommand;
    }
  }

  /**
   * Get package manager service (lazy initialization)
   */
  async _getPackageManagerService() {
    const service = getPackageManagerService();
    await service.initialize();
    return service;
  }

  /**
   * Emergency package manager detection when PackageManagerService fails
   * Uses simple file-based detection and system availability checks
   */
  _detectEmergencyPackageManager() {
    try {
      // 1. Check for lock files in current directory (most reliable)
      if (fs.existsSync('yarn.lock')) {
        this.logger.info('Emergency detection: Found yarn.lock, using yarn');
        return 'yarn';
      }
      
      if (fs.existsSync('pnpm-lock.yaml')) {
        this.logger.info('Emergency detection: Found pnpm-lock.yaml, using pnpm');
        return 'pnpm';
      }
      
      if (fs.existsSync('package-lock.json')) {
        this.logger.info('Emergency detection: Found package-lock.json, using npm');
        return 'npm';
      }

      // 2. If no lock files, check what's available in system PATH
      // This is a basic check - in emergency we can't do complex detection
      try {
        require('child_process').execSync('yarn --version', { stdio: 'ignore' });
        this.logger.info('Emergency detection: yarn available in PATH, using yarn');
        return 'yarn';
      } catch (e) {
        // yarn not available
      }

      try {
        require('child_process').execSync('pnpm --version', { stdio: 'ignore' });
        this.logger.info('Emergency detection: pnpm available in PATH, using pnpm');
        return 'pnpm';
      } catch (e) {
        // pnpm not available
      }

      // 3. Final fallback to npm (most universally available)
      this.logger.warn('Emergency detection: No lock files or alternative package managers found, using npm');
      return 'npm';
      
    } catch (error) {
      // If everything fails, use npm as last resort
      this.logger.error(`Emergency package manager detection failed: ${error.message}, using npm`);
      return 'npm';
    }
  }

  /**
   * Clear command cache
   */
  clearCache() {
    this._commandCache.clear();
  }
}

module.exports = CommandResolver;