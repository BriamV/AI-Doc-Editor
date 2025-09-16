import React, { useCallback, useEffect, useState } from 'react';
import useStore from '@store/store';
import { Prompt } from '@type/prompt';
import PopupModal from '@components/PopupModal';
import { _defaultChatConfig } from '@constants/chat';
import { PromptIndividualConfig } from './PromptIndividualConfig';

interface PromptPopupProps {
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  prompt: Prompt;
  index: number;
  _updatePrompt: (index: number, prompt: Prompt) => void;
  _prompts: Prompt[];
  _setPrompts: React.Dispatch<React.SetStateAction<Prompt[]>>;
}

export const PromptPopup = ({
  setIsModalOpen,
  prompt,
  index,
  _updatePrompt,
  _prompts,
  _setPrompts,
}: PromptPopupProps) => {
  const prompts = useStore(state => state.prompts);
  const setPrompts = useStore(state => state.setPrompts);
  const [_name, _setName] = useState<string>(prompt.name);
  const [_prompt, _setPrompt] = useState<string>(prompt.prompt);
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [isSelectionChecked, setIsSelectionChecked] = useState<boolean>(prompt.includeSelection);

  const updateChecked = useCallback(() => {
    const cfg = _prompts?.[index]?.config;
    setIsChecked(cfg == null);
  }, [_prompts, index]);

  useEffect(() => {
    updateChecked();
  }, [prompts, prompt.config, updateChecked]);

  function handleIndividualPromptConfig() {
    const next = _prompts?.map((p, i) =>
      i === index ? { ...p, config: p.config == null ? _defaultChatConfig : null } : p
    );
    if (next) {
      _setPrompts(next);
      setPrompts(next);
      updateChecked();
    }
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

  function handleSelectionChecked() {
    const newChecked = !isSelectionChecked;
    setIsSelectionChecked(newChecked);
    const next = prompts?.map((p, i) => (i === index ? { ...p, includeSelection: newChecked } : p));
    if (next) setPrompts(next);
  }

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
                const value = e.target.value;
                _setName(value);
                const next = _prompts?.map((p, i) => (i === index ? { ...p, name: value } : p));
                if (next) {
                  setPrompts(next);
                  _setPrompts(next);
                  _updatePrompt(index, next[index]);
                }
              }}
              onInput={handleInput}
              value={_name}
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
                const value = e.target.value;
                _setPrompt(value);
                const next = _prompts?.map((p, i) => (i === index ? { ...p, prompt: value } : p));
                if (next) {
                  setPrompts(next);
                  _setPrompts(next);
                  _updatePrompt(index, next[index]);
                }
              }}
              onInput={handleInput}
              value={_prompt}
              rows={1}
            ></textarea>
          </div>
          <div className="flex items-center mb-2 mt-2">
            <div className="text-gray-800 dark:text-gray-100 flex">
              Automatically include selection
            </div>
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
