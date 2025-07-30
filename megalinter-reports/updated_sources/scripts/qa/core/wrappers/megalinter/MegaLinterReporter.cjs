/**
 * MegaLinter Reporter - Single Responsibility: Result processing and RF-006 formatting
 * Extracted from MegaLinterWrapper for SOLID compliance
 */

const { promises: fs } = require('fs');
const fsSync = require('fs');
const path = require('path');

class MegaLinterReporter {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }
  
  /**
   * Process MegaLinter results according to RF-006
   */
  async processResults(execution, tool, megalinterConfig) {
    const { exitCode, stdout, stderr } = execution;
    
    const results = {
      success: exitCode === 0,
      data: {},
      reports: [],
      metrics: {},
      warnings: [],
      errors: [],
      violations: [] // NEW: Structured violation details
    };
    
    // Process stdout
    if (stdout) {
      results.data.stdout = stdout;
      this._extractMetrics(stdout, results);
      this._extractWarnings(stdout, results);
      // NEW: Extract structured violation details
      this._extractViolationDetails(stdout, results);
    }
    
    // Process stderr
    if (stderr && stderr.trim()) {
      results.data.stderr = stderr;
      results.errors.push(stderr);
    }
    
    // Read reports
    await this._readJsonReport(results, megalinterConfig);
    await this._readSarifReport(results, megalinterConfig);
    
    // Apply RF-006 formatting
    results.formatted = this._formatResults(results, tool);
    
    return results;
  }
  
  /**
   * Extract structured violation details from stdout
   * Parses MegaLinter output for actionable developer information
   */
  _extractViolationDetails(stdout, results) {
    // Handle Docker connection failures first
    if (stdout.includes('error during connect') || stdout.includes('dockerDesktopLinuxEngine')) {
      results.violations.push({
        type: 'infrastructure',
        category: 'Docker Connection Failure',
        message: 'MegaLinter requires Docker Desktop to be running',
        suggestion: 'Start Docker Desktop or configure local-only mode with MEGALINTER_RUN_LOCALLY=true',
        file: null,
        line: null,
        rule: 'docker-connectivity'
      });
      return;
    }

    // Parse MegaLinter summary table for linter results
    // Real format: | ❌ BASH       | shellcheck   | list_of_files |     6 |       |      4 |        0 | 3.48s        |
    const tablePattern = /\|\s*❌\s*([A-Z_]+)\s*\|\s*(\w+)\s*\|\s*[^|]+\|\s*\d+\s*\|\s*[^|]*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*[^|]+\|/g;
    const warningPattern = /\|\s*⚠️\s*([A-Z_]+)\s*\|\s*(\w+)\s*\|\s*[^|]+\|\s*\d+\s*\|\s*[^|]*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*[^|]+\|/g;
    
    let totalErrors = 0;
    let totalWarnings = 0;
    const linterResults = [];
    
    // Parse error rows (❌)
    let tableMatch;
    while ((tableMatch = tablePattern.exec(stdout)) !== null) {
      const [, dimension, linter, errors, warnings] = tableMatch;
      const errorCount = parseInt(errors) || 0;
      const warningCount = parseInt(warnings) || 0;
      
      totalErrors += errorCount;
      totalWarnings += warningCount;
      
      if (errorCount > 0 || warningCount > 0) {
        linterResults.push({
          dimension,
          linter,
          errors: errorCount,
          warnings: warningCount,
          status: 'failed'
        });
      }
    }
    
    // Parse warning rows (⚠️)
    let warningMatch;
    while ((warningMatch = warningPattern.exec(stdout)) !== null) {
      const [, dimension, linter, errors, warnings] = warningMatch;
      const errorCount = parseInt(errors) || 0;
      const warningCount = parseInt(warnings) || 0;
      
      totalErrors += errorCount;
      totalWarnings += warningCount;
      
      if (errorCount > 0 || warningCount > 0) {
        linterResults.push({
          dimension,
          linter,
          errors: errorCount,
          warnings: warningCount,
          status: 'warning'
        });
      }
    }
    
    
    if (totalErrors > 0 || totalWarnings > 0 || linterResults.length > 0) {
      results.violations.push({
        type: 'summary',
        category: 'Linting Violations',
        message: `${totalErrors} error(s) and ${totalWarnings} warning(s) found across ${linterResults.length} linter(s)`,
        suggestion: 'Check megalinter-reports/ directory for detailed violation breakdown',
        file: null,
        line: null,
        rule: 'megalinter-summary',
        details: linterResults
      });
    }
    
    // Fallback: Look for the final summary message
    if (results.violations.length === 0 && stdout.includes('Error(s) have been found during linting')) {
      results.violations.push({
        type: 'summary',
        category: 'Linting Violations',
        message: 'MegaLinter detected code quality violations',
        suggestion: 'Check megalinter-reports/ directory for detailed violation reports',
        file: null,
        line: null,
        rule: 'megalinter-summary'
      });
    }

    // Parse violations from stdout and individual log files
    this._parseIndividualViolations(stdout, results);
    this._parseLogFileViolations(results);
  }

  /**
   * Parse individual violations from MegaLinter output (lean approach)
   */
  _parseIndividualViolations(stdout, results) {
    // Most common patterns that cover majority of linters
    const patterns = [
      // Python pylint: "file.py:line:column: CODE: message (rule-name)"
      /^(.+?):(\d+):(\d+):\s*([A-Z]\d+):\s*(.+?)\s*\(([^)]+)\)$/gm,
      // CSS stylelint: "file.css    7:47  ✖  message  rule-name"  
      /^(.+?)\s+(\d+):(\d+)\s+✖\s+(.+?)\s+([a-z-]+)$/gm,
      // Shellcheck: "In file.sh line 68: ... SC2086 (info): message"
      /In (.+?) line (\d+):\s*.*?\s+(\w+) \([^)]+\):\s*(.+)/g,
      // Generic: "file:line:column: message" or "file:line: message"
      /^(.+?):(\d+):(\d+)?\s*(.+)$/gm
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(stdout)) !== null) {
        const violation = this._parseViolationMatch(match);
        if (violation) {
          results.violations.push({
            ...violation,
            type: 'violation',
            category: 'Code Quality'
          });
        }
      }
    }
  }

  /**
   * Parse violation match into standard format
   */
  _parseViolationMatch(match) {
    if (!match[1] || !match[2]) return null;
    
    // Handle different match formats
    if (match.length >= 7) {
      // Python pylint format: file:line:column:CODE:message(rule)
      return {
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        rule: match[4],
        message: match[5].trim(),
        suggestion: `Fix violation in ${match[1]} at line ${match[2]}`
      };
    } else if (match.length === 6 && match[0].includes('✖')) {
      // CSS stylelint format: file line:column ✖ message rule
      return {
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        rule: match[5],
        message: match[4].trim(),
        suggestion: `Fix violation in ${match[1]} at line ${match[2]}`
      };
    } else if (match[0].includes('In ') && match[0].includes(' line ')) {
      // Shellcheck format: In file line N: ... RULE (type): message
      return {
        file: match[1],
        line: parseInt(match[2]),
        column: null,
        rule: match[3],
        message: match[4].trim(),
        suggestion: `Fix violation in ${match[1]} at line ${match[2]}`
      };
    } else if (match.length >= 4) {
      // Generic format: file:line:column:message or file:line:message
      return {
        file: match[1],
        line: parseInt(match[2]),
        column: match[3] ? parseInt(match[3]) : null,
        rule: 'generic',
        message: match[4] ? match[4].trim() : match[3].trim(),
        suggestion: `Fix violation in ${match[1]} at line ${match[2]}`
      };
    }
    
    return null;
  }


  /**
   * Extract metrics from stdout
   */
  _extractMetrics(stdout, results) {
    const metricsMatch = stdout.match(/║\s*(\d+)\s*linter\(s\)\s*found\s*(\d+)\s*error\(s\)/);
    if (metricsMatch) {
      results.metrics.linters = parseInt(metricsMatch[1]);
      results.metrics.errors = parseInt(metricsMatch[2]);
    }
  }
  
  /**
   * Extract warnings from stdout
   */
  _extractWarnings(stdout, results) {
    const warningMatches = stdout.match(/⚠️[^\n]+/g);
    if (warningMatches) {
      results.warnings = warningMatches.map(w => w.replace(/⚠️\s*/, ''));
    }
  }
  
  /**
   * Read JSON report
   */
  async _readJsonReport(results, megalinterConfig) {
    try {
      const jsonReportPath = path.join(
        process.cwd(),
        megalinterConfig.settings.reportFolder,
        'megalinter-report.json'
      );
      
      if (await this._fileExists(jsonReportPath)) {
        const jsonReport = JSON.parse(await fs.readFile(jsonReportPath, 'utf8'));
        results.data.jsonReport = jsonReport;
        results.reports.push({
          type: 'json',
          path: jsonReportPath,
          data: jsonReport
        });
        
        // Extract detailed metrics
        if (jsonReport.summary) {
          results.metrics = { ...results.metrics, ...jsonReport.summary };
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to read JSON report: ${error.message}`);
    }
  }
  
  /**
   * Read SARIF report
   */
  async _readSarifReport(results, megalinterConfig) {
    try {
      const sarifReportPath = path.join(
        process.cwd(),
        megalinterConfig.settings.reportFolder,
        'megalinter-report.sarif'
      );
      
      if (await this._fileExists(sarifReportPath)) {
        const sarifReport = JSON.parse(await fs.readFile(sarifReportPath, 'utf8'));
        results.reports.push({
          type: 'sarif',
          path: sarifReportPath,
          data: sarifReport
        });
      }
    } catch (error) {
      this.logger.warn(`Failed to read SARIF report: ${error.message}`);
    }
  }
  
  /**
   * Format results according to RF-006
   */
  _formatResults(results, tool) {
    const violationCount = results.violations.filter(v => v.type === 'violation').length;
    const infrastructureIssues = results.violations.filter(v => v.type === 'infrastructure').length;
    
    return {
      tool: tool.name,
      dimension: tool.dimension,
      status: results.success ? 'PASSED' : 'FAILED',
      summary: {
        errors: results.metrics.errors || violationCount,
        warnings: results.warnings.length || 0,
        linters: results.metrics.linters || 0,
        violations: violationCount, // NEW: Violation count
        infrastructureIssues: infrastructureIssues // NEW: Infrastructure issue count
      },
      details: this._buildDetails(results),
      metrics: results.metrics
    };
  }
  
  /**
   * Build details section with structured violation information
   */
  _buildDetails(results) {
    const details = [];
    
    // NEW: Add structured violations first (highest priority)
    if (results.violations && results.violations.length > 0) {
      // Group violations by type
      const infrastructureIssues = results.violations.filter(v => v.type === 'infrastructure');
      const codeViolations = results.violations.filter(v => v.type === 'violation');
      const summaryInfo = results.violations.filter(v => v.type === 'summary');

      // Infrastructure issues (Docker, environment)
      if (infrastructureIssues.length > 0) {
        details.push({
          level: 'infrastructure',
          category: 'Environment Setup',
          items: infrastructureIssues.map(v => ({
            message: v.message,
            suggestion: v.suggestion,
            rule: v.rule
          }))
        });
      }

      // Code quality violations
      if (codeViolations.length > 0) {
        // Group by file for better readability
        const violationsByFile = {};
        codeViolations.forEach(v => {
          const fileKey = v.file || 'unknown';
          if (!violationsByFile[fileKey]) {
            violationsByFile[fileKey] = [];
          }
          violationsByFile[fileKey].push(v);
        });

        details.push({
          level: 'violation',
          category: 'Code Quality Issues',
          items: Object.entries(violationsByFile).map(([file, violations]) => ({
            file: file,
            violations: violations.map(v => ({
              line: v.line,
              column: v.column,
              rule: v.rule,
              message: v.message,
              suggestion: v.suggestion
            }))
          }))
        });
      }

      // Summary information
      if (summaryInfo.length > 0) {
        details.push({
          level: 'summary',
          category: 'Linting Summary',
          items: summaryInfo.map(v => ({
            message: v.message,
            suggestion: v.suggestion
          }))
        });
      }
    }
    
    // Original error handling (preserved for backward compatibility)
    if (results.errors.length > 0) {
      details.push({
        level: 'error',
        category: 'Execution Errors',
        items: results.errors
      });
    }
    
    if (results.warnings.length > 0) {
      details.push({
        level: 'warning', 
        category: 'Warnings',
        items: results.warnings
      });
    }
    
    return details;
  }
  
  /**
   * Check if file exists
   */
  async _fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Parse violations from individual MegaLinter log files (SOLID: Single Responsibility)
   * This method extends violation parsing beyond consolidated stdout
   */
  _parseLogFileViolations(results) {
    const logDir = path.join(process.cwd(), 'megalinter-reports', 'linters_logs');
    
    if (!fsSync.existsSync(logDir)) {
      return; // No log directory, skip
    }

    // SOLID: Strategy pattern for different linter formats
    const linterParsers = {
      'CSS_STYLELINT': this._parseCSSStylelint.bind(this),
      'YAML_YAMLLINT': this._parseYAMLYamllint.bind(this), 
      'BASH_SHELLCHECK': this._parseBashShellcheck.bind(this),
      'HTML_HTMLHINT': this._parseHTMLHtmlhint.bind(this),
      'JAVASCRIPT_ES': this._parseJavaScriptESLint.bind(this),
      'TYPESCRIPT_ES': this._parseTypeScriptESLint.bind(this),
      'PYTHON_FLAKE8': this._parsePythonFlake8.bind(this),
      'PYTHON_MYPY': this._parsePythonMypy.bind(this)
    };

    // Process each linter log file
    const logFiles = fsSync.readdirSync(logDir).filter(file => file.startsWith('ERROR-'));
    
    for (const logFile of logFiles) {
      const linterType = logFile.replace('ERROR-', '').replace('.log', '');
      const parser = linterParsers[linterType];
      
      if (parser) {
        const logPath = path.join(logDir, logFile);
        const logContent = fsSync.readFileSync(logPath, 'utf8');
        parser(logContent, results);
      }
    }
  }

  /**
   * Parse CSS Stylelint violations (SOLID: Single Responsibility)
   * Format: "file.css\n    7:47  ✖  message  rule-name"
   */
  _parseCSSStylelint(logContent, results) {
    const lines = logContent.split('\n');
    let currentFile = null;
    
    for (const line of lines) {
      // Detect file path (no leading whitespace)
      if (line && !line.startsWith(' ') && line.includes('.css')) {
        currentFile = line.trim();
      }
      // Parse violation (leading whitespace + pattern)
      else if (currentFile && line.includes('✖')) {
        const match = line.trim().match(/^(\d+):(\d+)\s+✖\s+(.+?)\s+([a-z-]+)$/);
        if (match) {
          results.violations.push({
            type: 'violation',
            category: 'Code Quality',
            file: currentFile,
            line: parseInt(match[1]),
            column: parseInt(match[2]),
            rule: match[4],
            message: match[3].trim(),
            suggestion: `Fix CSS violation in ${currentFile} at line ${match[1]}`
          });
        }
      }
    }
  }

  /**
   * Parse YAML yamllint violations (SOLID: Single Responsibility)
   * Format: "file.yml\n  1:1       warning  missing document start "---"  (document-start)\n  35:25     error    trailing spaces  (trailing-spaces)"
   */
  _parseYAMLYamllint(logContent, results) {
    const lines = logContent.split('\n');
    let currentFile = null;
    
    for (const line of lines) {
      // Detect file path (no leading whitespace, contains .yml/.yaml)
      if (line && !line.startsWith(' ') && (line.includes('.yml') || line.includes('.yaml'))) {
        currentFile = line.trim();
      }
      // Parse violation (leading whitespace + pattern for both warning and error)
      else if (currentFile && (line.includes('warning') || line.includes('error')) && line.match(/^\s+\d+:\d+/)) {
        const match = line.trim().match(/^(\d+):(\d+)\s+(warning|error)\s+(.+?)\s*\(([^)]+)\)$/);
        if (match) {
          results.violations.push({
            type: 'violation',
            category: 'YAML Quality',
            file: currentFile,
            line: parseInt(match[1]),
            column: parseInt(match[2]),
            rule: match[5], // rule name from parentheses
            message: match[4].trim(), // message text
            suggestion: `Fix YAML ${match[3]} in ${currentFile} at line ${match[1]}`
          });
        }
      }
    }
  }

  /**
   * Parse Bash Shellcheck violations (SOLID: Single Responsibility)
   * Format: "In file.sh line 68:\n ... SC2086 (info): message"
   */
  _parseBashShellcheck(logContent, results) {
    const violations = logContent.match(/In (.+?) line (\d+):\s*.*?\s+(\w+) \([^)]+\):\s*(.+)/g);
    
    if (violations) {
      violations.forEach(violation => {
        const match = violation.match(/In (.+?) line (\d+):\s*.*?\s+(\w+) \([^)]+\):\s*(.+)/);
        if (match) {
          results.violations.push({
            type: 'violation',
            category: 'Code Quality',
            file: match[1],
            line: parseInt(match[2]),
            column: null,
            rule: match[3],
            message: match[4].trim(),
            suggestion: `Fix Bash violation in ${match[1]} at line ${match[2]}`
          });
        }
      });
    }
  }

  /**
   * Placeholder parsers for extensibility (SOLID: Open/Closed Principle)
   */
  /**
   * Parse HTML HTMLHint violations (SOLID: Single Responsibility)
   * Format: "   coverage/index.html\n      L12 |    <style type='text/css'>\n                     ^ The value of attribute [ type ] must be in double quotes. (attr-value-double-quotes)"
   */
  _parseHTMLHtmlhint(logContent, results) {
    const lines = logContent.split('\n');
    let currentFile = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect file path (starts with whitespace and contains .html)
      if (line.trim() && line.includes('.html') && !line.includes('L') && !line.includes('^')) {
        currentFile = line.trim();
      }
      // Parse violation (L<number> | ... ^ message (rule))
      else if (currentFile && line.includes('L') && line.includes('|')) {
        const match = line.match(/L(\d+)\s*\|\s*.+/);
        if (match) {
          // Look for the message in the next few lines
          for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
            const nextLine = lines[j];
            if (nextLine.includes('^') && nextLine.includes('(') && nextLine.includes(')')) {
              const messageMatch = nextLine.match(/\^\s*(.+?)\s*\(([^)]+)\)/);
              if (messageMatch) {
                results.violations.push({
                  type: 'violation',
                  category: 'HTML Quality',
                  file: currentFile,
                  line: parseInt(match[1]),
                  column: null,
                  rule: messageMatch[2],
                  message: messageMatch[1].trim(),
                  suggestion: `Fix HTML violation in ${currentFile} at line ${match[1]}`
                });
                break;
              }
            }
          }
        }
      }
    }
  }

  /**
   * Parse Python Flake8 violations (SOLID: Single Responsibility)
   * Format: "backend/app/models/__init__.py:1:1: F403 'from .auth import *' used; unable to detect undefined names"
   */
  _parsePythonFlake8(logContent, results) {
    const lines = logContent.split('\n');
    
    for (const line of lines) {
      // Parse flake8 format: file:line:column: CODE message
      const match = line.match(/^(.+?):(\d+):(\d+):\s+([A-Z]\d+)\s+(.+)$/);
      if (match) {
        results.violations.push({
          type: 'violation',
          category: 'Python Quality',
          file: match[1],
          line: parseInt(match[2]),
          column: parseInt(match[3]),
          rule: match[4], // F403, E501, etc.
          message: match[5].trim(),
          suggestion: `Fix Python Flake8 violation in ${match[1]} at line ${match[2]}`
        });
      }
    }
  }

  /**
   * Parse Python MyPy violations (SOLID: Single Responsibility)
   * Format: "backend/app/models/config.py:13: error: Variable \"app.models.config.Base\" is not valid as a type  [valid-type]"
   */
  _parsePythonMypy(logContent, results) {
    const lines = logContent.split('\n');
    
    for (const line of lines) {
      // Parse mypy format: file:line: error: message [rule-name]
      const match = line.match(/^(.+?):(\d+):\s+(error|warning|note):\s+(.+?)\s+\[([^\]]+)\]$/);
      if (match && match[3] === 'error') { // Only process errors, skip notes
        results.violations.push({
          type: 'violation',
          category: 'Python Types',
          file: match[1],
          line: parseInt(match[2]),
          column: null,
          rule: match[5], // valid-type, misc, etc.
          message: match[4].trim(),
          suggestion: `Fix Python MyPy type error in ${match[1]} at line ${match[2]}`
        });
      }
    }
  }

  _parseJavaScriptESLint(logContent, results) {
    // TODO: Implement JavaScript ESLint parser when needed  
  }

  _parseTypeScriptESLint(logContent, results) {
    // TODO: Implement TypeScript ESLint parser when needed
  }
}

module.exports = MegaLinterReporter;