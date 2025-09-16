/**
 * Custom hook for audit log state management
 */
import useStore from '@store/store';

export const useAuditState = () => {
  const {
    auditLogs,
    auditStats,
    isLoading,
    isLoadingStats,
    error,
    lastRefresh,
    autoRefresh,
    refreshInterval,
    selectedLogs,
    clearAuditError,
    clearSelection,
  } = useStore();

  return {
    auditLogs,
    auditStats,
    isLoading,
    isLoadingStats,
    error,
    lastRefresh,
    autoRefresh,
    refreshInterval,
    selectedLogs,
    clearAuditError,
    clearSelection,
  };
};
