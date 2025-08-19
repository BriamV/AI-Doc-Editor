import React from 'react';
import { useTranslation } from 'react-i18next';

interface FrequencySliderProps {
  _frequencyPenalty: number;
  _setFrequencyPenalty: React.Dispatch<React.SetStateAction<number>>;
}

export const FrequencySlider = ({
  _frequencyPenalty,
  _setFrequencyPenalty,
}: FrequencySliderProps) => {
  const { t } = useTranslation('model');

  const handleFrequencyPenaltyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    _setFrequencyPenalty(Number(e.target.value));
  };

  return (
    <div className="mt-5 pt-5 border-t border-gray-500">
      <label className="block text-sm font-medium text-gray-900 dark:text-white">
        {t('frequencyPenalty.label')}: {_frequencyPenalty}
      </label>
      <input
        id="frequency-penalty-range"
        type="range"
        value={_frequencyPenalty}
        onChange={handleFrequencyPenaltyChange}
        min={-2}
        max={2}
        step={0.1}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
};

export default FrequencySlider;
