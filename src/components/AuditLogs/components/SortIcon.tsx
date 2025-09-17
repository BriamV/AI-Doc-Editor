/**
 * Sort Icon Component
 * Renders sort direction indicators for table headers
 */
import React from 'react';
import { ChevronUp, ChevronDown } from '@carbon/icons-react';
import { AuditLogEntry, AuditLogSortConfig } from '@store/audit-slice';

interface SortIconProps {
  field: keyof AuditLogEntry;
  sortConfig: AuditLogSortConfig;
}

const SortIcon: React.FC<SortIconProps> = ({ field, sortConfig }) => {
  if (sortConfig.field !== field) {
    return <ChevronUp className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100" />;
  }
  return sortConfig.direction === 'asc' ? (
    <ChevronUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
  ) : (
    <ChevronDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
  );
};

export default SortIcon;
