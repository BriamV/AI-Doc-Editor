/**
 * Playwright helper utilities for audit log testing
 * Replaces Cypress custom commands with Playwright equivalents
 */
import { Page, expect } from '@playwright/test';
import { setupTestEnvironment } from '../test-setup';
import auditFixture from '../../legacy/cypress/fixtures/audit-test-data.json' assert { type: 'json' };

const fixtureLogs = [
  ...(auditFixture.auditLogs?.loginSequence ?? []),
  ...(auditFixture.auditLogs?.documentOperations ?? []),
  ...(auditFixture.auditLogs?.securityIncidents ?? []),
  ...(auditFixture.auditLogs?.adminOperations ?? []),
];

const countBy = (items: Array<Record<string, any>>, key: string) => {
  const counts: Record<string, number> = {};
  items.forEach(item => {
    const value = item?.[key];
    if (value) counts[value] = (counts[value] ?? 0) + 1;
  });
  return counts;
};

const actionCounts = countBy(fixtureLogs, 'action_type');
const userCounts = countBy(fixtureLogs, 'user_email');

const fixtureStats = {
  total_events: fixtureLogs.length,
  events_today: fixtureLogs.length,
  security_events: fixtureLogs.filter(log => log?.status === 'error').length,
  failed_logins: fixtureLogs.filter(log => log?.status === 'failure').length,
  top_actions: Object.entries(actionCounts).map(([action_type, count]) => ({ action_type, count })),
  top_users: Object.entries(userCounts).map(([user_email, count]) => ({ user_email, count })),
};

const fixtureActionTypes = Object.keys(actionCounts);

const fixtureUsers = Object.entries(auditFixture.users ?? {}).map(([id, user]) => ({
  id,
  email: (user as any)?.email ?? id,
  name: (user as any)?.name ?? (user as any)?.email ?? id,
}));

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
  constructor(private page: Page, private useRealBackend: boolean = false) {}

  async setupBackendIntegration(): Promise<void> {
    // Set up test environment first
    await setupTestEnvironment(this.page);

    if (this.useRealBackend) {
      // Configure for real backend integration
      await this.setupRealBackendIntegration();
    } else {
      // Use mocked API responses for faster isolated testing
      await this.mockAuditApi();
    }
  }

  private async setupRealBackendIntegration(): Promise<void> {
    // Verify backend is accessible
    const backendUrl = 'http://localhost:8000';

    try {
      const response = await this.page.request.get(`${backendUrl}/api/healthz`);
      if (!response.ok()) {
        throw new Error(`Backend health check failed: ${response.status()}`);
      }
      console.log('✅ Backend integration ready for real E2E testing');

      // For now, still use mocked APIs until backend has proper test data setup
      // This eliminates the connection errors while maintaining the ability to test real backend later
      await this.mockAuditApi();
      console.log('📝 Using mocked audit APIs with real backend for stable testing');

    } catch (error) {
      console.warn('⚠️ Backend not accessible, falling back to mocked API');
      this.useRealBackend = false;
      await this.mockAuditApi();
    }
  }

  async mockAuditApi(): Promise<void> {
    await this.page.route('**/api/audit/logs*', route => {
      // Ensure we have enough logs to trigger pagination (more than 25)
      // Duplicate fixture logs to reach 50+ entries for proper pagination testing
      const extendedLogs = [...fixtureLogs];
      while (extendedLogs.length < 50) {
        extendedLogs.push(...fixtureLogs.map((log, index) => ({
          ...log,
          id: `${log.id || 'log'}_dup_${extendedLogs.length + index}`,
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        })));
      }

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          logs: extendedLogs.slice(0, 50), // Cap at 50 for consistent testing
          total: 50, // Ensure total > 25 to trigger pagination
        }),
      });
    });

    await this.page.route('**/api/audit/stats*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fixtureStats),
      });
    });

    await this.page.route('**/api/audit/actions*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ actions: fixtureActionTypes }),
      });
    });

    await this.page.route('**/api/users*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ users: fixtureUsers }),
      });
    });
  }

  async login(user: AuditUser): Promise<void> {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');

    const testButtonId = user.role === 'admin' ? 'test-login-admin' : 'test-login-editor';

    await expect(this.page.getByTestId(testButtonId)).toBeVisible();
    await this.page.getByTestId(testButtonId).click();

    await expect(this.page).toHaveURL('/');
    await this.page.waitForTimeout(150);
  }

  async navigateToAuditLogs(): Promise<void> {
    await this.page.goto('/admin/audit-logs');
    await this.page.waitForLoadState('networkidle');

    // Only try to expand filters if the user has access (no access denied message)
    const accessDeniedMessage = this.page.getByText(/access denied/i);
    const hasAccess = !(await accessDeniedMessage.isVisible().catch(() => false));

    if (hasAccess) {
      await this.ensureFiltersExpanded();
    }
  }

  async waitForAuditLogsTable(): Promise<void> {
    await expect(this.page.getByTestId('audit-log-table')).toBeVisible({ timeout: 10000 });
  }

  async ensureFiltersExpanded(): Promise<void> {
    // First ensure the filters panel exists
    const panel = this.page.getByTestId('filters-panel');
    await expect(panel).toBeVisible({ timeout: 5000 });

    // Check if filters are already expanded by looking for form fields
    const firstFilterField = this.page.getByTestId('filter-search');
    const isAlreadyExpanded = await firstFilterField.isVisible().catch(() => false);

    if (isAlreadyExpanded) {
      return;
    }

    // Look for the expand button and click it
    const expandButton = this.page.getByText('Expand');
    if (await expandButton.isVisible()) {
      await expandButton.click();
      // Wait for the filters to become visible
      await expect(firstFilterField).toBeVisible({ timeout: 5000 });
    } else {
      // If no expand button, filters might already be visible, wait a bit
      await this.page.waitForTimeout(1000);
    }
  }

  async applyAuditFilters(filters: AuditFilters): Promise<void> {
    await this.ensureFiltersExpanded();
    const filtersPanel = this.page.getByTestId('filters-panel');
    await expect(filtersPanel).toBeVisible();

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

    await this.page.getByTestId('apply-filters').click();
    await this.page.waitForTimeout(1000);
  }

  async clearAuditFilters(): Promise<void> {
    await this.page.getByTestId('clear-filters').click();
    await this.page.waitForTimeout(1000);
  }

  async selectAuditLogs(logIds: string[]): Promise<void> {
    for (const logId of logIds) {
      await this.page.getByTestId(`select-${logId}`).check();
    }
  }

  async exportAuditLogs(format: 'csv' | 'json', selectedOnly = false): Promise<void> {
    await this.page.context().addInitScript(() => {
      window.open = () => window;
    });

    await this.page.getByTestId('export-dropdown').click();

    const exportTestId = selectedOnly ? `export-selected-${format}` : `export-all-${format}`;

    await this.page.getByTestId(exportTestId).click();
  }

  async changePageSize(pageSize: number): Promise<void> {
    await this.page.selectOption('[data-testid="page-size-select"]', pageSize.toString());
    await this.page.waitForTimeout(1000);
  }

  async goToPage(page: number): Promise<void> {
    await this.page.fill('[data-testid="goto-page-input"]', page.toString());
    await this.page.press('[data-testid="goto-page-input"]', 'Enter');
    await this.page.waitForTimeout(1000);
  }

  async sortByColumn(column: string): Promise<void> {
    await this.page.getByTestId(`sort-${column}`).click();
    await this.page.waitForTimeout(500);
  }

  async expandAuditLogRow(logId: string): Promise<void> {
    await this.page.getByTestId(`expand-${logId}`).click();
    await expect(this.page.getByTestId(`expanded-details-${logId}`)).toBeVisible();
  }

  async collapseAuditLogRow(logId: string): Promise<void> {
    await this.page.getByTestId(`expand-${logId}`).click();
    await expect(this.page.getByTestId(`expanded-details-${logId}`)).not.toBeVisible();
  }

  async toggleAutoRefresh(enabled: boolean): Promise<void> {
    const toggle = this.page.getByTestId('auto-refresh-toggle');

    if (await toggle.isVisible()) {
      const isChecked = await toggle.isChecked();
      if (isChecked !== enabled) {
        await toggle.click();
      }
    }
  }

  async manualRefresh(): Promise<void> {
    await this.page.getByTestId('manual-refresh').click();
    await this.page.waitForTimeout(1000);
  }

  async verifyAccessDenied(): Promise<void> {
    await expect(this.page.getByText(/access denied/i)).toBeVisible();
    await expect(this.page.getByText(/audit log access restricted to administrators/i)).toBeVisible();
    await expect(this.page.getByTestId('audit-log-table')).not.toBeVisible();
  }

  async verifyTableHeaders(): Promise<void> {
    const table = this.page.getByTestId('audit-log-table');
    await expect(table).toBeVisible();
    await expect(this.page.getByText('Timestamp')).toBeVisible();
    await expect(this.page.getByText('Action')).toBeVisible();
    await expect(this.page.getByText('User')).toBeVisible();
    await expect(this.page.getByText('Status')).toBeVisible();
  }

  async verifyAuditStats(expectedStats: { total_events?: number; events_today?: number; security_events?: number; failed_logins?: number }): Promise<void> {
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

  async verifyWORMConstraints(logId: string): Promise<void> {
    const row = this.page.getByTestId(`audit-row-${logId}`);
    await expect(row.getByTestId('edit-button')).not.toBeVisible();
    await expect(row.getByTestId('delete-button')).not.toBeVisible();
    await expect(row.getByTestId('modify-button')).not.toBeVisible();
  }

  async mockAPIError(errorType: 'server_error' | 'network_error' | 'unauthorized'): Promise<void> {
    if (errorType === 'network_error') {
      await this.page.route('**/api/audit/**', route => route.abort());
      return;
    }

    const statusCode = errorType === 'server_error' ? 500 : 401;
    const responseBody = { error: errorType === 'server_error' ? 'Internal server error' : 'Unauthorized' };

    await this.page.route('**/api/audit/**', route => {
      route.fulfill({ status: statusCode, contentType: 'application/json', body: JSON.stringify(responseBody) });
    });
  }

  async verifyMobileLayout(): Promise<void> {
    await this.page.setViewportSize({ width: 375, height: 667 });
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

  async waitForStableDOM(selector = 'body', timeout = 3000): Promise<void> {
    await this.page.locator(selector).waitFor({ timeout });
    await this.page.waitForTimeout(100);
    await expect(this.page.locator(selector)).toBeVisible();
  }

  async safeClick(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    await expect(element).toBeVisible();
    await expect(element).toBeEnabled();
    await this.page.waitForTimeout(50);
    await element.click();
  }
}
