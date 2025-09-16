import { useEffect, useState } from 'react';
import useStore from '@store/store';
import { ModelOptions } from '@type/document';
import { ModelSelector } from './ModelSelector';
import {
  MaxTokenSlider,
  TemperatureSlider,
  TopPSlider,
  PresencePenaltySlider,
  FrequencyPenaltySlider,
} from './ConfigSliders';

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

export default ConfigMenu;
