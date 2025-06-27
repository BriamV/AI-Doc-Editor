import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '@store/store';
import { Idea, RecentlyViewed, TrashCan, Chat } from '@carbon/icons-react';
import useClearChat from '@hooks/useClearChat';
import defaultStyles from '@components/style';

const Header = ({
  setActiveMenu,
  activeMenu,
}: {
  setActiveMenu: React.Dispatch<React.SetStateAction<string>>;
  activeMenu: string;
}) => {
  useTranslation();
  const clearChat = useClearChat();
  const setGenerating = useStore(state => state.setGenerating);

  const [chatCleared, setChatCleared] = useState(false);

  const handleReturnChatClick = () => {
    setActiveMenu('chat');
  };

  const handleClearChatClick = () => {
    setGenerating(false);
    setChatCleared(true);
  };

  useEffect(() => {
    if (chatCleared) {
      setTimeout(clearChat, 100);
      setActiveMenu('chat');
      setChatCleared(false);
    }
  }, [chatCleared, clearChat, setActiveMenu]);

  return (
    <div className="flex w-full justify-between">
      <div>
        {activeMenu == 'chat' ? (
          <div className={defaultStyles.buttonStyle} onClick={handleClearChatClick}>
            <TrashCan size={16} />
          </div>
        ) : (
          <div
            className={defaultStyles.buttonStyle + ' bg-gray-800'}
            onClick={handleReturnChatClick}
          >
            <Chat size={16} />
          </div>
        )}
      </div>
      <div className="flex">
        <div
          onClick={() => {
            if (activeMenu === 'history') {
              setActiveMenu('chat');
            } else {
              setActiveMenu('history');
            }
          }}
          className={defaultStyles.buttonStyle}
          title="Chat History"
        >
          <RecentlyViewed size={16} />
        </div>

        <div
          onClick={() => {
            if (activeMenu === 'settings') {
              setActiveMenu('chat');
            } else {
              setActiveMenu('settings');
            }
          }}
          className={defaultStyles.buttonStyle}
          title="Change Prompt"
        >
          <Idea size={16} />
        </div>
      </div>
    </div>
  );
};
Header.displayName = 'Header';
export default React.memo(Header);
