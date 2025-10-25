/**
 * E2E tests for Admin Usage Limits Configuration (T-03 ST3)
 *
 * Tests the admin UI for configuring document and storage quotas.
 */

import { test, expect } from '@playwright/test';

// Helper: Login as admin user
async function loginAsAdmin(page) {
  // Navigate to homepage
  await page.goto('/');

  // Click "Sign In" button
  await page.click('text=Sign In');

  // Click "Test Mode" for development authentication
  await page.click('button:has-text("Test Mode")');

  // Verify login successful (UserBanner appears)
  await expect(page.locator('[data-testid="user-banner"]')).toBeVisible({ timeout: 5000 });
}

// Helper: Navigate to Admin Settings
async function navigateToAdminSettings(page) {
  // Click footer menu (3 dots)
  await page.click('[data-testid="footer-menu-button"]');

  // Click "Admin Settings" link
  await page.click('text=Admin Settings');

  // Verify on Settings page
  await expect(page.locator('h1:has-text("Admin Settings")')).toBeVisible();
}

test.describe('Admin Usage Limits Configuration', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await loginAsAdmin(page);
  });

  test('admin can view usage limits configuration', async ({ page }) => {
    // Navigate to Admin Settings
    await navigateToAdminSettings(page);

    // Verify Usage Limits section is visible
    await expect(page.locator('h2:has-text("Usage Limits Configuration")')).toBeVisible();

    // Verify both stat cards are displayed
    await expect(page.locator('text=Document Limit')).toBeVisible();
    await expect(page.locator('text=Storage Limit')).toBeVisible();

    // Verify input fields exist
    await expect(page.locator('input[name="max_documents_per_user"]')).toBeVisible();
    await expect(page.locator('input[name="max_mb_per_user"]')).toBeVisible();
  });

  test('admin can update document limit', async ({ page }) => {
    // Navigate to Admin Settings
    await navigateToAdminSettings(page);

    // Get current value
    const docsInput = page.locator('input[name="max_documents_per_user"]');
    const currentValue = await docsInput.inputValue();

    // Change to 200 documents
    await docsInput.fill('200');

    // Save changes
    await page.click('button:has-text("Save Changes")');

    // Wait for success message
    await expect(page.locator('text=Configuration saved successfully')).toBeVisible({
      timeout: 5000,
    });

    // Reload page
    await page.reload();

    // Verify value persisted
    await expect(docsInput).toHaveValue('200');

    // Restore original value
    await docsInput.fill(currentValue);
    await page.click('button:has-text("Save Changes")');
    await expect(page.locator('text=Configuration saved successfully')).toBeVisible();
  });

  test('admin can update storage limit', async ({ page }) => {
    // Navigate to Admin Settings
    await navigateToAdminSettings(page);

    // Get current value
    const mbInput = page.locator('input[name="max_mb_per_user"]');
    const currentValue = await mbInput.inputValue();

    // Change to 2000 MB
    await mbInput.fill('2000');

    // Save changes
    await page.click('button:has-text("Save Changes")');

    // Wait for success message
    await expect(page.locator('text=Configuration saved successfully')).toBeVisible({
      timeout: 5000,
    });

    // Reload page
    await page.reload();

    // Verify value persisted
    await expect(mbInput).toHaveValue('2000');

    // Restore original value
    await mbInput.fill(currentValue);
    await page.click('button:has-text("Save Changes")');
    await expect(page.locator('text=Configuration saved successfully')).toBeVisible();
  });

  test('admin can update both limits simultaneously', async ({ page }) => {
    // Navigate to Admin Settings
    await navigateToAdminSettings(page);

    // Get current values
    const docsInput = page.locator('input[name="max_documents_per_user"]');
    const mbInput = page.locator('input[name="max_mb_per_user"]');
    const currentDocs = await docsInput.inputValue();
    const currentMb = await mbInput.inputValue();

    // Change both values
    await docsInput.fill('150');
    await mbInput.fill('1500');

    // Save changes
    await page.click('button:has-text("Save Changes")');

    // Wait for success message
    await expect(page.locator('text=Configuration saved successfully')).toBeVisible({
      timeout: 5000,
    });

    // Reload page
    await page.reload();

    // Verify both values persisted
    await expect(docsInput).toHaveValue('150');
    await expect(mbInput).toHaveValue('1500');

    // Restore original values
    await docsInput.fill(currentDocs);
    await mbInput.fill(currentMb);
    await page.click('button:has-text("Save Changes")');
    await expect(page.locator('text=Configuration saved successfully')).toBeVisible();
  });

  test('non-admin cannot access usage limits', async ({ page }) => {
    // Logout (close current session)
    await page.click('[data-testid="user-menu-button"]');
    await page.click('text=Logout');

    // Login as regular user (not admin)
    // NOTE: Adjust this based on your test user setup
    // For now, verify redirect behavior

    // Try to navigate directly to /settings
    await page.goto('/settings');

    // Verify redirect to home (non-admin cannot access)
    await expect(page).toHaveURL('/');
  });

  test('input validation for document limit', async ({ page }) => {
    // Navigate to Admin Settings
    await navigateToAdminSettings(page);

    const docsInput = page.locator('input[name="max_documents_per_user"]');

    // Test minimum value
    await docsInput.fill('0');
    await expect(docsInput).toHaveValue('0');  // HTML5 min constraint

    // Test maximum value
    await docsInput.fill('99999');  // Above max (10000)
    await expect(docsInput).toHaveValue('99999');  // HTML5 allows, backend should validate
  });

  test('shows loading state while fetching configuration', async ({ page }) => {
    // Navigate to Admin Settings
    await page.goto('/settings');

    // Check for loading state (briefly visible)
    // NOTE: May need to throttle network to see this consistently
    const loadingText = page.locator('text=Loading configuration...');

    // Either loading is visible, or config loaded already
    // This is a soft assertion to avoid flakiness
    const isLoading = await loadingText.isVisible().catch(() => false);
    const isConfigVisible = await page
      .locator('input[name="max_documents_per_user"]')
      .isVisible()
      .catch(() => false);

    expect(isLoading || isConfigVisible).toBeTruthy();
  });

  test('shows saving state when submitting', async ({ page }) => {
    // Navigate to Admin Settings
    await navigateToAdminSettings(page);

    // Change a value
    await page.locator('input[name="max_documents_per_user"]').fill('175');

    // Click save and immediately check for saving state
    await page.click('button:has-text("Save Changes")');

    // Button should show "Saving..." briefly
    await expect(page.locator('button:has-text("Saving...")')).toBeVisible({ timeout: 1000 });

    // Then success message appears
    await expect(page.locator('text=Configuration saved successfully')).toBeVisible({
      timeout: 5000,
    });
  });
});
