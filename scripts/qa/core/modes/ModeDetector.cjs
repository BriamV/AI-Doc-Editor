/**
 * Mode Detector - Single Responsibility: Determine execution mode
 * Extracted from PlanSelector to follow SRP
 */

class ModeDetector {
  /**
   * Determine execution mode from options and context
   */
  static determineMode(options, context = null) {
    // Explicit fast mode
    if (options.fast) {
      return 'fast';
    }
    
    // DoD mode detection
    if (options.task) {
      if (options.task.startsWith('T-') || options.task.includes('dod:')) {
        return 'dod';
      }
    }
    
    // FIXED: Handle combined dimension + scope mode
    // When both --dimension and --scope are provided, use dimension mode
    // but the dimension mode will respect the scope parameter
    if (options.dimension) {
      return 'dimension';
    }
    
    // Explicit scope mode (only when no dimension is specified)
    if (options.scope && options.scope !== 'all') {
      return 'scope';
    }
    
    // Default to automatic mode
    return 'automatic';
  }
  
  /**
   * Determine validation scope from context and options
   */
  static determineScope(context, options) {
    // Explicit scope override always takes precedence
    if (options.scope) {
      return options.scope;  
    }
    
    // Default scope detection based on context
    // Each mode handler will override this as needed
    const stackCounts = context.files?.summary?.byStack || {};
    const primaryStack = Object.entries(stackCounts)
      .sort(([,a], [,b]) => b - a)
      .filter(([stack, count]) => count > 0 && stack !== 'docs' && stack !== 'unknown')[0];
    
    return primaryStack ? primaryStack[0] : 'all';
  }
  
  /**
   * Extract DoD tag from task identifier
   */
  static extractDoDTag(task) {
    if (!task) return null;
    
    if (task.includes('dod:')) {
      return task.split('dod:')[1];
    }
    
    if (task.startsWith('T-')) {
      // Default DoD for task-based validation
      return 'code-review';
    }
    
    return null;
  }
}

module.exports = ModeDetector;