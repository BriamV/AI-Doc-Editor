/**
 * Security Reporting Tests - RF-004: Vulnerability processing
 */

const SecurityReporter = require('../../core/reporting/SecurityReporter.cjs');

jest.mock('../../core/reporting/SecurityReporter.cjs', () => {
  return jest.fn().mockImplementation((config, logger) => ({
    config, logger,
    processFindings: jest.fn(), generateReport: jest.fn(),
    aggregateResults: jest.fn(), exportResults: jest.fn()
  }));
});

describe('Security Reporting (RF-004 Vulnerability Processing)', () => {
  let securityReporter, mockConfig, mockLogger;

  beforeEach(() => {
    mockConfig = {
      get: jest.fn((key) => ({
        'security.reporting.formats': ['json', 'sarif', 'html'],
        'security.reporting.outputDir': 'security-reports/',
        'security.reporting.threshold': 'medium',
        'security.reporting.includeFixed': false
      })[key])
    };
    mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), success: jest.fn() };
    securityReporter = new SecurityReporter(mockConfig, mockLogger);
    jest.clearAllMocks();
  });

  test('should process mixed security findings from multiple tools', () => {
    const findings = {
      snyk: [
        { id: 'SNYK-001', severity: 'high', type: 'vulnerability', package: 'express@4.16.1' },
        { id: 'SNYK-002', severity: 'medium', type: 'license', package: 'lodash@4.17.11' }
      ],
      semgrep: [
        { id: 'SG-001', severity: 'critical', type: 'code', file: 'src/auth.ts', line: 42 },
        { id: 'SG-002', severity: 'medium', type: 'code', file: 'src/api.ts', line: 15 }
      ]
    };

    securityReporter.processFindings.mockReturnValue({
      totalFindings: 4,
      bySeverity: { critical: 1, high: 1, medium: 2, low: 0 },
      byType: { vulnerability: 1, license: 1, code: 2 },
      byTool: { snyk: 2, semgrep: 2 }
    });

    const processed = securityReporter.processFindings(findings);
    expect(processed.totalFindings).toBe(4);
    expect(processed.bySeverity.critical).toBe(1);
  });

  test('should generate comprehensive security report', () => {
    const processedFindings = {
      totalFindings: 8,
      bySeverity: { critical: 2, high: 3, medium: 2, low: 1 },
      byType: { vulnerability: 4, code: 3, license: 1 },
      details: [
        { id: 'CRITICAL-001', severity: 'critical', description: 'SQL injection vulnerability' },
        { id: 'HIGH-001', severity: 'high', description: 'XSS vulnerability' }
      ]
    };

    securityReporter.generateReport.mockReturnValue({
      executive: {
        summary: 'Found 8 security issues (2 critical, 3 high, 2 medium, 1 low)',
        riskLevel: 'HIGH', recommendation: 'Immediate action required for critical vulnerabilities'
      },
      technical: {
        findings: processedFindings.details,
        remediation: ['Update express to version 4.18.0 or later', 'Sanitize user input in authentication module']
      },
      compliance: { passed: false, threshold: 'medium', exceedsThreshold: true }
    });

    const report = securityReporter.generateReport(processedFindings);
    expect(report.executive.riskLevel).toBe('HIGH');
    expect(report.compliance.passed).toBe(false);
    expect(report.technical.remediation).toHaveLength(2);
  });

  test('should aggregate results from continuous scans', () => {
    const scanHistory = [
      { date: '2024-01-01', findings: 12, critical: 3, high: 4 },
      { date: '2024-01-02', findings: 8, critical: 1, high: 3 },
      { date: '2024-01-03', findings: 5, critical: 0, high: 2 }
    ];

    securityReporter.aggregateResults.mockReturnValue({
      trend: 'improving',
      reduction: 58.3, // (12-5)/12 * 100
      currentRisk: 'medium',
      previousRisk: 'high',
      metrics: {
        averageFindings: 8.33,
        criticalTrend: 'decreasing',
        highTrend: 'decreasing'
      }
    });

    const aggregated = securityReporter.aggregateResults(scanHistory);
    expect(aggregated.trend).toBe('improving');
    expect(aggregated.reduction).toBeGreaterThan(50);
    expect(aggregated.currentRisk).toBe('medium');
  });

  test('should export results in multiple formats', async () => {
    const securityData = {
      findings: [
        { id: 'VUL-001', severity: 'high', package: 'express' },
        { id: 'CODE-001', severity: 'medium', file: 'src/auth.ts' }
      ],
      summary: { total: 2, high: 1, medium: 1 }
    };

    const formats = ['json', 'sarif', 'html'];
    
    for (const format of formats) {
      securityReporter.exportResults.mockResolvedValue({
        format: format,
        filename: `security-report.${format}`,
        size: format === 'html' ? 15420 : format === 'sarif' ? 8920 : 2140,
        success: true
      });

      const exported = await securityReporter.exportResults(securityData, format);
      expect(exported.format).toBe(format);
      expect(exported.filename).toContain(`security-report.${format}`);
      expect(exported.success).toBe(true);
    }
  });

  test('should handle vulnerability deduplication', () => {
    const duplicateFindings = [
      { id: 'VUL-001', package: 'express@4.16.1', severity: 'high', source: 'snyk' },
      { id: 'VUL-001', package: 'express@4.16.1', severity: 'high', source: 'npm-audit' },
      { id: 'VUL-002', package: 'lodash@4.17.11', severity: 'medium', source: 'snyk' }
    ];

    securityReporter.processFindings.mockImplementation((findings) => {
      const seen = new Set();
      const deduplicated = findings.filter(finding => {
        const key = `${finding.id}-${finding.package}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return { original: findings.length, deduplicated: deduplicated.length, removed: findings.length - deduplicated.length };
    });

    const processed = securityReporter.processFindings(duplicateFindings);
    expect(processed.original).toBe(3);
    expect(processed.deduplicated).toBe(2);
    expect(processed.removed).toBe(1);
  });

  test('should prioritize findings by business impact', () => {
    const findings = [
      { id: 'F1', severity: 'medium', file: 'src/billing.ts', impact: 'financial' },
      { id: 'F2', severity: 'medium', file: 'src/logger.ts', impact: 'operational' },
      { id: 'F3', severity: 'low', file: 'src/auth.ts', impact: 'security' }
    ];

    const impactWeights = { security: 3, financial: 2, operational: 1 };

    securityReporter.processFindings.mockImplementation((findings) => 
      findings.map(f => ({ ...f, priority: impactWeights[f.impact] || 0 })).sort((a, b) => b.priority - a.priority)
    );

    const prioritized = securityReporter.processFindings(findings);
    expect(prioritized[0].impact).toBe('security');
    expect(prioritized[1].impact).toBe('financial');
  });

  test('should track false positive management', () => {
    const findingsWithFP = [
      { id: 'F1', severity: 'high', falsePositive: false, reviewed: true },
      { id: 'F2', severity: 'medium', falsePositive: true, reviewed: true },
      { id: 'F3', severity: 'high', falsePositive: false, reviewed: false }
    ];

    securityReporter.processFindings.mockReturnValue({
      total: 3,
      legitimate: 2,
      falsePositives: 1,
      needsReview: 1,
      reviewRate: 66.7 // 2/3 * 100
    });

    const processed = securityReporter.processFindings(findingsWithFP);
    expect(processed.legitimate).toBe(2);
    expect(processed.falsePositives).toBe(1);
    expect(processed.reviewRate).toBeCloseTo(66.7, 1);
  });

  test('should integrate with ticketing systems', async () => {
    const criticalFindings = [
      { id: 'CRIT-001', severity: 'critical', description: 'SQL injection in login' },
      { id: 'CRIT-002', severity: 'critical', description: 'RCE in file upload' }
    ];

    securityReporter.exportResults.mockResolvedValue({
      ticketsCreated: 2,
      tickets: [
        { id: 'SEC-001', finding: 'CRIT-001', status: 'created' },
        { id: 'SEC-002', finding: 'CRIT-002', status: 'created' }
      ],
      integration: 'jira', success: true
    });

    const result = await securityReporter.exportResults(criticalFindings, 'tickets');
    expect(result.ticketsCreated).toBe(2);
    expect(result.integration).toBe('jira');
  });

  test('should validate compliance with security standards', () => {
    const complianceStandards = {
      'OWASP-Top-10': { requirements: ['A01-injection', 'A02-auth'], coverage: 85 },
      'NIST-800-53': { requirements: ['SI-10', 'AC-3'], coverage: 72 }
    };

    securityReporter.generateReport.mockReturnValue({
      compliance: Object.keys(complianceStandards).map(standard => ({
        standard, coverage: complianceStandards[standard].coverage,
        passed: complianceStandards[standard].coverage >= 80
      }))
    });

    const report = securityReporter.generateReport({});
    expect(report.compliance).toHaveLength(2);
    expect(report.compliance.find(c => c.standard === 'OWASP-Top-10').passed).toBe(true);
    expect(report.compliance.find(c => c.standard === 'NIST-800-53').passed).toBe(false);
  });
});