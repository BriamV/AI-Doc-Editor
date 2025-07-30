const { PlanSelector } = require('../../core/PlanSelector.cjs');
const { ExecutionController } = require('../../core/execution/ExecutionController.cjs');

jest.mock('../../core/modes/FastMode.cjs');
jest.mock('../../core/modes/AutomaticMode.cjs');
jest.mock('../../core/modes/DodMode.cjs');
jest.mock('../../core/execution/WrapperManager.cjs');

describe('Plan Execution Integration (RNF-004)', () => {
  let planSelector, executionController, mockLogger, mockWrapperManager;

  beforeEach(() => {
    mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
    mockWrapperManager = {
      initializeWrappers: jest.fn(),
      getWrapper: jest.fn(),
      clearCache: jest.fn()
    };

    planSelector = new PlanSelector(mockLogger);
    executionController = new ExecutionController(mockLogger, mockWrapperManager);
    jest.clearAllMocks();
  });

  describe('Plan generation & execution', () => {
    const testCases = [
      { mode: 'fast', tools: ['megalinter'], strategy: 'sequential' },
      { mode: 'automatic', tools: ['megalinter', 'jest'], strategy: 'parallel' },
      { mode: 'dod', tools: ['megalinter', 'jest', 'snyk'], strategy: 'parallel' }
    ];

    testCases.forEach(({ mode, tools, strategy }) => {
      test(`${mode} mode plan & execution`, async () => {
        const MockMode = require(`../../core/modes/${mode.charAt(0).toUpperCase() + mode.slice(1)}Mode.cjs`);
        MockMode.mockImplementation(() => ({
          generatePlan: jest.fn().mockResolvedValue({ tools, mode, strategy }),
          validatePlan: jest.fn().mockReturnValue(true)
        }));

        tools.forEach(tool => {
          mockWrapperManager.getWrapper.mockReturnValueOnce({
            execute: jest.fn().mockResolvedValue({ success: true, tool })
          });
        });

        const plan = await planSelector.selectPlan({ branch: 'test' }, { mode });
        const results = await executionController.executePlan(plan);
        
        expect(plan.tools).toEqual(tools);
        expect(results.length).toBe(tools.length);
      });
    });
  });

  describe('Critical failure & timeout handling', () => {
    test('detects critical failures', async () => {
      ['tsc', 'megalinter'].forEach((tool, index) => {
        mockWrapperManager.getWrapper.mockReturnValueOnce({
          execute: jest.fn().mockResolvedValue({ 
            success: index !== 0, tool, critical: index === 0 
          })
        });
      });

      const results = await executionController.executePlan({ tools: ['tsc', 'megalinter'] });
      const critical = results.filter(r => !r.success && r.critical);
      expect(critical).toHaveLength(1);
    });

    test('handles timeouts correctly', async () => {
      mockWrapperManager.getWrapper.mockReturnValue({
        execute: jest.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({ success: true }), 30000))
        )
      });

      const startTime = Date.now();
      const results = await executionController.executePlan({ 
        tools: ['megalinter'], timeout: 1000 
      });
      
      expect(Date.now() - startTime).toBeLessThan(5000);
      expect(results[0].success).toBe(false);
    });
  });

  describe('Plan validation & optimization', () => {
    test('validates plans', async () => {
      expect(planSelector.validatePlan({ tools: [], strategy: 'invalid' })).toBe(false);
      expect(planSelector.validatePlan({ tools: ['megalinter'], strategy: 'parallel' })).toBe(true);
    });

    test('optimizes execution order', async () => {
      const FastMode = require('../../core/modes/FastMode.cjs');
      FastMode.mockImplementation(() => ({
        generatePlan: jest.fn().mockResolvedValue({
          tools: ['tsc', 'megalinter'], optimized: true
        }),
        validatePlan: jest.fn().mockReturnValue(true)
      }));

      const plan = await planSelector.selectPlan({ hasTypeScript: true }, { optimize: true });
      expect(plan.tools[0]).toBe('tsc');
      expect(plan.optimized).toBe(true);
    });

    test('handles dependency-aware execution', async () => {
      ['tsc', 'megalinter'].forEach((tool, index) => {
        mockWrapperManager.getWrapper.mockReturnValueOnce({
          execute: jest.fn().mockResolvedValue({ 
            success: true, tool, dependencies: index === 0 ? [] : ['tsc']
          })
        });
      });

      const results = await executionController.executePlan({ 
        tools: ['tsc', 'megalinter'], strategy: 'dependency-aware' 
      });

      expect(results[0].tool).toBe('tsc');
      expect(results[1].tool).toBe('megalinter');
    });
  });

  describe('Error scenarios', () => {
    test('handles plan generation failures', async () => {
      const FastMode = require('../../core/modes/FastMode.cjs');
      FastMode.mockImplementation(() => ({
        generatePlan: jest.fn().mockRejectedValue(new Error('Plan failed'))
      }));

      await expect(planSelector.selectPlan({ branch: 'test' }, { mode: 'fast' }))
        .rejects.toThrow('Plan failed');
    });

    test('handles execution failures', async () => {
      mockWrapperManager.getWrapper.mockReturnValue({
        execute: jest.fn().mockRejectedValue(new Error('Execution failed'))
      });

      const results = await executionController.executePlan({ tools: ['megalinter'] });
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('Execution failed');
    });

    test('handles initialization failures', async () => {
      mockWrapperManager.initializeWrappers.mockRejectedValue(new Error('Init failed'));
      
      await expect(executionController.executePlan({ tools: ['megalinter'] }))
        .rejects.toThrow('Init failed');
    });
  });

});