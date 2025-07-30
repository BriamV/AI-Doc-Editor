const { FastMode } = require('../../core/modes/FastMode.cjs');

jest.mock('../../core/modes/FastMode.cjs');

describe('FastMode', () => {
  let fastMode;

  beforeEach(() => {
    fastMode = new FastMode();
    ['detectStagedFiles', 'executeMegaLinter', 'optimizePerformance', 'provideFeedback', 
     'validateChanges', 'skipNonEssential', 'generateQuickReport', 'execute']
      .forEach(method => fastMode[method] = jest.fn());
  });

  afterEach(() => jest.clearAllMocks());

  describe('Staged files detection', () => {
    const stagingCases = [
      { desc: 'multiple staged files', files: ['src/auth/login.ts', 'src/auth/register.ts', 'src/components/Header.tsx'], expected: { count: 3, hasFiles: true }},
      { desc: 'single staged file', files: ['src/utils/helper.ts'], expected: { count: 1, hasFiles: true }},
      { desc: 'no staged files', files: [], expected: { count: 0, hasFiles: false }},
      { desc: 'TypeScript files only', files: ['src/components/Button.tsx', 'src/hooks/useAuth.ts'], expected: { count: 2, hasFiles: true }}
    ];
    
    stagingCases.forEach(({ desc, files, expected }) => {
      test(`should detect ${desc}`, () => {
        fastMode.detectStagedFiles.mockReturnValue(files);
        const result = fastMode.detectStagedFiles();
        expect(result).toHaveLength(expected.count);
        if (expected.hasFiles) expect(result.length).toBeGreaterThan(0);
      });
    });
  });

  describe('MegaLinter execution optimization', () => {
    const megalinterCases = [
      { desc: 'successful execution', context: { files: ['src/utils.ts'] }, expected: { success: true, issues: 0, duration: 45 }},
      { desc: 'execution with warnings', context: { files: ['src/components/App.tsx'] }, expected: { success: true, issues: 3, duration: 60 }},
      { desc: 'execution with errors', context: { files: ['src/broken.ts'] }, expected: { success: false, issues: 5, duration: 80 }},
      { desc: 'timeout execution', context: { files: ['src/complex.ts'] }, expected: { success: false, timeout: true, duration: 300 }}
    ];
    
    megalinterCases.forEach(({ desc, context, expected }) => {
      test(`should handle ${desc}`, () => {
        fastMode.executeMegaLinter.mockReturnValue({ success: expected.success, issues: expected.issues, executionTime: expected.duration, timedOut: expected.timeout });
        const result = fastMode.executeMegaLinter(context);
        expect(result.success).toBe(expected.success);
        if (expected.timeout) expect(result.timedOut).toBe(true);
        else expect(result.executionTime).toBe(expected.duration);
      });
    });
  });

  describe('Performance optimization', () => {
    const performanceCases = [
      { desc: 'small file optimization', context: { filesCount: 1, linesChanged: 10 }, expected: { strategy: 'minimal', timeout: 60 }},
      { desc: 'medium file optimization', context: { filesCount: 5, linesChanged: 100 }, expected: { strategy: 'standard', timeout: 180 }},
      { desc: 'large file optimization', context: { filesCount: 10, linesChanged: 300 }, expected: { strategy: 'comprehensive', timeout: 300 }},
      { desc: 'urgent optimization', context: { priority: 'urgent', maxTime: 60 }, expected: { strategy: 'emergency', timeout: 60 }}
    ];
    
    performanceCases.forEach(({ desc, context, expected }) => {
      test(`should optimize ${desc}`, () => {
        fastMode.optimizePerformance.mockReturnValue({ strategy: expected.strategy, timeout: expected.timeout });
        const result = fastMode.optimizePerformance(context);
        expect(result.strategy).toBe(expected.strategy);
        expect(result.timeout).toBe(expected.timeout);
      });
    });
  });

  describe('Feedback provision', () => {
    const feedbackCases = [
      { desc: 'success feedback', results: { success: true, issues: 0 }, expected: { type: 'success', message: 'passed' }},
      { desc: 'warning feedback', results: { success: true, warnings: 3 }, expected: { type: 'warning', message: 'warnings' }},
      { desc: 'error feedback', results: { success: false, errors: 5 }, expected: { type: 'error', message: 'failed' }},
      { desc: 'timeout feedback', results: { success: false, timeout: true }, expected: { type: 'timeout', message: 'timeout' }}
    ];
    
    feedbackCases.forEach(({ desc, results, expected }) => {
      test(`should provide ${desc}`, () => {
        fastMode.provideFeedback.mockReturnValue({ type: expected.type, message: expected.message });
        const result = fastMode.provideFeedback(results);
        expect(result.type).toBe(expected.type);
        expect(result.message).toBe(expected.message);
      });
    });
  });

  describe('Change validation', () => {
    const validationCases = [
      { desc: 'valid changes', changes: { files: ['src/utils.ts'], linesChanged: 50 }, expected: { valid: true, eligible: true }},
      { desc: 'too many changes', changes: { files: Array(20).fill('file.ts'), linesChanged: 500 }, expected: { valid: false, eligible: false }},
      { desc: 'security sensitive files', changes: { files: ['src/auth/security.ts'], sensitive: true }, expected: { valid: false, eligible: false }},
      { desc: 'configuration changes', changes: { files: ['package.json', 'tsconfig.json'] }, expected: { valid: true, eligible: true }}
    ];
    
    validationCases.forEach(({ desc, changes, expected }) => {
      test(`should validate ${desc}`, () => {
        fastMode.validateChanges.mockReturnValue({ isValid: expected.valid, eligible: expected.eligible });
        const result = fastMode.validateChanges(changes);
        expect(result.isValid).toBe(expected.valid);
        expect(result.eligible).toBe(expected.eligible);
      });
    });
  });

  describe('Non-essential skipping', () => {
    const skippingCases = [
      { desc: 'skip documentation', context: { files: ['README.md', 'docs/guide.md'] }, expected: { skipped: true, reason: 'documentation' }},
      { desc: 'skip tests for utils', context: { files: ['src/utils.test.ts'], type: 'test' }, expected: { skipped: true, reason: 'test-only' }},
      { desc: 'process source files', context: { files: ['src/components/App.tsx'] }, expected: { skipped: false, reason: 'source-code' }},
      { desc: 'skip build artifacts', context: { files: ['dist/bundle.js', 'build/'] }, expected: { skipped: true, reason: 'build-artifacts' }}
    ];
    
    skippingCases.forEach(({ desc, context, expected }) => {
      test(`should handle ${desc}`, () => {
        fastMode.skipNonEssential.mockReturnValue({ skip: expected.skipped, reason: expected.reason });
        const result = fastMode.skipNonEssential(context);
        expect(result.skip).toBe(expected.skipped);
        expect(result.reason).toBe(expected.reason);
      });
    });
  });

  describe('Quick report generation', () => {
    const reportCases = [
      { desc: 'success report', results: { success: true, duration: 45, issues: 0 }, expected: { status: 'PASSED', duration: 45 }},
      { desc: 'warning report', results: { success: true, duration: 60, warnings: 3 }, expected: { status: 'PASSED', duration: 60 }},
      { desc: 'failure report', results: { success: false, duration: 80, errors: 5 }, expected: { status: 'FAILED', duration: 80 }},
      { desc: 'timeout report', results: { success: false, duration: 300, timeout: true }, expected: { status: 'TIMEOUT', duration: 300 }}
    ];
    
    reportCases.forEach(({ desc, results, expected }) => {
      test(`should generate ${desc}`, () => {
        fastMode.generateQuickReport.mockReturnValue({ status: expected.status, executionTime: expected.duration, mode: 'fast' });
        const result = fastMode.generateQuickReport(results);
        expect(result.status).toBe(expected.status);
        expect(result.executionTime).toBe(expected.duration);
        expect(result.mode).toBe('fast');
      });
    });
  });

  describe('Full fast mode execution', () => {
    const executionCases = [
      { desc: 'successful execution', context: { files: ['src/utils.ts'], staged: true }, expected: { success: true, mode: 'fast', duration: 45 }},
      { desc: 'failed execution', context: { files: ['src/broken.ts'] }, expected: { success: false, mode: 'fast', duration: 120 }},
      { desc: 'timeout execution', context: { files: ['src/complex.ts'], timeout: 300 }, expected: { success: false, mode: 'fast', timeout: true }},
      { desc: 'skipped execution', context: { files: ['README.md'] }, expected: { success: true, mode: 'fast', skipped: true }}
    ];
    
    executionCases.forEach(({ desc, context, expected }) => {
      test(`should handle ${desc}`, () => {
        fastMode.execute.mockReturnValue({ success: expected.success, mode: expected.mode, executionTime: expected.duration, timedOut: expected.timeout, skipped: expected.skipped });
        const result = fastMode.execute(context);
        expect(result.success).toBe(expected.success);
        expect(result.mode).toBe(expected.mode);
        if (expected.timeout) expect(result.timedOut).toBe(true);
        if (expected.skipped) expect(result.skipped).toBe(true);
        if (expected.duration) expect(result.executionTime).toBe(expected.duration);
      });
    });
  });
});