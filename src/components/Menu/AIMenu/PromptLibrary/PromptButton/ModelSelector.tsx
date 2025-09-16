import { useEffect, useState } from 'react';
import useStore from '@store/store';
import { ModelOptions } from '@type/document';
import { ChevronDown } from '@carbon/icons-react';
import { modelOptions } from '@constants/chat';
import { FineTuneModel } from '@type/config';

interface ModelSelectorProps {
  _model: ModelOptions;
  _setModel: React.Dispatch<React.SetStateAction<ModelOptions>>;
}

export const ModelSelector = ({ _model, _setModel }: ModelSelectorProps) => {
  const [dropDown, setDropDown] = useState<boolean>(false);
  const fineTuneModels = useStore(state => state.fineTuneModels);

  const [defaultAndFindTuneModels, setDefaultAndFineTuneModels] = useState<FineTuneModel[]>([]);

  useEffect(() => {
    let tempModels = modelOptions.map(model => ({ name: model, model }));

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
      <button
        className="btn btn-neutral btn-small flex gap-1"
        type="button"
        onClick={() => setDropDown(prev => !prev)}
      >
        {getModelName(_model)}
        <ChevronDown />
      </button>
      <div
        id="dropdown"
        className={`${
          dropDown ? '' : 'hidden'
        } absolute top-100 bottom-100 z-10 bg-white rounded-lg shadow-xl border-b border-black/10 dark:border-gray-900/50 text-gray-800 dark:text-gray-100 group dark:bg-gray-800 opacity-90`}
      >
        <ul
          className="text-sm text-gray-700 dark:text-gray-200 p-0 m-0"
          aria-labelledby="dropdownDefaultButton"
        >
          {defaultAndFindTuneModels.map((model, index) => (
            <li
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white cursor-pointer"
              onClick={() => {
                _setModel(model.model);
                setDropDown(false);
              }}
              key={index}
            >
              {model.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ModelSelector;
