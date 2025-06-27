import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '@store/store';
import Toggle from '@components/Toggle';

const InlineLatexToggle = () => {
  const { t } = useTranslation();

  const setInlineLatex = useStore(state => state.setInlineLatex);
  const inlineLatex = useStore(state => state.inlineLatex);

  const [isChecked, setIsChecked] = useState<boolean>(inlineLatex);

  useEffect(() => {
    setInlineLatex(isChecked);
  }, [isChecked, setInlineLatex]);

  return (
    <Toggle label={t('inlineLatex') as string} isChecked={isChecked} setIsChecked={setIsChecked} />
  );
};

export default InlineLatexToggle;
