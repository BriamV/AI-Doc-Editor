/**
 * Semgrep Reporter - Single Responsibility: Result processing
 * Extracted from SemgrepWrapper for SOLID compliance
 */

class SemgrepReporter {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }
  
  /**
   * Process Semgrep results
   */
  processResults(result, tool) {
    const processed = {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      findings: [],
      summary: {
        total: 0,
        critical: 0,
        error: 0,
        warning: 0,
        info: 0
      },
      warnings: [],
      errors: []
    };
    
    // Parse JSON output
    this._parseJsonOutput(result.stdout, processed);
    
    // Process errors from Semgrep output
    this._processErrors(result, processed);
    
    // Add errors based on exit code
    this._processExitCode(result, processed);
    
    // Check critical findings
    this._checkCriticalFindings(processed);
    
    return processed;
  }
  
  /**
   * Parse JSON output from Semgrep
   */
  _parseJsonOutput(stdout, processed) {
    try {
      if (stdout) {
        const semgrepOutput = JSON.parse(stdout);
        
        if (semgrepOutput.results) {
          processed.findings = semgrepOutput.results;
          
          // Count by severity
          for (const finding of semgrepOutput.results) {
            const severity = finding.extra?.severity || 'info';
            const severityLower = severity.toLowerCase();
            
            if (processed.summary[severityLower] !== undefined) {
              processed.summary[severityLower]++;
            }
            processed.summary.total++;
          }
        }
      }
    } catch (error) {
      processed.warnings.push('Could not parse Semgrep JSON output');
      this._extractBasicInfo(processed);
    }
  }
  
  /**
   * Extract basic info from stderr when JSON parsing fails
   */
  _extractBasicInfo(processed) {
    if (processed.stderr) {
      const findingMatch = processed.stderr.match(/(\d+) findings/);
      if (findingMatch) {
        processed.summary.total = parseInt(findingMatch[1]);
      }
    }
  }
  
  /**
   * Process errors in Semgrep output
   */
  _processErrors(result, processed) {
    try {
      if (result.stdout) {
        const semgrepOutput = JSON.parse(result.stdout);
        if (semgrepOutput.errors && semgrepOutput.errors.length > 0) {
          for (const error of semgrepOutput.errors) {
            processed.warnings.push(`Semgrep error: ${error.message || error}`);
          }
        }
      }
    } catch (error) {
      // JSON parsing already handled
    }
  }
  
  /**
   * Process exit code and add appropriate errors
   */
  _processExitCode(result, processed) {
    if (result.exitCode !== 0) {
      if (result.exitCode === 1 && processed.summary.total > 0) {
        // Exit code 1 with findings is expected
        processed.warnings.push(`Found ${processed.summary.total} security findings`);
      } else if (result.exitCode === 2) {
        processed.errors.push('Semgrep configuration error');
      } else {
        processed.errors.push(result.stderr || 'Semgrep scan failed');
      }
    }
  }
  
  /**
   * Check for critical findings
   */
  _checkCriticalFindings(processed) {
    const criticalCount = processed.summary.critical + processed.summary.error;
    const failOnVulnerabilities = this.config.get('security.failOnVulnerabilities', true);
    
    if (criticalCount > 0 && failOnVulnerabilities) {
      processed.errors.push(`Found ${criticalCount} critical/error severity findings`);
    }
  }
}

module.exports = SemgrepReporter;