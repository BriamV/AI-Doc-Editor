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

  // Build the final prompt with optional selection
  const buildFinalPrompt = (prompt: string, includeSelection: boolean): string => {
    if (!includeSelection) return prompt;

    const currentSelection = useStore.getState().currentSelection;
    const cleanSelection = cleanTextSelection(currentSelection);
    return prompt + '\n\n' + cleanSelection + '\n\n';
  };

  //   const chatMessages: MessageInterface[] = [
  //     {
  //         role: 'system',
  //         content: prompt,
  //     },
  // ];

  // Initialize chat messages for a new conversation
  const initializeChatMessages = (
    prompt: string,
    includeSelection: boolean,
    modifiedConfig: ConfigInterface
  ): void => {
    const finalPrompt = buildFinalPrompt(prompt, includeSelection);

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

    const stateChats = useStore.getState().chats;
    if (!Array.isArray(stateChats)) return;
    if (currentChatIndex < 0 || currentChatIndex >= stateChats.length) return;

    const next = stateChats.map((c, i) =>
      i === currentChatIndex
        ? {
            ...c,
            messageCurrent: generateDefaultMessage(modifiedConfig, chatMessages),
          }
        : c
    );
    setChats(next);
  };

  // Prepare chat state for submission
  const prepareSubmissionState = (): DocumentInterface[] => {
    const chats = useStore.getState().chats;
    if (!Array.isArray(chats)) throw new Error('No chats available');
    if (currentChatIndex < 0 || currentChatIndex >= chats.length)
      throw new Error('Invalid chat index');

    const updatedChats: DocumentInterface[] = JSON.parse(JSON.stringify(chats));

    const chat = updatedChats[currentChatIndex];
    if (!chat?.messageCurrent?.messages) throw new Error('Invalid chat messages');

    chat.messageCurrent.messages.push({
      role: 'assistant',
      content: '',
    });

    return updatedChats;
  };

  // Process message tokens and validate
  const prepareMessages = (
    chats: DocumentInterface[],
    modifiedConfig: ConfigInterface,
    defaultChatConfig: ConfigInterface
  ) => {
    if (
      !Array.isArray(chats) ||
      currentChatIndex < 0 ||
      currentChatIndex >= chats.length ||
      !chats[currentChatIndex]?.messageCurrent?.messages ||
      chats[currentChatIndex].messageCurrent.messages.length === 0
    ) {
      throw new Error('No messages submitted!');
    }

    const maxTokens =
      modifiedConfig.max_completion_tokens || defaultChatConfig.max_completion_tokens;
    const model = modifiedConfig.model || defaultChatConfig.model;

    const messages = limitMessageTokens(
      chats[currentChatIndex].messageCurrent.messages,
      maxTokens,
      model
    );

    if (messages.length === 0) {
      throw new Error('Message exceed max token!');
    }

    return messages;
  };

  // Update token usage after successful completion
  const updateTokenUsage = (modifiedConfig: ConfigInterface) => {
    const currChats = useStore.getState().chats;
    const countTotalTokens = useStore.getState().countTotalTokens;

    if (!Array.isArray(currChats) || !countTotalTokens) return;
    if (currentChatIndex < 0 || currentChatIndex >= currChats.length) return;

    const model = modifiedConfig.model;
    const messages = currChats[currentChatIndex]?.messageCurrent?.messages;
    if (!Array.isArray(messages) || messages.length === 0) return;

    updateTotalTokenUsed(model, messages.slice(0, -1), messages[messages.length - 1]);
  };

  // Main submission handler
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

    if (generating || !Array.isArray(chats)) return;

    try {
      const updatedChats = prepareSubmissionState();
      setGenerating(true);

      // Update first message with final prompt
      const finalPrompt = buildFinalPrompt(prompt, includeSelection);
      const withFinalPrompt = updatedChats.map((c, i) => {
        if (i !== 0) return c; // preserva comportamiento existente
        const msgs = c?.messageCurrent?.messages;
        if (!Array.isArray(msgs) || msgs.length === 0) return c;
        const first = { ...msgs[0], content: finalPrompt };
        return {
          ...c,
          messageCurrent: {
            ...c.messageCurrent,
            messages: [first, ...msgs.slice(1)],
          },
        };
      });
      setChats(withFinalPrompt);

      // Ensure model is set
      const effectiveConfig: ConfigInterface = {
        ...modifiedConfig,
        model: modifiedConfig.model || defaultChatConfig.model,
      };

      const messages = prepareMessages(withFinalPrompt, effectiveConfig, defaultChatConfig);
      const stream = await getValidatedStream(messages, effectiveConfig);

      if (stream) {
        await processStream(stream, updateMessageContent);
      }

      updateTokenUsage(effectiveConfig);
      await generateAndSetTitle(effectiveConfig);
    } catch (e: unknown) {
      const err = (e as Error).message;
      console.log(err);
      setError(err);
    }
    setGenerating(false);
  };

  return { handleSubmit, error };
};

export default useSubmitPromptAdjust;
