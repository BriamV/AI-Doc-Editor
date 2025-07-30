const EnvironmentChecker = require('../../core/EnvironmentChecker.cjs');
const ToolChecker = require('../../core/environment/ToolChecker.cjs');

jest.mock('../../core/environment/ToolChecker.cjs');
jest.mock('../../core/environment/EnvironmentValidator.cjs');
jest.mock('../../utils/VenvManager.cjs');
jest.mock('../../core/services/PackageManagerService.cjs');

describe('Error Messages & Recommendations (RF-007)', () => {
  let environmentChecker, mockLogger, toolChecker, mockPackageManagerService;

  beforeEach(() => {
    mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), level: 'info' };
    toolChecker = new ToolChecker(mockLogger);
    
    mockPackageManagerService = {
      _initialize: jest.fn().mockResolvedValue(),
      getManager: jest.fn().mockResolvedValue('npm'),
      getInstallCommandForPackage: jest.fn()
    };
    
    require('../../core/services/PackageManagerService.cjs').getPackageManagerService = jest.fn().mockReturnValue(mockPackageManagerService);
    environmentChecker = new EnvironmentChecker({}, mockLogger);
    jest.clearAllMocks();
  });

  describe('Tool error messages', () => {
    const errorCases = [
      { tool: 'docker', critical: false, expectedWarning: '🔶 docker: not available' },
      { tool: 'git', critical: true, expectedWarning: '🔶 git: not available' }
    ];

    errorCases.forEach(({ tool, critical, expectedWarning, installUrl }) => {
      test(`should display error for ${tool}`, () => {
        const toolConfig = { command: `${tool} --version`, description: `${tool} description`, installUrl, critical };
        const result = { available: false, error: 'Command failed', command: toolConfig.command, description: toolConfig.description, installUrl };
        
        toolChecker._logToolResult(tool, toolConfig, result);
        
        expect(mockLogger.warn).toHaveBeenCalledWith(expectedWarning);
        if (critical || mockLogger.level === 'debug') {
          expect(mockLogger.warn).toHaveBeenCalledWith(`   └─ ${toolConfig.description}`);
          expect(mockLogger.warn).toHaveBeenCalledWith(`   └─ Install: ${installUrl}`);
        }
      });
    });
  });

  describe('Success messages with detection methods', () => {
    const successCases = [
      { tool: 'git', version: '2.34.1', method: 'standard', expectedMessage: '✅ git: 2.34.1' },
      { tool: 'black', version: '23.3.0', method: 'venv', expectedMessage: '✅ black: 23.3.0 (venv)' }
    ];

    successCases.forEach(({ tool, version, method, expectedMessage }) => {
      test(`should display success for ${tool} (${method})`, () => {
        const toolConfig = { command: `${tool} --version`, description: `${tool} description` };
        const result = { available: true, version, detectionMethod: method, command: toolConfig.command, description: toolConfig.description };
        
        toolChecker._logToolResult(tool, toolConfig, result);
        expect(mockLogger.info).toHaveBeenCalledWith(expectedMessage);
      });
    });
  });

  describe('Critical tool errors', () => {
    const criticalCases = [
      { tool: 'git', error: 'Command not found: git', expectedError: 'Critical tool missing: git' }
    ];

    criticalCases.forEach(({ tool, error, expectedError }) => {
      test(`should throw for missing ${tool}`, async () => {
        const tools = {
          [tool]: {
            command: `${tool} --version`,
            description: `${tool} description`,
            installUrl: tool === 'git' ? 'https://git-scm.com/downloads' : 'https://nodejs.org/en/download/',
            critical: true
          }
        };
        
        toolChecker.checkTool = jest.fn().mockResolvedValue({
          available: false, error, command: tools[tool].command, description: tools[tool].description, installUrl: tools[tool].installUrl
        });
        
        await expect(toolChecker.checkCriticalTools(tools)).rejects.toThrow(expectedError);
      });
    });
  });

  describe('Package manager install commands', () => {
    const packageManagerCases = [
      { manager: 'npm', package: 'typescript', expected: 'npm install --save-dev typescript' },
      { manager: 'yarn', package: '@stoplight/spectral-cli', expected: 'yarn add --dev @stoplight/spectral-cli' }
    ];

    packageManagerCases.forEach(({ manager, package: packageName, expected }) => {
      test(`should generate ${manager} install command`, async () => {
        mockPackageManagerService.getManager.mockResolvedValue(manager);
        mockPackageManagerService.getInstallCommandForPackage.mockResolvedValue(expected);
        
        const installCommand = await environmentChecker._getInstallCommand(packageName);
        
        expect(installCommand).toBe(expected);
        expect(mockPackageManagerService.getInstallCommandForPackage).toHaveBeenCalledWith(packageName);
      });
    });
  });

  describe('Recommendation generation', () => {
    const recommendationCases = [
      { scenario: 'docker-missing', toolResults: { docker: { available: false } }, expectedRecommendation: 'Install Docker for optimal MegaLinter performance' },
      { scenario: 'snyk-missing', toolResults: { snyk: { available: false } }, expectedRecommendation: /Install Snyk CLI for security scanning capabilities/ }
    ];

    recommendationCases.forEach(({ scenario, toolResults, expectedRecommendation }) => {
      test(`should generate recommendation for ${scenario}`, async () => {
        const mockToolChecker = require('../../core/environment/ToolChecker.cjs');
        const mockEnvironmentValidator = require('../../core/environment/EnvironmentValidator.cjs');
        const mockVenvManager = require('../../utils/VenvManager.cjs');
        
        mockToolChecker.prototype.checkCriticalTools = jest.fn().mockResolvedValue(new Map([
          ['git', { available: true }], ['node', { available: true }], ['npm', { available: true }]
        ]));
        
        const optionalResults = new Map();
        Object.entries(toolResults).forEach(([tool, result]) => optionalResults.set(tool, result));
        
        mockToolChecker.prototype.checkTools = jest.fn()
          .mockResolvedValueOnce(new Map())
          .mockResolvedValueOnce(optionalResults);
        
        mockEnvironmentValidator.prototype.checkEnvironmentVariables = jest.fn().mockResolvedValue(new Map());
        mockEnvironmentValidator.prototype.checkFileSystemPermissions = jest.fn().mockResolvedValue();
        mockVenvManager.prototype.detectVirtualEnvironment = jest.fn().mockReturnValue(true);
        mockVenvManager.prototype.getVenvInfo = jest.fn().mockReturnValue({ detected: true, path: '.venv' });
        
        require('fs').existsSync = jest.fn().mockReturnValue(true);
        mockPackageManagerService.getInstallCommandForPackage = jest.fn().mockImplementation((pkg) => `yarn add --dev ${pkg}`);
        
        const result = await environmentChecker.checkEnvironment();
        
        if (typeof expectedRecommendation === 'string') {
          expect(result.recommendations).toContain(expectedRecommendation);
        } else {
          expect(result.recommendations.some(rec => expectedRecommendation.test(rec))).toBe(true);
        }
      });
    });
  });

  describe('Environment variable recommendations', () => {
    const envVarCases = [
      { snykAvailable: true, snykTokenSet: false, expectedRecommendation: 'Set SNYK_TOKEN environment variable for authenticated security scans: export SNYK_TOKEN=your_token_here' }
    ];

    envVarCases.forEach(({ scenario, snykAvailable, snykTokenSet, expectedRecommendation }) => {
      test(`should handle ${scenario}`, async () => {
        const mockToolChecker = require('../../core/environment/ToolChecker.cjs');
        const mockEnvironmentValidator = require('../../core/environment/EnvironmentValidator.cjs');
        const mockVenvManager = require('../../utils/VenvManager.cjs');
        
        mockToolChecker.prototype.checkCriticalTools = jest.fn().mockResolvedValue(new Map([['git', { available: true }]]));
        
        const optionalResults = new Map([['snyk', { available: snykAvailable }]]);
        mockToolChecker.prototype.checkTools = jest.fn().mockResolvedValueOnce(new Map()).mockResolvedValueOnce(optionalResults);
        
        const environmentResults = new Map([['SNYK_TOKEN', { available: snykTokenSet }]]);
        mockEnvironmentValidator.prototype.checkEnvironmentVariables = jest.fn().mockResolvedValue(environmentResults);
        mockEnvironmentValidator.prototype.checkFileSystemPermissions = jest.fn().mockResolvedValue();
        mockVenvManager.prototype.detectVirtualEnvironment = jest.fn().mockReturnValue(true);
        mockVenvManager.prototype.getVenvInfo = jest.fn().mockReturnValue({ detected: true, path: '.venv' });
        
        require('fs').existsSync = jest.fn().mockReturnValue(true);
        
        const result = await environmentChecker.checkEnvironment();
        
        if (expectedRecommendation) {
          expect(result.recommendations).toContain(expectedRecommendation);
        } else {
          expect(result.recommendations.every(rec => !rec.includes('SNYK_TOKEN'))).toBe(true);
        }
      });
    });
  });

  describe('Verbose logging mode', () => {
    test('should show detailed error in debug mode', () => {
      mockLogger.level = 'debug';
      
      const toolConfig = { command: 'missing-tool --version', description: 'Missing tool', installUrl: 'https://install.com', critical: false };
      const result = { available: false, error: 'Command not found', command: toolConfig.command, description: toolConfig.description, installUrl: toolConfig.installUrl };
      
      toolChecker._logToolResult('missing-tool', toolConfig, result);
      
      expect(mockLogger.warn).toHaveBeenCalledWith('🔶 missing-tool: not available');
      expect(mockLogger.warn).toHaveBeenCalledWith('   └─ Missing tool');
      expect(mockLogger.warn).toHaveBeenCalledWith('   └─ Install: https://install.com');
    });
  });
});