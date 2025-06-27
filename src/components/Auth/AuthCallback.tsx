/**
 * OAuth callback handler component
 * T-02-ST1: Handle OAuth provider callbacks
 */
import React, { useEffect, useState } from 'react';
import { useAuth } from '@hooks/useAuth';

interface AuthCallbackProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const AuthCallback: React.FC<AuthCallbackProps> = ({ onSuccess, onError }) => {
  const { handleCallback } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const processCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const provider = urlParams.get('provider') || 'google';
      const error = urlParams.get('error');

      if (error) {
        const errorDescription =
          urlParams.get('error_description') || 'OAuth authentication failed';
        setStatus('error');
        setErrorMessage(errorDescription);
        onError?.(errorDescription);
        return;
      }

      if (!code) {
        setStatus('error');
        setErrorMessage('No authorization code received');
        onError?.('No authorization code received');
        return;
      }

      try {
        setStatus('processing');
        await handleCallback(code, provider, state || undefined);
        setStatus('success');
        onSuccess?.();

        // Redirect to main app after successful auth
        setTimeout(() => {
          window.location.assign('/');
        }, 2000);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Authentication failed';
        setStatus('error');
        setErrorMessage(message);
        onError?.(message);
      }
    };

    processCallback();
  }, [handleCallback, onSuccess, onError]);

  if (status === 'processing') {
    return (
      <div className="auth-callback flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="text-xl font-semibold">Completing sign in...</h2>
          <p className="text-gray-600">Please wait while we verify your authentication.</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="auth-callback flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-green-800">Sign in successful!</h2>
          <p className="text-gray-600">Redirecting to the application...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="auth-callback flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-red-800">Sign in failed</h2>
          <p className="text-gray-600">{errorMessage}</p>
          <button
            onClick={() => window.location.assign('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;
