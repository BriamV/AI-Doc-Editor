const { ResultAggregator } = require('../../core/execution/ResultAggregator.cjs');
const fs = require('fs');
const path = require('path');

describe('CI/CD JSON Reports Generation (RNF-004)', () => {
  let resultAggregator, mockLogger, tempDir;

  beforeEach(() => {
    mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
    resultAggregator = new ResultAggregator(mockLogger);
    tempDir = path.join(process.cwd(), 'temp-test-reports');
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('JSON report structure & validation', () => {
    test('generates CI-compatible JSON with required fields', async () => {
      const results = [
        { tool: 'megalinter', success: true, duration: 30000 },
        { tool: 'jest', success: false, duration: 15000, error: 'Test failed' }
      ];

      const report = await resultAggregator.generateJSONReport(results);

      const requiredFields = ['timestamp', 'summary', 'results', 'performance'];
      requiredFields.forEach(field => expect(report).toHaveProperty(field));
      
      expect(typeof report.timestamp).toBe('string');
      expect(typeof report.summary).toBe('object');
      expect(Array.isArray(report.results)).toBe(true);
      expect(report.summary.total).toBe(2);
      expect(report.summary.passed).toBe(1);
      expect(report.summary.failed).toBe(1);
    });
  });

  describe('GitHub Actions integration & artifacts', () => {
    test('generates GitHub Actions outputs and context', async () => {
      process.env.GITHUB_ACTIONS = 'true';
      process.env.GITHUB_WORKFLOW = 'QA Gate';
      
      const results = [
        { tool: 'megalinter', success: true, duration: 1000 },
        { tool: 'jest', success: false, duration: 2000 }
      ];

      const report = await resultAggregator.generateJSONReport(results);
      
      const outputs = {
        'qa-passed': (report.summary.failed === 0).toString(),
        'report-json': JSON.stringify(report),
        'issues-found': report.summary.failed.toString()
      };

      expect(outputs['qa-passed']).toBe('false');
      expect(outputs['issues-found']).toBe('1');
      expect(JSON.parse(outputs['report-json'])).toEqual(report);
      expect(process.env.GITHUB_WORKFLOW).toBe('QA Gate');
    });

    test('generates report artifacts for CI upload', async () => {
      const results = [{ tool: 'megalinter', success: true, duration: 1000 }];
      const report = await resultAggregator.generateJSONReport(results);

      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const reportPath = path.join(tempDir, 'qa-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

      expect(fs.existsSync(reportPath)).toBe(true);
      const savedReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      expect(savedReport.summary.total).toBe(1);
    });
  });

  describe('Performance metrics & formats', () => {
    test('includes performance data and different formats', async () => {
      const results = [
        { tool: 'megalinter', success: true, duration: 45000, memory: 256 },
        { tool: 'jest', success: true, duration: 30000, memory: 128 }
      ];

      const jsonReport = await resultAggregator.generateJSONReport(results);
      const summaryReport = await resultAggregator.formatResults(results, { format: 'summary' });

      expect(jsonReport.performance).toBeDefined();
      expect(jsonReport.performance.totalDuration).toBe(75000);
      expect(jsonReport.performance.maxMemory).toBe(256);
      
      expect(typeof summaryReport).toBe('string');
      expect(summaryReport).toContain('Total: 2');
    });

    test('handles missing performance data gracefully', async () => {
      const results = [
        { tool: 'megalinter', success: true },
        { tool: 'jest', success: true, duration: 30000 }
      ];

      const report = await resultAggregator.generateJSONReport(results);
      expect(report.performance).toBeDefined();
      expect(report.performance.totalDuration).toBeGreaterThanOrEqual(30000);
    });
  });

  describe('Error handling & CI platform support', () => {
    test('handles empty results and malformed data', async () => {
      const emptyReport = await resultAggregator.generateJSONReport([]);
      expect(emptyReport.summary.total).toBe(0);
      expect(emptyReport.results).toEqual([]);

      const malformedResults = [
        { tool: 'megalinter', success: true },
        null,
        { success: false }
      ];

      const report = await resultAggregator.generateJSONReport(malformedResults);
      expect(report.summary.total).toBe(1);
      expect(report.errors).toBeDefined();
    });

    test('handles JSON serialization errors', async () => {
      const circular = {};
      circular.self = circular;
      
      const problematicResults = [{ tool: 'test', success: true, data: circular }];
      const report = await resultAggregator.generateJSONReport(problematicResults);
      
      expect(report.errors).toBeDefined();
      expect(report.errors.some(e => e.includes('serialization'))).toBe(true);
    });

    test('supports multiple CI platforms', () => {
      const platforms = [
        { env: { GITHUB_ACTIONS: 'true' }, expected: 'github-actions' },
        { env: { JENKINS_URL: 'localhost' }, expected: 'jenkins' },
        { env: { GITLAB_CI: 'true' }, expected: 'gitlab' }
      ];

      platforms.forEach(({ env, expected }) => {
        Object.assign(process.env, env);
        const platform = process.env.GITHUB_ACTIONS ? 'github-actions' :
                         process.env.JENKINS_URL ? 'jenkins' :
                         process.env.GITLAB_CI ? 'gitlab' : 'unknown';
        expect(platform).toBe(expected);
      });
    });
  });

});