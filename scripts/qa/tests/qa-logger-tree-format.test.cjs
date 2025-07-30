/**
 * QA Logger Tree Format Tests
 * T-05: Visual Logger & Reporter tree format tests (RF-006 compliance)
 * RNF-001 Compliant: ≤212 LOC
 */

const QALogger = require('../utils/QALogger.cjs');
const fs = require('fs');
const path = require('path');

// Mock console methods for testing
const originalConsole = { ...console };
let consoleOutput = [];

beforeEach(() => {
  consoleOutput = [];
  console.log = jest.fn((msg) => consoleOutput.push(msg));
  console.error = jest.fn((msg) => consoleOutput.push(msg));
});

afterEach(() => {
  Object.assign(console, originalConsole);
});

describe('QALogger Tree Format & Reports (RF-006)', () => {
  let tempReportPath;
  
  beforeEach(() => {
    tempReportPath = path.join(__dirname, 'temp-report.json');
  });
  
  afterEach(() => {
    if (fs.existsSync(tempReportPath)) {
      fs.unlinkSync(tempReportPath);
    }
  });
  
  test('should display tree structure for results', () => {
    const logger = new QALogger({ colors: false, timestamps: false });
    
    const results = [
      {
        dimension: 'linting',
        status: 'passed',
        message: 'All files passed linting',
        duration: 1500,
        items: [
          { status: 'passed', message: 'src/file1.ts' },
          { status: 'passed', message: 'src/file2.ts' }
        ]
      },
      {
        dimension: 'testing',
        status: 'warning',
        message: 'Some tests have warnings',
        duration: 3000,
        items: [
          { status: 'passed', message: 'test1.spec.ts' },
          { status: 'warning', message: 'test2.spec.ts - low coverage' }
        ]
      }
    ];
    
    logger.tree(results);
    
    // Should contain tree structure
    expect(consoleOutput.some(line => line.includes('📊 QA Validation Results'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('✅ linting: All files passed linting (1500ms)'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('🟡 testing: Some tests have warnings (3000ms)'))).toBe(true);
  });
  
  test('should show summary with statistics', () => {
    const logger = new QALogger({ colors: false, timestamps: false });
    
    const stats = {
      total: 10,
      passed: 7,
      warnings: 2,
      failed: 1
    };
    
    logger.summary(stats);
    
    // Should contain summary information
    expect(consoleOutput.some(line => line.includes('📈 Summary'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('Total checks: 10'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('Passed: 7'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('Warnings: 2'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('Failed: 1'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('🔴 QA validation FAILED'))).toBe(true);
  });
  
  test('should show success status when no failures', () => {
    const logger = new QALogger({ colors: false, timestamps: false });
    
    const stats = {
      total: 5,
      passed: 5,
      warnings: 0,
      failed: 0
    };
    
    logger.summary(stats);
    
    expect(consoleOutput.some(line => line.includes('🟢 QA validation PASSED'))).toBe(true);
  });
  
  test('should show warning status when warnings but no failures', () => {
    const logger = new QALogger({ colors: false, timestamps: false });
    
    const stats = {
      total: 5,
      passed: 3,
      warnings: 2,
      failed: 0
    };
    
    logger.summary(stats);
    
    expect(consoleOutput.some(line => line.includes('🟡 QA validation PASSED with warnings'))).toBe(true);
  });
  
  test('should generate JSON report when enabled', async () => {
    const logger = new QALogger({
      jsonReport: true,
      jsonFile: tempReportPath
    });
    
    logger.info('Test message');
    logger.success('Test success');
    
    const report = await logger.generateJSONReport({
      custom: 'data'
    });
    
    expect(report).toBeTruthy();
    expect(report.system.name).toBe('QA System');
    expect(report.custom).toBe('data');
    expect(report.results.length).toBe(2);
    
    // Check file was created
    expect(fs.existsSync(tempReportPath)).toBe(true);
    
    const savedReport = JSON.parse(fs.readFileSync(tempReportPath, 'utf8'));
    expect(savedReport.system.name).toBe('QA System');
  });
  
  test('should handle JSON report generation errors gracefully', async () => {
    const logger = new QALogger({
      jsonReport: true,
      jsonFile: '/invalid/path/report.json' // Invalid path
    });
    
    logger.info('Test message');
    
    const report = await logger.generateJSONReport();
    
    expect(report).toBeNull();
    expect(consoleOutput.some(line => line.includes('Failed to generate JSON report'))).toBe(true);
  });
  
  test('should not generate JSON report when disabled', async () => {
    const logger = new QALogger({
      jsonReport: false
    });
    
    logger.info('Test message');
    
    const report = await logger.generateJSONReport();
    
    expect(report).toBeNull();
  });
  
  test('should display PRD-compliant tree format and timing', () => {
    const logger = new QALogger({ colors: false, timestamps: false });
    
    const results = [
      { dimension: 'Error Detection', status: 'passed', duration: 2500 },
      { dimension: 'Security & Audit', status: 'failed', duration: 1200 }
    ];
    
    logger.tree(results);
    
    // Should follow PRD format patterns and show timings
    expect(consoleOutput.some(line => line.includes('└──') || line.includes('├──'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('✅'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('2500ms') || line.includes('2.5s'))).toBe(true);
  });
  
  test('should display exit code compatible status', () => {
    const logger = new QALogger({ colors: false, timestamps: false });
    
    const failedStats = { total: 5, passed: 3, warnings: 1, failed: 1 };
    logger.summary(failedStats);
    
    expect(consoleOutput.some(line => line.includes('FAILED'))).toBe(true);
  });
});