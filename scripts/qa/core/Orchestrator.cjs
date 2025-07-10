/**
 * Orchestrator Core Logic - Main Coordination Hub
 * T-04: Simplified orchestrator (<150 LOC)
 * 
 * Coordinates: Context → Plan → Execute → Results
 */

class Orchestrator {
  constructor(dependencies = {}) {
    this.contextDetector = dependencies.contextDetector;
    this.planSelector = dependencies.planSelector;
    this.wrapperCoordinator = dependencies.wrapperCoordinator;
    this.logger = dependencies.logger;
    this.config = dependencies.config;
    this.startTime = Date.now();
    this.results = [];
  }
  
  async run(options = {}) {
    try {
      this.logger.info('🚀 Starting QA validation orchestration...');
      
      const context = await this._detectContext(options);
      this.logger.success(`Context: ${context.branch.name} (${context.branch.type})`);
      
      const plan = await this._selectPlan(context, options);
      this.logger.success(`Plan: ${plan.dimensions.length} dimensions`);
      
      const results = await this._executePlan(plan, context);
      this.logger.success('Execution completed');
      
      const finalResults = this._formatResults(results, context, plan);
      this.logger.info('✅ QA orchestration completed');
      return finalResults;
      
    } catch (error) {
      this.logger.error(`Orchestration failed: ${error.message}`);
      throw error;
    }
  }
  
  async _detectContext(options) {
    if (!this.contextDetector) {
      return {
        branch: { name: 'current', type: 'feature' },
        files: { modified: { all: [] }, summary: { total: 0, byStack: {} } },
        timestamp: new Date().toISOString()
      };
    }
    return this.contextDetector.detectContext();
  }
  
  async _selectPlan(context, options) {
    if (!this.planSelector) {
      return {
        dimensions: ['format', 'lint'],
        mode: options.fast ? 'fast' : 'full',
        scope: options.scope || 'all',
        context: context
      };
    }
    return this.planSelector.selectPlan(context, options);
  }
  
  async _executePlan(plan, context) {
    if (!this.wrapperCoordinator) {
      return plan.dimensions.map(dimension => ({
        dimension,
        status: 'pending',
        message: `${dimension} validation pending (WrapperCoordinator not implemented)`,
        duration: 0,
        items: []
      }));
    }
    
    // Execute wrappers using T-21 WrapperCoordinator
    const executionResult = await this.wrapperCoordinator.executeWrappers(plan);
    
    if (executionResult.success) {
      // Transform ResultAggregator output to match tree method expectations
      return this._transformResults(executionResult.results.details);
    } else {
      throw new Error(`Wrapper execution failed: ${executionResult.error}`);
    }
  }
  
  /**
   * Transform ResultAggregator results to match tree method expectations
   */
  _transformResults(details) {
    const dimensionGroups = {};
    
    // Group by dimension
    for (const detail of details) {
      if (!dimensionGroups[detail.dimension]) {
        dimensionGroups[detail.dimension] = {
          dimension: detail.dimension,
          status: 'passed',
          message: `${detail.dimension} validation`,
          duration: 0,
          items: []
        };
      }
      
      // Add tool result to dimension
      dimensionGroups[detail.dimension].items.push({
        status: detail.success ? 'passed' : 'failed',
        message: detail.error || `${detail.tool} completed successfully`,
        duration: detail.executionTime,
        details: detail.result
      });
      
      // Update dimension status and duration
      dimensionGroups[detail.dimension].duration += detail.executionTime || 0;
      if (!detail.success) {
        dimensionGroups[detail.dimension].status = 'failed';
      }
    }
    
    // Convert to array and update dimension messages
    const results = Object.values(dimensionGroups);
    for (const result of results) {
      const passed = result.items.filter(item => item.status === 'passed').length;
      const total = result.items.length;
      result.message = `${result.dimension}: ${passed}/${total} tools passed`;
    }
    
    return results;
  }
  
  _formatResults(results, context, plan) {
    const totalDuration = Date.now() - this.startTime;
    const stats = {
      total: results.length,
      passed: results.filter(r => r.status === 'passed').length,
      warnings: results.filter(r => r.status === 'warning').length,
      failed: results.filter(r => r.status === 'failed').length,
      pending: results.filter(r => r.status === 'pending').length
    };
    
    return {
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      context: {
        branch: context.branch,
        files: context.files.summary,
        scope: plan.scope,
        mode: plan.mode
      },
      plan: {
        dimensions: plan.dimensions,
        mode: plan.mode,
        scope: plan.scope
      },
      results: results,
      statistics: stats,
      status: this._determineOverallStatus(stats)
    };
  }
  
  _determineOverallStatus(stats) {
    if (stats.failed > 0) return 'failed';
    if (stats.warnings > 0) return 'warning';
    if (stats.pending > 0) return 'pending';
    return 'passed';
  }
  
  getState() {
    return {
      startTime: this.startTime,
      duration: Date.now() - this.startTime,
      results: this.results.length,
      status: 'running'
    };
  }
}

module.exports = Orchestrator;