import React from 'react';
import { useTranslation } from 'react-i18next';

import PopupModal from '@components/PopupModal';
import IncludeSelectionSend from '@components/Chat/IncludeSelectionSend';
import ClearPromptConfig from '@components/Chat/ClearPromptConfig';
import EditViewSubmitButton from './EditViewSubmitButton';
import EditViewActionButtons from './EditViewActionButtons';
import { useEditViewLogic } from './useEditViewLogic';

interface EditViewProps {
  content: string;
  setIsEdit: React.Dispatch<React.SetStateAction<boolean>>;
  messageIndex: number;
  sticky?: boolean;
}

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
      {sticky && (
        <div className="flex w-full">
          <IncludeSelectionSend />
          {chats && chats[currentChatIndex].messageCurrent.config != null && <ClearPromptConfig />}
        </div>
      )}
      <div
        className={`w-full ${
          sticky
            ? 'py-2 relative pl-3 dark:text-white dark:bg-gray-850 border border-transparent'
            : ''
        }`}
      >
        <textarea
          ref={textareaRef}
          className={`m-0 text-grey-300 resize-none bg-transparent overflow-y-hidden focus:ring-0 focus-visible:ring-0 flex w-full placeholder:text-gray-300
          ${sticky ? 'pr-10 p-1' : 'text-sm'}
          `}
          onChange={e => _setContent(e.target.value)}
          value={_content}
          placeholder={t('submitPlaceholder') as string}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        {sticky && (
          <EditViewSubmitButton generating={generating} handleSaveAndSubmit={handleSaveAndSubmit} />
        )}
      </div>
      {sticky || (
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
