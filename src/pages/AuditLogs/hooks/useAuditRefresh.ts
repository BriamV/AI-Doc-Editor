/**
 * Custom hook for managing audit log auto-refresh functionality
 */
import { useEffect, useCallback } from 'react';
import useStore from '@store/store';

// Effect: auto-refresh on interval when enabled
const useAutoRefreshEffect = (
  autoRefresh: boolean,
  refreshInterval: number,
  refreshData: () => void
) => {
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (autoRefresh && refreshInterval > 0) {
      interval = setInterval(() => {
        refreshData();
      }, refreshInterval * 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, refreshData]);
};

// Effect: initial load waits for presence of an auth token (store or localStorage)
const useInitialLoadEffect = (refreshData: () => void) => {
  useEffect(() => {
    let cancelled = false;

    const hasToken = () => {
      const tokenInStore = useStore.getState().accessToken;
      const tokenInLS =
        typeof window !== 'undefined' ? window.localStorage.getItem('auth_token') : '';
      return Boolean(tokenInStore || tokenInLS);
    };

    const trigger = () => {
      if (cancelled) return;
      if (hasToken()) {
        refreshData();
      } else {
        setTimeout(() => {
          if (!cancelled && hasToken()) {
            refreshData();
          }
        }, 150);
      }
    };

    const t = setTimeout(trigger, 120);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [refreshData]);
};

export const useAuditRefresh = () => {
  const { autoRefresh, refreshInterval, refreshData, setAutoRefresh, setRefreshInterval } =
    useStore();

  // Effects
  useAutoRefreshEffect(autoRefresh, refreshInterval, refreshData);
  useInitialLoadEffect(refreshData);

  // Handlers
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
