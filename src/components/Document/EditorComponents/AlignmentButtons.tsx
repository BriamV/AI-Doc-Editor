import { FORMAT_ELEMENT_COMMAND, LexicalEditor } from 'lexical';
import {
  TextAlignCenter,
  TextAlignLeft,
  TextAlignRight,
  TextAlignJustify,
} from '@carbon/icons-react';
import defaultStyles from '@components/style';

interface AlignmentButtonsProps {
  editor: LexicalEditor;
}

export const AlignmentButtons = ({ editor }: AlignmentButtonsProps) => {
  const handleLeftAlign = () => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
  };

  const handleCenterAlign = () => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
  };

  const handleRightAlign = () => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
  };

  const handleJustifyAlign = () => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
  };

  return (
    <>
      <button
        onClick={handleLeftAlign}
        className={defaultStyles.buttonStyle}
        aria-label="Left Align"
      >
        <TextAlignLeft />
      </button>
      <button
        onClick={handleCenterAlign}
        className={defaultStyles.buttonStyle}
        aria-label="Center Align"
      >
        <TextAlignCenter />
      </button>
      <button
        onClick={handleRightAlign}
        className={defaultStyles.buttonStyle}
        aria-label="Right Align"
      >
        <TextAlignRight />
      </button>
      <button
        onClick={handleJustifyAlign}
        className={defaultStyles.buttonStyle}
        aria-label="Justify Align"
      >
        <TextAlignJustify />
      </button>
    </>
  );
};

export default AlignmentButtons;
