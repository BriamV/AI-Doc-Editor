import useStore from '@store/store';
import { parseEventSource } from '@api/helper';

interface StreamProcessorResult {
  processStream: (
    stream: ReadableStream,
    onContentUpdate: (content: string) => void
  ) => Promise<void>;
}

/**
 * Custom hook for processing streaming chat completion responses
 * Reduces complexity by centralizing stream processing logic
 */
const useStreamProcessor = (): StreamProcessorResult => {
  const processStream = async (
    stream: ReadableStream,
    onContentUpdate: (content: string) => void
  ): Promise<void> => {
    if (stream.locked) {
      throw new Error('Oops, the stream is locked right now. Please try again');
    }

    const reader = stream.getReader();
    let reading = true;
    let partial = '';

    try {
      while (reading && useStore.getState().generating) {
        const { done, value } = await reader.read();
        const result = parseEventSource(partial + new TextDecoder().decode(value));
        partial = '';

        if (result === '[DONE]' || done) {
          reading = false;
        } else {
          const resultString = result.reduce((output: string, curr) => {
            if (typeof curr === 'string') {
              partial += curr;
            } else {
              const content = curr.choices[0].delta.content;
              if (content) output += content;
            }
            return output;
          }, '');

          if (resultString) {
            onContentUpdate(resultString);
          }
        }
      }
    } finally {
      // Cleanup stream resources
      if (useStore.getState().generating) {
        reader.cancel('Cancelled by user');
      } else {
        reader.cancel('Generation completed');
      }
      reader.releaseLock();
      stream.cancel();
    }
  };

  return { processStream };
};

export default useStreamProcessor;
