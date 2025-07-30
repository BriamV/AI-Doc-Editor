/**
 * MegaLinter Wrapper Tests
 * RF-003: Error Detection - MegaLinter orchestration validation
 * RNF-001 Compliant: ≤212 LOC
 */

const MegaLinterWrapper = require('../../core/wrappers/MegaLinterWrapper.cjs');
const QALogger = require('../../utils/QALogger.cjs');

// Mock logger for testing
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  success: jest.fn()
};

describe('MegaLinter Wrapper Orchestration (RF-003)', () => {
  let wrapper;
  let mockConfig;

  beforeEach(() => {
    mockConfig = {
      get: jest.fn((key) => {
        const configMap = {
          'megalinter.image': 'megalinter/megalinter:v6',
          'megalinter.reportFolder': 'megalinter-reports',
          'megalinter.defaultEnv': {
            'VALIDATE_ALL_CODEBASE': 'false',
            'LOG_LEVEL': 'INFO'
          }
        };
        return configMap[key];
      })
    };

    wrapper = new MegaLinterWrapper(mockConfig, mockLogger);
  });

  test('should initialize with correct configuration', () => {
    expect(wrapper).toBeDefined();
    expect(wrapper.config).toBe(mockConfig);
    expect(wrapper.logger).toBe(mockLogger);
  });

  test('should validate tool compatibility', () => {
    const validTool = {
      name: 'eslint',
      dimension: 'format',
      scope: 'frontend'
    };

    const invalidTool = {
      name: 'unsupported-tool',
      dimension: 'format',
      scope: 'frontend'  
    };

    expect(() => wrapper.validateTool(validTool)).not.toThrow();
    expect(() => wrapper.validateTool(invalidTool)).toThrow();
  });

  test('should provide correct capabilities', () => {
    const capabilities = wrapper.getCapabilities();
    
    expect(capabilities).toHaveProperty('supportedTools');
    expect(capabilities).toHaveProperty('supportedDimensions');
    expect(capabilities).toHaveProperty('fastModeSupported');
    expect(capabilities.fastModeSupported).toBe(true);
    
    expect(capabilities.supportedDimensions).toContain('format');
    expect(capabilities.supportedDimensions).toContain('lint');
  });

  test('should handle tool execution flow', async () => {
    const mockTool = {
      name: 'megalinter',
      dimension: 'format',
      scope: 'frontend',
      config: {
        mode: 'normal',
        args: []
      }
    };

    // Mock the executor and reporter
    wrapper.executor = {
      buildCommand: jest.fn().mockResolvedValue(['megalinter']),
      prepareWorkingDirectory: jest.fn().mockResolvedValue('/tmp'),
      execute: jest.fn().mockResolvedValue({
        exitCode: 0,
        stdout: 'MegaLinter completed successfully',
        stderr: ''
      })
    };

    wrapper.reporter = {
      processResults: jest.fn().mockResolvedValue({
        success: true,
        data: [],
        reports: [],
        metrics: {},
        warnings: [],
        errors: []
      })
    };

    const result = await wrapper.execute(mockTool);

    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('tool', 'megalinter');
    expect(result).toHaveProperty('dimension', 'format');
    expect(result).toHaveProperty('executionTime');
    expect(typeof result.executionTime).toBe('number');
    
    expect(wrapper.executor.buildCommand).toHaveBeenCalledWith(mockTool, expect.anything());
    expect(wrapper.executor.execute).toHaveBeenCalled();
    expect(wrapper.reporter.processResults).toHaveBeenCalled();
  });

  test('should handle execution errors gracefully', async () => {
    const mockTool = {
      name: 'megalinter',
      dimension: 'format',
      scope: 'frontend'
    };

    wrapper.executor = {
      buildCommand: jest.fn().mockRejectedValue(new Error('Command build failed')),
      prepareWorkingDirectory: jest.fn(),
      execute: jest.fn()
    };

    const result = await wrapper.execute(mockTool);

    expect(result).toHaveProperty('success', false);
    expect(result).toHaveProperty('error');
    expect(result.error).toContain('Command build failed');
    expect(mockLogger.error).toHaveBeenCalled();
  });

  test('should prepare environment variables correctly', async () => {
    const mockTool = {
      name: 'megalinter',
      dimension: 'format',
      scope: 'frontend',
      config: {
        mode: 'fast',
        args: ['--fix']
      }
    };

    // Mock megalinterConfig
    wrapper.megalinterConfig = {
      getBaseEnvVars: jest.fn().mockReturnValue({
        'VALIDATE_ALL_CODEBASE': 'false'
      }),
      getToolEnvVars: jest.fn().mockReturnValue({
        'ENABLE_LINTERS': 'JAVASCRIPT_ES,TYPESCRIPT_ES'
      }),
      getScopeFlavor: jest.fn().mockReturnValue('javascript'),
      getFastModeConfig: jest.fn().mockReturnValue({
        'VALIDATE_ONLY_CHANGED_FILES': 'true'
      }),
      getDimensionConfig: jest.fn().mockReturnValue({
        'DISABLE_LINTERS': 'SPELL_CSPELL'
      })
    };

    const envVars = await wrapper._prepareEnvironment(mockTool);

    expect(envVars).toHaveProperty('VALIDATE_ALL_CODEBASE', 'false');
    expect(envVars).toHaveProperty('ENABLE_LINTERS', 'JAVASCRIPT_ES,TYPESCRIPT_ES');
    expect(envVars).toHaveProperty('VALIDATE_ONLY_CHANGED_FILES', 'true');
    expect(envVars).toHaveProperty('DISABLE_LINTERS', 'SPELL_CSPELL');
  });

  test('should handle fast mode optimizations', async () => {
    const fastTool = {
      name: 'megalinter',
      dimension: 'format',
      config: { mode: 'fast' }
    };

    wrapper.megalinterConfig = {
      getBaseEnvVars: () => ({}),
      getToolEnvVars: () => ({}),
      getFastModeConfig: () => ({
        'VALIDATE_ONLY_CHANGED_FILES': 'true',
        'DISABLE_LINTERS': 'SPELL_CSPELL,COPYPASTE_JSCPD'
      }),
      getDimensionConfig: () => ({})
    };

    wrapper._getChangedFiles = jest.fn().mockResolvedValue(['src/file1.ts', 'src/file2.js']);

    const envVars = await wrapper._prepareEnvironment(fastTool);

    expect(envVars).toHaveProperty('VALIDATE_ONLY_CHANGED_FILES', 'true');
    expect(envVars).toHaveProperty('DISABLE_LINTERS', 'SPELL_CSPELL,COPYPASTE_JSCPD');
    expect(envVars).toHaveProperty('FILTER_REGEX_INCLUDE');
  });
});