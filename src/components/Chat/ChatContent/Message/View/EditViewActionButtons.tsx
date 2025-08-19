import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

interface EditViewActionButtonsProps {
  sticky?: boolean;
  generating: boolean;
  handleSaveAndSubmit: () => void;
  handleSave: () => void;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsEdit: React.Dispatch<React.SetStateAction<boolean>>;
}

const EditViewActionButtons = memo(
  ({
    sticky = false,
    generating,
    handleSaveAndSubmit,
    handleSave,
    setIsModalOpen,
    setIsEdit,
  }: EditViewActionButtonsProps) => {
    const { t } = useTranslation();

    return (
      <div className="flex">
        <div className="flex-1 text-center mt-4 flex justify-center">
          {sticky && (
            <button
              className={`btn relative mr-2 btn-neutral ${
                generating ? 'cursor-not-allowed opacity-40' : ''
              }`}
              onClick={handleSaveAndSubmit}
            >
              <div className="flex items-center justify-center gap-2">{t('saveAndSubmit')}</div>
            </button>
          )}

          <button
            className={`btn relative mr-2 ${
              sticky
                ? `btn-neutral ${generating ? 'cursor-not-allowed opacity-40' : ''}`
                : 'btn-neutral'
            }`}
            onClick={handleSave}
          >
            <div className="flex items-center justify-center gap-2">{t('save')}</div>
          </button>

          {sticky || (
            <button
              className="btn relative mr-2 btn-neutral"
              onClick={() => {
                if (!generating) setIsModalOpen(true);
              }}
            >
              <div className="flex items-center justify-center gap-2">{t('saveAndSubmit')}</div>
            </button>
          )}

          {sticky || (
            <button className="btn relative btn-neutral" onClick={() => setIsEdit(false)}>
              <div className="flex items-center justify-center gap-2">{t('cancel')}</div>
            </button>
          )}
        </div>
      </div>
    );
  }
);

EditViewActionButtons.displayName = 'EditViewActionButtons';

export default EditViewActionButtons;
