import { useState } from 'react';
import { Settings } from '@carbon/icons-react';
import { PromptPopup } from './PromptPopup';

import type { Prompt } from '@type/document';

export const PromptButtonConfig = ({
  prompt,
  index,
  _promptName,
  _setPromptName,
}: {
  prompt: Prompt;
  index: number;
  _promptName: string;
  _setPromptName: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const [isPromptConfigModalOpen, setIsPromptConfigModalOpen] = useState<boolean>(false);

  const handleClick = () => {
    setIsPromptConfigModalOpen(true);
  };

  return (
    <>
      <div onClick={handleClick}>
        <Settings />
      </div>
      {isPromptConfigModalOpen ? (
        <PromptPopup
          setIsModalOpen={setIsPromptConfigModalOpen}
          prompt={prompt}
          index={index}
          _promptName={_promptName}
          _setPromptName={_setPromptName}
        />
      ) : null}
    </>
  );
};

export default PromptButtonConfig;
