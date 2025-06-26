/**
 * Authentication hook
 * T-02: OAuth 2.0 + JWT integration
 */
import { useEffect, useState } from 'react';
import useStore from '@store/store';
import { authAPI } from '@api/auth-api';

export const useAuth = () => {
  const { isAuthenticated, accessToken, refreshToken, user, setTokens, setUser, logout } =
    useStore();

  const [isLoading, setIsLoading] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(false);

  // Check backend availability on mount
  useEffect(() => {
    checkBackend();
  }, []);

  // Auto-refresh tokens
  useEffect(() => {
    if (accessToken && refreshToken) {
      setupTokenRefresh();
    }
  }, [accessToken, refreshToken]);

  const checkBackend = async () => {
    const available = await authAPI.healthCheck();
    setBackendAvailable(available);
  };

  const login = async (provider: 'google' | 'microsoft') => {
    if (!backendAvailable) {
      throw new Error('Backend not available. Using fallback Google OAuth.');
    }

    setIsLoading(true);
    try {
      const loginData = await authAPI.initiateLogin(provider);

      // Redirect to OAuth provider
      window.location.href = loginData.auth_url;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCallback = async (code: string, provider: string, state?: string) => {
    setIsLoading(true);
    try {
      const tokenData = await authAPI.handleCallback(code, provider, state);

      // Store tokens and user data
      setTokens(tokenData.access_token, tokenData.refresh_token);
      setUser(tokenData.user);

      return tokenData;
    } catch (error) {
      console.error('Callback handling failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAccessToken = async () => {
    if (!refreshToken) {
      logout();
      return null;
    }

    try {
      const newTokens = await authAPI.refreshToken(refreshToken);
      setTokens(newTokens.access_token, newTokens.refresh_token);
      return newTokens.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return null;
    }
  };

  const setupTokenRefresh = () => {
    // Set up automatic token refresh before expiry
    // JWT tokens typically expire in 30 minutes, refresh at 25 minutes
    const refreshInterval = 25 * 60 * 1000; // 25 minutes

    const interval = setInterval(() => {
      if (isAuthenticated && refreshToken) {
        refreshAccessToken();
      } else {
        clearInterval(interval);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  };

  const getCurrentUser = async () => {
    if (!accessToken) return null;

    try {
      const userData = await authAPI.getCurrentUser(accessToken);
      setUser(userData.user);
      return userData.user;
    } catch (error) {
      console.error('Get user failed:', error);
      // Token might be expired, try refresh
      const newToken = await refreshAccessToken();
      if (newToken) {
        const userData = await authAPI.getCurrentUser(newToken);
        setUser(userData.user);
        return userData.user;
      }
      return null;
    }
  };

  const hasRole = (role: 'editor' | 'admin'): boolean => {
    if (!user) return false;
    return user.role === role || (role === 'editor' && user.role === 'admin');
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin' || false;
  };

  return {
    // State
    isAuthenticated,
    isLoading,
    user,
    backendAvailable,

    // Actions
    login,
    logout,
    handleCallback,
    refreshAccessToken,
    getCurrentUser,

    // Utilities
    hasRole,
    isAdmin,
  };
};
