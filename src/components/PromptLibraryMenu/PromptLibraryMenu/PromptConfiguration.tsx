import React, { useState } from 'react';
import { Settings } from '@carbon/icons-react';
import { PromptConfigModal } from './PromptConfigModal';
import { Prompt } from '@type/prompt';

interface PromptConfigurationProps {
  prompt: Prompt;
  index: number;
  _updatePrompt: (index: number, prompt: Prompt) => void;
  _prompts: Prompt[];
  _setPrompts: React.Dispatch<React.SetStateAction<Prompt[]>>;
}

export const PromptConfiguration = ({
  prompt,
  index,
  _updatePrompt,
  _prompts,
  _setPrompts,
}: PromptConfigurationProps) => {
  const [isPromptConfigModalOpen, setIsPromptConfigModalOpen] = useState<boolean>(false);

  const handleClick = () => {
    setIsPromptConfigModalOpen(true);
  };

  return (
    <>
      <div onClick={handleClick}>
        <Settings />
      </div>
      {isPromptConfigModalOpen && (
        <PromptConfigModal
          setIsModalOpen={setIsPromptConfigModalOpen}
          prompt={prompt}
          index={index}
          _prompts={_prompts}
          _setPrompts={_setPrompts}
          _updatePrompt={_updatePrompt}
        />
      )}
    </>
  );
};

export default PromptConfiguration;
