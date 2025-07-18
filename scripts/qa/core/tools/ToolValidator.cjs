/**
 * Tool Validator - Single Responsibility: Tool Availability & Validation
 * Extracted from PlanSelector to follow SRP
 * Includes MegaLinter and Snyk prototypes for early validation
 */

const { execSync } = require('child_process');
const ToolTypeClassifier = require('./ToolTypeClassifier.cjs');

class ToolValidator {
  constructor(config, logger, environmentChecker) {
    this.config = config;
    this.logger = logger;
    this.environmentChecker = environmentChecker;
    
    // Systematic tool type classifier
    this.toolTypeClassifier = new ToolTypeClassifier(config, logger);
    
    // Base tool command mappings (extensible)
    this.baseToolCommands = {
      prettier: 'npx prettier --version',
      black: 'black --version',
      eslint: 'npx eslint --version',
      pylint: 'pylint --version',
      jest: 'npx jest --version',
      pytest: 'pytest --version',
      snyk: 'snyk --version',
      bandit: 'bandit --version',
      tsc: 'npx tsc --version',
      vite: 'npx vite --version',
      npm: 'npm --version',
      yarn: 'yarn --version',
      pnpm: 'pnpm --version',
      pip: 'pip --version',
      'python-compile': 'python -c "import py_compile"'
    };
  }
  
  /**
   * Validate tool availability and filter unavailable tools
   */
  async validateAndFilterTools(tools) {
    const validatedTools = [];
    const unavailableTools = [];
    
    for (const tool of tools) {
      const isAvailable = await this.checkToolAvailability(tool.name);
      
      if (isAvailable) {
        validatedTools.push(tool);
      } else {
        unavailableTools.push(tool);
        this.logger.warn(`Tool ${tool.name} not available, skipping`);
      }
    }
    
    if (unavailableTools.length > 0) {
      this.logger.info(`Validated ${validatedTools.length}/${tools.length} tools`);
    }
    
    return {
      available: validatedTools,
      unavailable: unavailableTools
    };
  }
  
  /**
   * Check if a specific tool is available (delegate to ToolChecker directly)
   */
  async checkToolAvailability(toolName) {
    // ARCHITECTURAL FIX: Use ToolChecker directly to avoid timing issues
    // EnvironmentChecker.isToolAvailable() requires checkEnvironment() to be completed first
    const toolChecker = this.environmentChecker.toolChecker;
    
    // Get tool configuration from EnvironmentChecker
    const toolConfig = this.environmentChecker.optionalTools[toolName] || 
                      this.environmentChecker.requiredTools[toolName];
    
    if (!toolConfig) {
      return false;
    }
    
    try {
      const result = await toolChecker.checkTool(toolName, toolConfig);
      return result.available;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get version command for tool (systematic by type)
   */
  async _getVersionCommand(toolName) {
    // First check base commands (existing tools)
    if (this.baseToolCommands[toolName]) {
      return this.baseToolCommands[toolName];
    }
    
    try {
      // Systematic approach: Generate command based on tool type
      const toolType = await this.toolTypeClassifier.getToolType(toolName);
      
      switch (toolType) {
        case 'package-manager':
          return `${toolName} --version`;
        case 'compiler':
          return toolName.startsWith('npx') ? toolName + ' --version' : `npx ${toolName} --version`;
        case 'bundler':
          return `npx ${toolName} --version`;
        case 'dependency-manager':
          return `${toolName} --version`;
        case 'linter':
          return `npx ${toolName} --version`;
        case 'formatter':
          return `npx ${toolName} --version`;
        case 'test-runner':
          return `npx ${toolName} --version`;
        case 'security-scanner':
          return `${toolName} --version`;
        case 'dimension':
          // MODULAR FIX: Dimension tools are always available (they represent internal validation)
          return 'echo "Dimension tool - always available"';
        default:
          // Fallback for unknown types
          return `${toolName} --version`;
      }
    } catch (error) {
      // Final fallback: standard version command
      return `${toolName} --version`;
    }
  }
  
  /**
   * Prototype: MegaLinter integration check
   * RF-006: Enhanced QA Tools Integration
   */
  async checkMegaLinterAvailability() {
    const cacheKey = 'megalinter';
    
    if (this.availabilityCache.has(cacheKey)) {
      return this.availabilityCache.get(cacheKey);
    }
    
    try {
      // Check for multiple MegaLinter installation methods
      const commands = [
        'which megalinter',
        'which mega-linter',
        'docker images | grep megalinter',
        'npx mega-linter --version'
      ];
      
      for (const command of commands) {
        try {
          execSync(command, { stdio: 'ignore', timeout: 3000 });
          this.logger.info('MegaLinter detected, can be used for enhanced validation');
          this.availabilityCache.set(cacheKey, true);
          return true;
        } catch (error) {
          // Continue to next command
        }
      }
      
      this.logger.warn('MegaLinter not available, using individual tools');
      this.availabilityCache.set(cacheKey, false);
      return false;
    } catch (error) {
      this.logger.error(`Error checking MegaLinter: ${error.message}`);
      this.availabilityCache.set(cacheKey, false);
      return false;
    }
  }
  
  /**
   * Prototype: Snyk integration check
   * T-09: Security Tools Integration
   */
  async checkSnykAvailability() {
    const cacheKey = 'snyk';
    
    if (this.availabilityCache.has(cacheKey)) {
      return this.availabilityCache.get(cacheKey);
    }
    
    try {
      // Check Snyk CLI availability
      execSync('snyk --version', { stdio: 'ignore', timeout: 3000 });
      
      // Check authentication
      try {
        execSync('snyk auth', { stdio: 'ignore', timeout: 5000 });
        this.logger.info('Snyk authenticated and ready for security scanning');
        this.availabilityCache.set(cacheKey, true);
        return true;
      } catch (authError) {
        this.logger.warn('Snyk available but not authenticated. Run: snyk auth');
        this.availabilityCache.set(cacheKey, false);
        return false;
      }
    } catch (error) {
      this.logger.warn('Snyk not available, skipping security scans');
      this.availabilityCache.set(cacheKey, false);
      return false;
    }
  }
  
  /**
   * Get alternative tools for unavailable ones
   */
  getAlternativeTools(unavailableTools) {
    const alternatives = {
      eslint: ['tslint', 'standard'],
      pylint: ['flake8', 'pycodestyle'],
      prettier: ['autopep8', 'black'],
      jest: ['mocha', 'vitest'],
      pytest: ['unittest', 'nose2'],
      snyk: ['bandit', 'safety'],
      bandit: ['snyk', 'semgrep']
    };
    
    const suggestions = [];
    
    for (const tool of unavailableTools) {
      const alts = alternatives[tool.name] || [];
      if (alts.length > 0) {
        suggestions.push({
          missing: tool.name,
          alternatives: alts,
          dimension: tool.dimension
        });
      }
    }
    
    return suggestions;
  }
  
  /**
   * Validate tool prerequisites
   */
  async validatePrerequisites(tools) {
    const prerequisites = {
      eslint: ['node', 'npm'],
      pytest: ['python', 'pip'],
      snyk: ['node', 'npm'],
      jest: ['node', 'npm'],
      tsc: ['node', 'npm']
    };
    
    const missingPrereqs = [];
    
    for (const tool of tools) {
      const toolPrereqs = prerequisites[tool.name] || [];
      
      for (const prereq of toolPrereqs) {
        const available = await this.checkToolAvailability(prereq);
        if (!available) {
          missingPrereqs.push({
            tool: tool.name,
            prerequisite: prereq
          });
        }
      }
    }
    
    return missingPrereqs;
  }
  
  /**
   * Generate validation report
   */
  generateValidationReport(validationResults) {
    const { available, unavailable } = validationResults;
    const alternatives = this.getAlternativeTools(unavailable);
    
    return {
      summary: {
        total: available.length + unavailable.length,
        available: available.length,
        unavailable: unavailable.length,
        availabilityRate: (available.length / (available.length + unavailable.length)) * 100
      },
      availableTools: available.map(tool => tool.name),
      unavailableTools: unavailable.map(tool => tool.name),
      alternatives,
      recommendations: this._generateRecommendations(available, unavailable, alternatives)
    };
  }
  
  /**
   * Generate recommendations based on validation results
   */
  _generateRecommendations(available, unavailable, alternatives) {
    const recommendations = [];
    
    if (unavailable.length === 0) {
      recommendations.push('All tools are available. Proceed with execution.');
    } else {
      recommendations.push(`${unavailable.length} tools unavailable. Consider installing missing tools.`);
      
      if (alternatives.length > 0) {
        recommendations.push(`Alternative tools available for ${alternatives.length} missing tools.`);
      }
    }
    
    return recommendations;
  }
  
  /**
   * Clear availability cache (useful for testing)
   */
  clearCache() {
    this.availabilityCache.clear();
    this.logger.info('Tool availability cache cleared');
  }
}

module.exports = ToolValidator;