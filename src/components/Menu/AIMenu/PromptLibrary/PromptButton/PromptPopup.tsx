import { useCallback, useEffect, useState } from 'react';
import useStore from '@store/store';
import PopupModal from '@components/PopupModal';
import { _defaultChatConfig } from '@constants/chat';
import { PromptIndividualConfig } from './PromptIndividualConfig';

import type { Prompt } from '@type/document';

interface PromptPopupProps {
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  prompt: Prompt;
  index: number;
  _promptName: string;
  _setPromptName: React.Dispatch<React.SetStateAction<string>>;
}

export const PromptPopup = ({
  setIsModalOpen,
  prompt,
  index,
  _promptName,
  _setPromptName,
}: PromptPopupProps) => {
  const prompts = useStore(state => state.prompts);
  const setPrompts = useStore(state => state.setPrompts);
  const [_prompt, _setPrompt] = useState<string>(prompt.prompt);
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [isSelectionChecked, setIsSelectionChecked] = useState<boolean>(prompt.includeSelection);

  const updateChecked = useCallback(() => {
    if (prompts[index].config == null) {
      setIsChecked(true);
    } else {
      setIsChecked(false);
    }
  }, [prompts, index]);

  useEffect(() => {
    updateChecked();
  }, [updateChecked, prompt.config]);

  function handleIndividualPromptConfig() {
    const tempPrompts = JSON.parse(JSON.stringify(prompts));
    if (prompt.config == null) {
      tempPrompts[index].config = _defaultChatConfig;
    } else {
      tempPrompts[index].config = null;
    }
    setPrompts(tempPrompts);
    updateChecked();
  }

  function handleSelectionChecked() {
    setIsSelectionChecked(!isSelectionChecked);
    const tempPrompts = JSON.parse(JSON.stringify(prompts));
    tempPrompts[index].includeSelection = !isSelectionChecked;
    setPrompts(tempPrompts);
  }

  const handleOnFocus = (e: React.FocusEvent<HTMLTextAreaElement, Element>) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
    e.target.style.maxHeight = `${e.target.scrollHeight}px`;
  };

  const handleOnBlur = (e: React.FocusEvent<HTMLTextAreaElement, Element>) => {
    e.target.style.height = 'auto';
    e.target.style.maxHeight = '2.5rem';
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
    e.target.style.maxHeight = `${e.target.scrollHeight}px`;
  };

  return (
    <PopupModal title={'Prompt Config'} setIsModalOpen={setIsModalOpen} fullWidth={true}>
      <div className="p-6 border-b border-gray-200 dark:border-gray-600 w-full">
        <div className="flex mb-4 flex-col">
          <div className="mb-2">
            <span className="text-white">Name:</span>
            <textarea
              className="m-0 resize-none rounded-lg bg-gray-800 mt-2 p-2 text-gray-400 overflow-y-hidden leading-7 p-1 focus:ring-1 focus:ring-blue w-full max-h-10 transition-all"
              onFocus={handleOnFocus}
              onBlur={handleOnBlur}
              onChange={e => {
                _setPromptName(e.target.value);
                const tempPrompts = JSON.parse(JSON.stringify(prompts));
                tempPrompts[index].name = e.target.value;
                setPrompts(tempPrompts);
              }}
              onInput={handleInput}
              value={_promptName}
              rows={1}
              maxLength={32}
            ></textarea>
          </div>

          <div className="mb-2">
            <span className="text-white">Prompt:</span>
            <textarea
              className="m-0 resize-none rounded-lg bg-gray-800 mt-2 p-2 text-gray-400 overflow-y-hidden leading-7 p-1 focus:ring-1 focus:ring-blue w-full max-h-10 transition-all"
              onFocus={handleOnFocus}
              onBlur={handleOnBlur}
              onChange={e => {
                let tempPrompts = prompts;
                _setPrompt(e.target.value);
                tempPrompts[index].prompt = e.target.value;
                setPrompts(tempPrompts);
              }}
              onInput={handleInput}
              value={_prompt}
              rows={1}
            ></textarea>
          </div>
          <div className="flex items-center mb-2 mt-2">
            <div className="text-gray-800 dark:text-gray-100">Automatically include selection</div>
            <input
              type="checkbox"
              className="w-4 h-4 border border-gray-300 rounded-md checked:bg-blue-600 checked:border-transparent focus:outline-none ml-4"
              checked={isSelectionChecked}
              onChange={handleSelectionChecked}
            />
          </div>

          <div className="flex items-center mb-2">
            <div className="text-gray-800 dark:text-gray-100">Use global chat config</div>
            <input
              type="checkbox"
              className="w-4 h-4 border border-gray-300 rounded-md checked:bg-blue-600 checked:border-transparent focus:outline-none ml-4"
              checked={isChecked}
              onChange={handleIndividualPromptConfig}
            />
          </div>
        </div>

        {prompt.config == null ? <></> : <PromptIndividualConfig prompt={prompt} index={index} />}
      </div>
    </PopupModal>
  );
};

export default PromptPopup;
