/**
 * Chat API Wrapper
 * Authentication-only mode: Always routes through backend proxy
 * Requires user authentication - no localStorage fallback
 */

import { ConfigInterface, MessageInterface } from '@type/document';
import { chatAPI } from '@api/chat-api';
import useStore from '@store/store';

interface ChatCompletionParams {
  endpoint: string;
  messages: MessageInterface[];
  config: ConfigInterface;
  apiKey?: string;
  customHeaders?: Record<string, string>;
}

/**
 * Get authentication token from store
 */
const getAuthToken = (): string => {
  const state = useStore.getState();
  const isAuthenticated = state.isAuthenticated;
  const token = state.accessToken;

  if (!isAuthenticated || !token) {
    throw new Error('Authentication required. Please log in to use chat features.');
  }

  return token;
};

/**
 * Get chat completion (non-streaming)
 * Always uses backend proxy - authentication required
 */
export const getChatCompletionWrapper = async (params: ChatCompletionParams): Promise<unknown> => {
  const token = getAuthToken();

  try {
    return await chatAPI.sendChatCompletion(token, params.messages, params.config);
  } catch (error) {
    // Check for authentication errors
    if (
      error instanceof Error &&
      (error.message.includes('401') || error.message.includes('402'))
    ) {
      throw new Error('Your session has expired. Please log in again.');
    }
    throw error;
  }
};

/**
 * Get chat completion stream (streaming)
 * Always uses backend proxy - authentication required
 */
export const getChatCompletionStreamWrapper = async (
  params: ChatCompletionParams
): Promise<ReadableStream | null> => {
  const token = getAuthToken();

  try {
    return await chatAPI.sendChatCompletionStream(token, params.messages, params.config);
  } catch (error) {
    // Check for authentication errors
    if (
      error instanceof Error &&
      (error.message.includes('401') || error.message.includes('402'))
    ) {
      throw new Error('Your session has expired. Please log in again.');
    }
    throw error;
  }
};
