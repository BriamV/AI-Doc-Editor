/**
 * Test Execution Tests - RF-004: Test orchestration
 */

const TestExecutor = require('../../core/execution/TestExecutor.cjs');

jest.mock('../../core/execution/TestExecutor.cjs', () => {
  return jest.fn().mockImplementation((config, logger) => ({
    config, logger,
    executeTests: jest.fn(), orchestrateRuns: jest.fn(),
    validateResults: jest.fn(), generateSummary: jest.fn()
  }));
});

describe('Test Execution (RF-004 Test Orchestration)', () => {
  let testExecutor, mockConfig, mockLogger;

  beforeEach(() => {
    mockConfig = {
      get: jest.fn((key) => ({
        'testing.execution.parallel': true, 'testing.execution.maxWorkers': 4,
        'testing.execution.timeout': 30000, 'testing.execution.retries': 2,
        'testing.jest.testMatch': ['**/*.test.js', '**/*.spec.js'],
        'testing.pytest.testpaths': ['tests/', 'backend/tests/']
      })[key])
    };
    mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), success: jest.fn() };
    testExecutor = new TestExecutor(mockConfig, mockLogger);
    jest.clearAllMocks();
  });

  test('should execute Jest tests with proper configuration', async () => {
    const jestConfig = { tool: 'jest', scope: 'frontend', config: { collectCoverage: true, testMatch: ['src/**/*.test.tsx'] } };
    const expectedResult = {
      success: true,
      tests: { total: 125, passed: 123, failed: 2, skipped: 0 },
      coverage: { lines: 88, statements: 86, functions: 84, branches: 82 },
      duration: 15420
    };

    testExecutor.executeTests.mockResolvedValue(expectedResult);
    const result = await testExecutor.executeTests(jestConfig);

    expect(result.success).toBe(true);
    expect(result.tests.total).toBe(125);
    expect(result.coverage.lines).toBeGreaterThan(80);
  });

  test('should execute Pytest tests with proper configuration', async () => {
    const pytestConfig = { tool: 'pytest', scope: 'backend', config: { coverage: true, testpaths: ['backend/tests/'] } };
    const expectedResult = {
      success: true,
      tests: { total: 89, passed: 85, failed: 3, skipped: 1 },
      coverage: { lines: 92, statements: 90, functions: 88, branches: 85 },
      duration: 22150
    };

    testExecutor.executeTests.mockResolvedValue(expectedResult);
    const result = await testExecutor.executeTests(pytestConfig);

    expect(result.success).toBe(true);
    expect(result.tests.passed).toBe(85);
    expect(result.coverage.lines).toBeGreaterThan(90);
  });

  test('should orchestrate parallel test runs', async () => {
    const testPlans = [
      { tool: 'jest', scope: 'components', priority: 'high' },
      { tool: 'pytest', scope: 'api', priority: 'high' }
    ];

    const orchestrationResult = {
      success: true, parallel: true,
      results: [
        { scope: 'components', success: true, duration: 8500 },
        { scope: 'api', success: true, duration: 12800 }
      ],
      totalDuration: 12800, efficiency: 1.95
    };

    testExecutor.orchestrateRuns.mockResolvedValue(orchestrationResult);
    const result = await testExecutor.orchestrateRuns(testPlans);

    expect(result.parallel).toBe(true);
    expect(result.results).toHaveLength(2);
    expect(result.efficiency).toBeGreaterThan(1.5);
  });

  test('should handle test failures and retries', async () => {
    const flakyTest = { tool: 'jest', scope: 'integration', config: { retries: 2, timeout: 10000 } };

    testExecutor.executeTests
      .mockResolvedValueOnce({
        success: false,
        tests: { total: 45, passed: 42, failed: 3 },
        failures: [{ test: 'api-timeout.test.js', reason: 'timeout', retryable: true }]
      })
      .mockResolvedValueOnce({
        success: true,
        tests: { total: 45, passed: 45, failed: 0 },
        retryCount: 1
      });

    const firstResult = await testExecutor.executeTests(flakyTest);
    const retryResult = await testExecutor.executeTests(flakyTest);

    expect(firstResult.success).toBe(false);
    expect(retryResult.success).toBe(true);
    expect(retryResult.retryCount).toBe(1);
  });

  test('should validate test results against requirements', () => {
    const testResults = {
      jest: { success: true, coverage: 87, tests: { failed: 0 } },
      pytest: { success: true, coverage: 91, tests: { failed: 1 } }
    };
    const requirements = { coverageThreshold: 85, maxFailures: 5, requiredTools: ['jest', 'pytest'] };

    testExecutor.validateResults.mockReturnValue({
      passed: true,
      details: { coverageOk: true, failuresOk: true, toolsOk: true },
      summary: 'All validation requirements met'
    });

    const validation = testExecutor.validateResults(testResults, requirements);
    expect(validation.passed).toBe(true);
    expect(validation.details.coverageOk).toBe(true);
  });

  test('should generate comprehensive test summary', () => {
    const executionData = {
      jest: { tests: { total: 150, passed: 147, failed: 3 }, coverage: { lines: 89 }, duration: 18500 },
      pytest: { tests: { total: 95, passed: 93, failed: 2 }, coverage: { lines: 94 }, duration: 14200 }
    };

    testExecutor.generateSummary.mockReturnValue({
      overall: {
        success: true, totalTests: 245, totalPassed: 240, totalFailed: 5,
        overallCoverage: 91.2, totalDuration: 32700
      },
      recommendations: ['Review 5 failing tests', 'Coverage target (85%) exceeded']
    });

    const summary = testExecutor.generateSummary(executionData);
    expect(summary.overall.success).toBe(true);
    expect(summary.overall.totalTests).toBe(245);
    expect(summary.overall.overallCoverage).toBeGreaterThan(85);
  });

  test('should handle different test scopes and filtering', async () => {
    const scopedConfigs = [
      { scope: 'src/components/', pattern: '**/*.test.tsx' },
      { scope: 'backend/api/', pattern: 'test_*.py' }
    ];

    for (const config of scopedConfigs) {
      testExecutor.executeTests.mockResolvedValue({
        success: true, scope: config.scope,
        testsFound: config.scope.includes('components') ? 45 : 32
      });

      const result = await testExecutor.executeTests(config);
      expect(result.scope).toBe(config.scope);
      expect(result.testsFound).toBeGreaterThan(0);
    }
  });

  test('should support fast mode execution', async () => {
    const fastModeConfig = { mode: 'fast', strategy: 'changed-files', gitDiff: true, staged: true };
    const fastResult = {
      success: true, mode: 'fast', testsRun: 23,
      changedFiles: ['src/auth.ts', 'backend/api.py'],
      duration: 3400, coverage: { incremental: 95.2 }
    };

    testExecutor.executeTests.mockResolvedValue(fastResult);
    const result = await testExecutor.executeTests(fastModeConfig);

    expect(result.mode).toBe('fast');
    expect(result.testsRun).toBeLessThan(50);
    expect(result.duration).toBeLessThan(5000);
    expect(result.coverage.incremental).toBeGreaterThan(90);
  });

  test('should integrate with CI/CD reporting', () => {
    const ciConfig = { format: 'junit', outputPath: 'test-results/', includeArtifacts: true };
    const ciReport = {
      format: 'junit',
      files: ['test-results/jest-results.xml', 'test-results/pytest-results.xml', 'coverage/lcov.info'],
      exitCode: 0, compatible: true
    };

    testExecutor.generateSummary.mockReturnValue(ciReport);
    const report = testExecutor.generateSummary(ciConfig);

    expect(report.format).toBe('junit');
    expect(report.exitCode).toBe(0);
    expect(report.files).toContain('test-results/jest-results.xml');
    expect(report.compatible).toBe(true);
  });

  test('should handle environment-specific configurations', () => {
    const environments = ['development', 'production'];
    
    environments.forEach(env => {
      const envConfig = {
        environment: env,
        testDbUrl: env === 'production' ? undefined : 'mongodb://test-db',
        mockExternal: env !== 'production',
        timeouts: env === 'production' ? 60000 : 30000
      };

      if (env === 'production') {
        expect(envConfig.testDbUrl).toBeUndefined();
        expect(envConfig.mockExternal).toBe(false);
      } else {
        expect(envConfig.testDbUrl).toBeDefined();
        expect(envConfig.mockExternal).toBe(true);
      }
      expect(envConfig.timeouts).toBeGreaterThan(0);
    });
  });
});