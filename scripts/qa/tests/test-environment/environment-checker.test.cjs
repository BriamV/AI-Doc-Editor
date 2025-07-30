const EnvironmentChecker = require('../../core/EnvironmentChecker.cjs');

jest.mock('../../core/environment/ToolChecker.cjs');
jest.mock('../../core/environment/EnvironmentValidator.cjs');
jest.mock('../../utils/VenvManager.cjs');
jest.mock('../../core/services/PackageManagerService.cjs');

describe('Environment Checker Integration (RF-007)', () => {
  let environmentChecker, mockLogger;

  beforeEach(() => {
    mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    
    const mockToolChecker = { checkCriticalTools: jest.fn(), checkTools: jest.fn() };
    const mockEnvironmentValidator = { checkEnvironmentVariables: jest.fn(), checkFileSystemPermissions: jest.fn() };
    const mockVenvManager = { detectVirtualEnvironment: jest.fn(), getVenvInfo: jest.fn() };
    
    require('../../core/environment/ToolChecker.cjs').mockImplementation(() => mockToolChecker);
    require('../../core/environment/EnvironmentValidator.cjs').mockImplementation(() => mockEnvironmentValidator);
    require('../../utils/VenvManager.cjs').mockImplementation(() => mockVenvManager);
    
    const mockPackageManagerService = { _initialize: jest.fn().mockResolvedValue(), getManager: jest.fn().mockResolvedValue('npm') };
    require('../../core/services/PackageManagerService.cjs').getPackageManagerService = jest.fn().mockReturnValue(mockPackageManagerService);
    
    environmentChecker = new EnvironmentChecker({}, mockLogger);
    jest.clearAllMocks();
  });

  describe('Complete environment check flow', () => {
    const flowCases = [
      { scenario: 'all-available', critical: new Map([['git', { available: true }]]), optional: new Map([['docker', { available: true }]]), expectedStatus: 'ready', expectedSuccess: true },
      { scenario: 'missing-optional', critical: new Map([['git', { available: true }]]), optional: new Map([['docker', { available: false }]]), expectedStatus: 'ready', expectedSuccess: true },
      { scenario: 'critical-missing', critical: null, optional: new Map(), expectedStatus: 'blocked', expectedSuccess: false, shouldThrow: true }
    ];

    flowCases.forEach(({ scenario, critical, optional, environment, expectedStatus, expectedSuccess, shouldThrow }) => {
      test(`should handle ${scenario}`, async () => {
        const mockToolChecker = require('../../core/environment/ToolChecker.cjs')();
        const mockEnvironmentValidator = require('../../core/environment/EnvironmentValidator.cjs')();
        const mockVenvManager = require('../../utils/VenvManager.cjs')();
        
        mockVenvManager.detectVirtualEnvironment.mockReturnValue(true);
        mockVenvManager.getVenvInfo.mockReturnValue({ detected: true, path: '.venv' });
        
        if (shouldThrow) {
          mockToolChecker.checkCriticalTools.mockRejectedValue(new Error('Critical tool missing'));
        } else {
          mockToolChecker.checkCriticalTools.mockResolvedValue(critical);
          mockToolChecker.checkTools.mockResolvedValueOnce(new Map()).mockResolvedValueOnce(optional);
        }
        
        mockEnvironmentValidator.checkEnvironmentVariables.mockResolvedValue(environment);
        mockEnvironmentValidator.checkFileSystemPermissions.mockResolvedValue();
        
        const result = await environmentChecker.checkEnvironment();
        
        expect(result.success).toBe(expectedSuccess);
        if (!shouldThrow) {
          expect(result.summary.status).toBe(expectedStatus);
          expect(result.summary.critical.total).toBe(critical.size);
        }
      });
    });
  });

  describe('Summary generation', () => {
    const summaryCases = [
      { critical: { total: 3, available: 3 }, optional: { total: 5, available: 4 }, expectedStatus: 'ready' },
      { critical: { total: 3, available: 2 }, optional: { total: 5, available: 5 }, expectedStatus: 'blocked' }
    ];

    summaryCases.forEach(({ critical, optional, expectedStatus }) => {
      test(`should generate summary with ${expectedStatus} status`, async () => {
        const mockToolChecker = require('../../core/environment/ToolChecker.cjs')();
        const mockEnvironmentValidator = require('../../core/environment/EnvironmentValidator.cjs')();
        const mockVenvManager = require('../../utils/VenvManager.cjs')();
        
        const criticalMap = new Map();
        const optionalMap = new Map();
        
        for (let i = 0; i < critical.total; i++) {
          criticalMap.set(`critical-${i}`, { available: i < critical.available });
        }
        for (let i = 0; i < optional.total; i++) {
          optionalMap.set(`optional-${i}`, { available: i < optional.available });
        }
        
        mockVenvManager.detectVirtualEnvironment.mockReturnValue(true);
        mockToolChecker.checkCriticalTools.mockResolvedValue(criticalMap);
        mockToolChecker.checkTools.mockResolvedValueOnce(new Map()).mockResolvedValueOnce(optionalMap);
        mockEnvironmentValidator.checkEnvironmentVariables.mockResolvedValue(new Map());
        mockEnvironmentValidator.checkFileSystemPermissions.mockResolvedValue();
        
        const result = await environmentChecker.checkEnvironment();
        
        expect(result.summary.critical.total).toBe(critical.total);
        expect(result.summary.critical.available).toBe(critical.available);
        expect(result.summary.status).toBe(expectedStatus);
      });
    });
  });

  describe('Recommendation generation', () => {
    test('should generate comprehensive recommendations', async () => {
      const mockToolChecker = require('../../core/environment/ToolChecker.cjs')();
      const mockEnvironmentValidator = require('../../core/environment/EnvironmentValidator.cjs')();
      const mockVenvManager = require('../../utils/VenvManager.cjs')();
      
      const criticalResults = new Map([['git', { available: true }], ['node', { available: true }]]);
      const optionalResults = new Map([['docker', { available: false }], ['megalinter', { available: false }], ['snyk', { available: false }]]);
      const environmentResults = new Map([['SNYK_TOKEN', { available: false }]]);
      
      mockVenvManager.detectVirtualEnvironment.mockReturnValue(false);
      mockToolChecker.checkCriticalTools.mockResolvedValue(criticalResults);
      mockToolChecker.checkTools.mockResolvedValueOnce(new Map()).mockResolvedValueOnce(optionalResults);
      mockEnvironmentValidator.checkEnvironmentVariables.mockResolvedValue(environmentResults);
      mockEnvironmentValidator.checkFileSystemPermissions.mockResolvedValue();
      
      require('fs').existsSync = jest.fn().mockReturnValue(false);
      
      const result = await environmentChecker.checkEnvironment();
      
      expect(result.recommendations).toContain(expect.stringMatching(/Install Docker for optimal MegaLinter performance/));
      expect(result.recommendations).toContain(expect.stringMatching(/Install MegaLinter locally/));
      expect(result.recommendations).toContain(expect.stringMatching(/Install Snyk CLI/));
      expect(result.recommendations).toContain(expect.stringMatching(/Create \.mega-linter\.yml/));
      expect(result.recommendations).toContain(expect.stringMatching(/Consider creating a Python virtual environment/));
    });
  });

  describe('Virtual environment integration', () => {
    test('should handle venv detection', async () => {
      const mockToolChecker = require('../../core/environment/ToolChecker.cjs')();
      const mockEnvironmentValidator = require('../../core/environment/EnvironmentValidator.cjs')();
      const mockVenvManager = require('../../utils/VenvManager.cjs')();
      
      mockVenvManager.detectVirtualEnvironment.mockReturnValue(true);
      mockVenvManager.getVenvInfo.mockReturnValue({ detected: true, path: '.venv' });
      mockToolChecker.checkCriticalTools.mockResolvedValue(new Map([['git', { available: true }]]));
      mockToolChecker.checkTools.mockResolvedValue(new Map());
      mockEnvironmentValidator.checkEnvironmentVariables.mockResolvedValue(new Map());
      mockEnvironmentValidator.checkFileSystemPermissions.mockResolvedValue();
      
      const result = await environmentChecker.checkEnvironment();
      expect(mockVenvManager.detectVirtualEnvironment).toHaveBeenCalled();
      expect(result.recommendations.some(rec => /Virtual environment detected/.test(rec))).toBe(true);
    });
  });

  describe('Error handling', () => {
    test('should handle critical tool errors', async () => {
      const mockToolChecker = require('../../core/environment/ToolChecker.cjs')();
      const mockVenvManager = require('../../utils/VenvManager.cjs')();
      
      mockVenvManager.detectVirtualEnvironment.mockReturnValue(false);
      mockToolChecker.checkCriticalTools.mockRejectedValue(new Error('Critical tool missing'));
      
      const result = await environmentChecker.checkEnvironment();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Critical tool missing');
    });
  });

  describe('Results access methods', () => {
    test('should provide correct results access', async () => {
      const mockToolChecker = require('../../core/environment/ToolChecker.cjs')();
      const mockEnvironmentValidator = require('../../core/environment/EnvironmentValidator.cjs')();
      const mockVenvManager = require('../../utils/VenvManager.cjs')();
      
      mockVenvManager.detectVirtualEnvironment.mockReturnValue(true);
      mockToolChecker.checkCriticalTools.mockResolvedValue(new Map([['git', { available: true }]]));
      mockToolChecker.checkTools.mockResolvedValueOnce(new Map()).mockResolvedValueOnce(new Map([['docker', { available: false }]]));
      mockEnvironmentValidator.checkEnvironmentVariables.mockResolvedValue(new Map([['NODE_ENV', { available: true }]]));
      mockEnvironmentValidator.checkFileSystemPermissions.mockResolvedValue();
      
      await environmentChecker.checkEnvironment();
      
      expect(environmentChecker.isToolAvailable('git')).toBe(true);
      expect(environmentChecker.isToolAvailable('docker')).toBe(false);
      expect(environmentChecker.isToolAvailable('nonexistent')).toBe(false);
      
      const results = environmentChecker.getResults();
      expect(results).toHaveProperty('critical');
      expect(results).toHaveProperty('optional');
      expect(results).toHaveProperty('environment');
      expect(results).toHaveProperty('recommendations');
    });
  });
});