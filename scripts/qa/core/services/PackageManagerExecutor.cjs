/**
 * PackageManagerExecutor.cjs - Package Manager Command Execution Service
 * Single Responsibility: Only generate and validate package manager commands
 * Extracted from PackageManagerService.cjs for better modularity (RNF-001: ≤212 lines)
 */

class PackageManagerExecutor {
  constructor(detector, logger = null) {
    this.detector = detector;
    this.logger = logger || { info: () => {}, warn: () => {}, error: () => {} };
  }
  
  /**
   * Get install command with options
   */
  async getInstallCommand(options = {}) {
    try {
      const manager = await this.detector.getDetectedManager();
      const { silent = true, preferOffline = true, skipAudit = true } = options;
      
      switch (manager) {
        case 'yarn':
          return this._buildYarnInstallCommand({ silent, preferOffline });
        case 'pnpm':
          return this._buildPnpmInstallCommand({ silent, preferOffline });
        default: // npm
          return this._buildNpmInstallCommand({ silent, preferOffline, skipAudit });
      }
    } catch (error) {
      this.logger.error(`PackageManagerExecutor: Failed to get install command: ${error.message}`);
      // Fallback to npm
      return this._buildNpmInstallCommand(options);
    }
  }
  
  /**
   * Get audit command
   */
  async getAuditCommand(level = 'moderate') {
    try {
      const manager = await this.detector.getDetectedManager();
      
      switch (manager) {
        case 'yarn':
          return `yarn audit --level ${level}`;
        case 'pnpm':
          return `pnpm audit --audit-level ${level}`;
        default: // npm
          return `npm audit --audit-level ${level}`;
      }
    } catch (error) {
      this.logger.error(`PackageManagerExecutor: Failed to get audit command: ${error.message}`);
      return `npm audit --audit-level ${level}`;
    }
  }
  
  /**
   * Get outdated command
   */
  async getOutdatedCommand() {
    try {
      const manager = await this.detector.getDetectedManager();
      
      switch (manager) {
        case 'yarn':
          return 'yarn outdated';
        case 'pnpm':
          return 'pnpm outdated';
        default: // npm
          return 'npm outdated';
      }
    } catch (error) {
      this.logger.error(`PackageManagerExecutor: Failed to get outdated command: ${error.message}`);
      return 'npm outdated';
    }
  }
  
  /**
   * Get install command for specific package
   */
  async getInstallCommandForPackage(packageName) {
    try {
      const manager = await this.detector.getDetectedManager();
      
      switch (manager) {
        case 'yarn':
          return `yarn add --dev ${packageName}`;
        case 'pnpm':
          return `pnpm add --save-dev ${packageName}`;
        default: // npm
          return `npm install --save-dev ${packageName}`;
      }
    } catch (error) {
      this.logger.error(`PackageManagerExecutor: Failed to get install command for package: ${error.message}`);
      return `npm install --save-dev ${packageName}`;
    }
  }
  
  /**
   * Get valid arguments for package manager commands
   */
  async getValidArgs(action = 'install') {
    try {
      const manager = await this.detector.getDetectedManager();
      
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
      this.logger.error(`PackageManagerExecutor: Failed to get valid args: ${error.message}`);
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
      const manager = await this.detector.getDetectedManager();
      
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
      this.logger.error(`PackageManagerExecutor: Failed to get optimization args: ${error.message}`);
      return ['--silent', '--prefer-offline', '--no-audit']; // npm fallback
    }
  }
  
  /**
   * Validate command for security (prevent injection)
   */
  validateCommand(command) {
    if (!command || typeof command !== 'string') {
      return { isValid: false, reason: 'Command must be a non-empty string' };
    }
    
    // Basic injection protection
    const dangerousPatterns = [';', '&&', '||', '|', '>', '<', '&', '$', '`'];
    for (const pattern of dangerousPatterns) {
      if (command.includes(pattern)) {
        return { 
          isValid: false, 
          reason: `Command contains potentially dangerous pattern: ${pattern}` 
        };
      }
    }
    
    // Must start with known package manager
    const validStarters = ['npm ', 'yarn ', 'pnpm '];
    const isValidStarter = validStarters.some(starter => command.startsWith(starter));
    
    if (!isValidStarter) {
      return {
        isValid: false,
        reason: 'Command must start with npm, yarn, or pnpm'
      };
    }
    
    return { isValid: true };
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

module.exports = PackageManagerExecutor;