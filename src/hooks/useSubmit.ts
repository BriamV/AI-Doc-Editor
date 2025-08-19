import useStore from '@store/store';
import { DocumentInterface } from '@type/document';
import { updateTotalTokenUsed } from '@utils/messageUtils';
import useApiValidation from './useApiValidation';
import useStreamProcessor from './useStreamProcessor';
import useMessageHistory from './useMessageHistory';
import useTitleGeneration from './useTitleGeneration';

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
    if (generating || !chats) return;

    const updatedChats: DocumentInterface[] = JSON.parse(JSON.stringify(chats));
    const defaultChatConfig = useStore.getState().defaultChatConfig;

    const config = updatedChats[currentChatIndex].messageCurrent.config
      ? updatedChats[currentChatIndex].messageCurrent.config
      : defaultChatConfig;

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

      //       const messages = limitMessageTokens(
      //         chats[currentChatIndex].messageCurrent.messages,
      // //        undefined,
      //         config? config.max_completion_tokens : defaultChatConfig.max_completion_tokens,
      //         config? config.model : defaultChatConfig.model,
      //       );

      const messages = chats[currentChatIndex].messageCurrent.messages;

      if (messages.length === 0) throw new Error('Message exceed max token!');

      stream = await getValidatedStream(messages, config ? config : defaultChatConfig);

      if (stream) {
        await processStream(stream, updateMessageContent);
      }

      // update tokens used in chatting
      const currChats = useStore.getState().chats;
      const countTotalTokens = useStore.getState().countTotalTokens;

      if (currChats && countTotalTokens) {
        const model = config ? config.model : defaultChatConfig.model;
        const messages = currChats[currentChatIndex].messageCurrent.messages;
        updateTotalTokenUsed(model, messages.slice(0, -1), messages[messages.length - 1]);
      }

      // generate title for new chats
      await generateAndSetTitle(config ? config : defaultChatConfig);
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
