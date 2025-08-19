import React from 'react';
import { useTranslation } from 'react-i18next';
import { ModelOptions } from '@type/document';
import { modelMaxToken } from '@constants/chat';

interface TokenSliderProps {
  _maxToken: number;
  _setMaxToken: React.Dispatch<React.SetStateAction<number>>;
  _model: ModelOptions;
}

export const TokenSlider = ({ _maxToken, _setMaxToken, _model }: TokenSliderProps) => {
  const { t } = useTranslation('model');

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    _setMaxToken(Number(e.target.value));
  };

  const getMaxTokens = () => {
    return _model.includes(':') ? modelMaxToken[_model.split(':')[1]] : modelMaxToken[_model];
  };

  return (
    <div className="mt-5 pt-5 border-t border-gray-500">
      <label className="block text-sm font-medium text-gray-900 dark:text-white">
        {t('token.label')}: {_maxToken}
      </label>
      <input
        type="range"
        value={_maxToken}
        onChange={handleTokenChange}
        min={0}
        max={getMaxTokens()}
        step={1}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
};

export default TokenSlider;
