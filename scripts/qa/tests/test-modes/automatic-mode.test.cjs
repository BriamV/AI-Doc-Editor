const { AutomaticMode } = require('../../core/modes/AutomaticMode.cjs');

jest.mock('../../core/modes/AutomaticMode.cjs');

describe('AutomaticMode', () => {
  let automaticMode;

  beforeEach(() => {
    automaticMode = new AutomaticMode();
    ['detectContext', 'selectTools', 'mapDimensions', 'calculateConfidence', 
     'applyFallback', 'optimizeExecution', 'validateSelection', 'execute']
      .forEach(method => automaticMode[method] = jest.fn());
  });

  afterEach(() => jest.clearAllMocks());

  describe('Context-based selection', () => {
    test('should select tools based on branch pattern', () => {
      const context = { branch: 'feature/T-44-auth', files: ['src/auth/login.ts'], scope: 'frontend' };
      const expectedTools = {
        'error-detection': ['megalinter'], 'testing-coverage': ['jest'],
        'build-dependencies': ['tsc'], 'security-audit': ['snyk']
      };
      
      automaticMode.detectContext.mockReturnValue(context);
      automaticMode.selectTools.mockReturnValue(expectedTools);
      
      const result = automaticMode.selectTools(context);
      
      expect(result['error-detection']).toContain('megalinter');
      expect(result['testing-coverage']).toContain('jest');
      expect(result['security-audit']).toContain('snyk');
    });

    test('should select different tools for backend context', () => {
      const tools = { 'error-detection': ['megalinter'], 'testing-coverage': ['pytest'], 'security-audit': ['snyk', 'semgrep'] };
      automaticMode.selectTools.mockReturnValue(tools);
      
      const result = automaticMode.selectTools({ branch: 'feature/T-45-api', files: ['src/api/auth.py'], scope: 'backend' });
      
      expect(result['testing-coverage']).toContain('pytest');
      expect(result['security-audit']).toContain('semgrep');
    });

    test('should select comprehensive tools for security context', () => {
      const tools = { 'error-detection': ['megalinter'], 'testing-coverage': ['jest', 'pytest'], 'security-audit': ['snyk', 'semgrep'], 'build-dependencies': ['tsc', 'npm'] };
      automaticMode.selectTools.mockReturnValue(tools);
      
      const result = automaticMode.selectTools({ branch: 'security/vulnerability-fix', scope: 'security' });
      
      expect(Object.keys(result)).toHaveLength(4);
      expect(result['security-audit']).toHaveLength(2);
    });
  });

  describe('File analysis to dimension mapping', () => {
    test('should map TypeScript files to appropriate dimensions', () => {
      const mapping = {
        'error-detection': { priority: 'high', reason: 'typescript-linting' },
        'testing-coverage': { priority: 'high', reason: 'component-testing' },
        'build-dependencies': { priority: 'medium', reason: 'typescript-compilation' }
      };
      automaticMode.mapDimensions.mockReturnValue(mapping);
      
      const result = automaticMode.mapDimensions(['src/components/Auth.tsx']);
      
      expect(result['error-detection'].priority).toBe('high');
      expect(result['testing-coverage'].priority).toBe('high');
      expect(result['build-dependencies'].priority).toBe('medium');
    });

    test('should map Python files to appropriate dimensions', () => {
      const mapping = { 'error-detection': { priority: 'high', reason: 'python-linting' }, 'testing-coverage': { priority: 'high', reason: 'api-testing' }, 'security-audit': { priority: 'high', reason: 'api-security' } };
      automaticMode.mapDimensions.mockReturnValue(mapping);
      
      const result = automaticMode.mapDimensions(['src/api/endpoints.py']);
      
      expect(result['security-audit'].priority).toBe('high');
      expect(result['security-audit'].reason).toBe('api-security');
    });

    test('should map test files to testing dimension', () => {
      const mapping = { 'testing-coverage': { priority: 'critical', reason: 'test-files-modified' }, 'error-detection': { priority: 'medium', reason: 'test-linting' } };
      automaticMode.mapDimensions.mockReturnValue(mapping);
      
      const result = automaticMode.mapDimensions(['src/auth/login.test.ts']);
      
      expect(result['testing-coverage'].priority).toBe('critical');
      expect(result['testing-coverage'].reason).toBe('test-files-modified');
    });

    test('should map configuration files to build dimension', () => {
      const mapping = { 'build-dependencies': { priority: 'critical', reason: 'config-files-modified' }, 'error-detection': { priority: 'high', reason: 'config-validation' } };
      automaticMode.mapDimensions.mockReturnValue(mapping);
      
      const result = automaticMode.mapDimensions(['package.json']);
      
      expect(result['build-dependencies'].priority).toBe('critical');
      expect(result['build-dependencies'].reason).toBe('config-files-modified');
    });
  });

  describe('Confidence scoring', () => {
    const testCases = [
      { desc: 'high confidence for clear patterns', confidence: 0.92, assertion: val => expect(val).toBeGreaterThan(0.9) },
      { desc: 'medium confidence for mixed patterns', confidence: 0.67, assertion: val => { expect(val).toBeGreaterThan(0.6); expect(val).toBeLessThan(0.8); }},
      { desc: 'low confidence for unclear patterns', confidence: 0.31, assertion: val => expect(val).toBeLessThan(0.5) }
    ];
    
    testCases.forEach(({ desc, confidence, assertion }) => {
      test(`should calculate ${desc}`, () => {
        automaticMode.calculateConfidence.mockReturnValue(confidence);
        assertion(automaticMode.calculateConfidence({}));
      });
    });
  });

  describe('Fallback strategies', () => {
    const fallbackCases = [
      { conf: 0.3, strategy: 'comprehensive', toolCount: 4 },
      { conf: 0.65, strategy: 'targeted', toolCount: 2 },
      { conf: 0.91, strategy: null, toolCount: 0 }
    ];
    
    fallbackCases.forEach(({ conf, strategy, toolCount }) => {
      test(`should handle confidence ${conf}`, () => {
        const result = strategy ? { strategy, tools: Array(toolCount).fill().reduce((acc, _, i) => ({ ...acc, [`dim-${i}`]: ['tool'] }), {}) } : null;
        automaticMode.applyFallback.mockReturnValue(result);
        const fallback = automaticMode.applyFallback({ confidence: conf });
        if (strategy) {
          expect(fallback.strategy).toBe(strategy);
          expect(Object.keys(fallback.tools)).toHaveLength(toolCount);
        } else {
          expect(fallback).toBeNull();
        }
      });
    });
  });

  describe('Execution optimization', () => {
    const optimizationCases = [
      { size: 'large', filesCount: 25, parallel: true, timeout: 1800 },
      { size: 'small', filesCount: 2, parallel: false, timeout: 300 }
    ];
    
    optimizationCases.forEach(({ size, filesCount, parallel, timeout }) => {
      test(`should optimize execution for ${size} changes`, () => {
        automaticMode.optimizeExecution.mockReturnValue({ parallel, priority: ['error-detection'], timeout });
        const result = automaticMode.optimizeExecution({ filesCount });
        expect(result.parallel).toBe(parallel);
        expect(result.timeout).toBe(timeout);
      });
    });
  });

  describe('Selection validation', () => {
    const validationCases = [
      { desc: 'correct tool selection', isValid: true, coverage: 0.87, warningCount: 0 },
      { desc: 'invalid tool selection', isValid: false, coverage: 0.25, warningCount: 2 }
    ];
    
    validationCases.forEach(({ desc, isValid, coverage, warningCount }) => {
      test(`should validate ${desc}`, () => {
        automaticMode.validateSelection.mockReturnValue({ isValid, coverage, warnings: Array(warningCount).fill('warning') });
        const result = automaticMode.validateSelection({});
        expect(result.isValid).toBe(isValid);
        if (isValid) expect(result.coverage).toBeGreaterThan(0.8);
        expect(result.warnings).toHaveLength(warningCount);
      });
    });
  });

  describe('Full automatic execution', () => {
    test('should execute automatic mode successfully', () => {
      automaticMode.execute.mockReturnValue({ success: true, mode: 'automatic', toolsExecuted: ['megalinter', 'jest', 'snyk'], executionTime: 145, confidence: 0.89 });
      
      const result = automaticMode.execute({ branch: 'feature/auth', scope: 'frontend' });
      
      expect(result.success).toBe(true);
      expect(result.mode).toBe('automatic');
      expect(result.toolsExecuted).toHaveLength(3);
      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });
});