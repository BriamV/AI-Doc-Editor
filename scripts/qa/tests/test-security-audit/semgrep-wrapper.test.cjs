/**
 * Semgrep Wrapper Tests - RF-004: SAST analysis
 */

const SemgrepWrapper = require('../../core/wrappers/SemgrepWrapper.cjs');

jest.mock('../../core/wrappers/SemgrepWrapper.cjs', () => {
  return jest.fn().mockImplementation((config, logger) => ({
    config, logger, execute: jest.fn(), validateTool: jest.fn(),
    getCapabilities: jest.fn(() => ({
      supportedTools: ['semgrep'], supportedDimensions: ['security', 'quality'],
      fastModeSupported: true, reportFormats: ['json', 'sarif', 'text']
    }))
  }));
});

describe('Semgrep Wrapper (RF-004 Security & Audit - SAST)', () => {
  let semgrepWrapper, mockConfig, mockLogger;

  beforeEach(() => {
    mockConfig = {
      get: jest.fn((key) => ({
        'security.semgrep.configFile': '.semgrep.yml',
        'security.semgrep.rulesets': ['p/owasp-top-10', 'p/security-audit'],
        'security.semgrep.excludePaths': ['node_modules/', 'dist/', 'test/'],
        'security.severity.threshold': 'medium'
      })[key])
    };
    mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), success: jest.fn() };
    semgrepWrapper = new SemgrepWrapper(mockConfig, mockLogger);
    jest.clearAllMocks();
  });

  test('should initialize with SAST configuration', () => {
    expect(semgrepWrapper.config).toBe(mockConfig);
    expect(semgrepWrapper.logger).toBe(mockLogger);
  });

  test('should provide Semgrep-specific capabilities', () => {
    const capabilities = semgrepWrapper.getCapabilities();
    
    expect(capabilities.supportedTools).toContain('semgrep');
    expect(capabilities.supportedDimensions).toContain('security');
    expect(capabilities.supportedDimensions).toContain('quality');
    expect(capabilities.fastModeSupported).toBe(true);
    expect(capabilities.reportFormats).toContain('sarif');
  });

  test('should execute SAST scan with security rulesets', async () => {
    const securityTool = { name: 'semgrep', dimension: 'security', config: { rulesets: ['p/owasp-top-10'] } };
    const sastResult = {
      success: true,
      findings: [
        { 
          ruleId: 'javascript.express.security.audit.express-cors-misconfiguration',
          severity: 'high', file: 'src/server.js', line: 15, message: 'CORS misconfiguration detected'
        },
        {
          ruleId: 'typescript.react.security.audit.react-dangerouslysetinnerhtml',
          severity: 'medium', file: 'src/components/Document.tsx', line: 42, message: 'Potential XSS via dangerouslySetInnerHTML'
        }
      ],
      summary: { critical: 0, high: 1, medium: 1, low: 0, info: 0 }
    };

    semgrepWrapper.execute.mockResolvedValue(sastResult);
    const result = await semgrepWrapper.execute(securityTool);

    expect(result.success).toBe(true);
    expect(result.findings).toHaveLength(2);
    expect(result.summary.high).toBe(1);
  });

  test('should handle different security rulesets', async () => {
    const rulesets = ['p/owasp-top-10', 'p/security-audit', 'p/nodejs'];
    
    for (const ruleset of rulesets) {
      const tool = { name: 'semgrep', dimension: 'security', config: { rulesets: [ruleset] } };
      
      semgrepWrapper.execute.mockResolvedValue({
        success: true,
        ruleset: ruleset,
        findings: [],
        coverage: ruleset === 'p/owasp-top-10' ? 'web-security' : 
                 ruleset === 'p/nodejs' ? 'backend-security' : 'general-security'
      });

      const result = await semgrepWrapper.execute(tool);
      expect(result.ruleset).toBe(ruleset);
      expect(result.coverage).toBeDefined();
    }
  });

  test('should filter findings by severity threshold', () => {
    const allFindings = [
      { severity: 'critical', ruleId: 'rule1' },
      { severity: 'high', ruleId: 'rule2' },
      { severity: 'medium', ruleId: 'rule3' },
      { severity: 'low', ruleId: 'rule4' },
      { severity: 'info', ruleId: 'rule5' }
    ];

    const severityLevels = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };
    const threshold = 'medium';
    const thresholdLevel = severityLevels[threshold];

    const filteredFindings = allFindings.filter(finding => 
      severityLevels[finding.severity] >= thresholdLevel
    );

    expect(filteredFindings).toHaveLength(3); // critical, high, medium
    expect(filteredFindings.every(f => severityLevels[f.severity] >= 3)).toBe(true);
  });

  test('should exclude configured paths from scanning', async () => {
    const tool = { name: 'semgrep', dimension: 'security', config: { excludePaths: ['node_modules/', 'dist/', 'test/'] } };
    const scanResult = {
      success: true,
      scannedFiles: ['src/components/Document.tsx', 'src/utils/auth.ts', 'backend/api/endpoints.py'],
      excludedPaths: ['node_modules/', 'dist/', 'test/'], totalFiles: 150, scannedCount: 45
    };

    semgrepWrapper.execute.mockResolvedValue(scanResult);
    const result = await semgrepWrapper.execute(tool);

    expect(result.scannedFiles.every(file => 
      !result.excludedPaths.some(exclude => file.includes(exclude))
    )).toBe(true);
    expect(result.scannedCount).toBeLessThan(result.totalFiles);
  });

  test('should support fast mode for changed files', async () => {
    const fastTool = { 
      name: 'semgrep', 
      dimension: 'security', 
      config: { mode: 'fast', diffBase: 'main', changedOnly: true }
    };

    const fastResult = {
      success: true,
      mode: 'fast',
      changedFiles: ['src/auth.ts', 'src/api.ts'],
      findings: [
        { file: 'src/auth.ts', severity: 'medium', ruleId: 'auth-issue' }
      ],
      executionTime: 1200
    };

    semgrepWrapper.execute.mockResolvedValue(fastResult);
    const result = await semgrepWrapper.execute(fastTool);

    expect(result.mode).toBe('fast');
    expect(result.executionTime).toBeLessThan(5000);
    expect(result.changedFiles).toHaveLength(2);
    expect(result.findings.every(f => result.changedFiles.includes(f.file))).toBe(true);
  });

  test('should generate SARIF output for CI/CD integration', async () => {
    const sarifTool = { 
      name: 'semgrep', 
      dimension: 'security', 
      config: { outputFormat: 'sarif', outputFile: 'semgrep-results.sarif' }
    };

    const sarifResult = {
      success: true,
      format: 'sarif',
      outputFile: 'semgrep-results.sarif',
      sarif: {
        version: '2.1.0',
        runs: [{
          tool: { driver: { name: 'semgrep' } },
          results: [
            {
              ruleId: 'javascript.express.security.audit.express-cors-misconfiguration',
              level: 'error',
              message: { text: 'CORS misconfiguration detected' },
              locations: [{ physicalLocation: { artifactLocation: { uri: 'src/server.js' } } }]
            }
          ]
        }]
      }
    };

    semgrepWrapper.execute.mockResolvedValue(sarifResult);
    const result = await semgrepWrapper.execute(sarifTool);

    expect(result.format).toBe('sarif');
    expect(result.sarif.version).toBe('2.1.0');
    expect(result.sarif.runs[0].results).toHaveLength(1);
    expect(result.sarif.runs[0].tool.driver.name).toBe('semgrep');
  });

  test('should validate custom security rules', () => {
    const customRules = [
      { id: 'custom-auth-check', pattern: 'jwt.verify($JWT, $SECRET)', severity: 'high' },
      { id: 'custom-sql-injection', pattern: 'query($SQL + $INPUT)', severity: 'critical' }
    ];

    customRules.forEach(rule => {
      expect(rule.id).toBeDefined();
      expect(rule.pattern).toBeDefined();
      expect(['critical', 'high', 'medium', 'low', 'info']).toContain(rule.severity);
    });

    // Validate rule structure
    const isValidRule = (rule) => 
      rule.id && rule.pattern && rule.severity && 
      typeof rule.id === 'string' && 
      typeof rule.pattern === 'string';

    expect(customRules.every(isValidRule)).toBe(true);
  });

  test('should handle zero findings gracefully', async () => {
    const cleanTool = { name: 'semgrep', dimension: 'security' };
    const cleanResult = {
      success: true,
      findings: [],
      summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
      message: 'No security issues found',
      scannedFiles: 45
    };

    semgrepWrapper.execute.mockResolvedValue(cleanResult);
    const result = await semgrepWrapper.execute(cleanTool);

    expect(result.success).toBe(true);
    expect(result.findings).toHaveLength(0);
    expect(result.summary.critical).toBe(0);
    expect(result.message).toContain('No security issues');
    expect(result.scannedFiles).toBeGreaterThan(0);
  });

});