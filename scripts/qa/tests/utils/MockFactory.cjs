/**
 * MockFactory.cjs - Centralized Mock Creation Factory
 * Conservative consolidation of mock patterns from multiple test files
 * No new functionality added - exact mapping only
 */

class MockFactory {
  /**
   * Create package manager service mock
   */
  static createPackageManagerServiceMock(overrides = {}) {
    const defaultMock = {
      initialize: jest.fn().mockResolvedValue(true),
      getManager: jest.fn().mockReturnValue('yarn'),
      getInstallCommand: jest.fn().mockReturnValue('yarn install'),
      getAuditCommand: jest.fn().mockReturnValue('yarn audit'),
      getOutdatedCommand: jest.fn().mockReturnValue('yarn outdated'),
      getInfo: jest.fn().mockResolvedValue({
        manager: 'yarn',
        version: '1.22.0',
        initialized: true
      }),
      clearCache: jest.fn(),
      reset: jest.fn()
    };
    
    return { ...defaultMock, ...overrides };
  }

  /**
   * Create wrapper mock
   */
  static createWrapperMock(wrapperType = 'test', overrides = {}) {
    const defaultMock = {
      name: wrapperType,
      execute: jest.fn().mockResolvedValue({
        success: true,
        results: [],
        errors: []
      }),
      initialize: jest.fn().mockResolvedValue(true),
      cleanup: jest.fn(),
      isAvailable: jest.fn().mockResolvedValue(true)
    };
    
    return { ...defaultMock, ...overrides };
  }

  /**
   * Create config mock
   */
  static createConfigMock(overrides = {}) {
    const defaultConfig = {
      get: jest.fn((key, defaultValue) => {
        const configMap = {
          'tools.build': { all: ['npm', 'tsc'] },
          'tools.lint': { all: ['eslint'] },
          'tools.format': { all: ['prettier'] },
          'toolConfigurations.npm': { timeout: 60000 },
          ...overrides
        };
        return configMap[key] || defaultValue;
      }),
      set: jest.fn(),
      load: jest.fn().mockResolvedValue(true)
    };
    
    return defaultConfig;
  }

  /**
   * Create logger mock
   */
  static createLoggerMock() {
    return {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      success: jest.fn(),
      tree: jest.fn(),
      summary: jest.fn(),
      generateJSONReport: jest.fn()
    };
  }

  /**
   * Create orchestrator mock
   */
  static createOrchestratorMock(overrides = {}) {
    const defaultMock = {
      run: jest.fn().mockResolvedValue({
        status: 'passed',
        results: [],
        statistics: { passed: 1, failed: 0, total: 1 }
      }),
      initialize: jest.fn().mockResolvedValue(true)
    };
    
    return { ...defaultMock, ...overrides };
  }

  /**
   * Create environment checker mock
   */
  static createEnvironmentCheckerMock(overrides = {}) {
    const defaultMock = {
      checkEnvironment: jest.fn().mockResolvedValue({
        success: true,
        tools: ['npm', 'node'],
        missing: []
      }),
      isToolAvailable: jest.fn().mockResolvedValue(true)
    };
    
    return { ...defaultMock, ...overrides };
  }

  /**
   * Create context detector mock
   */
  static createContextDetectorMock(overrides = {}) {
    const defaultMock = {
      detectContext: jest.fn().mockResolvedValue({
        projectType: 'node',
        hasTypeScript: true,
        packageManager: 'yarn'
      }),
      getGitInfo: jest.fn().mockResolvedValue({
        branch: 'main',
        hasChanges: false
      })
    };
    
    return { ...defaultMock, ...overrides };
  }

  /**
   * Setup mock for require() calls
   */
  static mockRequire(modulePath, mockImplementation) {
    jest.doMock(modulePath, () => mockImplementation);
  }

  /**
   * Clear all mocks
   */
  static clearAllMocks() {
    jest.clearAllMocks();
  }

  /**
   * Restore all mocks
   */
  static restoreAllMocks() {
    jest.restoreAllMocks();
  }
}

module.exports = MockFactory;