/**
 * Page Controls Component for Audit Logs
 * Contains refresh controls and export functionality
 */
import React from 'react';
import { Information } from '@carbon/icons-react';
import AuditLogExport from '@components/AuditLogs/AuditLogExport';
import RefreshControls from './RefreshControls';

interface PageControlsProps {
  lastRefresh: Date | null;
  autoRefresh: boolean;
  refreshInterval: number;
  isLoading: boolean;
  onRefresh: () => void;
  onAutoRefreshToggle: () => void;
  onRefreshIntervalChange: (seconds: number) => void;
}

const formatLastRefresh = (date: Date | null): string => {
  if (!date) return 'Never';
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
};

const PageControls: React.FC<PageControlsProps> = ({
  lastRefresh,
  autoRefresh,
  refreshInterval,
  isLoading,
  onRefresh,
  onAutoRefreshToggle,
  onRefreshIntervalChange,
}) => {
  return (
    <div className="flex items-center space-x-4">
      {/* Last refresh indicator */}
      <div className="hidden sm:flex items-center text-sm text-gray-500 dark:text-gray-400">
        <Information className="h-4 w-4 mr-1" />
        Last refresh: {formatLastRefresh(lastRefresh)}
      </div>

      <RefreshControls
        autoRefresh={autoRefresh}
        refreshInterval={refreshInterval}
        isLoading={isLoading}
        onRefresh={onRefresh}
        onAutoRefreshToggle={onAutoRefreshToggle}
        onRefreshIntervalChange={onRefreshIntervalChange}
      />

      {/* Export controls */}
      <AuditLogExport />
    </div>
  );
};

export default PageControls;
