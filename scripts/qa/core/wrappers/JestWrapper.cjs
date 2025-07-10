/**
 * Jest Wrapper - T-08: Testing & Coverage for JavaScript/TypeScript
 * Executes Jest tests in specific scopes and captures coverage results
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class JestWrapper {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    // Jest configuration
    this.jestConfig = {
      timeout: config.get('testing.timeout', 300000), // 5 minutes
      coverageThreshold: config.get('testing.coverage.threshold', 80),
      coverageDirectory: config.get('testing.coverage.directory', 'coverage'),
      testMatch: config.get('testing.jest.testMatch', ['**/__tests__/**/*.test.js', '**/*.test.js', '**/*.spec.js'])
    };
  }
  
  /**
   * Execute Jest tests with coverage
   */
  async execute(tool) {
    const startTime = Date.now();
    
    try {
      this.logger.info(`Executing Jest for ${tool.name} (${tool.dimension})`);
      
      // Build Jest command with coverage
      const command = await this._buildJestCommand(tool);
      
      // Execute Jest
      const result = await this._executeJest(command);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Process Jest results
      const processedResults = await this._processJestResults(result, tool);
      
      this.logger.info(`Jest execution completed for ${tool.name} in ${executionTime}ms`);
      
      return {
        success: result.exitCode === 0,
        tool: tool.name,
        dimension: tool.dimension,
        executionTime: executionTime,
        results: processedResults,
        warnings: processedResults.warnings || [],
        errors: processedResults.errors || []
      };
      
    } catch (error) {
      this.logger.error(`Jest execution failed for ${tool.name}: ${error.message}`);
      
      return {
        success: false,
        tool: tool.name,
        dimension: tool.dimension,
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * Build Jest command with appropriate flags
   */
  async _buildJestCommand(tool) {
    const command = ['npx', 'jest'];
    
    // Add coverage flags
    command.push('--coverage');
    command.push('--coverageReporters=json', '--coverageReporters=text');
    
    // Add scope-specific patterns
    if (tool.config.scope) {
      const scopePatterns = this._getScopePatterns(tool.config.scope);
      if (scopePatterns.length > 0) {
        command.push('--testPathPattern', scopePatterns.join('|'));
      }
    }
    
    // Add configuration file if exists
    const configFile = await this._findJestConfig();
    if (configFile) {
      command.push('--config', configFile);
    }
    
    // Add tool-specific arguments
    if (tool.config?.args && tool.config.args.length > 0) {
      command.push(...tool.config.args);
    }
    
    // Force non-interactive mode
    command.push('--passWithNoTests', '--silent');
    
    return command;
  }
  
  /**
   * Get test patterns for specific scope
   */
  _getScopePatterns(scope) {
    const patterns = {
      frontend: ['src/**/*.test.js', 'src/**/*.spec.js', 'components/**/*.test.js'],
      backend: ['api/**/*.test.js', 'server/**/*.test.js', 'lib/**/*.test.js'],
      infrastructure: ['scripts/**/*.test.js', 'tools/**/*.test.js'],
      all: this.jestConfig.testMatch
    };
    
    return patterns[scope] || patterns.all;
  }
  
  /**
   * Find Jest configuration file
   */
  async _findJestConfig() {
    const configFiles = [
      'jest.config.js',
      'jest.config.json',
      'jest.config.ts',
      'package.json'
    ];
    
    for (const file of configFiles) {
      try {
        const filePath = path.join(process.cwd(), file);
        await fs.access(filePath);
        
        // For package.json, check if it has jest config
        if (file === 'package.json') {
          const packageJson = JSON.parse(await fs.readFile(filePath, 'utf8'));
          if (packageJson.jest) {
            return filePath;
          }
        } else {
          return filePath;
        }
      } catch (error) {
        // File doesn't exist, continue
      }
    }
    
    return null;
  }
  
  /**
   * Execute Jest command
   */
  async _executeJest(command) {
    return new Promise((resolve, reject) => {
      const childProcess = spawn(command[0], command.slice(1), {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: this.jestConfig.timeout,
        cwd: process.cwd()
      });
      
      let stdout = '';
      let stderr = '';
      
      childProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      childProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      childProcess.on('close', (code) => {
        resolve({
          exitCode: code,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
      });
      
      childProcess.on('error', (error) => {
        reject(error);
      });
    });
  }
  
  /**
   * Process Jest results and extract coverage info
   */
  async _processJestResults(result, tool) {
    const processed = {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      tests: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      },
      coverage: {
        overall: 0,
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0
      },
      warnings: [],
      errors: []
    };
    
    // Parse Jest output for test results
    this._parseTestResults(result.stdout, processed);
    
    // Try to read coverage report
    try {
      const coveragePath = path.join(process.cwd(), this.jestConfig.coverageDirectory, 'coverage-summary.json');
      const coverageData = await fs.readFile(coveragePath, 'utf8');
      const coverage = JSON.parse(coverageData);
      
      if (coverage.total) {
        processed.coverage.statements = coverage.total.statements.pct;
        processed.coverage.branches = coverage.total.branches.pct;
        processed.coverage.functions = coverage.total.functions.pct;
        processed.coverage.lines = coverage.total.lines.pct;
        processed.coverage.overall = Math.round(
          (processed.coverage.statements + processed.coverage.branches + 
           processed.coverage.functions + processed.coverage.lines) / 4
        );
      }
    } catch (error) {
      processed.warnings.push('Could not read coverage report');
    }
    
    // Check coverage threshold
    if (processed.coverage.overall < this.jestConfig.coverageThreshold) {
      processed.warnings.push(`Coverage ${processed.coverage.overall}% below threshold ${this.jestConfig.coverageThreshold}%`);
    }
    
    // Add errors if tests failed
    if (result.exitCode !== 0) {
      processed.errors.push(result.stderr || 'Jest tests failed');
    }
    
    return processed;
  }
  
  /**
   * Parse Jest console output for test statistics
   */
  _parseTestResults(stdout, processed) {
    // Parse Jest output patterns
    const testSuitePattern = /Test Suites: (\d+) passed, (\d+) total/;
    const testPattern = /Tests:\s+(\d+) passed, (\d+) total/;
    const failedTestPattern = /Tests:\s+(\d+) failed, (\d+) passed, (\d+) total/;
    
    // Extract test suite info
    const suiteMatch = stdout.match(testSuitePattern);
    if (suiteMatch) {
      processed.tests.total = parseInt(suiteMatch[2]);
      processed.tests.passed = parseInt(suiteMatch[1]);
    }
    
    // Extract test info
    const testMatch = stdout.match(testPattern);
    const failedMatch = stdout.match(failedTestPattern);
    
    if (failedMatch) {
      processed.tests.failed = parseInt(failedMatch[1]);
      processed.tests.passed = parseInt(failedMatch[2]);
      processed.tests.total = parseInt(failedMatch[3]);
    } else if (testMatch) {
      processed.tests.passed = parseInt(testMatch[1]);
      processed.tests.total = parseInt(testMatch[2]);
    }
  }
  
  /**
   * Get wrapper capabilities
   */
  getCapabilities() {
    return {
      supportedTools: ['jest'],
      supportedDimensions: ['test'],
      fastModeSupported: true,
      parallelExecutionSupported: true,
      reportFormats: ['console', 'json', 'coverage'],
      coverageSupported: true
    };
  }
}

module.exports = JestWrapper;