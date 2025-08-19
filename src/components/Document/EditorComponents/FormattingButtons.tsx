import { FORMAT_TEXT_COMMAND, LexicalEditor } from 'lexical';
import { TextBold, TextItalic, TextStrikethrough, TextUnderline } from '@carbon/icons-react';
import defaultStyles from '@components/style';

interface FormattingButtonsProps {
  editor: LexicalEditor;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
}

export const FormattingButtons = ({
  editor,
  isBold,
  isItalic,
  isUnderline,
  isStrikethrough,
}: FormattingButtonsProps) => {
  const handleBold = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
  };

  const handleItalic = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
  };

  const handleUnderline = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
  };

  const handleStrikethrough = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
  };

  return (
    <>
      <button
        onClick={handleBold}
        className={`${defaultStyles.buttonStyle} ${isBold ? 'bg-gray-700' : ''}`}
        aria-label="Format Bold"
      >
        <TextBold />
      </button>
      <button
        onClick={handleItalic}
        className={`${defaultStyles.buttonStyle} ${isItalic ? 'bg-gray-700' : ''}`}
        aria-label="Format Italic"
      >
        <TextItalic />
      </button>
      <button
        onClick={handleUnderline}
        className={`${defaultStyles.buttonStyle} ${isUnderline ? 'bg-gray-700' : ''}`}
        aria-label="Format Underline"
      >
        <TextUnderline />
      </button>
      <button
        onClick={handleStrikethrough}
        className={`${defaultStyles.buttonStyle} ${isStrikethrough ? 'bg-gray-700' : ''}`}
        aria-label="Format Strikethrough"
      >
        <TextStrikethrough />
      </button>
    </>
  );
};

export default FormattingButtons;
