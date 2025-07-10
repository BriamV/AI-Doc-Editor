/**
 * Snyk Reporter - Single Responsibility: Result processing
 * Extracted from SnykWrapper for SOLID compliance
 */

class SnykReporter {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }
  
  /**
   * Process Snyk results
   */
  processResults(result, tool) {
    const processed = {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      vulnerabilities: [],
      summary: {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      warnings: [],
      errors: []
    };
    
    // Parse JSON output
    this._parseJsonOutput(result.stdout, processed);
    
    // Add errors based on exit code
    this._processExitCode(result, processed);
    
    // Check critical vulnerabilities
    this._checkCriticalVulnerabilities(processed);
    
    return processed;
  }
  
  /**
   * Parse JSON output from Snyk
   */
  _parseJsonOutput(stdout, processed) {
    try {
      if (stdout) {
        const snykOutput = JSON.parse(stdout);
        
        if (snykOutput.vulnerabilities) {
          processed.vulnerabilities = snykOutput.vulnerabilities;
          
          // Count by severity
          for (const vuln of snykOutput.vulnerabilities) {
            const severity = vuln.severity || 'low';
            processed.summary[severity]++;
            processed.summary.total++;
          }
        }
        
        // Check for other Snyk output formats
        if (snykOutput.issues) {
          processed.vulnerabilities = snykOutput.issues;
          processed.summary.total = snykOutput.issues.length;
        }
      }
    } catch (error) {
      processed.warnings.push('Could not parse Snyk JSON output');
      this._extractBasicInfo(processed);
    }
  }
  
  /**
   * Extract basic info from stderr when JSON parsing fails
   */
  _extractBasicInfo(processed) {
    if (processed.stderr) {
      const vulnerabilityMatch = processed.stderr.match(/(\d+) vulnerabilities/);
      if (vulnerabilityMatch) {
        processed.summary.total = parseInt(vulnerabilityMatch[1]);
      }
    }
  }
  
  /**
   * Process exit code and add appropriate errors
   */
  _processExitCode(result, processed) {
    if (result.exitCode !== 0) {
      if (result.exitCode === 1 && processed.summary.total > 0) {
        // Exit code 1 with vulnerabilities is expected
        processed.warnings.push(`Found ${processed.summary.total} vulnerabilities`);
      } else {
        processed.errors.push(result.stderr || 'Snyk scan failed');
      }
    }
  }
  
  /**
   * Check for critical vulnerabilities
   */
  _checkCriticalVulnerabilities(processed) {
    const criticalCount = processed.summary.critical + processed.summary.high;
    const failOnVulnerabilities = this.config.get('security.failOnVulnerabilities', true);
    
    if (criticalCount > 0 && failOnVulnerabilities) {
      processed.errors.push(`Found ${criticalCount} critical/high severity vulnerabilities`);
    }
  }
}

module.exports = SnykReporter;