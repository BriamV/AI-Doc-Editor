import { useEffect } from 'react';
import useStore from '@store/store';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Document from '@components/Document/Document';
import DocumentMenu from '@components/Menu/DocumentMenu';
import AIMenu from '@components/Menu/AIMenu/AIMenu';
import Settings from '@pages/Settings';

import useInitialiseNewDocument from '@hooks/useInitialiseNewDocument';
import { DocumentInterface } from '@type/document';
import { Theme } from '@type/theme';
import ApiPopup from '@components/FooterMenu/Api/ApiPopup';
import Toast from '@components/Toast';
import { HealthStatus } from '@components/Health';
import FAQs from '@components/FAQs/FAQs';

function App() {
  const initialiseNewDocument = useInitialiseNewDocument();
  const setChats = useStore(state => state.setChats);
  const setTheme = useStore(state => state.setTheme);
  const setApiKey = useStore(state => state.setApiKey);
  const setCurrentChatIndex = useStore(state => state.setCurrentChatIndex);

  // a useEffect that resets the .edited variables of all items in chats to false

  useEffect(() => {
    const chats = useStore.getState().chats;

    if (chats && chats.length > 0) {
      const newChats = chats.map(chat => {
        chat.edited = false;
        return chat;
      });
      useStore.getState().setChats(newChats);
    }
  }, []);

  // useEffect(() => {
  //    document.documentElement.lang = i18n.language;
  //   i18n.on('languageChanged', (lng) => {
  //     document.documentElement.lang = lng;
  //   });
  // }, []);

  useEffect(() => {
    // legacy local storage
    const oldChats = localStorage.getItem('chats');
    const apiKey = localStorage.getItem('apiKey');
    const theme = localStorage.getItem('theme');

    if (apiKey) {
      // legacy local storage
      setApiKey(apiKey);
      localStorage.removeItem('apiKey');
    }

    if (theme) {
      // legacy local storage
      setTheme(theme as Theme);
      localStorage.removeItem('theme');
    }

    if (oldChats) {
      // legacy local storage
      try {
        const chats: DocumentInterface[] = JSON.parse(oldChats);
        if (chats.length > 0) {
          setChats(chats);
          setCurrentChatIndex(0);
        } else {
          initialiseNewDocument();
        }
      } catch (e: unknown) {
        console.error(e);
        initialiseNewDocument();
      }
      localStorage.removeItem('chats');
    } else {
      // existing local storage
      const chats = useStore.getState().chats;
      const currentChatIndex = useStore.getState().currentChatIndex;
      if (!chats || chats.length === 0) {
        initialiseNewDocument();
      }
      if (chats && !(currentChatIndex >= 0 && currentChatIndex < chats.length)) {
        setCurrentChatIndex(0);
      }
    }
  }, [initialiseNewDocument, setApiKey, setChats, setCurrentChatIndex, setTheme]);

  function Home() {
    return (
      <>
        <DocumentMenu />
        <Document />
        <AIMenu />
        <ApiPopup />
        <Toast />
        {/* Health Status - Development only */}
        {import.meta.env.MODE === 'development' && (
          <div className="fixed bottom-4 right-4 z-50 max-w-sm">
            <HealthStatus showDetails={true} autoRefresh={true} />
          </div>
        )}
      </>
    );
  }

  return (
    <div className="w-full h-full relative">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
