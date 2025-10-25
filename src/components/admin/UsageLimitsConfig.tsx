/**
 * Usage Limits Configuration Component (T-03 ST3)
 *
 * Admin UI for configuring document and storage quotas per user.
 * Integrates with backend ConfigService (T-44) to persist limits.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@hooks/useAuth';

interface UsageLimits {
  max_documents_per_user: number;
  max_mb_per_user: number;
}

interface UsageLimitsConfigProps {
  onSave?: (limits: UsageLimits) => Promise<void>;
}

export default function UsageLimitsConfig({ onSave }: UsageLimitsConfigProps) {
  const { getToken } = useAuth();
  const [limits, setLimits] = useState<UsageLimits>({
    max_documents_per_user: 100,  // Default values
    max_mb_per_user: 1000,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch current limits from backend
  useEffect(() => {
    const fetchLimits = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = getToken();
        if (!token) {
          setError('Authentication required');
          return;
        }

        // Fetch both config values
        const [docsResponse, mbResponse] = await Promise.all([
          fetch('/api/config?key=max_documents_per_user', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }),
          fetch('/api/config?key=max_mb_per_user', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }),
        ]);

        if (!docsResponse.ok || !mbResponse.ok) {
          throw new Error('Failed to fetch configuration');
        }

        const docsData = await docsResponse.json();
        const mbData = await mbResponse.json();

        setLimits({
          max_documents_per_user: docsData.value ? parseInt(docsData.value) : 100,
          max_mb_per_user: mbData.value ? parseFloat(mbData.value) : 1000,
        });
      } catch (err) {
        console.error('Failed to fetch usage limits:', err);
        setError('Failed to load current limits. Using defaults.');
      } finally {
        setLoading(false);
      }
    };

    fetchLimits();
  }, [getToken]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const token = getToken();
      if (!token) {
        setError('Authentication required');
        return;
      }

      // Save both config values
      const responses = await Promise.all([
        fetch('/api/config', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: 'max_documents_per_user',
            value: limits.max_documents_per_user.toString(),
          }),
        }),
        fetch('/api/config', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: 'max_mb_per_user',
            value: limits.max_mb_per_user.toString(),
          }),
        }),
      ]);

      if (!responses.every(r => r.ok)) {
        throw new Error('Failed to save configuration');
      }

      setSuccessMessage('Configuration saved successfully');

      // Call optional onSave callback
      if (onSave) {
        await onSave(limits);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to save usage limits:', err);
      setError('Failed to save configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gray-800 rounded-lg">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Usage Limits Configuration</h2>
        <p className="text-gray-400 text-sm">
          Configure maximum documents and storage per user to prevent system abuse.
        </p>
      </div>

      {/* Current Usage Display */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-700 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-300 mb-1">Document Limit</h3>
          <p className="text-3xl font-bold text-white">{limits.max_documents_per_user}</p>
          <p className="text-xs text-gray-400 mt-1">documents per user</p>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-300 mb-1">Storage Limit</h3>
          <p className="text-3xl font-bold text-white">{limits.max_mb_per_user}</p>
          <p className="text-xs text-gray-400 mt-1">MB per user</p>
        </div>
      </div>

      {/* Edit Form */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-400">Loading configuration...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="max_documents_per_user"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Max Documents per User
            </label>
            <input
              type="number"
              id="max_documents_per_user"
              name="max_documents_per_user"
              min={1}
              max={10000}
              value={limits.max_documents_per_user}
              onChange={(e) =>
                setLimits({ ...limits, max_documents_per_user: parseInt(e.target.value) || 1 })
              }
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Maximum number of documents a user can upload (1-10,000)
            </p>
          </div>

          <div>
            <label
              htmlFor="max_mb_per_user"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Max Storage per User (MB)
            </label>
            <input
              type="number"
              id="max_mb_per_user"
              name="max_mb_per_user"
              min={1}
              max={100000}
              value={limits.max_mb_per_user}
              onChange={(e) =>
                setLimits({ ...limits, max_mb_per_user: parseFloat(e.target.value) || 1 })
              }
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Maximum total storage size in megabytes (1-100,000 MB)
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-green-900/20 border border-green-500 rounded-lg">
              <p className="text-sm text-green-400">{successMessage}</p>
            </div>
          )}

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}
