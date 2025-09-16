import { useTranslation } from 'react-i18next';

interface FrequencyPenaltySliderProps {
  _frequencyPenalty: number;
  _setFrequencyPenalty: React.Dispatch<React.SetStateAction<number>>;
}

export const FrequencyPenaltySlider = ({
  _frequencyPenalty,
  _setFrequencyPenalty,
}: FrequencyPenaltySliderProps) => {
  const { t } = useTranslation('model');

  return (
    <div className="mt-5 pt-5 border-t border-gray-500">
      <label className="block text-sm font-medium text-gray-900 dark:text-white">
        {t('frequencyPenalty.label')}: {_frequencyPenalty}
      </label>
      <input
        id="default-range"
        type="range"
        value={_frequencyPenalty}
        onChange={e => {
          _setFrequencyPenalty(Number(e.target.value));
        }}
        min={-2}
        max={2}
        step={0.1}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
      <div className="min-w-fit text-gray-500 dark:text-gray-300 text-sm mt-2">
        {t('frequencyPenalty.description')}
      </div>
    </div>
  );
};

export default FrequencyPenaltySlider;
