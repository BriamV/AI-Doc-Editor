/**
 * QA Config Tests
 * T-19: QAConfig & Dynamic Configuration tests
 */

const QAConfig = require('../config/QAConfig.cjs');
const fs = require('fs');
const path = require('path');

describe('QAConfig', () => {
  let tempConfigPath;
  
  beforeEach(() => {
    tempConfigPath = path.join(__dirname, 'temp-config.json');
  });
  
  afterEach(() => {
    if (fs.existsSync(tempConfigPath)) {
      fs.unlinkSync(tempConfigPath);
    }
  });
  
  test('should create config with default values', () => {
    const config = new QAConfig();
    
    expect(config.get('version')).toBe('0.1.0');
    expect(config.get('system.name')).toBe('QA System');
    expect(config.get('limits.maxLinesOfCode')).toBe(212);
    expect(config.get('limits.testCoverageThreshold')).toBe(80);
  });
  
  test('should load config from file', async () => {
    const testConfig = {
      version: '1.0.0',
      limits: {
        maxLinesOfCode: 300
      }
    };
    
    fs.writeFileSync(tempConfigPath, JSON.stringify(testConfig, null, 2));
    
    const config = await QAConfig.load(tempConfigPath);
    
    expect(config.get('version')).toBe('1.0.0');
    expect(config.get('limits.maxLinesOfCode')).toBe(300);
    // Should still have defaults for missing values
    expect(config.get('system.name')).toBe('QA System');
  });
  
  test('should handle missing config file gracefully', async () => {
    const config = await QAConfig.load('non-existent-file.json');
    
    // Should use defaults
    expect(config.get('version')).toBe('0.1.0');
    expect(config.get('system.name')).toBe('QA System');
  });
  
  test('should get and set values using dot notation', () => {
    const config = new QAConfig();
    
    config.set('custom.nested.value', 'test');
    expect(config.get('custom.nested.value')).toBe('test');
    
    config.set('limits.maxLinesOfCode', 500);
    expect(config.get('limits.maxLinesOfCode')).toBe(500);
  });
  
  test('should get tools for specific scope and dimension', () => {
    const config = new QAConfig();
    
    const frontendLintingTools = config.getToolsForScope('frontend', 'linting');
    expect(frontendLintingTools).toEqual(['eslint', 'prettier']);
    
    const backendTestingTools = config.getToolsForScope('backend', 'testing');
    expect(backendTestingTools).toEqual(['pytest']);
  });
  
  test('should get paths for specific scope', () => {
    const config = new QAConfig();
    
    const frontendPaths = config.getPathsForScope('frontend');
    expect(frontendPaths).toEqual(['src/**/*.{ts,tsx,js,jsx}']);
    
    const backendPaths = config.getPathsForScope('backend');
    expect(backendPaths).toEqual(['backend/**/*.py']);
  });
  
  test('should get mode configuration', () => {
    const config = new QAConfig();
    
    const fastMode = config.getModeConfig('fast');
    expect(fastMode.description).toBe('Pre-commit validation mode');
    expect(fastMode.timeLimit).toBe(10);
    expect(fastMode.onlyModified).toBe(true);
    expect(fastMode.skipTests).toBe(true);
  });
  
  test('should get DoD mapping', () => {
    const config = new QAConfig();
    
    const codeReviewMapping = config.getDoDMapping('code-review');
    expect(codeReviewMapping).toEqual(['format', 'lint', 'security']);
    
    const testingMapping = config.getDoDMapping('testing');
    expect(testingMapping).toEqual(['test', 'coverage']);
  });
  
  test('should validate configuration', () => {
    const config = new QAConfig();
    const validation = config.validate();
    
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });
  
  test('should detect invalid configuration', () => {
    const config = new QAConfig({
      limits: {
        maxLinesOfCode: 'invalid', // Should be number
        testCoverageThreshold: 150 // Should be <= 100
      }
    });
    
    const validation = config.validate();
    
    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });
  
  test('should save configuration to file', async () => {
    const config = new QAConfig();
    config.set('custom.test', 'value');
    
    const success = await config.save(tempConfigPath);
    
    expect(success).toBe(true);
    expect(fs.existsSync(tempConfigPath)).toBe(true);
    
    const savedContent = JSON.parse(fs.readFileSync(tempConfigPath, 'utf8'));
    expect(savedContent.custom.test).toBe('value');
  });
  
  test('should merge configurations', () => {
    const config1 = new QAConfig({
      limits: { maxLinesOfCode: 200 },
      custom: { value1: 'test1' }
    });
    
    const config2 = new QAConfig({
      limits: { testCoverageThreshold: 90 },
      custom: { value2: 'test2' }
    });
    
    config1.merge(config2);
    
    expect(config1.get('limits.maxLinesOfCode')).toBe(200); // Original value preserved
    expect(config1.get('limits.testCoverageThreshold')).toBe(90); // New value added
    expect(config1.get('custom.value1')).toBe('test1'); // Original nested value preserved
    expect(config1.get('custom.value2')).toBe('test2'); // New nested value added
  });
  
  test('should clone configuration', () => {
    const original = new QAConfig();
    original.set('custom.test', 'value');
    
    const clone = original.clone();
    clone.set('custom.test', 'modified');
    
    expect(original.get('custom.test')).toBe('value');
    expect(clone.get('custom.test')).toBe('modified');
  });
});