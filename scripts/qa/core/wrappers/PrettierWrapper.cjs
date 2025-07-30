/**
 * Prettier Direct Wrapper - SOLID Compliant
 * SRP: Only Prettier formatting responsibility
 * DIP: Dependencies injected via constructor
 * Performance: Direct execution (no Docker overhead)
 */

const BaseWrapper = require('./BaseWrapper.cjs');
const { ILinterExecutor, ILinterConfig } = require('../interfaces/ILinterWrapper.cjs');
const path = require('path');

class PrettierWrapper extends BaseWrapper {
  constructor(config, logger, processService, fileService) {
    super(config, logger, processService);
    this.fileService = fileService;
  }

  getName() { return 'prettier'; }
  
  async getVersion() {
    const result = await this.processService.execute('prettier', ['--version']);
    return result.stdout.trim();
  }

  getConfigPath() {
    // Prettier config priority: .prettierrc.js, .prettierrc.json, .prettierrc, package.json
    const configFiles = ['.prettierrc.js', '.prettierrc.json', '.prettierrc'];
    for (const file of configFiles) {
      const configPath = path.resolve(file);
      if (this.fileService?.exists && this.fileService.exists(configPath)) {
        return configPath;
      }
    }
    return null;
  }

  async loadConfig() {
    return this.getConfigPath();
  }

  async validateConfig() {
    // Prettier works without config (uses defaults)
    return true;
  }

  async execute(files, options = {}) {
    const startTime = Date.now();
    
    try {
      const args = [
        '--check',  // Check formatting without writing
        '--list-different',  // List files that would be formatted
        ...files
      ];

      const result = await this.processService.execute('prettier', args);
      const violations = this.parsePrettierOutput(result.stdout, result.stderr);
      
      return this.formatResult(
        result.success,
        violations,
        Date.now() - startTime,
        { filesProcessed: files.length, tool: 'prettier' }
      );
    } catch (error) {
      return this.handleExecutionError(error, 'Prettier');
    }
  }

  parsePrettierOutput(stdout, stderr) {
    const violations = [];
    
    // Prettier lists unformatted files in stdout
    if (stdout) {
      const unformattedFiles = stdout.trim().split('\n').filter(line => line);
      unformattedFiles.forEach(file => {
        violations.push({
          file: file,
          line: 1,
          column: 1,
          severity: 'error',
          message: 'File is not formatted according to Prettier rules',
          ruleId: 'prettier/prettier'
        });
      });
    }

    return violations;
  }
}

module.exports = PrettierWrapper;