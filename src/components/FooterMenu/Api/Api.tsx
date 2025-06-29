import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Password } from '@carbon/icons-react';
import ApiMenu from '@components/FooterMenu/Api/ApiMenu';

const Config = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  return (
    <>
      <a
        className="flex mb-1 py-2 px-2 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm"
        id="api-menu"
        onClick={() => setIsModalOpen(true)}
      >
        <Password />
        {t('api')}
      </a>
      {isModalOpen && <ApiMenu setIsModalOpen={setIsModalOpen} />}
    </>
  );
};

export default Config;
