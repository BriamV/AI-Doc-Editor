import { MouseEventHandler } from 'react';

import { ChevronDown } from '@carbon/icons-react';

import BaseButton from './BaseButton';

function UpButton({ onClick }: { onClick: MouseEventHandler<HTMLButtonElement> }) {
  return <BaseButton icon={<ChevronDown className="rotate-180" />} onClick={onClick} />;
}

export default UpButton;
