import useStore from '@store/store';
import { DocumentInterface } from '@type/document';

interface MessageHistoryResult {
  updateMessageContent: (content: string) => void;
  updateMessageHistory: () => void;
}

/**
 * Custom hook for managing message history state updates
 * Reduces complexity by centralizing message history operations
 */
const useMessageHistory = (): MessageHistoryResult => {
  const setChats = useStore(state => state.setChats);
  const currentChatIndex = useStore(state => state.currentChatIndex);

  const updateMessageContent = (content: string): void => {
    const stateChats = useStore.getState().chats;
    if (!Array.isArray(stateChats)) return;
    if (currentChatIndex < 0 || currentChatIndex >= stateChats.length) return;

    const updatedChats: DocumentInterface[] = JSON.parse(JSON.stringify(stateChats));

    const chat = updatedChats[currentChatIndex];
    const msgs = chat?.messageCurrent?.messages;
    if (!Array.isArray(msgs) || msgs.length === 0) return;

    msgs[msgs.length - 1].content += content;
    chat.messageCurrent.messages = msgs;

    updateMessageHistoryForChat(updatedChats);
    setChats(updatedChats);
  };

  const updateMessageHistory = (): void => {
    const stateChats = useStore.getState().chats;
    if (!Array.isArray(stateChats)) return;
    if (currentChatIndex < 0 || currentChatIndex >= stateChats.length) return;

    const updatedChats: DocumentInterface[] = JSON.parse(JSON.stringify(stateChats));
    updateMessageHistoryForChat(updatedChats);
    setChats(updatedChats);
  };

  const updateMessageHistoryForChat = (updatedChats: DocumentInterface[]): void => {
    const chat = updatedChats?.[currentChatIndex];
    if (!chat) return;

    const current = chat.messageCurrent;
    const history = Array.isArray(chat.messageHistory) ? [...chat.messageHistory] : [];

    const idx = history.findIndex(m => m.id === current.id);
    if (idx >= 0) {
      history[idx] = current;
    } else {
      history.push(current);
    }

    chat.messageHistory = history;
  };

  return {
    updateMessageContent,
    updateMessageHistory,
  };
};

export default useMessageHistory;
