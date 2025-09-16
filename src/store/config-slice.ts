import { StoreSlice } from './store';
import { StoreApi } from 'zustand';
import { Theme } from '@type/theme';
import { ConfigInterface, TotalTokenUsed } from '@type/document';
import { _defaultChatConfig, _defaultSystemMessage } from '@constants/chat';
import { FineTuneModel } from '@type/config';

export interface ConfigSlice {
  openConfig: boolean;
  theme: Theme;
  autoTitle: boolean;
  hideMenuOptions: boolean;
  advancedMode: boolean;
  defaultChatConfig: ConfigInterface;
  defaultSystemMessage: string;
  activeMenu: string;
  hideSideMenu: boolean;
  hideSideAIMenu: boolean;
  enterToSubmit: boolean;
  inlineLatex: boolean;
  markdownMode: boolean;
  countTotalTokens: boolean;
  totalTokenUsed: TotalTokenUsed;
  aiPadding: number;
  fineTuneModels: FineTuneModel[];
  setOpenConfig: (openConfig: boolean) => void;
  setTheme: (theme: Theme) => void;
  setAutoTitle: (autoTitle: boolean) => void;
  setAdvancedMode: (advancedMode: boolean) => void;
  setDefaultChatConfig: (defaultChatConfig: ConfigInterface) => void;
  setDefaultSystemMessage: (defaultSystemMessage: string) => void;
  setActiveMenu: (activeMenu: string) => void;
  setHideMenuOptions: (hideMenuOptions: boolean) => void;
  setHideSideAIMenu: (hideSideAIMenu: boolean) => void;
  setHideSideMenu: (hideSideMenu: boolean) => void;
  setEnterToSubmit: (enterToSubmit: boolean) => void;
  setInlineLatex: (inlineLatex: boolean) => void;
  setMarkdownMode: (markdownMode: boolean) => void;
  setCountTotalTokens: (countTotalTokens: boolean) => void;
  setTotalTokenUsed: (totalTokenUsed: TotalTokenUsed) => void;
  setAIPadding: (aiPadding: number) => void;
  setFineTuneModels: (fineTuneModels: FineTuneModel[]) => void;
}

// Helper function to create setter functions
const createSetter =
  <T>(key: keyof ConfigSlice, set: StoreApi<ConfigSlice>['setState']) =>
  (value: T) => {
    set((prev: ConfigSlice) => ({
      ...prev,
      [key]: value,
    }));
  };

// Helper function to create the initial state
const createInitialState = (): Omit<ConfigSlice, keyof ConfigSliceActions> => ({
  openConfig: false,
  theme: 'dark',
  activeMenu: 'chat',
  hideMenuOptions: false,
  hideSideMenu: false,
  hideSideAIMenu: false,
  autoTitle: false,
  enterToSubmit: true,
  advancedMode: false,
  defaultChatConfig: _defaultChatConfig,
  defaultSystemMessage: _defaultSystemMessage,
  inlineLatex: false,
  markdownMode: true,
  countTotalTokens: false,
  totalTokenUsed: {},
  fineTuneModels: [],
  aiPadding: 0,
});

// Helper function to create all setter actions
const createActions = (set: StoreApi<ConfigSlice>['setState']): ConfigSliceActions => ({
  setAIPadding: createSetter<number>('aiPadding', set),
  setOpenConfig: createSetter<boolean>('openConfig', set),
  setFineTuneModels: createSetter<FineTuneModel[]>('fineTuneModels', set),
  setTheme: createSetter<Theme>('theme', set),
  setAutoTitle: createSetter<boolean>('autoTitle', set),
  setAdvancedMode: createSetter<boolean>('advancedMode', set),
  setDefaultChatConfig: createSetter<ConfigInterface>('defaultChatConfig', set),
  setDefaultSystemMessage: createSetter<string>('defaultSystemMessage', set),
  setActiveMenu: createSetter<string>('activeMenu', set),
  setHideMenuOptions: createSetter<boolean>('hideMenuOptions', set),
  setHideSideAIMenu: createSetter<boolean>('hideSideAIMenu', set),
  setHideSideMenu: createSetter<boolean>('hideSideMenu', set),
  setEnterToSubmit: createSetter<boolean>('enterToSubmit', set),
  setInlineLatex: createSetter<boolean>('inlineLatex', set),
  setMarkdownMode: createSetter<boolean>('markdownMode', set),
  setCountTotalTokens: createSetter<boolean>('countTotalTokens', set),
  setTotalTokenUsed: createSetter<TotalTokenUsed>('totalTokenUsed', set),
});

// Type for actions only
type ConfigSliceActions = Pick<
  ConfigSlice,
  | 'setAIPadding'
  | 'setOpenConfig'
  | 'setFineTuneModels'
  | 'setTheme'
  | 'setAutoTitle'
  | 'setAdvancedMode'
  | 'setDefaultChatConfig'
  | 'setDefaultSystemMessage'
  | 'setActiveMenu'
  | 'setHideMenuOptions'
  | 'setHideSideAIMenu'
  | 'setHideSideMenu'
  | 'setEnterToSubmit'
  | 'setInlineLatex'
  | 'setMarkdownMode'
  | 'setCountTotalTokens'
  | 'setTotalTokenUsed'
>;

export const createConfigSlice: StoreSlice<ConfigSlice> = (set, _get) => ({
  ...createInitialState(),
  ...createActions(set),
});
