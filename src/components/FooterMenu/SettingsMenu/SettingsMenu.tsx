import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '@store/store';

import PopupModal from '@components/PopupModal';
import { Settings } from '@carbon/icons-react';

import PromptLibraryMenu from '@components/PromptLibraryMenu';
import Config from '@components/FooterMenu/SettingsMenu/Config';
import ClearConversation from '@components/FooterMenu/ClearConversation';
import FineTuneMenu from '@components/FooterMenu/SettingsMenu/FineTuneMenu/FineTuneMenu';

const SettingsMenu = () => {
  const { t } = useTranslation();

  const theme = useStore.getState().theme;
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);
  return (
    <>
      <a
        className="flex mb-1 py-2 px-2 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm"
        onClick={() => {
          setIsModalOpen(true);
        }}
      >
        <Settings className="w-4 h-4" /> {t('setting') as string}
      </a>
      {isModalOpen && (
        <PopupModal
          setIsModalOpen={setIsModalOpen}
          title={t('setting') as string}
          cancelButton={false}
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-600 flex flex-col items-center gap-4">
            {/* <LanguageSelector />
            <ThemeSwitcher /> */}
            <div className="flex flex-col gap-3">
              {/* <AutoTitleToggle />
              <EnterToSubmitToggle />
              <InlineLatexToggle />
              <AdvancedModeToggle />
              <TotalTokenCostToggle /> */}
            </div>
            <ClearConversation />
            <PromptLibraryMenu />
            <Config />
            <FineTuneMenu />
            {/* <TotalTokenCost /> */}
          </div>
        </PopupModal>
      )}
    </>
  );
};

export default SettingsMenu;
