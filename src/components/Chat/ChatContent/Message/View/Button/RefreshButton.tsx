import { MouseEventHandler } from 'react';

import { Renew } from '@carbon/icons-react';
import BaseButton from './BaseButton';

function RefreshButton({ onClick }: { onClick: MouseEventHandler<HTMLButtonElement> }) {
  return <BaseButton icon={<Renew />} onClick={onClick} />;
}

export default RefreshButton;
