/**
 * Black Direct Wrapper - SOLID Compliant
 * SRP: Only Black Python formatting responsibility
 * DIP: Dependencies injected via constructor
 * Performance: Direct execution (no Docker overhead)
 */

const BaseWrapper = require('./BaseWrapper.cjs');
const { ILinterExecutor, ILinterConfig } = require('../interfaces/ILinterWrapper.cjs');
const path = require('path');

class BlackWrapper extends BaseWrapper {
  constructor(config, logger, processService, fileService) {
    super(config, logger, processService);
    this.fileService = fileService;
  }

  getName() { return 'black'; }
  
  async getVersion() {
    const result = await this.processService.execute('black', ['--version']);
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
    // Black works without explicit config (uses pyproject.toml if available)
    return true;
  }

  async execute(files, options = {}) {
    const startTime = Date.now();
    
    try {
      const args = [
        '--check',  // Check formatting without writing
        '--diff',   // Show diff for unformatted files
        ...files
      ];

      const result = await this.processService.execute('black', args);
      const violations = this.parseBlackOutput(result.stdout, files);
      
      return this.formatResult(
        result.success,
        violations,
        Date.now() - startTime,
        { filesProcessed: files.length, tool: 'black' }
      );
    } catch (error) {
      return this.handleExecutionError(error, 'Black');
    }
  }

  parseBlackOutput(stdout, files) {
    const violations = [];
    
    // Black outputs "would reformat" messages for unformatted files
    if (stdout) {
      const lines = stdout.split('\n');
      files.forEach(file => {
        const reformatLine = lines.find(line => 
          line.includes('would reformat') && line.includes(file)
        );
        
        if (reformatLine) {
          violations.push({
            file: file,
            line: 1,
            column: 1,
            severity: 'error',
            message: 'File is not formatted according to Black rules',
            ruleId: 'black-formatter'
          });
        }
      });
    }

    return violations;
  }
}

module.exports = BlackWrapper;