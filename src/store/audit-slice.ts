/**
 * Audit log store slice for T-13 security audit system
 * Manages audit log viewer state, filters, and data
 */
import { StoreSlice } from './store';
import {
  AuditLogEntry,
  AuditLogStats,
  AuditLogFilters,
  AuditLogSortConfig,
  AuditLogPagination,
} from './audit-types';
import {
  fetchAuditLogs as fetchAuditLogsAPI,
  fetchAuditStats as fetchAuditStatsAPI,
  fetchActionTypes as fetchActionTypesAPI,
  fetchUsers as fetchUsersAPI,
} from './audit-api';
import {
  generateCSVContent,
  generateJSONContent,
  createDownloadFile,
  generateFilename,
} from './audit-utils';
import {
  createFilterActions,
  createPaginationActions,
  createUIActions,
  createSettingsActions,
} from './audit-actions';

// Re-export types for backwards compatibility
export type {
  AuditLogEntry,
  AuditLogStats,
  AuditLogFilters,
  AuditLogSortConfig,
  AuditLogPagination,
};

export interface AuditSlice {
  // Data state
  auditLogs: AuditLogEntry[];
  auditStats: AuditLogStats | null;
  actionTypes: string[];
  users: Array<{ id: string; email: string; name: string }>;

  // UI state
  filters: AuditLogFilters;
  sortConfig: AuditLogSortConfig;
  pagination: AuditLogPagination;
  expandedRows: Set<string>;
  selectedLogs: Set<string>;

  // Loading and error states
  isLoading: boolean;
  isLoadingStats: boolean;
  isExporting: boolean;
  error: string;
  lastRefresh: Date | null;

  // Auto-refresh
  autoRefresh: boolean;
  refreshInterval: number; // in seconds

  // Actions - Data fetching
  fetchAuditLogs: () => Promise<void>;
  fetchAuditStats: () => Promise<void>;
  fetchActionTypes: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  refreshData: () => Promise<void>;

  // Actions - Filters and sorting
  setFilters: (filters: Partial<AuditLogFilters>) => void;
  clearFilters: () => void;
  setSortConfig: (sortConfig: AuditLogSortConfig) => void;

  // Actions - Pagination
  setPagination: (pagination: Partial<AuditLogPagination>) => void;
  goToPage: (page: number) => void;
  changePageSize: (pageSize: number) => void;

  // Actions - UI state
  toggleRowExpansion: (logId: string) => void;
  toggleLogSelection: (logId: string) => void;
  selectAllLogs: () => void;
  clearSelection: () => void;

  // Actions - Auto-refresh
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (seconds: number) => void;

  // Actions - Export
  exportLogs: (format: 'csv' | 'json', selectedOnly?: boolean) => Promise<void>;

  // Actions - Error handling
  setAuditError: (error: string) => void;
  clearAuditError: () => void;
}

const defaultFilters: AuditLogFilters = {};

const defaultSortConfig: AuditLogSortConfig = {
  field: 'timestamp',
  direction: 'desc',
};

const defaultPagination: AuditLogPagination = {
  page: 1,
  pageSize: 25,
  total: 0,
  totalPages: 0,
};

export const createAuditSlice: StoreSlice<AuditSlice> = (set, get) => ({
  // Initial state
  auditLogs: [],
  auditStats: null,
  actionTypes: [],
  users: [],
  filters: defaultFilters,
  sortConfig: defaultSortConfig,
  pagination: defaultPagination,
  expandedRows: new Set(),
  selectedLogs: new Set(),
  isLoading: false,
  isLoadingStats: false,
  isExporting: false,
  error: '',
  lastRefresh: null,
  autoRefresh: false,
  refreshInterval: 30,

  // Data fetching actions
  fetchAuditLogs: async () => {
    const state = get();
    set({ isLoading: true, error: '' });

    try {
      const { filters, sortConfig, pagination } = state;

      const data = await fetchAuditLogsAPI({
        filters,
        sortConfig,
        pagination,
        accessToken: get().accessToken || '',
      });

      set({
        auditLogs: data.logs,
        pagination: {
          ...pagination,
          total: data.total,
          totalPages: Math.ceil(data.total / pagination.pageSize),
        },
        lastRefresh: new Date(),
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch audit logs',
        isLoading: false,
      });
    }
  },

  fetchAuditStats: async () => {
    set({ isLoadingStats: true });

    try {
      const stats = await fetchAuditStatsAPI(get().accessToken || '');
      set({ auditStats: stats, isLoadingStats: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch audit stats',
        isLoadingStats: false,
      });
    }
  },

  fetchActionTypes: async () => {
    try {
      const actions = await fetchActionTypesAPI(get().accessToken || '');
      set({ actionTypes: actions });
    } catch (error) {
      console.error('Failed to fetch action types:', error);
    }
  },

  fetchUsers: async () => {
    try {
      const users = await fetchUsersAPI(get().accessToken || '');
      set({ users });
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  },

  refreshData: async () => {
    const state = get();
    await Promise.all([
      state.fetchAuditLogs(),
      state.fetchAuditStats(),
      state.fetchActionTypes(),
      state.fetchUsers(),
    ]);
  },

  // Filter and sorting actions
  ...createFilterActions(set, get),

  // Pagination actions
  ...createPaginationActions(set, get),

  // UI state actions
  ...createUIActions(set, get),

  // Auto-refresh actions
  ...createSettingsActions(set),

  // Export actions
  exportLogs: async (format, selectedOnly = false) => {
    const state = get();
    set({ isExporting: true });

    try {
      const logsToExport = selectedOnly
        ? state.auditLogs.filter(log => state.selectedLogs.has(log.id))
        : state.auditLogs;

      let content: string;
      let mimeType: string;

      if (format === 'csv') {
        content = generateCSVContent(logsToExport);
        mimeType = 'text/csv';
      } else {
        content = generateJSONContent(logsToExport);
        mimeType = 'application/json';
      }

      const filename = generateFilename(format);
      createDownloadFile(content, filename, mimeType);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to export logs',
      });
    } finally {
      set({ isExporting: false });
    }
  },
});
