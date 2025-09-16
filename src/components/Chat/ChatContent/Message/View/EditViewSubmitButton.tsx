import { memo } from 'react';
import { SendFilled, StopFilledAlt } from '@carbon/icons-react';
import useStore from '@store/store';

interface EditViewSubmitButtonProps {
  generating: boolean;
  handleSaveAndSubmit: () => void;
}

const EditViewSubmitButton = memo(
  ({ generating, handleSaveAndSubmit }: EditViewSubmitButtonProps) => {
    const setGenerating = useStore(state => state.setGenerating);

    const handleCancel = () => {
      setGenerating(false);
    };

    return (
      <>
        {!generating ? (
          <div
            className="absolute right-2 bottom-2 py-2 pl-2 pr-1 cursor-pointer"
            onClick={handleSaveAndSubmit}
            onMouseDown={e => {
              e.preventDefault();
            }}
          >
            <SendFilled size={16} />
          </div>
        ) : (
          <div
            className="absolute right-2 bottom-2 py-2 pl-2 pr-1 cursor-pointer"
            onClick={handleCancel}
            onMouseDown={e => {
              e.preventDefault();
            }}
          >
            <StopFilledAlt size={16} />
          </div>
        )}
      </>
    );
  }
);

EditViewSubmitButton.displayName = 'EditViewSubmitButton';

export default EditViewSubmitButton;
