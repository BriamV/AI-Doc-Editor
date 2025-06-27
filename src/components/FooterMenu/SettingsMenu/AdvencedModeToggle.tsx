import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '@store/store';
import Toggle from '@components/Toggle';

const AdvancedModeToggle = () => {
  const { t } = useTranslation();

  const setAdvancedMode = useStore(state => state.setAdvancedMode);
  const advancedMode = useStore(state => state.advancedMode);

  const [isChecked, setIsChecked] = useState<boolean>(advancedMode);

  useEffect(() => {
    setAdvancedMode(isChecked);
  }, [isChecked, setAdvancedMode]);

  return (
    <Toggle label={t('advancedMode') as string} isChecked={isChecked} setIsChecked={setIsChecked} />
  );
};

export default AdvancedModeToggle;
