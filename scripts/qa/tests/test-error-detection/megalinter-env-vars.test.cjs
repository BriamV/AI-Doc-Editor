/**
 * MegaLinter Environment Variables Tests
 * RF-003: Error Detection - Environment configuration validation
 * RNF-001 Compliant: ≤212 LOC
 */

const MegaLinterConfig = require('../../core/wrappers/megalinter/MegaLinterConfig.cjs');

describe('MegaLinter Environment Configuration (RF-003)', () => {
  let megalinterConfig;
  let mockConfig;

  beforeEach(() => {
    mockConfig = {
      get: jest.fn((key) => {
        const configMap = {
          'megalinter.image': 'megalinter/megalinter:v6',
          'megalinter.reportFolder': 'megalinter-reports',
          'megalinter.flavors.javascript': 'megalinter/megalinter-javascript:v6',
          'megalinter.flavors.python': 'megalinter/megalinter-python:v6'
        };
        return configMap[key];
      })
    };

    megalinterConfig = new MegaLinterConfig(mockConfig);
  });

  test('should provide base environment variables', () => {
    const baseEnv = megalinterConfig.getBaseEnvVars();
    
    expect(baseEnv).toHaveProperty('VALIDATE_ALL_CODEBASE');
    expect(baseEnv).toHaveProperty('LOG_LEVEL');
    expect(baseEnv).toHaveProperty('REPORT_OUTPUT_FOLDER');
    
    // Should have reasonable defaults
    expect(baseEnv.LOG_LEVEL).toMatch(/INFO|WARNING|ERROR/);
  });

  test('should configure tool-specific environment variables', () => {
    const eslintTool = { name: 'eslint', dimension: 'format' };
    const pylintTool = { name: 'pylint', dimension: 'lint' };

    const eslintEnv = megalinterConfig.getToolEnvVars(eslintTool);
    const pylintEnv = megalinterConfig.getToolEnvVars(pylintTool);

    // Should enable appropriate linters for each tool
    expect(eslintEnv).toHaveProperty('ENABLE_LINTERS');
    expect(eslintEnv.ENABLE_LINTERS).toContain('JAVASCRIPT');
    
    expect(pylintEnv).toHaveProperty('ENABLE_LINTERS');
    expect(pylintEnv.ENABLE_LINTERS).toContain('PYTHON');
  });

  test('should provide fast mode configuration (RF-005)', () => {
    const fastModeEnv = megalinterConfig.getFastModeConfig();
    
    // RF-005: Fast mode optimizations
    expect(fastModeEnv).toHaveProperty('VALIDATE_ONLY_CHANGED_FILES', 'true');
    expect(fastModeEnv).toHaveProperty('DISABLE_LINTERS');
    expect(fastModeEnv.DISABLE_LINTERS).toContain('SPELL_CSPELL');
    expect(fastModeEnv.DISABLE_LINTERS).toContain('COPYPASTE_JSCPD');
    expect(fastModeEnv).toHaveProperty('LOG_LEVEL', 'WARNING');
  });

  test('should configure scope-specific flavors', () => {
    const frontendFlavor = megalinterConfig.getScopeFlavor('frontend');
    const backendFlavor = megalinterConfig.getScopeFlavor('backend');
    
    expect(frontendFlavor).toMatch(/javascript|js/i);
    expect(backendFlavor).toMatch(/python|py/i);
  });

  test('should provide dimension-specific configuration', () => {
    const formatConfig = megalinterConfig.getDimensionConfig('format');
    const lintConfig = megalinterConfig.getDimensionConfig('lint');
    const securityConfig = megalinterConfig.getDimensionConfig('security');

    // Format dimension should include formatters
    expect(formatConfig).toHaveProperty('ENABLE_LINTERS');
    expect(formatConfig.ENABLE_LINTERS).toMatch(/PRETTIER|BLACK|GOFMT/);

    // Lint dimension should include linters
    expect(lintConfig.ENABLE_LINTERS).toMatch(/ESLINT|PYLINT|GOLANGCI/);

    // Security dimension should include security tools
    expect(securityConfig.ENABLE_LINTERS).toMatch(/BANDIT|SEMGREP/);
  });

  test('should handle tool mappings correctly (RF-004)', () => {
    const toolMappings = megalinterConfig.toolMappings;
    
    // RF-004: MegaLinter should handle multiple tools
    expect(toolMappings).toHaveProperty('eslint');
    expect(toolMappings).toHaveProperty('prettier');
    expect(toolMappings).toHaveProperty('pylint');
    expect(toolMappings).toHaveProperty('black');
    
    // Each mapping should specify the MegaLinter equivalent
    expect(toolMappings.eslint).toMatch(/JAVASCRIPT_ES|TYPESCRIPT_ES/);
    expect(toolMappings.prettier).toMatch(/JAVASCRIPT_PRETTIER|TYPESCRIPT_PRETTIER/);
    expect(toolMappings.pylint).toBe('PYTHON_PYLINT');
    expect(toolMappings.black).toBe('PYTHON_BLACK');
  });

  test('should configure parallel execution settings', () => {
    const parallelConfig = megalinterConfig.getParallelConfig();
    
    expect(parallelConfig).toHaveProperty('PARALLEL');
    expect(parallelConfig).toHaveProperty('PARALLEL_PROCESS_COUNT');
    
    // Should enable parallel processing for performance
    expect(parallelConfig.PARALLEL).toBe('true');
    expect(parseInt(parallelConfig.PARALLEL_PROCESS_COUNT)).toBeGreaterThan(0);
  });

  test('should provide report configuration', () => {
    const reportConfig = megalinterConfig.getReportConfig();
    
    expect(reportConfig).toHaveProperty('REPORT_OUTPUT_FOLDER');
    expect(reportConfig).toHaveProperty('SARIF_REPORTER');
    expect(reportConfig).toHaveProperty('JSON_REPORTER');
    
    // Should enable multiple report formats for CI/CD
    expect(reportConfig.SARIF_REPORTER).toBe('true');
    expect(reportConfig.JSON_REPORTER).toBe('true');
  });

  test('should handle custom configuration overrides', () => {
    const customTool = {
      name: 'eslint',
      config: {
        customEnv: {
          'CUSTOM_ESLINT_CONFIG': '.eslintrc.custom.js',
          'ESLINT_DISABLE_ERRORS': 'true'
        }
      }
    };

    const toolEnv = megalinterConfig.getToolEnvVars(customTool);
    const customEnv = customTool.config.customEnv;

    // Should apply custom overrides
    expect(toolEnv).toEqual(expect.objectContaining(customEnv));
  });

  test('should validate environment variable format', () => {
    const baseEnv = megalinterConfig.getBaseEnvVars();
    
    // All environment variables should be strings
    Object.values(baseEnv).forEach(value => {
      expect(typeof value).toBe('string');
    });

    // Boolean values should be 'true'/'false' strings
    if (baseEnv.VALIDATE_ALL_CODEBASE) {
      expect(['true', 'false']).toContain(baseEnv.VALIDATE_ALL_CODEBASE);
    }
  });

  test('should handle Docker volume mounts configuration', () => {
    const volumeConfig = megalinterConfig.getVolumeConfig();
    
    expect(volumeConfig).toHaveProperty('workspaceMount');
    expect(volumeConfig).toHaveProperty('reportsMount');
    
    // Should provide proper mount paths for Docker
    expect(volumeConfig.workspaceMount).toMatch(/\/tmp\/lint$/);
    expect(volumeConfig.reportsMount).toMatch(/megalinter-reports/);
  });

  test('should configure timeout settings', () => {
    const timeoutConfig = megalinterConfig.getTimeoutConfig();
    
    expect(timeoutConfig).toHaveProperty('DEFAULT_TIMEOUT');
    expect(timeoutConfig).toHaveProperty('FAST_MODE_TIMEOUT');
    
    // Fast mode should have shorter timeout
    expect(parseInt(timeoutConfig.FAST_MODE_TIMEOUT))
      .toBeLessThan(parseInt(timeoutConfig.DEFAULT_TIMEOUT));
  });

  test('should provide workspace configuration', () => {
    const workspaceConfig = megalinterConfig.getWorkspaceConfig();
    
    expect(workspaceConfig).toHaveProperty('DEFAULT_WORKSPACE');
    expect(workspaceConfig).toHaveProperty('MEGALINTER_CONFIG');
    
    // Should point to standard config locations
    expect(workspaceConfig.MEGALINTER_CONFIG).toMatch(/\.megalinter\.yml|\.mega-linter\.yml/);
  });
});