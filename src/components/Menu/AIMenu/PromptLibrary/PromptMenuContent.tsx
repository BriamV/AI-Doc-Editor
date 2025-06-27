import { useEffect, useRef, useState } from 'react';
import useStore from '@store/store';
import PromptButton from './PromptButton';

import { matchSorter } from 'match-sorter';
import { Prompt } from '@type/prompt';

const PromptMenuContent = ({
  setActiveMenu,
}: {
  setActiveMenu: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const prompts = useStore(state => state.prompts);
  const [_prompts, _setPrompts] = useState<Prompt[]>([]);
  const [input, setInput] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const filteredPrompts = matchSorter(prompts, input, {
      keys: ['name'],
    });
    _setPrompts(filteredPrompts);
  }, [input, prompts]);

  useEffect(() => {
    // Organize prompts alphabetically
    const sortedPrompts = [...prompts].sort((a, b) => a.name.localeCompare(b.name));
    _setPrompts(sortedPrompts);
    setInput('');
  }, [prompts]);

  return (
    <div>
      <div className="z-10 text-sm h-screen text-gray-800 dark:text-gray-100 group dark:bg-gray-900">
        <div className="flex-col flex overflow-y-auto hide-scroll-bar border-b border-white/10 p-2 pb-4 h-full">
          <div className="h-10 mb-2">
            <input
              ref={inputRef}
              type="text"
              className="text-gray-800 dark:text-white p-3 text-sm bg-transparent disabled:opacity-40 disabled:cursor-not-allowed transition-opacity m-0 w-full h-full focus:outline-none border border-white/10"
              value={input}
              placeholder={'Search Prompts'}
              onChange={e => {
                setInput(e.target.value);
              }}
            />
          </div>
          <div className="flex-1 flex flex-col gap-1 overflow-y-auto mb-14">
            {_prompts.map((prompt, index) => (
              <PromptButton
                key={index}
                prompt={prompt}
                index={index}
                setActiveMenu={setActiveMenu}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptMenuContent;
