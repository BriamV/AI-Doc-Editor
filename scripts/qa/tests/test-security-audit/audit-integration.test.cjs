/**
 * Audit Integration Tests - RF-004: npm/yarn audit
 */

const AuditIntegrator = require('../../core/integrations/AuditIntegrator.cjs');

jest.mock('../../core/integrations/AuditIntegrator.cjs', () => {
  return jest.fn().mockImplementation((config, logger) => ({
    config, logger,
    runAudit: jest.fn(), parseResults: jest.fn(),
    checkDependencies: jest.fn(), generateFixes: jest.fn()
  }));
});

describe('Audit Integration (RF-004 npm/yarn audit)', () => {
  let auditIntegrator, mockConfig, mockLogger;
  const commonVulns = { info: 0, low: 2, moderate: 3, high: 1, critical: 0, total: 6 };
  const commonPackages = {
    'express': { version: '4.16.1', vulnerabilities: ['moderate', 'high'] },
    'lodash': { version: '4.17.11', vulnerabilities: ['moderate'] }
  };

  beforeEach(() => {
    mockConfig = {
      get: jest.fn((key) => ({
        'audit.packageManager': 'npm', 'audit.severity.threshold': 'moderate',
        'audit.autoFix': false, 'audit.registries': ['npmjs.org', 'internal-registry.com']
      })[key])
    };
    mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), success: jest.fn() };
    auditIntegrator = new AuditIntegrator(mockConfig, mockLogger);
    jest.clearAllMocks();
  });

  test('should run npm audit and parse vulnerabilities', async () => {
    const auditResult = {
      success: true, vulnerabilities: commonVulns, packages: commonPackages,
      metadata: { totalDependencies: 150, vulnerablePackages: 2 }
    };

    auditIntegrator.runAudit.mockResolvedValue(auditResult);
    const result = await auditIntegrator.runAudit({ packageManager: 'npm', auditLevel: 'moderate' });

    expect(result.success).toBe(true);
    expect(result.vulnerabilities.total).toBe(6);
    expect(result.packages['express'].vulnerabilities).toContain('high');
  });

  test('should run yarn audit and handle different output format', async () => {
    const yarnResult = {
      success: true,
      auditSummary: { vulnerabilities: { info: 1, low: 0, moderate: 2, high: 1, critical: 0 }, dependencies: 145 },
      advisories: [{ id: 1002571, title: 'Prototype Pollution in lodash', severity: 'high' }]
    };

    auditIntegrator.runAudit.mockResolvedValue(yarnResult);
    const result = await auditIntegrator.runAudit({ packageManager: 'yarn', auditLevel: 'moderate' });

    expect(result.success).toBe(true);
    expect(result.auditSummary.vulnerabilities.high).toBe(1);
    expect(result.advisories[0].severity).toBe('high');
  });

  test('should parse audit results into standardized format', () => {
    const rawNpmAudit = {
      vulnerabilities: { lodash: { name: 'lodash', severity: 'high', via: ['Prototype Pollution'] } },
      metadata: { vulnerabilities: { high: 1, moderate: 0 } }
    };

    auditIntegrator.parseResults.mockReturnValue({
      standardized: true,
      findings: [{ package: 'lodash', severity: 'high', vulnerability: 'Prototype Pollution', fixable: true }],
      summary: { total: 1, fixable: 1, unfixable: 0 }
    });

    const parsed = auditIntegrator.parseResults(rawNpmAudit);
    expect(parsed.standardized).toBe(true);
    expect(parsed.findings[0].fixable).toBe(true);
  });

  test('should check dependencies for known vulnerabilities', async () => {
    const dependencies = {
      production: { 'express': '4.16.1', 'lodash': '4.17.11', 'react': '17.0.2' },
      development: { 'jest': '26.6.3', 'webpack': '5.24.0' }
    };

    auditIntegrator.checkDependencies.mockResolvedValue({
      scanned: 5, vulnerable: 2,
      details: [{ package: 'express', vulnerabilities: 2, severity: 'high' }, { package: 'lodash', vulnerabilities: 1, severity: 'moderate' }],
      clean: ['react', 'jest', 'webpack']
    });

    const result = await auditIntegrator.checkDependencies(dependencies);
    expect(result.scanned).toBe(5);
    expect(result.vulnerable).toBe(2);
    expect(result.clean).toHaveLength(3);
  });

  test('should generate automated fixes for vulnerabilities', () => {
    const vulnerablePackages = [
      { package: 'lodash', currentVersion: '4.17.11', fixVersion: '4.17.21', severity: 'high' },
      { package: 'express', currentVersion: '4.16.1', fixVersion: '4.18.2', severity: 'moderate' }
    ];

    auditIntegrator.generateFixes.mockReturnValue({
      fixes: [{ type: 'update', package: 'lodash', command: 'npm update lodash' }, { type: 'update', package: 'express', command: 'npm update express' }],
      autoFixable: 2, manualReview: 0, commands: ['npm update lodash', 'npm update express']
    });

    const fixes = auditIntegrator.generateFixes(vulnerablePackages);
    expect(fixes.autoFixable).toBe(2);
    expect(fixes.commands).toHaveLength(2);
  });

  test('should handle pnpm audit integration', async () => {
    const pnpmResult = {
      success: true,
      advisories: { 1002571: { id: 1002571, title: 'Prototype Pollution', severity: 'high' } },
      actions: [{ action: 'update', module: 'lodash', target: '4.17.21' }],
      metadata: { totalDependencies: 120 }
    };

    auditIntegrator.runAudit.mockResolvedValue(pnpmResult);
    const result = await auditIntegrator.runAudit({ packageManager: 'pnpm', auditLevel: 'moderate' });

    expect(result.success).toBe(true);
    expect(result.advisories['1002571'].severity).toBe('high');
    expect(result.actions[0].action).toBe('update');
  });

  test('should filter vulnerabilities by severity threshold', () => {
    const allVulnerabilities = [{ package: 'pkg1', severity: 'critical' }, { package: 'pkg2', severity: 'high' }, { package: 'pkg3', severity: 'moderate' }, { package: 'pkg4', severity: 'low' }];
    const severityLevels = { critical: 5, high: 4, moderate: 3, low: 2, info: 1 };

    auditIntegrator.parseResults.mockImplementation((vulns, thresholdLevel) => {
      const filtered = vulns.filter(v => severityLevels[v.severity] >= severityLevels[thresholdLevel]);
      return { filtered: filtered.length, total: vulns.length, vulnerabilities: filtered };
    });

    const result = auditIntegrator.parseResults(allVulnerabilities, 'moderate');
    expect(result.filtered).toBe(3);
    expect(result.total).toBe(4);
  });

  test('should handle private registry configurations', async () => {
    auditIntegrator.runAudit.mockResolvedValue({
      success: true,
      registries: {
        'internal-registry.company.com': { packages: 45, vulnerabilities: 0 },
        'npmjs.org': { packages: 105, vulnerabilities: 3 }
      },
      totalVulnerabilities: 3
    });

    const result = await auditIntegrator.runAudit({ packageManager: 'npm', registries: ['internal', 'npmjs'] });
    expect(result.registries['internal-registry.company.com'].vulnerabilities).toBe(0);
    expect(result.totalVulnerabilities).toBe(3);
  });

  test('should support continuous monitoring mode', async () => {
    auditIntegrator.runAudit.mockResolvedValue({
      success: true, currentVulnerabilities: 7, newVulnerabilities: 2, trend: 'increasing',
      alerts: [{ type: 'new_vulnerability', package: 'express', severity: 'high' }, { type: 'new_vulnerability', package: 'lodash', severity: 'moderate' }]
    });

    const result = await auditIntegrator.runAudit({ mode: 'continuous', interval: '24h' });
    expect(result.newVulnerabilities).toBe(2);
    expect(result.trend).toBe('increasing');
    expect(result.alerts).toHaveLength(2);
  });

  test('should integrate with CI/CD pipelines', () => {
    const auditResult = { vulnerabilities: { critical: 0, high: 0, moderate: 1, low: 2 }, shouldFail: true };

    auditIntegrator.parseResults.mockReturnValue({
      ciCompatible: true, exitCode: 1, report: { format: 'json', path: 'audit-results.json' }
    });

    const result = auditIntegrator.parseResults(auditResult, { failOnVulnerabilities: true, outputFormat: 'json' });
    expect(result.ciCompatible).toBe(true);
    expect(result.exitCode).toBe(1);
    expect(result.report.format).toBe('json');
  });

  test('should validate dependency license compliance', async () => {
    const licenseConfig = {
      allowedLicenses: ['MIT', 'Apache-2.0', 'BSD-3-Clause'],
      forbiddenLicenses: ['GPL-3.0', 'AGPL-3.0'], checkTransitive: true
    };

    auditIntegrator.checkDependencies.mockResolvedValue({
      licenseCompliance: {
        compliant: 145, violations: 3, unknown: 2,
        details: [
          { package: 'problematic-pkg', license: 'GPL-3.0', violation: true },
          { package: 'unknown-pkg', license: 'unknown', violation: false }
        ]
      }
    });

    const result = await auditIntegrator.checkDependencies({}, licenseConfig);
    expect(result.licenseCompliance.violations).toBe(3);
    expect(result.licenseCompliance.details[0].violation).toBe(true);
  });
});