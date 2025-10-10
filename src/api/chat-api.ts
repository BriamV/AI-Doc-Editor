/**
 * Chat API client
 * Backend proxy for OpenAI chat completions
 * Uses backend-stored API keys instead of frontend storage
 */

import { getEnvVar } from '@utils/env';
import { ConfigInterface, MessageInterface } from '@type/document';

const API_BASE_URL = getEnvVar('VITE_API_BASE_URL') || 'http://localhost:8000/api';

export interface ChatCompletionRequest {
  messages: MessageInterface[];
  model?: string;
  stream?: boolean;
  temperature?: number;
  max_completion_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class ChatAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/chat`;
  }

  /**
   * Send chat completion request (non-streaming)
   * Backend retrieves the API key from secure storage
   */
  async sendChatCompletion(
    token: string,
    messages: MessageInterface[],
    config: ConfigInterface
  ): Promise<ChatCompletionResponse> {
    const requestBody: ChatCompletionRequest = {
      messages,
      model: config.model || 'gpt-4o-mini',
      stream: false,
      temperature: config.temperature,
      max_completion_tokens: config.max_completion_tokens,
      top_p: config.top_p,
      frequency_penalty: config.frequency_penalty,
      presence_penalty: config.presence_penalty,
    };

    const response = await fetch(`${this.baseURL}/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (response.status === 402) {
      throw new Error('Please configure your OpenAI API key in the API menu');
    }

    if (response.status === 401) {
      throw new Error('Session expired. Please log in again');
    }

    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later');
    }

    if (response.status === 400) {
      const error = await response.json();
      throw new Error(error.detail || 'Invalid request. Please check your API key configuration');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Chat request failed');
    }

    return response.json();
  }

  /**
   * Send chat completion request (streaming)
   * Returns a ReadableStream for Server-Sent Events (SSE)
   */
  async sendChatCompletionStream(
    token: string,
    messages: MessageInterface[],
    config: ConfigInterface
  ): Promise<ReadableStream<Uint8Array>> {
    const requestBody: ChatCompletionRequest = {
      messages,
      model: config.model || 'gpt-4o-mini',
      stream: true,
      temperature: config.temperature,
      max_completion_tokens: config.max_completion_tokens,
      top_p: config.top_p,
      frequency_penalty: config.frequency_penalty,
      presence_penalty: config.presence_penalty,
    };

    const response = await fetch(`${this.baseURL}/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (response.status === 402) {
      throw new Error('Please configure your OpenAI API key in the API menu');
    }

    if (response.status === 401) {
      throw new Error('Session expired. Please log in again');
    }

    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later');
    }

    if (response.status === 400) {
      const error = await response.json();
      throw new Error(error.detail || 'Invalid request. Please check your API key configuration');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Chat request failed');
    }

    if (!response.body) {
      throw new Error('Response body is not available for streaming');
    }

    return response.body;
  }
}

export const chatAPI = new ChatAPI();
