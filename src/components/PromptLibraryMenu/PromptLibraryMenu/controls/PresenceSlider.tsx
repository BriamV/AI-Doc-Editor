import React from 'react';
import { useTranslation } from 'react-i18next';

interface PresenceSliderProps {
  _presencePenalty: number;
  _setPresencePenalty: React.Dispatch<React.SetStateAction<number>>;
}

export const PresenceSlider = ({ _presencePenalty, _setPresencePenalty }: PresenceSliderProps) => {
  const { t } = useTranslation('model');

  const handlePresencePenaltyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    _setPresencePenalty(Number(e.target.value));
  };

  return (
    <div className="mt-5 pt-5 border-t border-gray-500">
      <label className="block text-sm font-medium text-gray-900 dark:text-white">
        {t('presencePenalty.label')}: {_presencePenalty}
      </label>
      <input
        id="presence-penalty-range"
        type="range"
        value={_presencePenalty}
        onChange={handlePresencePenaltyChange}
        min={-2}
        max={2}
        step={0.1}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
};

export default PresenceSlider;
