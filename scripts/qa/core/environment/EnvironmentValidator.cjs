/**
 * Environment Validator - Single Responsibility: Environment variables and permissions
 * Extracted from EnvironmentChecker for SOLID compliance
 */

const { promises: fs } = require('fs');
const path = require('path');

class EnvironmentValidator {
  constructor(logger) {
    this.logger = logger;
  }
  
  /**
   * Check environment variables
   */
  async checkEnvironmentVariables() {
    const results = new Map();
    
    const requiredEnvVars = ['NODE_ENV', 'PATH'];
    const optionalEnvVars = ['SNYK_TOKEN', 'MEGALINTER_CONFIG', 'CI'];
    
    // Check required
    for (const envVar of requiredEnvVars) {
      const value = process.env[envVar];
      results.set(envVar, {
        name: envVar,
        value: value ? '[SET]' : '[NOT SET]',
        required: true,
        available: !!value
      });
    }
    
    // Check optional
    for (const envVar of optionalEnvVars) {
      const value = process.env[envVar];
      results.set(envVar, {
        name: envVar,
        value: value ? '[SET]' : '[NOT SET]',
        required: false,
        available: !!value
      });
    }
    
    return results;
  }
  
  /**
   * Check file system permissions
   */
  async checkFileSystemPermissions() {
    const pathsToCheck = [
      process.cwd(),
      path.join(process.cwd(), 'node_modules'),
      path.join(process.cwd(), 'megalinter-reports'),
      path.join(process.cwd(), '.git')
    ];
    
    for (const checkPath of pathsToCheck) {
      try {
        if (await this._pathExists(checkPath)) {
          await fs.access(checkPath, fs.constants.R_OK | fs.constants.W_OK);
          this.logger.info(`✅ Permissions OK: ${checkPath}`);
        }
      } catch (error) {
        this.logger.warn(`🟡 Permission issue: ${checkPath} - ${error.message}`);
      }
    }
  }
  
  /**
   * Check if path exists
   */
  async _pathExists(path) {
    try {
      await fs.access(path);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = EnvironmentValidator;