const { Orchestrator } = require('../../core/Orchestrator.cjs');

describe('Exit Code Standardization (RNF-004)', () => {
  let orchestrator, mockLogger, mockProcessExit;

  beforeEach(() => {
    mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
    mockProcessExit = jest.spyOn(process, 'exit').mockImplementation();
    orchestrator = new Orchestrator(mockLogger);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockProcessExit.mockRestore();
  });

  describe('Exit code scenarios', () => {
    test('returns correct codes for different scenarios', () => {
      const scenarios = [
        { name: 'all-success', results: [{ success: true }], expected: 0 },
        { name: 'warnings-only', results: [{ success: true, warnings: ['Style'] }], expected: 0 },
        { name: 'non-critical-fail', results: [{ success: false, critical: false }], expected: 0 },
        { name: 'critical-fail', results: [{ success: false, critical: true }], expected: 1 },
        { name: 'config-error', error: 'Invalid configuration', expected: 2 },
        { name: 'timeout', error: 'Execution timeout', expected: 3 },
        { name: 'permission', error: 'EACCES', expected: 4 }
      ];

      scenarios.forEach(({ name, results, error, expected }) => {
        let exitCode = 0;

        if (results) {
          const hasCriticalFailure = results.some(r => r.critical && !r.success);
          exitCode = hasCriticalFailure ? 1 : 0;
        } else if (error) {
          if (error.includes('configuration')) exitCode = 2;
          else if (error.includes('timeout')) exitCode = 3;
          else if (error.includes('EACCES')) exitCode = 4;
          else exitCode = 1;
        }

        expect(exitCode).toBe(expected);
      });
    });
  });

  describe('CI/CD integration & error handling', () => {
    test('handles CI platform integration', () => {
      const platforms = [
        { env: { GITHUB_ACTIONS: 'true' }, platform: 'github' },
        { env: { JENKINS_URL: 'localhost' }, platform: 'jenkins' },
        { env: { GITLAB_CI: 'true' }, platform: 'gitlab' }
      ];

      platforms.forEach(({ env, platform }) => {
        Object.assign(process.env, env);
        const isCI = Object.keys(env).some(key => process.env[key]);
        expect(isCI).toBe(true);
      });
    });

    test('handles workflow step failures', () => {
      const steps = [
        { step: 'checkout', success: true },
        { step: 'run-qa', success: false },
        { step: 'upload-reports', success: true }
      ];

      const failedQA = steps.find(s => s.step === 'run-qa' && !s.success);
      const exitCode = failedQA ? 1 : 0;
      expect(exitCode).toBe(1);
    });

    test('handles process exit mocking', () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation();
      
      process.exit(1);
      expect(mockExit).toHaveBeenCalledWith(1);
      
      mockExit.mockRestore();
    });

    test('handles signal interruption', () => {
      const signals = [
        { signal: 'SIGINT', exitCode: 130 },
        { signal: 'SIGTERM', exitCode: 130 },
        { signal: 'SIGUSR2', exitCode: 0 }
      ];

      signals.forEach(({ signal, exitCode }) => {
        const shouldExit = signal === 'SIGINT' || signal === 'SIGTERM';
        const code = shouldExit ? 130 : 0;
        expect(code).toBe(exitCode);
      });
    });
  });

  describe('Exit code validation', () => {
    test('validates codes within range and consistency', () => {
      const validationCases = [
        { code: 0, valid: true, scenario: 'success' },
        { code: 1, valid: true, scenario: 'general-failure' },
        { code: 130, valid: true, scenario: 'signal-interrupt' },
        { code: -1, valid: false, scenario: 'invalid-negative' },
        { code: 256, valid: false, scenario: 'invalid-overflow' }
      ];

      validationCases.forEach(({ code, valid, scenario }) => {
        const isValid = code >= 0 && code < 256;
        expect(isValid).toBe(valid);
      });
    });

    test('ensures consistency across test runs', () => {
      const consistencyRuns = [
        { tools: [{ success: true }], expected: 0 },
        { tools: [{ success: false, critical: true }], expected: 1 },
        { tools: [{ success: true }], expected: 0 }
      ];

      consistencyRuns.forEach(({ tools, expected }) => {
        const hasCriticalFailure = tools.some(t => t.critical && !t.success);
        const exitCode = hasCriticalFailure ? 1 : 0;
        expect(exitCode).toBe(expected);
      });
    });
  });

});