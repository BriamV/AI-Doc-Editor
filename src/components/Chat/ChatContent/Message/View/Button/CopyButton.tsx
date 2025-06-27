import { useState, MouseEventHandler } from 'react';

import { Checkmark, Copy } from '@carbon/icons-react';
import BaseButton from './BaseButton';

function CopyButton({ onClick }: { onClick: MouseEventHandler<HTMLButtonElement> }) {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  return (
    <BaseButton
      icon={isCopied ? <Checkmark /> : <Copy />}
      onClick={e => {
        onClick(e);
        setIsCopied(true);
        window.setTimeout(() => {
          setIsCopied(false);
        }, 3000);
      }}
    />
  );
}

export default CopyButton;
