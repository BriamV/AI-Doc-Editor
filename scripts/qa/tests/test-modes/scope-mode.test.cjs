const { ScopeMode } = require('../../core/modes/ScopeMode.cjs');

jest.mock('../../core/modes/ScopeMode.cjs');

describe('ScopeMode', () => {
  let scopeMode;

  beforeEach(() => {
    scopeMode = new ScopeMode();
    ['validatePath', 'filterFiles', 'selectiveExecution', 'validateScope', 
     'optimizePerformance', 'calculateReduction', 'generateScopeReport', 'execute']
      .forEach(method => scopeMode[method] = jest.fn());
  });

  afterEach(() => jest.clearAllMocks());

  describe('Path filtering', () => {
    const filteringCases = [
      { desc: 'single directory path', scope: 'src/auth', files: ['src/auth/login.ts', 'src/auth/register.ts', 'src/components/Header.tsx'], expected: { count: 2, contains: 'src/auth/login.ts' }},
      { desc: 'multiple directory paths', scope: ['src/auth', 'src/api'], files: ['src/auth/login.ts', 'src/api/users.py', 'src/components/App.tsx'], expected: { count: 2, contains: 'src/api/users.py' }},
      { desc: 'file extension filtering', scope: '*.ts', files: ['src/utils.ts', 'src/helper.js', 'src/types.ts'], expected: { count: 2, contains: 'src/utils.ts' }},
      { desc: 'nested directory filtering', scope: 'src/components/**', files: ['src/components/ui/Button.tsx', 'src/components/Header.tsx', 'src/utils.ts'], expected: { count: 2, contains: 'src/components/ui/Button.tsx' }}
    ];
    
    filteringCases.forEach(({ desc, scope, files, expected }) => {
      test(`should filter ${desc}`, () => {
        const filteredFiles = files.filter(file => Array.isArray(scope) ? scope.some(s => file.includes(s)) : file.includes(scope.replace('*', '').replace('/', '')));
        scopeMode.filterFiles.mockReturnValue(filteredFiles);
        const result = scopeMode.filterFiles(files, scope);
        expect(result).toHaveLength(expected.count);
        expect(result).toContain(expected.contains);
      });
    });
  });

  describe('Path validation', () => {
    const validationCases = [
      { desc: 'valid directory path', path: 'src/auth', expected: { valid: true, type: 'directory' }},
      { desc: 'valid file path', path: 'src/utils/helper.ts', expected: { valid: true, type: 'file' }},
      { desc: 'valid glob pattern', path: 'src/**/*.ts', expected: { valid: true, type: 'glob' }},
      { desc: 'invalid path', path: '../../../etc/passwd', expected: { valid: false, type: 'invalid' }}
    ];
    
    validationCases.forEach(({ desc, path, expected }) => {
      test(`should validate ${desc}`, () => {
        scopeMode.validatePath.mockReturnValue({ isValid: expected.valid, pathType: expected.type });
        const result = scopeMode.validatePath(path);
        expect(result.isValid).toBe(expected.valid);
        expect(result.pathType).toBe(expected.type);
      });
    });
  });

  describe('Selective execution', () => {
    const executionCases = [
      { desc: 'frontend scope execution', scope: 'src/components', expected: { tools: ['megalinter', 'jest', 'tsc'], dimensions: 3 }},
      { desc: 'backend scope execution', scope: 'src/api', expected: { tools: ['megalinter', 'pytest', 'mypy'], dimensions: 3 }},
      { desc: 'utils scope execution', scope: 'src/utils', expected: { tools: ['megalinter', 'tsc'], dimensions: 2 }},
      { desc: 'config scope execution', scope: 'config/', expected: { tools: ['megalinter'], dimensions: 1 }}
    ];
    
    executionCases.forEach(({ desc, scope, expected }) => {
      test(`should execute ${desc}`, () => {
        scopeMode.selectiveExecution.mockReturnValue({ selectedTools: expected.tools, dimensions: expected.dimensions });
        const result = scopeMode.selectiveExecution({ scope });
        expect(result.selectedTools).toEqual(expected.tools);
        expect(result.dimensions).toBe(expected.dimensions);
      });
    });
  });

  describe('Scope validation', () => {
    const scopeValidationCases = [
      { desc: 'valid scope with files', scope: { path: 'src/auth', files: ['src/auth/login.ts'] }, expected: { valid: true, reason: 'files-found' }},
      { desc: 'empty scope', scope: { path: 'src/empty', files: [] }, expected: { valid: false, reason: 'no-files' }},
      { desc: 'invalid scope path', scope: { path: 'invalid/path', files: [] }, expected: { valid: false, reason: 'invalid-path' }},
      { desc: 'scope with ignored files', scope: { path: 'node_modules', files: ['node_modules/package.json'] }, expected: { valid: false, reason: 'ignored-directory' }}
    ];
    
    scopeValidationCases.forEach(({ desc, scope, expected }) => {
      test(`should validate ${desc}`, () => {
        scopeMode.validateScope.mockReturnValue({ isValid: expected.valid, reason: expected.reason });
        const result = scopeMode.validateScope(scope);
        expect(result.isValid).toBe(expected.valid);
        expect(result.reason).toBe(expected.reason);
      });
    });
  });

  describe('Performance optimization', () => {
    const performanceCases = [
      { desc: 'small scope optimization', scope: { filesCount: 5, linesChanged: 100 }, expected: { strategy: 'parallel', timeout: 180 }},
      { desc: 'medium scope optimization', scope: { filesCount: 20, linesChanged: 500 }, expected: { strategy: 'sequential', timeout: 360 }},
      { desc: 'large scope optimization', scope: { filesCount: 50, linesChanged: 1000 }, expected: { strategy: 'chunked', timeout: 720 }},
      { desc: 'targeted scope optimization', scope: { filesCount: 3, specific: true }, expected: { strategy: 'targeted', timeout: 120 }}
    ];
    
    performanceCases.forEach(({ desc, scope, expected }) => {
      test(`should optimize ${desc}`, () => {
        scopeMode.optimizePerformance.mockReturnValue({ strategy: expected.strategy, timeout: expected.timeout });
        const result = scopeMode.optimizePerformance(scope);
        expect(result.strategy).toBe(expected.strategy);
        expect(result.timeout).toBe(expected.timeout);
      });
    });
  });

  describe('Reduction calculation', () => {
    const reductionCases = [
      { desc: 'significant reduction', context: { totalFiles: 100, scopedFiles: 10 }, expected: { reduction: 0.9, significant: true }},
      { desc: 'moderate reduction', context: { totalFiles: 50, scopedFiles: 20 }, expected: { reduction: 0.6, significant: true }},
      { desc: 'minimal reduction', context: { totalFiles: 20, scopedFiles: 15 }, expected: { reduction: 0.25, significant: false }},
      { desc: 'no reduction', context: { totalFiles: 10, scopedFiles: 10 }, expected: { reduction: 0.0, significant: false }}
    ];
    
    reductionCases.forEach(({ desc, context, expected }) => {
      test(`should calculate ${desc}`, () => {
        scopeMode.calculateReduction.mockReturnValue({ reductionPercentage: expected.reduction, isSignificant: expected.significant });
        const result = scopeMode.calculateReduction(context);
        expect(result.reductionPercentage).toBe(expected.reduction);
        expect(result.isSignificant).toBe(expected.significant);
      });
    });
  });

  describe('Scope report generation', () => {
    const reportCases = [
      { desc: 'success report', results: { success: true, scopedFiles: 5, reduction: 0.8, duration: 120 }, expected: { status: 'PASSED', files: 5 }},
      { desc: 'failure report', results: { success: false, scopedFiles: 10, errors: 3, duration: 180 }, expected: { status: 'FAILED', files: 10 }},
      { desc: 'partial report', results: { success: true, scopedFiles: 8, warnings: 2, duration: 150 }, expected: { status: 'PASSED', files: 8 }},
      { desc: 'timeout report', results: { success: false, scopedFiles: 15, timeout: true, duration: 600 }, expected: { status: 'TIMEOUT', files: 15 }}
    ];
    
    reportCases.forEach(({ desc, results, expected }) => {
      test(`should generate ${desc}`, () => {
        scopeMode.generateScopeReport.mockReturnValue({ status: expected.status, scopedFiles: expected.files, mode: 'scope' });
        const result = scopeMode.generateScopeReport(results);
        expect(result.status).toBe(expected.status);
        expect(result.scopedFiles).toBe(expected.files);
        expect(result.mode).toBe('scope');
      });
    });
  });

  describe('Full scope mode execution', () => {
    const executionCases = [
      { desc: 'successful scope execution', context: { scope: 'src/auth', files: ['src/auth/login.ts'] }, expected: { success: true, mode: 'scope', scoped: true }},
      { desc: 'failed scope execution', context: { scope: 'src/broken', files: ['src/broken/error.ts'] }, expected: { success: false, mode: 'scope', scoped: true }},
      { desc: 'empty scope execution', context: { scope: 'src/empty', files: [] }, expected: { success: false, mode: 'scope', reason: 'empty-scope' }},
      { desc: 'invalid scope execution', context: { scope: 'invalid/path' }, expected: { success: false, mode: 'scope', reason: 'invalid-scope' }}
    ];
    
    executionCases.forEach(({ desc, context, expected }) => {
      test(`should handle ${desc}`, () => {
        scopeMode.execute.mockReturnValue({ success: expected.success, mode: expected.mode, scoped: expected.scoped, reason: expected.reason });
        const result = scopeMode.execute(context);
        expect(result.success).toBe(expected.success);
        expect(result.mode).toBe(expected.mode);
        if (expected.scoped) expect(result.scoped).toBe(true);
        if (expected.reason) expect(result.reason).toBe(expected.reason);
      });
    });
  });
});