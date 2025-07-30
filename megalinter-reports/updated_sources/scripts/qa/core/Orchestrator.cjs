/**
 * Orchestrator Core Logic - Main Coordination Hub
 * T-04: Simplified orchestrator (198 LOC, complies RNF-001 <212 LOC)
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
    
    // Critical Fix: Process results regardless of success/failure - failures are valid results, not errors
    if (executionResult.results) {
      // Transform ResultAggregator output to match tree method expectations
      return this._transformResults(executionResult.results.details);
    } else {
      // Only throw error for actual execution failures (no results), not validation failures
      throw new Error(`Wrapper execution failed: ${executionResult.error || 'No results returned'}`);
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
          success: true,
          message: `${detail.dimension} validation`,
          duration: 0,
          items: []
        };
      }
      
      // Add tool result to dimension
      dimensionGroups[detail.dimension].items.push({
        status: detail.success ? 'passed' : 'failed',
        success: detail.success,
        message: detail.success ? `${detail.tool} completed successfully` : (detail.error || `${detail.tool} failed`),
        duration: detail.executionTime,
        details: detail.result
      });
      
      // Update dimension status and duration
      dimensionGroups[detail.dimension].duration += detail.executionTime || 0;
      if (!detail.success) {
        dimensionGroups[detail.dimension].status = 'failed';
        dimensionGroups[detail.dimension].success = false;
      }
    }
    
    // Convert to array and update dimension messages
    const results = Object.values(dimensionGroups);
    for (const result of results) {
      const passed = result.items.filter(item => item.success === true).length;
      const failed = result.items.filter(item => item.success === false).length;
      const total = result.items.length;
      
      // Critical Fix: Correct logic for determining success
      // Success only if ALL tools passed, not just if none explicitly failed
      if (failed > 0) {
        result.message = `${result.dimension}: ${failed}/${total} tools failed`;
        result.success = false;
      } else if (passed === total && total > 0) {
        result.message = `${result.dimension}: ${passed}/${total} tools passed`;
        result.success = true;
      } else {
        // Handle edge case: no explicit failures but also not all passed
        result.message = `${result.dimension}: ${passed}/${total} tools completed (incomplete results)`;
        result.success = false;
      }
    }
    
    return results;
  }
  
  _formatResults(results, context, plan) {
    const totalDuration = Date.now() - this.startTime;
    
    // Critical Fix: Count actual tool results correctly
    const stats = {
      total: results.length,
      passed: results.filter(result => result.success === true).length,
      warnings: results.filter(result => result.success === true && result.status === 'warning').length,
      failed: results.filter(result => result.success === false).length,
      pending: results.filter(result => result.status === 'pending').length
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