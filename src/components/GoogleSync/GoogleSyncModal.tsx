import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import useStore from '@store/store';
import useGStore from '@store/cloud-auth-store';
import { createDriveFile } from '@api/google-api';
import { getFiles, stateToFile } from '@utils/google-api';
import { GoogleFileResource } from '@type/google-api';

import GoogleSyncButton from './GoogleSyncButton';
import PopupModal from '@components/PopupModal';
import { FileSelectorComponent } from './FileSelectorComponent';
import { SyncStatusIcon } from './SyncStatusIcon';

interface GoogleSyncModalProps {
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  files: GoogleFileResource[];
  setFiles: React.Dispatch<React.SetStateAction<GoogleFileResource[]>>;
}

export const GoogleSyncModal = ({ setIsModalOpen, files, setFiles }: GoogleSyncModalProps) => {
  const { t } = useTranslation(['drive']);

  const syncStatus = useGStore(state => state.syncStatus);
  const setSyncStatus = useGStore(state => state.setSyncStatus);
  const cloudSync = useGStore(state => state.cloudSync);
  const googleAccessToken = useGStore(state => state.googleAccessToken);
  const setFileId = useGStore(state => state.setFileId);

  const setToastStatus = useStore(state => state.setToastStatus);
  const setToastMessage = useStore(state => state.setToastMessage);
  const setToastShow = useStore(state => state.setToastShow);

  const [_fileId, _setFileId] = useState<string>(useGStore.getState().fileId || '');

  const createSyncFile = async () => {
    if (!googleAccessToken) return;
    try {
      setSyncStatus('syncing');
      await createDriveFile(stateToFile(), googleAccessToken);
      const _files = await getFiles(googleAccessToken);
      if (_files) setFiles(_files);
      setSyncStatus('synced');
    } catch (e: unknown) {
      setSyncStatus('unauthenticated');
      setToastMessage((e as Error).message);
      setToastShow(true);
      setToastStatus('error');
    }
  };

  const handleConfirmSync = async () => {
    setFileId(_fileId);
    await useStore.persist.rehydrate();
    setToastStatus('success');
    setToastMessage(t('toast.sync'));
    setToastShow(true);
    setIsModalOpen(false);
  };

  const handleLoginSuccess = () => {
    setIsModalOpen(false);
    window.setTimeout(() => {
      setIsModalOpen(true);
    }, 3540000); // timeout - 3540000ms = 59 min (access token last 60 min)
  };

  const renderFileList = () => {
    if (!cloudSync || syncStatus === 'unauthenticated') {
      return null;
    }

    return (
      <div className="flex flex-col gap-2 items-center">
        {files.map(file => (
          <FileSelectorComponent
            id={file.id}
            name={file.name}
            _fileId={_fileId}
            _setFileId={_setFileId}
            setFiles={setFiles}
            key={file.id}
          />
        ))}
        {syncStatus !== 'syncing' && (
          <div className="flex gap-4 flex-wrap justify-center">
            <div className="btn btn-primary cursor-pointer" onClick={handleConfirmSync}>
              {t('button.confirm')}
            </div>
            <div className="btn btn-neutral cursor-pointer" onClick={createSyncFile}>
              {t('button.create')}
            </div>
          </div>
        )}
        <div className="h-4 w-4">
          {syncStatus === 'syncing' && <SyncStatusIcon status="syncing" />}
        </div>
      </div>
    );
  };

  return (
    <PopupModal title={t('name') as string} setIsModalOpen={setIsModalOpen} cancelButton={false}>
      <div className="p-6 border-b border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-300 text-sm flex flex-col items-center gap-4 text-center">
        <p>{t('tagline')}</p>
        <GoogleSyncButton loginHandler={handleLoginSuccess} />
        <p className="border border-gray-400 px-3 py-2 rounded-md">{t('notice')}</p>
        {renderFileList()}
        <p>{t('privacy')}</p>
      </div>
    </PopupModal>
  );
};

export default GoogleSyncModal;
