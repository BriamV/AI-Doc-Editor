/**
 * Custom hook for managing audit log auto-refresh functionality
 */
import { useEffect, useCallback } from 'react';
import useStore from '@store/store';

export const useAuditRefresh = () => {
  const { autoRefresh, refreshInterval, refreshData, setAutoRefresh, setRefreshInterval } =
    useStore();

  // Auto-refresh functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (autoRefresh && refreshInterval > 0) {
      interval = setInterval(() => {
        refreshData();
      }, refreshInterval * 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh, refreshInterval, refreshData]);

  // Initial data load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleRefresh = useCallback(() => {
    refreshData();
  }, [refreshData]);

  const handleAutoRefreshToggle = useCallback(() => {
    setAutoRefresh(!autoRefresh);
  }, [autoRefresh, setAutoRefresh]);

  const handleRefreshIntervalChange = useCallback(
    (seconds: number) => {
      setRefreshInterval(seconds);
    },
    [setRefreshInterval]
  );

  return {
    handleRefresh,
    handleAutoRefreshToggle,
    handleRefreshIntervalChange,
  };
};
