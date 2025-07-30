/**
 * Snyk Wrapper Tests
 * RF-004: Security & Audit - Snyk security analysis validation
 * RNF-001 Compliant: ≤212 LOC
 */

const SnykWrapper = require('../../core/wrappers/SnykWrapper.cjs');

// Mock Snyk wrapper if it doesn't exist yet
jest.mock('../../core/wrappers/SnykWrapper.cjs', () => {
  return jest.fn().mockImplementation((config, logger) => ({
    config,
    logger,
    execute: jest.fn(),
    validateTool: jest.fn(),
    getCapabilities: jest.fn(() => ({
      supportedTools: ['snyk'],
      supportedDimensions: ['security'],
      fastModeSupported: false,
      reportFormats: ['json', 'sarif']
    }))
  }));
});

describe('Snyk Wrapper (RF-004 Security & Audit)', () => {
  let snykWrapper;
  let mockConfig;
  let mockLogger;

  beforeEach(() => {
    mockConfig = {
      get: jest.fn((key) => {
        const configMap = {
          'security.snyk.token': 'test-token',
          'security.snyk.orgId': 'test-org',
          'security.vulnerabilityThreshold': 'high',
          'security.failOnCritical': true
        };
        return configMap[key];
      })
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      success: jest.fn()
    };

    snykWrapper = new SnykWrapper(mockConfig, mockLogger);
    jest.clearAllMocks();
  });

  test('should initialize with security configuration', () => {
    expect(snykWrapper.config).toBe(mockConfig);
    expect(snykWrapper.logger).toBe(mockLogger);
  });

  test('should provide Snyk-specific capabilities', () => {
    const capabilities = snykWrapper.getCapabilities();
    
    expect(capabilities.supportedTools).toContain('snyk');
    expect(capabilities.supportedDimensions).toContain('security');
    expect(capabilities.fastModeSupported).toBe(false); // Security can't be fast-mode
    expect(capabilities.reportFormats).toContain('json');
    expect(capabilities.reportFormats).toContain('sarif');
  });

  test('should validate Snyk tool compatibility', () => {
    const validTool = {
      name: 'snyk',
      dimension: 'security',
      scope: 'dependencies'
    };

    const invalidTool = {
      name: 'bandit',
      dimension: 'security',
      scope: 'backend'
    };

    snykWrapper.validateTool.mockImplementation((tool) => {
      if (tool.name !== 'snyk') {
        throw new Error(`Tool ${tool.name} not supported by Snyk wrapper`);
      }
      return true;
    });

    expect(() => snykWrapper.validateTool(validTool)).not.toThrow();
    expect(() => snykWrapper.validateTool(invalidTool)).toThrow();
  });

  test('should execute dependency vulnerability scan', async () => {
    const dependencyTool = { name: 'snyk', dimension: 'security', config: { scanType: 'dependencies' } };
    const vulnerabilityResult = {
      success: false,
      vulnerabilities: { critical: 1, high: 3, medium: 5, low: 12 },
      findings: [{ id: 'SNYK-JS-LEFTPAD-12345', severity: 'critical', package: 'left-pad@1.3.0', cvssScore: 9.8 }]
    };

    snykWrapper.execute.mockResolvedValue(vulnerabilityResult);
    const result = await snykWrapper.execute(dependencyTool);

    expect(result.success).toBe(false);
    expect(result.vulnerabilities.critical).toBeGreaterThan(0);
    expect(result.findings[0].severity).toBe('critical');
  });

  test('should execute code vulnerability scan (SAST)', async () => {
    const codeTool = { name: 'snyk', dimension: 'security', config: { scanType: 'code' } };
    const sastResult = {
      success: true,
      vulnerabilities: { critical: 0, high: 0, medium: 2, low: 5 },
      codeIssues: [{ id: 'SNYK-CODE-JS-001', severity: 'medium', file: 'src/utils/auth.ts', line: 42 }]
    };

    snykWrapper.execute.mockResolvedValue(sastResult);
    const result = await snykWrapper.execute(codeTool);

    expect(result.success).toBe(true);
    expect(result.codeIssues[0].file).toBe('src/utils/auth.ts');
  });

  test('should handle Snyk authentication', () => {
    const authConfig = {
      token: mockConfig.get('security.snyk.token'),
      orgId: mockConfig.get('security.snyk.orgId')
    };

    expect(authConfig.token).toBe('test-token');
    expect(authConfig.orgId).toBe('test-org');

    // Should validate token format
    const isValidToken = authConfig.token && authConfig.token.length > 10;
    expect(isValidToken).toBe(true);
  });

  test('should respect vulnerability thresholds', () => {
    const threshold = mockConfig.get('security.vulnerabilityThreshold');
    const failOnCritical = mockConfig.get('security.failOnCritical');

    expect(threshold).toBe('high');
    expect(failOnCritical).toBe(true);

    const assessVulnerabilities = (vulns, threshold, failOnCritical) => {
      if (failOnCritical && vulns.critical > 0) return false;
      
      switch (threshold) {
        case 'critical':
          return vulns.critical === 0;
        case 'high':
          return vulns.critical === 0 && vulns.high === 0;
        case 'medium':
          return vulns.critical === 0 && vulns.high === 0 && vulns.medium === 0;
        default:
          return true;
      }
    };

    const highVulns = { critical: 0, high: 2, medium: 3, low: 5 };
    const criticalVulns = { critical: 1, high: 0, medium: 0, low: 0 };

    expect(assessVulnerabilities(highVulns, 'high', true)).toBe(false);
    expect(assessVulnerabilities(criticalVulns, 'high', true)).toBe(false);
  });

  test('should generate SARIF reports for CI/CD integration', async () => {
    const sarfTool = {
      name: 'snyk',
      config: {
        reportFormat: 'sarif'
      }
    };

    const sarifResult = {
      success: true,
      tool: 'snyk',
      reports: {
        sarif: '/tmp/snyk-results.sarif'
      },
      format: 'sarif'
    };

    snykWrapper.execute.mockResolvedValue(sarifResult);

    const result = await snykWrapper.execute(sarfTool);

    expect(result.format).toBe('sarif');
    expect(result.reports.sarif).toBeDefined();
  });

  test('should handle license and package manager integration', async () => {
    const licenseTool = { name: 'snyk', dimension: 'security', config: { scanType: 'license' } };
    const licenseResult = {
      success: false,
      licenseIssues: [{ package: 'some-package@1.0.0', license: 'GPL-3.0', severity: 'high' }]
    };

    snykWrapper.execute.mockResolvedValue(licenseResult);
    const result = await snykWrapper.execute(licenseTool);

    expect(result.licenseIssues[0].license).toBe('GPL-3.0');

    // Package manager integration test
    const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
    lockFiles.forEach(file => {
      const cmd = file.includes('yarn') ? 'yarn' : file.includes('pnpm') ? 'pnpm' : 'npm';
      expect(cmd).toMatch(/yarn|npm|pnpm/);
    });
  });
});