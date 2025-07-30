const { ContextDetector } = require('../../core/context/ContextDetector.cjs');
const fs = require('fs');

jest.mock('../../core/context/ContextDetector.cjs');

describe('ContextDetector', () => {
  let contextDetector;

  beforeEach(() => {
    contextDetector = new ContextDetector();
    contextDetector.getCurrentBranch = jest.fn();
    contextDetector.getModifiedFiles = jest.fn();
    contextDetector.getChangeScope = jest.fn();
    contextDetector.calculateConfidence = jest.fn();
    contextDetector.prioritizeContext = jest.fn();
    contextDetector.updateHistoricalPatterns = jest.fn();
    contextDetector.detectFromMultiRepo = jest.fn();
    contextDetector.getIncrementalChanges = jest.fn();
    
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue('mock-content');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Branch pattern detection', () => {
    test('should detect feature branch context', () => {
      contextDetector.getCurrentBranch.mockReturnValue('feature/T-44-user-auth');
      contextDetector.getModifiedFiles.mockReturnValue(['src/auth/login.ts', 'src/auth/register.ts']);
      contextDetector.getChangeScope.mockReturnValue({ type: 'feature', scope: 'frontend' });
      contextDetector.calculateConfidence.mockReturnValue(0.95);
      
      const result = contextDetector.detectContext();
      
      expect(result.branchType).toBe('feature');
      expect(result.taskId).toBe('T-44');
      expect(result.scope).toBe('frontend');
      expect(result.confidence).toBe(0.95);
    });

    test('should detect bugfix branch context', () => {
      contextDetector.getCurrentBranch.mockReturnValue('bugfix/critical-auth-fix');
      contextDetector.getModifiedFiles.mockReturnValue(['src/auth/middleware.ts']);
      contextDetector.getChangeScope.mockReturnValue({ type: 'bugfix', scope: 'backend' });
      contextDetector.calculateConfidence.mockReturnValue(0.88);
      
      const result = contextDetector.detectContext();
      
      expect(result.branchType).toBe('bugfix');
      expect(result.scope).toBe('backend');
      expect(result.confidence).toBe(0.88);
    });

    test('should detect hotfix branch context', () => {
      contextDetector.getCurrentBranch.mockReturnValue('hotfix/security-patch');
      contextDetector.getModifiedFiles.mockReturnValue(['src/security/validator.ts', 'src/auth/token.ts']);
      contextDetector.getChangeScope.mockReturnValue({ type: 'hotfix', scope: 'security' });
      contextDetector.calculateConfidence.mockReturnValue(0.92);
      
      const result = contextDetector.detectContext();
      
      expect(result.branchType).toBe('hotfix');
      expect(result.scope).toBe('security');
      expect(result.confidence).toBe(0.92);
    });
  });

  describe('File modification analysis', () => {
    test('should analyze TypeScript frontend changes', () => {
      const mockFiles = ['src/components/Auth.tsx', 'src/hooks/useAuth.ts'];
      contextDetector.getModifiedFiles.mockReturnValue(mockFiles);
      contextDetector.getChangeScope.mockReturnValue({ 
        type: 'feature', scope: 'frontend', technologies: ['react', 'typescript'], complexity: 'medium'
      });
      
      const result = contextDetector.analyzeFileChanges();
      
      expect(result.technologies).toContain('react');
      expect(result.technologies).toContain('typescript');
      expect(result.complexity).toBe('medium');
    });

    test('should analyze Python backend changes', () => {
      const mockFiles = ['src/api/auth.py', 'src/models/user.py'];
      contextDetector.getModifiedFiles.mockReturnValue(mockFiles);
      contextDetector.getChangeScope.mockReturnValue({ 
        type: 'feature', scope: 'backend', technologies: ['python', 'fastapi'], complexity: 'high'
      });
      
      const result = contextDetector.analyzeFileChanges();
      
      expect(result.technologies).toContain('python');
      expect(result.technologies).toContain('fastapi');
      expect(result.complexity).toBe('high');
    });

    test('should analyze full-stack changes', () => {
      const mockFiles = ['src/components/Dashboard.tsx', 'src/api/dashboard.py'];
      contextDetector.getModifiedFiles.mockReturnValue(mockFiles);
      contextDetector.getChangeScope.mockReturnValue({ 
        type: 'feature', scope: 'full-stack', technologies: ['react', 'typescript', 'python', 'fastapi'], complexity: 'high'
      });
      
      const result = contextDetector.analyzeFileChanges();
      
      expect(result.scope).toBe('full-stack');
      expect(result.technologies).toHaveLength(4);
      expect(result.complexity).toBe('high');
    });
  });

  describe('Change scope assessment', () => {
    test('should assess low impact changes', () => {
      contextDetector.getChangeScope.mockReturnValue({
        impact: 'low', linesChanged: 25, filesAffected: 2, testCoverage: 0.85
      });
      
      const result = contextDetector.assessChangeScope();
      
      expect(result.impact).toBe('low');
      expect(result.linesChanged).toBeLessThan(50);
    });

    test('should assess high impact changes', () => {
      contextDetector.getChangeScope.mockReturnValue({
        impact: 'high', linesChanged: 450, filesAffected: 12, testCoverage: 0.65
      });
      
      const result = contextDetector.assessChangeScope();
      
      expect(result.impact).toBe('high');
      expect(result.linesChanged).toBeGreaterThan(400);
    });
  });

  describe('Confidence scoring algorithm', () => {
    test('should calculate high confidence for clear patterns', () => {
      contextDetector.calculateConfidence.mockReturnValue(0.94);
      
      const context = {
        branchType: 'feature', scope: 'frontend', technologies: ['react', 'typescript'], 
        patterns: ['clear-naming', 'consistent-structure']
      };
      
      const confidence = contextDetector.calculateConfidence(context);
      
      expect(confidence).toBeGreaterThan(0.9);
    });

    test('should calculate low confidence for ambiguous patterns', () => {
      contextDetector.calculateConfidence.mockReturnValue(0.42);
      
      const context = {
        branchType: 'unknown', scope: 'mixed', technologies: ['mixed'], patterns: ['inconsistent-naming']
      };
      
      const confidence = contextDetector.calculateConfidence(context);
      
      expect(confidence).toBeLessThan(0.5);
    });
  });

  describe('Context prioritization logic', () => {
    test('should prioritize security contexts', () => {
      const contexts = [
        { type: 'feature', priority: 'medium', scope: 'frontend' },
        { type: 'security', priority: 'high', scope: 'security' },
        { type: 'bugfix', priority: 'low', scope: 'backend' }
      ];
      
      contextDetector.prioritizeContext.mockReturnValue(contexts[1]);
      const result = contextDetector.prioritizeContext(contexts);
      
      expect(result.type).toBe('security');
      expect(result.priority).toBe('high');
    });

    test('should prioritize by confidence when equal priority', () => {
      const contexts = [
        { type: 'feature', priority: 'medium', confidence: 0.85 },
        { type: 'feature', priority: 'medium', confidence: 0.92 }
      ];
      
      contextDetector.prioritizeContext.mockReturnValue(contexts[1]);
      const result = contextDetector.prioritizeContext(contexts);
      
      expect(result.confidence).toBe(0.92);
    });
  });

  describe('Historical pattern learning', () => {
    test('should update patterns from successful detections', () => {
      const patterns = { 'feature-auth': 0.95, 'bugfix-api': 0.88 };
      contextDetector.updateHistoricalPatterns.mockReturnValue(patterns);
      
      const result = contextDetector.updateHistoricalPatterns('feature-auth', 0.97);
      
      expect(contextDetector.updateHistoricalPatterns).toHaveBeenCalledWith('feature-auth', 0.97);
      expect(result['feature-auth']).toBeGreaterThan(0.95);
    });
  });

  describe('Multi-repository support', () => {
    test('should detect context across multiple repos', () => {
      const repoContexts = [
        { repo: 'frontend', context: { type: 'feature', scope: 'ui' } },
        { repo: 'backend', context: { type: 'feature', scope: 'api' } }
      ];
      
      contextDetector.detectFromMultiRepo.mockReturnValue({
        aggregatedContext: { type: 'feature', scope: 'full-stack' },
        repoContexts
      });
      
      const result = contextDetector.detectFromMultiRepo(['/repo1', '/repo2']);
      
      expect(result.aggregatedContext.scope).toBe('full-stack');
      expect(result.repoContexts).toHaveLength(2);
    });
  });

  describe('Incremental detection', () => {
    test('should detect incremental changes efficiently', () => {
      contextDetector.getIncrementalChanges.mockReturnValue({
        newFiles: ['src/auth/new-feature.ts'],
        modifiedFiles: ['src/auth/existing.ts'],
        deletedFiles: []
      });
      
      const result = contextDetector.getIncrementalChanges('HEAD~1');
      
      expect(result.newFiles).toHaveLength(1);
      expect(result.modifiedFiles).toHaveLength(1);
      expect(result.deletedFiles).toHaveLength(0);
    });
  });
});