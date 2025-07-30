/**
 * Spectral Direct Wrapper - SOLID Compliant
 * SRP: Only OpenAPI/AsyncAPI linting responsibility
 * DIP: Dependencies injected via constructor
 * Performance: Direct execution (no Docker overhead)
 */

const BaseWrapper = require('./BaseWrapper.cjs');
const { ILinterExecutor, ILinterConfig } = require('../interfaces/ILinterWrapper.cjs');
const path = require('path');

class SpectralWrapper extends BaseWrapper {
  constructor(config, logger, processService, fileService) {
    super(config, logger, processService);
    this.fileService = fileService;
  }

  getName() { return 'spectral'; }
  
  async getVersion() {
    const result = await this.processService.execute('spectral', ['--version']);
    return result.stdout.trim();
  }

  getConfigPath() {
    return path.resolve('.spectral.yml');
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
        'lint',
        '--format', 'json',
        ...files
      ];

      const result = await this.processService.execute('spectral', args);
      const violations = this.parseSpectralOutput(result.stdout || '[]');
      
      return this.formatResult(
        result.success,
        violations,
        Date.now() - startTime,
        { filesProcessed: files.length, tool: 'spectral' }
      );
    } catch (error) {
      return this.handleExecutionError(error, 'Spectral');
    }
  }

  parseSpectralOutput(stdout) {
    try {
      const results = JSON.parse(stdout);
      return results.map(violation => ({
        file: violation.source,
        line: violation.range?.start?.line || 1,
        column: violation.range?.start?.character || 1,
        severity: violation.severity === 0 ? 'error' : 'warning',
        message: violation.message,
        ruleId: violation.code
      }));
    } catch (error) {
      this.logger.warn(`Failed to parse Spectral output: ${error.message}`);
      return [];
    }
  }
}

module.exports = SpectralWrapper;