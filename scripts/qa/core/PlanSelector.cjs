/**
 * Plan Selector - SOLID Refactored
 * T-20: Lean orchestrator using Strategy Pattern + Dependency Injection
 * 
 * Orchestrates mode handlers and tool components for plan selection
 * Reduced from 362 LOC → 186 LOC following SOLID principles
 */

const ModeDetector = require('./modes/ModeDetector.cjs');
const AutomaticMode = require('./modes/AutomaticMode.cjs');
const FastMode = require('./modes/FastMode.cjs');
const ScopeMode = require('./modes/ScopeMode.cjs');
const DoDMode = require('./modes/DoDMode.cjs');
const DimensionMode = require('./modes/DimensionMode.cjs');

const ToolMapper = require('./tools/ToolMapper.cjs');
const ToolConfigurator = require('./tools/ToolConfigurator.cjs');
const ToolValidator = require('./tools/ToolValidator.cjs');

class PlanSelector {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    // Initialize mode handlers (Strategy Pattern)
    this.modeHandlers = {
      automatic: new AutomaticMode(config, logger),
      fast: new FastMode(config, logger),
      scope: new ScopeMode(config, logger),
      dod: new DoDMode(config, logger),
      dimension: new DimensionMode(config, logger)
    };
    
    // Initialize tool components (Dependency Injection)
    this.toolMapper = new ToolMapper(config, logger);
    this.toolConfigurator = new ToolConfigurator(config, logger);
    this.toolValidator = new ToolValidator(config, logger);
  }
  
  /**
   * Main plan selection method - Orchestrates all components
   * RF-005: Automático, Por Scope, Rápido, DoD modes
   */
  async selectPlan(context, options = {}) {
    const startTime = Date.now();
    
    // 1. Determine execution mode and scope
    const mode = ModeDetector.determineMode(options, context);
    const scope = ModeDetector.determineScope(context, options);
    
    this.logger.info(`Plan selection: ${mode} mode, ${scope} scope`);
    
    // 2. Select dimensions using appropriate mode handler
    const dimensions = await this._selectDimensionsForMode(mode, context, options);
    
    // 3. Map dimensions to tools
    const tools = this.toolMapper.mapDimensionsToTools(dimensions, scope);
    
    // 4. Configure tools with mode-specific settings
    const configuredTools = await this.toolConfigurator.configureTools(tools, mode);
    
    // 5. Validate tool availability
    const validationResult = await this.toolValidator.validateAndFilterTools(configuredTools);
    
    // 6. Build final plan
    const plan = {
      mode,
      scope,
      dimensions,
      tools: validationResult.available,
      unavailableTools: validationResult.unavailable,
      context,
      options,
      timestamp: new Date().toISOString(),
      selectionTime: Date.now() - startTime
    };
    
    // 7. Apply final optimizations
    this._applyFinalOptimizations(plan);
    
    this.logger.info(`Plan selected: ${plan.dimensions.length} dimensions, ${plan.tools.length} tools`);
    return plan;
  }
  
  /**
   * Select dimensions using appropriate mode handler
   */
  async _selectDimensionsForMode(mode, context, options) {
    const handler = this.modeHandlers[mode];
    
    if (!handler) {
      this.logger.warn(`Unknown mode: ${mode}, falling back to automatic`);
      return await this.modeHandlers.automatic.selectDimensions(context, options);
    }
    
    return await handler.selectDimensions(context, options);
  }
  
  /**
   * Apply final plan optimizations
   */
  _applyFinalOptimizations(plan) {
    // Apply mode-specific optimizations if available
    const handler = this.modeHandlers[plan.mode];
    
    if (plan.mode === 'fast' && handler.applyOptimizations) {
      const optimizedPlan = handler.applyOptimizations({
        tools: plan.tools,
        mode: plan.mode
      });
      plan.tools = optimizedPlan.tools || plan.tools;
    }
    
    // Apply scope-specific optimizations
    if (plan.mode === 'scope' && handler.getScopeOptimizations) {
      const scopeOpts = handler.getScopeOptimizations(plan.scope);
      this._applyScopeOptimizations(plan, scopeOpts);
    }
    
    // Set execution order based on priority
    this._prioritizeToolExecution(plan);
  }
  
  /**
   * Apply scope-specific optimizations
   */
  _applyScopeOptimizations(plan, scopeOpts) {
    if (scopeOpts.prioritize) {
      plan.tools.sort((a, b) => {
        const aPriority = scopeOpts.prioritize.indexOf(a.name);
        const bPriority = scopeOpts.prioritize.indexOf(b.name);
        return (aPriority === -1 ? 999 : aPriority) - (bPriority === -1 ? 999 : bPriority);
      });
    }
    
    if (scopeOpts.parallel !== undefined) {
      plan.execution = { parallel: scopeOpts.parallel };
    }
    
    if (scopeOpts.cacheEnabled !== undefined) {
      plan.tools.forEach(tool => {
        if (!tool.config) {
          tool.config = { args: [] };
        }
        tool.config.cacheEnabled = scopeOpts.cacheEnabled;
      });
    }
  }
  
  /**
   * Prioritize tool execution order
   */
  _prioritizeToolExecution(plan) {
    // Default priority order: format → lint → test → security → build
    const priorityOrder = ['format', 'lint', 'test', 'security', 'build'];
    
    plan.tools.sort((a, b) => {
      const aPriority = priorityOrder.indexOf(a.dimension);
      const bPriority = priorityOrder.indexOf(b.dimension);
      return (aPriority === -1 ? 999 : aPriority) - (bPriority === -1 ? 999 : bPriority);
    });
  }
  
  /**
   * Get comprehensive plan summary
   */
  getPlanSummary(plan) {
    const configSummary = this.toolConfigurator.getConfigurationSummary(plan.tools);
    
    return {
      mode: plan.mode,
      scope: plan.scope,
      dimensions: plan.dimensions,
      toolCount: plan.tools.length,
      unavailableCount: plan.unavailableTools?.length || 0,
      estimatedDuration: configSummary.estimatedDuration,
      selectionTime: plan.selectionTime,
      toolsByDimension: configSummary.toolsByDimension
    };
  }
  
  /**
   * Get execution recommendations based on plan
   */
  getExecutionRecommendations(plan) {
    const recommendations = [];
    
    // Fast mode recommendations
    if (plan.mode === 'fast' && plan.tools.length > 3) {
      recommendations.push('Consider parallel execution for faster results');
    }
    
    // DoD mode recommendations
    if (plan.mode === 'dod') {
      const dodHandler = this.modeHandlers.dod;
      const dodTag = ModeDetector.extractDoDTag(plan.options.task);
      if (dodTag && dodHandler.getDoDRequirements) {
        const requirements = dodHandler.getDoDRequirements(dodTag);
        recommendations.push(`DoD validation requires: ${Object.keys(requirements).join(', ')}`);
      }
    }
    
    // Unavailable tools recommendations
    if (plan.unavailableTools && plan.unavailableTools.length > 0) {
      const alternatives = this.toolValidator.getAlternativeTools(plan.unavailableTools);
      if (alternatives.length > 0) {
        recommendations.push(`Consider alternative tools: ${alternatives.map(a => a.alternatives[0]).join(', ')}`);
      }
    }
    
    return recommendations;
  }
  
  /**
   * Validate plan completeness
   */
  validatePlan(plan) {
    const issues = [];
    
    // Check minimum dimensions
    if (plan.dimensions.length === 0) {
      issues.push('No dimensions selected');
    }
    
    // Check tool availability
    if (plan.tools.length === 0) {
      issues.push('No tools available for execution');
    }
    
    // Check scope compatibility
    const compatibility = this.toolMapper.validateDimensionScopeCompatibility(plan.dimensions, plan.scope);
    if (!compatibility.compatible) {
      issues.push(`Incompatible dimensions for scope: ${compatibility.incompatible.join(', ')}`);
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      warnings: plan.unavailableTools?.length > 0 ? ['Some tools unavailable'] : []
    };
  }
  
  /**
   * Legacy compatibility methods (maintain T-20 API)
   */
  async checkMegaLinterAvailability() {
    return await this.toolValidator.checkMegaLinterAvailability();
  }
  
  async checkSnykAvailability() {
    return await this.toolValidator.checkSnykAvailability();
  }
}

module.exports = PlanSelector;