import { UNDO_COMMAND, REDO_COMMAND, LexicalEditor } from 'lexical';
import defaultStyles from '@components/style';

interface UndoRedoButtonsProps {
  editor: LexicalEditor;
  canUndo: boolean;
  canRedo: boolean;
}

export const UndoRedoButtons = ({ editor, canUndo, canRedo }: UndoRedoButtonsProps) => {
  const handleUndo = () => {
    editor.dispatchCommand(UNDO_COMMAND, undefined);
  };

  const handleRedo = () => {
    editor.dispatchCommand(REDO_COMMAND, undefined);
  };

  return (
    <>
      <button
        disabled={!canUndo}
        onClick={handleUndo}
        className={defaultStyles.buttonStyle}
        aria-label="Undo"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          className="bi bi-arrow-counterclockwise"
          viewBox="0 0 16 16"
        >
          <path
            fillRule="evenodd"
            d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"
          />
          <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z" />
        </svg>
      </button>
      <button
        disabled={!canRedo}
        onClick={handleRedo}
        className={defaultStyles.buttonStyle}
        aria-label="Redo"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          className="bi bi-arrow-clockwise"
          viewBox="0 0 16 16"
        >
          <path
            fillRule="evenodd"
            d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"
          />
          <path d="m8 4.466.008.004.008-.004V4.466zM8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966a.25.25 0 0 1 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z" />
        </svg>
      </button>
    </>
  );
};

export default UndoRedoButtons;
