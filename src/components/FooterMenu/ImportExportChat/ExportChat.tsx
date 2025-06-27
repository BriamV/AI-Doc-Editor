import React from 'react';
import { useTranslation } from 'react-i18next';

import useStore from '@store/store';

import downloadFile from '@utils/downloadFile';
import { getToday } from '@utils/date';

import Export from '@type/export';

const ExportChat = () => {
  const { t } = useTranslation();
  const chats = useStore(state => state.chats);
  const folders = useStore(state => state.folders);
  const prompts = useStore(state => state.prompts);
  const defaultChatConfig = useStore(state => state.defaultChatConfig);

  const handleExport = () => {
    const fileData: Export = {
      chats,
      folders,
      prompts,
      config: defaultChatConfig,
      version: 0,
    };
    downloadFile(fileData, getToday());
  };

  return (
    <div className="mt-6">
      <div className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
        {t('export')} (JSON)
      </div>
      <button className="btn btn-small btn-primary" onClick={handleExport}>
        {t('export')}
      </button>
    </div>
  );
};
export default ExportChat;
