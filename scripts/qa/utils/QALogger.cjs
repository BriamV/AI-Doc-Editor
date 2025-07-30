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
    
    // CRITICAL FIX: Handle EPIPE errors at the process level
    this._setupGlobalErrorHandling();
    
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
   * Setup global error handling for EPIPE errors
   */
  _setupGlobalErrorHandling() {
    // Handle EPIPE errors on stdout/stderr streams
    if (process.stdout && !process.stdout._epipeHandlerInstalled) {
      process.stdout.on('error', (error) => {
        if (error.code === 'EPIPE' || error.errno === -4047) {
          // Broken pipe - exit gracefully
          process.exit(0);
        }
      });
      process.stdout._epipeHandlerInstalled = true;
    }
    
    if (process.stderr && !process.stderr._epipeHandlerInstalled) {
      process.stderr.on('error', (error) => {
        if (error.code === 'EPIPE' || error.errno === -4047) {
          // Broken pipe - exit gracefully
          process.exit(0);
        }
      });
      process.stderr._epipeHandlerInstalled = true;
    }
  }

  /**
   * Safe console.log wrapper to handle EPIPE errors
   */
  _safeConsoleLog(...args) {
    try {
      console.log(...args);
    } catch (error) {
      if (error.code === 'EPIPE' || error.errno === -4047) {
        // Broken pipe - silently ignore to prevent crash
        // Also handle error by errno code for Windows/WSL
        return;
      }
      // For other write errors, also silently ignore to maintain stability
      if (error.syscall === 'write') {
        return;
      }
      // Re-throw other errors
      throw error;
    }
  }
  
  /**
   * Log with specific level and symbol
   */
  log(level, symbol, message, data = null) {
    const timestamp = this.getTimestamp();
    const indent = this.getIndentation();
    const coloredMessage = this.colorize(message, level === 'error' ? 'red' : level === 'warning' ? 'yellow' : level === 'success' ? 'green' : 'blue');
    
    // CRITICAL FIX: Use safe console.log to prevent EPIPE crashes
    this._safeConsoleLog(`${timestamp}${indent}${symbol} ${coloredMessage}`);
    
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
      this._safeConsoleLog(`${this.getIndentation()}${this.colorize(JSON.stringify(data, null, 2), 'gray')}`);
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
   * Debug message (only shown in verbose mode)
   */
  debug(message, data = null) {
    if (this.options.verbose) {
      this.log('info', this.symbols.info, `[DEBUG] ${message}`, data);
    }
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
      // Critical Fix: Prioritize success field for accurate display
      const symbol = (result.success === false) ? this.symbols.error :
                    (result.success === true) ? this.symbols.success : 
                    (result.status === 'warning') ? this.symbols.warning : 
                    this.symbols.error;
      
      const actualStatus = (result.success === false) ? 'error' : 
                          (result.success === true) ? 'success' : 
                          result.status;
      const duration = result.duration ? ` (${result.duration}ms)` : '';
      this.log(actualStatus, symbol, `${result.dimension}: ${result.message}${duration}`, result.details);
      
      if (result.items && result.items.length > 0) {
        this.currentLevel++;
        for (const item of result.items) {
          const itemSymbol = (item.success === false) ? this.symbols.error :
                           (item.success === true) ? this.symbols.success : 
                           (item.status === 'warning') ? this.symbols.warning : 
                           this.symbols.error;
          const itemStatus = (item.success === false) ? 'error' : 
                            (item.success === true) ? 'success' : 
                            item.status;
          this.log(itemStatus, itemSymbol, item.message, item.details);
          
          // NEW: Enhanced error context with structured violation prioritization
          if (item.details && item.details.violations && item.details.violations.length > 0) {
            this._displayStructuredViolations(item.details.formatted?.details);
          } else if (item.details && item.details.results && !item.details.success) {
            this._displayEnhancedErrorContext(item.tool, item.details.results);
          }
        }
        this.currentLevel--;
      }
    }
    
    this.currentLevel--;
  }

  /**
   * Display structured violation details for QA tool output
   * Converts structured violation data into readable developer-friendly format
   */
  _displayStructuredViolations(details) {
    if (!details || !Array.isArray(details) || details.length === 0) {
      return;
    }

    this.currentLevel++;

    for (const detail of details) {
      if (!detail.items || detail.items.length === 0) continue;

      // Infrastructure issues (Docker, environment setup)
      if (detail.level === 'infrastructure') {
        for (const item of detail.items) {
          const timestamp = this.getTimestamp();
          const indent = this.getIndentation();
          
          // Main error message with specific icon for infrastructure
          this._safeConsoleLog(`${timestamp}${indent}🔧 ${this.colorize(item.message, 'yellow')}`);
          
          // Actionable suggestion with different icon
          if (item.suggestion) {
            this._safeConsoleLog(`${timestamp}${this.getIndentation()}  💡 ${this.colorize(item.suggestion, 'cyan')}`);
          }
        }
      }

      // Code quality violations (grouped by file)
      else if (detail.level === 'violation') {
        for (const fileGroup of detail.items) {
          const timestamp = this.getTimestamp();
          const indent = this.getIndentation();
          
          // File header
          this._safeConsoleLog(`${timestamp}${indent}📁 ${this.colorize(fileGroup.file, 'bright')}`);
          
          this.currentLevel++;
          for (const violation of fileGroup.violations) {
            const violationIndent = this.getIndentation();
            let locationInfo = '';
            
            if (violation.line) {
              locationInfo = ` (Line ${violation.line}${violation.column ? `:${violation.column}` : ''})`;
            }
            
            // Violation details
            this._safeConsoleLog(`${timestamp}${violationIndent}├─ ${this.colorize(violation.rule, 'red')}${locationInfo}`);
            this._safeConsoleLog(`${timestamp}${violationIndent}│  ${this.colorize(violation.message, 'gray')}`);
            
            if (violation.suggestion) {
              this._safeConsoleLog(`${timestamp}${violationIndent}└─ 💡 ${this.colorize(violation.suggestion, 'cyan')}`);
            }
          }
          this.currentLevel--;
        }
      }

      // Summary information
      else if (detail.level === 'summary') {
        for (const item of detail.items) {
          const timestamp = this.getTimestamp();
          const indent = this.getIndentation();
          
          this._safeConsoleLog(`${timestamp}${indent}📊 ${this.colorize(item.message, 'blue')}`);
          if (item.suggestion) {
            this._safeConsoleLog(`${timestamp}${this.getIndentation()}  💡 ${this.colorize(item.suggestion, 'cyan')}`);
          }
        }
      }
    }

    this.currentLevel--;
  }

  /**
   * Display enhanced error context for failed tools
   * Provides actionable information based on error patterns
   */
  _displayEnhancedErrorContext(toolName, results) {
    const { stdout, stderr } = results;
    const errorContext = this._analyzeErrorContext(toolName, stdout, stderr);
    
    if (errorContext.category === 'none') return;
    
    const timestamp = this.getTimestamp();
    const baseIndent = this.getIndentation();
    
    // Display error category
    this._safeConsoleLog(`${timestamp}${baseIndent}  🔧 ${this.colorize(errorContext.category, 'yellow')}`);
    
    // Display primary message
    if (errorContext.message) {
      this._safeConsoleLog(`${timestamp}${baseIndent}  💡 ${this.colorize(errorContext.message, 'cyan')}`);
    }
    
    // Display actionable suggestions
    if (errorContext.suggestions && errorContext.suggestions.length > 0) {
      this._safeConsoleLog(`${timestamp}${baseIndent}  📋 ${this.colorize('Possible solutions:', 'bright')}`);
      errorContext.suggestions.forEach((suggestion, index) => {
        this._safeConsoleLog(`${timestamp}${baseIndent}    ${index + 1}. ${suggestion}`);
      });
    }
  }

  /**
   * Analyze error context based on tool output patterns
   * Extensible for different tools and error types
   */
  _analyzeErrorContext(toolName, stdout = '', stderr = '') {
    const output = `${stdout} ${stderr}`.toLowerCase();
    
    // Docker-related errors (common across tools)
    if (this._isDockerError(output)) {
      return {
        category: 'Docker Dependency Issue',
        message: `${toolName} requires Docker to be available and running`,
        suggestions: [
          'Start Docker Desktop application',
          'Verify Docker is properly installed',
          'Check Docker daemon is running'
        ]
      };
    }
    
    // Permission/access errors
    if (this._isPermissionError(output)) {
      return {
        category: 'Permission Issue',
        message: `${toolName} cannot access required resources`,
        suggestions: [
          'Check file/directory permissions',
          'Run with appropriate privileges',
          'Verify tool configuration paths'
        ]
      };
    }
    
    // Network/connectivity errors
    if (this._isNetworkError(output)) {
      return {
        category: 'Network Connectivity Issue',
        message: `${toolName} cannot connect to required services`,
        suggestions: [
          'Check internet connectivity',
          'Verify proxy/firewall settings',
          'Try again after network stabilizes'
        ]
      };
    }
    
    // Configuration errors
    if (this._isConfigurationError(output)) {
      return {
        category: 'Configuration Issue',
        message: `${toolName} configuration appears invalid`,
        suggestions: [
          'Check tool configuration files',
          'Verify environment variables',
          'Review tool documentation'
        ]
      };
    }
    
    // Generic fallback for unrecognized errors
    if (stderr && stderr.trim()) {
      return {
        category: 'Execution Error',
        message: `${toolName} encountered an error during execution`,
        suggestions: [
          'Check tool installation',
          'Review error details in verbose mode',
          'Consult tool documentation'
        ]
      };
    }
    
    return { category: 'none' };
  }

  /**
   * Error pattern detection methods (extensible)
   */
  _isDockerError(output) {
    // Only detect actual Docker connection/runtime errors, not normal Docker mentions
    const dockerErrorPatterns = [
      'error during connect',
      'docker daemon not running',
      'cannot connect to the docker daemon',
      'docker desktop is not running',
      'docker: not found',
      'permission denied while trying to connect to the docker daemon',
      'no such host',
      'connection refused'
    ];
    return dockerErrorPatterns.some(pattern => output.includes(pattern));
  }

  _isPermissionError(output) {
    const permissionPatterns = [
      'permission denied', 'access denied', 'eacces', 'eperm',
      'unauthorized', 'forbidden'
    ];
    return permissionPatterns.some(pattern => output.includes(pattern));
  }

  _isNetworkError(output) {
    const networkPatterns = [
      'connection refused', 'timeout', 'network', 'proxy',
      'dns', 'resolve', 'unreachable'
    ];
    return networkPatterns.some(pattern => output.includes(pattern));
  }

  _isConfigurationError(output) {
    const configPatterns = [
      'config', 'configuration', 'invalid', 'not found',
      'missing', 'malformed', 'syntax error'
    ];
    return configPatterns.some(pattern => output.includes(pattern));
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
   * Generate JSON report (Extended for RF-006 and Release 0.4.0)
   */
  async generateJSONReport(results, format = 'json') {
    if (!this.options.jsonReport && format !== 'ci-json') return null;
    
    let report;
    let filename = this.options.jsonFile;
    
    if (format === 'ci-json') {
      // Use ResultAggregator for CI/CD structured reports
      const ResultAggregator = require('../core/execution/ResultAggregator.cjs');
      const aggregator = new ResultAggregator({}, this);
      
      // Prepare context for CI/CD report
      const context = {
        branch: 'unknown', // TODO: Detect from git
        commit: 'unknown', // TODO: Detect from git
        environment: process.env.NODE_ENV || 'development',
        mode: results.mode || 'automatic',
        scope: results.scope || 'all',
        logFile: 'qa-system.log',
        reportPath: 'qa-report.json',
        reportsDir: 'qa-reports/'
      };
      
      // Generate structured CI/CD report
      report = aggregator.generateJSONReport(results, context);
      filename = 'qa-report.json'; // Standard filename for CI/CD
      
    } else {
      // Legacy JSON format
      report = {
        timestamp: new Date().toISOString(),
        duration: Date.now() - this.startTime,
        system: {
          name: 'QA System',
          version: '0.1.0'
        },
        results: this.results,
        ...results
      };
    }
    
    try {
      await fs.promises.writeFile(filename, JSON.stringify(report, null, 2));
      this.info(`${format.toUpperCase()} report generated: ${filename}`);
      return report;
    } catch (error) {
      this.error(`Failed to generate ${format} report: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Title message (large, prominent)
   */
  title(message) {
    this._safeConsoleLog('');
    this._safeConsoleLog(this.colorize('═'.repeat(message.length + 4), 'cyan'));
    this._safeConsoleLog(this.colorize(`  ${message}  `, 'bright'));
    this._safeConsoleLog(this.colorize('═'.repeat(message.length + 4), 'cyan'));
    this._safeConsoleLog('');
  }

  /**
   * Format consistent help output for unified presentation
   */
  formatConsistentHelp(content, source = 'direct') {
    if (source === 'wrapper') {
      // Ya está en formato QA Logger, mantener
      return content;
    }
    
    // Para yargs directo, aplicar formato QA consistente
    // Convertir headers a formato con colores
    let formatted = content.replace(/^(\w+.*:)$/gm, this.colorize('$1', 'blue'));
    
    // Aplicar formato consistente para opciones
    formatted = formatted.replace(/^(\s+--?\w+.*)/gm, this.colorize('$1', 'cyan'));
    
    return formatted;
  }
}

module.exports = QALogger;