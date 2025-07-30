/**
 * EnvironmentValidator.cjs - Tool Environment Validation
 * Conservative extraction from BuildConfig.cjs lines 240-304
 * No new functionality added - exact mapping only
 */

const path = require('path');
const fs = require('fs').promises;

class EnvironmentValidator {
  constructor(projectRoot, logger) {
    this.projectRoot = projectRoot;
    this.logger = logger;
  }

  /**
   * Validate tool environment and dependencies
   */
  async _validateToolEnvironment(config) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      requiredFiles: [],
      optionalFiles: []
    };
    
    // Check required files
    for (const file of config.requiredFiles) {
      const filePath = path.join(this.projectRoot, file);
      try {
        await fs.access(filePath);
        validation.requiredFiles.push({ file, exists: true, path: filePath });
      } catch (error) {
        validation.isValid = false;
        validation.errors.push(`Required file not found: ${file}`);
        validation.requiredFiles.push({ file, exists: false, path: filePath });
      }
    }
    
    // Check alternative files (at least one from each group must exist)
    if (config.alternativeFiles && config.alternativeFiles.length > 0) {
      validation.alternativeFiles = [];
      for (const fileGroup of config.alternativeFiles) {
        let groupHasValidFile = false;
        const groupValidation = { files: [], hasValidFile: false };
        
        for (const file of fileGroup) {
          const filePath = path.join(this.projectRoot, file);
          try {
            await fs.access(filePath);
            groupValidation.files.push({ file, exists: true, path: filePath });
            groupHasValidFile = true;
          } catch (error) {
            groupValidation.files.push({ file, exists: false, path: filePath });
          }
        }
        
        groupValidation.hasValidFile = groupHasValidFile;
        validation.alternativeFiles.push(groupValidation);
        
        if (!groupHasValidFile) {
          validation.isValid = false;
          validation.errors.push(`None of the required alternative files found: ${fileGroup.join(', ')}`);
        }
      }
    }
    
    // Check optional files
    for (const file of config.optionalFiles || []) {
      const filePath = path.join(this.projectRoot, file);
      try {
        await fs.access(filePath);
        validation.optionalFiles.push({ file, exists: true, path: filePath });
      } catch (error) {
        validation.optionalFiles.push({ file, exists: false, path: filePath });
      }
    }
    
    return validation;
  }

  /**
   * Validate tool environment (public interface)
   */
  async validateEnvironment(config) {
    return await this._validateToolEnvironment(config);
  }
}

module.exports = EnvironmentValidator;