import React, { DetailedHTMLProps, HTMLAttributes, memo, useState } from 'react';

import ReactMarkdown from 'react-markdown';
import { CodeProps, ReactMarkdownProps } from 'react-markdown/lib/ast-to-react';

import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import useStore from '@store/store';

import { Checkmark, Close } from '@carbon/icons-react';

import useSubmit from '@hooks/useSubmit';

import { DocumentInterface, Role } from '@type/document';

import { codeLanguageSubset } from '@constants/chat';

import RefreshButton from './Button/RefreshButton';
import UpButton from './Button/UpButton';
import DownButton from './Button/DownButton';
import CopyButton from './Button/CopyButton';
import EditButton from './Button/EditButton';
import DeleteButton from './Button/DeleteButton';

import CodeBlock from '../CodeBlock';

const ContentView = memo(
  ({
    role,
    content,
    setIsEdit,
    messageIndex,
  }: {
    role: Role;
    content: string;
    setIsEdit: React.Dispatch<React.SetStateAction<boolean>>;
    messageIndex: number;
  }) => {
    const { handleSubmit } = useSubmit();

    const [isDelete, setIsDelete] = useState<boolean>(false);

    const setChats = useStore(state => state.setChats);
    const chats = useStore(state => state.chats);
    const generating = useStore(state => state.generating);
    const currentChatIndex = useStore(state => state.currentChatIndex);
    const lastMessageIndex = useStore(state => {
      const messages = state.chats?.[state.currentChatIndex]?.messageCurrent?.messages;
      return messages ? messages.length - 1 : 0;
    });
    const inlineLatex = useStore(state => state.inlineLatex);
    const markdownMode = useStore(state => state.markdownMode);

    const handleDelete = () => {
      if (!chats) return;
      const updatedChats: DocumentInterface[] = JSON.parse(JSON.stringify(chats));
      updatedChats[currentChatIndex].messageCurrent.messages.splice(messageIndex, 1);
      setChats(updatedChats);
    };

    const handleMove = (direction: 'up' | 'down') => {
      if (!chats) return;
      const updatedChats: DocumentInterface[] = JSON.parse(JSON.stringify(chats));
      const updatedMessages = updatedChats[currentChatIndex].messageCurrent.messages;
      const temp = updatedMessages[messageIndex];
      if (direction === 'up') {
        updatedMessages[messageIndex] = updatedMessages[messageIndex - 1];
        updatedMessages[messageIndex - 1] = temp;
      } else {
        updatedMessages[messageIndex] = updatedMessages[messageIndex + 1];
        updatedMessages[messageIndex + 1] = temp;
      }
      setChats(updatedChats);
    };

    const handleMoveUp = () => {
      handleMove('up');
    };

    const handleMoveDown = () => {
      handleMove('down');
    };

    const handleRefresh = () => {
      if (!chats) return;
      const updatedChats: DocumentInterface[] = JSON.parse(JSON.stringify(chats));
      const updatedMessages = updatedChats[currentChatIndex].messageCurrent.messages;
      updatedMessages.splice(updatedMessages.length - 1, 1);
      setChats(updatedChats);
      handleSubmit();
    };

    const handleCopy = () => {
      navigator.clipboard.writeText(content);
    };

    return (
      <>
        <div className="markdown prose w-full md:max-w-full break-words dark:prose-invert dark share-gpt-message">
          {markdownMode ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm, [remarkMath, { singleDollarTextMath: inlineLatex }]]}
              rehypePlugins={[
                rehypeKatex,
                [
                  rehypeHighlight,
                  {
                    detect: true,
                    ignoreMissing: true,
                    subset: codeLanguageSubset,
                  },
                ],
              ]}
              linkTarget="_new"
              components={{
                code,
                p,
              }}
            >
              {content}
            </ReactMarkdown>
          ) : (
            <span className="whitespace-pre-wrap">{content}</span>
          )}
        </div>
        <div className="flex justify-end gap-2 w-full mt-2">
          {isDelete || (
            <>
              {!generating && role === 'assistant' && messageIndex === lastMessageIndex && (
                <RefreshButton onClick={handleRefresh} />
              )}
              {messageIndex !== 0 && <UpButton onClick={handleMoveUp} />}
              {messageIndex !== lastMessageIndex && <DownButton onClick={handleMoveDown} />}

              <CopyButton onClick={handleCopy} />
              <EditButton setIsEdit={setIsEdit} />
              <DeleteButton setIsDelete={setIsDelete} />
            </>
          )}
          {isDelete && (
            <>
              <button className="p-1 hover:text-white" onClick={() => setIsDelete(false)}>
                <Close />
              </button>
              <button className="p-1 hover:text-white" onClick={handleDelete}>
                <Checkmark />
              </button>
            </>
          )}
        </div>
      </>
    );
  }
);
ContentView.displayName = 'ContentView';

const code = memo((props: CodeProps) => {
  const { inline, className, children } = props;
  const match = /language-(\w+)/.exec(className || '');
  const lang = match && match[1];

  if (inline) {
    return <code className={className}>{children}</code>;
  } else {
    return <CodeBlock lang={lang || 'text'} codeChildren={children} />;
  }
});
code.displayName = 'Code';

const p = memo(
  (
    props?: Omit<
      DetailedHTMLProps<HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>,
      'ref'
    > &
      ReactMarkdownProps
  ) => {
    return <p className="whitespace-pre-wrap text-sm">{props?.children}</p>;
  }
);
p.displayName = 'Paragraph';

export default ContentView;
