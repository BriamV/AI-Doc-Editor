/**
 * Test Login Component
 * Passwordless authentication for development/testing
 * Uses /api/auth/test/login endpoint with @test.local users
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';

interface TestUser {
  email: string;
  name: string;
  role: string;
}

interface TestLoginProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const TestLogin: React.FC<TestLoginProps> = ({ onSuccess, onError }) => {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuth();
  const [testUsers, setTestUsers] = useState<TestUser[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available test users on mount
  useEffect(() => {
    const fetchTestUsers = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/auth/test/users');
        if (!response.ok) {
          throw new Error('Failed to fetch test users');
        }
        const data = await response.json();
        setTestUsers(data.users || []);
        // Pre-select admin user if available
        const adminUser = data.users.find((u: TestUser) => u.role === 'admin');
        if (adminUser) {
          setSelectedEmail(adminUser.email);
        } else if (data.users.length > 0) {
          setSelectedEmail(data.users[0].email);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load test users';
        setError(errorMessage);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchTestUsers();
  }, []);

  const handleTestLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmail) {
      setError('Please select a test user');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/auth/test/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: selectedEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Test login failed');
      }

      const data = await response.json();

      // Store tokens
      setTokens(data.access_token, data.refresh_token);

      // Store user with test_mode flag
      setUser({
        ...data.user,
        test_mode: data.test_mode,
      });

      // Save to localStorage for persistence
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('test_mode', String(data.test_mode));

      onSuccess?.();
      navigate('/');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingUsers) {
    return (
      <div className="test-login p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-blue-700">Loading test users...</span>
        </div>
      </div>
    );
  }

  if (error && testUsers.length === 0) {
    return (
      <div className="test-login p-4 bg-red-50 border border-red-200 rounded-lg">
        <h4 className="font-semibold text-red-800 mb-2">Test Mode Unavailable</h4>
        <p className="text-red-700 text-sm">{error}</p>
        <p className="text-red-600 text-xs mt-2">
          Make sure the backend is running and ENVIRONMENT=development
        </p>
      </div>
    );
  }

  return (
    <div className="test-login p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
      <div>
        <h4 className="font-semibold text-blue-800 mb-1">Test Login (Development Only)</h4>
        <p className="text-blue-600 text-xs">Passwordless authentication with @test.local users</p>
      </div>

      <form onSubmit={handleTestLogin} className="space-y-3">
        <div>
          <label htmlFor="test-user" className="block text-sm font-medium text-blue-900 mb-1">
            Select Test User
          </label>
          <select
            id="test-user"
            value={selectedEmail}
            onChange={e => setSelectedEmail(e.target.value)}
            className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            {testUsers.map(user => (
              <option key={user.email} value={user.email}>
                {user.email} - {user.role}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !selectedEmail}
          className={`w-full px-4 py-2 rounded-md text-white font-medium transition-colors ${
            isLoading || !selectedEmail
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Signing in...</span>
            </span>
          ) : (
            'Sign in (No Password)'
          )}
        </button>
      </form>

      <div className="text-xs text-blue-600 space-y-1">
        <p>⚠️ Test mode only - auto-disabled in production</p>
        <p>🔑 Tokens expire in 8 hours (development mode)</p>
      </div>
    </div>
  );
};

export default TestLogin;
