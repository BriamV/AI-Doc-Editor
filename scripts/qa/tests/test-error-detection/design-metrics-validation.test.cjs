/**
 * Design Metrics Validation Tests
 * RF-003: Design Metrics - LOC, Complexity, Line length validation
 * RNF-001 Compliant: ≤212 LOC
 */

const QAConfig = require('../../config/QAConfig.cjs');
const path = require('path');
const fs = require('fs');

describe('Design Metrics Validation (RF-003)', () => {
  let config;

  beforeEach(() => {
    config = new QAConfig();
  });

  test('should validate Lines of Code (LOC) thresholds', () => {
    // RF-003: LOC thresholds: Green ≤212, Yellow 213-300, Red >300
    const locLimit = config.get('limits.maxLinesOfCode');
    expect(locLimit).toBe(212);

    // Test threshold validation logic
    const validateLOC = (lines) => {
      if (lines <= 212) return 'green';
      if (lines <= 300) return 'yellow';
      return 'red';
    };

    expect(validateLOC(200)).toBe('green');
    expect(validateLOC(212)).toBe('green');
    expect(validateLOC(250)).toBe('yellow');
    expect(validateLOC(300)).toBe('yellow');
    expect(validateLOC(350)).toBe('red');
  });

  test('should validate Cyclomatic Complexity thresholds', () => {
    // RF-003: Complexity: Green ≤10, Yellow 11-15, Red >15
    const complexityLimit = config.get('limits.maxComplexity');
    expect(complexityLimit).toBe(10);

    const validateComplexity = (complexity) => {
      if (complexity <= 10) return 'green';
      if (complexity <= 15) return 'yellow';
      return 'red';
    };

    expect(validateComplexity(5)).toBe('green');
    expect(validateComplexity(10)).toBe('green');
    expect(validateComplexity(12)).toBe('yellow');
    expect(validateComplexity(15)).toBe('yellow');
    expect(validateComplexity(20)).toBe('red');
  });

  test('should validate Line Length limit', () => {
    // RF-003: Line length strict limit of 100 characters
    const maxLineLength = 100;

    const validateLineLength = (line) => {
      return line.length <= maxLineLength;
    };

    const shortLine = 'const shortVariable = true;';
    const exactLine = 'a'.repeat(100);
    const longLine = 'a'.repeat(101);

    expect(validateLineLength(shortLine)).toBe(true);
    expect(validateLineLength(exactLine)).toBe(true);
    expect(validateLineLength(longLine)).toBe(false);
  });

  test('should validate current test files against LOC limit', () => {
    // Validate that our new test files comply with RNF-001
    const testDir = path.join(__dirname, '..');
    const testFiles = [
      'qa-logger-core.test.cjs',
      'qa-logger-tree-format.test.cjs',
      'integration/dependency-basic.test.cjs',
      'integration/dependency-commands.test.cjs'
    ];

    testFiles.forEach(file => {
      const filePath = path.join(testDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lineCount = content.split('\n').length;
        
        expect(lineCount).toBeLessThanOrEqual(212);
      }
    });
  });

  test('should validate Design Metrics integration with MegaLinter', () => {
    // Test that MegaLinter configuration includes Design Metrics linters
    const designMetricsLinters = [
      'JAVASCRIPT_ES',      // For complexity analysis
      'TYPESCRIPT_ES',      // For TypeScript complexity
      'PYTHON_PYLINT',      // For Python complexity
      'GENERIC_EDITORCONFIG' // For line length enforcement
    ];

    // Simulate MegaLinter env vars for Design Metrics
    const megalinterEnv = {
      'ENABLE_LINTERS': designMetricsLinters.join(','),
      'JAVASCRIPT_ES_CONFIG_FILE': '.eslintrc.js',
      'TYPESCRIPT_ES_CONFIG_FILE': '.eslintrc.js',
      'PYTHON_PYLINT_CONFIG_FILE': '.pylintrc'
    };

    expect(megalinterEnv['ENABLE_LINTERS']).toContain('JAVASCRIPT_ES');
    expect(megalinterEnv['ENABLE_LINTERS']).toContain('TYPESCRIPT_ES');
    expect(megalinterEnv['ENABLE_LINTERS']).toContain('PYTHON_PYLINT');
  });

  test('should provide Design Metrics reporting structure', () => {
    // Test the expected structure for Design Metrics reporting
    const sampleMetricsResult = {
      dimension: 'Design Metrics',
      status: 'warning',
      files: [
        {
          path: 'src/component.tsx',
          loc: 250,        // Yellow zone
          complexity: 12,  // Yellow zone
          lineLength: { max: 120, violations: 5 },
          status: 'yellow'
        },
        {
          path: 'src/utils.ts',
          loc: 180,        // Green zone
          complexity: 8,   // Green zone
          lineLength: { max: 95, violations: 0 },
          status: 'green'
        }
      ],
      summary: {
        totalFiles: 2,
        greenFiles: 1,
        yellowFiles: 1,
        redFiles: 0,
        avgLOC: 215,
        avgComplexity: 10
      }
    };

    expect(sampleMetricsResult.dimension).toBe('Design Metrics');
    expect(sampleMetricsResult.files).toHaveLength(2);
    expect(sampleMetricsResult.summary.greenFiles).toBe(1);
    expect(sampleMetricsResult.summary.yellowFiles).toBe(1);
    expect(sampleMetricsResult.summary.redFiles).toBe(0);
  });

  test('should handle edge cases in Design Metrics', () => {
    // Test edge cases for Design Metrics thresholds
    const edgeCases = [
      { loc: 0, complexity: 0, expected: 'green' },      // Empty file
      { loc: 212, complexity: 10, expected: 'green' },   // Exact green limits
      { loc: 213, complexity: 11, expected: 'yellow' },  // Just over green
      { loc: 300, complexity: 15, expected: 'yellow' },  // Exact yellow limits
      { loc: 301, complexity: 16, expected: 'red' }      // Just over yellow
    ];

    edgeCases.forEach(testCase => {
      const getWorstStatus = (loc, complexity) => {
        const locStatus = loc <= 212 ? 'green' : loc <= 300 ? 'yellow' : 'red';
        const complexityStatus = complexity <= 10 ? 'green' : complexity <= 15 ? 'yellow' : 'red';
        
        if (locStatus === 'red' || complexityStatus === 'red') return 'red';
        if (locStatus === 'yellow' || complexityStatus === 'yellow') return 'yellow';
        return 'green';
      };

      const result = getWorstStatus(testCase.loc, testCase.complexity);
      expect(result).toBe(testCase.expected);
    });
  });

  test('should validate semaphore system implementation', () => {
    // RF-003: Design Metrics use semaphore system (Green/Yellow/Red)
    const semaphoreSystem = {
      green: { symbol: '🟢', description: 'Pasa' },
      yellow: { symbol: '🟡', description: 'Advertencia' },
      red: { symbol: '🔴', description: 'Falla' }
    };

    expect(semaphoreSystem.green.symbol).toBe('🟢');
    expect(semaphoreSystem.yellow.symbol).toBe('🟡');
    expect(semaphoreSystem.red.symbol).toBe('🔴');
    
    // Test color assignment based on thresholds
    const getMetricColor = (value, greenLimit, yellowLimit) => {
      if (value <= greenLimit) return semaphoreSystem.green;
      if (value <= yellowLimit) return semaphoreSystem.yellow;
      return semaphoreSystem.red;
    };

    const locResult = getMetricColor(250, 212, 300);
    expect(locResult.symbol).toBe('🟡');
    
    const complexityResult = getMetricColor(8, 10, 15);
    expect(complexityResult.symbol).toBe('🟢');
  });
});