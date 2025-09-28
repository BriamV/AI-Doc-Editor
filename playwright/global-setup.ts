/**
 * Playwright Global Setup
 * Handles global configuration and setup before running tests
 */
import { chromium, FullConfig } from '@playwright/test';
import { setupTestEnvironment, verifyTestLoginButtonsAvailable } from './test-setup';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Playwright global setup...');

  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Check if development server is running
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:5173';
    console.log(`🔍 Checking if dev server is running at ${baseURL}...`);

    await page.goto(baseURL, { timeout: 30000 });
    console.log('✅ Development server is ready');

    // Pre-warm the application and enable test mode
    console.log('🔥 Pre-warming application...');

    // Set up test environment
    await setupTestEnvironment(page);

    // Visit key pages to ensure they load properly
    await page.goto(`${baseURL}/login`);
    await page.waitForLoadState('networkidle');

    // Verify test login buttons are available
    const testButtonsAvailable = await verifyTestLoginButtonsAvailable(page, baseURL);
    if (testButtonsAvailable) {
      console.log('✅ Test login buttons are available');
    } else {
      console.log('⚠️ Test login buttons not visible, might need dev server restart');
    }

    console.log('✅ Application pre-warming complete');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log('✅ Playwright global setup complete');
}

export default globalSetup;