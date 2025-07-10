/**
 * DoD Mode Handler - Strategy Pattern
 * RF-005: Definition of Done validation + T-13 absorbed logic
 * Maps DoD tags to specific validation requirements
 */

class DoDMode {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.dodMappings = config.get('dodMappings') || {};
    this.dodConfig = config.get('modes.dod') || {};
  }
  
  /**
   * Select dimensions based on DoD requirements (RF-005)
   */
  async selectDimensions(context, options) {
    // RF-005: DoD detection from branch name or qa.json file
    const dodTag = this._extractDoDTag(context, options);
    
    if (!dodTag) {
      this.logger.warn('No DoD tag found, using default code-review DoD');
      return this._getDefaultDoDDimensions();
    }
    
    const dimensions = this._getDoDDimensions(dodTag);
    this.logger.info(`DoD validation (RF-005) for "${dodTag}": ${dimensions.join(', ')}`);
    
    return dimensions;
  }
  
  /**
   * Extract DoD tag from context and options (RF-005)
   * RF-005: Detection from branch name tags or qa.json file
   */
  _extractDoDTag(context, options) {
    // 1. RF-005: Check branch name for DoD tags (e.g., feature/T-02_dod-full-test)
    const branchName = context.branch?.name || context.git?.branch || '';
    const branchDoDMatch = branchName.match(/dod[-_]([a-z-]+)/i);
    if (branchDoDMatch) {
      const dodTag = branchDoDMatch[1].replace('-', '-');
      this.logger.info(`DoD tag detected from branch name: ${dodTag}`);
      return dodTag;
    }
    
    // 2. RF-005: Check qa.json file in the branch (if implemented)
    if (context.qaConfigFile?.dod) {
      this.logger.info(`DoD tag detected from qa.json: ${context.qaConfigFile.dod}`);
      return context.qaConfigFile.dod;
    }
    
    // 3. Fallback: Check task identifier from options
    const task = options.task;
    if (!task) return null;
    
    if (task.includes('dod:')) {
      return task.split('dod:')[1];
    }
    
    if (task.startsWith('T-')) {
      // Map specific tasks to DoD requirements
      return this._mapTaskToDoDTag(task);
    }
    
    return null;
  }
  
  /**
   * Map task ID to appropriate DoD tag
   */
  _mapTaskToDoDTag(taskId) {
    // Task-specific DoD mapping
    const taskDoDMap = {
      'T-01': 'integration',     // Baseline & CI/CD needs full integration
      'T-02': 'code-review',     // CLI needs code review
      'T-03': 'testing',         // Context detection needs testing
      'T-04': 'code-review',     // Orchestrator needs code review
      'T-05': 'testing',         // Logger needs testing
      'T-06': 'integration',     // MegaLinter needs integration testing
      'T-07': 'testing',         // Fast mode needs performance testing
      'T-08': 'testing',         // Test wrappers need meta-testing
      'T-09': 'deployment',      // Security tools need deployment validation
      'T-10': 'integration',     // Environment checker needs integration
      'T-11': 'integration',     // Build validators need integration
      'T-12': 'integration',     // Data validators need integration
      'T-13': 'code-review',     // DoD config needs code review
      'T-14': 'deployment',      // CI/CD integration needs deployment
      'T-15': 'code-review',     // Feedback mechanism needs code review
      'T-16': 'deployment',      // Performance benchmarking needs deployment
      'T-17': 'deployment',      // System tests need deployment
      'T-18': 'code-review',     // Risk review needs code review
      'T-19': 'testing',         // QA config needs testing
      'T-20': 'testing',         // Plan selector needs extensive testing
      'T-21': 'integration'      // Wrapper coordinator needs integration
    };
    
    return taskDoDMap[taskId] || 'code-review';
  }
  
  /**
   * Get dimensions for specific DoD tag (RF-005)
   * RF-005 mappings:
   * - dod:code-review: Error Detection, Design Metrics, Security & Audit
   * - dod:all-tests: Build & Dependencies, Testing & Coverage, Data & Compatibility
   */
  _getDoDDimensions(dodTag) {
    // RF-005: Exact mappings from specification
    const rf005Mappings = {
      'code-review': ['format', 'lint', 'security'], // Error Detection + Design Metrics + Security & Audit
      'all-tests': ['build', 'test'], // Build & Dependencies + Testing & Coverage + Data & Compatibility
      'full-test': ['build', 'test'], // Alias for all-tests
      'testing': ['test'], // Testing & Coverage only
      'integration': ['build', 'test', 'security'], // Complete integration validation
      'deployment': ['build', 'test', 'security', 'audit'] // Full deployment readiness
    };
    
    const dimensions = rf005Mappings[dodTag] || this.dodMappings[dodTag];
    
    if (!dimensions || dimensions.length === 0) {
      this.logger.warn(`Unknown DoD tag "${dodTag}", using default code-review`);
      return this._getDefaultDoDDimensions();
    }
    
    this.logger.info(`RF-005 DoD mapping: ${dodTag} → [${dimensions.join(', ')}]`);
    return [...dimensions]; // Return copy to avoid mutations
  }
  
  /**
   * Get default DoD dimensions
   */
  _getDefaultDoDDimensions() {
    return this.dodMappings['code-review'] || ['format', 'lint', 'security'];
  }
  
  /**
   * Validate DoD completion
   */
  validateDoDCompletion(results, dodTag) {
    const requiredDimensions = this._getDoDDimensions(dodTag);
    const completedDimensions = results
      .filter(result => result.status === 'passed')
      .map(result => result.dimension);
    
    const missing = requiredDimensions.filter(dim => !completedDimensions.includes(dim));
    const isComplete = missing.length === 0;
    
    return {
      isComplete,
      missing,
      required: requiredDimensions,
      completed: completedDimensions,
      completionRate: (completedDimensions.length / requiredDimensions.length) * 100
    };
  }
  
  /**
   * Get DoD-specific requirements and thresholds
   */
  getDoDRequirements(dodTag) {
    const requirements = {
      'code-review': {
        coverageThreshold: 70,
        allowWarnings: true,
        requiresSecurity: true,
        maxComplexity: 10
      },
      'testing': {
        coverageThreshold: 90,
        allowWarnings: false,
        requiresSecurity: false,
        maxComplexity: 8
      },
      'integration': {
        coverageThreshold: 80,
        allowWarnings: true,
        requiresSecurity: true,
        maxComplexity: 12,
        requiresBuildSuccess: true
      },
      'deployment': {
        coverageThreshold: 85,
        allowWarnings: false,
        requiresSecurity: true,
        maxComplexity: 10,
        requiresBuildSuccess: true,
        requiresSecurityScan: true
      }
    };
    
    return requirements[dodTag] || requirements['code-review'];
  }
  
  /**
   * Get DoD validation summary
   */
  getDoDSummary(dodTag, validationResults) {
    const validation = this.validateDoDCompletion(validationResults, dodTag);
    const requirements = this.getDoDRequirements(dodTag);
    
    return {
      dodTag,
      isComplete: validation.isComplete,
      completionRate: validation.completionRate,
      missing: validation.missing,
      requirements,
      recommendation: this._getDoDRecommendation(validation, requirements)
    };
  }
  
  /**
   * Get DoD completion recommendation
   */
  _getDoDRecommendation(validation, requirements) {
    if (validation.isComplete) {
      return 'DoD requirements satisfied. Ready for next phase.';
    }
    
    if (validation.completionRate >= 80) {
      return `Almost complete. Address: ${validation.missing.join(', ')}`;
    }
    
    return `Significant work needed. Missing: ${validation.missing.join(', ')}`;
  }
}

module.exports = DoDMode;