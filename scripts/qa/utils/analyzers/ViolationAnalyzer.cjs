/**
 * ViolationAnalyzer - Single Responsibility: Analyze and summarize violations
 * Extracted from QALogger for SOLID compliance (RNF-001 ≤212 LOC)
 * 
 * Responsibilities:
 * - Violation summarization for PRD RF-006 compliance
 * - Tool-specific message creation
 * - Line range grouping for concise reporting
 * - Violation type classification
 */

class ViolationAnalyzer {
  constructor() {
    // Tool-specific summary rules
    this.toolRules = {
      prettier: 'Formato incorrecto - ejecutar Prettier para corregir',
      'no-unused-vars': (message) => {
        const varMatch = message.match(/'([^']+)'/);
        const varName = varMatch ? varMatch[1] : 'variable';
        return `La variable '${varName}' se asigna pero nunca se usa`;
      },
      'max-len': 'Línea excede el límite máximo de longitud (100 caracteres)',
      'complexity': (message) => {
        const complexityMatch = message.match(/complexity of (\d+)/);
        const complexity = complexityMatch ? complexityMatch[1] : 'alta';
        return `Complejidad ciclomática demasiado alta (${complexity})`;
      },
      'max-lines': 'Archivo excede el límite máximo de líneas (212)'
    };
  }

  /**
   * Main method: Summarize violations to be concise and actionable (RF-006 PRD Compliant)
   * Filters verbose tool output to show only essential information
   */
  summarizeViolations(violations, toolName) {
    const summaries = [];
    
    // Group violations by type for concise reporting
    const violationGroups = this._groupViolationsByType(violations, toolName);
    
    for (const group of violationGroups) {
      if (group.count === 1) {
        // Single violation - show line detail per PRD specification
        const violation = group.violations[0];
        let message = '';
        if (violation.line) {
          message = `Línea ${violation.line}${violation.column ? `:${violation.column}` : ''}: ${group.summary}`;
          if (violation.ruleId && !group.summary.includes(violation.ruleId)) {
            message += ` (${violation.ruleId}).`;
          }
        } else {
          message = group.summary;
        }
        summaries.push(message);
      } else {
        // Multiple similar violations - show count summary
        const lineRanges = this._getLineRanges(group.violations);
        summaries.push(`Líneas ${lineRanges}: ${group.summary} (${group.count} ocurrencias).`);
      }
    }
    
    return summaries;
  }

  /**
   * Group violations by type for concise summary
   */
  _groupViolationsByType(violations, toolName) {
    const groups = new Map();
    
    for (const violation of violations) {
      // Create concise summary based on tool and rule
      const summary = this._createViolationSummary(violation, toolName);
      const key = `${violation.ruleId || 'unknown'}-${summary}`;
      
      if (!groups.has(key)) {
        groups.set(key, {
          ruleId: violation.ruleId,
          summary: summary,
          count: 0,
          violations: []
        });
      }
      
      const group = groups.get(key);
      group.count++;
      group.violations.push(violation);
    }
    
    return Array.from(groups.values());
  }

  /**
   * Create concise violation summary based on tool and rule type
   */
  _createViolationSummary(violation, toolName) {
    const ruleId = violation.ruleId || '';
    const message = violation.message || '';
    
    // Tool-specific summaries for common rules
    if (toolName === 'prettier' || ruleId === 'prettier/prettier') {
      return this.toolRules.prettier;
    }
    
    if (ruleId === 'no-unused-vars') {
      return this.toolRules['no-unused-vars'](message);
    }
    
    if (ruleId === 'max-len') {
      return this.toolRules['max-len'];
    }
    
    if (ruleId === 'complexity') {
      return this.toolRules['complexity'](message);
    }
    
    if (ruleId === 'max-lines') {
      return this.toolRules['max-lines'];
    }
    
    // For other rules, use the original message but make it concise
    if (message.length > 80) {
      return message.substring(0, 77) + '...';
    }
    
    return message;
  }

  /**
   * Get line ranges for multiple violations
   */
  _getLineRanges(violations) {
    const lines = violations
      .map(v => v.line)
      .filter(line => line)
      .sort((a, b) => a - b);
    
    if (lines.length === 0) return 'múltiples';
    if (lines.length === 1) return lines[0].toString();
    
    // Create ranges like "4-8, 15, 20-25"
    const ranges = [];
    let start = lines[0];
    let end = start;
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i] === end + 1) {
        end = lines[i];
      } else {
        ranges.push(start === end ? start.toString() : `${start}-${end}`);
        start = end = lines[i];
      }
    }
    ranges.push(start === end ? start.toString() : `${start}-${end}`);
    
    return ranges.join(', ');
  }

  /**
   * Group violations by file path for organized display
   */
  groupViolationsByFile(violations) {
    const grouped = {};
    for (const violation of violations) {
      const filePath = violation.file || 'unknown';
      if (!grouped[filePath]) {
        grouped[filePath] = [];
      }
      grouped[filePath].push(violation);
    }
    return grouped;
  }
}

module.exports = ViolationAnalyzer;