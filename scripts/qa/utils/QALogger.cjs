/**
 * QALogger - Core Logger with SOLID Architecture (≤200 LOC)
 * Refactored for RNF-001 compliance and SOLID principles
 * 
 * Single Responsibility: Core logging functionality only
 * Composition Pattern: Uses specialized formatters for complex operations
 */

const TreeFormatter = require('./formatters/TreeFormatter.cjs');
const SummaryFormatter = require('./formatters/SummaryFormatter.cjs');
const JSONReporter = require('./formatters/JSONReporter.cjs');

class QALogger {
  constructor(options = {}) {
    this.options = {
      verbose: false,
      colors: true,
      timestamps: true,
      jsonReport: false,
      jsonFile: 'qa-report.json',
      ...options
    };
    
    this.startTime = Date.now();
    this.results = [];
    this.currentLevel = 0;
    
    // Initialize formatters (composition pattern - SOLID)
    this.treeFormatter = new TreeFormatter(this);
    this.summaryFormatter = new SummaryFormatter(this);
    this.jsonReporter = new JSONReporter();
    
    // Setup
    this._setupGlobalErrorHandling();
    this._initializeColors();
  }
  
  // ========================================
  // CORE LOGGING (Single Responsibility)
  // ========================================
  
  colorize(text, color) {
    if (!this.options.colors) return text;
    return `${this.colors[color]}${text}${this.colors.reset}`;
  }
  
  getTimestamp() {
    if (!this.options.timestamps) return '';
    return this.colorize(`[${new Date().toISOString()}]`, 'gray') + ' ';
  }
  
  getIndentation() {
    return '  '.repeat(this.currentLevel);
  }
  
  _safeConsoleLog(...args) {
    try {
      console.log(...args);
    } catch (error) {
      if (error.code === 'EPIPE' || error.errno === -4047 || error.syscall === 'write') {
        return; // Silently ignore EPIPE errors
      }
      throw error;
    }
  }
  
  log(level, symbol, message, data = null) {
    const timestamp = this.getTimestamp();
    const indent = this.getIndentation();
    const colorMap = { error: 'red', warning: 'yellow', success: 'green' };
    const coloredMessage = this.colorize(message, colorMap[level] || 'blue');
    
    this._safeConsoleLog(`${timestamp}${indent}${symbol} ${coloredMessage}`);
    
    // Store for JSON report
    if (this.options.jsonReport) {
      this.results.push({
        timestamp: new Date().toISOString(),
        level, message, data,
        duration: Date.now() - this.startTime
      });
    }
    
    if (data && this.options.verbose) {
      this.currentLevel++;
      this._safeConsoleLog(`${this.getIndentation()}${this.colorize(JSON.stringify(data, null, 2), 'gray')}`);
      this.currentLevel--;
    }
  }
  
  // Basic logging methods
  success(message, data = null) { this.log('success', '✅', message, data); }
  warning(message, data = null) { this.log('warning', '🟡', message, data); }
  warn(message, data = null) { this.warning(message, data); }
  error(message, data = null) { this.log('error', '❌', message, data); }
  info(message, data = null) { this.log('info', 'ℹ️', message, data); }
  debug(message, data = null) { 
    if (this.options.verbose) this.log('info', 'ℹ️', `[DEBUG] ${message}`, data); 
  }
  running(message, data = null) { this.log('running', '🔄', message, data); }
  pending(message, data = null) { this.log('pending', '⏳', message, data); }
  
  // Group management
  group(title) {
    this.info(this.colorize(title, 'bright'));
    this.currentLevel++;
  }
  
  groupEnd() {
    if (this.currentLevel > 0) this.currentLevel--;
  }
  
  // Title display
  title(message) {
    this._safeConsoleLog('');
    const border = this.colorize('═'.repeat(message.length + 4), 'cyan');
    this._safeConsoleLog(border);
    this._safeConsoleLog(this.colorize(`  ${message}  `, 'bright'));
    this._safeConsoleLog(border);
    this._safeConsoleLog('');
  }
  
  // ========================================
  // DELEGATED FORMATTING (Composition Pattern)
  // ========================================
  
  tree(results) {
    this.treeFormatter.formatAsTree(results);
  }
  
  summary(stats) {
    this.summaryFormatter.formatSummary(stats, this.startTime);
  }
  
  async generateJSONReport(results, format = 'json') {
    if (!this.options.jsonReport && format !== 'ci-json') return null;
    
    const context = {
      branch: 'unknown',
      commit: 'unknown',
      environment: process.env.NODE_ENV || 'development',
      mode: results.mode || 'automatic',
      scope: results.scope || 'all'
    };
    
    const reportData = await this.jsonReporter.generateAndWriteReport(
      results, 
      this.options.jsonFile, 
      context, 
      this.startTime
    );
    
    if (reportData.writeResult.success) {
      this.info(`${format.toUpperCase()} report generated: ${reportData.writeResult.filename}`);
    } else {
      this.error(`Failed to generate ${format} report: ${reportData.writeResult.error}`);
    }
    
    return reportData.report;
  }
  
  formatConsistentHelp(content, source = 'direct') {
    if (source === 'wrapper') return content;
    
    let formatted = content.replace(/^(\w+.*:)$/gm, this.colorize('$1', 'blue'));
    formatted = formatted.replace(/^(\s+--?\w+.*)/gm, this.colorize('$1', 'cyan'));
    
    return formatted;
  }
  
  // ========================================
  // INITIALIZATION (Internal)
  // ========================================
  
  _initializeColors() {
    this.colors = {
      reset: '\x1b[0m', bright: '\x1b[1m', red: '\x1b[31m', green: '\x1b[32m',
      yellow: '\x1b[33m', blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m',
      white: '\x1b[37m', gray: '\x1b[90m'
    };
  }
  
  _setupGlobalErrorHandling() {
    [process.stdout, process.stderr].forEach(stream => {
      if (stream && !stream._epipeHandlerInstalled) {
        stream.on('error', (error) => {
          if (error.code === 'EPIPE' || error.errno === -4047) {
            process.exit(0);
          }
        });
        stream._epipeHandlerInstalled = true;
      }
    });
  }
}

module.exports = QALogger;