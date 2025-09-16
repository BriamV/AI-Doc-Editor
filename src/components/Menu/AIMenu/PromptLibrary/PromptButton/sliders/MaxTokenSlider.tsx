import { useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (_model.includes(':')) {
      _setMaxToken(modelMaxToken[_model.split(':')[1]]);
    } else {
      _setMaxToken(modelMaxToken[_model]);
    }
  }, [_model, _setMaxToken]);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 dark:text-white">
        {t('token.label')}: {_maxToken}
      </label>
      <input
        type="range"
        ref={inputRef}
        value={_maxToken}
        onChange={e => {
          _setMaxToken(Number(e.target.value));
        }}
        min={0}
        max={_model.includes(':') ? modelMaxToken[_model.split(':')[1]] : modelMaxToken[_model]}
        step={1}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
      <div className="min-w-fit text-gray-500 dark:text-gray-300 text-sm mt-2">
        {t('token.description')}
      </div>
    </div>
  );
};

export default MaxTokenSlider;
