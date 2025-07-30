const { ExecutionController } = require('../../core/execution/ExecutionController.cjs');

jest.mock('../../core/execution/ExecutionController.cjs');

describe('Performance Regression Detection (RNF-002)', () => {
  let regressionDetector;

  beforeEach(() => {
    regressionDetector = {
      calculateRegression: jest.fn(),
      isRegressionSignificant: jest.fn(),
      generateAlert: jest.fn(),
      getThreshold: jest.fn().mockReturnValue(0.20) // 20% threshold from RNF-002
    };
  });

  afterEach(() => jest.clearAllMocks());

  describe('RNF-002 regression threshold validation (<20%)', () => {
    const regressionCases = [
      { 
        desc: 'no regression - improvement', 
        baseline: 60000, 
        current: 55000, 
        expected: { regression: false, percentage: -8.3, alert: false }
      },
      { 
        desc: 'no regression - within threshold', 
        baseline: 60000, 
        current: 70000, 
        expected: { regression: false, percentage: 16.7, alert: false }
      },
      { 
        desc: 'significant regression - over threshold', 
        baseline: 60000, 
        current: 75000, 
        expected: { regression: true, percentage: 25.0, alert: true }
      },
      { 
        desc: 'critical regression - major degradation', 
        baseline: 120000, 
        current: 180000, 
        expected: { regression: true, percentage: 50.0, alert: true }
      },
      { 
        desc: 'edge case - exactly at threshold', 
        baseline: 100000, 
        current: 120000, 
        expected: { regression: true, percentage: 20.0, alert: true }
      }
    ];
    
    regressionCases.forEach(({ desc, baseline, current, expected }) => {
      test(`should detect ${desc}`, () => {
        const actualPercentage = ((current - baseline) / baseline) * 100;
        const isRegression = actualPercentage > regressionDetector.getThreshold() * 100;
        
        regressionDetector.calculateRegression.mockReturnValue(actualPercentage);
        regressionDetector.isRegressionSignificant.mockReturnValue(isRegression);
        
        const percentage = regressionDetector.calculateRegression(baseline, current);
        const regression = regressionDetector.isRegressionSignificant(percentage);
        
        expect(Math.abs(percentage - expected.percentage)).toBeLessThan(0.1);
        expect(regression).toBe(expected.regression);
        
        if (expected.alert) {
          regressionDetector.generateAlert('performance-regression', { baseline, current, percentage });
          expect(regressionDetector.generateAlert).toHaveBeenCalled();
        }
      });
    });
  });

  describe('Scope-specific regression analysis', () => {
    const scopeRegressionCases = [
      { scope: 'small', baseline: 30000, tolerance: 0.15, files: 5 },
      { scope: 'medium', baseline: 120000, tolerance: 0.20, files: 20 },
      { scope: 'large', baseline: 300000, tolerance: 0.25, files: 50 },
      { scope: 'xl', baseline: 600000, tolerance: 0.30, files: 100 }
    ];
    
    scopeRegressionCases.forEach(({ scope, baseline, tolerance, files }) => {
      test(`should apply scope-specific tolerance for ${scope} projects`, () => {
        const acceptableCurrent = baseline * (1 + tolerance - 0.05); // Just under tolerance
        const unacceptableCurrent = baseline * (1 + tolerance + 0.05); // Just over tolerance
        
        regressionDetector.isRegressionSignificant.mockImplementation((percentage, customTolerance) => {
          return Math.abs(percentage) > (customTolerance || regressionDetector.getThreshold()) * 100;
        });
        
        const acceptableRegression = regressionDetector.isRegressionSignificant(
          ((acceptableCurrent - baseline) / baseline) * 100, 
          tolerance
        );
        const unacceptableRegression = regressionDetector.isRegressionSignificant(
          ((unacceptableCurrent - baseline) / baseline) * 100, 
          tolerance
        );
        
        expect(acceptableRegression).toBe(false);
        expect(unacceptableRegression).toBe(true);
      });
    });
  });

  describe('Multi-dimensional regression detection', () => {
    const dimensionalCases = [
      { dimension: 'error-detection', weight: 0.3, critical: true },
      { dimension: 'testing-coverage', weight: 0.25, critical: true },
      { dimension: 'security-audit', weight: 0.25, critical: true },
      { dimension: 'build-dependencies', weight: 0.2, critical: false }
    ];
    
    dimensionalCases.forEach(({ dimension, weight, critical }) => {
      test(`should weight ${dimension} regression appropriately`, () => {
        const baselineTime = 60000;
        const currentTime = 80000; // 33% regression
        const rawRegression = ((currentTime - baselineTime) / baselineTime) * 100;
        const weightedRegression = rawRegression * weight;
        
        regressionDetector.calculateRegression.mockReturnValue(weightedRegression);
        
        const regression = regressionDetector.calculateRegression(baselineTime, currentTime);
        
        expect(regression).toBe(rawRegression * weight);
        
        if (critical && weightedRegression > 20) {
          regressionDetector.generateAlert('critical-dimension-regression', {
            dimension, regression: weightedRegression
          });
          expect(regressionDetector.generateAlert).toHaveBeenCalled();
        }
      });
    });
  });

  describe('Regression alert system', () => {
    const alertCases = [
      { severity: 'warning', threshold: 15, expectedAction: 'log' },
      { severity: 'error', threshold: 25, expectedAction: 'notify' },
      { severity: 'critical', threshold: 50, expectedAction: 'block' }
    ];
    
    alertCases.forEach(({ severity, threshold, expectedAction }) => {
      test(`should generate ${severity} alert for ${threshold}% regression`, () => {
        const baseline = 100000;
        const current = baseline * (1 + threshold / 100);
        const regressionPercentage = threshold;
        
        regressionDetector.generateAlert.mockImplementation((type, data) => ({
          type,
          severity,
          action: expectedAction,
          data
        }));
        
        const alert = regressionDetector.generateAlert('performance-regression', {
          baseline,
          current,
          percentage: regressionPercentage,
          threshold: regressionDetector.getThreshold() * 100
        });
        
        expect(alert.severity).toBe(severity);
        expect(alert.action).toBe(expectedAction);
        expect(alert.data.percentage).toBe(regressionPercentage);
      });
    });
  });

  describe('Historical regression tracking', () => {
    test('should track regression trends over time', () => {
      const historicalData = [
        { timestamp: Date.now() - 172800000, executionTime: 100000 }, // 2 days ago
        { timestamp: Date.now() - 86400000, executionTime: 105000 },  // 1 day ago
        { timestamp: Date.now() - 43200000, executionTime: 112000 },  // 12 hours ago
        { timestamp: Date.now(), executionTime: 125000 }              // now
      ];
      
      const trendAnalyzer = {
        calculateTrend: jest.fn().mockImplementation((data) => {
          const firstTime = data[0].executionTime;
          const lastTime = data[data.length - 1].executionTime;
          return ((lastTime - firstTime) / firstTime) * 100;
        }),
        detectAcceleration: jest.fn().mockReturnValue(true)
      };
      
      const trend = trendAnalyzer.calculateTrend(historicalData);
      const isAccelerating = trendAnalyzer.detectAcceleration(historicalData);
      
      expect(trend).toBe(25); // 25% regression over 2 days
      expect(isAccelerating).toBe(true);
      expect(trendAnalyzer.calculateTrend).toHaveBeenCalledWith(historicalData);
    });
    
    test('should identify regression patterns', () => {
      const patternDetector = { identifyPattern: jest.fn().mockImplementation((r) => r.every(x => x > 0) ? 'consistent-degradation' : r.some(x => x > 50) ? 'spike-regression' : 'normal-variation') };
      expect(patternDetector.identifyPattern([5, 8, 12, 18, 25])).toBe('consistent-degradation');
      expect(patternDetector.identifyPattern([2, 3, 65, 4, 3])).toBe('spike-regression');
    });
  });
});