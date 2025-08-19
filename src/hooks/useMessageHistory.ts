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
    const updatedChats: DocumentInterface[] = JSON.parse(JSON.stringify(useStore.getState().chats));

    const updatedMessages = updatedChats[currentChatIndex].messageCurrent.messages;
    updatedMessages[updatedMessages.length - 1].content += content;
    updatedChats[currentChatIndex].messageCurrent.messages = updatedMessages;

    updateMessageHistoryForChat(updatedChats);
    setChats(updatedChats);
  };

  const updateMessageHistory = (): void => {
    const updatedChats: DocumentInterface[] = JSON.parse(JSON.stringify(useStore.getState().chats));

    updateMessageHistoryForChat(updatedChats);
    setChats(updatedChats);
  };

  const updateMessageHistoryForChat = (updatedChats: DocumentInterface[]): void => {
    let matchFound = false;
    let messageHistory = updatedChats[currentChatIndex].messageHistory;

    for (let i = 0; i < messageHistory.length; i++) {
      if (messageHistory[i].id === updatedChats[currentChatIndex].messageCurrent.id) {
        messageHistory[i] = updatedChats[currentChatIndex].messageCurrent;
        matchFound = true;
        break;
      }
    }

    if (!matchFound) {
      messageHistory.push(updatedChats[currentChatIndex].messageCurrent);
    }

    updatedChats[currentChatIndex].messageHistory = messageHistory;
  };

  return {
    updateMessageContent,
    updateMessageHistory,
  };
};

export default useMessageHistory;
