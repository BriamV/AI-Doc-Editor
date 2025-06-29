import { PersistStorage, StorageValue } from 'zustand/middleware';
import useCloudAuthStore from '@store/cloud-auth-store';
import useStore from '@store/store';
import {
  deleteDriveFile,
  getDriveFile,
  updateDriveFileDebounced,
  validateGoogleOath2AccessToken,
} from '@api/google-api';

const createGoogleCloudStorage = <S>(): PersistStorage<S> | undefined => {
  const accessToken = useCloudAuthStore.getState().googleAccessToken;
  const fileId = useCloudAuthStore.getState().fileId;
  if (!accessToken || !fileId) return;

  try {
    const authenticated = validateGoogleOath2AccessToken(accessToken);
    if (!authenticated) return;
  } catch (_e) {
    // prevent error if the storage is not defined (e.g. when server side rendering a page)
    return;
  }
  const persistStorage: PersistStorage<S> = {
    getItem: async (_name: string): Promise<StorageValue<S> | null> => {
      useCloudAuthStore.getState().setSyncStatus('syncing');
      try {
        const accessToken = useCloudAuthStore.getState().googleAccessToken;
        const fileId = useCloudAuthStore.getState().fileId;
        if (!accessToken || !fileId) return null;

        const data: StorageValue<S> = await getDriveFile(fileId, accessToken);
        useCloudAuthStore.getState().setSyncStatus('synced');
        return data;
      } catch (_e: unknown) {
        useCloudAuthStore.getState().setSyncStatus('unauthenticated');
        useStore.getState().setToastMessage((_e as Error).message);
        useStore.getState().setToastShow(true);
        useStore.getState().setToastStatus('error');
        return null;
      }
    },
    setItem: async (_name: string, newValue: StorageValue<S>): Promise<void> => {
      const accessToken = useCloudAuthStore.getState().googleAccessToken;
      const fileId = useCloudAuthStore.getState().fileId;
      if (!accessToken || !fileId) return;

      const blob = new Blob([JSON.stringify(newValue)], {
        type: 'application/json',
      });
      const file = new File([blob], 'better-chatgpt.json', {
        type: 'application/json',
      });

      if (useCloudAuthStore.getState().syncStatus !== 'unauthenticated') {
        useCloudAuthStore.getState().setSyncStatus('syncing');

        await updateDriveFileDebounced(file, fileId, accessToken);
      }
    },

    removeItem: async (_name: string): Promise<void> => {
      const accessToken = useCloudAuthStore.getState().googleAccessToken;
      const fileId = useCloudAuthStore.getState().fileId;
      if (!accessToken || !fileId) return;

      await deleteDriveFile(accessToken, fileId);
    },
  };
  return persistStorage;
};

export default createGoogleCloudStorage;
