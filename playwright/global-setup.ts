/**
 * Playwright Global Setup
 * Handles global configuration and setup before running tests
 */
import { chromium, FullConfig } from '@playwright/test';

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

    // Pre-warm the application
    console.log('🔥 Pre-warming application...');

    // Visit key pages to ensure they load properly
    await page.goto(`${baseURL}/login`);
    await page.waitForLoadState('networkidle');

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