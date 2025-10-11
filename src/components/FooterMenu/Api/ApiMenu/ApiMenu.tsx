import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '@store/store';
import { useAuth } from '@hooks/useAuth';
import { credentialsAPI, ApiKeyStatus } from '@api/credentials-api';

import PopupModal from '@components/PopupModal';

const ApiMenu = ({
  setIsModalOpen,
}: {
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { t } = useTranslation(['main', 'api']);
  const { token, isAuthenticated } = useAuth();

  const apiKey = useStore(state => state.apiKey);
  const setApiKey = useStore(state => state.setApiKey);

  const [_apiKey, _setApiKey] = useState<string>(apiKey || '');
  const [keyStatus, setKeyStatus] = useState<ApiKeyStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [fetchingStatus, setFetchingStatus] = useState<boolean>(false);

  // Fetch API key status on mount
  const fetchApiKeyStatus = useCallback(async () => {
    if (!isAuthenticated || !token) return;

    setFetchingStatus(true);
    try {
      const status = await credentialsAPI.getApiKeyStatus(token);
      setKeyStatus(status);
      if (status.has_api_key) {
        // Update local state to show preview
        _setApiKey(status.key_preview || '');
      }
    } catch (err) {
      console.error('Failed to fetch API key status:', err);
    } finally {
      setFetchingStatus(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    fetchApiKeyStatus();
  }, [fetchApiKeyStatus]);

  const handleSave = async () => {
    // Require authentication - no localStorage fallback
    if (!isAuthenticated || !token) {
      setError('Authentication required. Please log in to configure your API key.');
      return;
    }

    if (!_apiKey) {
      setError('API key is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await credentialsAPI.saveApiKey(token, _apiKey);
      // Keep in store for backward compatibility
      setApiKey(_apiKey);
      setIsModalOpen(false);
      // Refresh status
      await fetchApiKeyStatus();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to save API key. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PopupModal
      title={t('api') as string}
      setIsModalOpen={setIsModalOpen}
      handleConfirm={handleSave}
    >
      <div className="p-6 border-b border-gray-200 dark:border-gray-600">
        {/* API Key Status Display */}
        {isAuthenticated && keyStatus && keyStatus.has_api_key && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              API Key Configured
            </p>
            {keyStatus.key_preview && (
              <p className="text-xs text-green-600 dark:text-green-300 mt-1 font-mono">
                {keyStatus.key_preview}
              </p>
            )}
          </div>
        )}

        {/* Loading state */}
        {fetchingStatus && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">Loading API key status...</p>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="flex gap-2 items-center justify-center mt-2">
          <div className="min-w-fit text-gray-900 dark:text-gray-300 text-sm">
            {t('apiKey.inputLabel', { ns: 'api' })}
          </div>
          <input
            type="text"
            className="text-gray-800 dark:text-white p-3 text-sm border-none bg-gray-200 dark:bg-gray-600 rounded-md m-0 w-full mr-0 h-8 focus:outline-none disabled:opacity-50"
            value={_apiKey}
            onChange={e => {
              _setApiKey(e.target.value);
            }}
            disabled={loading}
          />
        </div>

        <div className="min-w-fit text-gray-900 dark:text-gray-300 text-sm flex flex-col gap-3 leading-relaxed">
          <p className="mt-4">
            You can access your OpenAI API keys by clicking{' '}
            <a
              href="https://platform.openai.com/account/api-keys"
              className="link"
              target="_blank"
              rel="noreferrer"
            >
              here.
            </a>
          </p>
          <p>
            Your API key is encrypted and securely stored on our backend server using AES-256
            encryption. All requests to OpenAI are proxied through our backend to ensure security
            and proper key management. You can update or delete your key at any time.
          </p>
        </div>
      </div>
    </PopupModal>
  );
};

export default ApiMenu;
