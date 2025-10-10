import useStore from '@store/store';
import { useTranslation } from 'react-i18next';
import { MessageInterface, ConfigInterface } from '@type/document';
import { getChatCompletionWrapper } from '@api/chat-wrapper';
import { updateTotalTokenUsed } from '@utils/messageUtils';
import { _defaultChatConfig } from '@constants/chat';
import { officialAPIEndpoint } from '@constants/auth';

interface TitleGenerationResult {
  generateAndSetTitle: (config: ConfigInterface) => Promise<void>;
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Custom hook for auto-title generation logic
 * Reduces complexity by centralizing title generation operations
 * Updated to use backend proxy when authenticated
 */
const useTitleGeneration = (): TitleGenerationResult => {
  const { t, i18n } = useTranslation('api');
  const apiEndpoint = useStore(state => state.apiEndpoint);
  const apiKey = useStore(state => state.apiKey);
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const currentChatIndex = useStore(state => state.currentChatIndex);
  const setChats = useStore(state => state.setChats);

  const generateTitle = async (message: MessageInterface[]): Promise<string> => {
    let data: ChatCompletionResponse;

    // Skip validation if authenticated (backend handles it)
    if (!isAuthenticated && (!apiKey || apiKey.length === 0)) {
      if (apiEndpoint === officialAPIEndpoint) {
        throw new Error(t('noApiKeyWarning') as string);
      }
    }

    // Use wrapper that handles backend proxy routing
    if (!apiKey || apiKey.length === 0) {
      data = (await getChatCompletionWrapper({
        endpoint: useStore.getState().apiEndpoint,
        messages: message,
        config: _defaultChatConfig,
      })) as ChatCompletionResponse;
    } else {
      data = (await getChatCompletionWrapper({
        endpoint: useStore.getState().apiEndpoint,
        messages: message,
        config: _defaultChatConfig,
        apiKey,
      })) as ChatCompletionResponse;
    }

    return data.choices[0].message.content;
  };

  const generateAndSetTitle = async (config: ConfigInterface): Promise<void> => {
    const currChats = useStore.getState().chats;
    const autoTitle = useStore.getState().autoTitle;
    const countTotalTokens = useStore.getState().countTotalTokens;

    if (!autoTitle || !currChats || currChats[currentChatIndex]?.titleSet) {
      return;
    }

    const messages_length = currChats[currentChatIndex].messageCurrent.messages.length;

    if (messages_length < 2) return;

    const assistant_message =
      currChats[currentChatIndex].messageCurrent.messages[messages_length - 1].content;
    const user_message =
      currChats[currentChatIndex].messageCurrent.messages[messages_length - 2].content;

    const message: MessageInterface = {
      role: 'user',
      content: `Generate a title in less than 6 words for the following message (language: ${i18n.language}):\n"""\nUser: ${user_message}\nAssistant: ${assistant_message}\n"""`,
    };

    let title = (await generateTitle([message])).trim();

    // Clean title formatting
    if (title.startsWith('"') && title.endsWith('"')) {
      title = title.slice(1, -1);
    }

    // Update chat with generated title
    const updatedChats = JSON.parse(JSON.stringify(useStore.getState().chats));
    updatedChats[currentChatIndex].title = title;
    updatedChats[currentChatIndex].titleSet = true;
    setChats(updatedChats);

    // Update token usage for title generation
    if (countTotalTokens) {
      const model = config.model || _defaultChatConfig.model;
      updateTotalTokenUsed(model, [message], {
        role: 'assistant',
        content: title,
      });
    }
  };

  return { generateAndSetTitle };
};

export default useTitleGeneration;
