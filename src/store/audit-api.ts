/**
 * Audit log API functions for T-13 security audit system
 */
import {
  AuditLogEntry,
  AuditLogStats,
  AuditLogFilters,
  AuditLogSortConfig,
  AuditLogPagination,
} from './audit-types';

interface FetchLogsParams {
  filters: AuditLogFilters;
  sortConfig: AuditLogSortConfig;
  pagination: AuditLogPagination;
  accessToken: string;
}

interface FetchLogsResponse {
  logs: AuditLogEntry[];
  total: number;
}

export const fetchAuditLogs = async ({
  filters,
  sortConfig,
  pagination,
  accessToken,
}: FetchLogsParams): Promise<FetchLogsResponse> => {
  // Build query parameters
  const params = new URLSearchParams();

  // Add filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.append(key, value.toString());
    }
  });

  // Add sorting
  params.append('sortField', sortConfig.field);
  params.append('sortDirection', sortConfig.direction);

  // Add pagination
  params.append('page', pagination.page.toString());
  params.append('pageSize', pagination.pageSize.toString());

  const response = await fetch(`/api/audit/logs?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
  }

  return response.json();
};

export const fetchAuditStats = async (accessToken: string): Promise<AuditLogStats> => {
  const response = await fetch('/api/audit/stats', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch audit stats: ${response.statusText}`);
  }

  return response.json();
};

export const fetchActionTypes = async (accessToken: string): Promise<string[]> => {
  const response = await fetch('/api/audit/actions', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch action types: ${response.statusText}`);
  }

  const data = await response.json();
  return data.actions;
};

export const fetchUsers = async (
  accessToken: string
): Promise<Array<{ id: string; email: string; name: string }>> => {
  const response = await fetch('/api/users', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.statusText}`);
  }

  const data = await response.json();
  return data.users;
};
