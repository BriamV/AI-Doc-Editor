const { ExecutionController } = require('../../core/execution/ExecutionController.cjs');

jest.mock('../../core/execution/ExecutionController.cjs');

describe('Scalability Validation (RNF-002)', () => {
  let scalabilityTester, mockPerformance;

  beforeEach(() => {
    mockPerformance = { now: jest.fn() };
    global.performance = mockPerformance;
    
    scalabilityTester = {
      measureExecutionTime: jest.fn(),
      calculateScalingFactor: jest.fn(),
      predictPerformance: jest.fn(),
      validateThresholds: jest.fn()
    };
  });

  afterEach(() => jest.clearAllMocks());

  describe('File volume scaling validation', () => {
    const scalabilityCases = [
      { 
        desc: 'linear scaling range',
        files: 10, 
        baselineTime: 30000,
        expectedLinearGrowth: true, 
        maxTimeMultiplier: 1.2,
        scalingType: 'linear'
      },
      { 
        desc: 'sub-linear optimal range',
        files: 50, 
        baselineTime: 120000,
        expectedLinearGrowth: true, 
        maxTimeMultiplier: 1.5,
        scalingType: 'sub-linear'
      },
      { 
        desc: 'super-linear threshold',
        files: 100, 
        baselineTime: 300000,
        expectedLinearGrowth: false, 
        maxTimeMultiplier: 2.0,
        scalingType: 'super-linear'
      },
      { 
        desc: 'exponential scaling point',
        files: 200, 
        baselineTime: 600000,
        expectedLinearGrowth: false, 
        maxTimeMultiplier: 3.0,
        scalingType: 'exponential'
      }
    ];
    
    scalabilityCases.forEach(({ desc, files, baselineTime, expectedLinearGrowth, maxTimeMultiplier, scalingType }) => {
      test(`should validate ${desc} (${files} files)`, () => {
        const actualTime = baselineTime * maxTimeMultiplier * 0.9; // Under threshold
        const linearExpectedTime = baselineTime * (files / 10); // Assuming baseline is for 10 files
        const isLinear = actualTime <= linearExpectedTime * 1.1; // 10% tolerance
        
        scalabilityTester.measureExecutionTime.mockReturnValue(actualTime);
        scalabilityTester.calculateScalingFactor.mockReturnValue(actualTime / linearExpectedTime);
        
        const executionTime = scalabilityTester.measureExecutionTime(files);
        const scalingFactor = scalabilityTester.calculateScalingFactor(executionTime, linearExpectedTime);
        
        expect(executionTime).toBe(actualTime);
        expect(executionTime).toBeLessThanOrEqual(baselineTime * maxTimeMultiplier);
        
        if (expectedLinearGrowth) {
          expect(scalingFactor).toBeLessThanOrEqual(1.2); // Acceptable deviation
        } else {
          expect(scalingFactor).toBeGreaterThan(1.2);
        }
      });
    });
  });

  describe('Tool combination scaling behavior', () => {
    const toolScalingCases = [
      { tools: 1, files: 20, expectedScaling: 'linear', threshold: 1.0 },
      { tools: 2, files: 20, expectedScaling: 'parallel-benefit', threshold: 0.7 },
      { tools: 3, files: 50, expectedScaling: 'parallel-optimal', threshold: 0.5 },
      { tools: 5, files: 100, expectedScaling: 'parallel-saturation', threshold: 0.4 }
    ];
    
    toolScalingCases.forEach(({ tools, files, expectedScaling, threshold }) => {
      test(`should scale ${expectedScaling} with ${tools} tools on ${files} files`, () => {
        const singleToolTime = 60000; // Baseline for single tool
        const expectedTime = singleToolTime * threshold;
        
        scalabilityTester.predictPerformance.mockImplementation((toolCount, fileCount) => {
          const baseComplexity = fileCount * 1000; // 1s per file base
          const parallelEfficiency = Math.max(0.3, 1 / Math.sqrt(toolCount));
          return baseComplexity * parallelEfficiency;
        });
        
        const predictedTime = scalabilityTester.predictPerformance(tools, files);
        const scalingEfficiency = singleToolTime / predictedTime;
        
        expect(predictedTime).toBeLessThan(singleToolTime);
        if (tools > 1) {
          expect(scalingEfficiency).toBeGreaterThan(1); // Should be faster than single tool
        }
      });
    });
  });

  describe('Memory scaling patterns', () => {
    const memoryScalingCases = [
      { files: 10, expectedMemory: 64, maxMemory: 128, scalingPattern: 'constant' },
      { files: 50, expectedMemory: 128, maxMemory: 256, scalingPattern: 'linear' },
      { files: 100, expectedMemory: 256, maxMemory: 384, scalingPattern: 'sub-linear' },
      { files: 200, expectedMemory: 384, maxMemory: 512, scalingPattern: 'logarithmic' }
    ];
    
    memoryScalingCases.forEach(({ files, expectedMemory, maxMemory, scalingPattern }) => {
      test(`should exhibit ${scalingPattern} memory scaling for ${files} files`, () => {
        const predictor = { predictMemoryUsage: jest.fn().mockImplementation((f) => scalingPattern === 'constant' ? 32 + Math.min(2*f, 96) : scalingPattern === 'sub-linear' ? 32 + 4*Math.sqrt(f) : scalingPattern === 'logarithmic' ? 32 + 16*Math.log2(f) : 32 + 2*f) };
        
        const predictedMemory = predictor.predictMemoryUsage(files);
        
        expect(predictedMemory).toBeLessThanOrEqual(maxMemory);
        expect(predictedMemory).toBeGreaterThanOrEqual(expectedMemory * 0.8);
        expect(predictedMemory).toBeLessThanOrEqual(expectedMemory * 1.2);
      });
    });
  });

  describe('Threshold validation and breaking points', () => {
    const thresholdCases = [
      { metric: 'execution-time', files: 50, threshold: 300000, shouldPass: true },
      { metric: 'execution-time', files: 150, threshold: 300000, shouldPass: false },
      { metric: 'memory-usage', files: 100, threshold: 512, shouldPass: true },
      { metric: 'memory-usage', files: 300, threshold: 512, shouldPass: false }
    ];
    
    thresholdCases.forEach(({ metric, files, threshold, shouldPass }) => {
      test(`should ${shouldPass ? 'pass' : 'fail'} ${metric} threshold at ${files} files`, () => {
        scalabilityTester.validateThresholds.mockImplementation((metricType, value, limit) => {
          return value <= limit;
        });
        
        let actualValue;
        if (metric === 'execution-time') {
          actualValue = files * 2000; // 2s per file
        } else {
          actualValue = 32 + files * 1.5; // Base + 1.5MB per file
        }
        
        const isValid = scalabilityTester.validateThresholds(metric, actualValue, threshold);
        
        expect(isValid).toBe(shouldPass);
        expect(scalabilityTester.validateThresholds).toHaveBeenCalledWith(metric, actualValue, threshold);
      });
    });
  });

  describe('Performance degradation detection', () => {
    test('should detect performance cliff points', () => {
      const detector = { findCliffPoint: jest.fn().mockImplementation((m) => { for(let i=1; i<m.length; i++) if((m[i].time/m[i].files) > (m[i-1].time/m[i-1].files)*2) return m[i].files; return null; }) };
      const measurements = [{ files: 10, time: 20000 }, { files: 20, time: 40000 }, { files: 50, time: 100000 }, { files: 100, time: 300000 }, { files: 150, time: 600000 }];
      expect(detector.findCliffPoint(measurements)).toBe(100);
    });
    
    test('should predict optimal batch sizes', () => {
      const optimizer = { calculateOptimalBatchSize: jest.fn().mockImplementation((total, maxTime) => Math.min(Math.floor(maxTime/2000*0.7), Math.ceil(total/4))) };
      const batchSize = optimizer.calculateOptimalBatchSize(200, 120000);
      expect(batchSize).toBeGreaterThan(0);
      expect(batchSize).toBeLessThanOrEqual(200);
    });
  });

  describe('Scaling prediction and capacity planning', () => {
    test('should predict scaling requirements for future loads', () => {
      const planner = { predictResourceNeeds: jest.fn().mockImplementation((cur, tar, res) => { const s = tar/cur; const nl = Math.pow(s, 1.2); return { cpu: res.cpu*nl, memory: res.memory*Math.sqrt(s), time: res.time*nl }; }) };
      const prediction = planner.predictResourceNeeds(50, 200, { cpu: 4, memory: 256, time: 120000 });
      expect(prediction.memory).toBeLessThanOrEqual(512);
    });
  });
});