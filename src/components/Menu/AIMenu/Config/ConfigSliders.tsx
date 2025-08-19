import { useRef, useEffect } from 'react';
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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleMaxTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    _setMaxToken(Number(e.target.value));
  };

  const max = modelMaxToken[_model.split(':')[0] as keyof typeof modelMaxToken] ?? 4096;

  useEffect(() => {
    _setMaxToken(max);
  }, [max, _setMaxToken]);

  return (
    <div className="mt-5 pt-5 border-t border-gray-500">
      <label className="block text-sm font-medium text-gray-900 dark:text-white">
        {t('token.label')}: {_maxToken}
      </label>
      <input
        id="default-range"
        type="range"
        ref={inputRef}
        value={_maxToken}
        onChange={handleMaxTokenChange}
        min={0}
        max={max}
        step={1}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
      <div className="min-w-fit text-gray-500 dark:text-gray-300 text-sm mt-2">
        {t('token.description')}
      </div>
    </div>
  );
};

interface TemperatureSliderProps {
  _temperature: number;
  _setTemperature: React.Dispatch<React.SetStateAction<number>>;
}

export const TemperatureSlider = ({ _temperature, _setTemperature }: TemperatureSliderProps) => {
  const { t } = useTranslation('model');

  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    _setTemperature(Number(e.target.value));
  };

  return (
    <div className="mt-5 pt-5 border-t border-gray-500">
      <label className="block text-sm font-medium text-gray-900 dark:text-white">
        {t('temperature.label')}: {_temperature}
      </label>
      <input
        id="default-range"
        type="range"
        value={_temperature}
        onChange={handleTemperatureChange}
        min={0}
        max={2}
        step={0.1}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
      <div className="min-w-fit text-gray-500 dark:text-gray-300 text-sm mt-2">
        {t('temperature.description')}
      </div>
    </div>
  );
};

interface TopPSliderProps {
  _topP: number;
  _setTopP: React.Dispatch<React.SetStateAction<number>>;
}

export const TopPSlider = ({ _topP, _setTopP }: TopPSliderProps) => {
  const { t } = useTranslation('model');

  const handleTopPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    _setTopP(Number(e.target.value));
  };

  return (
    <div className="mt-5 pt-5 border-t border-gray-500">
      <label className="block text-sm font-medium text-gray-900 dark:text-white">
        {t('topP.label')}: {_topP}
      </label>
      <input
        id="default-range"
        type="range"
        value={_topP}
        onChange={handleTopPChange}
        min={0}
        max={1}
        step={0.05}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
      <div className="min-w-fit text-gray-500 dark:text-gray-300 text-sm mt-2">
        {t('topP.description')}
      </div>
    </div>
  );
};

interface PresencePenaltySliderProps {
  _presencePenalty: number;
  _setPresencePenalty: React.Dispatch<React.SetStateAction<number>>;
}

export const PresencePenaltySlider = ({
  _presencePenalty,
  _setPresencePenalty,
}: PresencePenaltySliderProps) => {
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
        id="default-range"
        type="range"
        value={_presencePenalty}
        onChange={handlePresencePenaltyChange}
        min={-2}
        max={2}
        step={0.1}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
      <div className="min-w-fit text-gray-500 dark:text-gray-300 text-sm mt-2">
        {t('presencePenalty.description')}
      </div>
    </div>
  );
};

interface FrequencyPenaltySliderProps {
  _frequencyPenalty: number;
  _setFrequencyPenalty: React.Dispatch<React.SetStateAction<number>>;
}

export const FrequencyPenaltySlider = ({
  _frequencyPenalty,
  _setFrequencyPenalty,
}: FrequencyPenaltySliderProps) => {
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
        id="default-range"
        type="range"
        value={_frequencyPenalty}
        onChange={handleFrequencyPenaltyChange}
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
