const { GitIntegrator } = require('../../core/context/GitIntegrator.cjs');
const { execSync } = require('child_process');

jest.mock('../../core/context/GitIntegrator.cjs');
jest.mock('child_process');

describe('GitIntegrator', () => {
  let gitIntegrator;

  beforeEach(() => {
    gitIntegrator = new GitIntegrator();
    gitIntegrator.parseDiff = jest.fn();
    gitIntegrator.classifyFileChanges = jest.fn();
    gitIntegrator.analyzeComplexity = jest.fn();
    gitIntegrator.assessImpact = jest.fn();
    gitIntegrator.analyzeCommitMessage = jest.fn();
    gitIntegrator.compareBranches = jest.fn();
    gitIntegrator.detectConflicts = jest.fn();
    gitIntegrator.optimizePerformance = jest.fn();
    
    execSync.mockReturnValue('');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('git diff parsing (staged/unstaged)', () => {
    test('should parse staged changes correctly', () => {
      const mockDiff = '+++ b/src/auth/login.ts\n@@ -1,5 +1,8 @@\n-const login = () => {\n+const login = async () => {\n+  await validateUser();\n   return true;\n }';
      
      gitIntegrator.parseDiff.mockReturnValue({
        files: [{ path: 'src/auth/login.ts', additions: 2, deletions: 1, changes: 3 }],
        totalAdditions: 2, totalDeletions: 1, totalChanges: 3
      });
      
      const result = gitIntegrator.parseDiff(mockDiff, 'staged');
      
      expect(result.files).toHaveLength(1);
      expect(result.files[0].path).toBe('src/auth/login.ts');
      expect(result.totalAdditions).toBe(2);
      expect(result.totalDeletions).toBe(1);
    });

    test('should parse unstaged changes correctly', () => {
      const mockDiff = '+++ b/src/api/user.py\n@@ -10,3 +10,7 @@\n def get_user(id):\n+    if not id:\n+        return None\n     return User.find(id)';
      
      gitIntegrator.parseDiff.mockReturnValue({
        files: [{ path: 'src/api/user.py', additions: 3, deletions: 0, changes: 3 }],
        totalAdditions: 3, totalDeletions: 0, totalChanges: 3
      });
      
      const result = gitIntegrator.parseDiff(mockDiff, 'unstaged');
      
      expect(result.files[0].path).toBe('src/api/user.py');
      expect(result.totalAdditions).toBe(3);
    });

    test('should handle empty diff', () => {
      gitIntegrator.parseDiff.mockReturnValue({
        files: [], totalAdditions: 0, totalDeletions: 0, totalChanges: 0
      });
      
      const result = gitIntegrator.parseDiff('', 'staged');
      
      expect(result.files).toHaveLength(0);
      expect(result.totalChanges).toBe(0);
    });
  });

  describe('File change classification', () => {
    test('should classify frontend changes', () => {
      const files = [
        { path: 'src/components/Auth.tsx', additions: 15, deletions: 5 },
        { path: 'src/hooks/useAuth.ts', additions: 8, deletions: 2 }
      ];
      
      gitIntegrator.classifyFileChanges.mockReturnValue({
        frontend: { files: 2, changes: 28 },
        backend: { files: 0, changes: 0 },
        tests: { files: 0, changes: 0 },
        config: { files: 0, changes: 0 }
      });
      
      const result = gitIntegrator.classifyFileChanges(files);
      
      expect(result.frontend.files).toBe(2);
      expect(result.frontend.changes).toBe(28);
      expect(result.backend.files).toBe(0);
    });

    test('should classify backend changes', () => {
      const files = [
        { path: 'src/api/auth.py', additions: 20, deletions: 5 },
        { path: 'src/models/user.py', additions: 12, deletions: 0 }
      ];
      
      gitIntegrator.classifyFileChanges.mockReturnValue({
        frontend: { files: 0, changes: 0 },
        backend: { files: 2, changes: 37 },
        tests: { files: 0, changes: 0 },
        config: { files: 0, changes: 0 }
      });
      
      const result = gitIntegrator.classifyFileChanges(files);
      
      expect(result.backend.files).toBe(2);
      expect(result.backend.changes).toBe(37);
    });

    test('should classify mixed changes', () => {
      const files = [
        { path: 'src/auth/login.ts', additions: 10, deletions: 2 },
        { path: 'src/api/auth.py', additions: 15, deletions: 3 },
        { path: 'package.json', additions: 2, deletions: 1 }
      ];
      
      gitIntegrator.classifyFileChanges.mockReturnValue({
        frontend: { files: 1, changes: 12 },
        backend: { files: 1, changes: 18 },
        tests: { files: 0, changes: 0 },
        config: { files: 1, changes: 3 }
      });
      
      const result = gitIntegrator.classifyFileChanges(files);
      
      expect(result.frontend.files).toBe(1);
      expect(result.backend.files).toBe(1);
      expect(result.config.files).toBe(1);
    });
  });

  describe('Code complexity analysis', () => {
    test('should analyze low complexity changes', () => {
      const fileChanges = [{ path: 'src/utils/format.ts', additions: 5, deletions: 2 }];
      
      gitIntegrator.analyzeComplexity.mockReturnValue({
        overallComplexity: 'low',
        complexityScore: 2.5,
        factors: ['small-change', 'utility-function']
      });
      
      const result = gitIntegrator.analyzeComplexity(fileChanges);
      
      expect(result.overallComplexity).toBe('low');
      expect(result.complexityScore).toBeLessThan(5);
    });

    test('should analyze high complexity changes', () => {
      const fileChanges = [
        { path: 'src/core/auth/AuthManager.ts', additions: 120, deletions: 45 },
        { path: 'src/api/auth.py', additions: 85, deletions: 25 }
      ];
      
      gitIntegrator.analyzeComplexity.mockReturnValue({
        overallComplexity: 'high',
        complexityScore: 9.2,
        factors: ['large-changes', 'core-logic', 'cross-layer-impact', 'security-related']
      });
      
      const result = gitIntegrator.analyzeComplexity(fileChanges);
      
      expect(result.overallComplexity).toBe('high');
      expect(result.complexityScore).toBeGreaterThan(8);
    });
  });

  describe('Impact assessment', () => {
    test('should assess low impact changes', () => {
      const changes = {
        files: [{ path: 'src/utils/constants.ts', additions: 3, deletions: 1 }],
        complexity: { overallComplexity: 'low', complexityScore: 2.1 }
      };
      
      gitIntegrator.assessImpact.mockReturnValue({
        impactLevel: 'low',
        affectedAreas: ['utilities'],
        riskScore: 1.5,
        recommendations: ['basic-testing']
      });
      
      const result = gitIntegrator.assessImpact(changes);
      
      expect(result.impactLevel).toBe('low');
      expect(result.riskScore).toBeLessThan(3);
    });

    test('should assess high impact changes', () => {
      const changes = {
        files: [
          { path: 'src/core/auth/AuthManager.ts', additions: 85, deletions: 25 },
          { path: 'src/api/auth.py', additions: 55, deletions: 15 }
        ],
        complexity: { overallComplexity: 'high', complexityScore: 8.5 }
      };
      
      gitIntegrator.assessImpact.mockReturnValue({
        impactLevel: 'high',
        affectedAreas: ['authentication', 'api', 'security'],
        riskScore: 8.2,
        recommendations: ['full-testing', 'security-audit', 'peer-review']
      });
      
      const result = gitIntegrator.assessImpact(changes);
      
      expect(result.impactLevel).toBe('high');
      expect(result.riskScore).toBeGreaterThan(7);
      expect(result.recommendations).toContain('security-audit');
    });
  });

  describe('Commit message analysis', () => {
    test('should analyze feature commit messages', () => {
      const commitMessage = 'feat(auth): add two-factor authentication support';
      
      gitIntegrator.analyzeCommitMessage.mockReturnValue({
        type: 'feature',
        scope: 'auth',
        breaking: false,
        priority: 'medium',
        keywords: ['authentication', 'security', 'two-factor']
      });
      
      const result = gitIntegrator.analyzeCommitMessage(commitMessage);
      
      expect(result.type).toBe('feature');
      expect(result.scope).toBe('auth');
      expect(result.breaking).toBe(false);
    });

    test('should analyze breaking changes', () => {
      const commitMessage = 'feat(api)!: redesign authentication endpoints';
      
      gitIntegrator.analyzeCommitMessage.mockReturnValue({
        type: 'feature',
        scope: 'api',
        breaking: true,
        priority: 'critical',
        keywords: ['authentication', 'endpoints', 'redesign']
      });
      
      const result = gitIntegrator.analyzeCommitMessage(commitMessage);
      
      expect(result.breaking).toBe(true);
      expect(result.priority).toBe('critical');
    });
  });

  describe('Branch comparison', () => {
    test('should compare feature branch with main', () => {
      gitIntegrator.compareBranches.mockReturnValue({
        ahead: 5,
        behind: 2,
        diverged: true,
        conflictPotential: 'medium',
        mergeComplexity: 'low'
      });
      
      const result = gitIntegrator.compareBranches('feature/auth', 'main');
      
      expect(result.ahead).toBe(5);
      expect(result.behind).toBe(2);
      expect(result.diverged).toBe(true);
    });

    test('should detect up-to-date branches', () => {
      gitIntegrator.compareBranches.mockReturnValue({
        ahead: 0,
        behind: 0,
        diverged: false,
        conflictPotential: 'none',
        mergeComplexity: 'none'
      });
      
      const result = gitIntegrator.compareBranches('feature/small-fix', 'main');
      
      expect(result.ahead).toBe(0);
      expect(result.behind).toBe(0);
      expect(result.diverged).toBe(false);
    });
  });

  describe('Conflict detection', () => {
    test('should detect potential merge conflicts', () => {
      const files = [
        { path: 'src/auth/login.ts', additions: 25, deletions: 15 },
        { path: 'src/api/auth.py', additions: 18, deletions: 8 }
      ];
      
      gitIntegrator.detectConflicts.mockReturnValue({
        hasConflicts: true,
        conflictFiles: ['src/auth/login.ts'],
        conflictAreas: ['function-signature', 'imports'],
        severity: 'medium'
      });
      
      const result = gitIntegrator.detectConflicts(files, 'main');
      
      expect(result.hasConflicts).toBe(true);
      expect(result.conflictFiles).toContain('src/auth/login.ts');
    });

    test('should detect no conflicts', () => {
      const files = [{ path: 'src/components/NewComponent.tsx', additions: 45, deletions: 0 }];
      
      gitIntegrator.detectConflicts.mockReturnValue({
        hasConflicts: false,
        conflictFiles: [],
        conflictAreas: [],
        severity: 'none'
      });
      
      const result = gitIntegrator.detectConflicts(files, 'main');
      
      expect(result.hasConflicts).toBe(false);
      expect(result.conflictFiles).toHaveLength(0);
    });
  });

  describe('Performance optimization', () => {
    test('should optimize git operations for large repositories', () => {
      gitIntegrator.optimizePerformance.mockReturnValue({
        useShallowClone: true,
        limitDiffContext: 3,
        enableParallelProcessing: true,
        cacheResults: true
      });
      
      const result = gitIntegrator.optimizePerformance({ repoSize: 'large' });
      
      expect(result.useShallowClone).toBe(true);
      expect(result.enableParallelProcessing).toBe(true);
    });

    test('should optimize for small repositories', () => {
      gitIntegrator.optimizePerformance.mockReturnValue({
        useShallowClone: false,
        limitDiffContext: 10,
        enableParallelProcessing: false,
        cacheResults: false
      });
      
      const result = gitIntegrator.optimizePerformance({ repoSize: 'small' });
      
      expect(result.useShallowClone).toBe(false);
      expect(result.enableParallelProcessing).toBe(false);
    });
  });
});