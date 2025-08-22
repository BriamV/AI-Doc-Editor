/**
 * Audit Log Table Component
 * Displays audit logs with sorting, selection, and expandable rows for T-13 security audit system
 */
import React, { useCallback } from 'react';
import useStore from '@store/store';
import { AuditLogEntry } from '@store/audit-slice';
import TableHeader from './components/TableHeader';
import TableRow from './components/TableRow';
import LoadingState from './components/LoadingState';
import EmptyState from './components/EmptyState';

interface AuditLogTableProps {
  logs: AuditLogEntry[];
  isLoading: boolean;
}

const AuditLogTable: React.FC<AuditLogTableProps> = ({ logs, isLoading }) => {
  const {
    sortConfig,
    expandedRows,
    selectedLogs,
    setSortConfig,
    toggleRowExpansion,
    toggleLogSelection,
    selectAllLogs,
    clearSelection,
  } = useStore();

  const handleSort = useCallback(
    (field: keyof AuditLogEntry) => {
      const newDirection =
        sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc';
      setSortConfig({ field, direction: newDirection });
    },
    [sortConfig, setSortConfig]
  );

  const handleSelectAll = useCallback(() => {
    if (selectedLogs.size === logs.length) {
      clearSelection();
    } else {
      selectAllLogs();
    }
  }, [selectedLogs.size, logs.length, clearSelection, selectAllLogs]);

  if (isLoading && logs.length === 0) {
    return <LoadingState />;
  }

  if (logs.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="overflow-hidden">
      {/* Table header with bulk actions */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedLogs.size === logs.length && logs.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Select all ({logs.length})
              </span>
            </label>
          </div>

          {selectedLogs.size > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedLogs.size} selected
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <TableHeader sortConfig={sortConfig} onSort={handleSort} />
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {logs.map(log => (
              <TableRow
                key={log.id}
                log={log}
                isExpanded={expandedRows.has(log.id)}
                isSelected={selectedLogs.has(log.id)}
                onToggleExpansion={toggleRowExpansion}
                onToggleSelection={toggleLogSelection}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white dark:bg-gray-900 bg-opacity-75 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogTable;
