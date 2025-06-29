import useStore from '@store/store';
import { Add } from '@carbon/icons-react';

import { DocumentInterface } from '@type/document';
import { generateDefaultDocument } from '@constants/chat';
import React from 'react';

const NewMessageButton = React.memo(({ messageIndex }: { messageIndex: number }) => {
  const chats = useStore(state => state.chats);
  const setChats = useStore(state => state.setChats);
  const currentChatIndex = useStore(state => state.currentChatIndex);
  const setCurrentChatIndex = useStore(state => state.setCurrentChatIndex);

  const addChat = () => {
    if (chats) {
      const updatedChats: DocumentInterface[] = JSON.parse(JSON.stringify(chats));
      let titleIndex = 1;
      let title = `New Chat ${titleIndex}`;

      while (chats.some(chat => chat.title === title)) {
        titleIndex += 1;
        title = `New Chat ${titleIndex}`;
      }

      updatedChats.unshift(generateDefaultDocument({ title: title }));
      setChats(updatedChats);
      setCurrentChatIndex(0);
    }
  };

  const addMessage = () => {
    if (currentChatIndex === -1) {
      addChat();
    } else {
      const updatedChats: DocumentInterface[] = JSON.parse(JSON.stringify(chats));
      updatedChats[currentChatIndex].messageCurrent.messages.splice(messageIndex + 1, 0, {
        content: '',
        role: 'user',
      });
      setChats(updatedChats);
    }
  };

  return (
    <div className="h-0 w-0 relative" key={messageIndex}>
      <div
        className="absolute top-0 right-0 translate-x-1/2 translate-y-[-50%] text-gray-600 dark:text-white cursor-pointer bg-gray-200 dark:bg-gray-600/80 rounded-full p-1 text-sm hover:bg-gray-300 dark:hover:bg-gray-800/80 transition-bg duration-200"
        onClick={addMessage}
      >
        <Add />
      </div>
    </div>
  );
});

NewMessageButton.displayName = 'NewMessageButton';

export default NewMessageButton;
