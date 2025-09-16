import useStore from '@store/store';
import { DocumentInterface, MessageInterface, ConfigInterface } from '@type/document';
import { updateTotalTokenUsed } from '@utils/messageUtils';
import useApiValidation from './useApiValidation';
import useStreamProcessor from './useStreamProcessor';
import useMessageHistory from './useMessageHistory';
import useTitleGeneration from './useTitleGeneration';

// Helper: build next chat with an assistant placeholder immutably
const buildNextChat = (baseChat: DocumentInterface): DocumentInterface => ({
  ...baseChat,
  messageCurrent: {
    ...baseChat.messageCurrent,
    messages: [...baseChat.messageCurrent.messages, { role: 'assistant', content: '' }],
  },
});

// Helper: fetch validated stream and process it
const processMessagesStream = async (
  messages: MessageInterface[],
  cfg: ConfigInterface,
  getValidatedStream: (
    messages: MessageInterface[],
    cfg: ConfigInterface
  ) => Promise<ReadableStream | null>,
  processStreamFn: (
    stream: ReadableStream,
    onContentUpdate: (content: string) => void
  ) => Promise<void>,
  updateMessageContent: (content: string) => void
): Promise<void> => {
  const stream = await getValidatedStream(messages, cfg);
  if (stream) {
    await processStreamFn(stream, updateMessageContent);
  }
};

// Helper: update tokens and generate title
const updateUsageAndTitle = async (
  cfg: NonNullable<DocumentInterface['messageCurrent']['config']>,
  idx: number,
  generateAndSetTitleFn: (
    cfg: NonNullable<DocumentInterface['messageCurrent']['config']>
  ) => Promise<void>
) => {
  const currChats = useStore.getState().chats;
  const countTotalTokens = useStore.getState().countTotalTokens;
  const defaultChatConfig = useStore.getState().defaultChatConfig;

  if (Array.isArray(currChats) && countTotalTokens) {
    const model = cfg ? cfg.model : defaultChatConfig.model;
    const curr = currChats.at(idx);
    const msgs = curr?.messageCurrent.messages ?? [];
    const completion = msgs.at(-1);
    if (completion) updateTotalTokenUsed(model, msgs.slice(0, -1), completion);
  }

  await generateAndSetTitleFn(cfg ? cfg : defaultChatConfig);
};

const useSubmit = () => {
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

  const handleSubmit = async () => {
    const chats = useStore.getState().chats;
    if (generating || !Array.isArray(chats)) return;

    const idx = currentChatIndex;
    if (typeof idx !== 'number' || idx < 0 || idx >= chats.length) return;

    const defaultChatConfig = useStore.getState().defaultChatConfig;

    const baseChat = chats.at(idx);
    if (!baseChat) return;

    const config = baseChat.messageCurrent.config ?? defaultChatConfig;

    const nextChat = buildNextChat(baseChat);

    const nextChats: DocumentInterface[] = chats.slice();
    nextChats[idx] = nextChat;
    setChats(nextChats);
    setGenerating(true);

    try {
      const submitChat = nextChat; // chat with appended assistant placeholder
      if (!submitChat.messageCurrent.messages.length) throw new Error('No messages submitted!');

      //         config? config.max_completion_tokens : defaultChatConfig.max_completion_tokens,
      //         config? config.model : defaultChatConfig.model,
      //       );

      const messages = submitChat.messageCurrent.messages;
      if (messages.length === 0) throw new Error('Message exceed max token!');
      await processMessagesStream(
        messages,
        config ? config : defaultChatConfig,
        getValidatedStream,
        processStream,
        updateMessageContent
      );

      // update tokens used in chatting & generate title for new chats
      await updateUsageAndTitle(config ? config : defaultChatConfig, idx, generateAndSetTitle);
    } catch (e: unknown) {
      const err = (e as Error).message;
      console.log(err);
      setError(err);
    }
    setGenerating(false);
  };

  return { handleSubmit, error };
};

export default useSubmit;
