/**
 * ESLint Direct Wrapper - SOLID Compliant
 * SRP: Only ESLint execution responsibility
 * ISP: Implements only needed interfaces
 * DIP: Dependencies injected via constructor
 * Performance: Direct execution (no Docker overhead)
 */

const BaseWrapper = require('./BaseWrapper.cjs');
const { ILinterExecutor, ILinterConfig } = require('../interfaces/ILinterWrapper.cjs');
const path = require('path');

class ESLintWrapper extends BaseWrapper {
  constructor(config, logger, processService, fileService) {
    super(config, logger, processService);
    this.fileService = fileService;
  }

  getName() { return 'eslint'; }
  
  async getVersion() {
    const result = await this.processService.execute('eslint', ['--version']);
    return result.stdout.trim();
  }

  // ILinterConfig implementation
  getConfigPath() {
    return path.resolve('eslint.config.js');
  }

  async loadConfig() {
    const configPath = this.getConfigPath();
    return this.fileService?.exists(configPath) !== false ? configPath : null;
  }

  async validateConfig() {
    const configPath = await this.loadConfig();
    return configPath !== null;
  }

  // ILinterExecutor implementation  
  async execute(files, options = {}) {
    const startTime = Date.now();
    
    try {
      // CRITICAL FIX: Filter files to only JavaScript/TypeScript files that ESLint can process
      const jsFiles = files.filter(file => /\.(js|jsx|ts|tsx|cjs|mjs)$/.test(file));
      
      if (jsFiles.length === 0) {
        this.logger.debug('ESLint: No JavaScript/TypeScript files to process');
        return this.formatResult(
          true,  // Success - no files to process
          [],    // No violations
          Date.now() - startTime,
          { filesProcessed: 0, skippedReason: 'No JS/TS files in scope' }
        );
      }

      const args = [
        ...jsFiles,
        '--format', 'json',
        '--max-warnings', '0',  // Treat warnings as errors for consistency
      ];

      // Only add config if it exists
      const configPath = await this.loadConfig();
      if (configPath) {
        args.push('--config', configPath);
      }

      this.logger.debug(`ESLint executing with args: ${args.join(' ')}`);
      const result = await this.processService.execute('eslint', args);
      this.logger.debug(`ESLint result: success=${result.success}, stdout length=${result.stdout?.length || 0}`);
      
      const violations = this.parseESLintOutput(result.stdout || '[]');
      
      return this.formatResult(
        result.success,
        violations,
        Date.now() - startTime,
        { filesProcessed: jsFiles.length }
      );
    } catch (error) {
      return this.handleExecutionError(error, 'ESLint');
    }
  }

  // ESLint-specific parsing (no dead code - only what's needed)
  parseESLintOutput(stdout) {
    try {
      if (!stdout || stdout.trim() === '') {
        this.logger.debug('ESLint: Empty output, no violations found');
        return [];
      }
      
      const results = JSON.parse(stdout);
      return results.flatMap(file => 
        file.messages.map(msg => ({
          file: file.filePath,
          line: msg.line,
          column: msg.column,
          severity: msg.severity === 2 ? 'error' : 'warning',
          message: msg.message,
          ruleId: msg.ruleId
        }))
      );
    } catch (error) {
      this.logger.warn(`Failed to parse ESLint output: ${error.message}`);
      this.logger.debug(`ESLint stdout was: ${stdout.substring(0, 200)}...`);
      return [];
    }
  }
}

module.exports = ESLintWrapper;