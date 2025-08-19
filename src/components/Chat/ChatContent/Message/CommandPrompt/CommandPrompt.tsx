import React, { useEffect, useRef, useState } from 'react';
import useStore from '@store/store';

import { useTranslation } from 'react-i18next';
import { matchSorter } from 'match-sorter';
import { Prompt } from '@type/prompt';

import useHideOnOutsideClick from '@hooks/useHideOnOutsideClick';

// Custom hook for prompt filtering logic
const usePromptFilter = (prompts: Prompt[]) => {
  const [_prompts, _setPrompts] = useState<Prompt[]>(prompts);
  const [input, setInput] = useState<string>('');

  useEffect(() => {
    const filteredPrompts = matchSorter(prompts, input, {
      keys: ['name'],
    });
    _setPrompts(filteredPrompts);
  }, [input, prompts]);

  useEffect(() => {
    _setPrompts(prompts);
    setInput('');
  }, [prompts]);

  return { _prompts, input, setInput };
};

// Prompt list item component
const PromptListItem = ({
  prompt,
  onClick,
}: {
  prompt: Prompt;
  onClick: (prompt: Prompt) => void;
}) => (
  <li
    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white cursor-pointer text-start w-full"
    onClick={() => onClick(prompt)}
    key={prompt.id}
  >
    {prompt.name}
  </li>
);

const CommandPrompt = ({
  _setContent,
}: {
  _setContent: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const { t } = useTranslation();
  const prompts = useStore(state => state.prompts);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropDown, setDropDown, dropDownRef] = useHideOnOutsideClick();
  const { _prompts, input, setInput } = usePromptFilter(prompts);

  useEffect(() => {
    if (dropDown && inputRef.current) {
      inputRef.current.focus();
    }
  }, [dropDown]);

  const handlePromptClick = (prompt: Prompt) => {
    _setContent(prev => prev + prompt.prompt);
    setDropDown(false);
  };

  return (
    <div className="relative max-wd-sm" ref={dropDownRef}>
      <button className="btn btn-neutral btn-small" onClick={() => setDropDown(!dropDown)}>
        /
      </button>
      <div
        className={`${
          dropDown ? '' : 'hidden'
        } absolute top-100 bottom-100 right-0 z-10 bg-white rounded-lg shadow-xl border-b border-black/10 dark:border-gray-900/50 text-gray-800 dark:text-gray-100 group dark:bg-gray-800 opacity-90`}
      >
        <div className="text-sm px-4 py-2 w-max">{t('promptLibrary')}</div>
        <input
          ref={inputRef}
          type="text"
          className="text-gray-800 dark:text-white p-3 text-sm border-none bg-gray-200 dark:bg-gray-600 m-0 w-full mr-0 h-8 focus:outline-none"
          value={input}
          placeholder={t('search') as string}
          onChange={e => {
            setInput(e.target.value);
          }}
        />
        <ul className="text-sm text-gray-700 dark:text-gray-200 p-0 m-0 w-max max-w-sm max-md:max-w-[90vw] max-h-32 overflow-auto">
          {_prompts.map(prompt => (
            <PromptListItem key={prompt.id} prompt={prompt} onClick={handlePromptClick} />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CommandPrompt;
