import React, { useEffect, useState } from 'react';
import useStore from '@store/store';
import useSubmit from '@hooks/useSubmit';
import { DocumentInterface } from '@type/document';

interface UseEditViewLogicProps {
  content: string;
  messageIndex: number;
  sticky?: boolean;
  setIsEdit: React.Dispatch<React.SetStateAction<boolean>>;
}

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

  const resetTextAreaHeight = () => {
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
  };

  const handleSave = () => {
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
  };

  const handleSaveAndSubmit = () => {
    if (generating || !chats) return;
    const updatedChats: DocumentInterface[] = JSON.parse(JSON.stringify(chats));
    const updatedMessages = updatedChats[currentChatIndex].messageCurrent.messages;
    if (sticky) {
      let tempContent = _content;
      let tempSelection = currentSelection;
      if (editorSettings.includeSelection) {
        if (_content.length != 0) {
          // remove newline from start of currentSelection
          if (currentSelection[0] == '\n') {
            tempSelection = currentSelection.substring(1);
          }
          // remove newline from end of currentSelection
          if (currentSelection[currentSelection.length - 1] == '\n') {
            tempSelection = currentSelection.substring(0, currentSelection.length - 1);
          }

          tempContent = _content + '\n\n' + tempSelection + '\n\n';
        } else {
          tempContent = tempSelection;
        }
      }
      updatedMessages.push({ role: inputRole, content: tempContent });
      _setContent('');
      resetTextAreaHeight();
    } else {
      let tempContent = _content;
      if (editorSettings.includeSelection) {
        tempContent = _content + '\n\n' + '{ ' + currentSelection + ' }' + '\n\n';
      }
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
  };

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
