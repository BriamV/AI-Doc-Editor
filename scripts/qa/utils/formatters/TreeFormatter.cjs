/**
 * TreeFormatter - Single Responsibility: Format QA results as tree structure
 * Extracted from QALogger for SOLID compliance (RNF-001 ≤212 LOC)
 * 
 * Responsibilities:
 * - PRD RF-006 compliant tree structure generation
 * - File-level violation grouping and display
 * - Dimension status display with proper symbols
 * - Tree hierarchy with ├── └── │ characters
 */

const ViolationAnalyzer = require('../analyzers/ViolationAnalyzer.cjs');

class TreeFormatter {
  constructor(logger) {
    this.logger = logger;
    this.violationAnalyzer = new ViolationAnalyzer();
  }

  /**
   * Format QA results as tree structure (RF-006 PRD Compliant)
   * Displays concise, actionable file-level violations with tree hierarchy
   */
  formatAsTree(results) {
    this.logger.info(this.logger.colorize('[MOTOR DE VALIDACIÓN]', 'bright'));
    this.logger.currentLevel++;
    
    for (const result of results) {
      this._formatDimension(result);
    }
    
    this.logger.currentLevel--;
  }

  /**
   * Format individual dimension with its tools and violations
   */
  _formatDimension(result) {
    // Display dimension execution header
    const dimensionSymbol = '⚙️';
    this.logger._safeConsoleLog(
      `${this.logger.getTimestamp()}${this.logger.getIndentation()}├── [${dimensionSymbol}] Ejecutando Dimensión: ${result.dimension}...`
    );
    
    // Track if dimension has any violations for proper status display
    let dimensionHasErrors = false;
    let dimensionHasWarnings = false;
    
    this.logger.currentLevel++;
    
    if (result.items && result.items.length > 0) {
      for (const item of result.items) {
        const itemResults = this._processToolItem(item);
        dimensionHasErrors = dimensionHasErrors || itemResults.hasErrors;
        dimensionHasWarnings = dimensionHasWarnings || itemResults.hasWarnings;
      }
      
      // Show tool completion summary
      this._formatToolCompletionSummary(result);
    }
    
    this.logger.currentLevel--;
    
    // Display dimension completion status
    this._formatDimensionStatus(result, dimensionHasErrors, dimensionHasWarnings);
  }

  /**
   * Process individual tool item and display violations
   */
  _processToolItem(item) {
    let hasErrors = false;
    let hasWarnings = false;

    if (item.details && item.details.violations && item.details.violations.length > 0) {
      const violationsByFile = this.violationAnalyzer.groupViolationsByFile(item.details.violations);
      
      for (const [filePath, violations] of Object.entries(violationsByFile)) {
        const fileResults = this._formatFileViolations(filePath, violations, item.tool || 'unknown');
        hasErrors = hasErrors || fileResults.hasErrors;
        hasWarnings = hasWarnings || fileResults.hasWarnings;
      }
    } else if (!item.success) {
      // Tool failed but no specific violations - show generic error
      hasErrors = true;
      this.logger._safeConsoleLog(
        `${this.logger.getTimestamp()}${this.logger.getIndentation()}│   ├── ❌ ERROR: ${item.tool || item.message}`
      );
      if (item.error) {
        this.logger._safeConsoleLog(
          `${this.logger.getTimestamp()}${this.logger.getIndentation()}│   │   └── ${item.error}`
        );
      }
    }

    return { hasErrors, hasWarnings };
  }

  /**
   * Format violations for a specific file
   */
  _formatFileViolations(filePath, violations, toolName) {
    // Determine file-level status (error takes precedence over warning)
    const hasFileErrors = violations.some(v => v.severity === 'error');
    const hasFileWarnings = violations.some(v => v.severity === 'warning');
    
    // Display file header with appropriate status
    const fileSymbol = hasFileErrors ? '❌' : (hasFileWarnings ? '🟡' : '✅');
    const fileStatus = hasFileErrors ? 'ERROR' : (hasFileWarnings ? 'WARNING' : 'OK');
    
    this.logger._safeConsoleLog(
      `${this.logger.getTimestamp()}${this.logger.getIndentation()}│   ├── ${fileSymbol} ${fileStatus}: ${this._getRelativePath(filePath)}`
    );
    
    // Display summarized violations for this file (PRD RF-006 compliant)
    this.logger.currentLevel++;
    const summarizedViolations = this.violationAnalyzer.summarizeViolations(violations, toolName);
    
    for (let i = 0; i < summarizedViolations.length; i++) {
      const summary = summarizedViolations[i];
      const isLast = i === summarizedViolations.length - 1;
      const violationPrefix = isLast ? '│   │   └──' : '│   │   ├──';
      
      this.logger._safeConsoleLog(
        `${this.logger.getTimestamp()}${this.logger.getIndentation()}${violationPrefix} ${summary}`
      );
    }
    this.logger.currentLevel--;

    return { hasErrors: hasFileErrors, hasWarnings: hasFileWarnings };
  }

  /**
   * Format tool completion summary
   */
  _formatToolCompletionSummary(result) {
    const toolCount = result.items.length;
    const completionTime = result.duration || 0;
    
    this.logger._safeConsoleLog(
      `${this.logger.getTimestamp()}${this.logger.getIndentation()}│   └── Revisión completada (${toolCount} herramienta${toolCount > 1 ? 's' : ''} en ${this._formatDuration(completionTime)})`
    );
  }

  /**
   * Format dimension completion status
   */
  _formatDimensionStatus(result, dimensionHasErrors, dimensionHasWarnings) {
    const dimensionStatus = dimensionHasErrors ? 'Fallida' : 
                          dimensionHasWarnings ? 'Completada con advertencias' :
                          'Completada';
    const dimensionStatusSymbol = dimensionHasErrors ? '❌' : 
                          dimensionHasWarnings ? '🟡' :
                          '✅';
    const dimensionDuration = result.duration ? ` en ${this._formatDuration(result.duration)}` : '';
    
    this.logger._safeConsoleLog(
      `${this.logger.getTimestamp()}${this.logger.getIndentation()}├── ${dimensionStatusSymbol} Dimensión: ${result.dimension} (${dimensionStatus}${dimensionDuration})`
    );
    this.logger._safeConsoleLog(
      `${this.logger.getTimestamp()}${this.logger.getIndentation()}│`
    );
  }

  /**
   * Get relative path from current working directory
   */
  _getRelativePath(filePath) {
    if (!filePath) return 'unknown';
    const cwd = process.cwd();
    if (filePath.startsWith(cwd)) {
      return filePath.substring(cwd.length + 1).replace(/\\/g, '/');
    }
    return filePath.replace(/\\/g, '/');
  }

  /**
   * Format duration in human-readable format
   */
  _formatDuration(milliseconds) {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(milliseconds / 60000);
      const seconds = Math.floor((milliseconds % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
  }
}

module.exports = TreeFormatter;