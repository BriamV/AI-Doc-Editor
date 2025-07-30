const Orchestrator = require('../../core/Orchestrator.cjs');

jest.mock('../../core/feedback/ContextDetector.cjs');
jest.mock('../../core/PlanSelector.cjs');
jest.mock('../../core/execution/WrapperCoordinator.cjs');

describe('Orchestrator Integration (RNF-004)', () => {
  let orchestrator, mockLogger, mockContextDetector, mockPlanSelector, mockWrapperCoordinator;

  beforeEach(() => {
    mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
    
    mockContextDetector = { detectContext: jest.fn() };
    mockPlanSelector = { selectPlan: jest.fn(), validatePlan: jest.fn() };
    mockWrapperCoordinator = { executeWrappers: jest.fn() };
    
    require('../../core/feedback/ContextDetector.cjs').mockImplementation(() => mockContextDetector);
    require('../../core/PlanSelector.cjs').mockImplementation(() => mockPlanSelector);
    require('../../core/execution/WrapperCoordinator.cjs').mockImplementation(() => mockWrapperCoordinator);
    
    orchestrator = new Orchestrator(mockLogger);
    jest.clearAllMocks();
  });

  describe('Complete orchestration flow', () => {
    const orchestrationCases = [
      { scenario: 'automatic', options: { mode: 'automatic' }, context: { branch: 'feature/test', files: 15 }, plan: { tools: ['megalinter', 'jest'] }, results: { summary: { total: 2, passed: 2, failed: 0 } }, expectedSuccess: true },
      { scenario: 'dod', options: { mode: 'dod' }, context: { branch: 'main', files: 50 }, plan: { tools: ['megalinter', 'jest', 'snyk', 'tsc'] }, results: { summary: { total: 4, passed: 3, failed: 1 } }, expectedSuccess: false },
      { scenario: 'fast', options: { mode: 'fast' }, context: { branch: 'feature/quick', files: 5, staged: true }, plan: { tools: ['megalinter'] }, results: { summary: { total: 1, passed: 1, failed: 0 } }, expectedSuccess: true }
    ];

    orchestrationCases.forEach(({ scenario, options, context, plan, results, expectedSuccess }) => {
      test(`should execute ${scenario} flow`, async () => {
        mockContextDetector.detectContext.mockResolvedValue(context);
        mockPlanSelector.selectPlan.mockResolvedValue(plan);
        mockPlanSelector.validatePlan.mockResolvedValue(true);
        mockWrapperCoordinator.executeWrappers.mockResolvedValue(results);
        
        const result = await orchestrator.run(options);
        
        expect(result.success).toBe(expectedSuccess);
        expect(result.summary).toEqual(results.summary);
      });
    });
  });

  describe('State management', () => {
    test('should manage state during orchestration', () => {
      const state = orchestrator.getState();
      expect(state).toHaveProperty('status');
      expect(state).toHaveProperty('progress');
      expect(typeof state.progress).toBe('number');
    });
  });

  describe('Error handling', () => {
    test('should handle context detection errors', async () => {
      mockContextDetector.detectContext.mockRejectedValue(new Error('Context detection failed'));
      const result = await orchestrator.run({ mode: 'automatic' });
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Context detection failed/);
    });

    test('should handle execution errors', async () => {
      mockContextDetector.detectContext.mockResolvedValue({ branch: 'test' });
      mockPlanSelector.selectPlan.mockResolvedValue({ tools: ['megalinter'] });
      mockPlanSelector.validatePlan.mockResolvedValue(true);
      mockWrapperCoordinator.executeWrappers.mockRejectedValue(new Error('Execution failed'));
      
      const result = await orchestrator.run({ mode: 'automatic' });
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Execution failed/);
    });
  });

  describe('Result transformation', () => {
    test('should transform execution results correctly', async () => {
      const executionResults = { summary: { total: 2, passed: 1, failed: 1 }, details: [{ tool: 'megalinter', success: true }] };
      
      mockContextDetector.detectContext.mockResolvedValue({ branch: 'main' });
      mockPlanSelector.selectPlan.mockResolvedValue({ tools: ['megalinter', 'jest'] });
      mockPlanSelector.validatePlan.mockResolvedValue(true);
      mockWrapperCoordinator.executeWrappers.mockResolvedValue(executionResults);
      
      const result = await orchestrator.run({ mode: 'automatic' });
      
      expect(result.success).toBe(false);
      expect(result.summary.total).toBe(2);
      expect(result.details).toHaveLength(1);
      expect(result.metadata).toHaveProperty('context');
    });
  });

  describe('Performance and dependency integration', () => {
    test('should handle timeouts and validate dependencies', async () => {
      const longRunningExecution = new Promise((resolve) => {
        setTimeout(() => resolve({ summary: { total: 1, passed: 1 } }), 60000);
      });
      
      mockContextDetector.detectContext.mockResolvedValue({ branch: 'test' });
      mockPlanSelector.selectPlan.mockResolvedValue({ tools: ['megalinter'] });
      mockPlanSelector.validatePlan.mockResolvedValue(true);
      mockWrapperCoordinator.executeWrappers.mockReturnValue(longRunningExecution);
      
      const startTime = Date.now();
      const result = await orchestrator.run({ mode: 'automatic', timeout: 1000 });
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(5000);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/timeout|aborted/i);
    });

    test('should track progress and validate integration', async () => {
      let progressUpdates = [];
      const progressCallback = (progress) => progressUpdates.push(progress);
      
      mockContextDetector.detectContext.mockImplementation(async () => { progressCallback(20); return { branch: 'test' }; });
      mockPlanSelector.selectPlan.mockImplementation(async () => { progressCallback(40); return { tools: ['megalinter'] }; });
      mockWrapperCoordinator.executeWrappers.mockImplementation(async () => { progressCallback(80); return { summary: { total: 1, passed: 1 } }; });
      
      const result = await orchestrator.run({ mode: 'automatic', onProgress: progressCallback });
      
      expect(progressUpdates).toEqual([20, 40, 80]);
      expect(result.success).toBe(true);
      expect(mockContextDetector.detectContext).toHaveBeenCalled();
      expect(mockWrapperCoordinator.executeWrappers).toHaveBeenCalled();
    });
  });
});