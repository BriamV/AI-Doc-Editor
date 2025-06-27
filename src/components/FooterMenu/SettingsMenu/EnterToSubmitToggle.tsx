import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '@store/store';
import Toggle from '@components/Toggle';

const EnterToSubmitToggle = () => {
  const { t } = useTranslation();

  const setEnterToSubmit = useStore(state => state.setEnterToSubmit);
  const enterToSubmit = useStore(state => state.enterToSubmit);

  const [isChecked, setIsChecked] = useState<boolean>(enterToSubmit);

  useEffect(() => {
    setEnterToSubmit(isChecked);
  }, [isChecked, setEnterToSubmit]);

  return (
    <Toggle
      label={t('enterToSubmit') as string}
      isChecked={isChecked}
      setIsChecked={setIsChecked}
    />
  );
};

export default EnterToSubmitToggle;
