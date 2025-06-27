import React, { useCallback, useEffect, useState } from 'react';
import useStore from '@store/store';
import { useTranslation } from 'react-i18next';
import { Prompt } from '@type/prompt';
import PopupModal from '@components/PopupModal';
import { ModelOptions } from '@type/document';
import { ChevronDown as DownChevronArrow } from '@carbon/icons-react';
import { modelMaxToken, modelOptions } from '@constants/chat';
import { Settings } from '@carbon/icons-react';
import { _defaultChatConfig } from '@constants/chat';

import { FineTuneModel } from '@type/config';

export const PromptConfig = ({
  prompt,
  index,
  _updatePrompt,
  _prompts,
  _setPrompts,
}: {
  prompt: Prompt;
  index: number;
  _updatePrompt: (index: number, prompt: Prompt) => void;
  _prompts: Prompt[];
  _setPrompts: React.Dispatch<React.SetStateAction<Prompt[]>>;
}) => {
  const [isPromptConfigModalOpen, setIsPromptConfigModalOpen] = useState<boolean>(false);

  return (
    <>
      <div onClick={() => setIsPromptConfigModalOpen(true)}>
        <Settings />
      </div>
      {isPromptConfigModalOpen ? (
        <PromptPopup
          setIsModalOpen={setIsPromptConfigModalOpen}
          prompt={prompt}
          index={index}
          _prompts={_prompts}
          _setPrompts={_setPrompts}
          _updatePrompt={_updatePrompt}
        />
      ) : (
        <></>
      )}
    </>
  );
};

const PromptPopup = ({
  setIsModalOpen,
  prompt,
  index,
  _updatePrompt,
  _prompts,
  _setPrompts,
}: {
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  prompt: Prompt;
  index: number;
  _updatePrompt: (index: number, prompt: Prompt) => void;
  _prompts: Prompt[];
  _setPrompts: React.Dispatch<React.SetStateAction<Prompt[]>>;
}) => {
  const prompts = useStore(state => state.prompts);
  const setPrompts = useStore(state => state.setPrompts);
  const [_name, _setName] = useState<string>(prompt.name);
  const [_prompt, _setPrompt] = useState<string>(prompt.prompt);
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [isSelectionChecked, setIsSelectionChecked] = useState<boolean>(prompt.includeSelection);

  const updateChecked = useCallback(() => {
    if (_prompts[index].config == null) {
      setIsChecked(true);
    } else {
      setIsChecked(false);
    }
  }, [_prompts, index]);

  useEffect(() => {
    updateChecked();
  }, [prompts, prompt.config, updateChecked]);

  function handleIndividualPromptConfig() {
    if (prompt.config == null) {
      let tempPrompts = _prompts;
      let tempPromptConfig = _defaultChatConfig;
      tempPrompts[index].config = tempPromptConfig;
      _setPrompts(tempPrompts);
      setPrompts(tempPrompts);
      updateChecked();
    } else {
      // set to null
      let tempPrompts = _prompts;
      tempPrompts[index].config = null;
      _setPrompts(tempPrompts);
      setPrompts(tempPrompts);
      updateChecked();
    }
  }

  const handleOnFocus = (e: React.FocusEvent<HTMLTextAreaElement, Element>) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
    e.target.style.maxHeight = `${e.target.scrollHeight}px`;
  };

  const handleOnBlur = (e: React.FocusEvent<HTMLTextAreaElement, Element>) => {
    e.target.style.height = 'auto';
    e.target.style.maxHeight = '2.5rem';
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
    e.target.style.maxHeight = `${e.target.scrollHeight}px`;
  };

  function handleSelectionChecked() {
    setIsSelectionChecked(!isSelectionChecked);
    let tempPrompts = prompts;
    tempPrompts[index].includeSelection = !isSelectionChecked;
    setPrompts(tempPrompts);
  }

  return (
    <PopupModal title={'Prompt Config'} setIsModalOpen={setIsModalOpen} fullWidth={true}>
      <div className="p-6 border-b border-gray-200 dark:border-gray-600 w-full">
        <div className="flex mb-4 flex-col">
          <div className="mb-2">
            <span className="text-white">Name:</span>
            <textarea
              className="m-0 resize-none rounded-lg bg-gray-800 mt-2 p-2 text-gray-400 overflow-y-hidden leading-7 p-1 focus:ring-1 focus:ring-blue w-full max-h-10 transition-all"
              onFocus={handleOnFocus}
              onBlur={handleOnBlur}
              onChange={e => {
                let tempPrompts = _prompts;
                _setName(e.target.value);
                tempPrompts[index].name = e.target.value;
                setPrompts(tempPrompts);
                _setPrompts(tempPrompts);
                _updatePrompt(index, prompt);
              }}
              onInput={handleInput}
              value={_name}
              rows={1}
              maxLength={32}
            ></textarea>
          </div>

          <div className="mb-2">
            <span className="text-white">Prompt:</span>
            <textarea
              className="m-0 resize-none rounded-lg bg-gray-800 mt-2 p-2 text-gray-400 overflow-y-hidden leading-7 p-1 focus:ring-1 focus:ring-blue w-full max-h-10 transition-all"
              onFocus={handleOnFocus}
              onBlur={handleOnBlur}
              onChange={e => {
                let tempPrompts = _prompts;
                _setPrompt(e.target.value);
                tempPrompts[index].prompt = e.target.value;
                setPrompts(tempPrompts);
                _setPrompts(tempPrompts);
                _updatePrompt(index, prompt);
              }}
              onInput={handleInput}
              value={_prompt}
              rows={1}
            ></textarea>
          </div>
          <div className="flex items-center mb-2 mt-2">
            <div className="text-gray-800 dark:text-gray-100 flex">
              Automatically include selection
            </div>
            <input
              type="checkbox"
              className="w-4 h-4 border border-gray-300 rounded-md checked:bg-blue-600 checked:border-transparent focus:outline-none ml-4"
              checked={isSelectionChecked}
              onChange={handleSelectionChecked}
            />
          </div>
          <div className="flex items-center mb-2">
            <div className="text-gray-800 dark:text-gray-100">Use global chat config</div>
            <input
              type="checkbox"
              className="w-4 h-4 border border-gray-300 rounded-md checked:bg-blue-600 checked:border-transparent focus:outline-none ml-4"
              checked={isChecked}
              onChange={handleIndividualPromptConfig}
            />
          </div>
        </div>
        {prompt.config == null ? <></> : <PromptIndividualConfig prompt={prompt} index={index} />}
      </div>
    </PopupModal>
  );
};

export const PromptIndividualConfig = ({ prompt, index }: { prompt: Prompt; index: number }) => {
  const config = prompt.config ?? _defaultChatConfig;
  const [_model, _setModel] = useState<string>(config.model);
  const [_maxToken, _setMaxToken] = useState<number>(config.max_completion_tokens);
  const [_temperature, _setTemperature] = useState<number>(config.temperature);
  const [_topP, _setTopP] = useState<number>(config.top_p);
  const [_presencePenalty, _setPresencePenalty] = useState<number>(config.presence_penalty);
  const [_frequencyPenalty, _setFrequencyPenalty] = useState<number>(config.frequency_penalty);
  const prompts = useStore(state => state.prompts);
  const setPrompts = useStore(state => state.setPrompts);

  useEffect(() => {
    if (_model.includes('gpt-4') && _maxToken > 4096) {
      _setMaxToken(4096);
    }
  }, [_model, _maxToken]);

  useEffect(() => {
    if (prompts && index >= 0) {
      const tempPrompts = [...prompts];
      tempPrompts[index].config = {
        model: _model,
        max_completion_tokens: _maxToken,
        temperature: _temperature,
        top_p: _topP,
        presence_penalty: _presencePenalty,
        frequency_penalty: _frequencyPenalty,
      };
      setPrompts(tempPrompts);
    }
  }, [
    _model,
    _maxToken,
    _temperature,
    _topP,
    _presencePenalty,
    _frequencyPenalty,
    index,
    prompts,
    setPrompts,
  ]);

  return (
    <>
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
    </>
  );
};

export const ModelSelector = ({
  _model,
  _setModel,
}: {
  _model: ModelOptions;
  _setModel: React.Dispatch<React.SetStateAction<ModelOptions>>;
}) => {
  const { t } = useTranslation('model');
  const [dropDown, setDropDown] = useState<boolean>(false);
  const fineTuneModels = useStore(state => state.fineTuneModels);
  const [defaultAndFindTuneModels, setDefaultAndFineTuneModels] = useState<FineTuneModel[]>([]);

  useEffect(() => {
    const tempModels: FineTuneModel[] = modelOptions.map(model => ({
      name: model,
      model,
    }));
    if (fineTuneModels) {
      setDefaultAndFineTuneModels([...tempModels, ...fineTuneModels]);
    } else {
      setDefaultAndFineTuneModels(tempModels);
    }
  }, [fineTuneModels]);

  const getModelName = (modelValue: ModelOptions) => {
    const modelObj = defaultAndFindTuneModels.find((m: FineTuneModel) => m.model === modelValue);
    return modelObj ? modelObj.name : modelValue;
  };

  return (
    <div className="mt-5 pt-5 border-t border-gray-500">
      <label className="block text-sm font-medium text-gray-900 dark:text-white">
        {t('model.label')}
      </label>
      <div className="relative">
        <button
          className="btn btn-neutral w-full flex justify-between items-center"
          onClick={() => {
            setDropDown(prev => !prev);
          }}
        >
          {getModelName(_model)}
          <DownChevronArrow />
        </button>
        {dropDown && (
          <div className="absolute top-full z-10 w-full bg-gray-700 rounded-md max-h-60 overflow-y-auto">
            {defaultAndFindTuneModels.map((model, index) => (
              <div
                key={index}
                className="p-2 hover:bg-gray-600 cursor-pointer"
                onClick={() => {
                  _setModel(model.model);
                  setDropDown(false);
                }}
              >
                {model.name}
              </div>
            ))}
          </div>
        )}
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

export const TemperatureSlider = ({
  _temperature,
  _setTemperature,
}: {
  _temperature: number;
  _setTemperature: React.Dispatch<React.SetStateAction<number>>;
}) => {
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

export const TopPSlider = ({
  _topP,
  _setTopP,
}: {
  _topP: number;
  _setTopP: React.Dispatch<React.SetStateAction<number>>;
}) => {
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

export const PresencePenaltySlider = ({
  _presencePenalty,
  _setPresencePenalty,
}: {
  _presencePenalty: number;
  _setPresencePenalty: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const { t } = useTranslation('model');

  return (
    <div className="mt-5 pt-5 border-t border-gray-500">
      <label className="block text-sm font-medium text-gray-900 dark:text-white">
        {t('presencePenalty.label')}: {_presencePenalty}
      </label>
      <input
        id="default-range"
        type="range"
        value={_presencePenalty}
        onChange={e => {
          _setPresencePenalty(Number(e.target.value));
        }}
        min={-2}
        max={2}
        step={0.1}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
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
    </div>
  );
};

export default PromptConfig;
