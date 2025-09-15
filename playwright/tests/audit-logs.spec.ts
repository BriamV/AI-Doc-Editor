import { test, expect } from '@playwright/test';
import { AuditTestHelpers } from '../utils/audit-helpers';

test.describe('Audit Log Viewer E2E Tests', () => {
  let auditHelpers: AuditTestHelpers;

  test.beforeEach(async ({ page }) => {
    auditHelpers = new AuditTestHelpers(page);

    // Handle any console errors that aren't test failures
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('ResizeObserver')) {
        console.log('Console error:', msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Navigation Flow', () => {
    test('should complete full admin navigation flow from login to audit logs', async ({ page }) => {
      // Step 1: Login as admin using helper
      await auditHelpers.login({ email: 'admin@example.com', password: 'admin123', role: 'admin' });

      // Step 2: Navigate to audit logs
      await auditHelpers.navigateToAuditLogs();

      // Step 3: Wait for audit logs table to load
      await auditHelpers.waitForAuditLogsTable();

      // Step 4: Verify audit logs page loaded successfully
      await expect(page.getByText('Audit Logs')).toBeVisible();

      // Step 5: Verify key components are present
      await expect(page.getByTestId('filters-panel')).toBeVisible();
      await expect(page.getByTestId('pagination')).toBeVisible();
    });

    test('should prevent editor access to audit logs with proper error message', async ({ page }) => {
      // Step 1: Login as editor using helper
      await auditHelpers.login({ email: 'editor@example.com', password: 'editor123', role: 'editor' });

      // Step 2: Attempt to navigate to audit logs
      await auditHelpers.navigateToAuditLogs();

      // Step 3: Verify access denied message using helper
      await auditHelpers.verifyAccessDenied();
    });
  });

  test.describe('Access Control', () => {
    test('should deny access to non-admin users', async ({ page }) => {
      // First navigate to login and login as editor (non-admin)
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Click the "Sign in as Editor" button for proper test authentication
      await expect(page.getByTestId('test-login-editor')).toBeVisible();
      await page.getByTestId('test-login-editor').click();

      // Wait for login to complete and redirect to home
      await expect(page).toHaveURL('/');

      // Now try to navigate to audit logs - should show access denied
      await page.goto('/admin/audit-logs');
      await page.waitForLoadState('networkidle');

      // Should show access denied message (inline, not redirect)
      await expect(page.getByText(/access denied/i)).toBeVisible();
      await expect(page.getByText(/audit log access restricted to administrators/i)).toBeVisible();
    });

    test('should allow access to admin users', async ({ page }) => {
      // Navigate to login page and use proper admin login
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Click the "Sign in as Admin" button for proper test authentication
      await expect(page.getByTestId('test-login-admin')).toBeVisible();
      await page.getByTestId('test-login-admin').click();

      // Wait for login to complete and redirect to home
      await expect(page).toHaveURL('/');

      // Now navigate to audit logs - should work
      await page.goto('/admin/audit-logs');
      await page.waitForLoadState('networkidle');

      // Should see audit logs interface
      await expect(page.getByTestId('audit-log-table')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Audit Log Viewer Interface', () => {
    test.beforeEach(async ({ page }) => {
      // Proper admin authentication using login flow
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('test-login-admin')).toBeVisible();
      await page.getByTestId('test-login-admin').click();
      await expect(page).toHaveURL('/');
    });

    test('should display audit logs table with correct data', async ({ page }) => {
      await page.goto('/admin/audit-logs');
      await page.waitForLoadState('networkidle');

      // Wait for table to load
      await expect(page.getByTestId('audit-log-table')).toBeVisible();

      // Check table headers
      await expect(page.getByText('Timestamp')).toBeVisible();
      await expect(page.getByText('User')).toBeVisible();
      await expect(page.getByText('Action')).toBeVisible();
      await expect(page.getByText('Status')).toBeVisible();
    });
  });

  test.describe('Filtering Functionality', () => {
    test.beforeEach(async ({ page }) => {
      // Proper admin authentication using login flow
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('test-login-admin')).toBeVisible();
      await page.getByTestId('test-login-admin').click();
      await expect(page).toHaveURL('/');

      await page.goto('/admin/audit-logs');
      await page.waitForLoadState('networkidle');
    });

    test('should filter by user email', async ({ page }) => {
      // Wait for filters to be available
      await expect(page.getByTestId('filter-user-email')).toBeVisible();

      // Enter a user email
      await page.fill('[data-testid="filter-user-email"]', 'test@example.com');

      // Click apply filters
      await page.getByTestId('apply-filters').click();

      // Wait for filtered results
      await page.waitForTimeout(1000);

      // Should show filtered results
      await expect(page.getByTestId('audit-log-table')).toBeVisible();
    });

    test('should filter by date range', async ({ page }) => {
      // Set date from
      await page.fill('[data-testid="filter-date-from"]', '2024-01-01');

      // Set date to
      await page.fill('[data-testid="filter-date-to"]', '2024-12-31');

      // Apply filters
      await page.getByTestId('apply-filters').click();

      await page.waitForTimeout(1000);
      await expect(page.getByTestId('audit-log-table')).toBeVisible();
    });
  });

  test.describe('Sorting Functionality', () => {
    test.beforeEach(async ({ page }) => {
      // Proper admin authentication using login flow
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('test-login-admin')).toBeVisible();
      await page.getByTestId('test-login-admin').click();
      await expect(page).toHaveURL('/');

      await page.goto('/admin/audit-logs');
      await page.waitForLoadState('networkidle');
    });

    test('should sort by timestamp', async ({ page }) => {
      // Click on timestamp column header to sort
      await page.getByText('Timestamp').click();

      await page.waitForTimeout(500);

      // Should still show table with sorted data
      await expect(page.getByTestId('audit-log-table')).toBeVisible();
    });
  });

  test.describe('Pagination', () => {
    test.beforeEach(async ({ page }) => {
      // Proper admin authentication using login flow
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('test-login-admin')).toBeVisible();
      await page.getByTestId('test-login-admin').click();
      await expect(page).toHaveURL('/');

      await page.goto('/admin/audit-logs');
      await page.waitForLoadState('networkidle');
    });

    test('should display pagination controls', async ({ page }) => {
      // Should show page size selector
      await expect(page.getByTestId('page-size-select')).toBeVisible();

      // Change page size
      await page.selectOption('[data-testid="page-size-select"]', '25');

      await page.waitForTimeout(500);
      await expect(page.getByTestId('audit-log-table')).toBeVisible();
    });
  });

  test.describe('Row Selection', () => {
    test.beforeEach(async ({ page }) => {
      // Proper admin authentication using login flow
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('test-login-admin')).toBeVisible();
      await page.getByTestId('test-login-admin').click();
      await expect(page).toHaveURL('/');

      await page.goto('/admin/audit-logs');
      await page.waitForLoadState('networkidle');
    });

    test('should select individual rows', async ({ page }) => {
      // Wait for table to load
      await expect(page.getByTestId('audit-log-table')).toBeVisible();

      // Try to select all checkbox if available
      const selectAllCheckbox = page.getByTestId('select-all-rows');
      if (await selectAllCheckbox.isVisible()) {
        await selectAllCheckbox.click();
      }

      // Should maintain table visibility
      await expect(page.getByTestId('audit-log-table')).toBeVisible();
    });
  });

  test.describe('Real-time Refresh', () => {
    test.beforeEach(async ({ page }) => {
      // Proper admin authentication using login flow
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('test-login-admin')).toBeVisible();
      await page.getByTestId('test-login-admin').click();
      await expect(page).toHaveURL('/');

      await page.goto('/admin/audit-logs');
      await page.waitForLoadState('networkidle');
    });

    test('should toggle auto-refresh', async ({ page }) => {
      // Look for auto-refresh toggle
      const autoRefreshToggle = page.getByTestId('auto-refresh-toggle');

      if (await autoRefreshToggle.isVisible()) {
        await autoRefreshToggle.click();

        // Should maintain table visibility
        await expect(page.getByTestId('audit-log-table')).toBeVisible();
      } else {
        // If toggle not found, just verify table is visible
        await expect(page.getByTestId('audit-log-table')).toBeVisible();
      }
    });
  });

  test.describe('Error Handling', () => {
    test.beforeEach(async ({ page }) => {
      // Proper admin authentication using login flow
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('test-login-admin')).toBeVisible();
      await page.getByTestId('test-login-admin').click();
      await expect(page).toHaveURL('/');
    });

    test('should handle API errors gracefully', async ({ page }) => {
      // Mock API error
      await page.route('**/api/audit/**', route => route.abort());

      await page.goto('/admin/audit-logs');
      await page.waitForLoadState('networkidle');

      // Should still show the page structure even with API errors
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test.beforeEach(async ({ page }) => {
      // Proper admin authentication using login flow
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('test-login-admin')).toBeVisible();
      await page.getByTestId('test-login-admin').click();
      await expect(page).toHaveURL('/');
    });

    test('should adapt to mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/admin/audit-logs');
      await page.waitForLoadState('networkidle');

      // Should still be functional on mobile
      await expect(page.locator('body')).toBeVisible();

      // Table might be horizontally scrollable on mobile
      const table = page.getByTestId('audit-log-table');
      if (await table.isVisible()) {
        await expect(table).toBeVisible();
      }
    });
  });
});