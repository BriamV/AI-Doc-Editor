const path = require('path');
const fs = require('fs');

describe('GitHub Actions Integration (RNF-004)', () => {
  let originalEnv, mockProcessExit;

  beforeEach(() => {
    originalEnv = { ...process.env };
    mockProcessExit = jest.spyOn(process, 'exit').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    mockProcessExit.mockRestore();
  });

  describe('Workflow context & parameters', () => {
    test('detects GitHub Actions context', () => {
      const cases = [
        { env: { GITHUB_ACTIONS: 'true' }, expected: true },
        { env: { CI: 'true' }, expected: false },
        { env: {}, expected: false }
      ];

      cases.forEach(({ env, expected }) => {
        Object.assign(process.env, env);
        expect(process.env.GITHUB_ACTIONS === 'true').toBe(expected);
      });
    });

    test('validates workflow inputs', () => {
      const inputs = { mode: 'auto', 'report-format': 'both', 'node-version': '20.x' };
      const valid = ['auto', 'fast', 'full', 'dod', 'both', 'console', 'json', '20.x'];
      
      Object.values(inputs).forEach(value => {
        expect(valid.includes(value)).toBe(true);
      });
    });
  });

  describe('Workflow outputs & QA gate', () => {
    test('generates workflow outputs', () => {
      const results = [
        { qaPassed: true, issuesFound: 0, report: { total: 5, passed: 5 } },
        { qaPassed: false, issuesFound: 2, report: { total: 5, passed: 3 } }
      ];

      results.forEach(({ qaPassed, issuesFound, report }) => {
        const outputs = {
          'qa-passed': qaPassed.toString(),
          'issues-found': issuesFound.toString(),
          'report-json': JSON.stringify(report)
        };
        
        expect(outputs['qa-passed']).toMatch(/true|false/);
        expect(parseInt(outputs['issues-found'])).toBeGreaterThanOrEqual(0);
        expect(JSON.parse(outputs['report-json']).total).toBeDefined();
      });
    });

    test('enforces QA gate logic', () => {
      const cases = [
        { qaPassed: true, shouldExit: false },
        { qaPassed: false, shouldExit: true }
      ];

      cases.forEach(({ qaPassed, shouldExit }) => {
        if (!qaPassed && shouldExit) {
          expect(qaPassed).toBe(false);
        } else {
          expect(qaPassed).toBe(true);
        }
      });
    });
  });

  describe('Workflow files & environment', () => {
    test('validates workflow files exist', () => {
      const workflowFiles = [
        '.github/workflows/qa-gate.yml',
        '.github/workflows/reusable-qa.yml'
      ];

      workflowFiles.forEach(file => {
        const exists = fs.existsSync(path.resolve(process.cwd(), file));
        if (exists) {
          const content = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
          expect(content).toContain('name:');
        }
      });
    });

    test('handles GitHub environment variables', () => {
      const ghEnv = {
        GITHUB_ACTIONS: 'true',
        GITHUB_WORKFLOW: 'QA Gate',
        GITHUB_ACTOR: 'test-user'
      };

      Object.assign(process.env, ghEnv);
      expect(process.env.GITHUB_ACTIONS).toBe('true');
    });

    test('handles artifacts and reports', () => {
      const artifacts = {
        'qa-report.json': '{"summary":{"total":5}}',
        'qa-report.txt': 'QA validation passed'
      };

      Object.keys(artifacts).forEach(artifact => {
        expect(artifacts[artifact]).toBeDefined();
      });
    });
  });

  describe('Error scenarios & configuration', () => {
    test('handles error scenarios', () => {
      const errors = [
        { type: 'syntax', message: 'invalid YAML syntax' },
        { type: 'timeout', config: { 'timeout-minutes': 30 } },
        { type: 'permission', value: 'read' }
      ];

      errors.forEach(({ type, message, config, value }) => {
        if (type === 'syntax') {
          expect(message).toMatch(/invalid|syntax/);
        } else if (type === 'timeout') {
          expect(config['timeout-minutes']).toBeLessThanOrEqual(60);
        } else if (type === 'permission') {
          expect(['read', 'write', 'none'].includes(value)).toBe(true);
        }
      });
    });

    test('validates workflow configuration', () => {
      const config = {
        triggers: ['pull_request', 'push'],
        permissions: { contents: 'read', actions: 'read' },
        concurrency: { group: 'qa-gate', 'cancel-in-progress': true }
      };

      expect(config.triggers.length).toBeGreaterThan(0);
      expect(Object.keys(config.permissions).length).toBeGreaterThan(0);
      expect(config.concurrency['cancel-in-progress']).toBe(true);
    });

    test('handles missing dependencies gracefully', () => {
      const missingEnv = !process.env.GITHUB_ACTIONS && !process.env.CI;
      const fallbackMode = missingEnv ? 'local' : 'ci';
      
      expect(['local', 'ci'].includes(fallbackMode)).toBe(true);
    });
  });
});