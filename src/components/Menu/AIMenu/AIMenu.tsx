import { useEffect, useRef, useState, useCallback } from 'react';

import useStore from '@store/store';

import ChatContent from '@components/Chat/ChatContent/ChatContent';
import PromptMenuContent from './PromptLibrary/PromptMenuContent';
import ChatHistoryContent from './History/ChatHistoryContent';
import Header from './Header';
import ConfigMenu from '@components/Menu/AIMenu/Config/Config';

const AIMenu = () => {
  const hideSideAIMenu = useStore(state => state.hideSideAIMenu);
  const setHideSideAIMenu = useStore(state => state.setHideSideAIMenu);
  const [activeMenu, setActiveMenu] = useState('chat');
  const windowWidthRef = useRef<number>(window.innerWidth);

  const handleResize = useCallback(() => {
    if (windowWidthRef.current !== window.innerWidth) {
      if (window.innerWidth < 1280) {
        setHideSideAIMenu(true);
      } else {
        setHideSideAIMenu(false);
      }
      windowWidthRef.current = window.innerWidth;
    }
  }, [setHideSideAIMenu]);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  return (
    <>
      <div
        id="menu"
        className={`group/menu dark border-white/10 border-l bg-gray-900 fixed md:inset-y-0 md:flex md:w-[365px] md:flex-col transition-transform z-[999] top-0 right-0 h-full max-md:w-3/4 ${
          hideSideAIMenu
            ? // ''
              'translate-x-[100%]'
            : 'translate-x-[0%]'
          // ''
        }`}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex h-full w-full flex-1 items-start border-white/10">
            <nav className="flex h-full flex-1 flex-col">
              <div className="flex gap-2 p-2 border-b border-white/10">
                <Header setActiveMenu={setActiveMenu} activeMenu={activeMenu} />
              </div>
              {activeMenu === 'chat' ? (
                <ChatContent />
              ) : activeMenu === 'settings' ? (
                <PromptMenuContent setActiveMenu={setActiveMenu} />
              ) : activeMenu === 'config' ? (
                <ConfigMenu />
              ) : activeMenu === 'history' ? (
                <ChatHistoryContent setActiveMenu={setActiveMenu} />
              ) : (
                <ChatContent />
              )}
            </nav>
          </div>
        </div>
      </div>
      <div
        id="menu-backdrop"
        className={`${
          hideSideAIMenu ? 'hidden' : ''
        } xl:hidden fixed top-0 left-0 h-full w-full z-[60] bg-gray-900/70`}
        onClick={() => {
          setHideSideAIMenu(true);
        }}
      />
    </>
  );
};

export default AIMenu;
