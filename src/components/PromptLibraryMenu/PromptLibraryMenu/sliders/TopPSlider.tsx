import React from 'react';
import { useTranslation } from 'react-i18next';

interface TopPSliderProps {
  _topP: number;
  _setTopP: React.Dispatch<React.SetStateAction<number>>;
}

export const TopPSlider = ({ _topP, _setTopP }: TopPSliderProps) => {
  const { t } = useTranslation('model');

  return (
    <div className="mt-5 pt-5 border-t border-gray-500">
      <label className="block text-sm font-medium text-gray-900 dark:text-white">
        {t('topP.label')}: {_topP}
      </label>
      <input
        id="default-range"
        type="range"
        value={_topP}
        onChange={e => {
          _setTopP(Number(e.target.value));
        }}
        min={0}
        max={1}
        step={0.05}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
};
