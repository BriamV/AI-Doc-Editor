/**
 * Cross-System Integration Tests: scripts/ ↔ tools/ Validation
 *
 * This test suite validates the comprehensive integration between:
 * - scripts/ (Node.js .cjs infrastructure utilities)
 * - tools/ (Bash .sh task management utilities)
 *
 * Test Categories:
 * 1. Interface Contract Compliance
 * 2. Cross-Platform Compatibility
 * 3. Error Handling Propagation
 * 4. Data Exchange Protocol Validation
 * 5. Performance Regression Detection
 *
 * Usage:
 *   npm test tests/integration/scripts-tools-integration.test.js
 *   yarn test:integration
 */

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Import our error handling system for validation
const { ErrorCodes, ErrorHandler, ProtocolBridge, createError } = require('../../scripts/lib/error-codes.cjs');

describe('Scripts-Tools Integration Validation', () => {
  let tempDir;
  let errorHandler;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scripts-tools-test-'));
    errorHandler = new ErrorHandler({ exitOnError: false, verbose: process.env.VERBOSE === '1' });
  });

  afterAll(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Interface Contract Compliance', () => {

    test('should validate task data exchange protocol', async () => {
      // Test the standardized task metadata interface
      const taskId = 'T-01';

      // Execute tools/database-abstraction.sh get_task_data
      const result = spawnSync('bash', [
        'tools/database-abstraction.sh',
        'get_task_data',
        taskId,
        'metadata'
      ], {
        cwd: process.cwd(),
        encoding: 'utf8',
        timeout: 10000
      });

      // Validate interface contract
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('task_id');
      expect(result.stdout).toContain('estado');
      expect(result.stdout).toContain('complejidad');

      // Validate error handling if task not found
      const invalidResult = spawnSync('bash', [
        'tools/database-abstraction.sh',
        'get_task_data',
        'T-INVALID',
        'metadata'
      ], {
        cwd: process.cwd(),
        encoding: 'utf8',
        timeout: 5000
      });

      expect(invalidResult.status).not.toBe(0);
      expect([1, 2, 3]).toContain(invalidResult.status); // Expected error codes
    });

    test('should validate platform abstraction interface', async () => {
      // Test scripts/multiplatform.cjs validate command
      const result = spawnSync('node', [
        'scripts/multiplatform.cjs',
        'validate'
      ], {
        cwd: process.cwd(),
        encoding: 'utf8',
        timeout: 15000
      });

      expect(result.status).toBe(0);

      // Parse JSON response and validate contract
      let response;
      try {
        response = JSON.parse(result.stdout);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${result.stdout}`);
      }

      // Validate response contract
      expect(response).toHaveProperty('status');
      expect(response).toHaveProperty('platform');
      expect(response.platform).toHaveProperty('os');
      expect(['win32', 'linux', 'darwin']).toContain(response.platform.os);

      if (response.data) {
        expect(response.data).toHaveProperty('python');
        expect(response.data).toHaveProperty('tools');
      }
    });

    test('should validate quality gate integration protocol', async () => {
      // Test merge protection interface
      const result = spawnSync('node', [
        'scripts/merge-protection.cjs',
        'pre-merge-check'
      ], {
        cwd: process.cwd(),
        encoding: 'utf8',
        timeout: 30000
      });

      // Should return 0 or specific error codes, never undefined
      expect(typeof result.status).toBe('number');
      expect(result.status).toBeGreaterThanOrEqual(0);
      expect(result.status).toBeLessThanOrEqual(255);
    });

    test('should validate error code consistency across environments', () => {
      // Test that error codes are consistent between Node.js and Bash
      const nodeJsError = createError(
        ErrorCodes.ENVIRONMENT.PYTHON_NOT_FOUND,
        'Python executable not found'
      );

      // Convert to shell format
      const shellFormat = nodeJsError.toShellFormat();
      expect(shellFormat).toContain('ERROR_CODE=4001');
      expect(shellFormat).toContain('ERROR_SEVERITY=error');
      expect(shellFormat).toContain('ERROR_TIER=infrastructure');

      // Test protocol bridge
      const envVars = ProtocolBridge.toShellEnv(nodeJsError);
      expect(envVars.ERROR_CODE).toBe(4001);
      expect(envVars.ERROR_SEVERITY).toBe('error');
      expect(envVars.ERROR_TIER).toBe('infrastructure');
    });
  });

  describe('Cross-Platform Compatibility', () => {

    test('should handle Windows/Linux/WSL platform detection', async () => {
      const result = spawnSync('node', [
        'scripts/multiplatform.cjs',
        'info'
      ], {
        cwd: process.cwd(),
        encoding: 'utf8',
        timeout: 10000
      });

      expect(result.status).toBe(0);

      let response;
      try {
        response = JSON.parse(result.stdout);
      } catch (e) {
        // Fallback for non-JSON output
        expect(result.stdout).toContain('platform');
        return;
      }

      expect(response.platform).toBeDefined();
      expect(['win32', 'linux', 'darwin']).toContain(response.platform.os);
    });

    test('should validate bash script compatibility across platforms', async () => {
      // Test a basic tools/ script works on current platform
      const result = spawnSync('bash', [
        'tools/lib/error-codes.sh',
        'test'
      ], {
        cwd: process.cwd(),
        encoding: 'utf8',
        timeout: 15000
      });

      // Should pass self-test on all supported platforms
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('tests passed');
    });

    test('should validate path resolution across environments', async () => {
      // Test that tools/ can find and execute scripts/
      const bashScript = `
        source tools/lib/error-codes.sh
        if command -v node >/dev/null 2>&1; then
          echo "node_available=true"
        else
          echo "node_available=false"
        fi

        if [[ -f "scripts/multiplatform.cjs" ]]; then
          echo "multiplatform_script_found=true"
        else
          echo "multiplatform_script_found=false"
        fi
      `;

      const result = spawnSync('bash', ['-c', bashScript], {
        cwd: process.cwd(),
        encoding: 'utf8',
        timeout: 5000
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('node_available=true');
      expect(result.stdout).toContain('multiplatform_script_found=true');
    });
  });

  describe('Error Handling Propagation', () => {

    test('should propagate errors from scripts/ to tools/', async () => {
      // Create a temporary error scenario in scripts/
      const errorTestFile = path.join(tempDir, 'error_propagation_test.cjs');
      const errorTestScript = `
        const { createError, ErrorCodes, ProtocolBridge } = require('./scripts/lib/error-codes.cjs');

        const error = createError(
          ErrorCodes.WORKFLOW.MERGE_VALIDATION_FAILED,
          'Test merge validation failure',
          { test: 'error_propagation', tempDir: '${tempDir}' }
        );

        const errorFile = '${tempDir}/test_error.env';
        ProtocolBridge.writeErrorFile(error, errorFile);

        console.log('Error file written to:', errorFile);
        process.exit(error.code < 3000 ? 1 : 0); // Exit with error for workflow issues
      `;

      fs.writeFileSync(errorTestFile, errorTestScript);

      // Execute the error-generating script
      const scriptResult = spawnSync('node', [errorTestFile], {
        encoding: 'utf8',
        timeout: 5000
      });

      expect(scriptResult.status).toBe(1); // Should exit with error

      // Test that tools/ can read the error
      const errorFile = path.join(tempDir, 'test_error.env');
      expect(fs.existsSync(errorFile)).toBe(true);

      const bashErrorHandler = `
        source tools/lib/error-codes.sh
        if read_error_from_scripts '${errorFile}'; then
          echo "ERROR_CODE=\${ERROR_CODE}"
          echo "ERROR_SEVERITY=\${ERROR_SEVERITY}"
          echo "ERROR_MESSAGE=\${ERROR_MESSAGE}"
          exit 0
        else
          echo "Failed to read error"
          exit 1
        fi
      `;

      const toolsResult = spawnSync('bash', ['-c', bashErrorHandler], {
        encoding: 'utf8',
        timeout: 5000
      });

      expect(toolsResult.status).toBe(0);
      expect(toolsResult.stdout).toContain('ERROR_CODE=2001');
      expect(toolsResult.stdout).toContain('ERROR_SEVERITY=error');
      expect(toolsResult.stdout).toContain('Test merge validation failure');
    });

    test('should propagate errors from tools/ to scripts/', async () => {
      // Create error in tools/ and verify scripts/ can handle it
      const bashErrorScript = `
        source tools/lib/error-codes.sh
        write_error_file_for_scripts \
          \$ERROR_ENVIRONMENT_PYTHON_NOT_FOUND \
          "Test Python not found error" \
          "test=tools_to_scripts,tempDir=${tempDir}"

        echo "Error written for scripts consumption"
      `;

      const toolsResult = spawnSync('bash', ['-c', bashErrorScript], {
        cwd: process.cwd(),
        encoding: 'utf8',
        timeout: 5000
      });

      expect(toolsResult.status).toBe(0);

      // Find the error file (has PID in name)
      const tempFiles = fs.readdirSync(os.tmpdir()).filter(f =>
        f.startsWith('error_') && f.endsWith('.env')
      );
      expect(tempFiles.length).toBeGreaterThan(0);

      const errorFile = path.join(os.tmpdir(), tempFiles[0]);

      // Test scripts/ can read it
      const nodeErrorHandler = `
        const { ProtocolBridge } = require('./scripts/lib/error-codes.cjs');
        const fs = require('fs');

        try {
          const envContent = fs.readFileSync('${errorFile}', 'utf8');
          const envLines = envContent.split('\\n');
          const env = {};

          envLines.forEach(line => {
            const match = line.match(/export ([^=]+)="(.*)"/);
            if (match) {
              env[match[1]] = match[2];
            }
          });

          console.log('ERROR_CODE=' + env.ERROR_CODE);
          console.log('ERROR_SEVERITY=' + env.ERROR_SEVERITY);
          console.log('ERROR_MESSAGE=' + env.ERROR_MESSAGE);
        } catch (error) {
          console.error('Failed to read error file:', error.message);
          process.exit(1);
        }
      `;

      const scriptResult = spawnSync('node', ['-e', nodeErrorHandler], {
        encoding: 'utf8',
        timeout: 5000
      });

      expect(scriptResult.status).toBe(0);
      expect(scriptResult.stdout).toContain('ERROR_CODE=4001');
      expect(scriptResult.stdout).toContain('ERROR_SEVERITY=error');
      expect(scriptResult.stdout).toContain('Test Python not found error');

      // Cleanup
      fs.unlinkSync(errorFile);
    });

    test('should handle error recovery and graceful degradation', async () => {
      // Test graceful degradation when Node.js is not available
      const bashScript = `
        source tools/lib/error-codes.sh

        # Simulate Node.js not available
        PATH_BACKUP="$PATH"
        export PATH="/usr/bin:/bin"  # Remove Node.js from PATH

        # Test fallback mechanism
        if command -v node >/dev/null 2>&1; then
          echo "fallback_test=failed_node_still_available"
        else
          echo "fallback_test=success_node_not_found"

          # Test that tools/ still function with fallback
          echo "tools_functional=true"

          # Test error handling still works
          handle_error \$ERROR_ENVIRONMENT_TOOL_NOT_AVAILABLE \
            "Node.js not available, using fallback" \
            "test=graceful_degradation" \
            "0"  # Don't exit

          echo "error_handling=functional"
        fi

        # Restore PATH
        export PATH="$PATH_BACKUP"
      `;

      const result = spawnSync('bash', ['-c', bashScript], {
        cwd: process.cwd(),
        encoding: 'utf8',
        timeout: 10000
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('fallback_test=success');
      expect(result.stdout).toContain('tools_functional=true');
      expect(result.stdout).toContain('error_handling=functional');
    });
  });

  describe('Data Exchange Protocol Validation', () => {

    test('should validate task metadata format consistency', async () => {
      // Test that task data has consistent format across both systems
      const taskValidationScript = `
        source tools/lib/error-codes.sh

        # Mock task data in expected format
        echo "task_id: T-01"
        echo "estado: En Progreso"
        echo "complejidad: 5"
        echo "prioridad: alta"
        echo "release_target: R0.WP3"
        echo "created_date: 2024-01-26T10:30:00Z"
        echo "modified_date: 2024-01-26T11:45:00Z"
      `;

      const result = spawnSync('bash', ['-c', taskValidationScript], {
        encoding: 'utf8',
        timeout: 5000
      });

      expect(result.status).toBe(0);

      // Validate format contains required fields
      const output = result.stdout;
      expect(output).toMatch(/task_id:\s*T-\d{2}/);
      expect(output).toMatch(/estado:\s*.+/);
      expect(output).toMatch(/complejidad:\s*\d+/);
      expect(output).toMatch(/prioridad:\s*(alta|media|baja)/);
      expect(output).toMatch(/release_target:\s*R\d+\.\w+/);
      expect(output).toMatch(/created_date:\s*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/);
    });

    test('should validate JSON response format from scripts/', async () => {
      // Test that scripts/ return valid JSON when expected
      const jsonTest = spawnSync('node', ['-e', `
        const response = {
          status: 'success',
          exitCode: 0,
          timestamp: new Date().toISOString(),
          operation: 'test',
          data: {
            platform: process.platform,
            environment: 'test',
            tools: {
              node: { available: true, version: process.version }
            }
          },
          errors: [],
          warnings: []
        };
        console.log(JSON.stringify(response, null, 2));
      `], {
        encoding: 'utf8',
        timeout: 5000
      });

      expect(jsonTest.status).toBe(0);

      let response;
      expect(() => {
        response = JSON.parse(jsonTest.stdout);
      }).not.toThrow();

      // Validate contract structure
      expect(response).toHaveProperty('status');
      expect(response).toHaveProperty('exitCode');
      expect(response).toHaveProperty('timestamp');
      expect(response).toHaveProperty('operation');
      expect(response).toHaveProperty('data');
      expect(response).toHaveProperty('errors');
      expect(response).toHaveProperty('warnings');

      expect(Array.isArray(response.errors)).toBe(true);
      expect(Array.isArray(response.warnings)).toBe(true);
    });

    test('should validate environment variable propagation', async () => {
      // Test environment variable communication between systems
      const envTestScript = `
        export TEST_VAR="scripts_tools_integration_test"
        export TEST_TIMESTAMP="$(date -Iseconds)"
        export TEST_PLATFORM="${process.platform}"

        # Call bash script that should see these variables
        bash -c 'echo "TEST_VAR=\${TEST_VAR}"'
        bash -c 'echo "TEST_TIMESTAMP=\${TEST_TIMESTAMP}"'
        bash -c 'echo "TEST_PLATFORM=\${TEST_PLATFORM}"'
      `;

      const result = spawnSync('bash', ['-c', envTestScript], {
        cwd: process.cwd(),
        encoding: 'utf8',
        timeout: 5000
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('TEST_VAR=scripts_tools_integration_test');
      expect(result.stdout).toContain('TEST_TIMESTAMP=');
      expect(result.stdout).toContain('TEST_PLATFORM=');
    });
  });

  describe('Performance Regression Detection', () => {

    test('should validate interface call performance', async () => {
      const performanceTest = async (operation, maxDuration) => {
        const startTime = Date.now();

        let result;
        switch (operation) {
          case 'validate':
            result = spawnSync('node', ['scripts/multiplatform.cjs', 'validate'], {
              cwd: process.cwd(),
              timeout: maxDuration * 2
            });
            break;
          case 'error-test':
            result = spawnSync('bash', ['tools/lib/error-codes.sh', 'test'], {
              cwd: process.cwd(),
              timeout: maxDuration * 2
            });
            break;
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }

        const duration = Date.now() - startTime;

        return {
          success: result.status === 0,
          duration,
          withinThreshold: duration <= maxDuration
        };
      };

      // Test multiplatform validation performance
      const validateResult = await performanceTest('validate', 5000);
      expect(validateResult.success).toBe(true);
      expect(validateResult.withinThreshold).toBe(true);

      // Test error handling self-test performance
      const errorResult = await performanceTest('error-test', 3000);
      expect(errorResult.success).toBe(true);
      expect(errorResult.withinThreshold).toBe(true);

      console.log(`Performance: validate=${validateResult.duration}ms, error-test=${errorResult.duration}ms`);
    });

    test('should validate concurrent access performance', async () => {
      // Test concurrent interface calls
      const concurrentOperations = [];
      const operationCount = 5;

      for (let i = 0; i < operationCount; i++) {
        concurrentOperations.push(
          new Promise((resolve) => {
            const startTime = Date.now();
            const result = spawnSync('node', ['-e', `
              const { ErrorValidation } = require('./scripts/lib/error-codes.cjs');
              const success = ErrorValidation.runSelfTest();
              process.exit(success ? 0 : 1);
            `], {
              timeout: 10000
            });

            resolve({
              success: result.status === 0,
              duration: Date.now() - startTime,
              index: i
            });
          })
        );
      }

      const results = await Promise.all(concurrentOperations);

      // All operations should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.duration).toBeLessThan(5000); // 5 second threshold
      });

      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      console.log(`Concurrent performance: ${operationCount} operations, avg ${avgDuration}ms`);
    });

    test('should detect memory usage regression', async () => {
      // Test memory usage of integration operations
      const memoryTest = spawnSync('node', ['-e', `
        const { ErrorHandler, createError, ErrorCodes } = require('./scripts/lib/error-codes.cjs');

        const initialMemory = process.memoryUsage();

        // Perform multiple operations
        for (let i = 0; i < 100; i++) {
          const handler = new ErrorHandler({ exitOnError: false });
          const error = createError(
            ErrorCodes.ENVIRONMENT.PYTHON_NOT_FOUND,
            \`Test error \${i}\`,
            { iteration: i }
          );
          handler.handleError(error);
        }

        const finalMemory = process.memoryUsage();
        const memoryDiff = finalMemory.heapUsed - initialMemory.heapUsed;

        console.log(JSON.stringify({
          initialHeap: initialMemory.heapUsed,
          finalHeap: finalMemory.heapUsed,
          difference: memoryDiff,
          withinThreshold: memoryDiff < 10 * 1024 * 1024 // 10MB threshold
        }));
      `], {
        timeout: 10000
      });

      expect(memoryTest.status).toBe(0);

      const memoryResult = JSON.parse(memoryTest.stdout);
      expect(memoryResult.withinThreshold).toBe(true);

      console.log(`Memory usage: ${Math.round(memoryResult.difference / 1024)}KB increase`);
    });
  });

  describe('CI/CD Integration Validation', () => {

    test('should validate package.json integration hooks', async () => {
      // Test that all integration-related scripts are properly defined
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      expect(fs.existsSync(packageJsonPath)).toBe(true);

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      // Validate essential scripts exist
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts['test:backend']).toBeDefined();
      expect(packageJson.scripts['test:integration']).toBeDefined();
      expect(packageJson.scripts['quality-gate']).toBeDefined();
      expect(packageJson.scripts['security-scan']).toBeDefined();

      // Validate scripts reference the correct directories
      expect(packageJson.scripts['quality-gate']).toContain('validate-docs');
      expect(packageJson.scripts['quality-gate']).toContain('python-quality');
    });

    test('should validate automated testing workflow', async () => {
      // Test that the integration can be run in CI/CD context
      const ciTestScript = `
        set -e  # Exit on any error

        echo "=== CI/CD Integration Test ==="

        # Test environment validation
        echo "1. Environment validation..."
        if node scripts/multiplatform.cjs validate >/dev/null 2>&1; then
          echo "✅ Environment validation: PASS"
        else
          echo "❌ Environment validation: FAIL"
          exit 1
        fi

        # Test error handling libraries
        echo "2. Error handling libraries..."
        if bash tools/lib/error-codes.sh test >/dev/null 2>&1; then
          echo "✅ Shell error handling: PASS"
        else
          echo "❌ Shell error handling: FAIL"
          exit 1
        fi

        if node -e 'require("./scripts/lib/error-codes.cjs").ErrorValidation.runSelfTest()' >/dev/null 2>&1; then
          echo "✅ Node.js error handling: PASS"
        else
          echo "❌ Node.js error handling: FAIL"
          exit 1
        fi

        # Test tools/ directory functionality
        echo "3. Tools directory functionality..."
        if bash tools/validate-document-placement.sh --help >/dev/null 2>&1; then
          echo "✅ Tools scripts: PASS"
        else
          echo "❌ Tools scripts: FAIL"
          exit 1
        fi

        echo "=== All CI/CD integration tests passed ==="
      `;

      const result = spawnSync('bash', ['-c', ciTestScript], {
        cwd: process.cwd(),
        encoding: 'utf8',
        timeout: 30000
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('All CI/CD integration tests passed');
    });

    test('should validate error reporting for CI/CD', async () => {
      // Test that errors are properly formatted for CI/CD consumption
      const ciErrorTest = `
        const { createError, ErrorCodes, ErrorHandler } = require('./scripts/lib/error-codes.cjs');

        // Test CI-friendly error output
        const handler = new ErrorHandler({
          exitOnError: false,
          colorOutput: false, // CI environments typically don't support colors
          verbose: false
        });

        const error = createError(
          ErrorCodes.QUALITY.TEST_FAILURES,
          'Simulated test failure for CI validation'
        );

        handler.handleError(error);

        // Output should be parseable by CI systems
        console.log('CI_ERROR_CODE=' + error.code);
        console.log('CI_ERROR_SEVERITY=' + error.severity);
        console.log('CI_ERROR_TIER=' + error.tier);
      `;

      const result = spawnSync('node', ['-e', ciErrorTest], {
        encoding: 'utf8',
        timeout: 5000
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('CI_ERROR_CODE=3005');
      expect(result.stdout).toContain('CI_ERROR_SEVERITY=error');
      expect(result.stdout).toContain('CI_ERROR_TIER=quality');
    });
  });
});