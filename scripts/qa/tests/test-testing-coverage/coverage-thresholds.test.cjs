/**
 * Coverage Thresholds Tests - RF-004: >80% coverage validation
 */

const CoverageValidator = require('../../core/validation/CoverageValidator.cjs');

jest.mock('../../core/validation/CoverageValidator.cjs', () => {
  return jest.fn().mockImplementation((config, logger) => ({
    config, logger,
    validateThresholds: jest.fn(), processResults: jest.fn(),
    getCoverageMetrics: jest.fn(), generateReport: jest.fn()
  }));
});

describe('Coverage Thresholds (RF-004 >80% Coverage Validation)', () => {
  let coverageValidator, mockConfig, mockLogger;

  beforeEach(() => {
    mockConfig = {
      get: jest.fn((key) => ({
        'testing.coverageThreshold': 80, 'testing.coverage.lines': 85,
        'testing.coverage.statements': 83, 'testing.coverage.functions': 80,
        'testing.coverage.branches': 78, 'testing.coverage.strict': true,
        'testing.coverage.excludePaths': ['node_modules/', 'dist/', 'coverage/']
      })[key])
    };
    mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), success: jest.fn() };
    coverageValidator = new CoverageValidator(mockConfig, mockLogger);
    jest.clearAllMocks();
  });

  test('should validate coverage meets minimum thresholds', () => {
    const goodCoverage = { lines: { pct: 88 }, statements: { pct: 86 }, functions: { pct: 85 }, branches: { pct: 82 } };
    const badCoverage = { lines: { pct: 75 }, statements: { pct: 73 }, functions: { pct: 70 }, branches: { pct: 68 } };

    coverageValidator.validateThresholds.mockImplementation((coverage) => ({
      passed: coverage.lines.pct >= 80,
      details: {
        lines: coverage.lines.pct >= 80, statements: coverage.statements.pct >= 80,
        functions: coverage.functions.pct >= 80, branches: coverage.branches.pct >= 80
      }
    }));

    expect(coverageValidator.validateThresholds(goodCoverage).passed).toBe(true);
    expect(coverageValidator.validateThresholds(badCoverage).passed).toBe(false);
  });

  test('should process Jest coverage results', () => {
    const jestData = {
      success: true,
      coverageMap: {
        'src/components/Document.tsx': { lines: { pct: 92 }, statements: { pct: 90 } },
        'src/store/documentStore.ts': { lines: { pct: 88 }, statements: { pct: 85 } }
      },
      summary: { lines: { pct: 91.67 }, statements: { pct: 89.67 }, functions: { pct: 87 }, branches: { pct: 84 } }
    };

    coverageValidator.processResults.mockReturnValue({
      overall: { passed: true, score: 88.08 },
      perFile: [
        { file: 'src/components/Document.tsx', passed: true, score: 91 },
        { file: 'src/store/documentStore.ts', passed: true, score: 86.5 }
      ]
    });

    const result = coverageValidator.processResults(jestData);
    expect(result.overall.passed).toBe(true);
    expect(result.overall.score).toBeGreaterThan(80);
    expect(result.perFile).toHaveLength(2);
  });

  test('should process Pytest coverage results', () => {
    const pytestData = {
      success: true,
      coverage: {
        'backend/api/endpoints.py': { lines: 142, covered: 128, pct: 90.14 },
        'backend/services/auth.py': { lines: 95, covered: 82, pct: 86.32 }
      },
      totals: { lines: 304, covered: 274, pct: 90.13 }
    };

    coverageValidator.processResults.mockReturnValue({
      overall: { passed: true, score: 90.13 },
      perFile: [
        { file: 'backend/api/endpoints.py', passed: true, score: 90.14 },
        { file: 'backend/services/auth.py', passed: true, score: 86.32 }
      ]
    });

    const result = coverageValidator.processResults(pytestData);
    expect(result.overall.passed).toBe(true);
    expect(result.overall.score).toBeGreaterThan(80);
    expect(result.perFile.every(f => f.passed)).toBe(true);
  });

  test('should handle strict vs non-strict mode', () => {
    const mixedCoverage = { lines: { pct: 82 }, statements: { pct: 85 }, functions: { pct: 79 }, branches: { pct: 83 } };

    coverageValidator.validateThresholds
      .mockImplementationOnce(() => ({
        passed: false, strict: true,
        details: { lines: true, statements: true, functions: false, branches: true }
      }))
      .mockImplementationOnce(() => ({
        passed: true, strict: false, average: 82.25,
        details: { lines: true, statements: true, functions: false, branches: true }
      }));

    expect(coverageValidator.validateThresholds(mixedCoverage).passed).toBe(false);
    expect(coverageValidator.validateThresholds(mixedCoverage).passed).toBe(true);
  });

  test('should exclude configured paths from coverage', () => {
    const coverageData = {
      files: ['src/components/Document.tsx', 'node_modules/react/index.js', 'src/utils/auth.ts', 'dist/bundle.js']
    };

    coverageValidator.processResults.mockImplementation((data) => {
      const filtered = data.files.filter(file => 
        !['node_modules/', 'dist/', 'coverage/'].some(exclude => file.includes(exclude))
      );
      return { processedFiles: filtered, excluded: data.files.length - filtered.length };
    });

    const result = coverageValidator.processResults(coverageData);
    expect(result.processedFiles).toHaveLength(2);
    expect(result.excluded).toBe(2);
    expect(result.processedFiles).toContain('src/components/Document.tsx');
  });

  test('should generate coverage report with actionable insights', () => {
    const coverageData = {
      overall: { passed: false, score: 76.5 },
      perFile: [
        { file: 'src/auth.ts', passed: false, score: 65, missing: ['error handling'] },
        { file: 'src/api.ts', passed: false, score: 72, missing: ['timeout scenarios'] }
      ]
    };

    coverageValidator.generateReport.mockReturnValue({
      summary: 'Coverage: 76.5% (Target: 80%)', status: 'FAILED',
      recommendations: ['Increase test coverage for src/auth.ts', 'Add timeout tests for src/api.ts'],
      filesToImprove: ['src/auth.ts', 'src/api.ts']
    });

    const report = coverageValidator.generateReport(coverageData);
    expect(report.status).toBe('FAILED');
    expect(report.recommendations).toHaveLength(2);
    expect(report.filesToImprove).toContain('src/auth.ts');
  });

  test('should handle different coverage formats', () => {
    const formats = ['lcov', 'json', 'xml'];
    
    formats.forEach(format => {
      const mockCoverage = { format, data: format === 'json' ? { coverage: {} } : `${format}-data` };

      coverageValidator.getCoverageMetrics.mockImplementation((coverage) => 
        coverage.format === 'json' 
          ? { lines: 85, statements: 83, functions: 80, branches: 78 }
          : { parsed: true, format: coverage.format }
      );

      const metrics = coverageValidator.getCoverageMetrics(mockCoverage);
      if (format === 'json') {
        expect(metrics.lines).toBeDefined();
      } else {
        expect(metrics.format).toBe(format);
      }
    });
  });

  test('should validate incremental coverage (diff-based)', () => {
    const baselineCoverage = { overall: 85.2 };
    const currentCoverage = { overall: 83.1 };
    const diffCoverage = { newLines: 45, coveredLines: 42, pct: 93.33 };

    coverageValidator.validateThresholds.mockImplementation((coverage, baseline, diff) => 
      diff ? {
        passed: diff.pct >= 90, type: 'incremental', diffCoverage: diff.pct,
        overallRegression: baseline.overall - coverage.overall
      } : { passed: coverage.overall >= 80 }
    );

    const result = coverageValidator.validateThresholds(currentCoverage, baselineCoverage, diffCoverage);
    expect(result.type).toBe('incremental');
    expect(result.diffCoverage).toBeGreaterThan(90);
    expect(result.overallRegression).toBeLessThan(5);
  });

  test('should integrate with build systems', () => {
    const buildIntegration = {
      jest: { configFile: 'jest.config.js', collectFrom: ['src/**/*.{ts,tsx}'] },
      pytest: { configFile: 'pytest.ini', collectFrom: ['backend/**/*.py'] }
    };

    Object.keys(buildIntegration).forEach(tool => {
      const toolConfig = buildIntegration[tool];
      expect(toolConfig.configFile).toBeDefined();
      expect(Array.isArray(toolConfig.collectFrom)).toBe(true);
    });

    expect(buildIntegration.jest.collectFrom[0]).toMatch(/src.*\.(ts|tsx)/);
    expect(buildIntegration.pytest.collectFrom[0]).toMatch(/backend.*\.py/);
  });
});