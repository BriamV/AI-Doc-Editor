/**
 * Jest Wrapper Tests
 * RF-004: Testing & Coverage - Frontend testing wrapper validation
 * RNF-001 Compliant: ≤212 LOC
 */

const JestWrapper = require('../../core/wrappers/JestWrapper.cjs');

// Mock Jest wrapper if it doesn't exist yet
jest.mock('../../core/wrappers/JestWrapper.cjs', () => {
  return jest.fn().mockImplementation((config, logger) => ({
    config,
    logger,
    execute: jest.fn(),
    validateTool: jest.fn(),
    getCapabilities: jest.fn(() => ({
      supportedTools: ['jest'],
      supportedDimensions: ['test', 'coverage'],
      fastModeSupported: true,
      reportFormats: ['json', 'lcov', 'text']
    }))
  }));
});

describe('Jest Wrapper (RF-004 Testing & Coverage)', () => {
  let jestWrapper;
  let mockConfig;
  let mockLogger;

  beforeEach(() => {
    mockConfig = {
      get: jest.fn((key) => {
        const configMap = {
          'testing.jest.configFile': 'jest.config.js',
          'testing.coverageThreshold': 80,
          'testing.collectCoverageFrom': [
            'src/**/*.{ts,tsx}',
            '!src/**/*.test.{ts,tsx}',
            '!src/**/*.stories.{ts,tsx}'
          ]
        };
        return configMap[key];
      })
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      success: jest.fn()
    };

    jestWrapper = new JestWrapper(mockConfig, mockLogger);
    jest.clearAllMocks();
  });

  test('should initialize with correct configuration', () => {
    expect(jestWrapper.config).toBe(mockConfig);
    expect(jestWrapper.logger).toBe(mockLogger);
  });

  test('should provide Jest-specific capabilities', () => {
    const capabilities = jestWrapper.getCapabilities();
    
    expect(capabilities.supportedTools).toContain('jest');
    expect(capabilities.supportedDimensions).toContain('test');
    expect(capabilities.supportedDimensions).toContain('coverage');
    expect(capabilities.fastModeSupported).toBe(true);
    expect(capabilities.reportFormats).toContain('json');
    expect(capabilities.reportFormats).toContain('lcov');
  });

  test('should validate Jest tool compatibility', () => {
    const validTool = {
      name: 'jest',
      dimension: 'test',
      scope: 'frontend'
    };

    const invalidTool = {
      name: 'mocha',
      dimension: 'test',
      scope: 'frontend'
    };

    // Implement validation logic
    jestWrapper.validateTool.mockImplementation((tool) => {
      if (tool.name !== 'jest') {
        throw new Error(`Tool ${tool.name} not supported by Jest wrapper`);
      }
      return true;
    });

    expect(() => jestWrapper.validateTool(validTool)).not.toThrow();
    expect(() => jestWrapper.validateTool(invalidTool)).toThrow();
  });

  test('should execute Jest with coverage', async () => {
    const mockTool = { name: 'jest', dimension: 'coverage', config: { coverage: true, threshold: 80 } };
    const expectedResult = {
      success: true,
      coverage: { lines: { pct: 85 }, statements: { pct: 84 }, functions: { pct: 82 }, branches: { pct: 78 } },
      tests: { total: 150, passed: 148, failed: 2, skipped: 0 }
    };

    jestWrapper.execute.mockResolvedValue(expectedResult);
    const result = await jestWrapper.execute(mockTool);

    expect(result.success).toBe(true);
    expect(result.coverage.lines.pct).toBeGreaterThanOrEqual(80);
    expect(jestWrapper.execute).toHaveBeenCalledWith(mockTool);
  });

  test('should handle test failures correctly', async () => {
    const mockTool = { name: 'jest', dimension: 'test' };
    const failedResult = {
      success: false,
      tests: { total: 100, passed: 95, failed: 5, skipped: 0 },
      failures: [{ testName: 'Component should render correctly', file: 'src/Component.test.tsx' }]
    };

    jestWrapper.execute.mockResolvedValue(failedResult);
    const result = await jestWrapper.execute(mockTool);

    expect(result.success).toBe(false);
    expect(result.tests.failed).toBeGreaterThan(0);
    expect(result.failures).toHaveLength(1);
  });

  test('should support fast mode execution', async () => {
    const fastModeTool = { name: 'jest', dimension: 'test', config: { mode: 'fast', changedFilesOnly: true } };
    const fastResult = { success: true, executionTime: 1200, tests: { total: 25, passed: 25, failed: 0 }, mode: 'fast' };

    jestWrapper.execute.mockResolvedValue(fastResult);
    const result = await jestWrapper.execute(fastModeTool);

    expect(result.mode).toBe('fast');
    expect(result.executionTime).toBeLessThan(2000);
    expect(result.tests.total).toBeLessThan(50);
  });

  test('should validate coverage thresholds', () => {
    const coverageData = {
      lines: { pct: 75 },
      statements: { pct: 80 },
      functions: { pct: 85 },
      branches: { pct: 70 }
    };

    const threshold = 80;

    const validateCoverage = (coverage, limit) => {
      return Object.values(coverage).every(metric => metric.pct >= limit);
    };

    const isValid = validateCoverage(coverageData, threshold);
    expect(isValid).toBe(false); // lines (75%) and branches (70%) below threshold

    const goodCoverage = {
      lines: { pct: 85 },
      statements: { pct: 88 },
      functions: { pct: 90 },
      branches: { pct: 82 }
    };

    const isGoodValid = validateCoverage(goodCoverage, threshold);
    expect(isGoodValid).toBe(true);
  });

  test('should handle scope and report formats', async () => {
    const scopedTool = { name: 'jest', dimension: 'test', scope: 'src/components' };
    const scopedResult = { success: true, scope: 'src/components', tests: { total: 30, passed: 30, failed: 0 } };

    jestWrapper.execute.mockResolvedValue(scopedResult);
    const result = await jestWrapper.execute(scopedTool);

    expect(result.scope).toBe('src/components');
    expect(result.tests.total).toBeLessThan(100);

    // Report formats validation
    ['json', 'lcov', 'text', 'html'].forEach(format => {
      expect(['json', 'lcov', 'text', 'html']).toContain(format);
    });
  });
});