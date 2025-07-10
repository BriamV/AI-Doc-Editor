/**
 * QA Logger Tests
 * T-05: Visual Logger & Reporter tests
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

describe('QALogger', () => {
  let tempReportPath;
  
  beforeEach(() => {
    tempReportPath = path.join(__dirname, 'temp-report.json');
  });
  
  afterEach(() => {
    if (fs.existsSync(tempReportPath)) {
      fs.unlinkSync(tempReportPath);
    }
  });
  
  test('should create logger with default options', () => {
    const logger = new QALogger();
    
    expect(logger.options.verbose).toBe(false);
    expect(logger.options.colors).toBe(true);
    expect(logger.options.timestamps).toBe(true);
    expect(logger.options.format).toBe('tree');
  });
  
  test('should create logger with custom options', () => {
    const logger = new QALogger({
      verbose: true,
      colors: false,
      jsonReport: true,
      jsonFile: 'custom-report.json'
    });
    
    expect(logger.options.verbose).toBe(true);
    expect(logger.options.colors).toBe(false);
    expect(logger.options.jsonReport).toBe(true);
    expect(logger.options.jsonFile).toBe('custom-report.json');
  });
  
  test('should log messages with different levels', () => {
    const logger = new QALogger({ colors: false, timestamps: false });
    
    logger.success('Success message');
    logger.warning('Warning message');
    logger.error('Error message');
    logger.info('Info message');
    
    expect(consoleOutput.length).toBe(4);
    expect(consoleOutput[0]).toContain('✅ Success message');
    expect(consoleOutput[1]).toContain('🟡 Warning message');
    expect(consoleOutput[2]).toContain('❌ Error message');
    expect(consoleOutput[3]).toContain('ℹ️ Info message');
  });
  
  test('should handle grouping correctly', () => {
    const logger = new QALogger({ colors: false, timestamps: false });
    
    logger.info('Top level');
    logger.group('Group 1');
    logger.info('Inside group');
    logger.groupEnd();
    logger.info('Back to top level');
    
    expect(consoleOutput[0]).toContain('ℹ️ Top level');
    expect(consoleOutput[1]).toContain('ℹ️ Group 1');
    expect(consoleOutput[2]).toContain('  ℹ️ Inside group'); // Indented
    expect(consoleOutput[3]).toContain('ℹ️ Back to top level');
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
  
  test('should colorize text when colors enabled', () => {
    const logger = new QALogger({ colors: true });
    
    const colorized = logger.colorize('test', 'red');
    expect(colorized).toContain('\x1b[31m'); // Red color code
    expect(colorized).toContain('test');
    expect(colorized).toContain('\x1b[0m'); // Reset code
  });
  
  test('should not colorize text when colors disabled', () => {
    const logger = new QALogger({ colors: false });
    
    const colorized = logger.colorize('test', 'red');
    expect(colorized).toBe('test');
  });
  
  test('should include verbose data when verbose mode enabled', () => {
    const logger = new QALogger({ 
      verbose: true, 
      colors: false, 
      timestamps: false 
    });
    
    const testData = { key: 'value', nested: { prop: 'test' } };
    logger.info('Test message', testData);
    
    // Should include the data in output
    expect(consoleOutput.length).toBe(2); // Message + data
    expect(consoleOutput[1]).toContain('"key": "value"');
    expect(consoleOutput[1]).toContain('"nested"');
  });
  
  test('should not include verbose data when verbose mode disabled', () => {
    const logger = new QALogger({ 
      verbose: false, 
      colors: false, 
      timestamps: false 
    });
    
    const testData = { key: 'value' };
    logger.info('Test message', testData);
    
    // Should only include the message
    expect(consoleOutput.length).toBe(1);
    expect(consoleOutput[0]).toContain('Test message');
    expect(consoleOutput[0]).not.toContain('"key"');
  });
  
  test('should display title with decorations', () => {
    const logger = new QALogger({ colors: false });
    
    logger.title('Test Title');
    
    expect(consoleOutput.some(line => line.includes('Test Title'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('═'))).toBe(true);
  });
});