/**
 * Test Mode Banner Component
 * Visual indicator that the application is running in test authentication mode
 * Displays user info and provides logout functionality
 */
import React from 'react';
import { useAuth } from '@hooks/useAuth';

interface TestModeBannerProps {
  className?: string;
}

const TestModeBanner: React.FC<TestModeBannerProps> = ({ className = '' }) => {
  const { user, logout } = useAuth();

  // Only show banner if in test mode
  if (!user?.test_mode) {
    return null;
  }

  return (
    <div
      className={`test-mode-banner bg-yellow-100 border-b-2 border-yellow-400 px-4 py-2 ${className}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-yellow-600"
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
            <span className="font-semibold text-yellow-800">TEST MODE</span>
          </div>

          <div className="hidden sm:flex items-center space-x-4 text-sm text-yellow-700">
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

        <div className="flex items-center space-x-4">
          <span className="text-xs text-yellow-600 hidden md:block">
            Development authentication - not for production use
          </span>
          <button
            onClick={logout}
            className="px-3 py-1 text-xs font-medium bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Mobile user info */}
      <div className="sm:hidden mt-2 pt-2 border-t border-yellow-300">
        <div className="flex flex-col space-y-1 text-xs text-yellow-700">
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

export default TestModeBanner;
