/**
 * Table Header Component
 * Renders the table header with sorting controls
 */
import React from 'react';
import { Calendar, Activity, User, Network_3 } from '@carbon/icons-react';
import { AuditLogEntry, AuditLogSortConfig } from '@store/audit-slice';
import SortIcon from './SortIcon';

interface TableHeaderProps {
  sortConfig: AuditLogSortConfig;
  onSort: (field: keyof AuditLogEntry) => void;
}

const TableHeader: React.FC<TableHeaderProps> = ({ sortConfig, onSort }) => {
  return (
    <thead className="bg-gray-50 dark:bg-gray-800">
      <tr>
        <th scope="col" className="w-12 px-6 py-3">
          {/* Expansion column */}
        </th>
        <th scope="col" className="w-12 px-2 py-3">
          {/* Selection column */}
        </th>

        {/* Sortable columns */}
        <th
          scope="col"
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 group"
          onClick={() => onSort('timestamp')}
        >
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>Timestamp</span>
            <SortIcon field="timestamp" sortConfig={sortConfig} />
          </div>
        </th>

        <th
          scope="col"
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 group"
          onClick={() => onSort('action_type')}
        >
          <div className="flex items-center space-x-1">
            <Activity className="h-4 w-4" />
            <span>Action</span>
            <SortIcon field="action_type" sortConfig={sortConfig} />
          </div>
        </th>

        <th
          scope="col"
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 group"
          onClick={() => onSort('user_email')}
        >
          <div className="flex items-center space-x-1">
            <User className="h-4 w-4" />
            <span>User</span>
            <SortIcon field="user_email" sortConfig={sortConfig} />
          </div>
        </th>

        <th
          scope="col"
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 group"
          onClick={() => onSort('ip_address')}
        >
          <div className="flex items-center space-x-1">
            <Network_3 className="h-4 w-4" />
            <span>IP Address</span>
            <SortIcon field="ip_address" sortConfig={sortConfig} />
          </div>
        </th>

        <th
          scope="col"
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 group"
          onClick={() => onSort('status')}
        >
          <div className="flex items-center space-x-1">
            <span>Status</span>
            <SortIcon field="status" sortConfig={sortConfig} />
          </div>
        </th>

        <th
          scope="col"
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
        >
          Description
        </th>
      </tr>
    </thead>
  );
};

export default TableHeader;
