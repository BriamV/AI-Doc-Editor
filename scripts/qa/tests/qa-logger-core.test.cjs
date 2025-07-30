/**
 * QA Logger Core Tests
 * T-05: Visual Logger & Reporter core functionality tests
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

describe('QALogger Core Functionality', () => {
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
  
  test('should handle nested grouping correctly', () => {
    const logger = new QALogger({ colors: false, timestamps: false });
    
    logger.info('Level 0');
    logger.group('Level 1');
    logger.info('Content 1');
    logger.group('Level 2');
    logger.info('Content 2');
    logger.groupEnd();
    logger.info('Back to 1');
    logger.groupEnd();
    logger.info('Back to 0');
    
    expect(consoleOutput[0]).toContain('ℹ️ Level 0');
    expect(consoleOutput[2]).toContain('  ℹ️ Content 1');
    expect(consoleOutput[4]).toContain('    ℹ️ Content 2');
    expect(consoleOutput[5]).toContain('  ℹ️ Back to 1');
    expect(consoleOutput[6]).toContain('ℹ️ Back to 0');
  });
  
  test('should handle timestamps correctly', () => {
    const loggerWithTimestamps = new QALogger({ colors: false, timestamps: true });
    const loggerWithoutTimestamps = new QALogger({ colors: false, timestamps: false });
    
    loggerWithTimestamps.info('With timestamp');
    loggerWithoutTimestamps.info('Without timestamp');
    
    // With timestamps should include time format
    expect(consoleOutput[0]).toMatch(/\[\d{2}:\d{2}:\d{2}\]/);
    // Without timestamps should not
    expect(consoleOutput[1]).not.toMatch(/\[\d{2}:\d{2}:\d{2}\]/);
  });
  
  test('should handle color configuration per message type', () => {
    const logger = new QALogger({ colors: true });
    
    // Test that different message types use different colors
    const successColor = logger.colorize('success', 'green');
    const errorColor = logger.colorize('error', 'red');
    const warningColor = logger.colorize('warning', 'yellow');
    
    expect(successColor).toContain('\x1b[32m'); // Green
    expect(errorColor).toContain('\x1b[31m'); // Red  
    expect(warningColor).toContain('\x1b[33m'); // Yellow
  });
});