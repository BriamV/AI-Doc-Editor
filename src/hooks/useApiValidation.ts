import useStore from '@store/store';
import { useTranslation } from 'react-i18next';
import { ConfigInterface, MessageInterface } from '@type/document';
import { getChatCompletionStreamWrapper } from '@api/chat-wrapper';
import { officialAPIEndpoint } from '@constants/auth';

/**
 * Custom hook for API key and endpoint validation logic
 * Reduces complexity by centralizing API validation patterns
 * Updated to use backend proxy when authenticated
 */
const useApiValidation = () => {
  const { t } = useTranslation('api');
  const apiEndpoint = useStore(state => state.apiEndpoint);
  const apiKey = useStore(state => state.apiKey);
  const isAuthenticated = useStore(state => state.isAuthenticated);

  const validateApiKey = (): void => {
    // Skip validation if authenticated (backend handles it)
    if (isAuthenticated) return;

    if (!apiKey || apiKey.length === 0) {
      if (apiEndpoint === officialAPIEndpoint) {
        throw new Error(t('noApiKeyWarning') as string);
      }
    }
  };

  const getValidatedStream = async (
    messages: MessageInterface[],
    config: ConfigInterface
  ): Promise<ReadableStream | null> => {
    validateApiKey();

    // Use wrapper that handles backend proxy routing
    if (!apiKey || apiKey.length === 0) {
      // other endpoints without API key or authenticated backend
      return await getChatCompletionStreamWrapper({
        endpoint: useStore.getState().apiEndpoint,
        messages,
        config,
      });
    }

    // own apikey (legacy mode)
    return await getChatCompletionStreamWrapper({
      endpoint: useStore.getState().apiEndpoint,
      messages,
      config,
      apiKey,
    });
  };

  return {
    validateApiKey,
    getValidatedStream,
    hasApiKey: !!apiKey && apiKey.length > 0,
    isOfficialEndpoint: apiEndpoint === officialAPIEndpoint,
  };
};

export default useApiValidation;
