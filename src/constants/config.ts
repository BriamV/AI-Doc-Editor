import { FineTuneModel } from '@type/config';

export const generateDefaultFineTuneModel = (): FineTuneModel => {
  return {
    name: 'Default',
    model: 'ft:gpt-3.5-turbo:my-org:custom_suffix:id',
  };
};
