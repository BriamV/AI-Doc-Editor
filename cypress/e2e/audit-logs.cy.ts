/**
 * E2E tests for T-13 audit log viewer interface
 * Tests complete audit log viewer workflow for admin users
 */

describe('Audit Log Viewer E2E Tests', () => {
  // Test data and fixtures
  const adminUser = {
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin'
  };

  const regularUser = {
    email: 'user@example.com',
    password: 'user123',
    role: 'user'
  };

  const mockAuditLogs = [
    {
      id: 'audit-1',
      action_type: 'login_success',
      user_email: 'test@example.com',
      user_role: 'user',
      ip_address: '192.168.1.100',
      description: 'User logged in successfully',
      status: 'success',
      timestamp: '2024-01-15T10:30:00Z',
      details: '{"method": "oauth", "provider": "google"}'
    },
    {
      id: 'audit-2',
      action_type: 'document_create',
      user_email: 'test@example.com',
      resource_type: 'document',
      resource_id: 'doc-456',
      description: 'New document created',
      status: 'success',
      timestamp: '2024-01-15T11:00:00Z'
    },
    {
      id: 'audit-3',
      action_type: 'login_failure',
      user_email: 'hacker@example.com',
      ip_address: '10.0.0.1',
      description: 'Failed login attempt',
      status: 'failure',
      timestamp: '2024-01-15T09:00:00Z'
    },
    {
      id: 'audit-4',
      action_type: 'config_update',
      user_email: 'admin@example.com',
      user_role: 'admin',
      description: 'System configuration updated',
      status: 'success',
      timestamp: '2024-01-15T08:30:00Z'
    },
    {
      id: 'audit-5',
      action_type: 'unauthorized_access',
      ip_address: '10.0.0.1',
      description: 'Unauthorized access attempt',
      status: 'error',
      timestamp: '2024-01-15T07:00:00Z'
    }
  ];

  const mockAuditStats = {
    total_events: 150,
    events_today: 25,
    events_this_week: 85,
    events_this_month: 120,
    top_actions: [
      { action_type: 'login_success', count: 50 },
      { action_type: 'document_create', count: 30 },
      { action_type: 'document_update', count: 25 }
    ],
    top_users: [
      { user_email: 'test@example.com', count: 45 },
      { user_email: 'admin@example.com', count: 35 }
    ],
    security_events: 15,
    failed_logins: 8
  };

  beforeEach(() => {
    // Mock API responses
    cy.intercept('GET', '/api/audit/logs*', {
      statusCode: 200,
      body: {
        logs: mockAuditLogs,
        total_count: mockAuditLogs.length,
        page: 1,
        page_size: 25,
        total_pages: 1,
        has_next: false,
        has_previous: false
      }
    }).as('getAuditLogs');

    cy.intercept('GET', '/api/audit/stats', {
      statusCode: 200,
      body: mockAuditStats
    }).as('getAuditStats');

    cy.intercept('GET', '/api/audit/actions', {
      statusCode: 200,
      body: {
        actions: ['login_success', 'login_failure', 'document_create', 'document_update', 'config_update']
      }
    }).as('getActionTypes');

    cy.intercept('GET', '/api/users', {
      statusCode: 200,
      body: {
        users: [
          { id: 'user-1', email: 'test@example.com', name: 'Test User' },
          { id: 'user-2', email: 'admin@example.com', name: 'Admin User' }
        ]
      }
    }).as('getUsers');
  });

  describe('Access Control', () => {
    it('should deny access to non-admin users', () => {
      // Login as regular user
      cy.login(regularUser);
      
      // Try to access audit logs page
      cy.visit('/audit-logs');
      
      // Should be redirected or show access denied message
      cy.contains('Access Denied').should('be.visible');
      cy.contains('audit log access restricted to administrators', { matchCase: false })
        .should('be.visible');
    });

    it('should allow access to admin users', () => {
      // Login as admin
      cy.login(adminUser);
      
      // Access audit logs page
      cy.visit('/audit-logs');
      
      // Should load successfully
      cy.contains('Audit Logs').should('be.visible');
      cy.get('[data-testid="audit-log-table"]').should('be.visible');
      
      // Should make API calls
      cy.wait('@getAuditLogs');
      cy.wait('@getAuditStats');
    });
  });

  describe('Audit Log Viewer Interface', () => {
    beforeEach(() => {
      cy.login(adminUser);
      cy.visit('/audit-logs');
      cy.wait('@getAuditLogs');
    });

    it('should display audit logs table with correct data', () => {
      // Check table headers
      cy.get('[data-testid="audit-log-table"]').within(() => {
        cy.contains('th', 'Timestamp').should('be.visible');
        cy.contains('th', 'Action').should('be.visible');
        cy.contains('th', 'User').should('be.visible');
        cy.contains('th', 'IP Address').should('be.visible');
        cy.contains('th', 'Status').should('be.visible');
        cy.contains('th', 'Description').should('be.visible');
      });

      // Check audit log entries
      cy.contains('login_success').should('be.visible');
      cy.contains('document_create').should('be.visible');
      cy.contains('login_failure').should('be.visible');
      cy.contains('test@example.com').should('be.visible');
      cy.contains('192.168.1.100').should('be.visible');
    });

    it('should display audit statistics dashboard', () => {
      cy.get('[data-testid="audit-stats"]').within(() => {
        cy.contains('Total Events').should('be.visible');
        cy.contains('150').should('be.visible');
        
        cy.contains('Events Today').should('be.visible');
        cy.contains('25').should('be.visible');
        
        cy.contains('Security Events').should('be.visible');
        cy.contains('15').should('be.visible');
      });
    });

    it('should expand row details when clicking expand button', () => {
      // Find first row with expand button
      cy.get('[data-testid="expand-row-audit-1"]').click();
      
      // Should show expanded details
      cy.get('[data-testid="expanded-details-audit-1"]').should('be.visible');
      cy.contains('"method": "oauth"').should('be.visible');
      cy.contains('"provider": "google"').should('be.visible');
      
      // Should change button to collapse
      cy.get('[data-testid="collapse-row-audit-1"]').should('be.visible');
    });

    it('should collapse expanded row when clicking collapse button', () => {
      // Expand row first
      cy.get('[data-testid="expand-row-audit-1"]').click();
      cy.get('[data-testid="expanded-details-audit-1"]').should('be.visible');
      
      // Collapse row
      cy.get('[data-testid="collapse-row-audit-1"]').click();
      
      // Should hide expanded details
      cy.get('[data-testid="expanded-details-audit-1"]').should('not.exist');
      cy.get('[data-testid="expand-row-audit-1"]').should('be.visible');
    });
  });

  describe('Filtering Functionality', () => {
    beforeEach(() => {
      cy.login(adminUser);
      cy.visit('/audit-logs');
      cy.wait('@getAuditLogs');
    });

    it('should filter by user email', () => {
      // Open filters panel
      cy.get('[data-testid="filters-panel"]').should('be.visible');
      
      // Enter user email filter
      cy.get('[data-testid="filter-user-email"]').type('test@example.com');
      
      // Apply filters
      cy.get('[data-testid="apply-filters"]').click();
      
      // Should make filtered API call
      cy.wait('@getAuditLogs').then((interception) => {
        expect(interception.request.url).to.include('userEmail=test%40example.com');
      });
    });

    it('should filter by action type', () => {
      // Select action type
      cy.get('[data-testid="filter-action-type"]').select('login_success');
      
      // Apply filters
      cy.get('[data-testid="apply-filters"]').click();
      
      // Should make filtered API call
      cy.wait('@getAuditLogs').then((interception) => {
        expect(interception.request.url).to.include('actionType=login_success');
      });
    });

    it('should filter by status', () => {
      // Select status
      cy.get('[data-testid="filter-status"]').select('failure');
      
      // Apply filters
      cy.get('[data-testid="apply-filters"]').click();
      
      // Should make filtered API call
      cy.wait('@getAuditLogs').then((interception) => {
        expect(interception.request.url).to.include('status=failure');
      });
    });

    it('should filter by date range', () => {
      // Set date range
      cy.get('[data-testid="filter-date-from"]').type('2024-01-01');
      cy.get('[data-testid="filter-date-to"]').type('2024-01-31');
      
      // Apply filters
      cy.get('[data-testid="apply-filters"]').click();
      
      // Should make filtered API call
      cy.wait('@getAuditLogs').then((interception) => {
        expect(interception.request.url).to.include('dateFrom=2024-01-01');
        expect(interception.request.url).to.include('dateTo=2024-01-31');
      });
    });

    it('should use quick date range buttons', () => {
      // Click "Today" button
      cy.get('[data-testid="quick-date-today"]').click();
      
      // Should set today's date in both fields
      const today = new Date().toISOString().split('T')[0];
      cy.get('[data-testid="filter-date-from"]').should('have.value', today);
      cy.get('[data-testid="filter-date-to"]').should('have.value', today);
    });

    it('should clear all filters', () => {
      // Set some filters
      cy.get('[data-testid="filter-user-email"]').type('test@example.com');
      cy.get('[data-testid="filter-action-type"]').select('login_success');
      
      // Clear filters
      cy.get('[data-testid="clear-filters"]').click();
      
      // Should reset all filter fields
      cy.get('[data-testid="filter-user-email"]').should('have.value', '');
      cy.get('[data-testid="filter-action-type"]').should('have.value', '');
      
      // Should make unfiltered API call
      cy.wait('@getAuditLogs').then((interception) => {
        expect(interception.request.url).to.not.include('userEmail');
        expect(interception.request.url).to.not.include('actionType');
      });
    });

    it('should display active filter count', () => {
      // Set multiple filters
      cy.get('[data-testid="filter-user-email"]').type('test@example.com');
      cy.get('[data-testid="filter-action-type"]').select('login_success');
      cy.get('[data-testid="filter-status"]').select('success');
      
      // Should show filter count
      cy.get('[data-testid="active-filters-count"]').should('contain', '3 filters active');
    });
  });

  describe('Sorting Functionality', () => {
    beforeEach(() => {
      cy.login(adminUser);
      cy.visit('/audit-logs');
      cy.wait('@getAuditLogs');
    });

    it('should sort by timestamp ascending', () => {
      // Click timestamp header to toggle sort
      cy.get('[data-testid="sort-timestamp"]').click();
      
      // Should make sorted API call
      cy.wait('@getAuditLogs').then((interception) => {
        expect(interception.request.url).to.include('sortField=timestamp');
        expect(interception.request.url).to.include('sortDirection=asc');
      });
      
      // Should show ascending sort indicator
      cy.get('[data-testid="sort-indicator-timestamp"]').should('contain', '↑');
    });

    it('should sort by user email', () => {
      // Click user header
      cy.get('[data-testid="sort-user-email"]').click();
      
      // Should make sorted API call
      cy.wait('@getAuditLogs').then((interception) => {
        expect(interception.request.url).to.include('sortField=user_email');
        expect(interception.request.url).to.include('sortDirection=desc');
      });
    });

    it('should sort by action type', () => {
      // Click action header
      cy.get('[data-testid="sort-action-type"]').click();
      
      // Should make sorted API call
      cy.wait('@getAuditLogs').then((interception) => {
        expect(interception.request.url).to.include('sortField=action_type');
      });
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      // Mock response with more data for pagination
      cy.intercept('GET', '/api/audit/logs*', {
        statusCode: 200,
        body: {
          logs: mockAuditLogs,
          total_count: 100,
          page: 1,
          page_size: 25,
          total_pages: 4,
          has_next: true,
          has_previous: false
        }
      }).as('getAuditLogsWithPagination');

      cy.login(adminUser);
      cy.visit('/audit-logs');
      cy.wait('@getAuditLogsWithPagination');
    });

    it('should display pagination controls', () => {
      cy.get('[data-testid="pagination"]').should('be.visible');
      cy.get('[data-testid="page-info"]').should('contain', 'Page 1 of 4');
      cy.get('[data-testid="next-page"]').should('be.enabled');
      cy.get('[data-testid="prev-page"]').should('be.disabled');
    });

    it('should navigate to next page', () => {
      // Click next page
      cy.get('[data-testid="next-page"]').click();
      
      // Should make API call for page 2
      cy.wait('@getAuditLogsWithPagination').then((interception) => {
        expect(interception.request.url).to.include('page=2');
      });
    });

    it('should change page size', () => {
      // Change page size
      cy.get('[data-testid="page-size-select"]').select('50');
      
      // Should make API call with new page size
      cy.wait('@getAuditLogsWithPagination').then((interception) => {
        expect(interception.request.url).to.include('pageSize=50');
        expect(interception.request.url).to.include('page=1'); // Should reset to page 1
      });
    });

    it('should navigate to specific page', () => {
      // Enter specific page number
      cy.get('[data-testid="goto-page-input"]').clear().type('3{enter}');
      
      // Should make API call for page 3
      cy.wait('@getAuditLogsWithPagination').then((interception) => {
        expect(interception.request.url).to.include('page=3');
      });
    });
  });

  describe('Row Selection and Export', () => {
    beforeEach(() => {
      cy.login(adminUser);
      cy.visit('/audit-logs');
      cy.wait('@getAuditLogs');
    });

    it('should select individual rows', () => {
      // Select first row
      cy.get('[data-testid="select-row-audit-1"]').click();
      
      // Should show selection
      cy.get('[data-testid="select-row-audit-1"]').should('be.checked');
      cy.get('[data-testid="selection-count"]').should('contain', '1 selected');
    });

    it('should select all rows', () => {
      // Click select all checkbox
      cy.get('[data-testid="select-all-rows"]').click();
      
      // Should select all visible rows
      cy.get('[data-testid^="select-row-"]').should('be.checked');
      cy.get('[data-testid="selection-count"]').should('contain', '5 selected');
    });

    it('should export selected rows as CSV', () => {
      // Select some rows
      cy.get('[data-testid="select-row-audit-1"]').click();
      cy.get('[data-testid="select-row-audit-2"]').click();
      
      // Mock download
      cy.window().then((win) => {
        cy.stub(win, 'open').as('windowOpen');
      });
      
      // Export selected as CSV
      cy.get('[data-testid="export-dropdown"]').click();
      cy.get('[data-testid="export-selected-csv"]').click();
      
      // Should trigger download
      cy.get('@windowOpen').should('have.been.called');
    });

    it('should export all rows as JSON', () => {
      // Mock download
      cy.window().then((win) => {
        cy.stub(win, 'open').as('windowOpen');
      });
      
      // Export all as JSON
      cy.get('[data-testid="export-dropdown"]').click();
      cy.get('[data-testid="export-all-json"]').click();
      
      // Should trigger download
      cy.get('@windowOpen').should('have.been.called');
    });

    it('should clear selection', () => {
      // Select some rows
      cy.get('[data-testid="select-row-audit-1"]').click();
      cy.get('[data-testid="select-row-audit-2"]').click();
      
      // Clear selection
      cy.get('[data-testid="clear-selection"]').click();
      
      // Should deselect all
      cy.get('[data-testid^="select-row-"]').should('not.be.checked');
      cy.get('[data-testid="selection-count"]').should('not.exist');
    });
  });

  describe('Real-time Refresh', () => {
    beforeEach(() => {
      cy.login(adminUser);
      cy.visit('/audit-logs');
      cy.wait('@getAuditLogs');
    });

    it('should toggle auto-refresh', () => {
      // Enable auto-refresh
      cy.get('[data-testid="auto-refresh-toggle"]').click();
      
      // Should show refresh indicator
      cy.get('[data-testid="auto-refresh-indicator"]').should('be.visible');
      cy.get('[data-testid="refresh-interval"]').should('contain', '30 seconds');
    });

    it('should manually refresh data', () => {
      // Click refresh button
      cy.get('[data-testid="manual-refresh"]').click();
      
      // Should make new API call
      cy.wait('@getAuditLogs');
      
      // Should show refresh feedback
      cy.get('[data-testid="last-refresh"]').should('contain', 'Updated just now');
    });

    it('should change refresh interval', () => {
      // Enable auto-refresh
      cy.get('[data-testid="auto-refresh-toggle"]').click();
      
      // Change interval
      cy.get('[data-testid="refresh-interval-select"]').select('60');
      
      // Should update interval display
      cy.get('[data-testid="refresh-interval"]').should('contain', '60 seconds');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      cy.login(adminUser);
    });

    it('should handle API errors gracefully', () => {
      // Mock API error
      cy.intercept('GET', '/api/audit/logs*', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('getAuditLogsError');
      
      cy.visit('/audit-logs');
      cy.wait('@getAuditLogsError');
      
      // Should show error message
      cy.contains('Failed to load audit logs').should('be.visible');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });

    it('should retry failed requests', () => {
      // Mock initial error then success
      cy.intercept('GET', '/api/audit/logs*', { statusCode: 500 }).as('getAuditLogsError');
      
      cy.visit('/audit-logs');
      cy.wait('@getAuditLogsError');
      
      // Mock successful retry
      cy.intercept('GET', '/api/audit/logs*', {
        statusCode: 200,
        body: {
          logs: mockAuditLogs,
          total_count: mockAuditLogs.length,
          page: 1,
          page_size: 25
        }
      }).as('getAuditLogsSuccess');
      
      // Click retry
      cy.get('[data-testid="retry-button"]').click();
      cy.wait('@getAuditLogsSuccess');
      
      // Should show data
      cy.get('[data-testid="audit-log-table"]').should('be.visible');
    });

    it('should handle network connectivity issues', () => {
      // Mock network error
      cy.intercept('GET', '/api/audit/logs*', { forceNetworkError: true }).as('getAuditLogsNetworkError');
      
      cy.visit('/audit-logs');
      cy.wait('@getAuditLogsNetworkError');
      
      // Should show network error message
      cy.contains('Network connection error').should('be.visible');
      cy.contains('Please check your internet connection').should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      cy.login(adminUser);
      cy.visit('/audit-logs');
      cy.wait('@getAuditLogs');
    });

    it('should adapt to mobile viewport', () => {
      // Set mobile viewport
      cy.viewport(375, 667);
      
      // Should stack filters vertically
      cy.get('[data-testid="filters-panel"]').should('have.class', 'flex-col');
      
      // Should show mobile table layout
      cy.get('[data-testid="audit-log-table"]').should('have.class', 'mobile-layout');
      
      // Should hide some columns on mobile
      cy.get('th').contains('User Agent').should('not.be.visible');
    });

    it('should work on tablet viewport', () => {
      // Set tablet viewport
      cy.viewport(768, 1024);
      
      // Should show intermediate layout
      cy.get('[data-testid="filters-panel"]').should('be.visible');
      cy.get('[data-testid="audit-log-table"]').should('be.visible');
    });
  });
});