/**
 * Audit Log Statistics Dashboard Component
 * Displays audit log metrics and summaries for T-13 security audit system
 */
import React from 'react';
import { AuditLogStats as StatsType } from '@store/audit-slice';
import {
  Security,
  User,
  Warning,
  Checkmark,
  Error,
  ChartLine,
  Time,
  Activity,
} from '@carbon/icons-react';

interface AuditLogStatsProps {
  stats: StatsType | null;
  isLoading: boolean;
}

const AuditLogStats: React.FC<AuditLogStatsProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="ml-3 flex-1">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16 mb-1"></div>
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-12"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-center">
          <Warning className="h-5 w-5 text-yellow-400 mr-3" />
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            Unable to load audit statistics. Please refresh the page.
          </p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'failure':
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <Checkmark className="h-4 w-4" />;
      case 'failure':
      case 'error':
        return <Error className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  // Calculate top actions and users
  const topActions = Object.entries(stats.logsByAction)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const topUsers = Object.entries(stats.logsByUser)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6" data-testid="audit-stats">
      {/* Main stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total logs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Security className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                Total Logs
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.totalLogs.toLocaleString()}
              </dd>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Time className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                Recent Actions
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.recentActions.toLocaleString()}
              </dd>
              <div className="text-xs text-gray-500 dark:text-gray-400">Last 24h</div>
            </div>
          </div>
        </div>

        {/* Success rate */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Checkmark className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                Success Rate
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.totalLogs > 0
                  ? Math.round(((stats.logsByStatus.success || 0) / stats.totalLogs) * 100)
                  : 0}
                %
              </dd>
            </div>
          </div>
        </div>

        {/* Unique users */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <User className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                Active Users
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {Object.keys(stats.logsByUser).length}
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <ChartLine className="h-5 w-5 mr-2" />
            Status Breakdown
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.logsByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={getStatusColor(status)}>{getStatusIcon(status)}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {status}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {count.toLocaleString()}
                  </span>
                  <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        status === 'success'
                          ? 'bg-green-600'
                          : status === 'failure' || status === 'error'
                            ? 'bg-red-600'
                            : 'bg-gray-600'
                      }`}
                      style={{
                        width: `${stats.totalLogs > 0 ? (count / stats.totalLogs) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Top Actions
          </h3>
          <div className="space-y-3">
            {topActions.map(([action, count]) => (
              <div key={action} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {count.toLocaleString()}
                  </span>
                  <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-600"
                      style={{
                        width: `${stats.totalLogs > 0 ? (count / stats.totalLogs) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top users */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Most Active Users
          </h3>
          <div className="space-y-3">
            {topUsers.map(([userEmail, count]) => (
              <div key={userEmail} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {userEmail || 'Unknown'}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {count.toLocaleString()}
                  </span>
                  <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-purple-600"
                      style={{
                        width: `${stats.totalLogs > 0 ? (count / stats.totalLogs) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogStats;
