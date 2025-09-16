import React, { useEffect, useState, useRef } from 'react';
import useStore from '@store/store';
import { useTranslation } from 'react-i18next';
import { ModelOptions } from '@type/document';
import { modelMaxToken, modelOptions } from '@constants/chat';
import { PromptDropdownItem } from '@type/prompt';

const ConfigMenu = () => {
  const config = useStore(state => state.defaultChatConfig);
  const setConfig = useStore(state => state.setDefaultChatConfig);
  const [_maxToken, _setMaxToken] = useState<number>(config.max_completion_tokens);
  const [_model, _setModel] = useState<ModelOptions>(config.model);
  const [_temperature, _setTemperature] = useState<number>(config.temperature);
  const [_presencePenalty, _setPresencePenalty] = useState<number>(config.presence_penalty);
  const [_topP, _setTopP] = useState<number>(config.top_p);
  const [_frequencyPenalty, _setFrequencyPenalty] = useState<number>(config.frequency_penalty);

  useEffect(() => {
    setConfig({
      max_completion_tokens: _maxToken,
      model: _model,
      temperature: _temperature,
      presence_penalty: _presencePenalty,
      top_p: _topP,
      frequency_penalty: _frequencyPenalty,
    });
  }, [_maxToken, _model, _temperature, _presencePenalty, _topP, _frequencyPenalty, setConfig]);

  return (
    <div className="h-full overflow-scroll">
      <div className="text-gray-200 text-sm py-2 px-3 border border-white/10 mb-2">
        <div className="border border-transparent">Global Chat Config</div>
      </div>

      <div className="p-2">
        <ModelSelector _model={_model} _setModel={_setModel} />
        <MaxTokenSlider _maxToken={_maxToken} _setMaxToken={_setMaxToken} _model={_model} />
        <TemperatureSlider _temperature={_temperature} _setTemperature={_setTemperature} />
        <TopPSlider _topP={_topP} _setTopP={_setTopP} />
        <PresencePenaltySlider
          _presencePenalty={_presencePenalty}
          _setPresencePenalty={_setPresencePenalty}
        />
        <FrequencyPenaltySlider
          _frequencyPenalty={_frequencyPenalty}
          _setFrequencyPenalty={_setFrequencyPenalty}
        />
      </div>
    </div>
  );
};

export const ModelSelector = ({
  _model,
  _setModel,
}: {
  _model: ModelOptions;
  _setModel: React.Dispatch<React.SetStateAction<ModelOptions>>;
}) => {
  const [dropDown, setDropDown] = useState<boolean>(false);
  const fineTuneModels = useStore(state => state.fineTuneModels);

  const [defaultAndFindTuneModels, setDefaultAndFineTuneModels] = useState<PromptDropdownItem[]>(
    []
  );

  useEffect(() => {
    let tempModels = modelOptions.map(model => ({ name: model, model: model }));

    if (fineTuneModels) {
      tempModels = [...tempModels, ...fineTuneModels];
    }
    setDefaultAndFineTuneModels(tempModels);
  }, [fineTuneModels]);

  const getModelName = (modelValue: string) => {
    const modelObj = defaultAndFindTuneModels.find(m => m.model === modelValue);
    return modelObj ? modelObj.name : modelValue;
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Model:</label>
      <button
        className="btn btn-neutral btn-small flex gap-1"
        type="button"
        onClick={() => setDropDown(prev => !prev)}
      >
        {getModelName(_model)}
      </button>
      <div
        id="dropdown"
        className={`${dropDown ? '' : 'hidden'}
        absolute z-10 bg-white rounded-lg shadow w-44 dark:bg-gray-700 mt-1`}
      >
        <ul className="py-2 text-sm text-gray-700 dark:text-gray-200">
          {defaultAndFindTuneModels.map(model => (
            <li key={model.name}>
              <a
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white cursor-pointer"
                onClick={() => {
                  _setModel(model.model as ModelOptions);
                  setDropDown(false);
                }}
              >
                {model.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export const MaxTokenSlider = ({
  _maxToken,
  _setMaxToken,
  _model,
}: {
  _maxToken: number;
  _setMaxToken: React.Dispatch<React.SetStateAction<number>>;
  _model: ModelOptions;
}) => {
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

export const TemperatureSlider = ({
  _temperature,
  _setTemperature,
}: {
  _temperature: number;
  _setTemperature: React.Dispatch<React.SetStateAction<number>>;
}) => {
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

export const TopPSlider = ({
  _topP,
  _setTopP,
}: {
  _topP: number;
  _setTopP: React.Dispatch<React.SetStateAction<number>>;
}) => {
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

export const PresencePenaltySlider = ({
  _presencePenalty,
  _setPresencePenalty,
}: {
  _presencePenalty: number;
  _setPresencePenalty: React.Dispatch<React.SetStateAction<number>>;
}) => {
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

export const FrequencyPenaltySlider = ({
  _frequencyPenalty,
  _setFrequencyPenalty,
}: {
  _frequencyPenalty: number;
  _setFrequencyPenalty: React.Dispatch<React.SetStateAction<number>>;
}) => {
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

export default ConfigMenu;
