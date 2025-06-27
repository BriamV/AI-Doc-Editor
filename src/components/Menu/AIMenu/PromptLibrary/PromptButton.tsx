import { useState } from 'react';
import useSubmitPromptAdjust from '@hooks/useSubmitPromptAdjust';
import { MagicWand } from '@carbon/icons-react';
import useStore from '@store/store';
import useClearChatPrompt from '@hooks/useClearChatPrompt';
import { Prompt } from '@type/prompt';
import { PromptButtonConfig } from '@components/Menu/AIMenu/PromptLibrary/PromptButton/Config';

const PromptButton = ({
  prompt,
  index,
  setActiveMenu,
}: {
  prompt: Prompt;
  index: number;
  setActiveMenu: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const setHideSideAIMenu = useStore(state => state.setHideSideAIMenu);

  const chats = useStore(state => state.chats);
  const clearChat = useClearChatPrompt();
  const { handleSubmit } = useSubmitPromptAdjust();
  const editorSettings = useStore(state => state.editorSettings);
  const setEditorSettings = useStore(state => state.setEditorSettings);
  const generating = useStore(state => state.generating);
  const setGenerating = useStore(state => state.setGenerating);
  const [_promptName, _setPromptName] = useState(prompt.name);

  const handleClickPlay = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (generating) {
      setGenerating(false);
    }

    // Check if the prompt has a custom configuration, otherwise pass null

    handleSubmit({
      prompt: prompt.prompt,
      includeSelection: prompt.includeSelection,
      modifiedConfig: prompt.config ?? undefined,
    });

    setHideSideAIMenu(false);
    if (chats) {
      setEditorSettings({ ...editorSettings, activeMenu: 'chat' });
      setActiveMenu('chat');
    }
  };

  const mouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleClickButton = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    clearChat(prompt.prompt);
    setHideSideAIMenu(false);
    if (chats) {
      setEditorSettings({ ...editorSettings, activeMenu: 'chat' });
      setActiveMenu('chat');
    }
  };

  return (
    <div className="flex py-2 pr-2 border border-transparent pl-3 items-center gap-3 relative bg-gray-800/30 hover:bg-gray-850 break-all hover:pr-4 group transition-opacity cursor-pointer opacity-100">
      <div
        className="flex-1 text-ellipsis max-h-5 overflow-hidden break-all relative capitalize"
        onClick={handleClickButton}
      >
        {prompt.name.length > 0 ? <div>{_promptName}</div> : <div>No prompt name</div>}
      </div>
      <div className="absolute flex right-2 z-10 text-gray-300 visible">
        <div className="p-1 hover:text-white">
          <PromptButtonConfig
            prompt={prompt}
            _promptName={_promptName}
            _setPromptName={_setPromptName}
            index={index}
          />
        </div>
        <div className="p-1 hover:text-white" onClick={handleClickPlay} onMouseDown={mouseDown}>
          <MagicWand size={16} />
        </div>
      </div>
    </div>
  );
};

export default PromptButton;
