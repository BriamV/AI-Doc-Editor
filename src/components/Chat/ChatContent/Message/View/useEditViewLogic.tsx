import React, { useCallback, useEffect, useState } from 'react';
import useStore from '@store/store';
import useSubmit from '@hooks/useSubmit';
import { DocumentInterface, Role, EditorSettings } from '@type/document';

interface UseEditViewLogicProps {
  content: string;
  messageIndex: number;
  sticky?: boolean;
  setIsEdit: React.Dispatch<React.SetStateAction<boolean>>;
}

// Parameters interface for keyboard handler hook
interface KeyboardHandlerParams {
  sticky: boolean | undefined;
  enterToSubmit: boolean;
  handleSaveAndSubmit: () => void;
  handleSave: () => void;
  resetTextAreaHeight: () => void;
}

// Custom hook for handling keyboard interactions
const useKeyboardHandler = (params: KeyboardHandlerParams) => {
  const { sticky, enterToSubmit, handleSaveAndSubmit, handleSave, resetTextAreaHeight } = params;
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|playbook|silk/i.test(
          navigator.userAgent
        );

      if (e.key !== 'Enter' || isMobile || e.nativeEvent.isComposing) return;

      if (sticky) {
        if ((enterToSubmit && !e.shiftKey) || (!enterToSubmit && (e.ctrlKey || e.shiftKey))) {
          e.preventDefault();
          handleSaveAndSubmit();
          resetTextAreaHeight();
        }
      } else {
        if (e.ctrlKey && e.shiftKey) {
          e.preventDefault();
          handleSaveAndSubmit();
          resetTextAreaHeight();
        } else if (e.ctrlKey || e.shiftKey) {
          handleSave();
        }
      }
    },
    [sticky, enterToSubmit, handleSaveAndSubmit, handleSave, resetTextAreaHeight]
  );

  return { handleKeyDown };
};

// Custom hook for content processing
const useContentProcessor = (currentSelection: string, editorSettings: EditorSettings) => {
  const processContentWithSelection = useCallback(
    (content: string, isSticky: boolean = false) => {
      if (!editorSettings.includeSelection) return content;

      let tempSelection = currentSelection;
      if (isSticky && content.length !== 0) {
        // remove newline from start of currentSelection
        if (currentSelection[0] === '\n') {
          tempSelection = currentSelection.substring(1);
        }
        // remove newline from end of currentSelection
        if (currentSelection[currentSelection.length - 1] === '\n') {
          tempSelection = currentSelection.substring(0, currentSelection.length - 1);
        }
        return content + '\n\n' + tempSelection + '\n\n';
      } else if (isSticky) {
        return tempSelection;
      } else {
        return content + '\n\n' + '{ ' + currentSelection + ' }' + '\n\n';
      }
    },
    [currentSelection, editorSettings]
  );

  return { processContentWithSelection };
};

// Parameters interface for save operations hook
interface SaveOperationsParams {
  sticky: boolean | undefined;
  _content: string;
  _setContent: React.Dispatch<React.SetStateAction<string>>;
  messageIndex: number;
  generating: boolean;
  chats: DocumentInterface[] | null;
  setChats: (chats: DocumentInterface[]) => void;
  currentChatIndex: number;
  inputRole: Role;
  setIsEdit: React.Dispatch<React.SetStateAction<boolean>>;
  resetTextAreaHeight: () => void;
  processContentWithSelection: (content: string, isSticky?: boolean) => string;
  editorSettings: EditorSettings;
  setEditorSettings: (settings: EditorSettings) => void;
  handleSubmit: () => void;
}

// Custom hook for save operations
const useSaveOperations = (params: SaveOperationsParams) => {
  const {
    sticky,
    _content,
    _setContent,
    messageIndex,
    generating,
    chats,
    setChats,
    currentChatIndex,
    inputRole,
    setIsEdit,
    resetTextAreaHeight,
    processContentWithSelection,
    editorSettings,
    setEditorSettings,
    handleSubmit,
  } = params;
  const handleSave = useCallback(() => {
    if (sticky && (_content === '' || generating)) return;
    if (!chats) return;

    const updatedChats: DocumentInterface[] = JSON.parse(JSON.stringify(chats));

    const updatedMessages = updatedChats[currentChatIndex].messageCurrent.messages;
    if (sticky) {
      updatedMessages.push({ role: inputRole, content: _content });
      _setContent('');
      resetTextAreaHeight();
    } else {
      updatedMessages[messageIndex].content = _content;
      setIsEdit(false);
    }
    setChats(updatedChats);
  }, [
    sticky,
    _content,
    generating,
    chats,
    setChats,
    currentChatIndex,
    inputRole,
    messageIndex,
    _setContent,
    setIsEdit,
    resetTextAreaHeight,
  ]);

  const handleSaveAndSubmit = useCallback(() => {
    if (generating || !chats) return;

    const updatedChats: DocumentInterface[] = JSON.parse(JSON.stringify(chats));

    const updatedMessages = updatedChats[currentChatIndex].messageCurrent.messages;

    if (sticky) {
      const tempContent = processContentWithSelection(_content, true);
      updatedMessages.push({ role: inputRole, content: tempContent });
      _setContent('');
      resetTextAreaHeight();
    } else {
      const tempContent = processContentWithSelection(_content, false);

      updatedMessages[messageIndex].content = tempContent;

      updatedChats[currentChatIndex].messageCurrent.messages = updatedMessages.slice(
        0,
        messageIndex + 1
      );
      setIsEdit(false);
    }
    setEditorSettings({ ...editorSettings, includeSelection: false });
    setChats(updatedChats);
    handleSubmit();
  }, [
    generating,
    chats,
    currentChatIndex,
    sticky,
    processContentWithSelection,
    _content,
    inputRole,
    _setContent,
    resetTextAreaHeight,
    messageIndex,
    setIsEdit,
    editorSettings,
    setEditorSettings,
    setChats,
    handleSubmit,
  ]);

  return { handleSave, handleSaveAndSubmit };
};

export const useEditViewLogic = ({
  content,
  messageIndex,
  sticky,
  setIsEdit,
}: UseEditViewLogicProps) => {
  const inputRole = useStore(state => state.inputRole);
  const chats = useStore(state => state.chats);
  const setChats = useStore(state => state.setChats);
  const currentChatIndex = useStore(state => state.currentChatIndex);
  const generating = useStore(state => state.generating);
  const enterToSubmit = useStore(state => state.enterToSubmit);
  const editorSettings = useStore(state => state.editorSettings);
  const setEditorSettings = useStore(state => state.setEditorSettings);
  const currentSelection = useStore(state => state.currentSelection);

  const [_content, _setContent] = useState<string>(content);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const textareaRef = React.createRef<HTMLTextAreaElement>();

  const { handleSubmit } = useSubmit();

  const resetTextAreaHeight = useCallback(() => {
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [textareaRef]);

  const { processContentWithSelection } = useContentProcessor(currentSelection, editorSettings);

  const { handleSave, handleSaveAndSubmit } = useSaveOperations({
    sticky,
    _content,
    _setContent,
    messageIndex,
    generating,
    chats: chats ?? null,
    setChats,
    currentChatIndex,
    inputRole,
    setIsEdit,
    resetTextAreaHeight,
    processContentWithSelection,
    editorSettings,
    setEditorSettings,
    handleSubmit,
  });

  const { handleKeyDown } = useKeyboardHandler({
    sticky,
    enterToSubmit,
    handleSaveAndSubmit,
    handleSave,
    resetTextAreaHeight,
  });

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [_content, textareaRef]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [textareaRef]);

  return {
    _content,
    _setContent,
    isModalOpen,
    setIsModalOpen,
    textareaRef,
    generating,
    chats,
    currentChatIndex,
    handleKeyDown,
    handleSave,
    handleSaveAndSubmit,
  };
};
