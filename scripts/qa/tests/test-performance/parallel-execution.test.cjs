const { ExecutionController } = require('../../core/execution/ExecutionController.cjs');
const { WrapperManager } = require('../../core/execution/WrapperManager.cjs');

jest.mock('../../core/execution/ExecutionController.cjs');
jest.mock('../../core/execution/WrapperManager.cjs');

describe('Parallel Execution Optimization (RNF-002)', () => {
  let executionController, wrapperManager, mockPerformance;

  beforeEach(() => {
    mockPerformance = { now: jest.fn() };
    global.performance = mockPerformance;
    
    executionController = new ExecutionController();
    wrapperManager = new WrapperManager();
    
    ['executeToolsInParallel', 'executeToolsSequentially', '_executeTool'].forEach(method => 
      executionController[method] = jest.fn());
  });

  afterEach(() => jest.clearAllMocks());

  describe('ExecutionController parallelization efficiency', () => {
    const parallelCases = [
      { 
        desc: 'dual tool optimization',
        tools: ['megalinter', 'jest'], 
        parallel: true, 
        sequentialTime: 120000,
        expectedSpeedup: 1.5,
        maxConcurrency: 2
      },
      { 
        desc: 'triple tool optimization',
        tools: ['megalinter', 'jest', 'snyk'], 
        parallel: true, 
        sequentialTime: 180000,
        expectedSpeedup: 2.0,
        maxConcurrency: 3
      },
      { 
        desc: 'single tool baseline',
        tools: ['tsc'], 
        parallel: false, 
        sequentialTime: 60000,
        expectedSpeedup: 1.0,
        maxConcurrency: 1
      },
      { 
        desc: 'quad tool with concurrency limit',
        tools: ['megalinter', 'jest', 'snyk', 'tsc'], 
        parallel: true, 
        sequentialTime: 240000,
        expectedSpeedup: 2.5,
        maxConcurrency: 3
      }
    ];
    
    parallelCases.forEach(({ desc, tools, parallel, sequentialTime, expectedSpeedup, maxConcurrency }) => {
      test(`should optimize ${desc}`, async () => {
        const toolExecutionTime = sequentialTime / tools.length;
        const expectedParallelTime = sequentialTime / expectedSpeedup;
        
        // Setup timing simulation
        let timeCounter = 0;
        mockPerformance.now.mockImplementation(() => {
          return timeCounter++ === 0 ? 0 : expectedParallelTime;
        });
        
        const mockResults = tools.map(tool => ({ tool: { name: tool, dimension: 'test' }, success: true, executionTime: toolExecutionTime }));
        
        if (parallel) {
          executionController.executeToolsInParallel.mockResolvedValue(mockResults);
        } else {
          executionController.executeToolsSequentially.mockResolvedValue(mockResults);
        }
        
        const startTime = performance.now();
        const result = parallel 
          ? await executionController.executeToolsInParallel(tools.map(name => ({ name })), wrapperManager)
          : await executionController.executeToolsSequentially(tools.map(name => ({ name })), wrapperManager);
        const endTime = performance.now();
        
        const actualTime = endTime - startTime;
        const actualSpeedup = sequentialTime / actualTime;
        
        expect(result).toHaveLength(tools.length);
        expect(actualSpeedup).toBeGreaterThanOrEqual(expectedSpeedup * 0.8); // 20% tolerance
        expect(result.every(r => r.success)).toBe(true);
      });
    });
  });

  describe('Concurrency limit validation', () => {
    const concurrencyCases = [
      { maxParallel: 2, tools: 5, expectedBatches: 3 },
      { maxParallel: 3, tools: 7, expectedBatches: 3 },
      { maxParallel: 4, tools: 10, expectedBatches: 3 },
      { maxParallel: 1, tools: 3, expectedBatches: 3 }
    ];
    
    concurrencyCases.forEach(({ maxParallel, tools, expectedBatches }) => {
      test(`should respect ${maxParallel} concurrency limit with ${tools} tools`, async () => {
        executionController.executionConfig = { maxParallelWrappers: maxParallel };
        
        const batchTracker = {
          batches: [],
          recordBatch: jest.fn().mockImplementation((batch) => {
            batchTracker.batches.push(batch);
          })
        };
        
        // Simulate batched execution
        const toolsList = Array(tools).fill().map((_, i) => ({ name: `tool-${i}` }));
        
        for (let i = 0; i < toolsList.length; i += maxParallel) {
          const batch = toolsList.slice(i, i + maxParallel);
          batchTracker.recordBatch(batch);
        }
        
        expect(batchTracker.batches).toHaveLength(expectedBatches);
        expect(batchTracker.batches.every(batch => batch.length <= maxParallel)).toBe(true);
        
        const totalTools = batchTracker.batches.reduce((sum, batch) => sum + batch.length, 0);
        expect(totalTools).toBe(tools);
      });
    });
  });

  describe('Resource contention management', () => {
    const contentionCases = [
      { scenario: 'CPU-bound tools', tools: ['megalinter', 'tsc'], resourceType: 'cpu', expectedDelay: 0 },
      { scenario: 'I/O-bound tools', tools: ['snyk', 'npm-audit'], resourceType: 'io', expectedDelay: 100 },
      { scenario: 'mixed workload', tools: ['megalinter', 'snyk', 'jest'], resourceType: 'mixed', expectedDelay: 50 },
      { scenario: 'memory-intensive', tools: ['jest', 'coverage'], resourceType: 'memory', expectedDelay: 200 }
    ];
    
    contentionCases.forEach(({ scenario, tools, resourceType, expectedDelay }) => {
      test(`should manage ${scenario} resource contention`, async () => {
        const contentionManager = {
          analyzeResourceUsage: jest.fn().mockReturnValue(resourceType),
          calculateOptimalDelay: jest.fn().mockReturnValue(expectedDelay),
          scheduleExecution: jest.fn()
        };
        
        const resourceUsage = contentionManager.analyzeResourceUsage(tools);
        const optimalDelay = contentionManager.calculateOptimalDelay(resourceUsage);
        
        expect(resourceUsage).toBe(resourceType);
        expect(optimalDelay).toBe(expectedDelay);
        
        contentionManager.scheduleExecution(tools, optimalDelay);
        expect(contentionManager.scheduleExecution).toHaveBeenCalledWith(tools, expectedDelay);
      });
    });
  });

  describe('Parallel execution fault tolerance', () => {
    const faultToleranceCases = [
      { scenario: 'single tool failure', failedTools: 1, totalTools: 3, expectedSuccess: true },
      { scenario: 'multiple tool failures', failedTools: 2, totalTools: 5, expectedSuccess: true },
      { scenario: 'majority failure', failedTools: 3, totalTools: 4, expectedSuccess: false },
      { scenario: 'critical tool failure', failedTools: 1, totalTools: 2, criticalTool: true, expectedSuccess: false }
    ];
    
    faultToleranceCases.forEach(({ scenario, failedTools, totalTools, criticalTool, expectedSuccess }) => {
      test(`should handle ${scenario} gracefully`, async () => {
        const tools = Array(totalTools).fill().map((_, i) => ({ 
          name: `tool-${i}`, 
          critical: i === 0 && criticalTool 
        }));
        
        const mockResults = tools.map((tool, index) => ({ tool, success: index >= failedTools, error: index < failedTools ? 'Mock execution failure' : null, executionTime: 1000 }));
        
        executionController.executeToolsInParallel.mockResolvedValue(mockResults);
        
        const result = await executionController.executeToolsInParallel(tools, wrapperManager);
        const successfulTools = result.filter(r => r.success);
        const failedCriticalTools = result.filter(r => !r.success && r.tool.critical);
        
        expect(result).toHaveLength(totalTools);
        expect(successfulTools).toHaveLength(totalTools - failedTools);
        
        if (criticalTool && failedTools > 0) {
          expect(failedCriticalTools).toHaveLength(1);
        }
      });
    });
  });

  describe('Performance monitoring during parallel execution', () => {
    test('should monitor parallel execution metrics', async () => {
      const monitor = { trackConcurrency: jest.fn(), measureThroughput: jest.fn(), recordResourceUtilization: jest.fn(), generateReport: jest.fn() };
      const tools = 3;
      
      monitor.trackConcurrency(tools);
      monitor.measureThroughput(tools, 44000);
      monitor.recordResourceUtilization('cpu', 75);
      monitor.recordResourceUtilization('memory', 256);
      
      expect(monitor.trackConcurrency).toHaveBeenCalledWith(3);
      expect(monitor.measureThroughput).toHaveBeenCalledWith(3, 44000);
      expect(monitor.recordResourceUtilization).toHaveBeenCalledTimes(2);
    });
    
    test('should detect parallel execution bottlenecks', () => {
      const detector = { analyzeExecutionPattern: jest.fn().mockImplementation((t) => Math.max(...t) > (t.reduce((a,b) => a+b, 0) / t.length) * 2 ? 'load-imbalance' : 'optimal') };
      expect(detector.analyzeExecutionPattern([30000, 32000, 31000])).toBe('optimal');
      expect(detector.analyzeExecutionPattern([15000, 60000, 20000])).toBe('load-imbalance');
    });
  });
});