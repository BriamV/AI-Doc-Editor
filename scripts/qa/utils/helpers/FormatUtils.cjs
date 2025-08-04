/**
 * FormatUtils - Single Responsibility: Common formatting utilities
 * Extracted from QALogger for SOLID compliance (RNF-001 ≤212 LOC)
 * 
 * Responsibilities:
 * - Duration formatting
 * - Path formatting and normalization
 * - Common text formatting operations
 * - Reusable formatting helpers
 */

class FormatUtils {
  /**
   * Format duration in human-readable format
   */
  static formatDuration(milliseconds) {
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
  static getRelativePath(filePath) {
    if (!filePath) return 'unknown';
    const cwd = process.cwd();
    if (filePath.startsWith(cwd)) {
      return filePath.substring(cwd.length + 1).replace(/\\/g, '/');
    }
    return filePath.replace(/\\/g, '/');
  }

  /**
   * Format file size in human-readable format
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Truncate text to specified length with ellipsis
   */
  static truncateText(text, maxLength = 80) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Normalize line endings for consistent display
   */
  static normalizeLineEndings(text) {
    return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  /**
   * Format number with thousands separator
   */
  static formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /**
   * Calculate percentage and format it
   */
  static formatPercentage(numerator, denominator, decimals = 1) {
    if (denominator === 0) return '0%';
    const percentage = (numerator / denominator) * 100;
    return `${percentage.toFixed(decimals)}%`;
  }
}

module.exports = FormatUtils;