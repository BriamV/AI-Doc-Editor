/**
 * Page Header Component for Audit Logs
 * Contains navigation, title, and control elements
 */
import React from 'react';
import PageTitle from './PageTitle';
import PageControls from './PageControls';

interface PageHeaderProps {
  lastRefresh: Date | null;
  autoRefresh: boolean;
  refreshInterval: number;
  isLoading: boolean;
  onRefresh: () => void;
  onAutoRefreshToggle: () => void;
  onRefreshIntervalChange: (seconds: number) => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  lastRefresh,
  autoRefresh,
  refreshInterval,
  isLoading,
  onRefresh,
  onAutoRefreshToggle,
  onRefreshIntervalChange,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <PageTitle />
          <PageControls
            lastRefresh={lastRefresh}
            autoRefresh={autoRefresh}
            refreshInterval={refreshInterval}
            isLoading={isLoading}
            onRefresh={onRefresh}
            onAutoRefreshToggle={onAutoRefreshToggle}
            onRefreshIntervalChange={onRefreshIntervalChange}
          />
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
