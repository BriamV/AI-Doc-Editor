import { memo } from 'react';

import { Edit } from '@carbon/icons-react';
import BaseButton from './BaseButton';

const EditButton = memo(
  ({ setIsEdit }: { setIsEdit: React.Dispatch<React.SetStateAction<boolean>> }) => {
    return <BaseButton icon={<Edit />} onClick={() => setIsEdit(true)} />;
  }
);

EditButton.displayName = 'EditButton';

export default EditButton;
