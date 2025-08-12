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
      // Use --list-different instead of --check since they can't be combined
      const args = [
        '--list-different',  // List files that would be formatted
        ...files
      ];

      const result = await this.processService.execute('prettier', args);
      const violations = this.parsePrettierOutput(result.stdout, result.stderr);
      
      // CRITICAL DEBUG: Log the ProcessService result
      this.logger.info(`🔧 PrettierWrapper: ProcessService returned success=${result.success}, exitCode=${result.exitCode}, stdout length=${result.stdout?.length}, stderr="${result.stderr}"`);
      
      // CRITICAL FIX RF-003: Success determination based on PRD specification
      // "Un solo Error debe hacer que toda la validación falle"
      // Prettier violations are always severity "error" (formatting issues)
      let isSuccess = false;
      
      if (result.exitCode > 1) {
        // Prettier had execution error
        isSuccess = false;
      } else {
        // Prettier executed successfully - check if any violations found
        // All Prettier violations are severity "error", so any violations = failure
        isSuccess = violations.length === 0;
      }
      
      this.logger.debug(`Prettier success determination: exitCode=${result.exitCode}, violations=${violations.length}, isSuccess=${isSuccess}`);
      
      return this.formatResult(
        isSuccess,
        violations,
        Date.now() - startTime,
        { filesProcessed: files.length, tool: 'prettier', exitCode: result.exitCode }
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