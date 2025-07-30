const { ResultAggregator } = require('../../core/execution/ResultAggregator.cjs');

describe('Result Aggregation Integration (RNF-004)', () => {
  let resultAggregator, mockLogger;

  beforeEach(() => {
    mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
    resultAggregator = new ResultAggregator(mockLogger);
    jest.clearAllMocks();
  });

  describe('Result aggregation & processing', () => {
    const testResults = [
      { tool: 'megalinter', success: true, dimension: 'error-detection', warnings: 2 },
      { tool: 'jest', success: true, dimension: 'testing-coverage', coverage: 85 },
      { tool: 'snyk', success: false, dimension: 'security-audit', vulnerabilities: { high: 1 } },
      { tool: 'tsc', success: true, dimension: 'build-dependencies', duration: 1200 }
    ];

    test('aggregates results & calculates metrics', async () => {
      const aggregated = await resultAggregator.aggregateResults(testResults);
      
      expect(aggregated.summary.total).toBe(4);
      expect(aggregated.summary.passed).toBe(3);
      expect(aggregated.summary.failed).toBe(1);
      expect(aggregated.byDimension).toHaveProperty('error-detection');
      expect(aggregated.score).toBeGreaterThan(0);
      expect(aggregated.score).toBeLessThanOrEqual(100);
      expect(aggregated.grade).toMatch(/^[A-F][+-]?$/);
    });
  });

  describe('JSON report & output formats', () => {
    test('generates CI/CD JSON with performance', async () => {
      const results = [
        { tool: 'megalinter', success: true, duration: 30000, memory: 256 },
        { tool: 'jest', success: false, error: 'Test failed', duration: 12000 }
      ];

      const report = await resultAggregator.generateJSONReport(results);

      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('summary');
      expect(report.summary.total).toBe(2);
      expect(report.performance.totalDuration).toBe(42000);
      expect(report.performance.maxMemory).toBe(256);
    });

    test('formats different output types', async () => {
      const results = [
        { tool: 'megalinter', success: true, dimension: 'error-detection' },
        { tool: 'jest', success: false, dimension: 'testing', error: 'Coverage low' }
      ];

      const summary = await resultAggregator.formatResults(results, { format: 'summary' });
      const detailed = await resultAggregator.formatResults(results, { format: 'detailed' });
      const table = await resultAggregator.formatResults(results, { format: 'table' });
      
      expect(summary).toContain('Total: 2');
      expect(detailed).toContain('megalinter');
      expect(table).toContain('Tool');
    });

    test('handles malformed results gracefully', async () => {
      const malformed = [{ tool: 'test' }, null, { success: true }];
      
      const report = await resultAggregator.generateJSONReport(malformed);
      expect(report.errors).toBeDefined();
      expect(report.summary.total).toBe(0);
    });
  });

  describe('Recommendation engine & error handling', () => {
    test('generates prioritized recommendations', async () => {
      const results = [
        { tool: 'tsc', success: false, dimension: 'build-dependencies', critical: true },
        { tool: 'megalinter', success: false, dimension: 'error-detection', errors: ['Syntax error'] },
        { tool: 'snyk', success: false, dimension: 'security-audit', vulnerabilities: { high: 2 } }
      ];

      const aggregated = await resultAggregator.aggregateResults(results);
      
      expect(aggregated.recommendations).toBeDefined();
      expect(aggregated.recommendations.length).toBeGreaterThan(0);
      expect(aggregated.recommendations[0]).toContain('CRITICAL');
      expect(aggregated.recommendations.some(r => r.includes('syntax'))).toBe(true);
      expect(aggregated.recommendations.some(r => r.includes('security'))).toBe(true);
    });

    test('handles edge cases & errors', async () => {
      const emptyResults = await resultAggregator.aggregateResults([]);
      expect(emptyResults.summary.total).toBe(0);
      expect(emptyResults.score).toBe(0);

      jest.spyOn(JSON, 'stringify').mockImplementationOnce(() => {
        throw new Error('JSON failed');
      });
      
      const output = await resultAggregator.formatResults([{ tool: 'test', success: true }], { format: 'json' });
      expect(output).toContain('Error generating JSON');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    test('recovers from circular reference errors', async () => {
      const circular = {};
      circular.self = circular;
      const problematic = [{ tool: 'test', success: true, data: circular }];

      const report = await resultAggregator.generateJSONReport(problematic);
      expect(report.errors.some(e => e.includes('serialization'))).toBe(true);
    });
  });

});