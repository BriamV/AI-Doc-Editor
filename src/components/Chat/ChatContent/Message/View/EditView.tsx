import React from 'react';
import { useTranslation } from 'react-i18next';

import PopupModal from '@components/PopupModal';
import IncludeSelectionSend from '@components/Chat/IncludeSelectionSend';
import ClearPromptConfig from '@components/Chat/ClearPromptConfig';
import EditViewSubmitButton from './EditViewSubmitButton';
import EditViewActionButtons from './EditViewActionButtons';
import { useEditViewLogic } from './useEditViewLogic';
import { DocumentInterface } from '@type/document';

interface EditViewProps {
  content: string;
  setIsEdit: React.Dispatch<React.SetStateAction<boolean>>;
  messageIndex: number;
  sticky?: boolean;
}

// Header controls for sticky view
const StickyHeader = ({
  chats,
  currentChatIndex,
}: {
  chats: DocumentInterface[] | null;
  currentChatIndex: number;
}) => (
  <div className="flex w-full">
    <IncludeSelectionSend />
    {}
    {chats && chats[currentChatIndex].messageCurrent.config != null && <ClearPromptConfig />}
  </div>
);

// Text area component
const EditTextArea = ({
  textareaRef,
  sticky,
  _content,
  _setContent,
  placeholder,
  handleKeyDown,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  sticky?: boolean;
  _content: string;
  _setContent: React.Dispatch<React.SetStateAction<string>>;
  placeholder: string;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}) => (
  <textarea
    ref={textareaRef}
    className={`m-0 text-grey-300 resize-none bg-transparent overflow-y-hidden focus:ring-0 focus-visible:ring-0 flex w-full placeholder:text-gray-300
    ${sticky ? 'pr-10 p-1' : 'text-sm'}
    `}
    onChange={e => _setContent(e.target.value)}
    value={_content}
    placeholder={placeholder}
    onKeyDown={handleKeyDown}
    rows={1}
  />
);

const EditView = ({ content, setIsEdit, messageIndex, sticky }: EditViewProps) => {
  const { t } = useTranslation();

  const {
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
  } = useEditViewLogic({ content, messageIndex, sticky, setIsEdit });

  return (
    <>
      {sticky && <StickyHeader chats={chats ?? null} currentChatIndex={currentChatIndex} />}
      <div
        className={`w-full ${
          sticky
            ? 'py-2 relative pl-3 dark:text-white dark:bg-gray-850 border border-transparent'
            : ''
        }`}
      >
        <EditTextArea
          textareaRef={textareaRef}
          sticky={sticky}
          _content={_content}
          _setContent={_setContent}
          placeholder={t('submitPlaceholder') as string}
          handleKeyDown={handleKeyDown}
        />
        {sticky && (
          <EditViewSubmitButton generating={generating} handleSaveAndSubmit={handleSaveAndSubmit} />
        )}
      </div>
      {!sticky && (
        <EditViewActionButtons
          sticky={sticky}
          generating={generating}
          handleSaveAndSubmit={handleSaveAndSubmit}
          handleSave={handleSave}
          setIsModalOpen={setIsModalOpen}
          setIsEdit={setIsEdit}
        />
      )}
      {isModalOpen && (
        <PopupModal
          setIsModalOpen={setIsModalOpen}
          title={t('warning') as string}
          message={t('clearMessageWarning') as string}
          handleConfirm={handleSaveAndSubmit}
        />
      )}
    </>
  );
};

export default EditView;
