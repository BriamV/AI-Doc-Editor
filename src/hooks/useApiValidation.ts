import useStore from '@store/store';
import { useTranslation } from 'react-i18next';
import { ConfigInterface, MessageInterface } from '@type/document';
import { getChatCompletionStream } from '@api/api';
import { officialAPIEndpoint } from '@constants/auth';

/**
 * Custom hook for API key and endpoint validation logic
 * Reduces complexity by centralizing API validation patterns
 */
const useApiValidation = () => {
  const { t } = useTranslation('api');
  const apiEndpoint = useStore(state => state.apiEndpoint);
  const apiKey = useStore(state => state.apiKey);

  const validateApiKey = (): void => {
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

    if (!apiKey || apiKey.length === 0) {
      // other endpoints without API key
      return await getChatCompletionStream(useStore.getState().apiEndpoint, messages, config);
    } else {
      // own apikey
      return await getChatCompletionStream(
        useStore.getState().apiEndpoint,
        messages,
        config,
        apiKey
      );
    }
  };

  return {
    validateApiKey,
    getValidatedStream,
    hasApiKey: !!apiKey && apiKey.length > 0,
    isOfficialEndpoint: apiEndpoint === officialAPIEndpoint,
  };
};

export default useApiValidation;
