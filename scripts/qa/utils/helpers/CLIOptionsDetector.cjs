/**
 * CLI Options Detector - Single Responsibility: Detect CLI flags and options
 * SOLID-Lean refactoring from ExecutionController
 */

class CLIOptionsDetector {
  constructor(logger) {
    this.logger = logger;
  }
  
  /**
   * Check if user explicitly specified a scope
   */
  hasExplicitScope() {
    const scope = this.getExplicitScope();
    return scope && scope !== 'all';
  }
  
  /**
   * Get explicit scope from CLI options
   */
  getExplicitScope() {
    const args = process.argv;
    
    // Check for --scope flag
    const scopeIndex = args.findIndex(arg => arg === '--scope');
    if (scopeIndex !== -1 && scopeIndex < args.length - 1) {
      const scope = args[scopeIndex + 1];
      this.logger.debug(`Detected explicit scope from CLI: ${scope}`);
      return scope;
    }
    
    // Check for --scope=value format
    const scopeArg = args.find(arg => arg.startsWith('--scope='));
    if (scopeArg) {
      const scope = scopeArg.split('=')[1];
      this.logger.debug(`Detected explicit scope from CLI (equals format): ${scope}`);
      return scope;
    }
    
    return null;
  }
  
  /**
   * Get explicit dimension from CLI options
   */
  getExplicitDimension() {
    const args = process.argv;
    
    // Check for --dimension flag
    const dimensionIndex = args.findIndex(arg => arg === '--dimension');
    if (dimensionIndex !== -1 && dimensionIndex < args.length - 1) {
      const dimension = args[dimensionIndex + 1];
      this.logger.debug(`Detected explicit dimension from CLI: ${dimension}`);
      return dimension;
    }
    
    // Check for --dimension=value format
    const dimensionArg = args.find(arg => arg.startsWith('--dimension='));
    if (dimensionArg) {
      const dimension = dimensionArg.split('=')[1];
      this.logger.debug(`Detected explicit dimension from CLI (equals format): ${dimension}`);
      return dimension;
    }
    
    return null;
  }
  
  /**
   * Check if user explicitly specified a dimension
   */
  hasExplicitDimension() {
    return this.getExplicitDimension() !== null;
  }
  
  /**
   * Get all CLI flags
   */
  getAllFlags() {
    const args = process.argv;
    const flags = {};
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg.startsWith('--')) {
        if (arg.includes('=')) {
          // --flag=value format
          const [flag, value] = arg.split('=', 2);
          flags[flag.replace('--', '')] = value;
        } else if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
          // --flag value format
          flags[arg.replace('--', '')] = args[i + 1];
          i++; // Skip next argument as it's the value
        } else {
          // Boolean flag
          flags[arg.replace('--', '')] = true;
        }
      }
    }
    
    return flags;
  }
}

module.exports = CLIOptionsDetector;