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
      // Filter to only Python files that Ruff can process
      const pythonFiles = files.filter(file => /\.py$/.test(file));
      
      if (pythonFiles.length === 0) {
        this.logger.debug('Ruff: No Python files to process');
        return this.formatResult(
          true,
          [],
          Date.now() - startTime,
          { filesProcessed: 0, skippedReason: 'No Python files in scope' }
        );
      }

      const args = [
        'check',
        '--output-format', 'json',
        ...pythonFiles
      ];

      const result = await this.processService.execute('ruff', args);
      const violations = this.parseRuffOutput(result.stdout || '[]');
      
      // Add Python LOC violations (Ruff doesn't have max-lines rule)
      const locViolations = await this.checkPythonFilesLOC(pythonFiles);
      const allViolations = [...violations, ...locViolations];
      
      // CRITICAL FIX RF-003: Success determination based on PRD specification
      // "Un solo Error debe hacer que toda la validación falle"
      // Check if Ruff executed successfully AND no severity "error" violations found
      let isSuccess = false;
      
      if (!result.success && result.stderr && result.stderr.includes('error')) {
        // Ruff had execution error
        isSuccess = false;
      } else {
        // Ruff executed successfully - check violation severity
        const hasErrorViolations = allViolations.some(v => v.severity === 'error');
        isSuccess = !hasErrorViolations; // Success only if no error-level violations
      }
      
      this.logger.debug(`Ruff success determination: success=${result.success}, violations=${allViolations.length}, hasErrors=${allViolations.some(v => v.severity === 'error')}, isSuccess=${isSuccess}`);
      
      return this.formatResult(
        isSuccess,
        allViolations,
        Date.now() - startTime,
        { filesProcessed: pythonFiles.length, tool: 'ruff' }
      );
    } catch (error) {
      return this.handleExecutionError(error, 'Ruff');
    }
  }

  parseRuffOutput(stdout) {
    try {
      const results = JSON.parse(stdout);
      return results.map(violation => {
        const parsedViolation = {
          file: violation.filename,
          line: violation.location.row,
          column: violation.location.column, 
          severity: violation.fix ? 'warning' : 'error',
          message: violation.message,
          ruleId: violation.code
        };
        
        // Add Design Metrics semaphore classification for complexity rules
        const designMetrics = this.classifyDesignMetricsViolation(violation);
        if (designMetrics) {
          parsedViolation.designMetrics = designMetrics;
        }
        
        return parsedViolation;
      });
    } catch (error) {
      this.logger.warn(`Failed to parse Ruff output: ${error.message}`);
      return [];
    }
  }

  // Design Metrics semaphore classification for Python (RF-003 requirements)
  classifyDesignMetricsViolation(violation) {
    // Ruff complexity rules start with C90 (McCabe complexity)
    if (violation.code?.startsWith('C90')) {
      // Extract complexity value from Ruff message
      const value = this.extractComplexityValue(violation.message);
      if (value === null) return null;
      
      // Classify based on PRD v2.0 thresholds
      let classification, semaphore;
      if (value <= 10) {
        classification = 'green';
        semaphore = '🟢';
      } else if (value <= 15) {
        classification = 'yellow';
        semaphore = '🟡';
      } else {
        classification = 'red';
        semaphore = '🔴';
      }
      
      return {
        metric: 'cyclomaticComplexity',
        value: value,
        classification: classification,
        semaphore: semaphore,
        thresholds: '🟢≤10, 🟡11-15, 🔴>15'
      };
    }
    
    return null;
  }

  // Extract complexity value from Ruff messages
  extractComplexityValue(message) {
    try {
      // Ruff format: "'functionName' is too complex (12 > 10)"
      const match = message.match(/too complex \((\d+) >/);
      return match ? parseInt(match[1]) : null;
    } catch (error) {
      this.logger.debug(`Failed to extract complexity value from: ${message}`);
      return null;
    }
  }

  // Check Python files for LOC violations (Ruff doesn't have max-lines rule)
  async checkPythonFilesLOC(files) {
    const fs = require('fs').promises;
    const locViolations = [];
    
    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n');
        const loc = this.countPythonLOC(lines);
        
        if (loc > 212) {
          // Create synthetic violation for LOC
          const violation = {
            file: file,
            line: 1,
            column: 1,
            severity: loc > 300 ? 'error' : 'warning',
            message: `File has ${loc} lines. Maximum allowed is 212.`,
            ruleId: 'max-lines-python',
            designMetrics: {
              metric: 'linesOfCode',
              value: loc,
              classification: loc > 300 ? 'red' : 'yellow',
              semaphore: loc > 300 ? '🔴' : '🟡',
              thresholds: '🟢≤212, 🟡213-300, 🔴>300'
            }
          };
          locViolations.push(violation);
        }
      } catch (error) {
        this.logger.debug(`Failed to check LOC for ${file}: ${error.message}`);
      }
    }
    
    return locViolations;
  }

  // Count Lines of Code for Python (excluding comments and blank lines)
  countPythonLOC(lines) {
    let loc = 0;
    let inMultilineString = false;
    let stringDelimiter = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines
      if (trimmed.length === 0) continue;
      
      // Handle multiline strings (docstrings)
      if (inMultilineString) {
        if (trimmed.includes(stringDelimiter)) {
          inMultilineString = false;
          stringDelimiter = null;
        }
        continue;
      }
      
      // Check for start of multiline string
      if (trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
        stringDelimiter = trimmed.substring(0, 3);
        if (!trimmed.endsWith(stringDelimiter) || trimmed.length === 3) {
          inMultilineString = true;
        }
        continue;
      }
      
      // Skip single-line comments
      if (trimmed.startsWith('#')) continue;
      
      // Count as LOC
      loc++;
    }
    
    return loc;
  }
}

module.exports = RuffWrapper;