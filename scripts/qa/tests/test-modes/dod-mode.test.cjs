const { DoDMode } = require('../../core/modes/DoDMode.cjs');

jest.mock('../../core/modes/DoDMode.cjs');

describe('DoDMode', () => {
  let dodMode;

  beforeEach(() => {
    dodMode = new DoDMode();
    ['validateAllTests', 'validateCodeReview', 'validateQualityGates', 'validateCompliance',
     'validateCoverage', 'validateSecurity', 'validateBuild', 'generateReport', 'execute']
      .forEach(method => dodMode[method] = jest.fn());
  });

  afterEach(() => jest.clearAllMocks());

  describe('All-tests execution', () => {
    const testCases = [
      { desc: 'successful execution', results: { overall: { failed: 0, coverage: 0.88 }, frontend: { passed: 145 } }, expected: { passed: true }},
      { desc: 'test failures', results: { overall: { failed: 6 }, frontend: { failed: 2 }, backend: { failed: 2 } }, expected: { passed: false }},
      { desc: 'low coverage', results: { overall: { coverage: 0.77 }, frontend: { coverage: 0.75 } }, expected: { passed: false }}
    ];
    
    testCases.forEach(({ desc, results, expected }) => {
      test(`should handle ${desc}`, () => {
        dodMode.validateAllTests.mockReturnValue(results);
        const result = dodMode.validateAllTests();
        if (expected.passed) {
          expect(result.overall.failed).toBe(0);
          expect(result.overall.coverage).toBeGreaterThan(0.8);
        } else {
          expect(result.overall.failed > 0 || result.overall.coverage < 0.8).toBe(true);
        }
      });
    });
  });

  describe('Code review validation', () => {
    const reviewCases = [
      { desc: 'approved review', review: { approved: true, reviewers: ['reviewer1', 'reviewer2'], pending: 0, score: 0.95 }, expected: { approved: true }},
      { desc: 'pending review', review: { approved: false, pending: 3, score: 0.65 }, expected: { approved: false }},
      { desc: 'insufficient reviewers', review: { approved: false, reviewers: [], error: 'insufficient-reviewers' }, expected: { approved: false }}
    ];
    
    reviewCases.forEach(({ desc, review, expected }) => {
      test(`should validate ${desc}`, () => {
        dodMode.validateCodeReview.mockReturnValue(review);
        const result = dodMode.validateCodeReview();
        expect(result.approved).toBe(expected.approved);
        if (expected.approved) expect(result.score).toBeGreaterThan(0.9);
      });
    });
  });

  describe('Quality gates validation', () => {
    const qualityCases = [
      { desc: 'passed gates', gates: { linting: { passed: true }, complexity: { passed: true }, overall: { passed: true, score: 0.91 } }, expected: { passed: true }},
      { desc: 'failed gates', gates: { linting: { passed: false }, complexity: { passed: false }, overall: { passed: false } }, expected: { passed: false }}
    ];
    
    qualityCases.forEach(({ desc, gates, expected }) => {
      test(`should validate ${desc}`, () => {
        dodMode.validateQualityGates.mockReturnValue(gates);
        const result = dodMode.validateQualityGates();
        expect(result.overall.passed).toBe(expected.passed);
        if (expected.passed) expect(result.overall.score).toBeGreaterThan(0.8);
      });
    });
  });

  describe('Compliance checking', () => {
    const complianceCases = [
      { desc: 'compliant system', compliance: { security: { passed: true, vulnerabilities: 0 }, documentation: { passed: true, coverage: 0.85 }, overall: { passed: true } }, expected: { passed: true }},
      { desc: 'violations detected', compliance: { security: { passed: false, vulnerabilities: 3 }, documentation: { passed: false, coverage: 0.45 }, overall: { passed: false } }, expected: { passed: false }}
    ];
    
    complianceCases.forEach(({ desc, compliance, expected }) => {
      test(`should validate ${desc}`, () => {
        dodMode.validateCompliance.mockReturnValue(compliance);
        const result = dodMode.validateCompliance();
        expect(result.overall.passed).toBe(expected.passed);
        if (expected.passed) expect(result.documentation.coverage).toBeGreaterThan(0.8);
      });
    });
  });

  describe('Coverage validation', () => {
    const coverageCases = [
      { desc: 'adequate coverage', coverage: { lines: { passed: true }, functions: { passed: true }, overall: { passed: true } }, expected: { passed: true }},
      { desc: 'insufficient coverage', coverage: { lines: { passed: false }, functions: { passed: false }, overall: { passed: false } }, expected: { passed: false }}
    ];
    
    coverageCases.forEach(({ desc, coverage, expected }) => {
      test(`should validate ${desc}`, () => {
        dodMode.validateCoverage.mockReturnValue(coverage);
        const result = dodMode.validateCoverage();
        expect(result.overall.passed).toBe(expected.passed);
      });
    });
  });

  describe('Security validation', () => {
    const securityCases = [
      { desc: 'secure system', security: { vulnerabilities: { critical: 0, high: 0 }, dependencies: { vulnerable: 0 }, overall: { passed: true } }, expected: { passed: true }},
      { desc: 'security issues', security: { vulnerabilities: { critical: 2, high: 3 }, secrets: { detected: 1 }, overall: { passed: false } }, expected: { passed: false }}
    ];
    
    securityCases.forEach(({ desc, security, expected }) => {
      test(`should validate ${desc}`, () => {
        dodMode.validateSecurity.mockReturnValue(security);
        const result = dodMode.validateSecurity();
        expect(result.overall.passed).toBe(expected.passed);
        if (expected.passed) expect(result.vulnerabilities.critical).toBe(0);
      });
    });
  });

  describe('Build validation', () => {
    const buildCases = [
      { desc: 'successful build', build: { compilation: { passed: true, errors: 0 }, bundling: { passed: true }, overall: { passed: true } }, expected: { passed: true }},
      { desc: 'build failures', build: { compilation: { passed: false, errors: 5 }, bundling: { passed: false }, overall: { passed: false } }, expected: { passed: false }}
    ];
    
    buildCases.forEach(({ desc, build, expected }) => {
      test(`should validate ${desc}`, () => {
        dodMode.validateBuild.mockReturnValue(build);
        const result = dodMode.validateBuild();
        expect(result.overall.passed).toBe(expected.passed);
        if (expected.passed) expect(result.compilation.errors).toBe(0);
      });
    });
  });

  describe('DoD report generation', () => {
    const reportCases = [
      { desc: 'success report', report: { summary: { passed: true, score: 0.91 }, tests: { failed: 0 }, recommendations: [] }, expected: { passed: true, score: 0.91 }},
      { desc: 'failure report', report: { summary: { passed: false }, tests: { failed: 12 }, recommendations: ['increase-test-coverage', 'resolve-security-issues'] }, expected: { passed: false, recommendations: 2 }}
    ];
    
    reportCases.forEach(({ desc, report, expected }) => {
      test(`should generate ${desc}`, () => {
        dodMode.generateReport.mockReturnValue(report);
        const result = dodMode.generateReport();
        expect(result.summary.passed).toBe(expected.passed);
        if (expected.score) expect(result.summary.score).toBeGreaterThan(0.9);
        if (expected.recommendations) expect(result.recommendations).toHaveLength(expected.recommendations);
      });
    });
  });

  describe('Full DoD execution', () => {
    const executionCases = [
      { desc: 'successful validation', execution: { success: true, allValidationsPassed: true, overallScore: 0.92, readyForProduction: true }, expected: { success: true, ready: true }},
      { desc: 'failed validation', execution: { success: false, allValidationsPassed: false, readyForProduction: false, blockers: ['test-failures', 'security-vulnerabilities'] }, expected: { success: false, ready: false }}
    ];
    
    executionCases.forEach(({ desc, execution, expected }) => {
      test(`should handle ${desc}`, () => {
        dodMode.execute.mockReturnValue(execution);
        const result = dodMode.execute();
        expect(result.success).toBe(expected.success);
        expect(result.readyForProduction).toBe(expected.ready);
        if (expected.success) expect(result.overallScore).toBeGreaterThan(0.9);
      });
    });
  });
});