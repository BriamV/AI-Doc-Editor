import { useCallback, useRef, useState, useEffect } from 'react';
import defaultStyles from '@components/style';
import { ChevronDown } from '@carbon/icons-react';
import { ListNode } from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { createPortal } from 'react-dom';
import {
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  $getSelection,
  $isRangeSelection,
} from 'lexical';
import { $getNearestNodeOfType, mergeRegister } from '@lexical/utils';
import { $isListNode } from '@lexical/list';
import { $isHeadingNode } from '@lexical/rich-text';
import { BlockOptionsDropdown } from './BlockOptionsDropdown';
import { UndoRedoButtons } from './UndoRedoButtons';
import { FormattingButtons } from './FormattingButtons';
import { AlignmentButtons } from './AlignmentButtons';

const LowPriority = 1;

function Divider() {
  return <div className="divider" />;
}

function EditorToolbar() {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [blockType, setBlockType] = useState('paragraph');
  const [showBlockOptionsDropDown, setShowBlockOptionsDropDown] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType(anchorNode, ListNode);
          const type = parentList ? parentList.getTag() : element.getTag();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element) ? element.getTag() : element.getType();
          setBlockType(type);
        }
      }
      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, _newEditor) => {
          updateToolbar();
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        payload => {
          setCanUndo(payload);
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        payload => {
          setCanRedo(payload);
          return false;
        },
        LowPriority
      )
    );
  }, [editor, updateToolbar]);

  return (
    <div
      className="flex p-2 z-10 bg-gray-900 border-white/10 border-b gap-1 items-center w-full justify-between"
      ref={toolbarRef}
    >
      <div className="flex gap-1 snap-x w-full overflow-scroll md:overflow-hidden">
        <UndoRedoButtons editor={editor} canUndo={canUndo} canRedo={canRedo} />
        <Divider />
        <button
          onClick={() => {
            setShowBlockOptionsDropDown(!showBlockOptionsDropDown);
          }}
          className={defaultStyles.buttonStyle}
          aria-label="Formatting Options"
        >
          <span className={'text ' + blockType} />
          <ChevronDown />
        </button>
        {showBlockOptionsDropDown &&
          createPortal(
            <BlockOptionsDropdown
              editor={editor}
              blockType={blockType}
              toolbarRef={toolbarRef}
              setShowBlockOptionsDropDown={setShowBlockOptionsDropDown}
            />,
            document.body
          )}
        <Divider />
        <FormattingButtons
          editor={editor}
          isBold={isBold}
          isItalic={isItalic}
          isUnderline={isUnderline}
          isStrikethrough={isStrikethrough}
        />
        <Divider />
        <AlignmentButtons editor={editor} />
      </div>
    </div>
  );
}

export default EditorToolbar;
