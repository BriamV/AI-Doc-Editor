/**
 * Enhanced authentication component
 * T-02: OAuth 2.0 + JWT with multiple providers
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@type/auth';
import { useAuth } from '@hooks/useAuth';

interface AuthLoginProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

// Login button component
const LoginButton = ({
  provider,
  selectedProvider,
  isLoading,
  onClick,
  onMouseEnter,
}: {
  provider: 'google' | 'microsoft';
  selectedProvider: 'google' | 'microsoft';
  isLoading: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}) => {
  const isGoogle = provider === 'google';
  const isSelected = selectedProvider === provider;
  const isCurrentlyLoading = isLoading && isSelected;

  const buttonText = isCurrentlyLoading
    ? 'Signing in...'
    : `Continue with ${isGoogle ? 'Google' : 'Microsoft'}`;

  const buttonClasses = `
    w-full flex items-center justify-center px-4 py-3 border rounded-lg
    transition-colors duration-200
    ${
      isSelected
        ? `border-${isGoogle ? 'blue-500' : 'blue-600'} bg-${isGoogle ? 'blue-50' : 'blue-50'} text-blue-700`
        : 'border-gray-300 hover:border-gray-400'
    }
    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
  `;

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={buttonClasses}
      onMouseEnter={onMouseEnter}
    >
      {isGoogle ? (
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
      ) : (
        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
          <path fill="#f25022" d="M1 1h10v10H1z" />
          <path fill="#00a4ef" d="M13 1h10v10H13z" />
          <path fill="#7fba00" d="M1 13h10v10H1z" />
          <path fill="#ffb900" d="M13 13h10v10H13z" />
        </svg>
      )}
      {buttonText}
    </button>
  );
};

// Backend fallback component
const BackendFallback = () => (
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

// Authentication header component
const AuthHeader = () => (
  <div className="text-center">
    <h2 className="text-xl font-semibold mb-2">Sign in to AI Doc Editor</h2>
    <p className="text-gray-600 mb-4">Choose your authentication provider</p>
  </div>
);

// Provider buttons container
const ProviderButtons = ({
  selectedProvider,
  isLoading,
  onProviderClick,
  onProviderHover,
}: {
  selectedProvider: 'google' | 'microsoft';
  isLoading: boolean;
  onProviderClick: (provider: 'google' | 'microsoft') => void;
  onProviderHover: (provider: 'google' | 'microsoft') => void;
}) => (
  <div className="space-y-3">
    <LoginButton
      provider="google"
      selectedProvider={selectedProvider}
      isLoading={isLoading}
      onClick={() => onProviderClick('google')}
      onMouseEnter={() => onProviderHover('google')}
    />
    <LoginButton
      provider="microsoft"
      selectedProvider={selectedProvider}
      isLoading={isLoading}
      onClick={() => onProviderClick('microsoft')}
      onMouseEnter={() => onProviderHover('microsoft')}
    />
  </div>
);

// Terms and privacy notice
const TermsNotice = () => (
  <div className="text-center">
    <p className="text-xs text-gray-500">
      By signing in, you agree to our Terms of Service and Privacy Policy
    </p>
  </div>
);

// Backend status indicator
const BackendStatus = ({ backendAvailable }: { backendAvailable: boolean }) => (
  <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
    <div className={`w-2 h-2 rounded-full ${backendAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
    <span>T-02 Backend: {backendAvailable ? 'Available' : 'Unavailable'}</span>
  </div>
);

const AuthLogin: React.FC<AuthLoginProps> = ({ onSuccess, onError }) => {
  const { login, isLoading, backendAvailable } = useAuth();
  const [selectedProvider, setSelectedProvider] = useState<'google' | 'microsoft'>('google');
  const navigate = useNavigate();

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

  // Dev/Test helper: simulate login without backend
  const handleTestLogin = (role: 'admin' | 'editor') => {
    const testUser: User = {
      id: '1',
      email: role === 'admin' ? 'admin@example.com' : 'user@example.com',
      name: role === 'admin' ? 'Admin' : 'Editor',
      role,
      provider: 'google',
    };

    // Security: Generate secure test token with expiry
    const generateSecureTestToken = (userRole: string): string => {
      const timestamp = Date.now();
      const randomBytes = crypto.getRandomValues(new Uint8Array(16));
      const randomHex = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '')).join('');
      return btoa(`test-${userRole}-${timestamp}-${randomHex}`);
    };

    // Set secure tokens with expiry (1 hour for testing)
    const secureToken = generateSecureTestToken(role);
    const expiry = Date.now() + 60 * 60 * 1000; // 1 hour

    window.localStorage.setItem('auth_token', secureToken);
    window.localStorage.setItem('user_role', role);
    window.localStorage.setItem('token_expiry', expiry.toString());

    // Use test interface exposed in main.tsx
    window.app?.login(testUser);
    // Navigate to home after test login
    navigate('/');
  };

  // When backend is not available, show fallback and also expose test login in dev/test
  if (!backendAvailable) {
    return (
      <div className="space-y-4">
        <BackendFallback />
        {(import.meta.env.DEV || import.meta.env.VITE_ENABLE_TESTING === 'true') && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
            <h4 className="font-semibold text-blue-800">Test Login (Dev/Test Only)</h4>
            <div className="flex gap-2">
              <button
                className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => handleTestLogin('admin')}
                data-testid="test-login-admin"
              >
                Sign in as Admin
              </button>
              <button
                className="px-3 py-2 rounded bg-gray-600 text-white hover:bg-gray-700"
                onClick={() => handleTestLogin('editor')}
                data-testid="test-login-editor"
              >
                Sign in as Editor
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="auth-login space-y-4">
      <AuthHeader />
      <ProviderButtons
        selectedProvider={selectedProvider}
        isLoading={isLoading}
        onProviderClick={handleLogin}
        onProviderHover={setSelectedProvider}
      />
      <TermsNotice />
      <BackendStatus backendAvailable={backendAvailable} />
      {(import.meta.env.DEV || import.meta.env.VITE_ENABLE_TESTING === 'true') && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
          <h4 className="font-semibold text-blue-800">Test Login (Dev/Test Only)</h4>
          <div className="flex gap-2">
            <button
              className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => handleTestLogin('admin')}
              data-testid="test-login-admin"
            >
              Sign in as Admin
            </button>
            <button
              className="px-3 py-2 rounded bg-gray-600 text-white hover:bg-gray-700"
              onClick={() => handleTestLogin('editor')}
              data-testid="test-login-editor"
            >
              Sign in as Editor
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthLogin;
