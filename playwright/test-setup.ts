/**
 * Playwright Test Setup Utilities
 * Ensures proper test environment configuration for all tests
 */
import { Page } from '@playwright/test';

/**
 * Sets up the test environment for a page
 * Ensures test login buttons are available and proper test mode is enabled
 */
export async function setupTestEnvironment(page: Page): Promise<void> {
  // Add init script to set up test environment before any page navigation
  await page.addInitScript(() => {
    // Set up localStorage flags for test mode
    localStorage.setItem('test_mode', 'true');
    localStorage.setItem('enable_testing', 'true');

    // Set up import.meta.env for Vite compatibility
    if (typeof window !== 'undefined') {
      // Create mock import.meta.env if it doesn't exist
      if (!window.import) {
        (window as any).import = {};
      }
      if (!window.import.meta) {
        (window.import as any).meta = {};
      }
      if (!window.import.meta.env) {
        (window.import.meta as any).env = {};
      }

      // Set the crucial test environment variables
      (window.import.meta.env as any).VITE_ENABLE_TESTING = 'true';
      (window.import.meta.env as any).DEV = 'true';
      (window.import.meta.env as any).MODE = 'test';
    }

    // Also set on globalThis for broader compatibility
    if (typeof globalThis !== 'undefined') {
      if (!globalThis.import) {
        (globalThis as any).import = {};
      }
      if (!globalThis.import.meta) {
        (globalThis.import as any).meta = {};
      }
      if (!globalThis.import.meta.env) {
        (globalThis.import.meta as any).env = {};
      }

      (globalThis.import.meta.env as any).VITE_ENABLE_TESTING = 'true';
      (globalThis.import.meta.env as any).DEV = 'true';
      (globalThis.import.meta.env as any).MODE = 'test';
    }
  });
}

/**
 * Verifies that test login buttons are available on the login page
 */
export async function verifyTestLoginButtonsAvailable(page: Page, baseURL: string = 'http://localhost:5173'): Promise<boolean> {
  try {
    // Navigate to login page to check test buttons
    await page.goto(`${baseURL}/login`);
    await page.waitForLoadState('networkidle');

    // Check if both test login buttons are visible
    const adminButtonVisible = await page.getByTestId('test-login-admin').isVisible();
    const editorButtonVisible = await page.getByTestId('test-login-editor').isVisible();

    return adminButtonVisible && editorButtonVisible;
  } catch (error) {
    console.error('Error verifying test login buttons:', error);
    return false;
  }
}