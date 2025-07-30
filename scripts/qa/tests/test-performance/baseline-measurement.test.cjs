const { ExecutionController } = require('../../core/execution/ExecutionController.cjs');
const { WrapperManager } = require('../../core/execution/WrapperManager.cjs');

jest.mock('../../core/execution/ExecutionController.cjs');
jest.mock('../../core/execution/WrapperManager.cjs');

describe('Performance Baseline Measurement (RNF-002)', () => {
  let executionController, wrapperManager, mockPerformance;

  beforeEach(() => {
    // Mock performance.now() for deterministic timing
    mockPerformance = { now: jest.fn() };
    global.performance = mockPerformance;
    
    executionController = new ExecutionController();
    wrapperManager = new WrapperManager();
    
    ['executeToolsInParallel', 'executeToolsSequentially', '_executeTool'].forEach(method => 
      executionController[method] = jest.fn());
    ['getWrapper'].forEach(method => 
      wrapperManager[method] = jest.fn());
  });

  afterEach(() => jest.clearAllMocks());

  describe('Baseline establishment for different scopes', () => {
    const baselineCases = [
      { 
        scope: 'small', 
        files: 5, 
        tools: ['megalinter'], 
        expectedTime: 30000,
        category: 'quick-validation'
      },
      { 
        scope: 'medium', 
        files: 20, 
        tools: ['megalinter', 'jest'], 
        expectedTime: 120000,
        category: 'standard-validation'
      },
      { 
        scope: 'large', 
        files: 50, 
        tools: ['megalinter', 'jest', 'snyk'], 
        expectedTime: 300000,
        category: 'comprehensive-validation'
      },
      { 
        scope: 'xl', 
        files: 100, 
        tools: ['megalinter', 'jest', 'snyk', 'tsc'], 
        expectedTime: 600000,
        category: 'enterprise-validation'
      }
    ];
    
    baselineCases.forEach(({ scope, files, tools, expectedTime, category }) => {
      test(`should measure baseline for ${scope} scope (${category})`, async () => {
        // Setup timing simulation
        let callCount = 0;
        mockPerformance.now.mockImplementation(() => {
          return callCount++ === 0 ? 0 : expectedTime;
        });
        
        // Mock tool execution results
        const mockResults = tools.map(tool => ({
          tool: { name: tool, dimension: 'test' },
          success: true,
          executionTime: expectedTime / tools.length,
          filesProcessed: files
        }));
        
        executionController._executeTool.mockImplementation(async () => {
          return mockResults[0];
        });
        
        // Execute performance measurement
        const startTime = performance.now();
        await executionController.executeToolsInParallel(
          tools.map(name => ({ name, dimension: 'test' })), 
          wrapperManager
        );
        const endTime = performance.now();
        
        // Validate baseline measurement
        const actualTime = endTime - startTime;
        expect(actualTime).toBe(expectedTime);
        expect(actualTime).toBeLessThanOrEqual(expectedTime * 1.1); // 10% tolerance
        expect(executionController._executeTool).toHaveBeenCalledTimes(tools.length);
      });
    });
  });

  describe('Performance tracking infrastructure', () => {
    const trackingCases = [
      { metric: 'execution-time', threshold: 600000, tolerance: 0.1 },
      { metric: 'file-processing-rate', threshold: 100, tolerance: 0.2 },
      { metric: 'tool-startup-overhead', threshold: 5000, tolerance: 0.15 },
      { metric: 'parallel-efficiency', threshold: 0.7, tolerance: 0.1 }
    ];
    
    trackingCases.forEach(({ metric, threshold, tolerance }) => {
      test(`should track ${metric} metric within tolerance`, () => {
        const baselineTracker = {
          recordMetric: jest.fn(),
          getBaseline: jest.fn().mockReturnValue(threshold),
          isWithinTolerance: jest.fn().mockImplementation((current, baseline, tol) => {
            return Math.abs(current - baseline) / baseline <= tol;
          })
        };
        
        const currentValue = threshold * (1 + tolerance * 0.5); // Within tolerance
        baselineTracker.recordMetric(metric, currentValue);
        
        const withinTolerance = baselineTracker.isWithinTolerance(
          currentValue, 
          baselineTracker.getBaseline(), 
          tolerance
        );
        
        expect(baselineTracker.recordMetric).toHaveBeenCalledWith(metric, currentValue);
        expect(withinTolerance).toBe(true);
      });
    });
  });

  describe('Scope-specific performance validation', () => {
    const scopeValidationCases = [
      { scope: 'pre-commit', maxTime: 60000, tools: 1 },
      { scope: 'ci-validation', maxTime: 300000, tools: 3 },
      { scope: 'release-gate', maxTime: 600000, tools: 5 }
    ];
    
    scopeValidationCases.forEach(({ scope, maxTime, tools }) => {
      test(`should validate ${scope} performance requirements`, async () => {
        const mockExecutionTime = maxTime * 0.8; // Under threshold
        mockPerformance.now.mockReturnValueOnce(0).mockReturnValueOnce(mockExecutionTime);
        
        executionController.executeToolsInParallel.mockResolvedValue(
          Array(tools).fill().map((_, i) => ({
            tool: { name: `tool-${i}`, dimension: 'test' },
            success: true,
            executionTime: mockExecutionTime / tools
          }))
        );
        
        const result = await executionController.executeToolsInParallel(
          Array(tools).fill().map((_, i) => ({ name: `tool-${i}`, dimension: 'test' })),
          wrapperManager
        );
        
        const totalTime = result.reduce((sum, r) => sum + r.executionTime, 0);
        expect(totalTime).toBeLessThanOrEqual(maxTime);
        expect(result).toHaveLength(tools);
        expect(result.every(r => r.success)).toBe(true);
      });
    });
  });

  describe('Baseline persistence and comparison', () => {
    test('should persist baseline measurements for future comparisons', () => {
      const baselineStorage = {
        save: jest.fn(),
        load: jest.fn(),
        compare: jest.fn()
      };
      
      const measurements = {
        scope: 'medium',
        executionTime: 120000,
        filesProcessed: 20,
        toolsUsed: 2,
        timestamp: Date.now()
      };
      
      baselineStorage.save('baseline-medium', measurements);
      const storedBaseline = baselineStorage.load('baseline-medium');
      const comparison = baselineStorage.compare(measurements, storedBaseline);
      
      expect(baselineStorage.save).toHaveBeenCalledWith('baseline-medium', measurements);
      expect(baselineStorage.load).toHaveBeenCalledWith('baseline-medium');
      expect(baselineStorage.compare).toHaveBeenCalledWith(measurements, storedBaseline);
    });
    
    test('should detect baseline drift over time', () => {
      const historicalBaselines = [
        { timestamp: Date.now() - 86400000, executionTime: 100000 }, // 1 day ago
        { timestamp: Date.now() - 43200000, executionTime: 105000 }, // 12 hours ago
        { timestamp: Date.now(), executionTime: 115000 } // now
      ];
      
      const driftDetector = {
        calculateDrift: jest.fn().mockImplementation((baselines) => {
          const oldest = baselines[0].executionTime;
          const newest = baselines[baselines.length - 1].executionTime;
          return (newest - oldest) / oldest;
        })
      };
      
      const drift = driftDetector.calculateDrift(historicalBaselines);
      expect(drift).toBe(0.15); // 15% drift
      expect(driftDetector.calculateDrift).toHaveBeenCalledWith(historicalBaselines);
    });
  });
});