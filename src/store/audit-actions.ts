/**
 * Audit log action handlers for T-13 security audit system
 */
import { AuditSlice } from './audit-slice';
import { AuditLogFilters, AuditLogSortConfig, AuditLogPagination } from './audit-types';

type SetFunction = (update: Partial<AuditSlice>) => void;

export const createFilterActions = (set: SetFunction, get: () => AuditSlice) => ({
  setFilters: (newFilters: Partial<AuditLogFilters>) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...newFilters };

    set({
      filters: updatedFilters,
      pagination: { ...get().pagination, page: 1 }, // Reset to first page when filtering
    });

    // Auto-fetch with new filters
    get().fetchAuditLogs();
  },

  clearFilters: () => {
    set({
      filters: {},
      pagination: { ...get().pagination, page: 1 },
    });
    get().fetchAuditLogs();
  },

  setSortConfig: (sortConfig: AuditLogSortConfig) => {
    set({ sortConfig });
    get().fetchAuditLogs();
  },
});

export const createPaginationActions = (set: SetFunction, get: () => AuditSlice) => ({
  setPagination: (newPagination: Partial<AuditLogPagination>) => {
    const currentPagination = get().pagination;
    set({
      pagination: { ...currentPagination, ...newPagination },
    });
  },

  goToPage: (page: number) => {
    set({
      pagination: { ...get().pagination, page },
    });
    get().fetchAuditLogs();
  },

  changePageSize: (pageSize: number) => {
    set({
      pagination: { ...get().pagination, pageSize, page: 1 },
    });
    get().fetchAuditLogs();
  },
});

export const createUIActions = (set: SetFunction, get: () => AuditSlice) => ({
  toggleRowExpansion: (logId: string) => {
    const expandedRows = new Set(get().expandedRows);
    if (expandedRows.has(logId)) {
      expandedRows.delete(logId);
    } else {
      expandedRows.add(logId);
    }
    set({ expandedRows });
  },

  toggleLogSelection: (logId: string) => {
    const selectedLogs = new Set(get().selectedLogs);
    if (selectedLogs.has(logId)) {
      selectedLogs.delete(logId);
    } else {
      selectedLogs.add(logId);
    }
    set({ selectedLogs });
  },

  selectAllLogs: () => {
    const logIds = get().auditLogs.map(log => log.id);
    set({ selectedLogs: new Set(logIds) });
  },

  clearSelection: () => {
    set({ selectedLogs: new Set() });
  },
});

export const createSettingsActions = (set: SetFunction) => ({
  setAutoRefresh: (enabled: boolean) => {
    set({ autoRefresh: enabled });
  },

  setRefreshInterval: (seconds: number) => {
    set({ refreshInterval: seconds });
  },

  setAuditError: (error: string) => {
    set({ error });
  },

  clearAuditError: () => {
    set({ error: '' });
  },
});
