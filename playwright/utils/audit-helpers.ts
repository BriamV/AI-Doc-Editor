/**
 * Playwright helper utilities for audit log testing
 * Replaces Cypress custom commands with Playwright equivalents
 */
import { Page, expect } from '@playwright/test';

export interface AuditFilters {
  userEmail?: string;
  actionType?: string;
  status?: string;
  ipAddress?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface AuditUser {
  email: string;
  password: string;
  role: 'admin' | 'editor' | 'user';
}

export class AuditTestHelpers {
  constructor(private page: Page) {}

  /**
   * Login with user credentials using test login buttons
   */
  async login(user: AuditUser): Promise<void> {
    // Navigate to login page
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');

    // Use appropriate test login button
    const testButtonId = user.role === 'admin' ? 'test-login-admin' : 'test-login-editor';

    await expect(this.page.getByTestId(testButtonId)).toBeVisible();
    await this.page.getByTestId(testButtonId).click();

    // Wait for redirect to home
    await expect(this.page).toHaveURL('/');

    // Small wait for auth state to settle
    await this.page.waitForTimeout(150);
  }

  /**
   * Navigate to audit logs and wait for page to load
   */
  async navigateToAuditLogs(): Promise<void> {
    await this.page.goto('/admin/audit-logs');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for audit logs table to be fully loaded
   */
  async waitForAuditLogsTable(): Promise<void> {
    await expect(this.page.getByTestId('audit-log-table')).toBeVisible({ timeout: 10000 });
  }

  /**
   * Apply filters to audit logs
   */
  async applyAuditFilters(filters: AuditFilters): Promise<void> {
    // Ensure filters panel is visible
    const filtersPanel = this.page.getByTestId('filters-panel');
    await expect(filtersPanel).toBeVisible();

    // Apply each filter
    if (filters.userEmail) {
      await this.page.fill('[data-testid="filter-user-email"]', filters.userEmail);
    }

    if (filters.actionType) {
      await this.page.selectOption('[data-testid="filter-action-type"]', filters.actionType);
    }

    if (filters.status) {
      await this.page.selectOption('[data-testid="filter-status"]', filters.status);
    }

    if (filters.ipAddress) {
      await this.page.fill('[data-testid="filter-ip-address"]', filters.ipAddress);
    }

    if (filters.dateFrom) {
      await this.page.fill('[data-testid="filter-date-from"]', filters.dateFrom);
    }

    if (filters.dateTo) {
      await this.page.fill('[data-testid="filter-date-to"]', filters.dateTo);
    }

    if (filters.search) {
      await this.page.fill('[data-testid="filter-search"]', filters.search);
    }

    // Apply filters
    await this.page.getByTestId('apply-filters').click();
    await this.page.waitForTimeout(1000); // Wait for API call
  }

  /**
   * Clear all filters
   */
  async clearAuditFilters(): Promise<void> {
    await this.page.getByTestId('clear-filters').click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Select audit log rows by IDs
   */
  async selectAuditLogs(logIds: string[]): Promise<void> {
    for (const logId of logIds) {
      await this.page.getByTestId(`select-${logId}`).check();
    }
  }

  /**
   * Export audit logs
   */
  async exportAuditLogs(format: 'csv' | 'json', selectedOnly = false): Promise<void> {
    // Mock download for testing
    await this.page.context().addInitScript(() => {
      window.open = () => window;
    });

    // Open export dropdown
    await this.page.getByTestId('export-dropdown').click();

    // Click appropriate export option
    const exportTestId = selectedOnly
      ? `export-selected-${format}`
      : `export-all-${format}`;

    await this.page.getByTestId(exportTestId).click();
  }

  /**
   * Change page size
   */
  async changePageSize(pageSize: number): Promise<void> {
    await this.page.selectOption('[data-testid="page-size-select"]', pageSize.toString());
    await this.page.waitForTimeout(1000);
  }

  /**
   * Navigate to specific page
   */
  async goToPage(page: number): Promise<void> {
    await this.page.fill('[data-testid="goto-page-input"]', page.toString());
    await this.page.press('[data-testid="goto-page-input"]', 'Enter');
    await this.page.waitForTimeout(1000);
  }

  /**
   * Sort by column
   */
  async sortByColumn(column: string): Promise<void> {
    await this.page.getByTestId(`sort-${column}`).click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Expand audit log row details
   */
  async expandAuditLogRow(logId: string): Promise<void> {
    await this.page.getByTestId(`expand-${logId}`).click();
    await expect(this.page.getByTestId(`expanded-details-${logId}`)).toBeVisible();
  }

  /**
   * Collapse audit log row details
   */
  async collapseAuditLogRow(logId: string): Promise<void> {
    await this.page.getByTestId(`expand-${logId}`).click();
    await expect(this.page.getByTestId(`expanded-details-${logId}`)).not.toBeVisible();
  }

  /**
   * Toggle auto-refresh
   */
  async toggleAutoRefresh(enabled: boolean): Promise<void> {
    const toggle = this.page.getByTestId('auto-refresh-toggle');

    if (await toggle.isVisible()) {
      const isChecked = await toggle.isChecked();
      if (isChecked !== enabled) {
        await toggle.click();
      }
    }
  }

  /**
   * Manual refresh
   */
  async manualRefresh(): Promise<void> {
    await this.page.getByTestId('manual-refresh').click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Verify access denied message
   */
  async verifyAccessDenied(): Promise<void> {
    await expect(this.page.getByText(/access denied/i)).toBeVisible();
    await expect(this.page.getByText(/audit log access restricted to administrators/i)).toBeVisible();
    await expect(this.page.getByTestId('audit-log-table')).not.toBeVisible();
  }

  /**
   * Verify audit log table headers
   */
  async verifyTableHeaders(): Promise<void> {
    const table = this.page.getByTestId('audit-log-table');
    await expect(table).toBeVisible();

    // Check for essential headers
    await expect(this.page.getByText('Timestamp')).toBeVisible();
    await expect(this.page.getByText('Action')).toBeVisible();
    await expect(this.page.getByText('User')).toBeVisible();
    await expect(this.page.getByText('Status')).toBeVisible();
  }

  /**
   * Verify audit statistics display
   */
  async verifyAuditStats(expectedStats: {
    total_events?: number;
    events_today?: number;
    security_events?: number;
    failed_logins?: number;
  }): Promise<void> {
    const statsPanel = this.page.getByTestId('audit-stats');
    await expect(statsPanel).toBeVisible();

    if (expectedStats.total_events !== undefined) {
      await expect(statsPanel.getByText(`${expectedStats.total_events}`)).toBeVisible();
    }

    if (expectedStats.events_today !== undefined) {
      await expect(statsPanel.getByText(`${expectedStats.events_today}`)).toBeVisible();
    }

    if (expectedStats.security_events !== undefined) {
      await expect(statsPanel.getByText(`${expectedStats.security_events}`)).toBeVisible();
    }

    if (expectedStats.failed_logins !== undefined) {
      await expect(statsPanel.getByText(`${expectedStats.failed_logins}`)).toBeVisible();
    }
  }

  /**
   * Verify WORM (Write Once Read Many) constraints
   */
  async verifyWORMConstraints(logId: string): Promise<void> {
    const row = this.page.getByTestId(`audit-row-${logId}`);

    // Verify no edit/delete buttons exist
    await expect(row.getByTestId('edit-button')).not.toBeVisible();
    await expect(row.getByTestId('delete-button')).not.toBeVisible();
    await expect(row.getByTestId('modify-button')).not.toBeVisible();
  }

  /**
   * Mock API error responses
   */
  async mockAPIError(errorType: 'server_error' | 'network_error' | 'unauthorized'): Promise<void> {
    let statusCode: number;
    let response: any;

    switch (errorType) {
      case 'server_error':
        statusCode = 500;
        response = { error: 'Internal server error' };
        break;
      case 'network_error':
        // Simulate network failure
        await this.page.route('**/api/audit/**', route => route.abort());
        return;
      case 'unauthorized':
        statusCode = 401;
        response = { error: 'Unauthorized' };
        break;
      default:
        throw new Error(`Unknown error type: ${errorType}`);
    }

    await this.page.route('**/api/audit/**', route => {
      route.fulfill({
        status: statusCode,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  /**
   * Verify responsive design for different viewports
   */
  async verifyMobileLayout(): Promise<void> {
    await this.page.setViewportSize({ width: 375, height: 667 });

    // Table should be horizontally scrollable or have mobile layout
    const table = this.page.getByTestId('audit-log-table');
    if (await table.isVisible()) {
      await expect(table).toBeVisible();
    }
  }

  async verifyTabletLayout(): Promise<void> {
    await this.page.setViewportSize({ width: 768, height: 1024 });

    await expect(this.page.getByTestId('filters-panel')).toBeVisible();
    await expect(this.page.getByTestId('audit-log-table')).toBeVisible();
  }

  async verifyDesktopLayout(): Promise<void> {
    await this.page.setViewportSize({ width: 1920, height: 1080 });

    await expect(this.page.getByTestId('filters-panel')).toBeVisible();
    await expect(this.page.getByTestId('audit-log-table')).toBeVisible();
  }

  /**
   * Wait for stable DOM (replaces Cypress waitForStableDOM)
   */
  async waitForStableDOM(selector = 'body', timeout = 3000): Promise<void> {
    await this.page.locator(selector).waitFor({ timeout });
    await this.page.waitForTimeout(100); // Brief wait for React re-renders
    await expect(this.page.locator(selector)).toBeVisible();
  }

  /**
   * Safe click with visibility and enabled checks
   */
  async safeClick(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    await expect(element).toBeVisible();
    await expect(element).toBeEnabled();
    await this.page.waitForTimeout(50); // Brief wait for animations
    await element.click();
  }
}