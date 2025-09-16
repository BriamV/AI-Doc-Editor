import React, { useState } from 'react';
import { Prompt } from '@type/prompt';
import { Settings } from '@carbon/icons-react';
import { PromptPopup } from './PromptPopup';

interface PromptConfigProps {
  prompt: Prompt;
  index: number;
  _updatePrompt: (index: number, prompt: Prompt) => void;
  _prompts: Prompt[];
  _setPrompts: React.Dispatch<React.SetStateAction<Prompt[]>>;
}

export const PromptConfig = ({
  prompt,
  index,
  _updatePrompt,
  _prompts,
  _setPrompts,
}: PromptConfigProps) => {
  const [isPromptConfigModalOpen, setIsPromptConfigModalOpen] = useState<boolean>(false);

  return (
    <>
      <div onClick={() => setIsPromptConfigModalOpen(true)}>
        <Settings />
      </div>
      {isPromptConfigModalOpen ? (
        <PromptPopup
          setIsModalOpen={setIsPromptConfigModalOpen}
          prompt={prompt}
          index={index}
          _prompts={_prompts}
          _setPrompts={_setPrompts}
          _updatePrompt={_updatePrompt}
        />
      ) : (
        <></>
      )}
    </>
  );
};

export default PromptConfig;
