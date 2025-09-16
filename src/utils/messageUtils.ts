import { MessageInterface, ModelOptions, TotalTokenUsed } from '@type/document';

import useStore from '@store/store';

import { Tiktoken } from '@dqbd/tiktoken/lite';
const cl100k_base = await import('@dqbd/tiktoken/encoders/cl100k_base.json');

const encoder = new Tiktoken(
  cl100k_base.bpe_ranks,
  {
    ...cl100k_base.special_tokens,
    '<|im_start|>': 100264,
    '<|im_end|>': 100265,
    '<|im_sep|>': 100266,
  },
  cl100k_base.pat_str
);

// https://github.com/dqbd/tiktoken/issues/23#issuecomment-1483317174
export const getChatGPTEncoding = (messages: MessageInterface[], model: ModelOptions) => {
  const isGpt3 = model === 'gpt-3.5-turbo';

  const msgSep = isGpt3 ? '\n' : '';
  const roleSep = isGpt3 ? '\n' : '<|im_sep|>';

  const serialized = [
    messages
      .map(({ role, content }) => {
        return `<|im_start|>${role}${roleSep}${content}<|im_end|>`;
      })
      .join(msgSep),
    `<|im_start|>assistant${roleSep}`,
  ].join(msgSep);

  return encoder.encode(serialized, 'all');
};

const countTokens = (messages: MessageInterface[], model: ModelOptions) => {
  if (messages.length === 0) return 0;
  return getChatGPTEncoding(messages, model).length;
};

export const limitMessageTokens = (
  messages: MessageInterface[],
  limit: number = 4096,
  model: ModelOptions
): MessageInterface[] => {
  const limitedMessages: MessageInterface[] = [];
  let tokenCount = 0;

  const firstMsg = messages.at(0);
  const isSystemFirstMessage = firstMsg?.role === 'system';
  let retainSystemMessage = false;

  // Check if the first message is a system message and if it fits within the token limit
  if (isSystemFirstMessage && firstMsg) {
    const systemTokenCount = countTokens([firstMsg], model);
    if (systemTokenCount < limit) {
      tokenCount += systemTokenCount;
      retainSystemMessage = true;
    }
  }

  // Iterate through messages in reverse order, adding them to the limitedMessages array
  // until the token limit is reached (excludes first message)
  const reversedBody = messages.slice(1).reverse();
  for (const msg of reversedBody) {
    const count = countTokens([msg], model);
    if (count + tokenCount > limit) break;
    tokenCount += count;
    limitedMessages.unshift({ ...msg });
  }

  // Process first message
  if (retainSystemMessage && firstMsg) {
    // Insert the system message in the third position from the end
    limitedMessages.splice(-3, 0, { ...firstMsg });
  } else if (!isSystemFirstMessage && firstMsg) {
    // Check if the first message (non-system) can fit within the limit
    const firstMessageTokenCount = countTokens([firstMsg], model);
    if (firstMessageTokenCount + tokenCount < limit) {
      limitedMessages.unshift({ ...firstMsg });
    }
  }

  return limitedMessages;
};

export const updateTotalTokenUsed = (
  model: ModelOptions,
  promptMessages: MessageInterface[],
  completionMessage: MessageInterface
) => {
  const setTotalTokenUsed = useStore.getState().setTotalTokenUsed;
  const currentTotals: TotalTokenUsed = JSON.parse(
    JSON.stringify(useStore.getState().totalTokenUsed)
  );

  const newPromptTokens = countTokens(promptMessages, model);
  const newCompletionTokens = countTokens([completionMessage], model);

  const add = (prev?: { promptTokens: number; completionTokens: number }) => ({
    promptTokens: (prev?.promptTokens ?? 0) + newPromptTokens,
    completionTokens: (prev?.completionTokens ?? 0) + newCompletionTokens,
  });

  let nextTotals: TotalTokenUsed = { ...currentTotals };

  switch (model) {
    case 'gpt-3.5-turbo':
      nextTotals['gpt-3.5-turbo'] = add(currentTotals['gpt-3.5-turbo']);
      break;
    case 'gpt-3.5-turbo-16k':
      nextTotals['gpt-3.5-turbo-16k'] = add(currentTotals['gpt-3.5-turbo-16k']);
      break;
    case 'gpt-4':
      nextTotals['gpt-4'] = add(currentTotals['gpt-4']);
      break;
    case 'gpt-4-32k':
      nextTotals['gpt-4-32k'] = add(currentTotals['gpt-4-32k']);
      break;
    case 'gpt-4-turbo':
      nextTotals['gpt-4-turbo'] = add(currentTotals['gpt-4-turbo']);
      break;
    case 'gpt-4o':
      nextTotals['gpt-4o'] = add(currentTotals['gpt-4o']);
      break;
    case 'gpt-4.5-preview':
      nextTotals['gpt-4.5-preview'] = add(currentTotals['gpt-4.5-preview']);
      break;
    case 'o1':
      nextTotals['o1'] = add(currentTotals['o1']);
      break;
    case 'o3-mini':
      nextTotals['o3-mini'] = add(currentTotals['o3-mini']);
      break;
    default:
      // Unknown model: avoid dynamic index to satisfy security/detect-object-injection
      return;
  }

  setTotalTokenUsed(nextTotals);
};

export default countTokens;
