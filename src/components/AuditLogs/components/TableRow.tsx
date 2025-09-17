/**
 * Table Row Component
 * Renders individual audit log row with expandable details
 */
import React from 'react';
import { ChevronDown, ChevronRight, Copy } from '@carbon/icons-react';
import { AuditLogEntry } from '@store/audit-slice';
import {
  formatTimestamp,
  formatActionType,
  getStatusColor,
  copyToClipboard,
} from '../utils/formatters';
import StatusIcon from './StatusIcon';

interface TableRowProps {
  log: AuditLogEntry;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpansion: (logId: string) => void;
  onToggleSelection: (logId: string) => void;
}

const TableRow: React.FC<TableRowProps> = React.memo(
  ({ log, isExpanded, isSelected, onToggleExpansion, onToggleSelection }) => {
    // Memoize handlers to prevent unnecessary re-renders
    const handleToggleExpansion = React.useCallback(() => {
      onToggleExpansion(log.id);
    }, [onToggleExpansion, log.id]);

    const handleToggleSelection = React.useCallback(() => {
      onToggleSelection(log.id);
    }, [onToggleSelection, log.id]);

    return (
      <>
        {/* Main row */}
        <tr
          className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
            isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
          }`}
          data-testid={`audit-row-${log.id}`}
        >
          {/* Expand button */}
          <td className="px-6 py-4 whitespace-nowrap">
            <button
              onClick={handleToggleExpansion}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              data-testid={`expand-${log.id}`}
              aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </td>

          {/* Selection checkbox */}
          <td className="px-2 py-4 whitespace-nowrap">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleToggleSelection}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              data-testid={`select-${log.id}`}
              aria-label={`Select audit log ${log.id}`}
            />
          </td>

          {/* Timestamp */}
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
            {formatTimestamp(log.timestamp)}
          </td>

          {/* Action type */}
          <td className="px-6 py-4 whitespace-nowrap">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {formatActionType(log.action_type)}
            </span>
          </td>

          {/* User */}
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {log.user_email || 'System'}
                </div>
                {log.user_role && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">{log.user_role}</div>
                )}
              </div>
            </div>
          </td>

          {/* IP Address */}
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-900 dark:text-white font-mono">
                {log.ip_address || 'N/A'}
              </span>
              {log.ip_address && (
                <button
                  onClick={() => copyToClipboard(log.ip_address || '')}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <Copy className="h-3 w-3" />
                </button>
              )}
            </div>
          </td>

          {/* Status */}
          <td className="px-6 py-4 whitespace-nowrap">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}
            >
              <StatusIcon status={log.status} />
              <span className="ml-1 capitalize">{log.status}</span>
            </span>
          </td>

          {/* Description */}
          <td className="px-6 py-4">
            <div className="text-sm text-gray-900 dark:text-white">
              <div className="max-w-xs truncate">{log.description}</div>
            </div>
          </td>
        </tr>

        {/* Expanded row */}
        {isExpanded && (
          <tr className="bg-gray-50 dark:bg-gray-800" data-testid={`expanded-details-${log.id}`}>
            <td colSpan={8} className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Log details */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Log Details</h4>

                  <dl className="space-y-2">
                    <div>
                      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">ID</dt>
                      <dd className="text-sm text-gray-900 dark:text-white font-mono">{log.id}</dd>
                    </div>

                    <div>
                      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Full Description
                      </dt>
                      <dd className="text-sm text-gray-900 dark:text-white">{log.description}</dd>
                    </div>

                    {log.resource_type && (
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Resource Type
                        </dt>
                        <dd className="text-sm text-gray-900 dark:text-white">
                          {log.resource_type}
                        </dd>
                      </div>
                    )}

                    {log.resource_id && (
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Resource ID
                        </dt>
                        <dd className="text-sm text-gray-900 dark:text-white font-mono">
                          {log.resource_id}
                        </dd>
                      </div>
                    )}

                    {log.session_id && (
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Session ID
                        </dt>
                        <dd className="text-sm text-gray-900 dark:text-white font-mono">
                          {log.session_id}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Additional details */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    Technical Details
                  </h4>

                  <dl className="space-y-2">
                    {log.user_agent && (
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          User Agent
                        </dt>
                        <dd className="text-sm text-gray-900 dark:text-white break-all">
                          {log.user_agent}
                        </dd>
                      </div>
                    )}

                    <div>
                      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Created At
                      </dt>
                      <dd className="text-sm text-gray-900 dark:text-white">
                        {formatTimestamp(log.created_at)}
                      </dd>
                    </div>

                    {log.details && (
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Additional Details
                        </dt>
                        <dd className="text-sm text-gray-900 dark:text-white">
                          <pre className="mt-1 whitespace-pre-wrap bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs overflow-x-auto">
                            {typeof log.details === 'string'
                              ? log.details
                              : JSON.stringify(log.details, null, 2)}
                          </pre>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </td>
          </tr>
        )}
      </>
    );
  }
);

// Add display name for debugging
TableRow.displayName = 'TableRow';

export default TableRow;
