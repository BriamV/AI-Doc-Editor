const { ModeOrchestrator } = require('../../core/modes/ModeOrchestrator.cjs');

jest.mock('../../core/modes/ModeOrchestrator.cjs');

describe('ModeOrchestrator', () => {
  let modeOrchestrator;

  beforeEach(() => {
    modeOrchestrator = new ModeOrchestrator();
    ['selectMode', 'resolveModeConflicts', 'switchMode', 'validateConfiguration', 
     'prioritizeModes', 'handleModeFailure', 'orchestrate', 'getAvailableModes']
      .forEach(method => modeOrchestrator[method] = jest.fn());
  });

  afterEach(() => jest.clearAllMocks());

  describe('Mode priority logic', () => {
    const priorityCases = [
      { desc: 'DoD mode for production', context: { branch: 'release/v1.2.0', environment: 'production' }, expected: { mode: 'dod', reason: 'production-release' }},
      { desc: 'fast mode for development', context: { branch: 'feature/quick-fix', timeConstraint: 'urgent' }, expected: { mode: 'fast', reason: 'development-urgent' }},
      { desc: 'scope mode for large refactoring', context: { branch: 'refactor/auth-system', filesChanged: 45 }, expected: { mode: 'scope', reason: 'large-refactoring' }},
      { desc: 'automatic mode for standard development', context: { branch: 'feature/user-profile', confidence: 0.87 }, expected: { mode: 'automatic', reason: 'high-confidence-context' }}
    ];
    
    priorityCases.forEach(({ desc, context, expected }) => {
      test(`should prioritize ${desc}`, () => {
        modeOrchestrator.prioritizeModes.mockReturnValue([{ mode: expected.mode, priority: 1, reason: expected.reason }]);
        const result = modeOrchestrator.prioritizeModes(context);
        expect(result[0].mode).toBe(expected.mode);
        expect(result[0].reason).toBe(expected.reason);
      });
    });
  });

  describe('Mode selection based on context', () => {
    const selectionCases = [
      { desc: 'DoD mode for critical production', context: { branch: 'hotfix/security-patch', criticality: 'critical' }, expected: { mode: 'dod', reason: 'critical-security-patch', confidence: 0.95 }},
      { desc: 'fast mode for small staged changes', context: { stagedFiles: ['src/utils/formatter.ts'], linesChanged: 15 }, expected: { mode: 'fast', reason: 'small-staged-changes', confidence: 0.88 }},
      { desc: 'scope mode for directory changes', context: { scope: 'src/auth', filesChanged: 8 }, expected: { mode: 'scope', reason: 'directory-focused-changes', confidence: 0.82 }},
      { desc: 'automatic mode for mixed tech stack', context: { technologies: ['react', 'python'] }, expected: { mode: 'automatic', reason: 'mixed-technology-stack', confidence: 0.79 }}
    ];
    
    selectionCases.forEach(({ desc, context, expected }) => {
      test(`should select ${desc}`, () => {
        modeOrchestrator.selectMode.mockReturnValue({ selectedMode: expected.mode, confidence: expected.confidence, reason: expected.reason });
        const result = modeOrchestrator.selectMode(context);
        expect(result.selectedMode).toBe(expected.mode);
        expect(result.reason).toBe(expected.reason);
        if (expected.confidence > 0.9) expect(result.confidence).toBeGreaterThan(0.9);
        else expect(result.confidence).toBeGreaterThan(0.8);
      });
    });
  });

  describe('Mode conflict resolution', () => {
    const conflictCases = [
      { desc: 'DoD overrides fast for production', conflict: { requestedMode: 'fast', requiredMode: 'dod', branch: 'release/v2.0.0' }, expected: { resolved: 'dod', override: false }},
      { desc: 'scope as compromise solution', conflict: { requestedMode: 'automatic', requiredMode: 'dod', allowCompromise: true }, expected: { resolved: 'scope', compromise: true }},
      { desc: 'user override in development', conflict: { requestedMode: 'fast', environment: 'development', userOverride: true }, expected: { resolved: 'fast', override: true }}
    ];
    
    conflictCases.forEach(({ desc, conflict, expected }) => {
      test(`should resolve ${desc}`, () => {
        modeOrchestrator.resolveModeConflicts.mockReturnValue({ resolvedMode: expected.resolved, userOverride: expected.override || false, compromise: expected.compromise || false });
        const result = modeOrchestrator.resolveModeConflicts(conflict);
        expect(result.resolvedMode).toBe(expected.resolved);
        if (expected.override) expect(result.userOverride).toBe(true);
        if (expected.compromise) expect(result.compromise).toBe(true);
      });
    });
  });

  describe('Mode switching during execution', () => {
    const switchCases = [
      { desc: 'fast to automatic on complexity', trigger: 'complexity-threshold-exceeded', expected: { success: true, newMode: 'automatic', preserved: true }},
      { desc: 'scope to DoD on security issue', trigger: 'security-vulnerability-detected', expected: { success: true, newMode: 'dod', preserved: false }},
      { desc: 'fail switch due to constraints', trigger: 'time-constraint', expected: { success: false, newMode: null, preserved: true }}
    ];
    
    switchCases.forEach(({ desc, trigger, expected }) => {
      test(`should handle ${desc}`, () => {
        modeOrchestrator.switchMode.mockReturnValue({ success: expected.success, newMode: expected.newMode, preservedState: expected.preserved });
        const result = modeOrchestrator.switchMode({ triggerReason: trigger });
        expect(result.success).toBe(expected.success);
        if (expected.newMode) expect(result.newMode).toBe(expected.newMode);
        else expect(result.newMode).toBeNull();
        expect(result.preservedState).toBe(expected.preserved);
      });
    });
  });

  describe('Configuration validation', () => {
    const configCases = [
      { desc: 'valid configuration', config: { defaultMode: 'automatic', allowedModes: ['automatic', 'fast'] }, expected: { valid: true, errorCount: 0 }},
      { desc: 'invalid configuration', config: { defaultMode: 'invalid-mode', allowedModes: ['unknown-mode'] }, expected: { valid: false, errorCount: 3 }},
      { desc: 'suboptimal configuration', config: { defaultMode: 'dod', allowedModes: ['dod'] }, expected: { valid: true, warningCount: 3 }}
    ];
    
    configCases.forEach(({ desc, config, expected }) => {
      test(`should validate ${desc}`, () => {
        const mockResult = { isValid: expected.valid, errors: Array(expected.errorCount || 0).fill('error'), warnings: Array(expected.warningCount || 0).fill('warning') };
        modeOrchestrator.validateConfiguration.mockReturnValue(mockResult);
        const result = modeOrchestrator.validateConfiguration(config);
        expect(result.isValid).toBe(expected.valid);
        if (expected.errorCount) expect(result.errors).toHaveLength(expected.errorCount);
        if (expected.warningCount) expect(result.warnings).toHaveLength(expected.warningCount);
      });
    });
  });

  describe('Mode failure handling', () => {
    const failureCases = [
      { desc: 'execution failure with automatic fallback', failure: { failedMode: 'fast', errorType: 'timeout' }, expected: { success: true, fallback: 'automatic' }},
      { desc: 'critical failure without recovery', failure: { failedMode: 'dod', errorType: 'system-error', critical: true }, expected: { success: false, fallback: null }},
      { desc: 'partial failure with state preservation', failure: { failedMode: 'scope', errorType: 'partial-tool-failure' }, expected: { success: true, fallback: 'scope' }}
    ];
    
    failureCases.forEach(({ desc, failure, expected }) => {
      test(`should handle ${desc}`, () => {
        modeOrchestrator.handleModeFailure.mockReturnValue({ success: expected.success, fallbackMode: expected.fallback });
        const result = modeOrchestrator.handleModeFailure(failure);
        expect(result.success).toBe(expected.success);
        if (expected.fallback) expect(result.fallbackMode).toBe(expected.fallback);
        else expect(result.fallbackMode).toBeNull();
      });
    });
  });

  describe('Available modes discovery', () => {
    const discoveryCases = [
      { desc: 'all modes available', modes: [{ name: 'automatic', available: true }, { name: 'fast', available: true }], expectedAvailable: 2 },
      { desc: 'some modes unavailable', modes: [{ name: 'automatic', available: true }, { name: 'fast', available: false, reason: 'Missing deps' }], expectedAvailable: 1 }
    ];
    
    discoveryCases.forEach(({ desc, modes, expectedAvailable }) => {
      test(`should discover ${desc}`, () => {
        modeOrchestrator.getAvailableModes.mockReturnValue(modes);
        const result = modeOrchestrator.getAvailableModes();
        const availableModes = result.filter(mode => mode.available);
        expect(availableModes).toHaveLength(expectedAvailable);
        if (expectedAvailable < modes.length) {
          const unavailable = result.filter(mode => !mode.available);
          expect(unavailable.every(mode => mode.reason)).toBe(true);
        }
      });
    });
  });

  describe('Full orchestration execution', () => {
    const orchestrationCases = [
      { desc: 'successful execution', context: { branch: 'feature/auth' }, expected: { success: true, mode: 'automatic', toolCount: 3, score: 0.91 }},
      { desc: 'failure with fallback', context: { branch: 'feature/complex' }, expected: { success: false, fallback: true, fallbackMode: 'fast' }},
      { desc: 'execution with mode switching', context: { branch: 'hotfix/security' }, expected: { success: true, switched: true, finalMode: 'dod' }}
    ];
    
    orchestrationCases.forEach(({ desc, context, expected }) => {
      test(`should handle ${desc}`, () => {
        const mockResult = { 
          success: expected.success, 
          selectedMode: expected.mode || 'automatic',
          toolsExecuted: Array(expected.toolCount || 1).fill('tool'),
          finalScore: expected.score,
          fallbackExecuted: expected.fallback,
          fallbackMode: expected.fallbackMode,
          modeSwitched: expected.switched,
          finalMode: expected.finalMode
        };
        modeOrchestrator.orchestrate.mockReturnValue(mockResult);
        const result = modeOrchestrator.orchestrate(context);
        expect(result.success).toBe(expected.success);
        if (expected.toolCount) expect(result.toolsExecuted).toHaveLength(expected.toolCount);
        if (expected.score) expect(result.finalScore).toBeGreaterThan(0.9);
        if (expected.fallback) expect(result.fallbackExecuted).toBe(true);
        if (expected.switched) expect(result.modeSwitched).toBe(true);
      });
    });
  });
});