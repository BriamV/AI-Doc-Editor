import { v4 as uuidv4 } from 'uuid';

import {
  DocumentInterface,
  ConfigInterface,
  FolderCollection,
  MessageInterface,
  Folder,
} from '@type/document';
import { roles } from '@type/document';
import { defaultModel, modelOptions, _defaultChatConfig } from '@constants/chat';
import { ExportV1 } from '@type/export';

export const validateAndFixChats = (chats: unknown): chats is DocumentInterface[] => {
  if (!Array.isArray(chats)) return false;

  for (const chat of chats) {
    if (!(typeof chat.id === 'string')) chat.id = uuidv4();
    if (!(typeof chat.title === 'string') || chat.title === '') return false;

    if (chat.titleSet === undefined) chat.titleSet = false;
    if (!(typeof chat.titleSet === 'boolean')) return false;

    if (!validateMessage(chat.messageCurrent.messages)) return false;
    if (!validateAndFixChatConfig(chat.config)) return false;
  }

  return true;
};

const validateMessage = (messages: MessageInterface[]) => {
  if (!Array.isArray(messages)) return false;
  for (const message of messages) {
    if (!(typeof message.content === 'string')) return false;
    if (!(typeof message.role === 'string')) return false;
    if (!roles.includes(message.role)) return false;
  }
  return true;
};

const validateAndFixChatConfig = (config: ConfigInterface) => {
  if (config === undefined) config = _defaultChatConfig;
  if (!(typeof config === 'object')) return false;

  if (config.temperature === undefined) config.temperature = _defaultChatConfig.temperature;
  if (!(typeof config.temperature === 'number')) return false;

  if (config.presence_penalty === undefined)
    config.presence_penalty = _defaultChatConfig.presence_penalty;
  if (!(typeof config.presence_penalty === 'number')) return false;

  if (config.top_p === undefined) config.top_p = _defaultChatConfig.top_p;
  if (!(typeof config.top_p === 'number')) return false;

  if (config.frequency_penalty === undefined)
    config.frequency_penalty = _defaultChatConfig.frequency_penalty;
  if (!(typeof config.frequency_penalty === 'number')) return false;

  if (!config.model) config.model = defaultModel;
  if (!modelOptions.includes(config.model)) return false;

  return true;
};

export const isLegacyImport = (importedData: unknown) => {
  if (Array.isArray(importedData)) return true;
  return false;
};

export const validateFolders = (folders: FolderCollection): folders is FolderCollection => {
  if (typeof folders !== 'object' || folders === null) return false;

  const entries = Object.entries(folders as Record<string, Folder>);
  for (const [, folder] of entries) {
    if (!folder || typeof folder !== 'object') return false;
    if (typeof folder.id !== 'string') return false;
    if (typeof folder.name !== 'string') return false;
    if (typeof folder.order !== 'number') return false;
    if (typeof folder.expanded !== 'boolean') return false;
  }

  return true;
};

export const validateExportV1 = (data: ExportV1): data is ExportV1 => {
  return validateAndFixChats(data.chats) && validateFolders(data.folders);
};
