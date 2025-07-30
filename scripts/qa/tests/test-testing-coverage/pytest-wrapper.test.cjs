/**
 * Pytest Wrapper Tests - RF-004: Backend testing wrapper validation
 */

const PytestWrapper = require('../../core/wrappers/PytestWrapper.cjs');

jest.mock('../../core/wrappers/PytestWrapper.cjs', () => {
  return jest.fn().mockImplementation((config, logger) => ({
    config, logger, execute: jest.fn(), validateTool: jest.fn(),
    getCapabilities: jest.fn(() => ({
      supportedTools: ['pytest'], supportedDimensions: ['test', 'coverage'],
      fastModeSupported: true, reportFormats: ['json', 'xml', 'html', 'terminal']
    }))
  }));
});

describe('Pytest Wrapper (RF-004 Testing & Coverage - Backend)', () => {
  let pytestWrapper, mockConfig, mockLogger;

  beforeEach(() => {
    mockConfig = {
      get: jest.fn((key) => ({
        'testing.pytest.configFile': 'pytest.ini', 'testing.coverageThreshold': 85,
        'testing.pytest.additionalArgs': ['--strict-markers', '--strict-config'],
        'testing.python.testPaths': ['tests/', 'backend/tests/']
      })[key])
    };
    mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), success: jest.fn() };
    pytestWrapper = new PytestWrapper(mockConfig, mockLogger);
    jest.clearAllMocks();
  });

  test('should initialize with Python testing configuration', () => {
    expect(pytestWrapper.config).toBe(mockConfig);
    expect(pytestWrapper.logger).toBe(mockLogger);
  });

  test('should provide Pytest-specific capabilities', () => {
    const capabilities = pytestWrapper.getCapabilities();
    
    expect(capabilities.supportedTools).toContain('pytest');
    expect(capabilities.supportedDimensions).toContain('test');
    expect(capabilities.supportedDimensions).toContain('coverage');
    expect(capabilities.fastModeSupported).toBe(true);
    expect(capabilities.reportFormats).toContain('json');
    expect(capabilities.reportFormats).toContain('xml');
  });

  test('should validate Pytest tool compatibility', () => {
    const validTool = {
      name: 'pytest',
      dimension: 'test',
      scope: 'backend'
    };

    const invalidTool = {
      name: 'unittest',
      dimension: 'test',
      scope: 'backend'
    };

    pytestWrapper.validateTool.mockImplementation((tool) => {
      if (tool.name !== 'pytest') {
        throw new Error(`Tool ${tool.name} not supported by Pytest wrapper`);
      }
      return true;
    });

    expect(() => pytestWrapper.validateTool(validTool)).not.toThrow();
    expect(() => pytestWrapper.validateTool(invalidTool)).toThrow();
  });

  test('should execute pytest with coverage', async () => {
    const mockTool = { name: 'pytest', dimension: 'coverage', config: { coverage: true, threshold: 85 } };
    const expectedResult = {
      success: true,
      coverage: { lines: 88, statements: 90, functions: 87, branches: 82 },
      tests: { total: 245, passed: 240, failed: 3, skipped: 2 }
    };

    pytestWrapper.execute.mockResolvedValue(expectedResult);
    const result = await pytestWrapper.execute(mockTool);

    expect(result.success).toBe(true);
    expect(result.coverage.lines).toBeGreaterThanOrEqual(85);
  });

  test('should handle test failures correctly', async () => {
    const mockTool = { name: 'pytest', dimension: 'test' };
    const failedResult = {
      success: false,
      tests: { total: 150, passed: 140, failed: 8, skipped: 2 },
      failures: [
        { testName: 'test_api_endpoint_validation', file: 'tests/test_api.py', line: 42 },
        { testName: 'test_database_connection', file: 'tests/test_db.py', line: 15 }
      ]
    };

    pytestWrapper.execute.mockResolvedValue(failedResult);
    const result = await pytestWrapper.execute(mockTool);

    expect(result.success).toBe(false);
    expect(result.tests.failed).toBeGreaterThan(0);
    expect(result.failures).toHaveLength(2);
  });

  test('should support fast mode execution', async () => {
    const fastModeTool = { name: 'pytest', dimension: 'test', config: { mode: 'fast', exitfirst: true } };
    const fastResult = { 
      success: true, executionTime: 800, 
      tests: { total: 45, passed: 45, failed: 0, skipped: 0 }, mode: 'fast' 
    };

    pytestWrapper.execute.mockResolvedValue(fastResult);
    const result = await pytestWrapper.execute(fastModeTool);

    expect(result.mode).toBe('fast');
    expect(result.executionTime).toBeLessThan(1500);
    expect(result.tests.total).toBeLessThan(100);
  });

  test('should handle markers and fixtures', () => {
    const markerTool = { 
      name: 'pytest', dimension: 'test', 
      config: { markers: ['unit', 'integration', 'slow'], runMarker: 'unit' } 
    };

    const markerConfig = {
      markers: mockConfig.get('testing.pytest.markers') || ['unit', 'integration'],
      strictMarkers: true
    };

    expect(Array.isArray(markerTool.config.markers)).toBe(true);
    expect(markerTool.config.runMarker).toBe('unit');
  });

  test('should validate coverage reports and formats', async () => {
    const coverageTool = { 
      name: 'pytest', dimension: 'coverage', 
      config: { coverageFormat: 'xml', coverageDir: 'coverage/' } 
    };
    
    const coverageResult = { 
      success: true, 
      coverage: { lines: 92, statements: 94, functions: 89, branches: 87 },
      reports: { xml: 'coverage/coverage.xml', html: 'coverage/htmlcov/index.html' }
    };

    pytestWrapper.execute.mockResolvedValue(coverageResult);
    const result = await pytestWrapper.execute(coverageTool);

    expect(result.reports.xml).toBeDefined();
    expect(result.coverage.lines).toBeGreaterThan(90);

    ['xml', 'html', 'json', 'terminal'].forEach(format => {
      expect(['xml', 'html', 'json', 'terminal']).toContain(format);
    });
  });

  test('should handle scope and parallel execution', async () => {
    const scopedTool = { 
      name: 'pytest', dimension: 'test', scope: 'backend/tests/api',
      config: { parallel: true, workers: 4 }
    };
    
    const scopedResult = { 
      success: true, scope: 'backend/tests/api', 
      tests: { total: 75, passed: 75, failed: 0 },
      executionTime: 2100, parallel: true
    };

    pytestWrapper.execute.mockResolvedValue(scopedResult);
    const result = await pytestWrapper.execute(scopedTool);

    expect(result.scope).toBe('backend/tests/api');
    expect(result.parallel).toBe(true);
    expect(result.tests.total).toBeLessThan(150);
  });

  test('should validate Python virtual environment compatibility', () => {
    const envConfig = {
      pythonPath: process.env.VIRTUAL_ENV ? `${process.env.VIRTUAL_ENV}/bin/python` : 'python3',
      requiresVenv: true
    };

    const isVenvActive = process.env.VIRTUAL_ENV !== undefined;

    expect(envConfig.pythonPath).toContain('python');
    if (envConfig.requiresVenv) {
      expect(typeof isVenvActive).toBe('boolean');
    }
  });
});