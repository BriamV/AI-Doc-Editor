/**
 * Enhanced authentication component
 * T-02: OAuth 2.0 + JWT with multiple providers
 */
import React, { useState } from 'react';
import { useAuth } from '@hooks/useAuth';

interface AuthLoginProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const AuthLogin: React.FC<AuthLoginProps> = ({ onSuccess, onError }) => {
  const { login, isLoading, backendAvailable } = useAuth();
  const [selectedProvider, setSelectedProvider] = useState<'google' | 'microsoft'>('google');

  const handleLogin = async (provider: 'google' | 'microsoft') => {
    try {
      await login(provider);
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      onError?.(errorMessage);
      console.error('Login error:', error);
    }
  };

  if (!backendAvailable) {
    return (
      <div className="auth-fallback p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">T-02 Backend Unavailable</h3>
        <p className="text-yellow-700 mb-3">
          OAuth + JWT backend is not running. Using existing Google OAuth.
        </p>
        <p className="text-sm text-yellow-600">
          To enable full T-02 features, start backend: <code>make docker-backend</code>
        </p>
      </div>
    );
  }

  return (
    <div className="auth-login space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Sign in to AI Doc Editor</h2>
        <p className="text-gray-600 mb-4">Choose your authentication provider</p>
      </div>

      <div className="space-y-3">
        {/* Google Login */}
        <button
          onClick={() => handleLogin('google')}
          disabled={isLoading}
          className={`
            w-full flex items-center justify-center px-4 py-3 border rounded-lg
            transition-colors duration-200
            ${
              selectedProvider === 'google'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            }
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
          `}
          onMouseEnter={() => setSelectedProvider('google')}
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isLoading && selectedProvider === 'google' ? 'Signing in...' : 'Continue with Google'}
        </button>

        {/* Microsoft Login */}
        <button
          onClick={() => handleLogin('microsoft')}
          disabled={isLoading}
          className={`
            w-full flex items-center justify-center px-4 py-3 border rounded-lg
            transition-colors duration-200
            ${
              selectedProvider === 'microsoft'
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            }
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
          `}
          onMouseEnter={() => setSelectedProvider('microsoft')}
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#f25022" d="M1 1h10v10H1z" />
            <path fill="#00a4ef" d="M13 1h10v10H13z" />
            <path fill="#7fba00" d="M1 13h10v10H1z" />
            <path fill="#ffb900" d="M13 13h10v10H13z" />
          </svg>
          {isLoading && selectedProvider === 'microsoft'
            ? 'Signing in...'
            : 'Continue with Microsoft'}
        </button>
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>

      {/* Backend Status Indicator */}
      <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
        <div
          className={`w-2 h-2 rounded-full ${backendAvailable ? 'bg-green-500' : 'bg-red-500'}`}
        />
        <span>T-02 Backend: {backendAvailable ? 'Available' : 'Unavailable'}</span>
      </div>
    </div>
  );
};

export default AuthLogin;
