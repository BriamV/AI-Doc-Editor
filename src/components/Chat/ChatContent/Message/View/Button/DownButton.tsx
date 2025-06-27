import { MouseEventHandler } from 'react';

import { ChevronDown } from '@carbon/icons-react';

import BaseButton from './BaseButton';

function DownButton({ onClick }: { onClick: MouseEventHandler<HTMLButtonElement> }) {
  return <BaseButton icon={<ChevronDown />} onClick={onClick} />;
}

export default DownButton;
