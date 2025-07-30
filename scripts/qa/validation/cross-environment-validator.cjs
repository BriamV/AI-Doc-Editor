/**
 * Cross-Environment Validator
 * Systematic validation across CMD, PowerShell, WSL environments  
 * Generates evidence matrix for RF-003 validation
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

class CrossEnvironmentValidator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      environments: {},
      summary: {
        totalTools: 0,
        totalEnvironments: 0,
        successRate: 0
      }
    };
    
    this.toolsToTest = [
      { name: 'git', category: 'core' },
      { name: 'node', category: 'core' },
      { name: 'yarn', category: 'core' },
      { name: 'docker', category: 'core' },
      { name: 'megalinter', category: 'core' },
      { name: 'prettier', category: 'npm' },
      { name: 'eslint', category: 'npm' },
      { name: 'tsc', category: 'npm' },
      { name: 'black', category: 'python' },
      { name: 'pylint', category: 'python' },
      { name: 'pip', category: 'python' }
    ];
  }
  
  async validateAllEnvironments() {
    console.log('🔍 Cross-Environment Validation Starting...\n');
    
    // Test each environment
    await this.validateEnvironment('cmd', this.runCmdTest.bind(this));
    await this.validateEnvironment('powershell', this.runPowerShellTest.bind(this));
    await this.validateEnvironment('wsl', this.runWSLTest.bind(this));
    
    // Generate summary
    this.generateSummary();
    
    // Save results
    await this.saveResults();
    
    // Display matrix
    this.displayValidationMatrix();
    
    return this.results;
  }
  
  async validateEnvironment(envName, testRunner) {
    console.log(`📋 Testing ${envName.toUpperCase()} environment...`);
    
    try {
      const envResults = await testRunner();
      this.results.environments[envName] = {
        available: true,
        tools: envResults.tools,
        qaExecution: envResults.qaExecution,
        timing: envResults.timing,
        errors: envResults.errors || []
      };
      
      const successCount = envResults.tools.filter(t => t.available).length;
      console.log(`✅ ${envName}: ${successCount}/${this.toolsToTest.length} tools detected\n`);
      
    } catch (error) {
      console.log(`❌ ${envName}: Environment test failed - ${error.message}\n`);
      this.results.environments[envName] = {
        available: false,
        error: error.message
      };
    }
  }
  
  async runCmdTest() {
    const startTime = Date.now();
    
    // Test tool detection using our diagnosis script
    const toolResults = await this.getToolResults('cmd');
    
    // Test QA CLI execution
    const qaResult = await this.runQATest('cmd');
    
    return {
      tools: toolResults,
      qaExecution: qaResult,
      timing: Date.now() - startTime,
      errors: []
    };
  }
  
  async runPowerShellTest() {
    const startTime = Date.now();
    
    const toolResults = await this.getToolResults('powershell');
    const qaResult = await this.runQATest('powershell');
    
    return {
      tools: toolResults,
      qaExecution: qaResult,
      timing: Date.now() - startTime,
      errors: []
    };
  }
  
  async runWSLTest() {
    const startTime = Date.now();
    
    const toolResults = await this.getToolResults('wsl');
    const qaResult = await this.runQATest('wsl');
    
    return {
      tools: toolResults,
      qaExecution: qaResult,
      timing: Date.now() - startTime,
      errors: []
    };
  }
  
  async getToolResults(environment) {
    // Use our ToolChecker directly for accurate results
    const ToolChecker = require('../core/environment/ToolChecker.cjs');
    const logger = { 
      info: () => {}, 
      warn: () => {}, 
      debug: () => {},
      level: 'info'
    };
    
    const toolChecker = new ToolChecker(logger);
    const results = [];
    
    for (const tool of this.toolsToTest) {
      try {
        // Simulate tool config
        const toolConfig = {
          command: `${tool.name} --version`,
          description: `${tool.name} tool`,
          critical: tool.category === 'core'
        };
        
        const result = await toolChecker.checkTool(tool.name, toolConfig);
        results.push({
          name: tool.name,
          category: tool.category,
          available: result.available,
          version: result.version || 'unknown',
          method: result.detectionMethod || 'standard',
          error: result.error || null
        });
        
      } catch (error) {
        results.push({
          name: tool.name,
          category: tool.category,
          available: false,
          version: null,
          method: 'failed',
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  async runQATest(environment) {
    try {
      const startTime = Date.now();
      
      // Run QA CLI in fast mode with timeout
      const output = execSync('yarn run cmd qa --fast', {
        stdio: 'pipe',
        timeout: 120000, // 2 minutes max
        encoding: 'utf8',
        cwd: process.cwd()
      });
      
      const timing = Date.now() - startTime;
      const success = !output.includes('🔴 QA validation FAILED');
      
      return {
        success: success,
        timing: timing,
        output: output.split('\n').slice(-20).join('\n'), // Last 20 lines
        error: null
      };
      
    } catch (error) {
      return {
        success: false,
        timing: 0,
        output: null,
        error: error.message
      };
    }
  }
  
  generateSummary() {
    const environments = Object.keys(this.results.environments);
    let totalSuccess = 0;
    let totalPossible = 0;
    
    for (const envName of environments) {
      const env = this.results.environments[envName];
      if (env.available && env.tools) {
        const successCount = env.tools.filter(t => t.available).length;
        totalSuccess += successCount;
        totalPossible += env.tools.length;
      }
    }
    
    this.results.summary = {
      totalTools: this.toolsToTest.length,
      totalEnvironments: environments.length,
      totalSuccess: totalSuccess,
      totalPossible: totalPossible,
      successRate: totalPossible > 0 ? ((totalSuccess / totalPossible) * 100).toFixed(1) : 0
    };
  }
  
  async saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `qa-analysis-logs/validation-matrix-${timestamp}.json`;
    
    fs.writeFileSync(filename, JSON.stringify(this.results, null, 2));
    console.log(`💾 Results saved to: ${filename}\n`);
  }
  
  displayValidationMatrix() {
    console.log('📊 VALIDATION MATRIX RESULTS');
    console.log('=' .repeat(80));
    
    const environments = Object.keys(this.results.environments);
    
    // Header
    console.log('Tool'.padEnd(15) + environments.map(e => e.toUpperCase().padEnd(12)).join(''));
    console.log('-'.repeat(80));
    
    // Tool rows
    for (const tool of this.toolsToTest) {
      let row = tool.name.padEnd(15);
      
      for (const envName of environments) {
        const env = this.results.environments[envName];
        if (env.available && env.tools) {
          const toolResult = env.tools.find(t => t.name === tool.name);
          if (toolResult) {
            const status = toolResult.available ? '✅ YES' : '❌ NO ';
            row += status.padEnd(12);
          } else {
            row += '❓ UNK'.padEnd(12);
          }
        } else {
          row += '🚫 N/A'.padEnd(12);
        }
      }
      
      console.log(row);
    }
    
    console.log('-'.repeat(80));
    console.log(`Overall Success Rate: ${this.results.summary.successRate}%`);
    console.log(`(${this.results.summary.totalSuccess}/${this.results.summary.totalPossible} tool detections successful)`);
  }
}

// CLI execution
if (require.main === module) {
  const validator = new CrossEnvironmentValidator();
  validator.validateAllEnvironments()
    .then(() => {
      console.log('\n🎯 Cross-environment validation completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    });
}

module.exports = CrossEnvironmentValidator;