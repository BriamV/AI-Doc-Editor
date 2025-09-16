import { useEffect, useState } from 'react';
import useStore from '@store/store';
import { ModelOptions } from '@type/document';
import { modelOptions } from '@constants/chat';
import { PromptDropdownItem } from '@type/prompt';

interface ModelSelectorProps {
  _model: ModelOptions;
  _setModel: React.Dispatch<React.SetStateAction<ModelOptions>>;
}

export const ModelSelector = ({ _model, _setModel }: ModelSelectorProps) => {
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

export default ModelSelector;
