import { useEffect, useState, useCallback } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

import useStore from '@store/store';
import useGStore from '@store/cloud-auth-store';
import { createDriveFile, validateGoogleOath2AccessToken } from '@api/google-api';
import { getFiles, stateToFile } from '@utils/google-api';
import createGoogleCloudStorage from '@store/storage/GoogleCloudStorage';
import { GoogleFileResource } from '@type/google-api';

import { GoogleSyncModal } from './GoogleSyncModal';
import { SyncStatusIcon } from './SyncStatusIcon';

interface GoogleSyncProps {
  clientId: string;
}

// Helper function to create new Google Drive file
const createNewGoogleFile = async (googleAccessToken: string, setFileId: (id: string) => void) => {
  const googleFile = await createDriveFile(stateToFile(), googleAccessToken);
  setFileId(googleFile.id);
};

// Helper function to select appropriate file ID
const selectAppropriateFileId = (
  files: GoogleFileResource[],
  currentFileId: string | null,
  setFileId: (id: string) => void
) => {
  // Check if current file ID exists in the list
  const hasCurrentFile = files.findIndex(f => f.id === currentFileId) !== -1;

  if (hasCurrentFile) {
    setFileId(currentFileId!);
    return;
  }

  // Default to the latest file
  setFileId(files[0].id);
};

// Helper function to setup Google storage
const setupGoogleStorage = () => {
  useStore.persist.setOptions({
    storage: createGoogleCloudStorage(),
  });
  useStore.persist.rehydrate();
};

// Custom hook for Google sync logic
const useGoogleSync = () => {
  const fileId = useGStore(state => state.fileId);
  const setFileId = useGStore(state => state.setFileId);
  const googleAccessToken = useGStore(state => state.googleAccessToken);
  const setSyncStatus = useGStore(state => state.setSyncStatus);
  const [files, setFiles] = useState<GoogleFileResource[]>([]);

  const selectFileId = useCallback(
    async (_files: GoogleFileResource[], _googleAccessToken: string) => {
      if (_files.length === 0) {
        await createNewGoogleFile(_googleAccessToken, setFileId);
        return;
      }
      selectAppropriateFileId(_files, fileId || null, setFileId);
    },
    [fileId, setFileId]
  );

  const initialiseState = useCallback(
    async (_googleAccessToken: string) => {
      const validated = await validateGoogleOath2AccessToken(_googleAccessToken);
      if (!validated) {
        setSyncStatus('unauthenticated');
        return;
      }

      try {
        const _files = await getFiles(_googleAccessToken);
        if (!_files) return;

        setFiles(_files);
        await selectFileId(_files, _googleAccessToken);
        setupGoogleStorage();
      } catch (_e: unknown) {
        // Error handling
      }
    },
    [selectFileId, setFiles, setSyncStatus]
  );

  useEffect(() => {
    if (googleAccessToken) {
      setSyncStatus('syncing');
      initialiseState(googleAccessToken);
    }
  }, [googleAccessToken, initialiseState, setSyncStatus]);

  return { files, setFiles };
};

const GoogleSync = ({ clientId }: GoogleSyncProps) => {
  const syncStatus = useGStore(state => state.syncStatus);
  const cloudSync = useGStore(state => state.cloudSync);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(cloudSync);
  const { files, setFiles } = useGoogleSync();

  const handleModalToggle = () => {
    setIsModalOpen(true);
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div
        className="flex py-2 px-2 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm"
        onClick={handleModalToggle}
      >
        {/* <GoogleIcon /> {t('name')} */}
        {cloudSync && <SyncStatusIcon status={syncStatus} />}
      </div>
      {isModalOpen && (
        <GoogleSyncModal setIsModalOpen={setIsModalOpen} files={files} setFiles={setFiles} />
      )}
    </GoogleOAuthProvider>
  );
};

export default GoogleSync;
