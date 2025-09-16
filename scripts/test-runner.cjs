#!/usr/bin/env node

/**
 * Test Runner Script for E2E Testing
 * Supports both Cypress and Playwright with automatic framework detection
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const framework = args[0] || 'auto';
const testFile = args[1];

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath) {
  return fs.existsSync(path.join(process.cwd(), filePath));
}

function runCommand(command, description) {
  log(`\n${colors.bold}${description}${colors.reset}`, 'cyan');
  log(`Running: ${command}`, 'blue');

  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    return true;
  } catch (error) {
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

function detectFramework() {
  if (checkFileExists('playwright.config.ts') && checkFileExists('playwright/tests')) {
    return 'playwright';
  } else if (checkFileExists('cypress.config.ts') && checkFileExists('cypress/e2e')) {
    return 'cypress';
  } else {
    log('No E2E testing framework detected. Please set up Cypress or Playwright.', 'red');
    process.exit(1);
  }
}

function runCypress(specificTest = null) {
  log('\n🌲 Running Cypress Tests', 'green');

  const cypressCommand = specificTest
    ? `yarn cypress run --spec "cypress/e2e/${specificTest}"`
    : 'yarn test:e2e';

  return runCommand(cypressCommand, 'Running Cypress E2E Tests');
}

function runPlaywright(specificTest = null) {
  log('\n🎭 Running Playwright Tests', 'green');

  const playwrightCommand = specificTest
    ? `yarn playwright test ${specificTest}`
    : 'yarn test:playwright';

  return runCommand(playwrightCommand, 'Running Playwright E2E Tests');
}

function showUsage() {
  log('\n📖 E2E Test Runner Usage:', 'cyan');
  log('  node scripts/test-runner.cjs [framework] [test-file]', 'blue');
  log('\nFramework options:', 'yellow');
  log('  auto       - Auto-detect framework (default)', 'blue');
  log('  cypress    - Run Cypress tests', 'blue');
  log('  playwright - Run Playwright tests', 'blue');
  log('  both       - Run both frameworks for comparison', 'blue');
  log('\nExamples:', 'yellow');
  log('  node scripts/test-runner.cjs', 'blue');
  log('  node scripts/test-runner.cjs cypress audit-logs.cy.ts', 'blue');
  log('  node scripts/test-runner.cjs playwright audit-logs.spec.ts', 'blue');
  log('  node scripts/test-runner.cjs both', 'blue');
}

function runBothFrameworks(testFile = null) {
  log('\n🚀 Running Both Testing Frameworks for Comparison', 'magenta');

  let cypressResult = false;
  let playwrightResult = false;

  // Run Cypress first
  if (checkFileExists('cypress.config.ts')) {
    log('\n--- Testing with Cypress ---', 'yellow');
    cypressResult = runCypress(testFile);
  } else {
    log('Cypress not configured, skipping...', 'yellow');
  }

  // Run Playwright second
  if (checkFileExists('playwright.config.ts')) {
    log('\n--- Testing with Playwright ---', 'yellow');
    playwrightResult = runPlaywright(testFile);
  } else {
    log('Playwright not configured, skipping...', 'yellow');
  }

  // Summary
  log('\n📊 Framework Comparison Results:', 'cyan');
  log(`Cypress:    ${cypressResult ? '✅ PASSED' : '❌ FAILED'}`, cypressResult ? 'green' : 'red');
  log(`Playwright: ${playwrightResult ? '✅ PASSED' : '❌ FAILED'}`, playwrightResult ? 'green' : 'red');

  if (!cypressResult && !playwrightResult) {
    log('\n❌ Both frameworks failed. Check your tests and configuration.', 'red');
    process.exit(1);
  } else if (!cypressResult) {
    log('\n⚠️  Cypress failed but Playwright passed. Consider migrating to Playwright.', 'yellow');
  } else if (!playwrightResult) {
    log('\n⚠️  Playwright failed but Cypress passed. Check Playwright configuration.', 'yellow');
  } else {
    log('\n🎉 Both frameworks passed! Your tests are solid.', 'green');
  }
}

function main() {
  log('🧪 AI Doc Editor - E2E Test Runner', 'cyan');
  log('=' * 50, 'cyan');

  if (framework === 'help' || framework === '-h' || framework === '--help') {
    showUsage();
    return;
  }

  switch (framework) {
    case 'auto':
      const detectedFramework = detectFramework();
      log(`Auto-detected framework: ${detectedFramework}`, 'green');
      if (detectedFramework === 'cypress') {
        runCypress(testFile);
      } else {
        runPlaywright(testFile);
      }
      break;

    case 'cypress':
      if (!checkFileExists('cypress.config.ts')) {
        log('Cypress not configured. Run: yarn add -D cypress', 'red');
        process.exit(1);
      }
      runCypress(testFile);
      break;

    case 'playwright':
      if (!checkFileExists('playwright.config.ts')) {
        log('Playwright not configured. Run: yarn add -D @playwright/test', 'red');
        process.exit(1);
      }
      runPlaywright(testFile);
      break;

    case 'both':
      runBothFrameworks(testFile);
      break;

    default:
      log(`Unknown framework: ${framework}`, 'red');
      showUsage();
      process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  log('\n\n🛑 Test runner interrupted by user', 'yellow');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('\n\n🛑 Test runner terminated', 'yellow');
  process.exit(0);
});

if (require.main === module) {
  main();
}