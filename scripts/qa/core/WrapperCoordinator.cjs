/**
 * Wrapper Execution Coordinator - SOLID Refactored
 * T-21: Lean orchestrator for wrapper execution based on PlanSelector plan
 * 
 * Orchestrates specialized components following SOLID principles:
 * - ExecutionPlanner: Strategy planning
 * - WrapperManager: Wrapper loading and management
 * - ExecutionController: Tool execution control
 * - ResultAggregator: Result aggregation and formatting
 * 
 * Architecture §2, RNF-002 compliance
 * Absorbs wrapper execution responsibility from T-04 Orchestrator
 */

const { EventEmitter } = require('events');
const { performance } = require('perf_hooks');

const ExecutionPlanner = require('./execution/ExecutionPlanner.cjs');
const WrapperManager = require('./execution/WrapperManager.cjs');
const ExecutionController = require('./execution/ExecutionController.cjs');
const ResultAggregator = require('./execution/ResultAggregator.cjs');

class WrapperCoordinator extends EventEmitter {
  constructor(config, logger) {
    super();
    this.config = config;
    this.logger = logger;
    
    // Initialize SOLID components
    this.executionPlanner = new ExecutionPlanner(config, logger);
    this.wrapperManager = new WrapperManager(config, logger);
    this.executionController = new ExecutionController(config, logger);
    this.resultAggregator = new ResultAggregator(config, logger);
    
    // Execution state
    this.executionState = {
      currentPlan: null,
      startTime: null,
      endTime: null
    };
  }
  
  /**
   * Execute wrappers according to plan from PlanSelector
   * Main entry point for wrapper execution
   */
  async executeWrappers(plan) {
    const startTime = performance.now();
    this.executionState.startTime = startTime;
    this.executionState.currentPlan = plan;
    
    this.logger.info(`Starting wrapper execution: ${plan.tools.length} tools, ${plan.mode} mode`);
    this.logger.info(`🚀 WrapperCoordinator: Plan received with ${plan.tools.length} tools`);
    plan.tools.forEach((tool, i) => {
      this.logger.info(`🚀 Tool ${i + 1}: ${tool.name} (dimension: ${tool.dimension})`);
    });
    
    try {
      // Validate plan
      this.executionPlanner.validatePlan(plan);
      
      // Initialize wrappers
      await this.wrapperManager.initializeWrappers(plan.tools);
      
      // Plan execution strategy
      const executionGroups = this.executionPlanner.planExecutionStrategy(plan);
      this.logger.info(`🚀 WrapperCoordinator: Created ${executionGroups.length} execution groups`);
      
      // Execute groups
      const results = await this._executeGroups(executionGroups);
      
      // Aggregate results
      const executionTime = performance.now() - startTime;
      const aggregatedResults = this.resultAggregator.aggregateResults(results, executionTime);
      
      // Critical Fix: Determine success based on aggregated results, not hardcoded
      const overallSuccess = aggregatedResults.summary.failed === 0;
      
      this.executionState.endTime = performance.now();
      this.logger.info(`Wrapper execution completed in ${Math.round(executionTime)}ms`);
      
      return {
        success: overallSuccess,
        results: aggregatedResults,
        executionTime: executionTime,
        plan: plan
      };
      
    } catch (error) {
      this.executionState.endTime = performance.now();
      this.logger.error(`Wrapper execution failed: ${error.message}`);
      
      return {
        success: false,
        error: error.message,
        executionTime: performance.now() - startTime,
        plan: plan
      };
    }
  }
  
  /**
   * Execute groups sequentially, tools within groups in parallel
   */
  async _executeGroups(groups) {
    const allResults = [];
    
    // Handle empty groups gracefully
    if (groups.length === 0) {
      this.logger.warn('No execution groups - all tools may be unavailable');
      return allResults;
    }
    
    for (const group of groups) {
      this.logger.info(`Executing ${group.dimension} dimension: ${group.tools.length} tools`);
      this.logger.info(`🚀 WrapperCoordinator: Group details - parallel: ${group.parallel}, tools: ${group.tools.map(t => t.name).join(', ')}`);
      
      let groupResults;
      
      if (group.parallel && group.tools.length > 1) {
        this.logger.info(`🚀 WrapperCoordinator: Calling executeToolsInParallel for ${group.tools.length} tools`);
        groupResults = await this.executionController.executeToolsInParallel(
          group.tools, 
          this.wrapperManager
        );
      } else {
        this.logger.info(`🚀 WrapperCoordinator: Calling executeToolsSequentially for ${group.tools.length} tools`);
        groupResults = await this.executionController.executeToolsSequentially(
          group.tools, 
          this.wrapperManager
        );
      }
      
      this.logger.info(`🚀 WrapperCoordinator: Group execution completed with ${groupResults.length} results`);
      allResults.push(...groupResults);
      
      // Check for critical failures
      this.executionController.checkCriticalFailures(groupResults);
    }
    
    return allResults;
  }
  
  /**
   * Get execution status
   */
  getExecutionStatus() {
    return {
      currentPlan: this.executionState.currentPlan,
      executionTime: this.executionState.endTime 
        ? this.executionState.endTime - this.executionState.startTime
        : Date.now() - this.executionState.startTime
    };
  }
  
  /**
   * Cancel running executions
   */
  async cancelExecution() {
    this.logger.warn('Canceling wrapper execution');
    
    // Emit cancellation event for wrappers to handle
    this.emit('cancel');
    
    this.executionState.endTime = performance.now();
    
    return {
      success: true,
      message: 'Execution canceled',
      executionTime: this.executionState.endTime - this.executionState.startTime
    };
  }
}

module.exports = WrapperCoordinator;