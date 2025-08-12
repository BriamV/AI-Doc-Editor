/**
 * SummaryFormatter - Single Responsibility: Format final validation summaries
 * Extracted from QALogger for SOLID compliance (RNF-001 ≤212 LOC)
 * 
 * Responsibilities:
 * - Final summary generation with overall status
 * - Statistics calculation and display
 * - File problem listing for actionable feedback
 * - Duration formatting and display
 */

class SummaryFormatter {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Format final validation summary (RF-006 PRD Compliant)
   */
  formatSummary(stats, startTime) {
    const duration = Date.now() - startTime;
    const durationStr = this._formatDuration(duration);
    
    this.logger._safeConsoleLog('');
    this.logger._safeConsoleLog(
      this.logger.colorize('[RESUMEN FINAL]', 'bright') + ` (Duración total: ${durationStr})`
    );
    
    // Determine overall status
    const overallStatus = stats.failed > 0 ? 'FALLIDA' : 
                         stats.warnings > 0 ? 'COMPLETADA CON ADVERTENCIAS' : 
                         'EXITOSA';
    const statusSymbol = stats.failed > 0 ? '❌' : 
                        stats.warnings > 0 ? '🟡' : 
                        '✅';
    
    this.logger._safeConsoleLog(`└── ${statusSymbol} VALIDACIÓN ${overallStatus}`);
    
    // Show detailed metrics if there are issues
    if (stats.failed > 0 || stats.warnings > 0) {
      this._formatDetailedMetrics(stats);
    }
  }

  /**
   * Format detailed metrics when there are issues
   */
  _formatDetailedMetrics(stats) {
    this.logger._safeConsoleLog('');
    this.logger._safeConsoleLog('     • ' + this.logger.colorize(`Errores: ${stats.failed || 0}`, 'red'));
    this.logger._safeConsoleLog('     • ' + this.logger.colorize(`Advertencias: ${stats.warnings || 0}`, 'yellow'));
    
    // Show actionable file summary (if available)
    if (stats.filesWithProblems && stats.filesWithProblems.length > 0) {
      this._formatFilesWithProblems(stats.filesWithProblems);
    }
    
    this.logger._safeConsoleLog('');
    if (stats.failed > 0) {
      this.logger._safeConsoleLog('     ' + this.logger.colorize('Revisa los errores críticos para poder continuar.', 'red'));
    } else {
      this.logger._safeConsoleLog('     ' + this.logger.colorize('Considera abordar las advertencias encontradas.', 'yellow'));
    }
  }

  /**
   * Format files with problems for actionable feedback
   */
  _formatFilesWithProblems(filesWithProblems) {
    this.logger._safeConsoleLog('');
    this.logger._safeConsoleLog('     Archivos con problemas:');
    
    for (const fileInfo of filesWithProblems) {
      const fileSymbol = fileInfo.errors > 0 ? '❌' : '🟡';
      const problemCount = fileInfo.errors > 0 ? 
        `${fileInfo.errors} error${fileInfo.errors > 1 ? 'es' : ''}` :
        `${fileInfo.warnings} advertencia${fileInfo.warnings > 1 ? 's' : ''}`;
      
      this.logger._safeConsoleLog(
        `     - ${fileSymbol} ${this._getRelativePath(fileInfo.file)} (${problemCount})`
      );
    }
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
   * Calculate completion rate for CI/CD integration
   */
  calculateCompletionRate(summary) {
    if (summary.total === 0) return 0;
    return Math.round((summary.passed / summary.total) * 100);
  }

  /**
   * Get overall status from summary
   */
  getOverallStatus(summary) {
    if (summary.failed > 0) return 'failed';
    if (summary.warnings > 0) return 'warning';
    if (summary.passed > 0) return 'passed';
    return 'unknown';
  }

  /**
   * Get exit code for CI/CD integration
   * Industry standard: 0 for success/warnings, 1 for failures
   */
  getExitCode(summary) {
    return summary.failed > 0 ? 1 : 0;
  }
}

module.exports = SummaryFormatter;