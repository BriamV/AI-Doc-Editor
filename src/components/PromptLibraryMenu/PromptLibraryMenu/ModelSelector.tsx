import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '@store/store';
import { ModelOptions } from '@type/document';
import { ChevronDown as DownChevronArrow } from '@carbon/icons-react';
import { modelOptions } from '@constants/chat';
import { FineTuneModel } from '@type/config';

interface ModelSelectorProps {
  _model: ModelOptions;
  _setModel: React.Dispatch<React.SetStateAction<ModelOptions>>;
}

export const ModelSelector = ({ _model, _setModel }: ModelSelectorProps) => {
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
