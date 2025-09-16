import { useState } from 'react';
import { Checkmark as TickIcon } from '@carbon/icons-react';
import { Edit as EditIcon } from '@carbon/icons-react';
import { Close as CrossIcon } from '@carbon/icons-react';
import { TrashCan as DeleteIcon } from '@carbon/icons-react';

import useStore from '@store/store';
import useGStore from '@store/cloud-auth-store';
import { deleteDriveFile, updateDriveFileName } from '@api/google-api';
import { getFiles } from '@utils/google-api';
import { GoogleFileResource } from '@type/google-api';

interface FileSelectorComponentProps {
  name: string;
  id: string;
  _fileId: string;
  _setFileId: React.Dispatch<React.SetStateAction<string>>;
  setFiles: React.Dispatch<React.SetStateAction<GoogleFileResource[]>>;
}

export const FileSelectorComponent = ({
  name,
  id,
  _fileId,
  _setFileId,
  setFiles,
}: FileSelectorComponentProps) => {
  const syncStatus = useGStore(state => state.syncStatus);
  const setSyncStatus = useGStore(state => state.setSyncStatus);

  const setToastStatus = useStore(state => state.setToastStatus);
  const setToastMessage = useStore(state => state.setToastMessage);
  const setToastShow = useStore(state => state.setToastShow);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [_name, _setName] = useState<string>(name);

  const syncing = syncStatus === 'syncing';

  const updateFileName = async () => {
    if (syncing) return;
    setIsEditing(false);
    const accessToken = useGStore.getState().googleAccessToken;
    if (!accessToken) return;

    try {
      setSyncStatus('syncing');
      const newFileName = _name.endsWith('.json') ? _name : _name + '.json';
      await updateDriveFileName(newFileName, id, accessToken);
      const _files = await getFiles(accessToken);
      if (_files) setFiles(_files);
      setSyncStatus('synced');
    } catch (e: unknown) {
      setSyncStatus('unauthenticated');
      setToastMessage((e as Error).message);
      setToastShow(true);
      setToastStatus('error');
    }
  };

  const deleteFile = async () => {
    if (syncing) return;
    setIsDeleting(false);
    const accessToken = useGStore.getState().googleAccessToken;
    if (!accessToken) return;

    try {
      setSyncStatus('syncing');
      await deleteDriveFile(id, accessToken);
      const _files = await getFiles(accessToken);
      if (_files) setFiles(_files);
      setSyncStatus('synced');
    } catch (e: unknown) {
      setSyncStatus('unauthenticated');
      setToastMessage((e as Error).message);
      setToastShow(true);
      setToastStatus('error');
    }
  };

  const handleRadioChange = () => {
    if (!syncing) _setFileId(id);
  };

  const handleConfirmAction = () => {
    if (isEditing) updateFileName();
    if (isDeleting) deleteFile();
  };

  const handleCancelAction = () => {
    if (!syncing) {
      setIsEditing(false);
      setIsDeleting(false);
    }
  };

  const handleEditClick = () => {
    if (!syncing) setIsEditing(true);
  };

  const handleDeleteClick = () => {
    if (!syncing) setIsDeleting(true);
  };

  const renderFileNameInput = () => (
    <input
      type="text"
      className="text-gray-800 dark:text-white p-3 text-sm border-none bg-gray-200 dark:bg-gray-600 rounded-md m-0 w-full mr-0 h-8 focus:outline-none"
      value={_name}
      onChange={e => _setName(e.target.value)}
    />
  );

  const renderFileName = () => (
    <>
      {name} <div className="text-[10px] md:text-xs">{`<${id}>`}</div>
    </>
  );

  const renderActionButtons = () => {
    if (isEditing || isDeleting) {
      return (
        <div className="flex gap-1">
          <div
            className={`${syncing ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={handleConfirmAction}
          >
            <TickIcon />
          </div>
          <div
            className={`${syncing ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={handleCancelAction}
          >
            <CrossIcon />
          </div>
        </div>
      );
    }

    return (
      <div className="flex gap-1">
        <div
          className={`${syncing ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          onClick={handleEditClick}
        >
          <EditIcon />
        </div>
        <div
          className={`${syncing ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          onClick={handleDeleteClick}
        >
          <DeleteIcon />
        </div>
      </div>
    );
  };

  return (
    <label
      className={`w-full flex items-center justify-between mb-2 gap-2 text-sm font-medium text-gray-900 dark:text-gray-300 ${
        syncing ? 'cursor-not-allowed opacity-40' : ''
      }`}
    >
      <input
        type="radio"
        checked={_fileId === id}
        className="w-4 h-4"
        onChange={handleRadioChange}
        disabled={syncing}
      />
      <div className="flex-1 text-left">{isEditing ? renderFileNameInput() : renderFileName()}</div>
      {renderActionButtons()}
    </label>
  );
};

export default FileSelectorComponent;
