const { WrapperManager } = require('../../core/execution/WrapperManager.cjs');

jest.mock('../../core/tools/ToolTypeClassifier.cjs');
jest.mock('../../core/wrappers/MegaLinterWrapper.cjs');
jest.mock('../../core/wrappers/JestWrapper.cjs');
jest.mock('../../core/wrappers/SnykWrapper.cjs');
jest.mock('../../core/wrappers/BuildWrapper.cjs');

describe('Wrapper Manager Integration (RNF-004)', () => {
  let wrapperManager, mockLogger, mockToolTypeClassifier;

  beforeEach(() => {
    mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
    mockToolTypeClassifier = { classifyTool: jest.fn(), getWrapperType: jest.fn() };
    require('../../core/tools/ToolTypeClassifier.cjs').mockImplementation(() => mockToolTypeClassifier);
    wrapperManager = new WrapperManager(mockLogger);
    jest.clearAllMocks();
  });

  describe('Wrapper lifecycle & mapping', () => {
    const testCases = [
      { tool: 'megalinter', dimension: 'error-detection', wrapperType: 'MegaLinterWrapper', initRequired: true },
      { tool: 'jest', dimension: 'testing-coverage', wrapperType: 'JestWrapper', initRequired: false },
      { tool: 'snyk', dimension: 'security-audit', wrapperType: 'SnykWrapper', initRequired: true },
      { tool: 'tsc', dimension: 'build-dependencies', wrapperType: 'BuildWrapper', initRequired: false }
    ];

    testCases.forEach(({ tool, dimension, wrapperType, initRequired }) => {
      test(`${tool} lifecycle`, async () => {
        mockToolTypeClassifier.classifyTool.mockReturnValue({ tool, dimension });
        mockToolTypeClassifier.getWrapperType.mockReturnValue(wrapperType);
        
        const MockWrapper = require(`../../core/wrappers/${wrapperType}.cjs`);
        MockWrapper.mockImplementation(() => ({
          initialize: jest.fn().mockResolvedValue(true),
          execute: jest.fn().mockResolvedValue({ success: true }),
          cleanup: jest.fn().mockResolvedValue(true)
        }));
        
        await wrapperManager.initializeWrappers([tool]);
        const wrapper = wrapperManager.getWrapper(tool);
        
        expect(wrapper).toBeDefined();
        expect(MockWrapper).toHaveBeenCalled();
        if (initRequired) expect(wrapper.initialize).toHaveBeenCalled();
      });
    });
  });

  describe('Tool mapping & deduplication', () => {
    const mappingCases = [
      { tools: ['megalinter'], expectedWrappers: ['MegaLinterWrapper'] },
      { tools: ['jest', 'jest-coverage'], expectedWrappers: ['JestWrapper'] },
      { tools: ['snyk', 'npm-audit'], expectedWrappers: ['SnykWrapper'] }
    ];

    mappingCases.forEach(({ tools, expectedWrappers }) => {
      test(`maps ${tools.join(',')} to ${expectedWrappers[0]}`, async () => {
        tools.forEach(tool => {
          mockToolTypeClassifier.classifyTool.mockReturnValueOnce({ tool, dimension: 'test' });
          mockToolTypeClassifier.getWrapperType.mockReturnValueOnce(expectedWrappers[0]);
        });
        
        const MockWrapper = require(`../../core/wrappers/${expectedWrappers[0]}.cjs`);
        MockWrapper.mockImplementation(() => ({
          initialize: jest.fn().mockResolvedValue(true),
          execute: jest.fn().mockResolvedValue({ success: true })
        }));
        
        await wrapperManager.initializeWrappers(tools);
        tools.forEach(tool => expect(wrapperManager.getWrapper(tool)).toBeDefined());
      });
    });

    test('deduplicates tools correctly', async () => {
      const cases = [
        { input: ['megalinter', 'megalinter', 'jest'], expected: 2 },
        { input: ['snyk', 'npm-audit', 'snyk'], expected: 2 }
      ];

      for (const { input, expected } of cases) {
        jest.clearAllMocks();
        mockToolTypeClassifier.classifyTool.mockReturnValue({ tool: 'test', dimension: 'test' });
        mockToolTypeClassifier.getWrapperType.mockReturnValue('MockWrapper');
        
        await wrapperManager.initializeWrappers(input);
        expect(mockToolTypeClassifier.classifyTool).toHaveBeenCalledTimes(expected);
      }
    });
  });

  describe('Cache & performance', () => {
    test('caches wrapper instances', async () => {
      mockToolTypeClassifier.classifyTool.mockReturnValue({ tool: 'megalinter', dimension: 'error-detection' });
      mockToolTypeClassifier.getWrapperType.mockReturnValue('MegaLinterWrapper');
      
      const MockWrapper = require('../../core/wrappers/MegaLinterWrapper.cjs');
      MockWrapper.mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(true),
        execute: jest.fn().mockResolvedValue({ success: true })
      }));
      
      await wrapperManager.initializeWrappers(['megalinter']);
      const wrapper1 = wrapperManager.getWrapper('megalinter');
      const wrapper2 = wrapperManager.getWrapper('megalinter');
      
      expect(wrapper1).toBe(wrapper2);
      expect(MockWrapper).toHaveBeenCalledTimes(1);
    });

    test('clears cache correctly', async () => {
      mockToolTypeClassifier.classifyTool.mockReturnValue({ tool: 'jest', dimension: 'testing' });
      mockToolTypeClassifier.getWrapperType.mockReturnValue('JestWrapper');
      
      const MockWrapper = require('../../core/wrappers/JestWrapper.cjs');
      MockWrapper.mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(true),
        cleanup: jest.fn().mockResolvedValue(true)
      }));
      
      await wrapperManager.initializeWrappers(['jest']);
      expect(wrapperManager.getWrapper('jest')).toBeDefined();
      
      wrapperManager.clearCache();
      expect(wrapperManager.getWrapper('jest')).toBeNull();
    });
  });

  describe('Error handling', () => {
    test('handles initialization failures', async () => {
      mockToolTypeClassifier.classifyTool.mockReturnValue({ tool: 'megalinter', dimension: 'test' });
      mockToolTypeClassifier.getWrapperType.mockReturnValue('MegaLinterWrapper');
      
      const MockWrapper = require('../../core/wrappers/MegaLinterWrapper.cjs');
      MockWrapper.mockImplementation(() => ({
        initialize: jest.fn().mockRejectedValue(new Error('Init failed'))
      }));
      
      await expect(wrapperManager.initializeWrappers(['megalinter'])).rejects.toThrow();
    });

    test('handles wrapper not found', () => {
      expect(wrapperManager.getWrapper('nonexistent')).toBeNull();
    });

    test('handles classification failures', async () => {
      mockToolTypeClassifier.classifyTool.mockImplementation(() => {
        throw new Error('Classification failed');
      });
      
      await expect(wrapperManager.initializeWrappers(['unknown'])).rejects.toThrow();
    });
  });

  describe('Wrapper type classification integration', () => {
    test('should integrate with ToolTypeClassifier correctly', async () => {
      const tools = ['megalinter', 'jest', 'snyk'];
      const classifications = [
        { tool: 'megalinter', dimension: 'error-detection', wrapperType: 'MegaLinterWrapper' },
        { tool: 'jest', dimension: 'testing-coverage', wrapperType: 'JestWrapper' },
        { tool: 'snyk', dimension: 'security-audit', wrapperType: 'SnykWrapper' }
      ];
      
      classifications.forEach(({ tool, dimension, wrapperType }) => {
        mockToolTypeClassifier.classifyTool.mockReturnValueOnce({ tool, dimension });
        mockToolTypeClassifier.getWrapperType.mockReturnValueOnce(wrapperType);
        
        const MockWrapper = require(`../../core/wrappers/${wrapperType}.cjs`);
        MockWrapper.mockImplementation(() => ({
          initialize: jest.fn().mockResolvedValue(true),
          execute: jest.fn().mockResolvedValue({ success: true })
        }));
      });
      
      await wrapperManager.initializeWrappers(tools);
      
      tools.forEach(tool => {
        const wrapper = wrapperManager.getWrapper(tool);
        expect(wrapper).toBeDefined();
      });
      
      expect(mockToolTypeClassifier.classifyTool).toHaveBeenCalledTimes(3);
      expect(mockToolTypeClassifier.getWrapperType).toHaveBeenCalledTimes(3);
    });
  });

  describe('Lazy loading and on-demand instantiation', () => {
    test('should support lazy wrapper loading', async () => {
      mockToolTypeClassifier.classifyTool.mockReturnValue({ tool: 'megalinter', dimension: 'error-detection' });
      mockToolTypeClassifier.getWrapperType.mockReturnValue('MegaLinterWrapper');
      
      const MockWrapper = require('../../core/wrappers/MegaLinterWrapper.cjs');
      MockWrapper.mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(true)
      }));
      
      // Wrapper should not be instantiated until requested
      expect(MockWrapper).not.toHaveBeenCalled();
      
      await wrapperManager.initializeWrappers(['megalinter']);
      
      // Now wrapper should be instantiated
      expect(MockWrapper).toHaveBeenCalledTimes(1);
      
      const wrapper = wrapperManager.getWrapper('megalinter');
      expect(wrapper).toBeDefined();
    });
  });
});