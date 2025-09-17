/**
 * Playwright Global Teardown
 * Cleanup after all tests complete
 */
import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting Playwright global teardown...');

  // Perform any global cleanup here
  // For example, cleaning up test databases, stopping services, etc.

  console.log('✅ Playwright global teardown complete');
}

export default globalTeardown;