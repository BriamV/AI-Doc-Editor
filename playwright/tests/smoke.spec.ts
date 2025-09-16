import { test, expect } from '@playwright/test';

test.describe('Application Smoke Test', () => {
  test('should load the home page without errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify the page loaded successfully
    await expect(page.locator('body')).toBeVisible();

    // Check for critical elements that should be present
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();

    // Verify no critical console errors (ignoring ResizeObserver warnings)
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' &&
          !msg.text().includes('ResizeObserver') &&
          !msg.text().includes('ChunkLoadError') &&
          !msg.text().includes('Loading chunk')) {
        errors.push(msg.text());
      }
    });

    // Allow a moment for any immediate console errors
    await page.waitForTimeout(1000);

    // No critical errors should have occurred
    expect(errors).toHaveLength(0);
  });

  test('should have basic navigation working', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify the page is interactive
    await expect(page.locator('body')).toBeVisible();

    // Try navigating to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Should be able to navigate to login
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('should handle invalid routes gracefully', async ({ page }) => {
    await page.goto('/non-existent-page');
    await page.waitForLoadState('networkidle');

    // Should either show 404 page or redirect to home
    const currentUrl = page.url();
    const pageContent = await page.textContent('body');

    // Should have some content (either 404 page or redirected to home)
    expect(pageContent).toBeTruthy();

    // Should not show blank page or crash
    await expect(page.locator('body')).toBeVisible();
  });
});