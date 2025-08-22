/**
 * Audit log types and interfaces for T-13 security audit system
 */

export interface AuditLogEntry {
  id: string;
  action_type: string;
  resource_type?: string;
  resource_id?: string;
  user_id?: string;
  user_email?: string;
  user_role?: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  description: string;
  details?: string;
  status: 'success' | 'failure' | 'error';
  timestamp: string;
  created_at: string;
}

export interface AuditLogStats {
  totalLogs: number;
  logsByAction: Record<string, number>;
  logsByUser: Record<string, number>;
  logsByStatus: Record<string, number>;
  logsByDate: Record<string, number>;
  recentActions: number;
}

export interface AuditLogFilters {
  userId?: string;
  userEmail?: string;
  actionType?: string;
  status?: string;
  ipAddress?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface AuditLogSortConfig {
  field: keyof AuditLogEntry;
  direction: 'asc' | 'desc';
}

export interface AuditLogPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
