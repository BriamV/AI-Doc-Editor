/**
 * Audit Log Filters Component
 * Advanced filtering interface for audit logs in T-13 security audit system
 */
import React, { useState, useCallback, useMemo } from 'react';
import useStore from '@store/store';
import { AuditLogFilters as FiltersType } from '@store/audit-slice';
import {
  Search,
  Filter,
  Close,
  Calendar,
  User,
  Activity,
  Network_3,
  Checkmark,
  Error,
} from '@carbon/icons-react';

const AuditLogFilters: React.FC = () => {
  const { filters, actionTypes, users, setFilters, clearFilters, fetchActionTypes, fetchUsers } =
    useStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<FiltersType>(filters);

  // Load action types and users on component mount
  React.useEffect(() => {
    if (actionTypes.length === 0) {
      fetchActionTypes();
    }
    if (users.length === 0) {
      fetchUsers();
    }
  }, [actionTypes.length, users.length, fetchActionTypes, fetchUsers]);

  const handleFilterChange = useCallback(
    (key: keyof FiltersType, value: string) => {
      const newFilters = { ...localFilters, [key]: value || undefined };
      setLocalFilters(newFilters);

      // Apply filters with debouncing for search
      if (key === 'search') {
        setTimeout(() => {
          setFilters(newFilters);
        }, 300);
      } else {
        setFilters(newFilters);
      }
    },
    [localFilters, setFilters]
  );

  const handleClearFilters = useCallback(() => {
    setLocalFilters({});
    clearFilters();
  }, [clearFilters]);

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => value !== undefined && value !== '').length;
  }, [filters]);

  const formatActionType = (actionType: string) => {
    return actionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      {/* Filter header */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filters</h3>
            {activeFiltersCount > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {activeFiltersCount} active
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {activeFiltersCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear all
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>
      </div>

      {/* Filter controls */}
      <div className={`px-6 pb-4 transition-all duration-200 ${isExpanded ? 'block' : 'hidden'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Search className="inline h-4 w-4 mr-1" />
              Search logs
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search in descriptions, user emails, IPs..."
                value={localFilters.search || ''}
                onChange={e => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              {localFilters.search && (
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <Close className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* User selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User className="inline h-4 w-4 mr-1" />
              User
            </label>
            <select
              value={localFilters.userEmail || ''}
              onChange={e => handleFilterChange('userEmail', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All users</option>
              {users.map(user => (
                <option key={user.id} value={user.email}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {/* Action type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Activity className="inline h-4 w-4 mr-1" />
              Action Type
            </label>
            <select
              value={localFilters.actionType || ''}
              onChange={e => handleFilterChange('actionType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All actions</option>
              {actionTypes.map(actionType => (
                <option key={actionType} value={actionType}>
                  {formatActionType(actionType)}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={localFilters.status || ''}
              onChange={e => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All statuses</option>
              <option value="success">
                <Checkmark className="inline h-4 w-4 mr-1" />
                Success
              </option>
              <option value="failure">
                <Error className="inline h-4 w-4 mr-1" />
                Failure
              </option>
              <option value="error">
                <Error className="inline h-4 w-4 mr-1" />
                Error
              </option>
            </select>
          </div>

          {/* IP Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Network_3 className="inline h-4 w-4 mr-1" />
              IP Address
            </label>
            <input
              type="text"
              placeholder="192.168.1.1"
              value={localFilters.ipAddress || ''}
              onChange={e => handleFilterChange('ipAddress', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Date range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Date From
            </label>
            <input
              type="datetime-local"
              value={localFilters.dateFrom || ''}
              onChange={e => handleFilterChange('dateFrom', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Date To
            </label>
            <input
              type="datetime-local"
              value={localFilters.dateTo || ''}
              onChange={e => handleFilterChange('dateTo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Quick filter buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => handleFilterChange('status', 'failure')}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
          >
            <Error className="h-3 w-3 mr-1" />
            Failed Actions
          </button>

          <button
            onClick={() => handleFilterChange('actionType', 'login_failure')}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:hover:bg-orange-800"
          >
            Login Failures
          </button>

          <button
            onClick={() => handleFilterChange('actionType', 'unauthorized_access')}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:hover:bg-purple-800"
          >
            Security Events
          </button>

          <button
            onClick={() => {
              const today = new Date();
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);
              setLocalFilters({
                ...localFilters,
                dateFrom: yesterday.toISOString().slice(0, 16),
                dateTo: today.toISOString().slice(0, 16),
              });
              setFilters({
                ...localFilters,
                dateFrom: yesterday.toISOString().slice(0, 16),
                dateTo: today.toISOString().slice(0, 16),
              });
            }}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
          >
            <Calendar className="h-3 w-3 mr-1" />
            Last 24h
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogFilters;
