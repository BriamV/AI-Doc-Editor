/**
 * Chat API Wrapper
 * Dual-mode: Uses backend proxy when authenticated, falls back to direct OpenAI calls
 * This provides backward compatibility while enabling secure backend storage
 */

import { ConfigInterface, MessageInterface } from '@type/document';
import { getChatCompletion, getChatCompletionStream } from '@api/api';
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
 * Check if user is authenticated and has backend available
 */
const shouldUseBackend = (): { useBackend: boolean; token?: string } => {
  const state = useStore.getState();
  const isAuthenticated = state.isAuthenticated;
  const token = state.accessToken;

  return {
    useBackend: isAuthenticated && !!token,
    token: token,
  };
};

/**
 * Get chat completion (non-streaming)
 * Routes through backend if authenticated, otherwise uses direct API call
 */
export const getChatCompletionWrapper = async (params: ChatCompletionParams): Promise<unknown> => {
  const { useBackend, token } = shouldUseBackend();

  if (useBackend && token) {
    // Use backend proxy
    try {
      return await chatAPI.sendChatCompletion(token, params.messages, params.config);
    } catch (error) {
      console.warn('Backend proxy failed, falling back to direct API call:', error);
      // Fallback to direct API call
      return await getChatCompletion(params);
    }
  }

  // Use direct API call (legacy mode)
  return await getChatCompletion(params);
};

/**
 * Get chat completion stream (streaming)
 * Routes through backend if authenticated, otherwise uses direct API call
 */
export const getChatCompletionStreamWrapper = async (
  params: ChatCompletionParams
): Promise<ReadableStream | null> => {
  const { useBackend, token } = shouldUseBackend();

  if (useBackend && token) {
    // Use backend proxy
    try {
      return await chatAPI.sendChatCompletionStream(token, params.messages, params.config);
    } catch (error) {
      console.warn('Backend proxy failed, falling back to direct API call:', error);
      // Fallback to direct API call
      return await getChatCompletionStream(params);
    }
  }

  // Use direct API call (legacy mode)
  return await getChatCompletionStream(params);
};
