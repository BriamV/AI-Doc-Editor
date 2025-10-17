/**
 * User Banner Component
 * Unified banner that displays different styles for TEST MODE vs OAuth authentication
 * - TEST MODE: Yellow warning banner for development
 * - OAuth: Blue informational banner for production
 */
import React from 'react';
import { useAuth } from '@hooks/useAuth';

interface UserBannerProps {
  className?: string;
}

const UserBanner: React.FC<UserBannerProps> = ({ className = '' }) => {
  const { user, logout } = useAuth();

  // Don't show banner if not authenticated
  if (!user) {
    return null;
  }

  const isTestMode = user.test_mode === true;

  // Only show banner in TEST MODE - production OAuth users don't need a banner
  if (!isTestMode) {
    return null;
  }

  // Test Mode Styling
  const testModeStyles = {
    container: 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-600',
    text: 'text-yellow-700 dark:text-yellow-300',
    textBold: 'text-yellow-800 dark:text-yellow-200',
    icon: 'text-yellow-600 dark:text-yellow-400',
    button: 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800',
    border: 'border-yellow-300 dark:border-yellow-700',
  };

  // OAuth Mode Styling
  const oauthStyles = {
    container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600',
    text: 'text-blue-700 dark:text-blue-300',
    textBold: 'text-blue-800 dark:text-blue-200',
    icon: 'text-blue-600 dark:text-blue-400',
    button: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800',
    border: 'border-blue-300 dark:border-blue-700',
  };

  const styles = isTestMode ? testModeStyles : oauthStyles;

  // Provider display name
  const getProviderDisplay = (provider: string) => {
    if (!provider) return 'OAuth';
    return provider.charAt(0).toUpperCase() + provider.slice(1);
  };

  return (
    <div
      className={`user-banner ${styles.container} border-b-2 px-4 py-2 ${className}`}
      data-testid={isTestMode ? 'test-mode-banner' : 'oauth-banner'}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {/* Icon: Warning for TEST MODE, Shield for OAuth */}
            {isTestMode ? (
              <svg
                className={`w-5 h-5 ${styles.icon}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            ) : (
              <svg
                className={`w-5 h-5 ${styles.icon}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            )}

            {/* Banner Title */}
            <span className={`font-semibold ${styles.textBold}`}>
              {isTestMode ? 'TEST MODE' : `Signed in via ${getProviderDisplay(user.provider)}`}
            </span>
          </div>

          {/* User Info - Desktop */}
          <div className={`hidden sm:flex items-center space-x-4 text-sm ${styles.text}`}>
            <div className="flex items-center space-x-1">
              <span className="font-medium">User:</span>
              <span>{user.email}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="font-medium">Role:</span>
              <span className="capitalize">{user.role}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Warning Message + Logout */}
        <div className="flex items-center space-x-4">
          {isTestMode && (
            <span className={`text-xs ${styles.icon} hidden md:block`}>
              Development authentication - not for production use
            </span>
          )}
          <button
            onClick={logout}
            className={`px-3 py-1 text-xs font-medium ${styles.button} text-white rounded transition-colors`}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Mobile user info */}
      <div className={`sm:hidden mt-2 pt-2 border-t ${styles.border}`}>
        <div className={`flex flex-col space-y-1 text-xs ${styles.text}`}>
          <div>
            <span className="font-medium">User:</span> {user.email}
          </div>
          <div>
            <span className="font-medium">Role:</span>{' '}
            <span className="capitalize">{user.role}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserBanner;
