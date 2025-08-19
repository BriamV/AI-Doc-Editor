import useStore from '@store/store';
import { DocumentInterface, ConfigInterface, MessageInterface } from '@type/document';
import { limitMessageTokens, updateTotalTokenUsed } from '@utils/messageUtils';
import { generateDefaultMessage } from '@constants/chat';
import useApiValidation from './useApiValidation';
import useStreamProcessor from './useStreamProcessor';
import useMessageHistory from './useMessageHistory';
import useTitleGeneration from './useTitleGeneration';

const useSubmitPromptAdjust = () => {
  const error = useStore(state => state.error);
  const setError = useStore(state => state.setError);
  const setGenerating = useStore(state => state.setGenerating);
  const generating = useStore(state => state.generating);
  const currentChatIndex = useStore(state => state.currentChatIndex);
  const setChats = useStore(state => state.setChats);

  const { getValidatedStream } = useApiValidation();
  const { processStream } = useStreamProcessor();
  const { updateMessageContent } = useMessageHistory();
  const { generateAndSetTitle } = useTitleGeneration();

  //   const chatMessages: MessageInterface[] = [
  //     {
  //         role: 'system',
  //         content: prompt,
  //     },
  // ];

  const initializeChatMessages = (
    prompt: string,
    includeSelection: boolean,
    modifiedConfig: ConfigInterface
  ): void => {
    const currentSelection = useStore.getState().currentSelection;
    let finalPrompt = prompt;

    if (includeSelection) {
      const cleanSelection = cleanTextSelection(currentSelection);
      finalPrompt = prompt + '\n\n' + cleanSelection + '\n\n';
    }

    const chatMessages: MessageInterface[] = [
      {
        role: 'system',
        content: finalPrompt,
      },
      {
        role: 'assistant',
        content: '',
      },
    ];

    let resetChats = useStore.getState().chats;
    if (resetChats) {
      resetChats[currentChatIndex].messageCurrent = generateDefaultMessage(
        modifiedConfig,
        chatMessages
      );
      setChats(resetChats);
    }
  };

  const handleSubmit = async ({
    prompt,
    includeSelection,
    modifiedConfig,
  }: {
    prompt: string;
    includeSelection: boolean;
    modifiedConfig?: ConfigInterface;
  }) => {
    const chats = useStore.getState().chats;
    const defaultChatConfig = useStore.getState().defaultChatConfig;
    modifiedConfig = modifiedConfig || defaultChatConfig;

    initializeChatMessages(prompt, includeSelection, modifiedConfig);

    if (generating || !chats) return;

    const updatedChats: DocumentInterface[] = JSON.parse(JSON.stringify(chats));

    updatedChats[currentChatIndex].messageCurrent.messages.push({
      role: 'assistant',
      content: '',
    });

    setChats(updatedChats);
    setGenerating(true);

    try {
      let stream;
      if (chats[currentChatIndex].messageCurrent.messages.length === 0)
        throw new Error('No messages submitted!');
      const finalPrompt = includeSelection
        ? prompt + '\n\n' + cleanTextSelection(useStore.getState().currentSelection) + '\n\n'
        : prompt;
      chats[0].messageCurrent.messages[0].content = finalPrompt;

      const messages = limitMessageTokens(
        chats[currentChatIndex].messageCurrent.messages,
        modifiedConfig.max_completion_tokens
          ? modifiedConfig.max_completion_tokens
          : defaultChatConfig.max_completion_tokens,
        modifiedConfig.model ? modifiedConfig.model : defaultChatConfig.model
      );
      if (messages.length === 0) throw new Error('Message exceed max token!');

      // Ensure model is set
      if (!modifiedConfig.model) {
        modifiedConfig.model = defaultChatConfig.model;
      }

      stream = await getValidatedStream(messages, modifiedConfig);

      if (stream) {
        await processStream(stream, updateMessageContent);
      }

      // update tokens used in chatting
      const currChats = useStore.getState().chats;
      const countTotalTokens = useStore.getState().countTotalTokens;

      if (currChats && countTotalTokens) {
        const model = modifiedConfig.model;
        const messages = currChats[currentChatIndex].messageCurrent.messages;
        updateTotalTokenUsed(model, messages.slice(0, -1), messages[messages.length - 1]);
      }

      // generate title for new chats
      await generateAndSetTitle(modifiedConfig);
    } catch (e: unknown) {
      const err = (e as Error).message;
      console.log(err);
      setError(err);
    }
    setGenerating(false);
  };

  // Helper function to clean text selection
  const cleanTextSelection = (selection: string): string => {
    let cleaned = selection;
    if (selection.startsWith('\n')) {
      cleaned = selection.substring(1);
    }
    if (cleaned.endsWith('\n')) {
      cleaned = cleaned.substring(0, cleaned.length - 1);
    }
    return cleaned;
  };

  return { handleSubmit, error };
};

export default useSubmitPromptAdjust;
