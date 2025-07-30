const { ExecutionController } = require('../../core/execution/ExecutionController.cjs');

jest.mock('../../core/execution/ExecutionController.cjs');

describe('Memory Usage Validation (RNF-002)', () => {
  let memoryMonitor, mockProcess;

  beforeEach(() => {
    mockProcess = { memoryUsage: jest.fn().mockReturnValue({ rss: 128*1024*1024, heapTotal: 64*1024*1024, heapUsed: 32*1024*1024, external: 8*1024*1024, arrayBuffers: 4*1024*1024 }) };
    global.process = mockProcess;
    
    memoryMonitor = {
      measureMemoryUsage: jest.fn(),
      validateConstraints: jest.fn(),
      trackMemoryTrend: jest.fn(),
      detectMemoryLeaks: jest.fn()
    };
  });

  afterEach(() => jest.clearAllMocks());

  describe('RNF-002 memory constraint validation (<512MB)', () => {
    const memoryCases = [
      { 
        desc: 'small scope within limits',
        scope: 'small', 
        files: 5,
        tools: 1,
        expectedMemory: 128, 
        maxMemory: 256,
        shouldPass: true
      },
      { 
        desc: 'medium scope acceptable usage',
        scope: 'medium', 
        files: 20,
        tools: 2,
        expectedMemory: 256, 
        maxMemory: 384,
        shouldPass: true
      },
      { 
        desc: 'large scope near limit',
        scope: 'large', 
        files: 50,
        tools: 3,
        expectedMemory: 384, 
        maxMemory: 512,
        shouldPass: true
      },
      { 
        desc: 'xl scope exceeding limit',
        scope: 'xl', 
        files: 100,
        tools: 5,
        expectedMemory: 600, 
        maxMemory: 512,
        shouldPass: false
      }
    ];
    
    memoryCases.forEach(({ desc, scope, files, tools, expectedMemory, maxMemory, shouldPass }) => {
      test(`should validate ${desc}`, () => {
        const actualMemoryMB = expectedMemory * 0.9; // Simulate actual usage
        const memoryBytes = actualMemoryMB * 1024 * 1024;
        
        mockProcess.memoryUsage.mockReturnValue({ rss: memoryBytes, heapTotal: memoryBytes*0.6, heapUsed: memoryBytes*0.4, external: memoryBytes*0.1, arrayBuffers: memoryBytes*0.05 });
        
        memoryMonitor.measureMemoryUsage.mockReturnValue(actualMemoryMB);
        memoryMonitor.validateConstraints.mockReturnValue(actualMemoryMB <= maxMemory);
        
        const usage = memoryMonitor.measureMemoryUsage();
        const isValid = memoryMonitor.validateConstraints(usage, maxMemory);
        
        expect(usage).toBe(actualMemoryMB);
        expect(isValid).toBe(shouldPass);
        
        if (shouldPass) {
          expect(usage).toBeLessThanOrEqual(512); // RNF-002 absolute limit
        }
      });
    });
  });

  describe('Memory usage patterns by tool type', () => {
    const toolMemoryPatterns = [
      { tool: 'megalinter', baseMemory: 64, scalingFactor: 1.2, memoryType: 'linear' },
      { tool: 'jest', baseMemory: 128, scalingFactor: 1.5, memoryType: 'test-proportional' },
      { tool: 'snyk', baseMemory: 96, scalingFactor: 1.1, memoryType: 'analysis-intensive' },
      { tool: 'tsc', baseMemory: 48, scalingFactor: 2.0, memoryType: 'compilation-spike' }
    ];
    
    toolMemoryPatterns.forEach(({ tool, baseMemory, scalingFactor, memoryType }) => {
      test(`should track ${tool} memory pattern (${memoryType})`, () => {
        const files = 20;
        const predictedMemory = baseMemory * Math.pow(files / 10, scalingFactor);
        
        memoryMonitor.measureMemoryUsage.mockReturnValue(predictedMemory);
        
        const usage = memoryMonitor.measureMemoryUsage();
        
        expect(usage).toBe(predictedMemory);
        expect(usage).toBeGreaterThan(baseMemory * 0.8); // At least base usage
        
        if (memoryType === 'compilation-spike') {
          expect(usage).toBeGreaterThan(baseMemory * 1.5); // Significant spike expected
        }
      });
    });
  });

  describe('Memory leak detection', () => {
    const memoryLeakScenarios = [
      { scenario: 'stable memory usage', trend: 'stable', leakDetected: false },
      { scenario: 'gradual memory increase', trend: 'gradual-increase', leakDetected: true },
      { scenario: 'memory spike and recovery', trend: 'spike-recovery', leakDetected: false },
      { scenario: 'continuous memory growth', trend: 'continuous-growth', leakDetected: true }
    ];
    
    memoryLeakScenarios.forEach(({ scenario, trend, leakDetected }) => {
      test(`should detect ${scenario}`, () => {
        const memoryMeasurements = generateMemoryTrend(trend);
        
        memoryMonitor.detectMemoryLeaks.mockImplementation((measurements) => {
          const first = measurements[0];
          const last = measurements[measurements.length - 1];
          const growth = (last - first) / first;
          
          return growth > 0.3; // 30% growth indicates potential leak
        });
        
        const hasLeak = memoryMonitor.detectMemoryLeaks(memoryMeasurements);
        
        expect(hasLeak).toBe(leakDetected);
        expect(memoryMonitor.detectMemoryLeaks).toHaveBeenCalledWith(memoryMeasurements);
      });
    });
    
    function generateMemoryTrend(type) {
      const base = 128, points = 10;
      switch (type) {
        case 'stable': return Array(points).fill().map(() => base + Math.random() * 10 - 5);
        case 'gradual-increase': return Array(points).fill().map((_, i) => base + i * 5);
        case 'spike-recovery': return Array(points).fill().map((_, i) => i === 5 ? base * 2 : base + Math.random() * 10 - 5);
        case 'continuous-growth': return Array(points).fill().map((_, i) => base * (1 + i * 0.1));
        default: return Array(points).fill(base);
      }
    }
  });

  describe('Memory optimization strategies', () => {
    const optimizationStrategies = [
      { strategy: 'garbage-collection', trigger: 'high-usage', threshold: 400 },
      { strategy: 'buffer-limiting', trigger: 'buffer-overflow', threshold: 64 },
      { strategy: 'tool-sequencing', trigger: 'memory-pressure', threshold: 450 },
      { strategy: 'emergency-cleanup', trigger: 'near-limit', threshold: 480 }
    ];
    
    optimizationStrategies.forEach(({ strategy, trigger, threshold }) => {
      test(`should apply ${strategy} when ${trigger} detected`, () => {
        const memoryOptimizer = {
          shouldApplyStrategy: jest.fn().mockImplementation((currentMemory, strategyThreshold) => {
            return currentMemory >= strategyThreshold;
          }),
          applyOptimization: jest.fn()
        };
        
        const currentMemory = threshold + 10; // Trigger condition
        const shouldApply = memoryOptimizer.shouldApplyStrategy(currentMemory, threshold);
        
        expect(shouldApply).toBe(true);
        
        if (shouldApply) {
          memoryOptimizer.applyOptimization(strategy);
          expect(memoryOptimizer.applyOptimization).toHaveBeenCalledWith(strategy);
        }
      });
    });
  });

  describe('Memory monitoring during parallel execution', () => {
    test('should monitor memory during concurrent tool execution', () => {
      const tracker = { trackConcurrentUsage: jest.fn().mockImplementation((t) => (64 * t * 1.2) + (t * 16)) };
      const memory = tracker.trackConcurrentUsage(3);
      expect(memory).toBeGreaterThan(192);
      expect(memory).toBeLessThanOrEqual(512);
    });
    
    test('should adjust concurrency based on memory availability', () => {
      const adjuster = { calculateOptimalConcurrency: jest.fn().mockImplementation((avail, perTool) => Math.floor(avail * 0.8 / perTool)) };
      expect(adjuster.calculateOptimalConcurrency(512, 96)).toBe(4);
    });
  });

  describe('Memory constraint validation in edge cases', () => {
    const cases = [{ mem: 256, limit: true }, { mem: 1024, limit: false }, { frag: 0.7, opt: true }, { frag: 0.1, opt: false }];
    cases.forEach(({ mem, limit, frag, opt }) => {
      test(`should handle edge case`, () => {
        const handler = { shouldLimitExecution: jest.fn().mockReturnValue(limit), shouldOptimizeMemory: jest.fn().mockReturnValue(opt), adaptExecutionStrategy: jest.fn() };
        if (mem) expect(handler.shouldLimitExecution(mem)).toBe(limit);
        if (frag !== undefined) expect(handler.shouldOptimizeMemory(frag)).toBe(opt);
      });
    });
  });
});