#!/usr/bin/env node
/**
 * QA CLI - Point of Entry for QA System (Refactored)
 * T-02: CLI Core & Help implementation
 * 
 * This module implements the main CLI interface for the QA system
 * according to RF-001 and RF-009 requirements from PRD-QA CLI.md
 * 
 * Conservative refactoring: delegates to 4 specialized classes
 * Maintains exact same API as original 584-line version
 */

const CLIRunner = require('./cli/CLIRunner.cjs');

/**
 * Main entry point - delegates to CLIRunner
 */
async function main() {
  const runner = new CLIRunner();
  await runner.run();
}

// Export functions for testing (maintain exact same API)
const ArgumentParser = require('./cli/ArgumentParser.cjs');
const QAOrchestrator = require('./cli/QAOrchestrator.cjs');
const ErrorHandler = require('./cli/ErrorHandler.cjs');

// Legacy function exports for backward compatibility
async function createCLI() {
  const runner = new CLIRunner();
  return await runner.createCLI();
}

async function runQAValidation(argv) {
  const orchestrator = new QAOrchestrator();
  return await orchestrator.runQAValidation(argv);
}

async function showDetailedHelp(command) {
  const runner = new CLIRunner();
  return await runner.showDetailedHelp(command);
}

// Export for testing (exact same interface as original)
module.exports = {
  createCLI,
  runQAValidation,
  showDetailedHelp
};

// Run CLI if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('CLI Error:', error);
    process.exit(1);
  });
}