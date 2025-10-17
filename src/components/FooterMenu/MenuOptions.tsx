import useStore from '@store/store';
import Api from './Api/Api';
import AboutMenu from '@components/FooterMenu/AboutMenu';
import ImportExportChat from '@components/FooterMenu/ImportExportChat';
import SettingsMenu from '@components/FooterMenu/SettingsMenu/SettingsMenu';
import CollapseOptions from './CollapseOptions';
import GoogleSync from '@components/GoogleSync';
import { TotalTokenCostDisplay } from '@components/FooterMenu/SettingsMenu/TotalTokenCost';
import AdminSettingsLink from './AdminSettingsLink';
import { DocumentMultiple_01 } from '@carbon/icons-react';
import { Link } from 'react-router-dom';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || undefined;

const MenuOptions = () => {
  const hideMenuOptions = useStore(state => state.hideMenuOptions);
  const countTotalTokens = useStore(state => state.countTotalTokens);
  return (
    <>
      <CollapseOptions />
      <div
        className={`${
          hideMenuOptions ? 'max-h-0' : 'max-h-full'
        } overflow-hidden transition-all pb-2`}
      >
        {countTotalTokens && <TotalTokenCostDisplay />}
        {googleClientId && <GoogleSync clientId={googleClientId} />}

        {/* Document Library - Available to all authenticated users */}
        <Link
          to="/documents"
          className="flex py-2 px-2 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-sm text-white"
        >
          <DocumentMultiple_01 className="w-4 h-4" />
          Document Library
        </Link>

        <AboutMenu />
        <ImportExportChat />
        <Api />
        <SettingsMenu />
        <AdminSettingsLink />
      </div>
    </>
  );
};

export default MenuOptions;
