/**
 * TestUtilities.cjs - Centralized Test Utilities
 * Conservative consolidation of common test patterns from multiple test files
 * No new functionality added - exact mapping only
 */

class TestUtilities {
  /**
   * Platform setup utilities (from cross-platform tests)
   */
  static setupPlatformMocks() {
    const originalPlatform = process.platform;
    const originalEnv = { ...process.env };
    
    return {
      originalPlatform,
      originalEnv,
      mockPlatform: (platform) => {
        Object.defineProperty(process, 'platform', { value: platform });
      },
      restore: () => {
        Object.defineProperty(process, 'platform', { value: originalPlatform });
        process.env = originalEnv;
      }
    };
  }

  /**
   * Mock service creation utilities (from service tests)
   */
  static createMockService(serviceName, methods = {}) {
    const mockService = {};
    
    // Default mock methods
    const defaultMethods = {
      initialize: jest.fn().mockResolvedValue(true),
      getManager: jest.fn().mockReturnValue('yarn'),
      getInfo: jest.fn().mockResolvedValue({ manager: 'yarn', version: '1.0.0' }),
      clearCache: jest.fn(),
      reset: jest.fn()
    };
    
    // Merge with provided methods
    Object.assign(mockService, defaultMethods, methods);
    
    return mockService;
  }

  /**
   * Common test data generators
   */
  static generateTestConfig(overrides = {}) {
    const defaultConfig = {
      tools: {
        build: { all: ['npm', 'tsc'] },
        lint: { all: ['eslint'] },
        format: { all: ['prettier'] }
      },
      toolConfigurations: {
        npm: { timeout: 60000 },
        eslint: { timeout: 30000 }
      }
    };
    
    return { ...defaultConfig, ...overrides };
  }

  /**
   * Mock logger creation
   */
  static createMockLogger() {
    return {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      success: jest.fn(),
      tree: jest.fn(),
      summary: jest.fn()
    };
  }

  /**
   * Common cleanup utilities
   */
  static setupCommonMocks() {
    return {
      beforeEach: () => {
        jest.clearAllMocks();
      },
      afterEach: () => {
        jest.restoreAllMocks();
      }
    };
  }

  /**
   * Validation utilities for test assertions
   */
  static validateResult(result, expectedKeys = []) {
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    
    expectedKeys.forEach(key => {
      expect(result).toHaveProperty(key);
    });
    
    return result;
  }

  /**
   * Common error testing utilities
   */
  static async expectAsyncError(asyncFn, expectedMessage = null) {
    await expect(asyncFn()).rejects.toThrow(expectedMessage);
  }

  /**
   * Path utilities for cross-platform tests
   */
  static getPlatformTestCases() {
    return [
      { platform: 'win32', expected: 'windows', separator: '\\' },
      { platform: 'darwin', expected: 'macos', separator: '/' },
      { platform: 'linux', expected: 'linux', separator: '/' }
    ];
  }
}

module.exports = TestUtilities;