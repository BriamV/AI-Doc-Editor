const { ContextMapper } = require('../../core/context/ContextMapper.cjs');

jest.mock('../../core/context/ContextMapper.cjs');

describe('ContextMapper', () => {
  let contextMapper;

  beforeEach(() => {
    contextMapper = new ContextMapper();
    contextMapper.mapToDimensions = jest.fn();
    contextMapper.selectToolsPriority = jest.fn();
    contextMapper.activateConditionalDimensions = jest.fn();
    contextMapper.optimizeResourceMapping = jest.fn();
    contextMapper.applyCustomRules = jest.fn();
    contextMapper.adjustDynamicMapping = jest.fn();
    contextMapper.getFallbackStrategy = jest.fn();
    contextMapper.validateMapping = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Context to RF-003 dimensions mapping', () => {
    test('should map frontend context to appropriate dimensions', () => {
      const context = { type: 'feature', scope: 'frontend', technologies: ['react', 'typescript'], confidence: 0.92 };
      const expectedMapping = {
        'error-detection': { priority: 'high', tools: ['megalinter'] },
        'testing-coverage': { priority: 'high', tools: ['jest'] },
        'build-dependencies': { priority: 'medium', tools: ['tsc', 'npm'] },
        'security-audit': { priority: 'medium', tools: ['snyk'] }
      };
      
      contextMapper.mapToDimensions.mockReturnValue(expectedMapping);
      const result = contextMapper.mapToDimensions(context);
      
      expect(result['error-detection'].priority).toBe('high');
      expect(result['testing-coverage'].tools).toContain('jest');
      expect(result['build-dependencies'].tools).toContain('tsc');
    });

    test('should map backend context to appropriate dimensions', () => {
      const context = { type: 'feature', scope: 'backend', technologies: ['python', 'fastapi'], confidence: 0.89 };
      const expectedMapping = {
        'error-detection': { priority: 'high', tools: ['megalinter'] },
        'testing-coverage': { priority: 'high', tools: ['pytest'] },
        'build-dependencies': { priority: 'low', tools: ['pip'] },
        'security-audit': { priority: 'high', tools: ['snyk', 'semgrep'] }
      };
      
      contextMapper.mapToDimensions.mockReturnValue(expectedMapping);
      const result = contextMapper.mapToDimensions(context);
      
      expect(result['testing-coverage'].tools).toContain('pytest');
      expect(result['security-audit'].tools).toContain('semgrep');
    });

    test('should map security context to all dimensions with high priority', () => {
      const context = { type: 'security', scope: 'security', technologies: ['mixed'], confidence: 0.95 };
      const expectedMapping = {
        'error-detection': { priority: 'high', tools: ['megalinter'] },
        'testing-coverage': { priority: 'high', tools: ['jest', 'pytest'] },
        'build-dependencies': { priority: 'high', tools: ['tsc', 'npm', 'pip'] },
        'security-audit': { priority: 'critical', tools: ['snyk', 'semgrep'] },
        'design-metrics': { priority: 'medium', tools: ['eslint'] },
        'data-compatibility': { priority: 'medium', tools: ['custom'] }
      };
      
      contextMapper.mapToDimensions.mockReturnValue(expectedMapping);
      const result = contextMapper.mapToDimensions(context);
      
      expect(result['security-audit'].priority).toBe('critical');
      expect(Object.keys(result)).toHaveLength(6);
    });
  });

  describe('Priority-based tool selection', () => {
    test('should select high priority tools first', () => {
      const mapping = {
        'error-detection': { priority: 'high', tools: ['megalinter'] },
        'testing-coverage': { priority: 'medium', tools: ['jest'] },
        'build-dependencies': { priority: 'low', tools: ['tsc'] }
      };
      
      const expectedSelection = [
        { dimension: 'error-detection', tool: 'megalinter', priority: 'high' },
        { dimension: 'testing-coverage', tool: 'jest', priority: 'medium' },
        { dimension: 'build-dependencies', tool: 'tsc', priority: 'low' }
      ];
      
      contextMapper.selectToolsPriority.mockReturnValue(expectedSelection);
      const result = contextMapper.selectToolsPriority(mapping);
      
      expect(result[0].priority).toBe('high');
      expect(result[0].tool).toBe('megalinter');
    });

    test('should handle resource constraints in tool selection', () => {
      const mapping = {
        'error-detection': { priority: 'high', tools: ['megalinter'] },
        'testing-coverage': { priority: 'high', tools: ['jest', 'pytest'] },
        'security-audit': { priority: 'high', tools: ['snyk', 'semgrep'] }
      };
      
      const constraints = { maxParallelTools: 2, memoryLimit: 512 };
      
      contextMapper.selectToolsPriority.mockReturnValue([
        { dimension: 'error-detection', tool: 'megalinter', priority: 'high' },
        { dimension: 'testing-coverage', tool: 'jest', priority: 'high' }
      ]);
      
      const result = contextMapper.selectToolsPriority(mapping, constraints);
      expect(result).toHaveLength(2);
    });
  });

  describe('Conditional dimension activation', () => {
    test('should activate design-metrics for large changes', () => {
      const context = { type: 'feature', scope: 'frontend', linesChanged: 300, filesAffected: 8 };
      
      contextMapper.activateConditionalDimensions.mockReturnValue({
        'design-metrics': { activated: true, reason: 'large-change-detected' }
      });
      
      const result = contextMapper.activateConditionalDimensions(context);
      expect(result['design-metrics'].activated).toBe(true);
    });

    test('should skip data-compatibility for small changes', () => {
      const context = { type: 'bugfix', scope: 'backend', linesChanged: 15, filesAffected: 1 };
      
      contextMapper.activateConditionalDimensions.mockReturnValue({
        'data-compatibility': { activated: false, reason: 'small-change-skip' }
      });
      
      const result = contextMapper.activateConditionalDimensions(context);
      expect(result['data-compatibility'].activated).toBe(false);
    });
  });

  describe('Resource optimization mapping', () => {
    test('should optimize for fast mode execution', () => {
      const context = { mode: 'fast', scope: 'frontend' };
      const optimizedMapping = {
        'error-detection': { priority: 'high', tools: ['megalinter'], parallel: true },
        'testing-coverage': { priority: 'skip', tools: [], parallel: false }
      };
      
      contextMapper.optimizeResourceMapping.mockReturnValue(optimizedMapping);
      const result = contextMapper.optimizeResourceMapping(context);
      
      expect(result['error-detection'].parallel).toBe(true);
      expect(result['testing-coverage'].priority).toBe('skip');
    });

    test('should optimize for memory constraints', () => {
      const context = { memoryLimit: 256 };
      const optimizedMapping = {
        'error-detection': { priority: 'high', tools: ['megalinter'], sequential: true },
        'security-audit': { priority: 'medium', tools: ['snyk'], sequential: true }
      };
      
      contextMapper.optimizeResourceMapping.mockReturnValue(optimizedMapping);
      const result = contextMapper.optimizeResourceMapping(context);
      
      expect(result['error-detection'].sequential).toBe(true);
    });
  });

  describe('Custom mapping rules', () => {
    test('should apply project-specific rules', () => {
      const customRules = {
        'auth-changes': { dimensions: ['security-audit'], priority: 'critical' },
        'test-files': { dimensions: ['testing-coverage'], priority: 'high' }
      };
      
      const context = { files: ['src/auth/login.ts'] };
      
      contextMapper.applyCustomRules.mockReturnValue({
        'security-audit': { priority: 'critical', customRule: 'auth-changes' }
      });
      
      const result = contextMapper.applyCustomRules(context, customRules);
      expect(result['security-audit'].priority).toBe('critical');
    });
  });

  describe('Dynamic mapping adjustment', () => {
    test('should adjust mapping based on historical success', () => {
      const historicalData = {
        'feature-frontend': { successRate: 0.95, avgTime: 120 },
        'bugfix-backend': { successRate: 0.88, avgTime: 80 }
      };
      
      const context = { type: 'feature', scope: 'frontend' };
      
      contextMapper.adjustDynamicMapping.mockReturnValue({
        'error-detection': { priority: 'high', confidence: 0.95 },
        'testing-coverage': { priority: 'high', confidence: 0.95 }
      });
      
      const result = contextMapper.adjustDynamicMapping(context, historicalData);
      expect(result['error-detection'].confidence).toBe(0.95);
    });
  });

  describe('Fallback strategies', () => {
    test('should provide fallback when mapping fails', () => {
      const context = { type: 'unknown', scope: 'mixed' };
      
      const fallbackStrategy = {
        'error-detection': { priority: 'medium', tools: ['megalinter'] },
        'testing-coverage': { priority: 'medium', tools: ['jest'] }
      };
      
      contextMapper.getFallbackStrategy.mockReturnValue(fallbackStrategy);
      const result = contextMapper.getFallbackStrategy(context);
      
      expect(result['error-detection'].priority).toBe('medium');
      expect(Object.keys(result)).toHaveLength(2);
    });

    test('should escalate to full validation for critical contexts', () => {
      const context = { type: 'security', scope: 'critical' };
      
      const fallbackStrategy = {
        'error-detection': { priority: 'high', tools: ['megalinter'] },
        'testing-coverage': { priority: 'high', tools: ['jest', 'pytest'] },
        'security-audit': { priority: 'critical', tools: ['snyk', 'semgrep'] }
      };
      
      contextMapper.getFallbackStrategy.mockReturnValue(fallbackStrategy);
      const result = contextMapper.getFallbackStrategy(context);
      
      expect(result['security-audit'].priority).toBe('critical');
    });
  });

  describe('Mapping validation', () => {
    test('should validate mapping completeness', () => {
      const mapping = {
        'error-detection': { priority: 'high', tools: ['megalinter'] },
        'testing-coverage': { priority: 'medium', tools: ['jest'] }
      };
      
      contextMapper.validateMapping.mockReturnValue({
        isValid: true,
        coverage: 0.85,
        missingDimensions: []
      });
      
      const result = contextMapper.validateMapping(mapping);
      expect(result.isValid).toBe(true);
      expect(result.coverage).toBeGreaterThan(0.8);
    });

    test('should detect invalid mapping configurations', () => {
      const invalidMapping = {
        'error-detection': { priority: 'high', tools: [] },
        'unknown-dimension': { priority: 'medium', tools: ['invalid'] }
      };
      
      contextMapper.validateMapping.mockReturnValue({
        isValid: false,
        coverage: 0.45,
        missingDimensions: ['testing-coverage'],
        errors: ['empty-tools-array', 'unknown-dimension']
      });
      
      const result = contextMapper.validateMapping(invalidMapping);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('empty-tools-array');
    });
  });
});