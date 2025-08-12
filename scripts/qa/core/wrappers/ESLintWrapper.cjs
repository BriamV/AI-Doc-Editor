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

      // CRITICAL FIX: Let ESLint find its config automatically to avoid path issues
      // Only add config if it exists
      // const configPath = await this.loadConfig();
      // if (configPath) {
      //   args.push('--config', configPath);
      // }

      this.logger.debug(`ESLint executing with args: ${args.join(' ')}`);
      const result = await this.processService.execute('eslint', args);
      this.logger.info(`🔧 ESLintWrapper: ProcessService returned success=${result.success}, exitCode=${result.exitCode}, stdout length=${result.stdout?.length || 0}, stderr="${result.stderr}"`);
      this.logger.debug(`ESLint result: success=${result.success}, exitCode=${result.exitCode}, stdout length=${result.stdout?.length || 0}`);
      
      const violations = this.parseESLintOutput(result.stdout || '[]');
      
      // CRITICAL FIX RF-003: Success determination based on PRD specification
      // "Un solo Error debe hacer que toda la validación falle"
      // Only consider success if ESLint executed AND no severity "error" violations found
      let isSuccess = false;
      
      if (result.exitCode > 1) {
        // ESLint had execution error (config issues, etc.)
        isSuccess = false;
      } else if (!Array.isArray(violations)) {
        // Parsing failed
        isSuccess = false;
      } else {
        // ESLint executed successfully - check violation severity
        const hasErrorViolations = violations.some(v => v.severity === 'error');
        isSuccess = !hasErrorViolations; // Success only if no error-level violations
      }
      
      this.logger.debug(`ESLint success determination: exitCode=${result.exitCode}, violations=${violations.length}, hasErrors=${violations.some(v => v.severity === 'error')}, isSuccess=${isSuccess}`);
      
      return this.formatResult(
        isSuccess,
        violations,
        Date.now() - startTime,
        { filesProcessed: jsFiles.length, exitCode: result.exitCode }
      );
    } catch (error) {
      return this.handleExecutionError(error, 'ESLint');
    }
  }

  // ESLint-specific parsing with Design Metrics semaphore classification
  parseESLintOutput(stdout) {
    try {
      if (!stdout || stdout.trim() === '') {
        this.logger.debug('ESLint: Empty output, no violations found');
        return [];
      }
      
      const results = JSON.parse(stdout);
      const violations = results.flatMap(file => 
        file.messages.map(msg => {
          const violation = {
            file: file.filePath,
            line: msg.line,
            column: msg.column,
            severity: msg.severity === 2 ? 'error' : 'warning',
            message: msg.message,
            ruleId: msg.ruleId
          };
          
          // Add Design Metrics semaphore classification
          const designMetrics = this.classifyDesignMetricsViolation(msg);
          if (designMetrics) {
            violation.designMetrics = designMetrics;
          }
          
          return violation;
        })
      );
      
      return violations;
    } catch (error) {
      this.logger.warn(`Failed to parse ESLint output: ${error.message}`);
      this.logger.debug(`ESLint stdout was: ${stdout.substring(0, 200)}...`);
      return [];
    }
  }

  // Design Metrics semaphore classification (RF-003 requirements)
  classifyDesignMetricsViolation(message) {
    const designMetricsRules = {
      'complexity': { 
        metric: 'cyclomaticComplexity',
        green: 10, 
        yellow: 15, 
        thresholds: '🟢≤10, 🟡11-15, 🔴>15'
      },
      'max-lines': { 
        metric: 'linesOfCode',
        green: 212, 
        yellow: 300,
        thresholds: '🟢≤212, 🟡213-300, 🔴>300'
      },
      'max-len': { 
        metric: 'lineLength',
        green: 100,
        thresholds: '🟢≤100, 🔴>100 (strict limit)'
      }
    };
    
    const rule = designMetricsRules[message.ruleId];
    if (!rule) return null;
    
    // Extract numeric value from message
    const value = this.extractMetricValue(message.message, message.ruleId);
    if (value === null) return null;
    
    // Classify based on thresholds
    let classification, semaphore;
    if (value <= rule.green) {
      classification = 'green';
      semaphore = '🟢';
    } else if (rule.yellow && value <= rule.yellow) {
      classification = 'yellow';
      semaphore = '🟡';
    } else {
      classification = 'red';
      semaphore = '🔴';
    }
    
    return {
      metric: rule.metric,
      value: value,
      classification: classification,
      semaphore: semaphore,
      thresholds: rule.thresholds
    };
  }

  // Extract numeric value from ESLint error messages
  extractMetricValue(message, ruleId) {
    try {
      switch (ruleId) {
        case 'complexity':
          // "Function 'myFunc' has a complexity of 12. Maximum allowed is 10."
          const complexityMatch = message.match(/complexity of (\d+)/);
          return complexityMatch ? parseInt(complexityMatch[1]) : null;
          
        case 'max-lines':
          // "File has 250 lines. Maximum allowed is 212."
          const linesMatch = message.match(/has (\d+) lines/);
          return linesMatch ? parseInt(linesMatch[1]) : null;
          
        case 'max-len':
          // "Line 42 exceeds the maximum line length of 100."
          const lengthMatch = message.match(/exceeds.*?(\d+)/);
          return lengthMatch ? parseInt(lengthMatch[1]) : null;
          
        default:
          return null;
      }
    } catch (error) {
      this.logger.debug(`Failed to extract metric value from: ${message}`);
      return null;
    }
  }
}

module.exports = ESLintWrapper;