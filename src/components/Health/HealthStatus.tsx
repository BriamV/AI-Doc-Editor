/**
 * T-23: Health-check API UI Component
 * Frontend health status display component
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  checkSystemHealth,
  formatHealthStatus,
  debugHealth,
  HealthCheckResponse,
} from '@api/health/health-check';

interface HealthStatusProps {
  showDetails?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const HealthStatus: React.FC<HealthStatusProps> = ({
  showDetails = false,
  autoRefresh = false,
  refreshInterval = 30000, // 30 seconds
}) => {
  const [healthData, setHealthData] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const health = await checkSystemHealth();
      setHealthData(health);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Health check failed');
      setHealthData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();

    let intervalId: ReturnType<typeof setInterval> | undefined;
    if (autoRefresh) {
      intervalId = setInterval(fetchHealth, refreshInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, refreshInterval, fetchHealth]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleDebugClick = () => {
    debugHealth();
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
        <span>Checking system health...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 text-sm text-red-600">
        <span>⚠️</span>
        <span>Health check failed: {error}</span>
        <button onClick={fetchHealth} className="text-blue-600 hover:text-blue-800 underline">
          Retry
        </button>
      </div>
    );
  }

  if (!healthData) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Main Health Status */}
      <div className={`p-3 rounded-lg border ${getStatusColor(healthData.health.status)}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">{formatHealthStatus(healthData.health)}</div>
            <div className="text-xs opacity-75">
              Environment: {healthData.environment} | Uptime:{' '}
              {(healthData.uptime / 1000).toFixed(1)}s
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={fetchHealth}
              className="text-xs px-2 py-1 rounded bg-white/50 hover:bg-white/75 transition-colors"
              title="Refresh health status"
            >
              🔄
            </button>
            {import.meta.env.MODE === 'development' && (
              <button
                onClick={handleDebugClick}
                className="text-xs px-2 py-1 rounded bg-white/50 hover:bg-white/75 transition-colors"
                title="Debug health info to console"
              >
                🐛
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Dependencies (if requested) */}
      {showDetails && healthData.health.dependencies && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Dependencies</h4>
          {Object.entries(healthData.health.dependencies).map(([name, status]) => (
            <div
              key={name}
              className={`p-2 rounded border ${getStatusColor(status.status)} text-xs`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium capitalize">{name}</span>
                <div className="flex items-center space-x-2">
                  <span
                    className={
                      status.status === 'ok'
                        ? 'text-green-600'
                        : status.status === 'degraded'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    }
                  >
                    {status.status.toUpperCase()}
                  </span>
                  {status.responseTime && (
                    <span className="text-gray-500">{status.responseTime}ms</span>
                  )}
                </div>
              </div>
              {status.error && <div className="mt-1 text-xs opacity-75">{status.error}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Timestamp */}
      <div className="text-xs text-gray-500">
        Last checked: {new Date(healthData.health.timestamp).toLocaleString()}
      </div>
    </div>
  );
};

export default HealthStatus;
