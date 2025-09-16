/**
 * Cypress support commands for audit log testing
 * Custom commands to simplify audit log E2E tests
 */

/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login with user credentials
       * @param user - User object with email, password, and role
       */
      login(user: { email: string; password: string; role: string }): Chainable<void>;

      /**
       * Mock audit log API responses
       * @param scenario - Test scenario name from fixtures
       */
      mockAuditLogAPI(scenario?: string): Chainable<void>;

      /**
       * Wait for audit logs to load
       */
      waitForAuditLogs(): Chainable<void>;

      /**
       * Apply audit log filters
       * @param filters - Filter configuration object
       */
      applyAuditFilters(filters: {
        userEmail?: string;
        actionType?: string;
        status?: string;
        ipAddress?: string;
        dateFrom?: string;
        dateTo?: string;
        search?: string;
      }): Chainable<void>;

      /**
       * Select audit log rows
       * @param logIds - Array of log IDs to select
       */
      selectAuditLogs(logIds: string[]): Chainable<void>;

      /**
       * Export audit logs
       * @param format - Export format ('csv' or 'json')
       * @param selectedOnly - Whether to export only selected logs
       */
      exportAuditLogs(format: 'csv' | 'json', selectedOnly?: boolean): Chainable<void>;

      /**
       * Change audit log page size
       * @param pageSize - Number of logs per page
       */
      changeAuditPageSize(pageSize: number): Chainable<void>;

      /**
       * Navigate to specific audit log page
       * @param page - Page number
       */
      goToAuditPage(page: number): Chainable<void>;

      /**
       * Sort audit logs by column
       * @param column - Column name to sort by
       * @param direction - Sort direction ('asc' or 'desc')
       */
      sortAuditLogs(column: string, direction?: 'asc' | 'desc'): Chainable<void>;

      /**
       * Expand audit log row details
       * @param logId - Log ID to expand
       */
      expandAuditLogRow(logId: string): Chainable<void>;

      /**
       * Verify audit log table contains expected data
       * @param expectedData - Array of expected log entries
       */
      verifyAuditLogData(expectedData: any[]): Chainable<void>;

      /**
       * Verify audit statistics
       * @param expectedStats - Expected statistics object
       */
      verifyAuditStats(expectedStats: any): Chainable<void>;

      /**
       * Clear all audit log filters
       */
      clearAuditFilters(): Chainable<void>;

      /**
       * Toggle auto-refresh for audit logs
       * @param enabled - Whether to enable auto-refresh
       */
      toggleAuditAutoRefresh(enabled: boolean): Chainable<void>;

      /**
       * Verify access denied message is shown
       */
      verifyAuditAccessDenied(): Chainable<void>;

      /**
       * Verify audit log WORM constraints
       * @param logId - Log ID to test modification attempts
       */
      verifyWORMConstraints(logId: string): Chainable<void>;

      /**
       * Mock API error responses for audit endpoints
       * @param errorType - Key of error scenario in fixtures
       */
      mockAuditAPIError(errorType: string): Chainable<void>;

      /**
       * Verify responsive layouts
       */
      verifyMobileLayout(): Chainable<void>;
      verifyTabletLayout(): Chainable<void>;
      verifyDesktopLayout(): Chainable<void>;
    }
  }
}

/**
 * Login command with support for different user roles
 * Uses window.app.login test interface instead of form-based login
 */
Cypress.Commands.add('login', (user: { email: string; password: string; role: string }) => {
  // Mock user profile API (for any component that queries profile)
  cy.intercept('GET', '/api/auth/me', {
    statusCode: 200,
    body: {
      email: user.email,
      role: user.role,
      name: user.email.split('@')[0],
      id: 1
    }
  }).as('getProfile');

  // Use Test Login UI (Dev/Test Only) to avoid external providers
  cy.visit('/login');
  const isAdmin = user.role === 'admin';
  const testBtn = isAdmin ? '[data-testid="test-login-admin"]' : '[data-testid="test-login-editor"]';

  // Wait for window.app to be exposed and button to be present
  cy.window({ log: false }).should('have.property', 'app');
  cy.get(testBtn, { timeout: 10000 }).should('be.visible').click();

  // Validate that tokens/role are present and we landed on /
  cy.url({ timeout: 10000 }).should('match', /\/($|\?)/);
  cy.window({ timeout: 10000 }).then((win) => {
    expect(win.localStorage.getItem('auth_token')).to.exist;
    // Map any non-admin role to 'editor' in tests
    const expectedRole = isAdmin ? 'admin' : 'editor';
    expect(win.localStorage.getItem('user_role')).to.eq(expectedRole);
  });

  // Small wait to ensure guards/process finish
  cy.wait(150);
});

/**
 * Mock audit log API responses with different scenarios
 */
Cypress.Commands.add('mockAuditLogAPI', (scenario: string = 'default') => {
  cy.fixture('audit-test-data.json').then((testData) => {
    let logsData;
    let statsData = testData.auditStats.current;

    // Select logs based on scenario
    switch (scenario) {
      case 'loginSequence':
        logsData = testData.auditLogs.loginSequence;
        break;
      case 'documentOperations':
        logsData = testData.auditLogs.documentOperations;
        break;
      case 'securityIncidents':
        logsData = testData.auditLogs.securityIncidents;
        break;
      case 'adminOperations':
        logsData = testData.auditLogs.adminOperations;
        break;
      case 'mixedStatus':
        logsData = testData.auditLogs.mixedStatusEvents;
        break;
      case 'empty':
        logsData = [];
        statsData = { ...statsData, total_events: 0 };
        break;
      default:
        // Combine all logs for default scenario
        logsData = [
          ...testData.auditLogs.loginSequence,
          ...testData.auditLogs.documentOperations,
          ...testData.auditLogs.securityIncidents,
          ...testData.auditLogs.adminOperations,
          ...testData.auditLogs.mixedStatusEvents
        ];
    }

    // Mock audit logs API
    cy.intercept('GET', '/api/audit/logs*', {
      statusCode: 200,
      body: {
        logs: logsData,
        total_count: logsData.length,
        page: 1,
        page_size: 25,
        total_pages: Math.ceil(logsData.length / 25),
        has_next: logsData.length > 25,
        has_previous: false
      }
    }).as('getAuditLogs');

    // Mock audit stats API
    cy.intercept('GET', '/api/audit/stats', {
      statusCode: 200,
      body: statsData
    }).as('getAuditStats');

    // Mock action types API
    cy.intercept('GET', '/api/audit/actions', {
      statusCode: 200,
      body: { actions: testData.actionTypes }
    }).as('getActionTypes');

    // Mock users API
    cy.intercept('GET', '/api/users', {
      statusCode: 200,
      body: { users: testData.usersList }
    }).as('getUsers');
  });
});

/**
 * Wait for audit logs to load completely with stability checks
 */
Cypress.Commands.add('waitForAuditLogs', () => {
  // Wait for API calls to complete
  cy.wait('@getAuditLogs', { timeout: 15000 });
  cy.wait('@getAuditStats', { timeout: 10000 });

  // Ensure table is visible and stable
  cy.waitForStableDOM('[data-testid="audit-log-table"]');
  cy.get('[data-testid="audit-log-table"]').should('be.visible');

  // Ensure loading states are cleared
  cy.get('[data-testid="loading-indicator"]').should('not.exist');

  // Additional stability check - wait for any animations to complete
  cy.wait(200);
});

/**
 * Apply filters to audit logs
 */
Cypress.Commands.add('applyAuditFilters', (filters) => {
  // Open filters panel if not already open
  cy.get('[data-testid="filters-panel"]').then(($panel) => {
    if (!$panel.is(':visible')) {
      cy.get('[data-testid="toggle-filters"]').click();
    }
  });

  // Apply each filter
  if (filters.userEmail) {
    cy.get('[data-testid="filter-user-email"]').clear().type(filters.userEmail);
  }

  if (filters.actionType) {
    cy.get('[data-testid="filter-action-type"]').select(filters.actionType);
  }

  if (filters.status) {
    cy.get('[data-testid="filter-status"]').select(filters.status);
  }

  if (filters.ipAddress) {
    cy.get('[data-testid="filter-ip-address"]').clear().type(filters.ipAddress);
  }

  if (filters.dateFrom) {
    cy.get('[data-testid="filter-date-from"]').clear().type(filters.dateFrom);
  }

  if (filters.dateTo) {
    cy.get('[data-testid="filter-date-to"]').clear().type(filters.dateTo);
  }

  if (filters.search) {
    cy.get('[data-testid="filter-search"]').clear().type(filters.search);
  }

  // Apply filters
  cy.get('[data-testid="apply-filters"]').click();
  cy.wait('@getAuditLogs');
});

/**
 * Select specific audit log rows
 */
Cypress.Commands.add('selectAuditLogs', (logIds: string[]) => {
  logIds.forEach(logId => {
    cy.get(`[data-testid="select-${logId}"]`).check();
  });
});

/**
 * Export audit logs
 */
Cypress.Commands.add('exportAuditLogs', (format: 'csv' | 'json', selectedOnly = false) => {
  // Mock file download
  cy.window().then((win) => {
    cy.stub(win, 'open').as('downloadFile');
  });

  // Open export dropdown
  cy.get('[data-testid="export-dropdown"]').click();

  // Click appropriate export option
  if (selectedOnly) {
    cy.get(`[data-testid="export-selected-${format}"]`).click();
  } else {
    cy.get(`[data-testid="export-all-${format}"]`).click();
  }

  // Verify download was triggered
  cy.get('@downloadFile').should('have.been.called');
});

/**
 * Change page size for audit logs
 */
Cypress.Commands.add('changeAuditPageSize', (pageSize: number) => {
  cy.get('[data-testid="page-size-select"]').select(pageSize.toString());
  cy.wait('@getAuditLogs');
});

/**
 * Navigate to specific page
 */
Cypress.Commands.add('goToAuditPage', (page: number) => {
  cy.get('[data-testid="goto-page-input"]').clear().type(`${page}{enter}`);
  cy.wait('@getAuditLogs');
});

/**
 * Sort audit logs by column
 */
Cypress.Commands.add('sortAuditLogs', (column: string, direction = 'desc') => {
  cy.get(`[data-testid="sort-${column}"]`).click();
  cy.wait('@getAuditLogs');
  
  // Verify sort indicator
  const indicator = direction === 'desc' ? '↓' : '↑';
  cy.get(`[data-testid="sort-indicator-${column}"]`).should('contain', indicator);
});

/**
 * Expand audit log row to show details
 */
Cypress.Commands.add('expandAuditLogRow', (logId: string) => {
  cy.get(`[data-testid="expand-${logId}"]`).click();
  cy.get(`[data-testid="expanded-details-${logId}"]`).should('be.visible');
});

/**
 * Verify audit log table contains expected data
 */
Cypress.Commands.add('verifyAuditLogData', (expectedData: any[]) => {
  cy.get('[data-testid="audit-log-table"]').within(() => {
    expectedData.forEach((log, index) => {
      cy.get('tbody tr').eq(index).within(() => {
        cy.contains(log.action_type).should('be.visible');
        if (log.user_email) {
          cy.contains(log.user_email).should('be.visible');
        }
        if (log.ip_address) {
          cy.contains(log.ip_address).should('be.visible');
        }
        cy.contains(log.status).should('be.visible');
      });
    });
  });
});

/**
 * Verify audit statistics dashboard
 */
Cypress.Commands.add('verifyAuditStats', (expectedStats: any) => {
  cy.get('[data-testid="audit-stats"]').within(() => {
    if (expectedStats.total_events !== undefined) {
      cy.contains('Total Events').parent().should('contain', expectedStats.total_events);
    }
    
    if (expectedStats.events_today !== undefined) {
      cy.contains('Events Today').parent().should('contain', expectedStats.events_today);
    }
    
    if (expectedStats.security_events !== undefined) {
      cy.contains('Security Events').parent().should('contain', expectedStats.security_events);
    }
    
    if (expectedStats.failed_logins !== undefined) {
      cy.contains('Failed Logins').parent().should('contain', expectedStats.failed_logins);
    }
  });
});

/**
 * Clear all filters
 */
Cypress.Commands.add('clearAuditFilters', () => {
  cy.get('[data-testid="clear-filters"]').click();
  cy.wait('@getAuditLogs');
});

/**
 * Toggle auto-refresh
 */
Cypress.Commands.add('toggleAuditAutoRefresh', (enabled: boolean) => {
  cy.get('[data-testid="auto-refresh-toggle"]').then(($toggle) => {
    const isCurrentlyEnabled = $toggle.is(':checked');
    if (isCurrentlyEnabled !== enabled) {
      cy.wrap($toggle).click();
    }
  });
  
  if (enabled) {
    cy.get('[data-testid="auto-refresh-indicator"]').should('be.visible');
  }
});

/**
 * Verify access denied for non-admin users
 */
Cypress.Commands.add('verifyAuditAccessDenied', () => {
  cy.contains('Access Denied').should('be.visible');
  cy.contains(/audit log access restricted to administrators/i).should('be.visible');
  cy.get('[data-testid="audit-log-table"]').should('not.exist');
});

/**
 * Verify WORM constraints by attempting modifications
 */
Cypress.Commands.add('verifyWORMConstraints', (logId: string) => {
  // This command would typically involve backend API calls
  // For E2E testing, we verify that the UI doesn't provide modification options
  
  cy.get(`[data-testid="audit-row-${logId}"]`).within(() => {
    // Verify no edit buttons exist
    cy.get('[data-testid^="edit-"]').should('not.exist');
    cy.get('[data-testid^="delete-"]').should('not.exist');
    cy.get('[data-testid^="modify-"]').should('not.exist');
  });
  
  // Verify right-click context menu doesn't show modification options
  cy.get(`[data-testid="audit-row-${logId}"]`).rightclick();
  cy.get('[data-testid="context-menu"]').then(($menu) => {
    if ($menu.length > 0) {
      cy.wrap($menu).within(() => {
        cy.contains(/edit/i).should('not.exist');
        cy.contains(/delete/i).should('not.exist');
        cy.contains(/modify/i).should('not.exist');
      });
    }
  });
});

// Error handling commands
Cypress.Commands.add('mockAuditAPIError', (errorType: string) => {
  cy.fixture('audit-test-data.json').then((testData) => {
    const errorResponse = testData.apiResponses.errors[errorType];
    
    if (errorResponse) {
      cy.intercept('GET', '/api/audit/logs*', errorResponse).as('getAuditLogsError');
      cy.intercept('GET', '/api/audit/stats', errorResponse).as('getAuditStatsError');
    }
  });
});

// Responsive design helpers
Cypress.Commands.add('verifyMobileLayout', () => {
  cy.viewport(375, 667);
  cy.get('[data-testid="filters-panel"]').should('have.class', 'mobile-layout');
  cy.get('[data-testid="audit-log-table"]').should('have.class', 'mobile-layout');
});

Cypress.Commands.add('verifyTabletLayout', () => {
  cy.viewport(768, 1024);
  cy.get('[data-testid="filters-panel"]').should('be.visible');
  cy.get('[data-testid="audit-log-table"]').should('be.visible');
});

Cypress.Commands.add('verifyDesktopLayout', () => {
  cy.viewport(1920, 1080);
  cy.get('[data-testid="filters-panel"]').should('have.class', 'desktop-layout');
  cy.get('[data-testid="audit-log-table"]').should('have.class', 'desktop-layout');
});

export {};