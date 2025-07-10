/**
 * Automatic Mode Handler - Strategy Pattern
 * RF-005: Branch type-based dimension selection with preconfigured sets
 */

class AutomaticMode {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    // RF-005: Preconfigured dimension sets for each branch type
    this.branchTypeMappings = {
      feature: ['format', 'lint', 'test', 'security', 'build'],
      refactor: ['format', 'lint', 'test', 'build'], // No security for refactors
      fix: ['format', 'lint', 'test'], // Quick validation for fixes
      hotfix: ['format', 'lint'], // Minimal for urgent fixes
      chore: ['format', 'lint'], // Minimal for maintenance
      docs: ['format'], // Only formatting for documentation
      default: ['format', 'lint', 'test'] // Fallback
    };
  }
  
  /**
   * Select dimensions based on branch type (RF-005)
   */
  async selectDimensions(context, options) {
    // RF-005: Detect branch type from context
    const branchType = this._detectBranchType(context);
    
    // RF-005: Apply preconfigured dimension set
    const dimensions = this.branchTypeMappings[branchType] || this.branchTypeMappings.default;
    
    this.logger.info(`Automatic mode (RF-005): Branch type '${branchType}' → dimensions: ${dimensions.join(', ')}`);
    
    return dimensions;
  }
  
  /**
   * Detect branch type from context (RF-005)
   */
  _detectBranchType(context) {
    const branchName = context.branch?.name || context.git?.branch || 'main';
    
    // RF-005: Parse branch type from branch name patterns
    if (branchName.startsWith('feature/') || branchName.includes('-feature-')) {
      return 'feature';
    }
    if (branchName.startsWith('refactor/') || branchName.includes('-refactor-')) {
      return 'refactor';
    }
    if (branchName.startsWith('fix/') || branchName.includes('-fix-')) {
      return 'fix';
    }
    if (branchName.startsWith('hotfix/') || branchName.includes('-hotfix-')) {
      return 'hotfix';
    }
    if (branchName.startsWith('chore/') || branchName.includes('-chore-')) {
      return 'chore';
    }
    if (branchName.startsWith('docs/') || branchName.includes('-docs-')) {
      return 'docs';
    }
    
    // Additional detection from commit messages or PR title if available
    const commitMessage = context.git?.lastCommit?.message || '';
    if (commitMessage.toLowerCase().includes('feat:') || commitMessage.toLowerCase().includes('feature:')) {
      return 'feature';
    }
    if (commitMessage.toLowerCase().includes('fix:')) {
      return 'fix';
    }
    if (commitMessage.toLowerCase().includes('refactor:')) {
      return 'refactor';
    }
    
    this.logger.info(`Branch type detection: '${branchName}' → using default`);
    return 'default';
  }
}

module.exports = AutomaticMode;