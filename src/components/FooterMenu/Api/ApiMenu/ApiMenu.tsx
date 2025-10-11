import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '@store/store';
import { useAuth } from '@hooks/useAuth';
import { credentialsAPI, ApiKeyStatus } from '@api/credentials-api';

import useHideOnOutsideClick from '@hooks/useHideOnOutsideClick';
import PopupModal from '@components/PopupModal';
import { availableEndpoints, defaultAPIEndpoint } from '@constants/auth';
import { ChevronDown } from '@carbon/icons-react';

const ApiMenu = ({
  setIsModalOpen,
}: {
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { t } = useTranslation(['main', 'api']);
  const { token, isAuthenticated } = useAuth();

  const apiKey = useStore(state => state.apiKey);
  const setApiKey = useStore(state => state.setApiKey);
  const apiEndpoint = useStore(state => state.apiEndpoint);
  const setApiEndpoint = useStore(state => state.setApiEndpoint);

  const [_apiKey, _setApiKey] = useState<string>(apiKey || '');
  const [_apiEndpoint, _setApiEndpoint] = useState<string>(apiEndpoint);
  const [_customEndpoint, _setCustomEndpoint] = useState<boolean>(
    !availableEndpoints.includes(apiEndpoint)
  );
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
    // If authenticated, save to backend
    if (isAuthenticated && token && _apiKey) {
      setLoading(true);
      setError('');

      try {
        await credentialsAPI.saveApiKey(token, _apiKey);
        // Keep in store for backward compatibility
        setApiKey(_apiKey);
        setApiEndpoint(_apiEndpoint);
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
    } else {
      // Fallback: save to localStorage via store (legacy behavior)
      setApiKey(_apiKey);
      setApiEndpoint(_apiEndpoint);
      setIsModalOpen(false);
    }
  };

  const handleToggleCustomEndpoint = () => {
    if (_customEndpoint) _setApiEndpoint(defaultAPIEndpoint);
    else _setApiEndpoint('');
    _setCustomEndpoint(prev => !prev);
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
        <label className="flex gap-2 text-gray-900 dark:text-gray-300 text-sm items-center mb-4">
          <input
            type="checkbox"
            checked={_customEndpoint}
            className="w-4 h-4"
            onChange={handleToggleCustomEndpoint}
          />
          {t('customEndpoint', { ns: 'api' })}
        </label>

        <div className="flex gap-2 items-center mb-6">
          <div className="min-w-fit text-gray-900 dark:text-gray-300 text-sm">
            {t('apiEndpoint.inputLabel', { ns: 'api' })}
          </div>
          {_customEndpoint ? (
            <input
              type="text"
              className="text-gray-800 dark:text-white p-3 text-sm border-none bg-gray-200 dark:bg-gray-600 rounded-md m-0 w-full mr-0 h-8 focus:outline-none"
              value={_apiEndpoint}
              onChange={e => {
                _setApiEndpoint(e.target.value);
              }}
            />
          ) : (
            <ApiEndpointSelector _apiEndpoint={_apiEndpoint} _setApiEndpoint={_setApiEndpoint} />
          )}
        </div>

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
          {isAuthenticated ? (
            <p>
              Your API key is encrypted and securely stored on our backend server using AES-256
              encryption. It is never transmitted in plain text and is only used to process your
              requests to OpenAI. You can update or delete your key at any time.
            </p>
          ) : (
            <p>
              Your API key will be stored locally in your browser. For enhanced security, please log
              in to have your key encrypted and stored securely on our backend server.
            </p>
          )}
        </div>
      </div>
    </PopupModal>
  );
};

const ApiEndpointSelector = ({
  _apiEndpoint,
  _setApiEndpoint,
}: {
  _apiEndpoint: string;
  _setApiEndpoint: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const [dropDown, setDropDown, dropDownRef] = useHideOnOutsideClick();

  return (
    <div className="w-[40vw] relative flex-1">
      <button
        className="btn btn-neutral btn-small flex justify-between w-full"
        type="button"
        onClick={() => setDropDown(prev => !prev)}
      >
        <span className="truncate">{_apiEndpoint}</span>
        <ChevronDown />
      </button>
      <div
        id="dropdown"
        ref={dropDownRef}
        className={`${
          dropDown ? '' : 'hidden'
        } absolute top-100 bottom-100 z-10 bg-white rounded-lg shadow-xl border-b border-black/10 dark:border-gray-900/50 text-gray-800 dark:text-gray-100 group dark:bg-gray-800 opacity-90 w-32 w-full`}
      >
        <ul
          className="text-sm text-gray-700 dark:text-gray-200 p-0 m-0"
          aria-labelledby="dropdownDefaultButton"
        >
          {availableEndpoints.map(endpoint => (
            <li
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white cursor-pointer truncate"
              onClick={() => {
                _setApiEndpoint(endpoint);
                setDropDown(false);
              }}
              key={endpoint}
            >
              {endpoint}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ApiMenu;
