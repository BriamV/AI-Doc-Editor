/**
 * Audit Log Viewer Page - T-13 Security audit system
 * Admin-only interface for viewing and managing audit logs
 */
import React from 'react';
// Note: No redirects here; show inline access denied message
import { useAuth } from '@hooks/useAuth';
import AuditLogStats from '@components/AuditLogs/AuditLogStats';
import AuditLogFilters from '@components/AuditLogs/AuditLogFilters';
import AuditLogTable from '@components/AuditLogs/AuditLogTable';
import AuditLogPagination from '@components/AuditLogs/AuditLogPagination';
import { useAuditRefresh } from './AuditLogs/hooks/useAuditRefresh';
import { useAuditState } from './AuditLogs/hooks/useAuditState';
import PageHeader from './AuditLogs/components/PageHeader';
import ErrorBanner from './AuditLogs/components/ErrorBanner';
import SelectionSummary from './AuditLogs/components/SelectionSummary';

const AuditLogsMain: React.FC = () => {
  const auditState = useAuditState();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Statistics Dashboard */}
      <AuditLogStats stats={auditState.auditStats} isLoading={auditState.isLoadingStats} />

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <AuditLogFilters />
      </div>

      {/* Selection summary */}
      <SelectionSummary
        selectedCount={auditState.selectedLogs.size}
        onClearSelection={auditState.clearSelection}
      />

      {/* Main table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <AuditLogTable logs={auditState.auditLogs} isLoading={auditState.isLoading} />
      </div>

      {/* Pagination */}
      <AuditLogPagination />
    </div>
  );
};

const AuditLogsContent: React.FC = () => {
  const auditState = useAuditState();
  const refreshHandlers = useAuditRefresh();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <PageHeader
        lastRefresh={auditState.lastRefresh}
        autoRefresh={auditState.autoRefresh}
        refreshInterval={auditState.refreshInterval}
        isLoading={auditState.isLoading}
        onRefresh={refreshHandlers.handleRefresh}
        onAutoRefreshToggle={refreshHandlers.handleAutoRefreshToggle}
        onRefreshIntervalChange={refreshHandlers.handleRefreshIntervalChange}
      />

      {/* Error banner */}
      <ErrorBanner error={auditState.error} onDismiss={auditState.clearAuditError} />

      {/* Main content */}
      <AuditLogsMain />
    </div>
  );
};

const AuditLogs: React.FC = () => {
  const { isAdmin } = useAuth();

  // Show access denied message for non-admin users (E2E expects inline message)
  if (!isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">Access Denied</h2>
          <p>Audit log access restricted to administrators</p>
        </div>
      </div>
    );
  }

  return <AuditLogsContent />;
};

export default AuditLogs;
