/**
 * Refresh Controls Component for Audit Logs
 * Contains auto-refresh settings and manual refresh button
 */
import React from 'react';
import { Restart } from '@carbon/icons-react';

interface RefreshControlsProps {
  autoRefresh: boolean;
  refreshInterval: number;
  isLoading: boolean;
  onRefresh: () => void;
  onAutoRefreshToggle: () => void;
  onRefreshIntervalChange: (seconds: number) => void;
}

const RefreshControls: React.FC<RefreshControlsProps> = ({
  autoRefresh,
  refreshInterval,
  isLoading,
  onRefresh,
  onAutoRefreshToggle,
  onRefreshIntervalChange,
}) => {
  return (
    <>
      {/* Auto-refresh controls */}
      <div className="flex items-center space-x-2">
        <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={onAutoRefreshToggle}
            className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Auto-refresh
        </label>

        {autoRefresh && (
          <select
            value={refreshInterval}
            onChange={e => onRefreshIntervalChange(Number(e.target.value))}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value={10}>10s</option>
            <option value={30}>30s</option>
            <option value={60}>1m</option>
            <option value={300}>5m</option>
          </select>
        )}
      </div>

      {/* Manual refresh button */}
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Restart className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">Refresh</span>
      </button>
    </>
  );
};

export default RefreshControls;
