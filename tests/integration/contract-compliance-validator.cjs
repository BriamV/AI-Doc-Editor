/**
 * Interface Contract Compliance Validator
 *
 * This module provides utilities to validate that scripts/ and tools/ directories
 * comply with the established interface contracts defined in:
 * - docs/architecture/INTERFACE-CONTRACTS.md
 *
 * Features:
 * - Contract signature validation
 * - Data format compliance checking
 * - Error code consistency verification
 * - Response format validation
 * - Performance threshold monitoring
 */

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Import error handling for contract validation
const { ErrorCodes, createError } = require('../../scripts/lib/error-codes.cjs');

class ContractComplianceValidator {
  constructor(options = {}) {
    this.options = {
      verbose: options.verbose || false,
      timeout: options.timeout || 30000,
      tempDir: options.tempDir || os.tmpdir(),
      ...options
    };

    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }

  /**
   * Validate all interface contracts
   */
  async validateAllContracts() {
    console.log('🔍 Starting comprehensive interface contract validation...\n');

    await this.validateTaskDataExchangeContract();
    await this.validatePlatformAbstractionContract();
    await this.validateQualityGateContract();
    await this.validateErrorHandlingContract();
    await this.validateCommunicationPatterns();

    return this.generateComplianceReport();
  }

  /**
   * Contract 1: Task Data Exchange Protocol
   */
  async validateTaskDataExchangeContract() {
    const contractName = 'Task Data Exchange Protocol';
    console.log(`📋 Validating ${contractName}...`);

    // Test 1: Standard task metadata format
    await this.runTest(
      `${contractName} - Metadata Format`,
      async () => {
        const result = await this.executeScript('bash', [
          'tools/database-abstraction.sh',
          'get_task_data',
          'T-01',
          'metadata'
        ]);

        if (result.exitCode !== 0) {
          throw new Error(`Task data query failed: ${result.stderr}`);
        }

        // Validate required fields in output
        const requiredFields = ['task_id', 'estado', 'complejidad', 'prioridad'];
        const output = result.stdout;

        for (const field of requiredFields) {
          if (!output.includes(field)) {
            throw new Error(`Missing required field: ${field}`);
          }
        }

        // Validate format patterns
        if (!output.match(/task_id:\s*T-\d{2}/)) {
          throw new Error('Invalid task_id format (expected T-XX)');
        }

        if (!output.match(/complejidad:\s*\d+/)) {
          throw new Error('Invalid complejidad format (expected number)');
        }

        return { status: 'PASS', details: 'All required fields present and properly formatted' };
      }
    );

    // Test 2: Error handling for invalid task IDs
    await this.runTest(
      `${contractName} - Error Handling`,
      async () => {
        const result = await this.executeScript('bash', [
          'tools/database-abstraction.sh',
          'get_task_data',
          'INVALID',
          'metadata'
        ]);

        // Should return specific error codes
        const validErrorCodes = [1, 2, 3]; // Not found, invalid param, system error
        if (!validErrorCodes.includes(result.exitCode)) {
          throw new Error(`Invalid error code: ${result.exitCode} (expected one of: ${validErrorCodes})`);
        }

        return { status: 'PASS', details: `Proper error code returned: ${result.exitCode}` };
      }
    );

    // Test 3: Data type parameter validation
    await this.runTest(
      `${contractName} - Data Type Parameters`,
      async () => {
        const dataTypes = ['full', 'status', 'metadata', 'subtasks'];

        for (const dataType of dataTypes) {
          const result = await this.executeScript('bash', [
            'tools/database-abstraction.sh',
            'get_task_data',
            'T-01',
            dataType
          ]);

          // Should accept all valid data types
          if (result.exitCode !== 0 && !result.stderr.includes('not found')) {
            throw new Error(`Data type '${dataType}' not supported`);
          }
        }

        return { status: 'PASS', details: 'All data type parameters accepted' };
      }
    );
  }

  /**
   * Contract 2: Platform Abstraction Interface
   */
  async validatePlatformAbstractionContract() {
    const contractName = 'Platform Abstraction Interface';
    console.log(`⚙️ Validating ${contractName}...`);

    // Test 1: Validate command interface
    await this.runTest(
      `${contractName} - Validate Command`,
      async () => {
        const result = await this.executeScript('node', [
          'scripts/multiplatform.cjs',
          'validate'
        ]);

        if (result.exitCode !== 0) {
          throw new Error(`Validation command failed: ${result.stderr}`);
        }

        // Parse JSON response
        let response;
        try {
          response = JSON.parse(result.stdout);
        } catch (e) {
          throw new Error(`Invalid JSON response: ${result.stdout}`);
        }

        // Validate contract structure
        const requiredFields = ['status', 'platform'];
        for (const field of requiredFields) {
          if (!(field in response)) {
            throw new Error(`Missing required field: ${field}`);
          }
        }

        // Validate platform information
        if (!response.platform.os || !['win32', 'linux', 'darwin'].includes(response.platform.os)) {
          throw new Error(`Invalid platform.os: ${response.platform.os}`);
        }

        return { status: 'PASS', details: 'JSON response contract validated' };
      }
    );

    // Test 2: Tool execution interface
    await this.runTest(
      `${contractName} - Tool Execution`,
      async () => {
        const result = await this.executeScript('node', [
          'scripts/multiplatform.cjs',
          'tool',
          'python',
          '--version'
        ]);

        // Should either succeed or fail gracefully
        if (result.exitCode !== 0 && !result.stderr.includes('not found')) {
          // Check if error is properly formatted
          if (!result.stderr.includes('ERROR') && !result.stderr.includes('WARN')) {
            throw new Error('Tool execution errors not properly formatted');
          }
        }

        return { status: 'PASS', details: 'Tool execution interface working' };
      }
    );

    // Test 3: Bootstrap operation
    await this.runTest(
      `${contractName} - Bootstrap Operation`,
      async () => {
        const result = await this.executeScript('node', [
          'scripts/multiplatform.cjs',
          'bootstrap'
        ]);

        // Bootstrap should return meaningful output regardless of success
        if (!result.stdout && !result.stderr) {
          throw new Error('Bootstrap operation produced no output');
        }

        return { status: 'PASS', details: 'Bootstrap operation responds appropriately' };
      }
    );
  }

  /**
   * Contract 3: Quality Gate Integration Protocol
   */
  async validateQualityGateContract() {
    const contractName = 'Quality Gate Integration Protocol';
    console.log(`🛡️ Validating ${contractName}...`);

    // Test 1: Pre-merge check interface
    await this.runTest(
      `${contractName} - Pre-merge Check`,
      async () => {
        const result = await this.executeScript('node', [
          'scripts/merge-protection.cjs',
          'pre-merge-check'
        ]);

        // Should return valid exit code
        if (typeof result.exitCode !== 'number' || result.exitCode < 0 || result.exitCode > 255) {
          throw new Error(`Invalid exit code: ${result.exitCode}`);
        }

        return { status: 'PASS', details: `Valid exit code returned: ${result.exitCode}` };
      }
    );

    // Test 2: Merge validation interface
    await this.runTest(
      `${contractName} - Merge Validation`,
      async () => {
        const result = await this.executeScript('node', [
          'scripts/merge-protection.cjs',
          'validate-merge',
          '--source', 'HEAD',
          '--target', 'main'
        ]);

        // Should provide meaningful response
        if (!result.stdout && !result.stderr) {
          throw new Error('Merge validation produced no output');
        }

        return { status: 'PASS', details: 'Merge validation interface functional' };
      }
    );

    // Test 3: Python quality gate integration
    await this.runTest(
      `${contractName} - Python Quality Gate`,
      async () => {
        const result = await this.executeScript('node', [
          'scripts/python-cc-gate.cjs'
        ]);

        // Should execute and return proper exit code
        if (typeof result.exitCode !== 'number') {
          throw new Error('Python quality gate did not return valid exit code');
        }

        return { status: 'PASS', details: 'Python quality gate integration working' };
      }
    );
  }

  /**
   * Contract 4: Error Handling Protocol
   */
  async validateErrorHandlingContract() {
    const contractName = 'Error Handling Protocol';
    console.log(`🚨 Validating ${contractName}...`);

    // Test 1: Error code consistency
    await this.runTest(
      `${contractName} - Error Code Consistency`,
      async () => {
        // Test Node.js error codes
        const nodeTest = await this.executeScript('node', ['-e', `
          const { ErrorCodes, createError } = require('./scripts/lib/error-codes.cjs');
          const error = createError(ErrorCodes.ENVIRONMENT.PYTHON_NOT_FOUND, 'Test error');
          console.log('ERROR_CODE=' + error.code);
          console.log('ERROR_SEVERITY=' + error.severity);
          console.log('ERROR_TIER=' + error.tier);
        `]);

        if (nodeTest.exitCode !== 0) {
          throw new Error('Node.js error handling failed');
        }

        // Test Bash error codes
        const bashTest = await this.executeScript('bash', ['-c', `
          source tools/lib/error-codes.sh
          echo "ERROR_CODE=$ERROR_ENVIRONMENT_PYTHON_NOT_FOUND"
          echo "ERROR_SEVERITY=\${ERROR_SEVERITY_MAP[$ERROR_ENVIRONMENT_PYTHON_NOT_FOUND]}"
          echo "ERROR_TIER=\${ERROR_TIER_MAP[$ERROR_ENVIRONMENT_PYTHON_NOT_FOUND]}"
        `]);

        if (bashTest.exitCode !== 0) {
          throw new Error('Bash error handling failed');
        }

        // Compare outputs
        const nodeLines = nodeTest.stdout.trim().split('\n');
        const bashLines = bashTest.stdout.trim().split('\n');

        for (let i = 0; i < nodeLines.length; i++) {
          if (nodeLines[i] !== bashLines[i]) {
            throw new Error(`Error code mismatch: Node.js="${nodeLines[i]}" vs Bash="${bashLines[i]}"`);
          }
        }

        return { status: 'PASS', details: 'Error codes consistent across environments' };
      }
    );

    // Test 2: Cross-tier error propagation
    await this.runTest(
      `${contractName} - Cross-tier Propagation`,
      async () => {
        const tempErrorFile = path.join(this.options.tempDir, `test_error_${Date.now()}.env`);

        // Create error in Node.js
        const nodeResult = await this.executeScript('node', ['-e', `
          const { createError, ErrorCodes, ProtocolBridge } = require('./scripts/lib/error-codes.cjs');
          const error = createError(
            ErrorCodes.WORKFLOW.MERGE_VALIDATION_FAILED,
            'Test propagation error'
          );
          ProtocolBridge.writeErrorFile(error, '${tempErrorFile}');
          console.log('Error file written');
        `]);

        if (nodeResult.exitCode !== 0) {
          throw new Error('Failed to write error file from Node.js');
        }

        // Read error in Bash
        const bashResult = await this.executeScript('bash', ['-c', `
          source tools/lib/error-codes.sh
          if read_error_from_scripts '${tempErrorFile}'; then
            echo "ERROR_CODE=\${ERROR_CODE}"
            echo "ERROR_MESSAGE=\${ERROR_MESSAGE}"
          else
            echo "Failed to read error"
            exit 1
          fi
        `]);

        if (bashResult.exitCode !== 0) {
          throw new Error('Failed to read error file from Bash');
        }

        // Verify error was propagated correctly
        if (!bashResult.stdout.includes('ERROR_CODE=2001')) {
          throw new Error('Error code not propagated correctly');
        }

        if (!bashResult.stdout.includes('Test propagation error')) {
          throw new Error('Error message not propagated correctly');
        }

        // Cleanup
        if (fs.existsSync(tempErrorFile)) {
          fs.unlinkSync(tempErrorFile);
        }

        return { status: 'PASS', details: 'Cross-tier error propagation working' };
      }
    );

    // Test 3: Error severity mapping
    await this.runTest(
      `${contractName} - Severity Mapping`,
      async () => {
        const severityTest = await this.executeScript('bash', ['-c', `
          source tools/lib/error-codes.sh

          # Test different severity levels
          echo "ERROR_1001_SEVERITY=\${ERROR_SEVERITY_MAP[1001]}"  # error
          echo "ERROR_2003_SEVERITY=\${ERROR_SEVERITY_MAP[2003]}"  # warning
          echo "ERROR_3003_SEVERITY=\${ERROR_SEVERITY_MAP[3003]}"  # info
        `]);

        if (severityTest.exitCode !== 0) {
          throw new Error('Severity mapping test failed');
        }

        const output = severityTest.stdout;
        if (!output.includes('ERROR_1001_SEVERITY=error')) {
          throw new Error('Error severity mapping incorrect');
        }

        if (!output.includes('ERROR_2003_SEVERITY=warning')) {
          throw new Error('Warning severity mapping incorrect');
        }

        if (!output.includes('ERROR_3003_SEVERITY=info')) {
          throw new Error('Info severity mapping incorrect');
        }

        return { status: 'PASS', details: 'Error severity mapping correct' };
      }
    );
  }

  /**
   * Contract 5: Communication Patterns
   */
  async validateCommunicationPatterns() {
    const contractName = 'Communication Patterns';
    console.log(`🔄 Validating ${contractName}...`);

    // Test 1: Command delegation pattern
    await this.runTest(
      `${contractName} - Command Delegation`,
      async () => {
        const delegationTest = await this.executeScript('bash', ['-c', `
          # Test that tools/ can delegate to scripts/
          if command -v node >/dev/null 2>&1; then
            if [[ -f "scripts/multiplatform.cjs" ]]; then
              echo "delegation_test=success"
            else
              echo "delegation_test=script_not_found"
            fi
          else
            echo "delegation_test=node_not_available"
          fi
        `]);

        if (delegationTest.exitCode !== 0) {
          throw new Error('Command delegation test failed');
        }

        if (!delegationTest.stdout.includes('delegation_test=success')) {
          throw new Error('Command delegation not working properly');
        }

        return { status: 'PASS', details: 'Command delegation pattern working' };
      }
    );

    // Test 2: Data pipeline integration
    await this.runTest(
      `${contractName} - Data Pipeline Integration`,
      async () => {
        // Test that tools/ can call scripts/ for data processing
        const pipelineTest = await this.executeScript('bash', ['-c', `
          source tools/lib/error-codes.sh

          # Simulate data pipeline call to scripts/
          if command -v node >/dev/null 2>&1; then
            # Test JSON processing capability
            echo '{"test": "pipeline"}' | node -e '
              const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
              console.log("pipeline_test=" + (data.test === "pipeline" ? "success" : "failed"));
            '
          else
            echo "pipeline_test=node_unavailable"
          fi
        `]);

        if (pipelineTest.exitCode !== 0) {
          throw new Error('Data pipeline integration test failed');
        }

        if (!pipelineTest.stdout.includes('pipeline_test=success')) {
          throw new Error('Data pipeline integration not working');
        }

        return { status: 'PASS', details: 'Data pipeline integration working' };
      }
    );

    // Test 3: Event-driven integration
    await this.runTest(
      `${contractName} - Event-driven Integration`,
      async () => {
        // Test package.json hook integration
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
          throw new Error('package.json not found');
        }

        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        // Verify integration scripts exist
        const requiredScripts = ['quality-gate', 'python-quality', 'validate-docs'];
        for (const script of requiredScripts) {
          if (!packageJson.scripts[script]) {
            throw new Error(`Required integration script missing: ${script}`);
          }
        }

        // Verify scripts reference both directories
        const qualityGateScript = packageJson.scripts['quality-gate'];
        if (!qualityGateScript.includes('validate-docs') || !qualityGateScript.includes('python-quality')) {
          throw new Error('Quality gate script does not integrate both directories');
        }

        return { status: 'PASS', details: 'Event-driven integration properly configured' };
      }
    );
  }

  /**
   * Execute a script and return structured result
   */
  async executeScript(command, args, options = {}) {
    return new Promise((resolve) => {
      const proc = spawn(command, args, {
        cwd: process.cwd(),
        timeout: this.options.timeout,
        ...options
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (exitCode) => {
        resolve({
          exitCode,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
      });

      proc.on('error', (error) => {
        resolve({
          exitCode: -1,
          stdout: '',
          stderr: error.message
        });
      });
    });
  }

  /**
   * Run a test and record results
   */
  async runTest(testName, testFunction) {
    const startTime = Date.now();

    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;

      this.results.passed++;
      this.results.tests.push({
        name: testName,
        status: result.status,
        details: result.details,
        duration,
        timestamp: new Date().toISOString()
      });

      console.log(`  ✅ ${testName}: ${result.status} (${duration}ms)`);
      if (this.options.verbose && result.details) {
        console.log(`     └─ ${result.details}`);
      }

    } catch (error) {
      const duration = Date.now() - startTime;

      this.results.failed++;
      this.results.tests.push({
        name: testName,
        status: 'FAIL',
        error: error.message,
        duration,
        timestamp: new Date().toISOString()
      });

      console.log(`  ❌ ${testName}: FAIL (${duration}ms)`);
      console.log(`     └─ ${error.message}`);
    }
  }

  /**
   * Generate comprehensive compliance report
   */
  generateComplianceReport() {
    const totalTests = this.results.passed + this.results.failed;
    const passRate = totalTests > 0 ? (this.results.passed / totalTests) * 100 : 0;

    const report = {
      summary: {
        totalTests,
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings,
        passRate: Math.round(passRate * 100) / 100,
        timestamp: new Date().toISOString()
      },
      contracts: {
        taskDataExchange: this.getContractStatus('Task Data Exchange Protocol'),
        platformAbstraction: this.getContractStatus('Platform Abstraction Interface'),
        qualityGate: this.getContractStatus('Quality Gate Integration Protocol'),
        errorHandling: this.getContractStatus('Error Handling Protocol'),
        communicationPatterns: this.getContractStatus('Communication Patterns')
      },
      details: this.results.tests,
      recommendations: this.generateRecommendations()
    };

    console.log('\n📊 Contract Compliance Report');
    console.log('=' .repeat(50));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Pass Rate: ${passRate.toFixed(1)}%`);
    console.log(`Overall Status: ${passRate >= 90 ? '✅ COMPLIANT' : passRate >= 75 ? '⚠️ MOSTLY COMPLIANT' : '❌ NON-COMPLIANT'}`);

    if (this.results.failed > 0) {
      console.log('\n🔍 Failed Tests:');
      this.results.tests
        .filter(test => test.status === 'FAIL')
        .forEach(test => {
          console.log(`  • ${test.name}: ${test.error}`);
        });
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
    }

    return report;
  }

  /**
   * Get contract status by name
   */
  getContractStatus(contractName) {
    const contractTests = this.results.tests.filter(test =>
      test.name.startsWith(contractName)
    );

    const passed = contractTests.filter(test => test.status === 'PASS').length;
    const total = contractTests.length;

    return {
      passed,
      total,
      status: total > 0 && passed === total ? 'COMPLIANT' :
              total > 0 && passed > 0 ? 'PARTIAL' : 'FAILED'
    };
  }

  /**
   * Generate recommendations based on test results
   */
  generateRecommendations() {
    const recommendations = [];
    const failedTests = this.results.tests.filter(test => test.status === 'FAIL');

    if (failedTests.some(test => test.name.includes('Error'))) {
      recommendations.push('Review error handling implementation for contract compliance');
    }

    if (failedTests.some(test => test.name.includes('Platform'))) {
      recommendations.push('Verify multiplatform script compatibility and execution paths');
    }

    if (failedTests.some(test => test.name.includes('Data'))) {
      recommendations.push('Check data format consistency and validation rules');
    }

    if (this.results.failed > this.results.passed / 2) {
      recommendations.push('Consider reviewing and updating interface contract implementations');
    }

    return recommendations;
  }
}

module.exports = ContractComplianceValidator;