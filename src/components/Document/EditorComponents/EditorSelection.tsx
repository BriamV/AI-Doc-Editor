import { useCallback, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import useStore from '@store/store';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { GridSelection, NodeSelection } from 'lexical';

import {
  SELECTION_CHANGE_COMMAND,
  $getSelection,
  $isRangeSelection,
  RangeSelection,
} from 'lexical';
import { createDOMRange, createRectsFromDOMRange } from '@lexical/selection';

const LowPriority = 1;

const EditorSelection = () => {
  const [editor] = useLexicalComposerContext();
  const boxRef = useRef<HTMLDivElement>(null);
  const selectionState = useMemo(
    () => ({
      container: document.createElement('div'),
      elements: [],
    }),
    []
  );
  if (selectionState.container) {
    // selectionState.container.classList.add("opacity-50");
    // selectionState.container.classList.add("pointer-events-none");
  }
  const selectionRef = useRef<RangeSelection | null>(null);
  const setCurrentSelection = useStore(state => state.setCurrentSelection);

  // Scan for selection change events and save the selection in storage

  let selectionRepeat: RangeSelection | GridSelection | NodeSelection | null = null;
  editor.registerCommand(
    SELECTION_CHANGE_COMMAND,
    () => {
      const tempSelection = $getSelection();
      if (selectionRepeat !== tempSelection) {
        selectionRepeat = tempSelection;
        if (selectionRepeat?.getTextContent() !== null) {
          setCurrentSelection(selectionRepeat?.getTextContent() ?? '');
        }
      }
      return true;
    },
    LowPriority
  );

  const updateLocation = useCallback(() => {
    editor.getEditorState().read(() => {
      document.getElementsByClassName('editor-input');
      const selection = $getSelection();

      if ($isRangeSelection(selection)) {
        selectionRef.current = selection.clone();
        const anchor = selection.anchor;
        const focus = selection.focus;
        const range = createDOMRange(
          editor,
          anchor.getNode(),
          anchor.offset,
          focus.getNode(),
          focus.offset
        );
        const boxElem = boxRef.current;
        if (range !== null && boxElem !== null) {
          const { left, width } = range.getBoundingClientRect();
          const selectionRects = createRectsFromDOMRange(editor, range);

          let correctedLeft = selectionRects.length === 1 ? left + width / 2 - 125 : left - 125;
          if (correctedLeft < 10) {
            correctedLeft = 10;
          }
          boxElem.style.left = `${correctedLeft}px`;
          boxElem.style.top = `${range.getBoundingClientRect().bottom + 20}px`;
          const selectionRectsLength = selectionRects.length;
          const { container } = selectionState;
          const elements: Array<HTMLSpanElement> = selectionState.elements;
          const elementsLength = elements.length;

          for (let i = 0; i < selectionRectsLength; i++) {
            let elem: HTMLSpanElement = elements[i];
            if (elem === undefined) {
              elem = document.createElement('span');
              elements[i] = elem;
              container.appendChild(elem);
            }
            const style = `mix-blend-mode:color;position:absolute;top:${selectionRects[i].top}px;left:${selectionRects[i].left}px;height:${selectionRects[i].height}px;width:${selectionRects[i].width}px;background-color:rgba(50,150,255, 1);pointer-events:none;z-index:5;`;
            elem.style.cssText = style;
          }
          for (let i = elementsLength - 1; i >= selectionRectsLength; i--) {
            const elem = elements[i];
            container.removeChild(elem);
            elements.pop();
          }
        }
      }
    });
  }, [editor, selectionState]);

  const resetLocation = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();

      if ($isRangeSelection(selection)) {
        selectionRef.current = selection.clone();
        const anchor = selection.anchor;
        const focus = selection.focus;
        const range = createDOMRange(
          editor,
          anchor.getNode(),
          anchor.offset,
          focus.getNode(),
          focus.offset
        );
        const boxElem = boxRef.current;
        if (range !== null && boxElem !== null) {
          const { left, width } = range.getBoundingClientRect();
          createRectsFromDOMRange(editor, range);
          let correctedLeft =
            range.getBoundingClientRect().width === 1 ? left + width / 2 - 125 : left - 125;
          if (correctedLeft < 10) {
            correctedLeft = 10;
          }
          boxElem.style.left = `-2000px`;
          boxElem.style.top = `-2000px`;
          const selectionRectsLength = createRectsFromDOMRange(editor, range).length;
          const { container } = selectionState;
          const elements: Array<HTMLSpanElement> = selectionState.elements;
          const elementsLength = elements.length;

          for (let i = 0; i < selectionRectsLength; i++) {
            let elem: HTMLSpanElement = elements[i];
            if (elem === undefined) {
              elem = document.createElement('span');
              elements[i] = elem;
              container.appendChild(elem);
            }
            const color = '0, 0, 0';
            const style = `position:absolute;display:none;top:-2000px;opacity:0;left:-2000px;height:0px;width:0px;background-color:rgba(${color}, 0.3);pointer-events:none;z-index:5;`;
            elem.style.cssText = style;
          }
          for (let i = elementsLength - 1; i >= selectionRectsLength; i--) {
            const elem = elements[i];
            container.removeChild(elem);
            elements.pop();
          }
        }
      }
    });
  }, [editor, selectionState]);

  useLayoutEffect(() => {
    updateLocation();
    const container = selectionState.container;
    const body = document.body;
    if (body !== null) {
      body.appendChild(container);
      return () => {
        if (body.contains(container)) {
          body.removeChild(container);
        }
      };
    }
    return () => {};
  }, [selectionState.container, updateLocation]);

  useEffect(() => {
    const editorInput = document.getElementsByClassName('editor-input');
    if (editorInput[0] !== undefined) {
      editorInput[0].addEventListener('scroll', () => {
        resetLocation();
      });
    }

    if (editorInput[0] !== undefined) {
      editorInput[0].addEventListener('scrollend', () => {
        updateLocation();
      });
    }
  }, [resetLocation, updateLocation]);

  useEffect(() => {
    window.addEventListener('resize', updateLocation);
    document.getElementsByClassName('editor-input')[0].addEventListener('blur', () => {
      updateLocation();
    });

    document.getElementsByClassName('editor-input')[0].addEventListener('focus', () => {
      resetLocation();
    });

    return () => {
      window.removeEventListener('resize', updateLocation);
    };
  }, [updateLocation, resetLocation]);

  useEffect(() => {
    setCurrentSelection('');
    selectionState.elements.forEach((element: HTMLBodyElement) => {
      element.remove();
    });
    selectionState.elements = [];
  }, [setCurrentSelection, selectionState]);

  return (
    <div ref={boxRef} className="selection-box">
      <div className="selection-box-inner" />
    </div>
  );
};

export default EditorSelection;
