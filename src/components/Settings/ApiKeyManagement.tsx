import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@hooks/useAuth';

interface ApiKeyStatus {
  has_api_key: boolean;
  key_preview?: string;
}

const ApiKeyManagement: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<ApiKeyStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showKey, setShowKey] = useState(false);
  const { user, token } = useAuth();

  const fetchApiKeyStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/user/credentials', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (_error) {
      console.error('Error fetching API key status:', _error);
    }
  }, [token]);

  useEffect(() => {
    if (user && token) {
      fetchApiKeyStatus();
    }
  }, [user, token, fetchApiKeyStatus]);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setMessage('Please enter an API key');
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      setMessage('Invalid OpenAI API key format. Key must start with "sk-"');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/user/credentials', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ openai_api_key: apiKey }),
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        setApiKey('');
        setMessage('API key saved successfully');
        setShowKey(false);
      } else {
        const error = await response.json();
        setMessage(error.detail || 'Error saving API key');
      }
    } catch (_error) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApiKey = async () => {
    if (!confirm('Are you sure you want to delete your API key?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/user/credentials', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setStatus({ has_api_key: false });
        setMessage('API key deleted successfully');
      } else {
        const error = await response.json();
        setMessage(error.detail || 'Error deleting API key');
      }
    } catch (_error) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <p className="text-gray-600 dark:text-gray-400">Please log in to manage your API keys.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          OpenAI API Key Management
        </h3>
      </div>

      {status?.has_api_key ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                API Key Configured
              </p>
              <p className="text-sm text-green-600 dark:text-green-300">{status.key_preview}</p>
            </div>
            <button
              onClick={handleDeleteApiKey}
              disabled={loading}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
            >
              Delete
            </button>
          </div>

          <button
            onClick={() => setShowKey(!showKey)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {showKey ? 'Hide' : 'Update'} API Key
          </button>
        </div>
      ) : (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            No API key configured. Add your OpenAI API key to enable AI features.
          </p>
        </div>
      )}

      {(!status?.has_api_key || showKey) && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              OpenAI API Key
            </label>
            <input
              type="password"
              id="openai-api-key"
              name="openai-api-key"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Your API key is encrypted and never transmitted in plain text.
            </p>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleSaveApiKey}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save API Key'}
            </button>

            {showKey && (
              <button
                onClick={() => {
                  setShowKey(false);
                  setApiKey('');
                  setMessage('');
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {message && (
        <div
          className={`mt-4 p-3 rounded-md ${
            message.includes('successfully')
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
          }`}
        >
          <p className="text-sm">{message}</p>
        </div>
      )}
    </div>
  );
};

export default ApiKeyManagement;
