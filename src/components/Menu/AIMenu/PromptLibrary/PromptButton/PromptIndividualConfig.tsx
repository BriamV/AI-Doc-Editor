import { useEffect, useState } from 'react';
import useStore from '@store/store';
import { ModelOptions } from '@type/document';
import { modelMaxToken } from '@constants/chat';
import { _defaultChatConfig } from '@constants/chat';
import { ModelSelector } from './ModelSelector';
import { MaxTokenSlider } from './sliders/MaxTokenSlider';
import { TemperatureSlider } from './sliders/TemperatureSlider';
import { TopPSlider } from './sliders/TopPSlider';
import { PresencePenaltySlider } from './sliders/PresencePenaltySlider';
import { FrequencyPenaltySlider } from './sliders/FrequencyPenaltySlider';

import type { Prompt } from '@type/document';

interface PromptIndividualConfigProps {
  prompt: Prompt;
  index: number;
}

export const PromptIndividualConfig = ({ prompt, index }: PromptIndividualConfigProps) => {
  const config = prompt.config ?? _defaultChatConfig;
  const [_model, _setModel] = useState<ModelOptions>(config.model);
  const [_maxToken, _setMaxToken] = useState<number>(config.max_completion_tokens);
  const [_temperature, _setTemperature] = useState<number>(config.temperature);
  const [_presencePenalty, _setPresencePenalty] = useState<number>(config.presence_penalty);
  const [_topP, _setTopP] = useState<number>(config.top_p);
  const [_frequencyPenalty, _setFrequencyPenalty] = useState<number>(config.frequency_penalty);
  const prompts = useStore(state => state.prompts);
  const setPrompts = useStore(state => state.setPrompts);

  useEffect(() => {
    const tempPrompts = JSON.parse(JSON.stringify(prompts));
    if (prompt.config) {
      tempPrompts[index].config = {
        ...prompt.config,
        max_completion_tokens: _maxToken,
        model: _model,
        temperature: _temperature,
        top_p: _topP,
        presence_penalty: _presencePenalty,
        frequency_penalty: _frequencyPenalty,
      };
      setPrompts(tempPrompts);
    }
  }, [
    _maxToken,
    _model,
    _temperature,
    _topP,
    _presencePenalty,
    _frequencyPenalty,
    prompt.config,
    prompts,
    index,
    setPrompts,
  ]);

  useEffect(() => {
    if (_model.includes(':')) {
      _setMaxToken(modelMaxToken[_model.split(':')[1]]);
    } else {
      _setMaxToken(modelMaxToken[_model]);
    }
  }, [_model, _setMaxToken]);

  return (
    <div className="mt-4">
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
  );
};

export default PromptIndividualConfig;
