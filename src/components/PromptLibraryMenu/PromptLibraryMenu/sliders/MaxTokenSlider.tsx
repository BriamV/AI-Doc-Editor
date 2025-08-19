import React from 'react';
import { useTranslation } from 'react-i18next';
import { ModelOptions } from '@type/document';
import { modelMaxToken } from '@constants/chat';

interface MaxTokenSliderProps {
  _maxToken: number;
  _setMaxToken: React.Dispatch<React.SetStateAction<number>>;
  _model: ModelOptions;
}

export const MaxTokenSlider = ({ _maxToken, _setMaxToken, _model }: MaxTokenSliderProps) => {
  const { t } = useTranslation('model');

  return (
    <div className="mt-5 pt-5 border-t border-gray-500">
      <label className="block text-sm font-medium text-gray-900 dark:text-white">
        {t('token.label')}: {_maxToken}
      </label>
      <input
        type="range"
        value={_maxToken}
        onChange={e => {
          _setMaxToken(Number(e.target.value));
        }}
        min={0}
        max={_model.includes(':') ? modelMaxToken[_model.split(':')[1]] : modelMaxToken[_model]}
        step={1}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
};
