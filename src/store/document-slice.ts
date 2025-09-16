import { StoreSlice } from './store';
import {
  DocumentInterface,
  FolderCollection,
  DocumentCurrent,
  EditorSettings,
} from '@type/document';

export interface DocumentSlice {
  documentCurrent: DocumentCurrent;
  chats?: DocumentInterface[];
  currentChatIndex: number;
  forceEditorRefresh: boolean;
  generating: boolean;
  error: string;
  folders: FolderCollection;
  editorSettings: EditorSettings;
  currentSelection: string;
  editorState: string;
  setEditorState: (editorState: string) => void;
  setChats: (chats: DocumentInterface[]) => void;
  setCurrentChatIndex: (currentChatIndex: number) => void;
  setForceEditorRefresh: (editorRefresh: boolean) => void;
  setGenerating: (generating: boolean) => void;
  setError: (error: string) => void;
  setFolders: (folders: FolderCollection) => void;
  setEditorSettings: (editorSettings: EditorSettings) => void;
  setCurrentSelection: (currentSelection: string) => void;
}

// Default document configuration
const getDefaultDocumentCurrent = (): DocumentCurrent => ({
  id: '',
  folder: '',
  title: '',
  messages: [],
  config: {
    model: 'gpt-4',
    max_completion_tokens: 150,
    temperature: 0.9,
    presence_penalty: 0.6,
    top_p: 1,
    frequency_penalty: 0.5,
  },
  titleSet: false,
  notes: [],
  favorited: false,
  date: '',
  messageIndex: null,
  edited: false,
});

// Default editor settings
const getDefaultEditorSettings = (): EditorSettings => ({
  includeSelection: true,
  activeMenu: 'chat',
});

// Create setter function factory
const createSetter =
  <T extends keyof DocumentSlice>(
    key: T,
    set: (fn: (state: DocumentSlice) => DocumentSlice) => void
  ) =>
  (value: DocumentSlice[T]) => {
    set((prev: DocumentSlice) => ({
      ...prev,
      [key]: value,
    }));
  };

export const createDocumentSlice: StoreSlice<DocumentSlice> = (set, _get) => ({
  documentCurrent: getDefaultDocumentCurrent(),
  currentChatIndex: -1,
  forceEditorRefresh: false,
  generating: false,
  error: '',
  folders: {},
  editorState: '',
  currentSelection: '',
  editorSettings: getDefaultEditorSettings(),
  setDocumentCurrent: createSetter('documentCurrent', set),
  setCurrentSelection: createSetter('currentSelection', set),
  setEditorSettings: createSetter('editorSettings', set),
  setChats: createSetter('chats', set),
  setCurrentChatIndex: createSetter('currentChatIndex', set),
  setForceEditorRefresh: createSetter('forceEditorRefresh', set),
  setGenerating: createSetter('generating', set),
  setError: createSetter('error', set),
  setFolders: createSetter('folders', set),
  setEditorState: createSetter('editorState', set),
});
