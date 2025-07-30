/**
 * Ruff Direct Wrapper - SOLID Compliant  
 * SRP: Only Ruff execution responsibility
 * Performance: 10-100x faster than Pylint
 * No Docker overhead - direct binary execution
 */

const BaseWrapper = require('./BaseWrapper.cjs');
const { ILinterExecutor, ILinterConfig } = require('../interfaces/ILinterWrapper.cjs');
const path = require('path');

class RuffWrapper extends BaseWrapper {
  constructor(config, logger, processService, fileService) {
    super(config, logger, processService);
    this.fileService = fileService;
  }

  getName() { return 'ruff'; }
  
  async getVersion() {
    const result = await this.processService.execute('ruff', ['--version']);
    return result.stdout.trim();
  }

  getConfigPath() {
    return path.resolve('pyproject.toml');
  }

  async loadConfig() {
    const configPath = this.getConfigPath();
    return this.fileService?.exists(configPath) !== false ? configPath : null;
  }

  async validateConfig() {
    const configPath = await this.loadConfig();
    return configPath !== null;
  }

  async execute(files, options = {}) {
    const startTime = Date.now();
    
    try {
      const args = [
        'check',
        '--output-format', 'json',
        ...files
      ];

      const result = await this.processService.execute('ruff', args);
      const violations = this.parseRuffOutput(result.stdout || '[]');
      
      // For linters: success means the tool executed correctly, not that no violations were found
      // Ruff returns non-zero exit code when violations exist, but this is normal linter behavior
      const executionSuccess = result.success || (result.stderr === '' && result.stdout !== undefined);
      
      return this.formatResult(
        executionSuccess,
        violations,
        Date.now() - startTime,
        { filesProcessed: files.length, tool: 'ruff' }
      );
    } catch (error) {
      return this.handleExecutionError(error, 'Ruff');
    }
  }

  parseRuffOutput(stdout) {
    try {
      const results = JSON.parse(stdout);
      return results.map(violation => ({
        file: violation.filename,
        line: violation.location.row,
        column: violation.location.column, 
        severity: violation.fix ? 'warning' : 'error',
        message: violation.message,
        ruleId: violation.code
      }));
    } catch (error) {
      this.logger.warn(`Failed to parse Ruff output: ${error.message}`);
      return [];
    }
  }
}

module.exports = RuffWrapper;