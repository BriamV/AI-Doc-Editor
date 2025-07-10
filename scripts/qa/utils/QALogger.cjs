/**
 * QA Logger - Visual Logger & Reporter
 * T-05: Visual Logger & Reporter implementation
 * 
 * Generates structured tree output with colors, timings, and summaries
 * as specified in RF-006 and PRD §8 Release 0.4.0
 */

const fs = require('fs');
const path = require('path');

class QALogger {
  constructor(options = {}) {
    this.options = {
      verbose: false,
      colors: true,
      timestamps: true,
      format: 'tree',
      jsonReport: false,
      jsonFile: 'qa-report.json',
      ...options
    };
    
    this.startTime = Date.now();
    this.results = [];
    this.currentLevel = 0;
    
    // Color codes
    this.colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      white: '\x1b[37m',
      gray: '\x1b[90m'
    };
    
    // Status symbols
    this.symbols = {
      success: '✅',
      warning: '🟡', 
      error: '❌',
      info: 'ℹ️',
      running: '🔄',
      pending: '⏳'
    };
  }
  
  /**
   * Colorize text if colors are enabled
   */
  colorize(text, color) {
    if (!this.options.colors) return text;
    return `${this.colors[color]}${text}${this.colors.reset}`;
  }
  
  /**
   * Get timestamp string
   */
  getTimestamp() {
    if (!this.options.timestamps) return '';
    return this.colorize(`[${new Date().toISOString()}]`, 'gray') + ' ';
  }
  
  /**
   * Get indentation for current level
   */
  getIndentation() {
    return '  '.repeat(this.currentLevel);
  }
  
  /**
   * Log with specific level and symbol
   */
  log(level, symbol, message, data = null) {
    const timestamp = this.getTimestamp();
    const indent = this.getIndentation();
    const coloredMessage = this.colorize(message, level === 'error' ? 'red' : level === 'warning' ? 'yellow' : level === 'success' ? 'green' : 'blue');
    
    console.log(`${timestamp}${indent}${symbol} ${coloredMessage}`);
    
    // Store for JSON report
    if (this.options.jsonReport) {
      this.results.push({
        timestamp: new Date().toISOString(),
        level,
        message,
        data,
        duration: Date.now() - this.startTime
      });
    }
    
    if (data && this.options.verbose) {
      this.currentLevel++;
      console.log(`${this.getIndentation()}${this.colorize(JSON.stringify(data, null, 2), 'gray')}`);
      this.currentLevel--;
    }
  }
  
  /**
   * Success message
   */
  success(message, data = null) {
    this.log('success', this.symbols.success, message, data);
  }
  
  /**
   * Warning message
   */
  warning(message, data = null) {
    this.log('warning', this.symbols.warning, message, data);
  }
  
  /**
   * Alias for warning
   */
  warn(message, data = null) {
    this.warning(message, data);
  }
  
  /**
   * Error message
   */
  error(message, data = null) {
    this.log('error', this.symbols.error, message, data);
  }
  
  /**
   * Info message
   */
  info(message, data = null) {
    this.log('info', this.symbols.info, message, data);
  }
  
  /**
   * Running/progress message
   */
  running(message, data = null) {
    this.log('running', this.symbols.running, message, data);
  }
  
  /**
   * Pending message
   */
  pending(message, data = null) {
    this.log('pending', this.symbols.pending, message, data);
  }
  
  /**
   * Start a group (increase indentation)
   */
  group(title) {
    this.info(this.colorize(title, 'bright'));
    this.currentLevel++;
  }
  
  /**
   * End a group (decrease indentation)
   */
  groupEnd() {
    if (this.currentLevel > 0) {
      this.currentLevel--;
    }
  }
  
  /**
   * Show a tree structure for validation results
   */
  tree(results) {
    this.info(this.colorize('📊 QA Validation Results', 'bright'));
    this.currentLevel++;
    
    for (const result of results) {
      const symbol = result.status === 'passed' ? this.symbols.success : 
                    result.status === 'warning' ? this.symbols.warning : 
                    this.symbols.error;
      
      const duration = result.duration ? ` (${result.duration}ms)` : '';
      this.log(result.status, symbol, `${result.dimension}: ${result.message}${duration}`, result.details);
      
      if (result.items && result.items.length > 0) {
        this.currentLevel++;
        for (const item of result.items) {
          const itemSymbol = item.status === 'passed' ? this.symbols.success : 
                           item.status === 'warning' ? this.symbols.warning : 
                           this.symbols.error;
          this.log(item.status, itemSymbol, item.message, item.details);
        }
        this.currentLevel--;
      }
    }
    
    this.currentLevel--;
  }
  
  /**
   * Show summary with timing information
   */
  summary(stats) {
    const duration = Date.now() - this.startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    const durationStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    
    this.info('');
    this.info(this.colorize('📈 Summary', 'bright'));
    this.currentLevel++;
    
    this.info(`Duration: ${this.colorize(durationStr, 'cyan')}`);
    this.info(`Total checks: ${this.colorize(stats.total || 0, 'cyan')}`);
    this.success(`Passed: ${stats.passed || 0}`);
    this.warning(`Warnings: ${stats.warnings || 0}`);
    this.error(`Failed: ${stats.failed || 0}`);
    
    this.currentLevel--;
    
    // Overall status
    if (stats.failed > 0) {
      this.error('🔴 QA validation FAILED');
    } else if (stats.warnings > 0) {
      this.warning('🟡 QA validation PASSED with warnings');
    } else {
      this.success('🟢 QA validation PASSED');
    }
  }
  
  /**
   * Generate JSON report
   */
  async generateJSONReport(additionalData = {}) {
    if (!this.options.jsonReport) return null;
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      system: {
        name: 'QA System',
        version: '0.1.0'
      },
      results: this.results,
      ...additionalData
    };
    
    try {
      await fs.promises.writeFile(this.options.jsonFile, JSON.stringify(report, null, 2));
      this.info(`JSON report generated: ${this.options.jsonFile}`);
      return report;
    } catch (error) {
      this.error(`Failed to generate JSON report: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Title message (large, prominent)
   */
  title(message) {
    console.log('');
    console.log(this.colorize('═'.repeat(message.length + 4), 'cyan'));
    console.log(this.colorize(`  ${message}  `, 'bright'));
    console.log(this.colorize('═'.repeat(message.length + 4), 'cyan'));
    console.log('');
  }
}

module.exports = QALogger;