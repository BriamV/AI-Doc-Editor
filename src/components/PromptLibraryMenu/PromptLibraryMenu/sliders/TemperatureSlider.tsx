import React from 'react';
import { useTranslation } from 'react-i18next';

interface TemperatureSliderProps {
  _temperature: number;
  _setTemperature: React.Dispatch<React.SetStateAction<number>>;
}

export const TemperatureSlider = ({ _temperature, _setTemperature }: TemperatureSliderProps) => {
  const { t } = useTranslation('model');

  return (
    <div className="mt-5 pt-5 border-t border-gray-500">
      <label className="block text-sm font-medium text-gray-900 dark:text-white">
        {t('temperature.label')}: {_temperature}
      </label>
      <input
        id="default-range"
        type="range"
        value={_temperature}
        onChange={e => {
          _setTemperature(Number(e.target.value));
        }}
        min={0}
        max={2}
        step={0.1}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
};
