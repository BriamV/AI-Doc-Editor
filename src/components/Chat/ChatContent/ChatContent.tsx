import React, { useEffect, useRef } from 'react';
import AutoScrollContainer from '@components/AutoScrollContainer/AutoScrollContainer';
import useStore from '@store/store';
import ScrollToBottomButton from './ScrollToBottomButton';
import Message from './Message';
import NewMessageButton from './Message/NewMessageButton';
import { Close } from '@carbon/icons-react';
import useSubmit from '@hooks/useSubmit';

const ChatContent = () => {
  const inputRole = useStore(state => state.inputRole);
  const setError = useStore(state => state.setError);
  const messages = useStore(
    state => state.chats?.[state.currentChatIndex]?.messageCurrent?.messages ?? []
  );
  const stickyIndex = useStore(
    state => state.chats?.[state.currentChatIndex]?.messageCurrent?.messages.length ?? 0
  );
  const advancedMode = useStore(state => state.advancedMode);
  const generating = useStore(state => state.generating);
  const aiPadding = useStore(state => state.aiPadding);

  const saveRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  // clear error at the start of generating new messages
  useEffect(() => {
    if (generating) {
      setError('');
    }
  }, [generating, setError]);

  const { error } = useSubmit();

  // in a useeffect, adjust the padding of the message container

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.style.paddingBottom = `${aiPadding}px`;
    }
  }, [aiPadding]);

  return (
    <div className="flex-1 overflow-hidden" ref={messageContainerRef}>
      <AutoScrollContainer className="h-full dark:bg-gray-900">
        <ScrollToBottomButton />
        <div className="flex flex-col items-center text-sm dark:bg-gray-800">
          <div className="flex flex-col items-center text-sm dark:bg-gray-800 w-full" ref={saveRef}>
            {/* {advancedMode && <ChatTitle />} */}
            {!generating && advancedMode && messages?.length === 0 && (
              <NewMessageButton messageIndex={-1} />
            )}
            {messages?.map((message, index) => (
              <React.Fragment key={index}>
                <Message role={message.role} content={message.content} messageIndex={index} />
                {!generating && advancedMode && <NewMessageButton messageIndex={index} />}
              </React.Fragment>
            ))}
          </div>

          <Message role={inputRole} content="" messageIndex={stickyIndex} sticky />
          {error !== '' && (
            <div className="relative py-2 px-3 w-3/5 my-3 max-md:w-11/12 border border-red-500 bg-red-500/10">
              <div className="text-gray-600 dark:text-gray-100 text-sm whitespace-pre-wrap">
                {error}
              </div>
              <div
                className="text-white absolute top-1 right-1 cursor-pointer"
                onClick={() => {
                  setError('');
                }}
              >
                <Close />
              </div>
            </div>
          )}
        </div>
      </AutoScrollContainer>
    </div>
  );
};

export default ChatContent;
