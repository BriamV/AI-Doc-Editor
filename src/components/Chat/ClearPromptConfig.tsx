import { useCallback } from 'react';
import { Checkmark, SettingsCheck, Close } from '@carbon/icons-react';
import useStore from '@store/store';

const ClearPromptConfig = () => {
  const currentChatIndex = useStore(state => state.currentChatIndex);
  const chats = useStore(state => state.chats);
  const setChats = useStore(state => state.setChats);
  const editorRefresh = useStore(state => state.forceEditorRefresh);
  const setEditorRefresh = useStore(state => state.setForceEditorRefresh);

  const changeSelection = useCallback(() => {
    if (chats) {
      const tempChats = JSON.parse(JSON.stringify(chats));
      tempChats[currentChatIndex].messageCurrent.config = null;
      setChats(tempChats);
      setEditorRefresh(!editorRefresh);
    }
  }, [chats, currentChatIndex, setChats, editorRefresh, setEditorRefresh]);

  return (
    <div
      className={`group flex w-20 cursor-pointer items-center gap-3 break-all rounded-md bg-gray-800 p-3 text-sm hover:bg-gray-850`}
      onClick={changeSelection}
      onMouseDown={e => {
        e.preventDefault();
      }}
    >
      <SettingsCheck size={16} className="group-hover:text-white transition-colors duration-200" />
      <div className="flex-1 overflow-hidden text-ellipsis break-all" />
      <div className="absolute right-2 z-10 flex text-white">
        <div className="hidden group-hover:block">
          <Close size={16} />
        </div>
        <div className="block group-hover:hidden">
          <Checkmark size={16} />
        </div>
      </div>
    </div>
  );
};

export default ClearPromptConfig;
